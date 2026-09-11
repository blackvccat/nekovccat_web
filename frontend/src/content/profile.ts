// Public profile curated from the owner's supplied résumé and server materials.
export const PROFILE = {
  name: 'NEKO', alias: 'NEKO', role: 'AI 产品经理 × 全栈开发',
  email: 'maojiangmiaomiao@gmail.com', wechat: '1293720759',
  github: 'https://github.com/blackvccat',
  intro: '你好，我是 NEKO。我喜欢把想法做成能用的东西：从 AI Agent、交互界面，到一座可以慢慢走进去的 Minecraft 城市。',
  education: '广州南方学院 · 数字媒体技术本科 · 2023.09 — 2027.07',
  experiences: [
    { company: '特赞 Tezign', role: 'AI 产品经理 · 企业 Agent', date: '2025.12 — 2026.07', description: '从需求调研、PRD 到 Agent 对话链路与全栈开发，参与企业 AI 产品的完整落地。设计 RAG、工具调用与多轮对话，并建立效果评测和数据回收机制。', tags: ['AI 产品', 'Agent / RAG', 'Node.js / Python'] },
    { company: '哔哩哔哩 · 上海', role: '前端工程师实习生 · 直播业务线', date: '2025.06 — 2025.11', description: '参与直播间功能开发、实时数据看板与性能优化。用 React / TypeScript 和 WebSocket 将实时数据变成清晰的界面，经历需求评审、灰度发布到线上复盘。', tags: ['React / TypeScript', '实时数据', '前端工程'] },
  ],
  projects: [
    { name: 'NEKO Web / My World', description: '从 AI 对话与 3D 交互出发，慢慢长成这台像素电脑。现在装着站内 Agent、音乐、建筑档案，以及留给重要的人的小窝。', href: 'https://github.com/blackvccat/nekovccat_web', tags: 'Next.js · FastAPI · Three.js · Agent' },
    { name: '红外目标检测', description: '基于 YOLOv12 的科研项目，完成数据集整理、标注格式转换、训练调优与推理实验。', href: 'https://github.com/blackvccat/yolo12_infrared_detection_project', tags: 'Python · PyTorch · YOLOv12' },
  ],
  skills: ['产品设计 / PRD', 'React / Vue / Next.js', 'Node.js / Python', 'LLM / RAG / 工具编排', 'SQL / 数据看板', 'PyTorch / YOLO', 'Docker / Git', '英语 CET-6'],
} as const
