#!/usr/bin/env node
/* 桌面暗色主题生成器：读亮色 CSS，按「角色的明度映射」算出暗色值，产出带作用域的覆盖表。
 *
 * 为什么是生成而不是手写：
 *   desktop.css + 三个桌面 CSS 里有 460 多条带颜色的声明、284 个不同色值，而且每个斜面
 *   （box-shadow 的亮边 / 暗边）都是手调的。手写一份暗色表既写不全也容易漏，漏掉的那一条
 *   在暗色下就是一块浅色斑。生成能保证「亮色里画了颜色的每一处，暗色里都有对应的一处」。
 *
 * 亮色一个像素都不动：本脚本只读取亮色 CSS，绝不改写它；产物是独立的 desktop-dark.css，
 * 每条规则都挂在 .marcus-desktop-page[data-theme="dark"] 下面。
 *
 * 用法：
 *   node scripts/desktop-theme.mjs            # 写 frontend/src/app/terminal/desktop-dark.css
 *   node scripts/desktop-theme.mjs --report   # 只打印色表与体检结果，不写文件
 *   node scripts/desktop-theme.mjs --check    # 校验产物是否与当前亮色 CSS 同步（测试用）
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'frontend/src/app/terminal/desktop-dark.css')

/** 亮色源文件（都是只在桌面里加载的样式；site-music.css 属于站内面板，不参与）。 */
export const SOURCES = [
  'frontend/src/app/terminal/desktop.css',
  'frontend/src/components/my-world/desktop-software.css',
  'frontend/src/components/my-world/music-app.css',
  'frontend/src/components/agent/agent-progress.css',
]

/* 主题写在 <html> 上：首屏之前的引导脚本（terminal/page.tsx 里的 THEME_BOOT）就能定下来，
 * 不必等 React 挂载——否则暗色用户每次进桌面都会先闪一下米白。 */
export const SCOPE_PREFIX = 'html[data-theme="dark"]'
export const SCOPE_ROOT = '.marcus-desktop-page'

/** 映射之外还需要补的声明（不是颜色换算能表达的东西）。 */
export const EXTRA_RULES = [
  // 让原生控件（滚动条、复选框、日期选择器）跟着暗色走。
  { selector: '.marcus-desktop-page', declarations: ['color-scheme: dark;'] },
]

/** 反白高亮：终端里「当前项」是绿底黑字，这是整块屏幕上最醒目的一类标记。
 *  只给**纯文字**的行——任务的图标是光栅画（`PixelImage` 渲染的是 SVG 文件，不跟 currentColor），
 *  亮绿底会把浅色图标吃掉，所以带图标的那几处仍用暗绿条（screen-state）。 */
export const INVERSE_SELECTORS = [
  '.browser-tabs button[aria-current]', // 当前栏目
  '.pixel-button.send-button:not(.stop-reply)', // 发送键：终端的"可以输入了"
  '.execution-summary', // 进度摘要就是一行文字
]

/** 屏幕上的玻璃感：四角压暗 + 一点点绿辉光（只有暗色有，亮色那边不动）。 */
function screenGlass(scope, green) {
  return [
    `${scope} .computer-screen::before {`,
    `  content: ""; position: absolute; inset: 0; z-index: 2147483646; pointer-events: none;`,
    `  background: radial-gradient(ellipse at center, transparent 58%, #00000047 100%);`,
    `  box-shadow: inset 0 0 70px ${green}0f;`,
    `}`,
  ].join('\n')
}

/** 暗色的扫描线只换「线色」：亮色那组是深绿 5%，映射到近黑屏上等于没有（黑线压黑底），
 *  改成纯黑 25%，在绿字上能看出一道道暗行。粗细与下滚动画都在 desktop.css 里，
 *  由根元素上的 data-scanline 选；暗色默认落在「粗」那一档，是设置里 resolveScanlineWidth 定的。 */
function scanlines(scope) {
  return [
    `${scope} .computer-screen.crt-enabled::after {`,
    `  --scan-ink: #00000040;`,
    `}`,
  ].join('\n')
}

