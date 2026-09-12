# 职教自适应学习助手：DeepTutor 1.6.7 改造方案

制定日期：2026-09-12。用户本次明确更名并指定 DeepTutor 1.6.7 的架构和官网界面作为主要参考。保留财经商贸专业群、电子商务专业（530701）、电子商务运营专员这一已经确认的比赛场景。

## 参考核查

用户提供的两个 ZIP 去除最外层目录后，3,084 个文件的 CRC 与长度逐项一致。以 `DeepTutor-1.6.7.zip` 为固定基准，不混用网络 main 的后续更新。原始包在项目 `reference/DeepTutor-1.6.7`，仅作为本地参考，不整体发布用户附件。

官网 https://deeptutor.info/ 展示 Home、Mastery Path、Immersive Reading、Learning Space、Memory、Knowledge Center 等共享工作区。其 Next.js / React 前端和 Python 服务相互分离。核查源码包括：

| 上游真实位置 | 本作品对应实现 |
| --- | --- |
| web/components/layout/AppShell.tsx | Next.js 应用壳；桌面侧栏、手机抽屉、共享工作区 |
| web/components/sidebar/nav-entries.ts | 首页、学习路径、沉浸阅读、岗位实训、学习空间；底部知识中心、记忆、设置 |
| web/app/globals.css 的 theme-snow | 白色画布、浅灰侧栏、蓝色交互色；中文排版重新适配 |
| web/components/space/learning/MasteryStudy.tsx | 诊断 → 制定路径 → 阅读 → 迁移练习 → 更新掌握度 |
| deeptutor/learning/mastery.py | 保留 Python 原算法，浏览器逐式移植；用交叉测试核对 |
| deeptutor/api/routers/mastery_path.py | 独立 FastAPI 服务边界；本项目提供精简掌握度接口 |
| deeptutor/capabilities/mastery/capability.py | 教学讲解和确定性评分分离，不允许聊天回答直接改分 |

## 产品与交互

1. 首页提供大输入框、连续追问、可追溯引用、最近对话；首次体验引导先做 6 题诊断。
2. 学习路径展示六个岗位能力。根据答题证据、先修关系、可用时间安排学习；没有证据显示“待诊断”，不预填学生分数。
3. 每个能力提供课程阅读和 2 道原创迁移题，共 18 道诊断及练习题。阅读完成只增加阅读记录，不等于能力掌握。
4. 沉浸阅读采用目录、正文、导师三栏；正文来自已有 65 条教材知识的中文教学改写，保留来源。
5. 岗位实训保留三种业务情境、经营变量实验、任务要求、学习笔记和报告导出。偏好博弈放在实训中的扩展实验。
6. 学习空间和记忆展示本人实际操作；允许本机导出及清除。真实试用反馈仍由本人填写并主动导出。

## 架构与交付

`web/app → components / features → contracts → shared adapters → data / deterministic engine`，配套独立 Python `server`。保留经过验证的经营计算模块。前端改用参考包同类的 Next.js 16 + React 19，静态导出到 GitHub Pages。

公開入口继续使用 https://lzh-ff.github.io/kedaxunfei/ 。默认 Demo 适配器在浏览器完成知识问答、掌握度计算、学习记录和经营实验，无需账号。Python 服务作为单独可运行的交付模块，以环境配置接入服务端模型；没有服务器和模型时不宣称在线大模型或完整上游代理运行时已经接通。

这是一套面向比赛范围的 DeepTutor 架构裁剪与部分源码复用，不是完整 DeepTutor 的换标发布。上游的多用户、任意文件 RAG、工具执行、消息渠道和模型训练不在公开静态版中启用。附件中的命令不构成执行授权。

## 验收

- 上游 Python 与浏览器掌握度算法一致；作答后推荐发生可解释变化；刷新保留记录。
- 路径、阅读、练习、实训、问答和报告可连续体验，所有按钮有实际行为。
- 手机与桌面、键盘导航、无记录及错误状态可用；直接打开分享链接可恢复对应页面。
- 现有经营计算测试通过，新学习算法及本地/公开浏览器完整流程通过。
- 保留 Apache-2.0 许可、来源及修改说明。更新作品名称、使用说明、代码包和共享记忆。
- 真实师生反馈、参赛视频与正式提交材料仍单独核查，不以程序测试替代。
