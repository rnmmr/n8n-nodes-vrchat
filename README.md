# n8n-nodes-vrchat

This is an n8n community node that allows you to use the VRChat API in your n8n workflows.  
这是一个 n8n 社区节点，可用于在 n8n 工作流中调用 VRChat API。

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.  
[n8n](https://n8n.io/) 是一个采用 [fair-code licensed](https://docs.n8n.io/reference/license/) 许可的工作流自动化平台。

---

## ⚠️ Usage Notice / 使用声明

This project is intended for **personal use and learning only**.

- No advertising, spam, or mass messaging  
- No illegal use  
- No API abuse (rate abuse, bypassing limits, etc.)
- No automated login, verification bypass, or account hacking
- User behavior is **not related to this project**, use at your own risk

本项目**仅供个人使用与学习**。

- 禁止广告、刷屏及群发行为  
- 禁止任何违法用途  
- 禁止滥用 VRChat 或第三方 API（刷请求、绕限制等）  
- 不支持自动登录、绕过验证、账号破解  
- 用户行为与本项目无关，使用此项目可能导致封号，风险自负

---

## Installation / 安装

先[安装n8n](https://docs.n8n.io/hosting/)


然后再

```bash
npm install n8n-nodes-vrchat
```

如果你用的是 n8n desktop 或自建服务，进入 n8n 的 .n8n/custom/node_modules 目录下执行上面命令即可。

如需手动安装，也可以在[这里](https://github.com/rnmmr/n8n-nodes-vrchat/releases)下载最新的 `n8n-nodes-vrchat.zip` 文件，解压到 `C:\Users\你的用户名\.n8n\custom\node_modules\n8n-nodes-vrchat`。

应该就行了吧（

---

## Operations / 支持功能

The following VRChat API operations are currently supported:  
当前支持的 VRChat API 功能包括：

- **Real-time friend activity trigger**
  实时接收好友动态触发器
- **Get Current User**  
  获取本人信息
- **Update Current User**  
  修改本人信息
- **Search Users**  
  搜索玩家
- **Get User Info**  
  获取玩家信息
- **Get Mutual Friends**  
  获取共同好友
- **Get Notifications**  
  获取通知
- **Accept Friend Request**  
  接受好友申请
- **Get Room / Instance Info**  
  查看房间信息

---

## Credentials / 凭据说明

This node uses VRChat authCookie for authentication

**⚠️ Please note that casually sharing any cookies is very dangerous. Do not disclose your cookies to anyone. This project will not upload any cookies.**

- This project will not help users log in automatically; please obtain the authCookie manually.

本节点使用 **VRChat authCookie** 进行认证

**⚠️请注意，随意泄露任何Cookie都是很危险的行为，请勿将Cookie透露给任何人，本项目不会上传任何Cookie⚠️**

- 本项目不会帮助用户自动登录获取authCookie，请手动获取authCookie

#### 如何获取authCookie

登录[VRChat网页端](https://vrchat.com/home)，打开开发者工具(按F12)

点击上方网络，然后按F5或者等待一会

按照下面的方法找

![alt text](https://youke.xn--y7xa690gmna.cn/s1/2026/01/27/69779109ed7db.webp)

**⚠️请注意，随意泄露任何Cookie都是很危险的行为，请勿将Cookie透露给任何人，本项目不会上传任何Cookie⚠️**

获取到这一串authCookie:`auth=authcookie_ca80483d-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

点开一个节点，点击新建凭证填入此authCookie

---

## Example / 示例

![视奸喵](http://youke.xn--y7xa690gmna.cn/s1/2026/01/26/697642bb4ecd9.webp)

只是开个玩笑，此示例已获得该玩家本人允许

---

## Disclaimer / 免责声明

This project is **not affiliated with VRChat Inc.**  
本项目与 VRChat 官方无任何关联。

---

## ToDo
- [ ] 改回全英语
- [ ] 本地日志Trigger
- [ ] OSC功能

---

累了，有问题再call我（
