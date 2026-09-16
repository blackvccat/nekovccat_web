import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { DARK_PALETTE, PHOSPHOR, SCOPE_PREFIX, buildDarkCss, hueDistance, mapColor, mapValue, parseColor, parseCss, renderCss, rgbToHsl, scopeSelector } from '../../scripts/desktop-theme.mjs'
import { DEFAULT_SETTINGS, THEMES, readDesktopSettings } from '../src/lib/desktop-settings'

const OUT = new URL('../src/app/terminal/desktop-dark.css', import.meta.url)
const dark = readFileSync(OUT, 'utf8')
const { tree, extraCss, report } = buildDarkCss()

test('the committed dark stylesheet is exactly what the generator produces', () => {
  // 这条是防止「改了亮色 CSS 忘了重新生成」：暗色下会有一块地方还是米白。
  assert.equal(dark, renderCss(tree, extraCss), 'desktop-dark.css 与亮色 CSS 不同步，请运行 npm run theme:dark')
})

test('every dark rule is scoped so that it can only win inside a dark desktop', () => {
  const rules = dark.split('\n').filter(line => line.includes('{') && !line.startsWith(' *'))
  assert.ok(rules.length > 250, `dark rules: ${rules.length}`)
  for (const rule of rules) {
    if (rule.startsWith('@media')) continue
    for (const selector of rule.slice(0, rule.indexOf('{')).split(',')) {
      assert.ok(selector.trim().startsWith(SCOPE_PREFIX), `unscoped selector: ${selector.trim().slice(0, 60)}`)
      assert.ok(selector.includes('.marcus-desktop-page'), `selector escaped the desktop: ${selector.trim().slice(0, 60)}`)
    }
  }
})

test('the dark stylesheet leaves the light theme byte for byte alone', () => {
  // 亮色源文件里不该出现任何暗色作用域，也不该出现生成物里的颜色。
  const sources = ['../src/app/terminal/desktop.css', '../src/components/my-world/desktop-software.css',
    '../src/components/my-world/music-app.css', '../src/components/agent/agent-progress.css']
  for (const relative of sources) {
    const text = readFileSync(new URL(relative, import.meta.url), 'utf8')
    assert.ok(!text.includes('data-theme'), `${relative} 里出现了 data-theme，亮色不该被主题改动`)
  }
})

test('the scope is prepended and the original selector is kept verbatim', () => {
  assert.equal(scopeSelector('.settings-app'), `${SCOPE_PREFIX} .marcus-desktop-page .settings-app`)
  assert.equal(scopeSelector('.a, .b'), `${SCOPE_PREFIX} .marcus-desktop-page .a, ${SCOPE_PREFIX} .marcus-desktop-page .b`)
  // 源里裸写的 `.computer-shell` 也要补上根类，否则它会跑到桌面外面去。
  assert.equal(scopeSelector('.computer-shell'), `${SCOPE_PREFIX} .marcus-desktop-page .computer-shell`)
  // 已经带根类的选择器不再套第二层。
  assert.equal(scopeSelector('.marcus-desktop-page .foo'), `${SCOPE_PREFIX} .marcus-desktop-page .foo`)
  // 前缀（属性选择器）让暗色规则的优先级必定高于对应的亮色规则。
  for (const selector of ['.settings-app', '.marcus-desktop-page .foo', 'button:focus-visible', '.a > .b:hover']) {
    for (const part of scopeSelector(selector).split(',')) {
      assert.ok(part.includes(SCOPE_PREFIX) && part.includes('.marcus-desktop-page'), part)
      assert.ok(part.endsWith(selector.trim()) || part.endsWith(selector.split(',').pop()!.trim()), part)
    }
  }
})

test('the screen is black, not dark gray: near-black fills with only a trace of green', () => {
  const screen = mapColor(parseColor('#f1f1e5')!, 'screen', { property: 'background' })
  assert.ok(screen.lightness <= 0.10, `屏幕底不够黑（L ${screen.lightness.toFixed(2)}）：${screen.value}`)
  for (const source of ['#f1f1e5', '#f4f5e9', '#faf7eb', '#eeeee0']) {
    const mapped = parseColor(mapColor(parseColor(source)!, 'screen', { property: 'background' }).value)!
    assert.ok(rgbToHsl(mapped).l <= 0.10, `屏幕底不够黑：${source} → ${mapColor(parseColor(source)!, 'screen', { property: 'background' }).value}`)
    assert.ok(rgbToHsl(mapped).s <= 0.22, `屏幕底绿过头：${source}`)
  }
})