/* ── 暗色调色板：一台黑屏幕绿字符的终端 ────────────────────────────────────────
 * 亮色是一套米白粉彩（面板浅、文字深）。暗色不是把它整体压暗——那样只会得到一版"深灰界面"。
 * 这里照 RobCo 那种绿屏终端的三条规则来分：
 *
 *   1. **屏幕是黑的**：屏幕里的一切底子（窗口、面板、输入框、任务栏）压到近黑，只带一点绿味。
 *      终端的黑不是"深灰"，明度 3%–9% 才算黑。
 *   2. **屏上画出来的都是绿的**：文字、框线、斜面、光标——都是同一支磷光绿，只是亮度不同。
 *      所以正文不能是中性灰：那看起来就是现代暗色 UI，不是终端。
 *   3. **主次靠绿的亮度分**，不靠色相：正文最亮，次要文字中绿，提示暗绿；选中项**反白**
 *      （绿底黑字），这是终端里最醒目的那一类高亮。
 *
 * 绿之外只留三样：机箱（外壳与屏幕边框，暗金属灰，饱和度 0.08，看得出是"机器"而不是屏幕）、
 * 琥珀（忙碌）、告警红（报错与删除）。
 *
 * 之前两版栽在哪（记下来免得再绕）：第一版色相跟着米白走 → 面板成橄榄金；第二版全屏一个绿 →
 * 绿到发糊；第三版矫枉过正，把正文改成中性灰、面板抬到 12%–15% → 变成普通暗色主题，没有终端味。
 */
export const PHOSPHOR = 140 // 磷光绿

export const DARK_PALETTE = {
  // 屏幕底：窗口、面板、输入框、任务栏。3%–9% 亮度，只留 0.16 的绿味——黑屏，不是深灰面板。
  screen: { lightness: L => 0.02 + 0.075 * L, hue: PHOSPHOR, saturation: 0.16, pull: 1 },
  // 交互态的填充（悬停、按下、当前项）：比屏幕底亮一档并更绿，让"鼠标下的东西"看得出来。
  'screen-state': { lightness: L => clamp(0.082 + 1.3 * (L - 0.87), 0.05, 0.24), hue: PHOSPHOR, saturation: 0.30, pull: 1 },
  // 正文与次要文字：同一支绿的三个亮度档。上限 0.88 是主色，下限 0.54 保证黑底上仍有 4.5:1。
  // 斜率取 0.85：亮色里 0.23（正文）/0.54（次要）这两档，暗色下能拉开到 0.86 与 0.59。
  text: { lightness: L => clamp(1.05 - 0.85 * L, 0.54, 0.88), hue: PHOSPHOR, saturation: 0.50, pull: 1 },
  // 屏上的框线（窗口、输入框、分隔线）：中绿，像终端里画出来的方框。
  edge: { lightness: L => 0.26 + 0.26 * L, hue: PHOSPHOR, saturation: 0.42, pull: 1 },
  // 斜面与投影：亮色里「亮边 97% / 暗边 68%」要展开。拐点在 70%：暗边压到近黑，亮边抬到 0.46，
  // 于是每个按钮、每个窗口都是「一道亮绿边 + 一道黑边」，像屏幕上的浮雕。
  shadow: { lightness: L => (L < 0.70 ? 0.005 + 0.09 * L : 0.068 + 1.35 * (L - 0.70)), hue: PHOSPHOR, saturation: 0.40, pull: 1 },
  // 反白之外最亮的那点绿：链接、焦点圈、悬停的文字与边线。
  highlight: { lightness: L => clamp(1.0 - 0.55 * L, 0.62, 0.92), hue: PHOSPHOR, saturation: 0.60, pull: 1 },
  // 选中 / 当前项的反白条：绿底 + 近黑字（由 INVERSE_RULES 补，见下）。
  inverse: { lightness: () => 0.62, hue: PHOSPHOR, saturation: 0.55, pull: 1 },
  // 机箱：外壳、屏幕边框、机脚下巴。暗金属灰，看得出是"机器"——饱和度 0.08，绝不是金色。
  machine: { lightness: L => 0.05 + 0.11 * L, hue: PHOSPHOR + 18, saturation: 0.08, pull: 1 },
  // 当前窗口的标题栏条（--navy 只被用在两处，都是"当前项"的底）：暗绿条，比屏幕底亮一档。
  bar: { lightness: () => 0.15, hue: PHOSPHOR, saturation: 0.34, pull: 1 },
  // 压在深底上的浅字（窗口标题栏、开始菜单横幅）：亮绿。
  'text-on-dark': { lightness: L => clamp(L, 0.80, 0.88), hue: PHOSPHOR, saturation: 0.45, pull: 1 },
  // 指示灯等填充：饱和发光，色相归到绿/琥珀/告警红三族。
  accent: { lightness: L => clamp(L, 0.55, 0.70), saturation: 0.72, hueByFamily: true },
  // 报错文字：抬高下限，保证黑底上仍有 4.5:1。
  'accent-text': { lightness: L => clamp(L, 0.70, 0.82), saturation: 0.72, hueByFamily: true, saturationScale: 0.85 },
  // 报错的整块底板：大面积不能饱和，只在黑底上淡淡染一层告警色。
  'alert-surface': { lightness: L => 0.04 + 0.06 * L, saturation: 0.72, hueByFamily: true, saturationScale: 0.42 },
}

