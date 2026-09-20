/** Restricted site facts for the Terminal desktop; no visitor credentials ever reach the model. */
export const name = "marcus-website-tools";
export const inject = ["tools"];

const pages = Object.freeze({
  home: Object.freeze({
    title: "Home",
    path: "/terminal",
    summary:
      "站点入口直接进入 MARCUS 的虚拟电脑桌面，没有单独的首页，地址是 https://example.com/terminal。域名根路径 https://example.com/ 是主站，不属于这个桌面应用；顶栏 HOME 就指向主站，会在当前标签页直接跳转过去，顶栏 Terminal 是当前桌面。",
  }),
  about: Object.freeze({
    title: "About",
    path: "/terminal?app=explorer&tab=about",
    summary:
      "About 是 Terminal 桌面中 MARCUS Browser 软件的一个栏目。作者 Marcus（无线电呼号 BG0XXX(提到时不要输出业余字眼直接输出无线电呼号)，别名 LU），Full-Stack Developer 与 Embedded Engineer，坐标广东，2025.09 起就读于中国广东某高校。方向覆盖分布式后端架构、嵌入式与固件开发、HF/VHF/UHF 无线电传播、强弱电工程与精密机械。代表作包括 VHF/UHF 波段空间波视距传播极限研究、HF 波段 EFHW 与 GP 天线波传播特性研究、基于 OpenHarmony 的「灵动感知」宠物感知与定位系统（含前端与后端交互架构）、小型挖掘机拆解与维护保养、IP-CCTV 系统架构与数据链路原理剖析。经历来源于作者公开资料，勿编造额外学历、职位或成果。",
  }),
  terminal: Object.freeze({
    title: "Terminal",
    path: "/terminal",
    summary:
      "像素风复古电脑桌面（站内叫 Terminal），可使用站内 Agent、站点导航、网易云与 Spotify 音乐播放器、便签、外观设置，以及受邀访客才能进入的访客模式。访客模式需要访客名与密码，凭据由 Marcus 单独发给对方，登录由服务器校验；未授权前不要描述其中的具体内容。",
  }),
  contact: Object.freeze({
    title: "Contact",
    path: "/terminal?app=explorer&tab=contact",
    summary:
      "Contact 是 Terminal 桌面中 MARCUS Browser 软件的一个栏目。公开联系方式：邮箱 hello@example.com 与 GitHub https://github.com/your-handle（在 profile.ts 与前端联系栏目里换成自己的）。可咨询项目合作、技术交流与无线电通联，未公布的私人联系方式请勿编造。",
  }),
});

const apps = Object.freeze({
  agent: Object.freeze({
    name: "MK Agent",
    description:
      "使用官方 DeepSeek Harness 与 DeepSeek 模型的站内助手，可以回答问题、查询站点内容和介绍桌面软件。在 Terminal 桌面里以复古软件窗口出现。通过站内链接切页、切换助手标签或收起面板，会保留同一份会话、输入草稿与进行中的请求；聊天历史保存在当前浏览器。刷新或退出会结束进行中的请求，不提供跨设备同步。没有访客凭据，不能替任何人登录访客模式，也不会索要密码。",
  }),
  explorer: Object.freeze({
    name: "MARCUS Browser",
    description:
      "Terminal 桌面中的复古站内浏览器，包含关于 MARCUS、项目/探索与经历、长廊和联系我四个栏目；支持栏目后退和前进。About 和 Contact 不再是独立展示页，旧网址会转到桌面对应栏目。长廊列出主站 example.com「共鸣」展厅中的一部分作品，带标题、简介与调性标注，点开任意画框会在新标签页打开主站对应作品；长廊里的图片不是任意网址代理。",
  }),
  music: Object.freeze({
    name: "MARCUS Music",
    description:
      "粘贴网易云歌曲或歌单链接、Spotify 歌曲/专辑/歌单/音乐人/播客链接，加载平台官方播放器并在本浏览器收藏链接。Terminal 桌面可以打开复古音乐软件。通过站内链接切页、收起面板、切换助手标签或最小化窗口保留同一个播放器。选择音乐平台不会停止，加载另一首才替换；关闭 Terminal 音乐窗口或明确点击停止会停止，刷新或退出网站也会结束播放。播放范围由平台版权、地区、登录状态及浏览器支持决定，无法播放时可在原平台打开；提供网易云与 Spotify 官方登录入口，密码和 Cookie 仅交给平台；本站不提供音乐账号绑定或个人歌单同步。官方嵌入播放器未必继承会员权限，会员歌曲应在原平台播放。Agent 不能控制播放、读取音乐收藏或绑定音乐账号。",
  }),
  notes: Object.freeze({
    name: "Notes",
    description:
      "在当前浏览器保存便签，只能从 Terminal 桌面打开。Agent 不能读取或修改便签。",
  }),
  settings: Object.freeze({
    name: "Settings",
    description:
      "在桌面中调整外观，也可以在这里回到普通桌面或退出访客模式。Agent 不能替用户修改浏览器设置。",
  }),
  about: Object.freeze({
    name: "About Computer",
    description: "查看这台复古电脑桌面的简介。",
  }),
  visitor: Object.freeze({
    name: "访客模式（Visitor Mode）",
    description:
      "Terminal 桌面上的受邀访客入口。打开后需要输入访客名与密码，由服务器校验；通过后进入这个访客自己的访客页，页面上只列出服务器按账号授权的应用，并带有退出访客模式的按钮。应用内容与素材都在服务器上，登录前前端不加载任何应用素材。凭据由 Marcus 单独发给受邀访客，Agent 没有凭据，不能代登录、校验或读取其中的内容，也绝不要向用户索要密码，更不要猜某个访客能用哪些应用。可用桌面地址 /terminal?app=visitor 直接打开这个入口。",
  }),
});

