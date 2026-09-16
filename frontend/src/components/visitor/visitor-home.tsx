'use client'

import { useVisitorMode } from '@/components/visitor/visitor-mode'
import PixelIcon, { PixelImage } from '@/components/my-world/pixel-icon'
import { visitorAppIcon } from '@/lib/visitor-view'

/** 登录后的访客页：只列出这个访客被授权的应用，并提供退出访客模式的按钮。 */
export default function VisitorHome({ onOpenApp, onShowDesktop }: { onOpenApp: (appId: string) => void; onShowDesktop: () => void }) {
  const { name, username, apps, lock } = useVisitorMode()

  return <div className="visitor-home">
    <div className="visitor-home-heading">
      <PixelIcon name="visitor" size={40} />
      <div><span className="eyebrow">SIGNED IN</span><h2>{name ?? username ?? '访客'}</h2></div>
    </div>
    <p className="visitor-home-note">你已通过服务器校验。下面是你被授权的应用，点开即可使用；内容与素材都在服务器上，只有登录后才会加载。</p>
    <div className="visitor-home-apps" aria-label="可用应用">
      {apps.length === 0 && <p className="visitor-home-empty">暂无可用的应用。需要开通请直接联系 Marcus。</p>}
      {apps.map(app => (
        <button key={app.id} type="button" className="visitor-app-card" onClick={() => onOpenApp(app.id)}>
          <PixelImage file={visitorAppIcon(app)} size={34} />
          <span><strong>{app.title}</strong>{app.subtitle && <small>{app.subtitle}</small>}</span>
          <span aria-hidden="true">↗</span>
        </button>
      ))}
    </div>
    <div className="visitor-home-actions">
      <button type="button" className="pixel-button" onClick={() => void lock()}>退出访客模式</button>
      <button type="button" className="text-button" onClick={onShowDesktop}>看看桌面壁纸 ↗</button>
    </div>
    <p className="visitor-home-footnote">退出会立即清除这个浏览器里的访客凭证；下次进入需要重新输入访客名与密码。</p>
  </div>
}
