/** 桌面应用的合并注册表：内置应用 + `apps/` 里生成出来的插件应用。
 *
 *  桌面只认这里的 AppModule，不关心应用是内置还是插件。
 */
import { APP_API_VERSION, resolveAppIcon, type AppManifest, type AppModule } from './index'
import { BUILTIN_APPS } from './builtin'
import { PLUGIN_APPS } from './generated'

/** 契约版本对不上的插件会被跳过，而不是带着半个接口跑起来。 */
const compatiblePlugins = PLUGIN_APPS.filter(app => {
  if (app.manifest.apiVersion === APP_API_VERSION) return true
  console.warn(`[app-kit] 跳过插件 ${app.manifest.id}：契约版本 ${app.manifest.apiVersion}，宿主是 ${APP_API_VERSION}`)
  return false
})

export const DESKTOP_APP_MODULES: AppModule[] = [...BUILTIN_APPS, ...compatiblePlugins]

export function findAppModule(id: string): AppModule | undefined {
  return DESKTOP_APP_MODULES.find(app => app.manifest.id === id)
}

export function appIcon(manifest: AppManifest): string {
  return resolveAppIcon(manifest)
}

export { APP_API_VERSION, resolveAppIcon }
export type { AppManifest, AppModule }
