#!/usr/bin/env python3
"""Reliable Feishu event -> Codex CLI bridge using only the Python stdlib."""

from __future__ import annotations

import argparse
import json
import logging
import os
import signal
import sqlite3
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path
from typing import Any

STOP = threading.Event()
CURRENT_CONSUMER: subprocess.Popen[str] | None = None


def load_config(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    required = ("target_chat_ids", "allowed_sender_ids", "workspace", "lark_cli", "codex_cli")
    missing = [key for key in required if not data.get(key)]
    if missing:
        raise ValueError(f"配置缺少必填字段: {', '.join(missing)}")
    for key in ("workspace", "lark_cli", "codex_cli"):
        value = Path(data[key]).expanduser()
        if not value.is_absolute():
            raise ValueError(f"{key} 必须是绝对路径")
        if not value.exists():
            raise ValueError(f"{key} 不存在: {value}")
        data[key] = str(value.resolve())
    if data.get("ack_mode", "reaction") not in ("reaction", "none"):
        raise ValueError("ack_mode 仅支持 reaction 或 none")
    return data


class State:
    def __init__(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path)
        self.db.execute(
            "CREATE TABLE IF NOT EXISTS events "
            "(event_id TEXT PRIMARY KEY, message_id TEXT, status TEXT, updated_at INTEGER)"
        )
        self.db.commit()

    def claim(self, event_id: str, message_id: str) -> bool:
        try:
            self.db.execute(
                "INSERT INTO events VALUES (?, ?, 'running', ?)",
                (event_id, message_id, int(time.time())),
            )
            self.db.commit()
            return True
        except sqlite3.IntegrityError:
            return False

    def finish(self, event_id: str, status: str) -> None:
        self.db.execute(
            "UPDATE events SET status = ?, updated_at = ? WHERE event_id = ?",
            (status, int(time.time()), event_id),
        )
        self.db.commit()


def run_cli(args: list[str], timeout: int = 30) -> subprocess.CompletedProcess[str]:
    logging.debug("运行 CLI: %s", " ".join(args[:3]))
    return subprocess.run(args, text=True, capture_output=True, timeout=timeout, check=False)


def add_ack(cfg: dict[str, Any], message_id: str) -> None:
    if cfg.get("ack_mode", "reaction") != "reaction":
        return
    payload = json.dumps(
        {"reaction_type": {"emoji_type": cfg.get("ack_reaction_emoji_type", "OnIt")}},
        ensure_ascii=False,
    )
    result = run_cli(
        [
            cfg["lark_cli"], "im", "reactions", "create", "--as", "bot",
            "--message-id", message_id, "--data", payload,
        ]
    )
    if result.returncode:
        logging.warning("添加受理表情失败: %s", result.stderr.strip() or result.stdout.strip())


def reply(cfg: dict[str, Any], message_id: str, event_id: str, text: str) -> bool:
    clean = text.strip() or "任务已结束，但 Codex 没有返回可展示的结论。"
    result = run_cli(
        [
            cfg["lark_cli"], "im", "+messages-reply", "--as", "bot",
            "--message-id", message_id, "--text", clean,
            "--idempotency-key", f"codex-bridge-{event_id}"[:64],
        ]
    )
    if result.returncode:
        logging.error("回复原消息失败: %s", result.stderr.strip() or result.stdout.strip())
        return False
    return True


def execute_codex(cfg: dict[str, Any], content: str, event: dict[str, Any]) -> tuple[str, str]:
    prefix = cfg.get("prompt_prefix", "")
    prompt = (
        f"{prefix}\n\n飞书请求：\n{content}\n\n"
        f"来源元数据：chat_id={event['chat_id']} sender_id={event['sender_id']} "
        f"message_id={event['message_id']}"
    )
    fd, output_path = tempfile.mkstemp(prefix="codex-bridge-", suffix=".txt")
    os.close(fd)
    cmd = [
        cfg["codex_cli"], "exec", "--skip-git-repo-check",
        "-C", cfg["workspace"], "-s", cfg.get("codex_sandbox", "workspace-write"),
        "--color", "never", "-o", output_path, prompt,
    ]
    timeout = int(cfg.get("codex_timeout_seconds", 1800))
    proc = subprocess.Popen(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    try:
        stream, _ = proc.communicate(timeout=timeout)
        logging.info("Codex 退出码=%s\n%s", proc.returncode, (stream or "")[-8000:])
        final = Path(output_path).read_text(encoding="utf-8").strip()
        if proc.returncode == 0:
            return "success", final
        return "failed", final or f"Codex 执行失败（退出码 {proc.returncode}）。"
    except subprocess.TimeoutExpired:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        return "timeout", f"任务执行超过 {timeout} 秒，已停止。请缩小任务范围后重试。"
    finally:
        Path(output_path).unlink(missing_ok=True)


def handle_event(cfg: dict[str, Any], state: State, event: dict[str, Any]) -> None:
    chat_id = str(event.get("chat_id", ""))
    sender_id = str(event.get("sender_id", ""))
    message_id = str(event.get("message_id") or event.get("id") or "")
    event_id = str(event.get("event_id") or message_id)
    content = str(event.get("content", "")).strip()
    if chat_id not in set(cfg["target_chat_ids"]):
        logging.info("忽略非授权会话: %s", chat_id)
        return
    if sender_id not in set(cfg["allowed_sender_ids"]):
        logging.warning("忽略非授权发送者: %s", sender_id)
        return
    if not all((message_id, event_id, content)):
        logging.warning("忽略字段不完整事件: %s", event)
        return
    if not state.claim(event_id, message_id):
        logging.info("忽略重复事件: %s", event_id)
        return
    add_ack(cfg, message_id)
    try:
        status, result = execute_codex(cfg, content, event)
    except Exception as exc:
        logging.exception("Codex 调度异常")
        status, result = "failed", f"桥接器调用 Codex 时发生异常：{type(exc).__name__}: {exc}"
    replied = reply(cfg, message_id, event_id, result)
    state.finish(event_id, status if replied else f"{status}_reply_failed")


def log_stderr(stream: Any) -> None:
    for line in stream:
        logging.info("[lark-event] %s", line.rstrip())


def consume(cfg: dict[str, Any], state: State) -> None:
    global CURRENT_CONSUMER
    cmd = [cfg["lark_cli"], "event", "consume", "im.message.receive_v1", "--as", "bot"]
    proc = subprocess.Popen(
        cmd, text=True, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
        stderr=subprocess.PIPE, bufsize=1,
    )
    CURRENT_CONSUMER = proc
    threading.Thread(target=log_stderr, args=(proc.stderr,), daemon=True).start()
    assert proc.stdout is not None
    try:
        for line in proc.stdout:
            if STOP.is_set():
                break
            try:
                event = json.loads(line)
                handle_event(cfg, state, event)
            except json.JSONDecodeError:
                logging.warning("忽略非 JSON 事件行: %s", line.rstrip())
            except Exception:
                logging.exception("处理事件失败")
    finally:
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                proc.kill()
        CURRENT_CONSUMER = None
        logging.warning("事件消费者已退出，退出码=%s", proc.returncode)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True, type=Path)
    parser.add_argument("--state", required=True, type=Path)
    parser.add_argument("--log-level", default="INFO")
    args = parser.parse_args()
    logging.basicConfig(
        level=getattr(logging, args.log_level.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(message)s",
    )
    cfg = load_config(args.config.expanduser().resolve())
    state = State(args.state.expanduser().resolve())
    def stop(*_: Any) -> None:
        STOP.set()
        if CURRENT_CONSUMER and CURRENT_CONSUMER.poll() is None:
            CURRENT_CONSUMER.terminate()

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    while not STOP.is_set():
        consume(cfg, state)
        if not STOP.wait(int(cfg.get("restart_delay_seconds", 3))):
            logging.info("重新启动事件消费者")
    return 0


if __name__ == "__main__":
    sys.exit(main())