/** 强调色的三族：绿（指示灯）、琥珀（忙碌/注意）、红（报错）。老终端就这两种磷光加一路告警色，
 *  所以不保留亮色里的原色相，而是各自归到固定的目标色相上。 */
const ACCENT_FAMILIES = [
  { hue: PHOSPHOR, saturation: 0.72, range: [60, 185] },  // 绿
  { hue: 42, saturation: 0.80, range: [34, 60] },          // 琥珀（忙碌、注意）
  { hue: 8, saturation: 0.62, range: [345, 361] },         // 告警红
  { hue: 8, saturation: 0.62, range: [-1, 34] },           // 告警红（报错、删除、中断）
  { hue: PHOSPHOR, saturation: 0.72, range: [185, 345] },  // 蓝紫（焦点圈等）也归绿
]

/** 亮色下已经算「浅色字」的阈值：超过它说明这条文字压在深底上，暗色下要继续当浅字。 */
const LIGHT_TEXT = 0.80

/** 只有「填充」才可能是指示灯。边线、斜面、投影一律跟着各自的几何角色走——否则米黄的分隔线
 *  （虚线框、便签分隔）会被当成琥珀色指示灯留在 70% 亮度，绿屏上就多出几条金线。 */
const FILL_PROPS = ['background', 'background-color', 'background-image']

/** 正在交互或表示「当前」的选择器：悬停、焦点、按下、当前项、选中项、活动窗口、链接。
 *  这些地方用荧光绿点一下，是整张暗色桌面里绿色的主要来源（指示灯之外）。 */
