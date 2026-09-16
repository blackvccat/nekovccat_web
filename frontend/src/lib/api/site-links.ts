// 桌面在 /terminal；域名根路径属于主站，不在应用内，所以 '/' 不作为站内链接。
const SITE_PATHS = new Set(['/about', '/terminal', '/contact', '/terminal?app=explorer&tab=about', '/terminal?app=explorer&tab=projects', '/terminal?app=explorer&tab=gallery', '/terminal?app=explorer&tab=contact'])

export type SiteTextPart = { text: string; href?: string }

/** Only known desktop documents and local routes may become links. Everything else stays text. */
export function splitSiteLinks(content: string): SiteTextPart[] {
  const parts: SiteTextPart[] = []
  const pattern = /(?<!!)\[([^\]\n]+)\]\(([^\s)]+)\)/g
  let offset = 0
  for (const match of content.matchAll(pattern)) {
    const index = match.index ?? 0
    if (!SITE_PATHS.has(match[2])) continue
    if (index > offset) parts.push({ text: content.slice(offset, index) })
    parts.push({ text: match[1], href: match[2] })
    offset = index + match[0].length
  }
  if (offset < content.length) parts.push({ text: content.slice(offset) })
  return parts
}
