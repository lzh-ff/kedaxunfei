# 岗课智联 · 本机 SDK 问答版与公开规则版

参赛作品正式名称为《岗课智联——面向职业教育高水平专业群的教学实训与岗位技能智能体》。页面与代码中的《职教自适应学习助手》是同一作品的 Demo 名称，面向财经商贸专业群、电子商务专业（530701）及电子商务运营专员岗位。

本轮新增本机模型问答：浏览器 → 本机 Node.js 服务 → **OpenAI 官方 SDK 7.15.0 → DeepSeek**。使用的是 OpenAI 开发库，实际模型服务商为 DeepSeek。密钥只放在服务端，不进入网页或提交包。本轮没有发布这套 SDK 实现到 GitHub，也没有新增公网托管。

[公开体验链接](https://lzh-ff.github.io/kedaxunfei/) 保持此前的教材规则版。本机模型版与公开规则版的发布边界见 [运行与发布记录](docs/deployment.md)。

## 在本机使用模型问答

需要 Node.js 22 及以上。先安装依赖：

```sh
npm ci
npm --prefix web ci
```

源码交付包若已包含 `web/out-local/index.html`，可直接使用该构建；从纯源码重新生成时执行：

```sh
npm run build:local
```

运行者需配置服务端环境变量 `DEEPSEEK_API_KEY`。本机已经授权配置的 Windows 启动器也可读取其私有配置，其他机器不继承该密钥。双击根目录 **启动本机DeepSeek问答.cmd**，浏览器打开：

http://127.0.0.1:4174/kedaxunfei/

结束时双击 **关闭本机DeepSeek问答.cmd**。启动器只关闭与当前项目匹配、由本机启动器记录的 Node 服务。

也可以复制占位示例 `server/env.example` 为本机私有 `.env.tutor.local`，自行填入密钥，然后从命令行运行：

```sh
node --env-file=.env.tutor.local scripts/local-app.mjs
```

不要把填好密钥的文件放到 `web/public`、静态目录或提交压缩包。默认模型为 `deepseek-flash`，可通过 `DEEPSEEK_MODEL` 更换；`DEEPSEEK_BASE_URL` 仅允许 DeepSeek 官方 HTTPS 地址。

“回答方式”可选 **DeepSeek 在线** 或 **教材规则 · 离线**。点击发送前会说明发送范围；等待时可以取消。失败会显示错误，可以重试或使用教材规则。初次打开页面不上传对话历史。每条助手回答标注“AI生成内容”和生成方式；教材按钮仅供人工核对。

## 使用独立规则版

```sh
npm run build:offline
npm start
```

打开 http://127.0.0.1:4173/kedaxunfei/ 。此构建输出 `web/out`，不配置在线问答接口，不需要模型密钥。模型构建单独保存在 `web/out-local`；生成两套构建时先运行 `build:local`，再运行 `build:offline`。

## 教学功能与边界

- 6 题诊断、6 个阅读单元、基础题复核与 12 道迁移题，按作答证据更新学习路径。
- 65 条有来源的专业知识、20 个来源入口，支持概念、案例与连续追问。
- 3 种任务、2 个层级，经营定价、弹性、成本和库存实验，另有课堂博弈、笔记与报告导出。
- 对话、作答与阅读保存在当前浏览器；反馈由真实使用者主动填写并导出，不自动提交。

模型请求只包含本轮问题、有限近期对话、选定学习主题与讲解方式、白名单经营参数。服务端自行挑选最多4条教材片段，并按现有公式重算经营结果；不接受前端指定系统提示词、来源网址或计算结果。问题最多2000字，最近对话最多6条、单条1000字、合计4000字；已识别的手机号、邮箱、证件号和密钥格式会被拒绝。姓名等自由文本无法可靠自动识别，请勿输入私人信息。

服务端默认25秒超时、每个IP每分钟12次的进程内尽力限频；这不是跨进程配额或身份认证。正文最多4000字，达到生成上限时提示继续追问。所有经营数字为教学模拟，模型回答需人工核对。未实现完整 DeepTutor 代理运行时、任意文件检索或多用户教师后台。

## 验证与源码

```sh
npm test
npm --prefix web run typecheck
```

算法对照测试另需 Python 3.11 及以上。41 项 Node 测试包括原有26项与新增15项。规则版启动后运行 `npm run test:e2e`；问答页面测试 `npm run test:chat-ui` 使用可控的接口替身，需显式指定运行中的模型页面 `DEMO_URL`，不会代替真实密钥验证。浏览器测试使用 Playwright 和已安装的 Microsoft Edge。

- `web/features/chat`：输入、异步状态、生成方式、来源展示与安全的有限 Markdown 排版。
- `src/chat-client.mjs`：前端发送字段、历史截取、取消、超时和响应校验。
- `server/tutor-proxy.mjs`：官方 SDK 调用、可信教材检索、经营重算与请求边界。
- `server/local-app.mjs`：仅监听本机的网页与问答服务；`api/chat.mjs` 保留可移植的 Node 入口。
- `src/engine.mjs`、`src/mastery.mjs`、`data`：经营公式、学习方法与有来源的教学内容。
- `server/vendor`：保留的 DeepTutor Python 算法对照代码；可选 FastAPI 学习算法服务不是本轮模型代理。

参考 DeepTutor 1.6.7 的界面与分层架构，复用其近期加权掌握度方法，许可证为 Apache-2.0，并非 AGPL。OpenAI SDK 7.15.0 同为 Apache-2.0。具体复用范围见 [DeepTutor 改造与许可说明](licenses/DeepTutor-NOTICE.md)。不声明全部代码独立自研。

[使用说明](docs/demo-guide.md) · [知识来源](docs/sources.md) · [历史发布记录](docs/deployment.md)

程序测试不代替真实师生试用，本仓库不代表已向主办方正式提交。根目录旧 `index.html`、`src/app.mjs` 等保留历史演示，当前页面入口为 `web/app/page.tsx`。
