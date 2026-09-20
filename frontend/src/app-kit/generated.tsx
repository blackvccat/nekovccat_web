// 由 scripts/apps-registry.mjs 根据 frontend/apps/registry.json 生成，请勿手改。
// 要改：编辑 apps/ 目录或 registry.json，然后运行 `npm run app:registry`。
import type { AppModule } from './index'
import manifest0 from '../../apps/about/manifest.json'
import App0 from '../../apps/about/app'
import manifest1 from '../../apps/tomato/manifest.json'
import App1 from '../../apps/tomato/app'

export const PLUGIN_APPS: AppModule[] = [
  { manifest: manifest0 as AppModule['manifest'], Component: App0 },
  { manifest: manifest1 as AppModule['manifest'], Component: App1 },
]