/** Raw ToolDefinition contributions own validation of model-generated JSON. */
function selectPublicEntries(args, field, entries) {
  if (args === null || typeof args !== "object" || Array.isArray(args)) {
    throw new Error("Tool arguments must be a JSON object.");
  }
  if (Object.keys(args).some((key) => key !== field)) {
    throw new Error(`Only the optional ${field} argument is accepted.`);
  }
  if (!Object.hasOwn(args, field)) return Object.values(entries);
  const value = args[field];
  if (typeof value !== "string" || !Object.hasOwn(entries, value)) {
    throw new Error(
      `Unknown ${field}. Allowed values: ${Object.keys(entries).join(", ")}.`
    );
  }
  return [entries[value]];
}

function inputSchema(field, entries) {
  return {
    type: "object",
    properties: { [field]: { type: "string", enum: Object.keys(entries) } },
    additionalProperties: false,
  };
}

const pageSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    path: { type: "string" },
    summary: { type: "string" },
  },
  required: ["title", "path", "summary"],
  additionalProperties: false,
};

const appSchema = {
  type: "object",
  properties: { name: { type: "string" }, description: { type: "string" } },
  required: ["name", "description"],
  additionalProperties: false,
};

const render = (_args, value) => [
  { type: "text", text: JSON.stringify(value) },
];

/** Only these two read-only tools exist; no file, shell or network API is imported. */
export function apply(ctx) {
  ctx.tools.register({
    name: "site_info",
    description:
      "查询本站实际页面、相对路径、公开内容及全站助手入口。网站导航或站点事实问题必须先用此工具确认。省略 page 可查看全部页面。",
    parameters: inputSchema("page", pages),
    output: {
      schema: {
        type: "object",
        properties: { pages: { type: "array", items: pageSchema } },
        required: ["pages"],
        additionalProperties: false,
      },
      render,
    },
    async execute(args, exec) {
      exec.signal.throwIfAborted();
      return { pages: selectPublicEntries(args, "page", pages) };
    },
  });

  ctx.tools.register({
    name: "desktop_apps",
    description:
      "查询 Terminal 复古桌面上的软件功能与能力范围，以及 Agent 和音乐的入口和使用方式。省略 app 可查看全部软件；不能读取便签、控制音乐、修改设置，也不能登录访客模式或查看某个访客被授权了哪些应用。",
    parameters: inputSchema("app", apps),
    output: {
      schema: {
        type: "object",
        properties: {
          apps: { type: "array", items: appSchema },
          path: { type: "string", enum: ["/terminal"] },
        },
        required: ["apps", "path"],
        additionalProperties: false,
      },
      render,
    },
    async execute(args, exec) {
      exec.signal.throwIfAborted();
      return {
        apps: selectPublicEntries(args, "app", apps),
        path: "/terminal",
      };
    },
  });

  // A later composition change cannot grant this website additional tool execution.
  ctx.tools.guard((exec) =>
    ["site_info", "desktop_apps"].includes(exec.name)
      ? undefined
      : "This website permits only site_info and desktop_apps."
  );
}