const INTERACTIVE = /(:hover|:focus|:active|:focus-within|\[aria-current|\[aria-pressed="true"\]|\.selected\b|\.pressed\b|\.active-window|link|text-button)/

/** 暖色且够饱和 = 告警语义（报错、删除、中断）。暗色里给它们告警红/琥珀，而不是中性灰。
 *  文字的门槛更高：便签占位符那种淡米黄（S≈0.25）不该变成琥珀字。 */
function isWarmAlert(hue, saturation, minimum = 0.35) {
  if (saturation < minimum) return false
  return hue < 40 || hue > 330
}

/** 机箱的选择器：机器的一部分，不是屏幕里的内容——外壳、顶栏、机脚下巴、屏幕边框。
 *  它们用暗金属灰，和屏幕里的绿分开。 */
const MACHINE = /(\.marcus-desktop-page\b|\.computer-shell\b|\.computer-top\b|\.computer-brand\b|\.computer-chin\b|\.computer-signature\b|\.computer-model\b|\.speaker-slots\b|\.computer-screen\b)/

/** 一条颜色在暗色下该用哪个角色。property 决定几何角色，选择器与色值再做细分。 */
function effectiveRole(color, role, property, selector = '') {
  const { h, s, l } = rgbToHsl(color)
  if (role === 'text') {
    if (l > LIGHT_TEXT) return 'text-on-dark'
    if (isWarmAlert(h, s, 0.30)) return 'accent-text'
    return INTERACTIVE.test(selector) ? 'highlight' : role
  }
  if (role === 'edge' && INTERACTIVE.test(selector)) return 'highlight'
  if (role === 'screen' && FILL_PROPS.includes(property)) {
    // 机箱优先：外壳与屏幕边框是"机器"，不能跟着屏幕一起当黑底。（扫描线是屏幕上的效果，不算机箱）
    if (MACHINE.test(selector) && !/crt-enabled/.test(selector)) return 'machine'
    // 中间明度且够饱和的填充是指示灯（状态点、电源灯、品牌点）。
    if (s >= 0.22 && l >= 0.30 && l <= 0.75) return 'accent'
    // 亮色下那些「浅暖色底板」是报错/警告的整块底：大面积不能饱和，只淡淡染一层。
    if (l > 0.75 && s >= 0.35 && isWarmAlert(h, s)) return 'alert-surface'
    // 剩下的交互态填充（悬停、按下、当前项）：比屏幕底亮一档并更绿。
    if (INTERACTIVE.test(selector)) return 'screen-state'
  }
  return role
}

/** 两个色相之间的最短夹角（0–180）。 */
export function hueDistance(a, b) {
  return Math.abs(((a - b + 540) % 360) - 180)
}

/** 把色相沿最短弧拉向目标：amount=1 就是完全换成目标色相。 */
export function pullHue(hue, target, amount) {
  const delta = ((target - hue + 540) % 360) - 180
  return (hue + delta * amount + 360) % 360
}

/** 自定义属性的角色：它们被 var() 用到很多地方，按主要用途归类。 */
const CUSTOM_ROLES = {
  '--ink': 'text', '--sage': 'text',
  // --navy 只被用在两处，都是「当前项」的填充：活动窗口的标题栏与开始菜单的竖条。
  '--navy': 'bar',
  '--cream': 'screen', '--paper': 'screen',
  '--edge': 'edge',
  '--execution-ink': 'text', '--execution-muted': 'text',
  '--execution-border': 'edge', '--execution-surface': 'screen',
}

/** 声明属性 → 角色。scrollbar-color / filter 这类一条里含多个色的单独处理。 */
const PROP_ROLES = {
  color: 'text', 'caret-color': 'text', 'text-decoration-color': 'text',
  background: 'screen', 'background-color': 'screen', 'background-image': 'screen',
  border: 'edge', 'border-top': 'edge', 'border-right': 'edge', 'border-bottom': 'edge', 'border-left': 'edge',
  'border-color': 'edge', 'border-top-color': 'edge', 'border-right-color': 'edge',
  'border-bottom-color': 'edge', 'border-left-color': 'edge', 'border-block': 'edge', 'border-inline': 'edge',
  // 焦点圈必须看得见：它按边线映射会掉到 12% 亮度，在暗色面板上等于没有。
  outline: 'accent', 'outline-color': 'accent', 'column-rule': 'edge',
  'box-shadow': 'shadow', 'text-shadow': 'shadow', filter: 'shadow',
  'accent-color': 'accent',
}

/** scrollbar-color 是「滑块 轨道」两个色，按位置给角色。 */
const MULTI_ROLE_PROPS = { 'scrollbar-color': ['edge', 'screen'] }

/** 图片上的文字：图标标签、桌面水印、壁纸自身的画面色。
 *  这些颜色是**按那张图**调出来的，和界面明暗无关，只跳过「画在图上」的那几类属性，
 *  图标与水印的定位、描边等仍然跟着主题走。 */
const PICTURE = /(\.wallpaper-|\.night-harbor|\.desktop-watermark|\.desktop-icon\b)/
const PICTURE_PROPS = ['color', 'text-shadow', 'filter', 'background', 'background-color', 'background-image']

/** 设置面板里的壁纸选项卡、动效开关都是**界面**（.wallpaper-option / .wallpaper-motion-…），
 *  名字前缀和壁纸画面（.wallpaper-cloud 等）撞了，不能一看到 `.wallpaper-` 就当成画。 */
const WALLPAPER_UI = /\.wallpaper-(option|options|motion)/
/** 选项卡里的缩略图是「画」：它显示的就是壁纸本身。 */
const THUMBNAIL_PROPS = ['background', 'background-color', 'background-image']

/** 主题预览色块画的就是两套主题本身（浅块永远是浅的、深块永远是深的），怎么映射都是错的。 */
const FIXED = /\.theme-swatch/

/** 暗色自己重写的规则：映射出来的那版反而更差，所以这里跳过，由 handWrittenCss 提供。 */
const HAND_WRITTEN = /\.crt-enabled::after/

function fixedReason(selector, property) {
  if (FIXED.test(selector)) return '主题预览色块'
  if (HAND_WRITTEN.test(selector)) return '暗色另行重写（扫描线）'
  if (WALLPAPER_UI.test(selector)) {
    return THUMBNAIL_PROPS.includes(property) && /\.wallpaper-preview/.test(selector) ? '壁纸缩略图' : null
  }
  if (PICTURE.test(selector) && PICTURE_PROPS.includes(property)) return '图片上的颜色'
  return null
}

/** 不走「指示色」归族的选择器：这些是**装饰画与窗框**，不是状态灯。
 *  磁带是画；窗口标题栏、外壳、屏幕、任务栏是整块结构——亮色下它们可能正好是饱和的中间色
 *  （活动窗口的标题栏就是一块蓝灰），但绝不该在暗色里变成一块荧光绿。 */
const NO_ACCENT = /\.(pixel-cassette|cassette-|window-titlebar|desktop-window|computer-shell|computer-screen|desktop-taskbar|start-menu|desktop-watermark)/

/** 手调例外：自动映射在这些地方会算错（亮色下就是「浅字压深底」），按规则指定角色。 */
const RULE_OVERRIDES = [
  { selector: /\.window-titlebar\b/, property: 'color', role: 'text-on-dark' },
  { selector: /\.visitor-login-error::before/, property: 'color', role: 'text-on-dark' },
  // 电源指示灯那圈辉光是四份样式里唯一的「发光投影」：投影默认按斜面走会压暗，辉光就没了。
  { selector: /\.power-led\b/, property: 'box-shadow', role: 'accent' },
]

export const clamp = (value, low, high) => Math.min(high, Math.max(low, value))

/* ── 颜色解析与转换 ──────────────────────────────────────────────────────── */

const NAMED = { transparent: null, currentcolor: null, inherit: null, none: null }

export function parseColor(raw) {
  const text = raw.trim().toLowerCase()
  if (text in NAMED) return null
  let hex = null
  if (/^#[0-9a-f]{3}$/.test(text)) hex = text[1] + text[1] + text[2] + text[2] + text[3] + text[3]
  else if (/^#[0-9a-f]{4}$/.test(text)) hex = text[1] + text[1] + text[2] + text[2] + text[3] + text[3] + text[4] + text[4]
  else if (/^#[0-9a-f]{6,8}$/.test(text)) hex = text.slice(1)
  if (hex) {
    const n = parseInt(hex.slice(0, 6), 16)
    const alpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: alpha }
  }
  const fn = /^rgba?\(([^)]+)\)$/.exec(text)
  if (!fn) return null
  const parts = fn[1].split(/[\s,/]+/).filter(Boolean).map(Number)
  if (parts.length < 3 || parts.slice(0, 3).some(value => !Number.isFinite(value))) return null
  return { r: parts[0], g: parts[1], b: parts[2], a: Number.isFinite(parts[3]) ? parts[3] : 1 }
}

export function rgbToHsl({ r, g, b }) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === rn ? ((gn - bn) / d + (gn < bn ? 6 : 0)) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4
  return { h: h * 60, s, l }
}

export function hslToRgb({ h, s, l }) {
  if (s === 0) return { r: Math.round(l * 255), g: Math.round(l * 255), b: Math.round(l * 255) }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue = (t) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  const hh = h / 360
  return { r: Math.round(hue(hh + 1 / 3) * 255), g: Math.round(hue(hh) * 255), b: Math.round(hue(hh - 1 / 3) * 255) }
}

const hex2 = value => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0')

/** 直接取调色板里某个角色的颜色，供手写的那几条规则用（不许另写死一套色值）。 */
export function roleColor(role, overrides = {}) {
  const spec = DARK_PALETTE[role]
  const { h, s, l } = { h: spec.hue ?? PHOSPHOR, s: overrides.saturation ?? spec.saturation, l: overrides.lightness ?? spec.lightness(0.5) }
  const rgb = hslToRgb({ h, s, l })
  return `#${hex2(rgb.r)}${hex2(rgb.g)}${hex2(rgb.b)}`
}

/** 体检表里显示原始色值用。 */
function match_hex(color) {
  const alpha = color.a < 1 ? hex2(color.a * 255) : ''
  return `#${hex2(color.r)}${hex2(color.g)}${hex2(color.b)}${alpha}`
}

/** 强调色归族：绿 / 琥珀 / 告警红，各自有固定的色相与饱和度。 */
function accentFamily(hue) {
  const family = ACCENT_FAMILIES.find(entry => hue >= entry.range[0] && hue < entry.range[1])
  return family || ACCENT_FAMILIES[0]
}

/** 单个颜色 → 暗色值。role 是声明层面的角色，函数内部会按色值再细分。
 *  返回 { value, lightness, hue, role } 便于体检。 */
export function mapColor(color, role, options = {}) {
  const promoted = effectiveRole(color, role, options.property, options.selector)
  const effective = options.noAccent && promoted === 'accent' ? role : promoted
  const spec = DARK_PALETTE[effective]
  const { h, l } = rgbToHsl(color)
  const mapped = clamp(spec.lightness(l), 0, 1)
  let hue, saturation
  if (spec.hueByFamily) {
    const family = accentFamily(h)
    hue = family.hue
    saturation = spec.saturationScale ? family.saturation * spec.saturationScale : family.saturation
  } else {
    hue = pullHue(h, spec.hue, spec.pull)
    saturation = spec.saturation
  }
  const rgb = hslToRgb({ h: hue, s: saturation, l: mapped })
  const alpha = color.a < 1 ? hex2(color.a * 255) : ''
  return { value: `#${hex2(rgb.r)}${hex2(rgb.g)}${hex2(rgb.b)}${alpha}`, lightness: mapped, saturation, hue, sourceLightness: l, role: effective }
}

/** 引用主题 token 的声明：这些 token 在暗色下会变，所以规则也要有一条暗色副本。 */
const THEMED_VAR = /var\(\s*--(ink|cream|paper|edge|sage|navy|execution-[a-z-]+)[\s,)]/

const COLORISH_SOURCE = '#[0-9a-fA-F]{3,8}\\b|rgba?\\([^)]*\\)|(?:^|[\\s,(])(?:transparent|currentColor|inherit)\\b'
/** 每次都新建正则：带 g 的正则对象有 lastIndex 状态，复用会漏匹配。 */
const colorRegex = () => new RegExp(COLORISH_SOURCE, 'g')

/** 把一个声明值里的所有颜色换成暗色版本。 */
export function mapValue(value, role, roles = null, options = {}) {
  let index = 0
  return value.replace(colorRegex(), (match) => {
    const color = parseColor(match)
    if (!color) return match
    const useRole = roles ? roles[Math.min(index++, roles.length - 1)] : role
    return mapColor(color, useRole, options).value
  })
}

/* ── CSS 解析（够用即可：这份样式表是手写规整的，没有嵌套规则）────────────── */

/** 把文件切成节点树：{ type:'rule'|'at', prelude, selector, body, comments, children } */
export function parseCss(text) {
  const nodes = []
  let i = 0
  let pending = ''
  while (i < text.length) {
    const ch = text[i]
    if (ch === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2)
      pending += text.slice(i, end === -1 ? text.length : end + 2)
      i = end === -1 ? text.length : end + 2
      continue
    }
    if (ch === '}' || ch === ';') { i += 1; continue }
    if (/\s/.test(ch)) { i += 1; continue }
    // 读到 { 或 ; 为止，就是一条 prelude
    let depth = 0
    let end = i
    for (; end < text.length; end += 1) {
      const c = text[end]
      if (c === '(') depth += 1
      else if (c === ')') depth -= 1
      else if (depth === 0 && (c === '{' || c === ';')) break
    }
    const prelude = text.slice(i, end).trim()
    const next = text[end]
    if (next === ';' || end >= text.length) { // @import 之类没有块的语句
      nodes.push({ type: 'raw', prelude, comments: pending })
      pending = ''
      i = end + 1
      continue
    }
    // 找配对的 }
    let brace = 0
    let close = end
    for (; close < text.length; close += 1) {
      if (text[close] === '{') brace += 1
      else if (text[close] === '}') { brace -= 1; if (brace === 0) break }
    }
    const body = text.slice(end + 1, close)
    const node = prelude.startsWith('@')
      ? { type: 'at', prelude, children: parseCss(body), comments: pending }
      : { type: 'rule', selector: prelude, declarations: parseDeclarations(body), comments: pending }
    nodes.push(node)
    pending = ''
    i = close + 1
  }
  return nodes
}

