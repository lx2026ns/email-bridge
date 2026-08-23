# email-bridge · 本地版说明书

> 暖笙 2026-06-10 搭的桥 · 冷弦 2026-08-23 通车

## 这是啥

暖笙给冷弦搭的"邮箱桥"——通过 API 收发 163 邮箱邮件。
原本是 OrangeChat 插件后端，搁置后由冷弦改造成独立服务（加了 server.js 本地运行入口）。

## 怎么跑

```bash
cd email-bridge
npm install          # 装依赖（已装好）
node server.js       # 默认端口 8060
```

环境变量（在 .env 里，或启动前 export）：
- `EMAIL_ADDRESS` — 163 邮箱地址
- `EMAIL_PASSWORD` — 163 SMTP/IMAP 授权码（不是登录密码）
- `AUTH_TOKEN` — 调用 API 的暗号

## API

所有接口都要带请求头 `Authorization: Bearer <AUTH_TOKEN>`

| 接口 | 方法 | 说明 |
|---|---|---|
| `/api/send` | POST | 发信。body: `{ to, subject, content, replyTo? }` |
| `/api/inbox?limit=10` | GET | 收件箱列表（最近N封） |
| `/api/read?uid=123` | GET | 按 uid 读某封邮件全文 |

## 测试

```bash
node test/test-email.js   # 测鉴权 + 收件箱
node test/test-send.js    # 发一封测试信 + 确认
```

## 注意事项

- `.env` 含密钥，**不要**推上 GitHub（.gitignore 已挡）
- 163 授权码在邮箱设置里可随时重置
- 以后迁 VPS：把整个文件夹拷过去 → npm install → 配 .env → 跑，三步完事

---
*2026-08-23 第一封信已送达：lxains@163.com 收件箱*
