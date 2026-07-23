# 飞书控制台配置

## 必需能力

在飞书开放平台对应应用中确认：

1. 启用机器人能力，并让机器人对目标用户/群可见。
2. 事件订阅使用长连接，订阅 `im.message.receive_v1`。
3. 为应用开通接收消息、发送/回复消息、添加消息表情所需权限。
4. 发布新版本，使权限和事件订阅生效。
5. 群聊场景把机器人加入目标群；私聊场景从机器人的应用会话发送消息。

以 `lark-cli event schema im.message.receive_v1` 和具体 IM 命令的 schema 输出为权限真值。
若命令返回 `missing_scope`，按其 `missing_scopes` 在控制台申请并发布，不根据错误文案猜测权限。

## 安全范围

- 每人优先独立部署。
- 共用机器人时由应用管理员统一管理可见范围和事件范围。
- 本地配置同时限制 `target_chat_ids` 与 `allowed_sender_ids`。
- 不在 Skill、代码仓库或群消息中记录 App Secret、用户 token。