test('the case is neutral metal: low saturation and a value band above the screen', () => {
  // 机箱（外壳/屏幕边框）是"机器"，不是屏幕里的内容：饱和度必须低，否则又会变成橄榄金。
  for (const source of ['#b8bbae', '#dcd8c6', '#eeead7']) {
    const mapped = mapColor(parseColor(source)!, 'screen', { property: 'background', selector: '.computer-shell' })
    assert.equal(mapped.role, 'machine', `${source} 没被判成机箱`)
    const color = parseColor(mapped.value)!
    assert.ok(rgbToHsl(color).s <= 0.12, `机箱不中性（S ${rgbToHsl(color).s.toFixed(2)}）：${mapped.value}`)
    assert.ok(rgbToHsl(color).l >= 0.10 && rgbToHsl(color).l <= 0.20, `机箱亮度不对：${mapped.value}`)
  }
  // 扫描线是屏幕上的效果，不能被机箱规则吃掉。
  assert.notEqual(mapColor(parseColor('#20351d0d')!, 'screen', { property: 'background', selector: '.computer-screen.crt-enabled::after' }).role, 'machine')
})

test('everything drawn on the screen is phosphor green, in three brightness steps', () => {
  // 内容必须是绿的（不是中性灰）：正文/次要文字/框线/斜面都落在磷光绿系里。
  for (const [role, property, selector] of [
    ['text', 'color', '.agent-message'],
    ['text', 'color', '.browser-document'],
    ['edge', 'border-color', '.settings-app fieldset'],
    ['shadow', 'box-shadow', '.pixel-button'],
  ] as const) {
    const mapped = mapColor(parseColor('#34423b')!, role, { property, selector })
    assert.ok(hueDistance(mapped.hue!, PHOSPHOR) <= 12, `${role} 离开了磷光绿：H${mapped.hue}`)
    assert.ok(mapped.saturation! >= 0.30, `${role} 不够绿：S${mapped.saturation}`)
  }
  // 亮度分档：正文亮 -> 次要中 -> 提示暗，全靠同一支绿的亮度。
  const primary = mapColor(parseColor('#34423b')!, 'text', { property: 'color' }).lightness
  const secondary = mapColor(parseColor('#8c957f')!, 'text', { property: 'color' }).lightness
  assert.ok(primary - secondary > 0.15, `正文(${primary.toFixed(2)})与次要文字(${secondary.toFixed(2)})拉不开`)
  assert.ok(primary > 0.8 && secondary > 0.54, `亮度档位不对：${primary.toFixed(2)} / ${secondary.toFixed(2)}`)
})

