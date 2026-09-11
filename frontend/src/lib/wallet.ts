export const SPONSOR_ADDRESS = '0x4F469e989cFb665D306B4581aa49261B185d605B'
export const ETHEREUM_CHAIN = '0x1'
export interface WalletProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
}
export function walletAddress(value: unknown): string | null {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value) ? value : null
}
export function ethToHex(value: string): string {
  if (!/^(?:0|[1-9]\d{0,5})(?:\.\d{1,18})?$/.test(value)) throw new Error('请输入有效的 ETH 金额，最多 18 位小数。')
  const [whole, fraction = ''] = value.split('.')
  const wei = BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, '0'))
  if (wei <= 0n) throw new Error('赞助金额需要大于 0。')
  return `0x${wei.toString(16)}`
}
export function walletError(cause: unknown): string {
  const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : null
  if (code === 4001) return '你已取消钱包操作，没有自动重试。'
  if (code === -32002) return '钱包中已有待处理的请求，请先打开钱包查看。'
  if (code === 4902) return '钱包尚未配置 Ethereum 主网，请在钱包中添加后重试。'
  return '钱包操作未完成，请在钱包中检查网络、余额和活动记录。'
}

export async function submitSponsor(provider: WalletProvider, account: string, amount: string, current: () => boolean) {
  const value = ethToHex(amount)
  if (!walletAddress(account)) throw new Error('Invalid account')
  const accounts = await provider.request({ method: 'eth_accounts' })
  const chain = await provider.request({ method: 'eth_chainId' })
  if (!current() || chain !== ETHEREUM_CHAIN || !Array.isArray(accounts) || String(accounts[0]).toLowerCase() !== account.toLowerCase()) throw new Error('Wallet changed')
  return provider.request({ method: 'eth_sendTransaction', params: [{ from: account, to: SPONSOR_ADDRESS, value, chainId: ETHEREUM_CHAIN }] })
}
