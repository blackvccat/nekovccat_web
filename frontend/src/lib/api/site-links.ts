const SITE_PATHS = new Set(['/', '/about', '/my-world', '/contact', '/my-world?app=explorer&tab=about', '/my-world?app=explorer&tab=projects', '/my-world?app=explorer&tab=minecraft', '/my-world?app=explorer&tab=contact', '/my-world?app=sponsor'])

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