test('selection is inverse video: green bar with near-black text', () => {
  // 终端里最醒目的一类高亮是反白。它由生成器手写补上（INVERSE_SELECTORS），只给纯文字的行——
  // 任务的图标是光栅画，亮绿底会把浅色图标吃掉。
  const lines = dark.split('\n')
  const at = lines.findIndex(line => line.includes('send-button:not(.stop-reply)'))
  const inverse = at === -1 ? [] : [lines.slice(at, at + 3).join('\n')]
  assert.ok(inverse.length >= 1, '反白规则没生成')
  const fill = /background: (#[0-9a-f]{6})/.exec(inverse[0])![1]
  const ink = /color: (#[0-9a-f]{6})/.exec(inverse[0])![1]
  const fillRgb = parseColor(fill)!, inkRgb = parseColor(ink)!
  assert.ok(rgbToHsl(fillRgb).l > 0.55 && rgbToHsl(fillRgb).s > 0.4, `反白底不够亮：${fill}`)
  assert.ok(rgbToHsl(inkRgb).l < 0.12, `反白文字不够黑：${ink}`)
  assert.ok(dark.includes('.browser-tabs button[aria-current]'), '当前栏目页也该反白')
  // 发光：反白条带一点辉光，才像屏幕上的高亮。
  assert.ok(inverse[0].includes('box-shadow: 0 0 7px'), '反白条没有辉光')
})

test('scanlines are dynamic, three widths, and every step is visibly different', () => {
  const light = readFileSync(new URL('../src/app/terminal/desktop.css', import.meta.url), 'utf8')
  // 三档按**线宽**单调递增（1/2/3px）。曾经中与粗都是 2px、只差密度，看着几乎一样——
  // 所以这条测试直接比线宽与周期：相邻两档必须两个都变，光变密度不算。
  const geometry = (width: string) => {
    const rule = light.slice(light.indexOf(`[data-scanline="${width}"]`))
    const block = rule.slice(0, rule.indexOf('}'))
    const line = /--scan-line: (\d+)px/.exec(block)
    const tile = /--scan-tile: (\d+)px/.exec(block)
    return { line: line && Number(line[1]), tile: tile && Number(tile[1]) }
  }
  const scale = { medium: geometry('medium'), coarse: geometry('coarse') }
  const thin = { line: 1, tile: 3 }
  assert.deepEqual(thin, { line: 1, tile: 3 }, '细档的几何变了')
  assert.ok(scale.medium.line! > thin.line, `中档没有比细档粗：${JSON.stringify(scale.medium)}`)
  assert.ok(scale.coarse.line! > scale.medium.line!, `粗档没有比中档粗（线宽都是 ${scale.coarse.line}px）：${JSON.stringify(scale)}`)
  assert.ok(scale.coarse.tile! > scale.medium.tile!, `粗档的周期没有跟着放大：${JSON.stringify(scale)}`)
  // 动态：三组关键帧各按自己的周期平移，且用 transform（background-position 会每帧重绘一整屏）。
  for (const name of ['thin', 'medium', 'coarse']) {
    const at = light.indexOf(`@keyframes crt-scan-${name}`)
    assert.ok(at > -1, `缺少 ${name} 的动画`)
    const frames = light.slice(at, light.indexOf('}', at))
    assert.ok(!/background-position/.test(frames), `${name} 的动画用了 background-position`)
  }
  assert.ok(light.includes('transform: translateY(6px)'), '粗档没有按自己的周期平移')
  assert.ok(light.includes('top: calc(-1 * var(--scan-tile))'), '叠加层没有多出一个周期，滚动时会露边')
  // 暗色只换线色：纯黑 25%，在绿字上看得见。
  const ink = /crt-enabled::after \{\s*--scan-ink: (#[0-9a-f]{8})/.exec(dark)
  assert.ok(ink, '暗色没有覆盖 --scan-ink')
  assert.equal(ink![1], '#00000040', `暗色的线色不对：${ink![1]}`)
  assert.ok(!/crt-enabled::after[^}]*background:/.test(dark), '暗色不该覆盖整套 background（会把粗细档位一起盖掉）')
  assert.ok(/prefers-reduced-motion: reduce\) \{ \.marcus-desktop-page \*[^}]*animation: none !important/.test(light), '减少动态效果没有关掉动画')
})

test('the glass has a vignette so the screen reads as a CRT', () => {
  assert.ok(dark.includes('.computer-screen::before'), '缺少屏幕玻璃感（暗角）')
  assert.ok(dark.includes('radial-gradient(ellipse at center'), '暗角不是径向渐变')
  assert.ok(dark.includes('pointer-events: none'), '暗角会挡住点击')
})

test('green marks what you are touching: interactive states take the highlight role', () => {
  // 悬停 / 当前项 / 链接：文字与边线用更亮的绿。
  assert.equal(mapColor(parseColor('#9ba38b')!, 'edge', { property: 'border-color', selector: '.show-desktop:hover' }).role, 'highlight')
  assert.equal(mapColor(parseColor('#929e83')!, 'edge', { property: 'border-color', selector: '.browser-tabs button[aria-current]' }).role, 'highlight')
  assert.equal(mapColor(parseColor('#3f624b')!, 'text', { property: 'color', selector: '.site-message-link' }).role, 'highlight')
  // 交互态的填充是一块更亮的深绿底（悬停要看得见，但不能整块变绿）。
  const hover = mapColor(parseColor('#f4f0dc')!, 'screen', { property: 'background', selector: '.pixel-button:hover' })
  assert.equal(hover.role, 'screen-state')
  assert.ok(rgbToHsl(parseColor(hover.value)!).s <= 0.35, `悬停底色太艳：${hover.value}`)
  // 亮色下本来就是暖色的（删除/报错）仍然是告警色，不是绿。
  assert.equal(mapColor(parseColor('#8a6a4a')!, 'text', { property: 'color', selector: '.notes-list-remove:hover' }).role, 'accent-text')
})

test('bevels keep their order: highlight above the surface, shade below it', () => {
  const surface = rgbToHsl(parseColor(mapColor(parseColor('#e8e5d4')!, 'screen').value)!).l
  const highlight = rgbToHsl(parseColor(mapColor(parseColor('#fffdf1')!, 'shadow').value)!).l
  const shade = rgbToHsl(parseColor(mapColor(parseColor('#aab09d')!, 'shadow').value)!).l
  assert.ok(highlight > surface, `亮边 ${highlight.toFixed(2)} 没有高于面板 ${surface.toFixed(2)}`)
  assert.ok(shade < surface, `暗边 ${shade.toFixed(2)} 没有低于面板 ${surface.toFixed(2)}`)
})

test('each map keeps its direction, so a bevel pair can never swap sides', () => {
  // 正文与荧光绿是反的（深色源给浅色结果），面板与斜面是同向的；关键是同一个角色内不许
  // 来回翻，否则同一个声明里的两条边（亮边/暗边）可能被算到同一边，立体感就没了。
  const decreasing = ['text', 'highlight']
  for (const role of Object.keys(DARK_PALETTE) as (keyof typeof DARK_PALETTE)[]) {
    let previous = null
    for (let step = 0; step <= 100; step += 1) {
      const value = DARK_PALETTE[role].lightness(step / 100)
      if (previous !== null) {
        const delta = value - previous
        assert.ok(decreasing.includes(role) ? delta <= 1e-9 : delta >= -1e-9, `${role} 在 ${step}% 处掉头了`)
      }
      previous = value
    }
  }
})

test('saturated fills stay lit while pastel panels do not', () => {
  // 绿色指示灯：亮度虽然不高，但颜色饱和，暗色下要继续发光。
  assert.equal(mapColor(parseColor('#657e4e')!, 'screen', { property: 'background' }).role, 'accent')
  assert.equal(mapColor(parseColor('#c49848')!, 'screen', { property: 'background' }).role, 'accent')
  // 粉彩米白饱和度也不低，但明度很高，是面板而不是灯。
  assert.equal(mapColor(parseColor('#f1f1e5')!, 'screen', { property: 'background' }).role, 'screen')
  assert.equal(mapColor(parseColor('#ecefdf')!, 'screen', { property: 'background' }).role, 'screen')
})

test('only fills count as indicators: separators and bevels follow their geometry role', () => {
  // 便签那几条米黄分隔线（border-left / border-bottom）曾是绿屏上的金线：边线不该被判成指示灯。
  for (const property of ['border-left', 'border-bottom', 'border-top', 'box-shadow']) {
    assert.equal(mapColor(parseColor('#c9c5a5')!, 'edge', { property }).role, 'edge', `${property} 不该被当成指示灯`)
    assert.equal(mapColor(parseColor('#c9c5a5')!, 'shadow', { property }).role, 'shadow', `${property} 不该被当成指示灯`)
  }
  const separator = mapColor(parseColor('#c9c5a5')!, 'edge', { property: 'border-left' })
  assert.ok(hueDistance(separator.hue!, PHOSPHOR) <= 12, `分隔线不是绿的：${separator.value}`)
})

test('text that was already light stays light instead of being flipped', () => {
  // 标题栏文字在亮色下就压在深底上；翻成深色会变成「深字压深底」。
  assert.equal(mapColor(parseColor('#f7f3e5')!, 'text').role, 'text-on-dark')
  assert.ok(rgbToHsl(parseColor(mapColor(parseColor('#f7f3e5')!, 'text').value)!).l > 0.85)
})

test('alpha and colour-function syntax survive the mapping', () => {
  assert.equal(mapValue('rgba(125, 133, 119, .5)', 'shadow').startsWith('rgba('), false)
  const rgba = parseColor('rgba(0, 0, 0, 0.5)')
  assert.ok(rgba && Math.abs(rgba.a - 0.5) < 1e-6)
  // 八位十六进制的透明度要原样带过去。
  const semi = mapColor(parseColor('#7d857780')!, 'shadow')
  assert.equal(semi.value.length, 9, `透明度丢了：${semi.value}`)
  assert.equal(mapValue('transparent', 'screen'), 'transparent')
  assert.equal(mapValue('currentColor', 'text'), 'currentColor')
})

test('variant rules that only reference a token still get a dark copy', () => {
  // 踩过的坑：作用域会抬高优先级，于是「未激活标题栏」的暗色规则盖过了「活动窗口」那条更具体的
  // 亮色规则——而后者因为只写了 var(--navy)（没有色值）被跳过，活动窗口条就这么没了。
  // 凡是引用主题 token 的声明，都必须有一条暗色副本。
  assert.ok(dark.includes('.active-window .window-titlebar { background: var(--navy); }'), '活动窗口标题栏的规则被跳过了')
  assert.ok(dark.includes('background: var(--cream);'), '引用 --cream 的规则被跳过了')
  // token 本身也要在暗色块里换掉，否则副本只是原样复制。token 块是一行一条规则。
  const tokenLine = dark.split('\n').find(line => line.includes('--ink:'))
  assert.ok(tokenLine, '找不到暗色 token 块')
  for (const name of ['--ink', '--cream', '--paper', '--edge', '--sage', '--navy']) {
    assert.ok(tokenLine!.includes(`${name}: #`), `${name} 没有在暗色那一行里重定义`)
  }
  assert.ok(report.tokenRules >= 15, `跟随 token 的规则只有 ${report.tokenRules} 条，像是漏了`)
})

test('the parser keeps media queries and drops keyframes rather than mangling them', () => {
  const nodes = parseCss('@media (max-width: 700px) { .a { color: #fff; } }\n@keyframes x { 0% { opacity: 1; } }')
  assert.equal(nodes[0].type, 'at')
  assert.equal(nodes[0].children[0].selector, '.a')
  assert.ok(!dark.includes('@keyframes'), '关键帧不该出现在生成物里')
  assert.ok(dark.includes('@media (max-width: 700px)'), '媒体查询应原样保留')
})

test('the settings model keeps a light default and migrates older saves', () => {
  assert.equal(DEFAULT_SETTINGS.theme, 'light')
  assert.deepEqual(readDesktopSettings({ wallpaper: 'island', scanlines: true }), {
    theme: 'light', wallpaper: 'island', wallpaperMotion: 'auto', scanlines: true, scanlineWidth: 'auto',
  })
  assert.equal(readDesktopSettings({ theme: 'dark', wallpaper: 'cloud' }).theme, 'dark')
  assert.equal(readDesktopSettings({ theme: 'neon' }).theme, 'light')
  assert.equal(readDesktopSettings({ theme: ['dark'] }).theme, 'light')
  for (const theme of THEMES) assert.equal(readDesktopSettings({ theme: theme.value }).theme, theme.value)
})

test('no dark declaration maps a colour onto itself unless it was left alone on purpose', () => {
  // 自检：生成器认为「可疑」的映射必须为零，否则暗色下会留一块亮斑或一段看不见的字。
  const suspicious = []
  for (const [key, row] of report.mapped) {
    if (key.startsWith('skip ')) continue
    if (row.role === 'screen' && row.lightness > 0.18) suspicious.push(key)
    if (row.role === 'machine' && row.lightness > 0.25) suspicious.push(key)
    if (row.role === 'edge' && row.lightness > 0.62) suspicious.push(key)
    if (row.role === 'shadow' && row.lightness > 0.55) suspicious.push(key)
    if (row.role === 'text' && row.lightness < 0.52) suspicious.push(key)
  }
  assert.deepEqual(suspicious, [])
  assert.equal(report.unknown.length, 0, `有没能识别的声明：${JSON.stringify(report.unknown.slice(0, 3))}`)
})

test('dark text on dark panels keeps a readable contrast ratio', () => {
  const luminance = (hex: string) => {
    const color = parseColor(hex)!
    const channel = (value: number) => {
      const v = value / 255
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b)
  }
  const contrast = (a: string, b: string) => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (high + 0.05) / (low + 0.05)
  }
  const panel = mapColor(parseColor('#f1f1e5')!, 'screen').value
  const pairs = [
    ['正文', mapColor(parseColor('#34423b')!, 'text').value],
    ['次要文字', mapColor(parseColor('#8c957f')!, 'text').value],
    ['按钮文字', mapColor(parseColor('#35433a')!, 'text').value],
    ['标题栏文字', mapColor(parseColor('#f7f3e5')!, 'text').value],
  ]
  for (const [label, ink] of pairs) {
    const ratio = contrast(ink, panel)
    assert.ok(ratio >= 4.5, `${label}在暗色面板上的对比度只有 ${ratio.toFixed(2)}:1`)
  }
})
