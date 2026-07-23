---
name: feishu-codex-bridge
description: 配置、安装、诊断、验收或卸载飞书（Lark/Feishu）消息到 Codex CLI 的可靠双向桥接。用于用户要求把飞书机器人消息交给 Codex 执行、添加 doing 表情、在原消息下回复结果、配置 macOS LaunchAgent 常驻服务，或制作可脱敏复用的飞书 Codex 部署模板时。
---

# 飞书 Codex 消息桥接

按顺序执行，不复制他人的真实 ID、凭据或绝对路径。

## 1. 检查前置条件

运行：

```bash
command -v lark-cli
command -v codex
lark-cli doctor
lark-cli auth status
codex login status
lark-cli event schema im.message.receive_v1
```

要求 Bot 身份、Codex 登录和飞书网络均正常。使用以下短测验证事件通道，看到
`feishu-websocket: connected` 即为事件订阅可用：

```bash
lark-cli event consume im.message.receive_v1 --as bot --timeout 5s
```

若缺少权限或控制台事件，读取 [飞书控制台配置](references/feishu-console.md)，让用户完成必须由应用管理员操作的步骤后重试。

## 2. 获取授权范围

只接收明确授权的会话和发送者。启动一次临时消费者：

```bash
lark-cli event consume im.message.receive_v1 --as bot --max-events 1 --timeout 2m
```

让用户向目标机器人发送一条测试消息，从事件 JSON 取 `chat_id`、`sender_id`。不得把这些值写入 Skill 或公开模板。

## 3. 生成个人配置

复制 [config.example.json](scripts/config.example.json) 到 Skill 目录外的私密临时位置，填写：

- `target_chat_ids`：上一步的 `chat_id`
- `allowed_sender_ids`：上一步的 `sender_id`
- `workspace`：Codex 允许工作的目录
- `lark_cli`、`codex_cli`：`command -v` 得到的实际路径

默认使用 `reaction + OnIt`、`workspace-write` 沙箱和 30 分钟超时。除非用户明确要求，不使用跳过审批或无沙箱选项。

## 4. 安装

```bash
./scripts/install_launch_agent.sh /绝对路径/config.json
./scripts/status.sh
```

安装脚本把运行文件复制到用户目录、将配置权限设为 `600`，并注册
`com.local.codex-feishu-bridge` LaunchAgent。不要直接从 Skill 目录常驻运行。

## 5. 验收

运行 `./scripts/status.sh --follow`，让用户从授权会话发送一个无副作用的小任务。逐项确认：

1. 原消息出现 doing（`OnIt`）表情。
2. Codex 只在配置的 `workspace` 中运行。
3. 成功、失败或超时均在原消息下回复。
4. 同一 `event_id` 不重复执行。
5. 执行 `launchctl kickstart -k gui/$(id -u)/com.local.codex-feishu-bridge` 后恢复监听。

使用 [验收与故障排查](references/validation.md) 处理失败项。

## 6. 卸载

```bash
./scripts/uninstall_launch_agent.sh
```

默认保留私密配置、日志和幂等数据库便于恢复。仅在用户明确要求清除时运行：

```bash
./scripts/uninstall_launch_agent.sh --purge
```

## 发布边界

发布前确认 Skill 中不存在真实 `oc_`/`ou_` ID、应用密钥、个人路径、`var/`、日志或幂等数据库。只发布样例配置、通用脚本和说明。
