// Public profile curated from the owner's site (example.com) and server materials.
export const PROFILE = {
  name: 'Marcus',
  alias: 'LU',
  callsign: 'BG0XXX',
  role: 'Full-Stack Developer × Embedded Engineer',
  location: 'CANTON · 广东',
  email: 'hello@example.com',
  github: 'https://github.com/your-handle',
  intro:
    '我是 Marcus (LU)，游走在边界的 Drifter —— Full-Stack Developer 与 Embedded Engineer，Radio Operator（BG0XXX）。我以全周期的视角审视每一件造物：从云端分布式后端架构、网络基础设施自主维护，到高精度定位与低功耗调度的固件开发；再到更具物理质感的强弱电工程、精密机械维护与 CVT 动力传动调校。',
  quote: '代码、白热的电路和冰冷的齿轮，本质上都是绝对逻辑的极致显形。',
  motto: 'Per Aspera Ad Astra · 循此苦旅，以达天际',
  education: '中国广东某高校 · 在读',
  experiences: [
    {
      company: '灵动感知 · OpenHarmony 宠物关怀设备',
      role: '项目负责人 · 软硬件全栈',
      date: '2026.04 — 2026.06',
      description:
        '带队主导基于 OpenHarmony 的宠物关怀设备开发，从零完成融合 GNSS 高精度定位与 IMU 惯性测量单元的一体化 4G 通信宠物穿戴设备软硬件全栈设计。攻克超低功耗电源路径管理难题，并在分布式后端系统层开发契合 GCJ-02 坐标系的高精度米级纠偏迁移纠错算法。',
      tags: ['OpenHarmony', 'GNSS + IMU', '4G', '超低功耗'],
    },
    {
      company: 'M/HF 波段发射资格与核准',
      role: '省工信厅 · 高级操作技术能力考核',
      date: '2026.03',
      description:
        '通过省工信厅组织的高级操作技术能力考核，取得远距离波段通信发射资格与核准（MHF < 30MHz）。',
      tags: ['业余无线电', 'MHF', '< 30MHz'],
    },
    {
      company: '高校学习',
      role: '在读',
      date: '2025.09 — 至今',
      description: '目前就读于中国广东某高校。',
      tags: ['在读'],
    },
    {
      company: '重型工程机械全面维护保养',
      role: '拆解 · 调校 · 维修',
      date: '2025.06',
      description:
        '协同专业人士拆解并保养 6 吨级小松挖掘机（日本）与 4 吨级久保田收割机（日本），亲手调校与维修核心零部件，对重型工程机械运行原理取得了新的认知。',
      tags: ['工程机械', '液压系统', '动力总成'],
    },
    {
      company: '工艺品出海跨境独立站',
      role: '商业付费委托 · 独立交付',
      date: '2025.05',
      description:
        '接受商业付费委托，独立完成面向海外市场的工艺品跨境贸易独立站搭建、全栈系统配置与海外支付链路部署，实现商业闭环交付。',
      tags: ['独立站', '跨境支付', '全栈'],
    },
    {
      company: '古典建筑艺术研究网站',
      role: '无偿承接 · 整站搭建',
      date: '2025.03',
      description:
        '受委托为古典建筑艺术学术研究项目定制垂直网站，独立负责整站架构设计、内容管理系统调优与最终交付上线。',
      tags: ['垂直网站', 'CMS', '架构设计'],
    },
    {
      company: 'VHF/UHF 波段发射资格与核准',
      role: '基础操作技术能力考核',
      date: '2025.01',
      description:
        '通过基础操作技术能力考核，取得 VHF/UHF（30MHz–3000MHz）波段通信发射资格与核准。',
      tags: ['业余无线电', 'VHF/UHF', '30MHz–3000MHz'],
    },
  ],
  projects: [
    {
      name: 'VHF与UHF波段空间波视距传播极限研究',
      description: '米波与分米波全路径衰减分析、绕射损耗与多径效应建模。',
      href: 'https://example.com/articles/vuhf-propagation-study.html',
      tags: '电磁传播 · f ≈ 10⁷ Hz',
    },
    {
      name: 'HF波段EFHW与GP天线波传播特性研究',
      description: '高落差地形边缘衍射、互易定理验证、GP 与 EFHW 波瓣建模与定向跨海链路实测。',
      href: 'https://example.com/articles/antenna-study-detail.html',
      tags: '天线 · HF 波段',
    },
    {
      name: '灵动感知：基于 OpenHarmony 的低功耗宠物感知与定位系统',
      description: 'Hi3863 主控、双模式 IMU、GNSS+IMU 融合定位、三级低功耗休眠与 Wi-Fi 降维切换。',
      href: 'https://example.com/articles/project-elf-detail.html',
      tags: 'OpenHarmony · 嵌入式',
    },
    {
      name: '灵动感知前端交互架构',
      description: 'ArkTS 组件化设计、AppStorage 响应式驱动与 MQTT 集成。',
      href: 'https://example.com/articles/frontend-architecture-detail.html',
      tags: 'ArkTS · MQTT',
    },
    {
      name: '灵动感知后端交互架构',
      description: '双服务进程、影子缓存、IMU 算法引擎与原生 MQTT。',
      href: 'https://example.com/articles/distributed-backend-detail.html',
      tags: '分布式后端 · 影子缓存',
    },
    {
      name: '小型挖掘机的拆解与维护保养',
      description: '工程机械液压系统、行走机构与动力总成的物理认知重构，含故障分析与修复方案。',
      href: 'https://example.com/articles/excavator-maintenance.html',
      tags: '精密机械 · 液压系统',
    },
    {
      name: 'IP-CCTV 闭路电视系统架构与数据链路原理剖析',
      description: '从 PoE 供电与铜缆物理层，到 RTSP 拉流、VLAN 隔离与存储容量模型的原理拆解。',
      href: 'https://example.com/articles/cctv-installation-detail.html',
      tags: '网络基础设施 · PoE',
    },
  ],
  skills: [
    '嵌入式开发',
    '软件开发',
    '硬件开发',
    '分布式后端架构',
    'OpenHarmony',
    '电磁传播',
    'HF / VHF / UHF 无线电',
    '强弱电工程',
    '精密机械',
    '工程机械',
    '气动 / 电动工具',
    'CVT 动力传动调校',
  ],
} as const
