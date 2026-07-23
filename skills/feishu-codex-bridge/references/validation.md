# 验收与故障排查

## 事件无法进入

运行：

```bash
lark-cli doctor
lark-cli event status
lark-cli event consume im.message.receive_v1 --as bot --timeout 10s
```

看到 WebSocket connected 但无事件时，检查机器人是否看得到目标会话、事件是否已发布，以及消息是否在服务停机期间发送。历史事件不会自动补发。

## 有事件但被忽略

查看日志中的 `忽略非授权会话` 或 `忽略非授权发送者`，将事件真实的 `chat_id`、`sender_id` 与私密配置逐字比较。不要移除过滤来绕过问题。

## 没有 doing 表情

运行 `lark-cli schema im.reactions.create`，确认机器人在会话内且具有 reaction 写权限。配置默认值为 `OnIt`。

## Codex 不执行

运行：

```bash
codex login status
codex exec --skip-git-repo-check -C /受控目录 -s workspace-write "只回复：连接正常"
```

确认 LaunchAgent 使用的 `codex_cli` 是绝对路径、工作目录存在，且任务不依赖交互式审批。

## 没有回复

用日志中的 `message_id` 检查机器人发送消息权限。桥接器使用事件 ID 生成幂等键；重试同一事件不会重复执行。

## 服务反复重启

```bash
launchctl print gui/$(id -u)/com.local.codex-feishu-bridge
tail -n 100 ~/.local/state/codex-feishu-bridge/bridge.log
plutil -lint ~/Library/LaunchAgents/com.local.codex-feishu-bridge.plist
```

优先修复日志中第一个配置或权限错误，再用 `launchctl kickstart -k` 重启。
