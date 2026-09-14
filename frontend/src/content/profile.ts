// Public profile curated from the owner's supplied résumé and server materials.
export const PROFILE = {
  name: 'NEKO', alias: 'NEKO', role: '前端工程师 × AI 产品 × 增长运营',
  email: 'maojiangmiaomiao@gmail.com', wechat: '1293720759',
  github: 'https://github.com/blackvccat',
  intro: '你好，我是 NEKO。在 B 站直播业务线写过实时场景的前端代码，在 WEEX 跑通过交易所站内触达与数据复盘的完整增长链路，在 MEXC 从 0 到 1 设计过 AI 行情推送机器人。既能理解一行代码的实现代价，也能判断一个功能的用户价值。',
  education: '广州南方学院 · 数字媒体技术本科 · 2023.09 — 2027.07 · 可接受远程 / 异地',
  experiences: [
    { company: 'MEXC 抹茶交易所', role: 'AI 产品实习生', date: '2026.03 — 2026.06', description: '负责交易所 AI 行情推送机器人的产品设计，定义行情异动、爆仓预警、资金费率变化、热点币种解读等核心推送场景，输出完整 PRD 与交互流程稿；推动算法、研发、运营三方协同迭代，建立推送效果评估体系，点击转化率环比提升约 12%，退订率稳定控制在 2% 以内；调研 8 家主流交易所 AI 助手形态，产出竞品分析报告，其中 3 项建议纳入后续版本规划。', tags: ['AI 机器人产品', '行情推送 PRD', '竞品分析', '效果度量'] },
    { company: 'WEEX 交易所', role: '市场部实习生', date: '2026.02 — 2026.05', description: '统筹弹窗、Banner、站内信、App Push 等多渠道资源位，独立完成活动排期与上线校验，累计支持 20 余场运营活动零事故上线；作为市场部与产品、设计、研发、本地化团队的接口人，将活动平均交付周期从 5 天压缩至 3 天；统一触达链路埋点口径并搭建周期性数据报表，通过漏斗拆解驱动迭代，单场活动参与率环比提升约 15%；沉淀运营 SOP 与活动配置文档 12 份。', tags: ['站内触达', '数据复盘', '跨部门协同', 'SOP 沉淀'] },
    { company: '哔哩哔哩（上海）', role: '前端工程师实习生 · 直播业务线', date: '2025.12 — 2026.03', description: '独立负责直播间多个功能模块的需求开发、缺陷修复与线上问题排查，累计交付需求 15 个，保障高并发实时场景稳定运行；基于 React / TypeScript 完成组件抽象与复用，沉淀通用业务组件 6 个；针对首屏加载、长列表渲染与实时状态同步做性能优化，首屏渲染耗时降低约 20%；完整参与需求评审 → 开发排期 → 提测 → 灰度发布 → 线上复盘闭环。', tags: ['React / TypeScript', '直播实时场景', '性能优化', '灰度发布'] },
  ],
  projects: [
    { name: 'NEKO Web / My World', description: '从 AI 对话与 3D 交互出发，慢慢长成这台像素电脑。现在装着站内 Agent、音乐、建筑档案，以及留给重要的人的小窝。', href: 'https://github.com/blackvccat/nekovccat_web', tags: 'Next.js · FastAPI · Three.js · Agent' },
    { name: '红外目标检测', description: '基于 YOLOv12 的科研项目，完成数据集整理、标注格式转换、训练调优与推理实验。', href: 'https://github.com/blackvccat/yolo12_infrared_detection_project', tags: 'Python · PyTorch · YOLOv12' },
  ],
  skills: ['前端研发：JS / TS、React、Vue、Node.js、Vite / Webpack、性能优化', '产品能力：PRD 与需求文档、竞品分析、原型设计（Figma / Axure）、AB 实验', '数据分析：SQL、埋点设计、漏斗与留存、数据看板、效果归因', '行业认知：现货 / 合约机制、资金费率、链上基础、LLM 应用落地', '语言：中文（母语）· 英语（CET-6，可无障碍英文文档协作）'],
} as const
