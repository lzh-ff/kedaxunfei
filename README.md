# 职教自适应学习助手

面向财经商贸专业群、电子商务专业（530701）、电子商务运营专员的自适应学习 Demo。沿用原“经世智学”的岗位内容，参考 DeepTutor 1.6.7 的界面与分层架构。

公开入口：[立即体验](https://lzh-ff.github.io/kedaxunfei/) · [使用说明](docs/demo-guide.md) · [改造方案](docs/deeptutor-redesign.md)

## 已实现

- 6 题诊断 → 学习安排 → 6 个阅读单元 → 基础题复核与 12 道迁移题 → 更新掌握度。
- 复用 DeepTutor 1.6.7 近期加权算法；重复同题不增加不同题目证据数，阅读不会直接加分。
- 65 条有来源的专业知识；导师支持模糊问题澄清、连续追问、案例与出处。
- 3 种运营任务、2 个层级，定价/弹性/成本/库存实验、偏好博弈、笔记及报告导出。
- 本机阅读、答题及对话记录；浅色/深色、手机导航、真实使用者主动填写并导出的反馈。

## 实现边界

公开版是 Next.js 16 + React 19 静态导出。用户确认暂无服务器和模型接口，所以问答、学习状态和公式在浏览器运行，没有在线大模型、任意文件 RAG、多用户后台或完整 DeepTutor 代理运行时。经营数字均为教学模拟。

Python 学习服务随代码交付并经本地验证，提供原版掌握度算法接口；公开版不依赖它。部分源码复用与修改见[开源说明](licenses/DeepTutor-NOTICE.md)。

## 本地复现

环境：Node.js 22 以上；Python 3.11 以上用于算法对照测试。

```sh
npm ci
npm --prefix web ci
npm test
npm run build
npm start
```

访问 http://127.0.0.1:4173/kedaxunfei/ 。`npm run test:e2e` 使用 Playwright 与已安装的 Microsoft Edge，默认验证本地导出。其他系统可将测试的 `channel:'msedge'` 改为已安装的浏览器。

可选学习服务：

```sh
python -m pip install -r server/requirements.txt
python -m uvicorn server.app:app --host 127.0.0.1 --port 8000
```

接口文档：http://127.0.0.1:8000/docs 。没有模型密钥配置或外部工具执行。

## 源码与部署

`main` 保存源码，`gh-pages` 保存 `web/out` 静态构建，Pages 发布后者根目录。页面不依赖本机开发服务。修改后需重新构建、测试并更新发布分支。

- web/app、components、features：Next.js 入口、应用壳、对话、学习与实训。
- web/contracts、shared：契约、存储、报告。
- src/engine.mjs、mastery.mjs：经营与学习算法。
- data：知识、能力、任务与学习内容。
- server：独立 FastAPI 服务及原版 Python 算法。

[技术说明](docs/technical.md) · [测试记录](docs/test-report.md) · [部署记录](docs/deployment.md) · [知识来源](docs/sources.md)

程序测试不代替 2—3 名真实师生反馈；视频、PPT、签章材料仍须另行整理。本仓库不声明已经正式提交比赛。

历史兼容：根目录index.html、styles.css、src/app.mjs及tests/e2e.mjs保留原经世智学v1代码，可用legacy:preview查看；它们不是当前Pages入口。新版源入口是web/app/page.tsx，新测试为tests/adaptive-e2e.mjs。