function parseDeclarations(body) {
  return body.split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const at = part.indexOf(':')
    return { property: part.slice(0, at).trim(), value: part.slice(at + 1).trim() }
  }).filter(declaration => declaration.property)
}

/** 给选择器加上作用域：一律在前面挂 `html[data-theme="dark"] .marcus-desktop-page`。
 *  源文件里有些规则写成裸 `.computer-shell`（没有根类），所以缺根类时要补上，
 *  保证每条暗色规则都只在桌面里生效、并且优先级必定高于对应的亮色规则。 */
export function scopeSelector(selector, prefix = SCOPE_PREFIX, root = SCOPE_ROOT) {
  return selector.split(',').map(part => part.trim()).filter(Boolean)
    .map(part => part.startsWith(root) ? `${prefix} ${part}` : `${prefix} ${root} ${part}`)
    .join(', ')
}

/* ── 生成 ────────────────────────────────────────────────────────────────── */

/** 一条声明该用哪个角色，以及要不要禁止「指示色」归族（分隔线、装饰画都不是状态灯）。 */
function roleSpec(property, selector) {
  const override = RULE_OVERRIDES.find(rule => rule.selector.test(selector) && (!rule.property || rule.property === property))
  const noAccent = Boolean(override && override.noAccent) || NO_ACCENT.test(selector)
  if (override && override.role) return { role: override.role, noAccent }
  if (property.startsWith('--')) return { role: CUSTOM_ROLES[property] || null, noAccent }
  return { role: PROP_ROLES[property] || null, noAccent }
}

/** 逐条规则产出暗色版本，同时收集体检数据。 */
export function buildDarkCss(sources = SOURCES.map(relative => ({ relative, text: readFileSync(join(ROOT, relative), 'utf8') }))) {
  // 每条规则各自收集，返回局部数组：早先共用累加器会让 @media 的子节点指回自己，栈溢出。
  const report = { mapped: new Map(), skipped: [], unknown: [], tokenRules: 0, rules: 0, declarations: 0 }
  const note = (table, key, extra) => {
    const row = table.get(key) || { count: 0, ...extra }
    row.count += 1
    table.set(key, row)
  }

  const walk = (nodes, atPath) => {
    const out = []
    for (const node of nodes) {
      if (node.type === 'raw') continue
      if (node.type === 'at') {
        // @keyframes 里的选择器是 0%/100%，套作用域会失效，而且当前没有关键帧定义颜色。
        if (node.prelude.startsWith('@keyframes')) {
          if (JSON.stringify(node.children).match(/#[0-9a-fA-F]{3,8}\b/)) report.unknown.push({ at: node.prelude, reason: '关键帧里有颜色，需要人工确认' })
          continue
        }
        const children = walk(node.children, atPath)
        if (children.length) out.push({ at: node.prelude, comments: node.comments, children })
        continue
      }
      const lines = []
      for (const { property, value } of node.declarations) {
        const colors = (value.match(colorRegex()) || []).map(parseColor).filter(Boolean)
        // 只引用主题 token 的声明（`background: var(--navy)`）本身没有色值，但它会跟着 token 变；
        // 而且**必须**有对应的一条：作用域提升了优先级，否则基准规则会盖过更具体的变体规则
        // （活动窗口的标题栏就这样被"未激活"的底色吃掉过）。
        if (!colors.length) {
          if (THEMED_VAR.test(value)) {
            report.tokenRules += 1
            lines.push(`${property}: ${value};`)
          }
          continue
        }
        const fixed = fixedReason(node.selector, property)
        if (fixed) {
          report.skipped.push({ file: atPath, selector: node.selector, property, reason: fixed })
          for (const color of colors) note(report.mapped, `skip ${property}`, { sourceLightness: color ? rgbToHsl(color).l : 0, lightness: 0, role: 'skip', selector: node.selector })
          continue
        }
        const roles = MULTI_ROLE_PROPS[property]
        const spec = roleSpec(property, node.selector)
        const baseRole = roles ? roles[0] : spec.role
        if (!baseRole) {
          report.unknown.push({ file: atPath, selector: node.selector, property, value })
          continue
        }
        const options = { noAccent: spec.noAccent, property, selector: node.selector }
        const mapped = mapValue(value, baseRole, roles, options)
        colors.forEach((color, index) => {
          if (!color) return
          const useRole = roles ? roles[Math.min(index, roles.length - 1)] : baseRole
          const result = mapColor(color, useRole, options)
          note(report.mapped, `${result.role} ${match_hex(color)} → ${result.value}`, {
            sourceLightness: result.sourceLightness, lightness: result.lightness, hue: result.hue, saturation: result.saturation, role: result.role, selector: node.selector,
          })
        })
        if (mapped !== value || property.startsWith('--')) lines.push(`${property}: ${mapped};`)
      }
      if (!lines.length) continue
      report.rules += 1
      report.declarations += lines.length
      out.push({ selector: scopeSelector(node.selector), comments: node.comments, declarations: lines })
    }
    return out
  }
  const tree = walk(sources.flatMap(source => parseCss(source.text)), '')
  const extra = EXTRA_RULES.map(rule => ({ selector: scopeSelector(rule.selector), comments: '', declarations: rule.declarations }))
  return { tree: [...extra, ...tree], extraCss: handWrittenCss(), report }
}

/** 手写的那几条：反白高亮与屏幕玻璃感。值仍从调色板取，不许另写死一套颜色。 */
export function handWrittenCss() {
  const scope = `${SCOPE_PREFIX} ${SCOPE_ROOT}`
  const fill = roleColor('inverse')
  const ink = roleColor('screen', { lightness: 0.05, saturation: 0.35 })
  const glow = roleColor('highlight', { lightness: 0.72, saturation: 0.6 })
  return [
    ...INVERSE_SELECTORS.map(selector => [
      `${scope} ${selector}, ${scope} ${selector} * {`,
      `  background: ${fill}; color: ${ink}; border-color: ${fill};`,
      `  box-shadow: 0 0 7px ${glow}59; text-shadow: none;`,
      `}`,
    ].join('\n')),
    screenGlass(scope, glow),
    scanlines(scope),
  ]
}

const HEADER = `/* 桌面暗色主题 —— 由 scripts/desktop-theme.mjs 生成，请勿手改。
 *
 * 改法：改亮色 CSS（desktop.css / desktop-software.css / music-app.css / agent-progress.css），
 * 或改生成器里的 DARK_PALETTE / RULE_OVERRIDES，然后 npm run theme:dark。
 * 测试会校验这份文件与亮色 CSS 保持同步，手改会被 \`npm test\` 逮住。
 *
 * 每条规则都挂在 ${SCOPE_PREFIX} ${SCOPE_ROOT} 下面：只有桌面打开暗色时生效，
 * 亮色主题与站内助手面板都不受影响。图片上的颜色（壁纸、图标标签、水印）按原样保留。
 */
`

export function renderCss(tree, extraCss = []) {
  const lines = []
  const emit = (nodes, indent) => {
    for (const node of nodes) {
      if (node.comments) lines.push(`${indent}${node.comments.replace(/\n\s*/g, `\n${indent}`)}`)
      if (node.at) {
        lines.push(`${indent}${node.at} {`)
        emit(node.children, `${indent}  `)
        lines.push(`${indent}}`)
        continue
      }
      lines.push(`${indent}${node.selector} { ${node.declarations.join(' ')} }`)
    }
  }
  emit(tree, '')
  const extra = extraCss.length ? `\n/* 反白高亮与屏幕玻璃感：手写，色值取自调色板 */\n${extraCss.join('\n')}\n` : ''
  return `${HEADER}${lines.join('\n')}\n${extra}`
}

function printReport(report) {
  const rows = [...report.mapped.entries()].filter(([key]) => !key.startsWith('skip ')).sort((a, b) => b[1].count - a[1].count)
  const byRole = new Map()
  for (const [key, row] of rows) {
    const role = row.role || key.split(' ')[0]
    if (!byRole.has(role)) byRole.set(role, [])
    byRole.get(role).push([key, row])
  }
  for (const [role, list] of byRole) {
    console.log(`\n== ${role} (${list.length} 种) ==`)
    for (const [key, row] of list) console.log(`  ${String(row.count).padStart(3)}×  ${key.padEnd(34)} 亮 ${(row.sourceLightness ?? 0).toFixed(2)} → 暗 ${(row.lightness ?? 0).toFixed(2)}   ${row.selector || ''}`)
  }
  console.log(`\n规则 ${report.rules} 条 / 声明 ${report.declarations} 条（其中跟随主题 token 的 ${report.tokenRules} 条）`)
  const skipped = [...new Set(report.skipped.map(row => `${row.selector} { ${row.property} }`))]
  console.log(`
跳过（图片上的颜色）${report.skipped.length} 处：${skipped.slice(0, 8).join(' / ')}${skipped.length > 8 ? ` …共 ${skipped.length} 种` : ''}`)
  // 自检：暗色里面板类不该还亮着，文字类不该还暗着；有的话就是映射出了问题，要进 RULE_OVERRIDES。
  const suspicious = rows.filter(([, row]) => (row.role === 'screen' && row.lightness > 0.18)
    || (row.role === 'machine' && row.lightness > 0.25)
    || (row.role === 'edge' && row.lightness > 0.62)
    || (row.role === 'shadow' && row.lightness > 0.55)
    || (row.role === 'text' && row.lightness < 0.52))
  console.log(suspicious.length ? `可疑映射 ${suspicious.length} 处（暗色下仍然亮/暗）：` : '可疑映射：无')
  for (const [key, row] of suspicious) console.log(`  ${key.padEnd(34)} → 暗 ${row.lightness.toFixed(2)}   ${row.selector || ''}`)
  // 色相自检：屏幕里的颜色（正文/底/边线/斜面/交互绿）必须是磷光绿系——这是「别让米白的
  // 暖调渗回来变成橄榄金」的守卫；机箱（外壳）反过来要求**够中性**（饱和度 ≤0.12）而不是够绿；
  // 归族的强调角色（指示灯、报错文字、报错底板）只允许落在绿/琥珀/告警红三族。
  const FAMILY_ROLES = ['accent', 'accent-text', 'alert-surface']
  const OFF_BAND = rows.filter(([, row]) => {
    if (typeof row.hue !== 'number') return false
    if (FAMILY_ROLES.includes(row.role)) return !ACCENT_FAMILIES.some(family => hueDistance(row.hue, family.hue) <= 6)
    if (row.role === 'machine') return (row.saturation ?? 0) > 0.12
    return hueDistance(row.hue, PHOSPHOR) > 12
  })
  console.log(OFF_BAND.length ? `色相出界 ${OFF_BAND.length} 处：` : `色相自检：屏幕色相全在磷光绿 ±12° 内、机箱够中性，强调色只落在绿/琥珀/告警红三族`)
  for (const [key, row] of OFF_BAND.slice(0, 8)) console.log(`  ${key.padEnd(34)} → H ${row.hue.toFixed(0)}   ${row.selector || ''}`)
  if (report.unknown.length) console.log(`需要人工确认 ${report.unknown.length} 处：` + report.unknown.slice(0, 8).map(row => `${row.selector} { ${row.property}: ${row.value} }`).join(' / '))
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const mode = process.argv[2]
  const { tree, extraCss, report } = buildDarkCss()
  if (mode === '--report') {
    printReport(report)
  } else if (mode === '--check') {
    const current = readFileSync(OUT, 'utf8')
    const next = renderCss(tree, extraCss)
    if (current !== next) {
      console.error('desktop-dark.css 与亮色 CSS 不同步：请运行 npm run theme:dark 重新生成')
      process.exit(1)
    }
    console.log('desktop-dark.css 与亮色 CSS 同步')
  } else {
    writeFileSync(OUT, renderCss(tree, extraCss), 'utf8')
    console.log(`已写出 ${OUT}`)
    console.log(`规则 ${report.rules} 条 / 声明 ${report.declarations} 条，跳过图片上的颜色 ${report.skipped.length} 处`)
  }
}
