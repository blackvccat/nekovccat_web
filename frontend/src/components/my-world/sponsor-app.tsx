'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ETHEREUM_CHAIN, SPONSOR_ADDRESS, ethToHex, submitSponsor, walletAddress, walletError, type WalletProvider } from '@/lib/wallet'
import PixelIcon from './pixel-icon'
import './desktop-software.css'

type Wallet = { id: string; name: string; provider: WalletProvider }
type Transfer = { hash: string; amount: string; state: 'pending' | 'confirmed' | 'failed' }
export default function SponsorApp() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [chain, setChain] = useState('')
  const [amount, setAmount] = useState('0.001')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [uncertain, setUncertain] = useState(false)
  const [review, setReview] = useState(false)
  const [transfer, setTransfer] = useState<Transfer | null>(null)
  const generation = useRef(0)
  useEffect(() => {
    const lifecycle = generation
    const announce = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (!detail?.info || typeof detail.info.uuid !== 'string' || typeof detail.info.name !== 'string' || typeof detail.provider?.request !== 'function') return
      setWallets(previous => previous.some(item => item.provider === detail.provider) ? previous : [...previous.filter(item => item.id !== 'injected'), { id: detail.info.uuid, name: detail.info.name.slice(0, 50), provider: detail.provider }].slice(0, 10))
    }
    window.addEventListener('eip6963:announceProvider', announce)
    window.dispatchEvent(new Event('eip6963:requestProvider'))
    const injected = (window as Window & { ethereum?: WalletProvider }).ethereum
    if (injected?.request) setWallets(previous => previous.length ? previous : [{ id: 'injected', name: '浏览器钱包', provider: injected }])
    return () => { lifecycle.current++; window.removeEventListener('eip6963:announceProvider', announce) }
  }, [])
  useEffect(() => {
    if (!wallet) return
    const accountsChanged = (...args: unknown[]) => {
      generation.current++; setReview(false)
      setAccount(Array.isArray(args[0]) ? walletAddress(args[0][0]) : null)
    }
    const chainChanged = (...args: unknown[]) => { generation.current++; setReview(false); setChain(typeof args[0] === 'string' ? args[0].toLowerCase() : '') }
    const disconnected = () => { generation.current++; setAccount(null); setChain(''); setReview(false) }
    wallet.provider.on?.('accountsChanged', accountsChanged); wallet.provider.on?.('chainChanged', chainChanged); wallet.provider.on?.('disconnect', disconnected)
    return () => { wallet.provider.removeListener?.('accountsChanged', accountsChanged); wallet.provider.removeListener?.('chainChanged', chainChanged); wallet.provider.removeListener?.('disconnect', disconnected) }
  }, [wallet])
  useEffect(() => {
    if (!wallet || !transfer || transfer.state !== 'pending') return
    let cancelled = false; let timer: ReturnType<typeof setTimeout>; let attempts = 0
    const poll = async () => {
      try {
        if (await wallet.provider.request({ method: 'eth_chainId' }) !== ETHEREUM_CHAIN) return
        const result = await wallet.provider.request({ method: 'eth_getTransactionReceipt', params: [transfer.hash] })
        if (!cancelled && result && typeof result === 'object' && 'status' in result) {
          if (result.status === '0x1' || result.status === '0x0') {
            setTransfer(previous => previous?.hash === transfer.hash ? { ...previous, state: result.status === '0x1' ? 'confirmed' : 'failed' } : previous)
            return
          }
        }
      } catch { /* A failed status query never retries the transfer. */ }
      finally { if (!cancelled && ++attempts < 90) timer = setTimeout(poll, 8000) }
    }
    void poll()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [wallet, transfer])
  async function connect(item: Wallet) {
    setBusy(true); setNotice(''); const request = ++generation.current
    try {
      const accounts = await item.provider.request({ method: 'eth_requestAccounts' })
      const network = await item.provider.request({ method: 'eth_chainId' })
      if (request !== generation.current) return
      const address = Array.isArray(accounts) ? walletAddress(accounts[0]) : null
      if (!address || typeof network !== 'string') throw new Error('Invalid wallet response')
      setWallet(item); setAccount(address); setChain(network.toLowerCase())
    } catch (cause) { setNotice(walletError(cause)) }
    finally { setBusy(false) }
  }
  async function switchNetwork() {
    if (!wallet) return
    setBusy(true); setNotice('')
    try { await wallet.provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ETHEREUM_CHAIN }] }); setChain(String(await wallet.provider.request({ method: 'eth_chainId' })).toLowerCase()) }
    catch (cause) { setNotice(walletError(cause)) } finally { setBusy(false) }
  }
  async function send() {
    if (!wallet || !account || !review || busy || uncertain || transfer?.state === 'pending') return
    setBusy(true); setNotice(''); const request = generation.current
    try {
      const hash = await submitSponsor(wallet.provider, account, amount, () => request === generation.current)
      if (typeof hash !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(hash)) { setUncertain(true); setNotice('钱包未返回有效交易编号，请先检查钱包活动记录，勿重复提交。'); return }
      setTransfer({ hash, amount, state: 'pending' }); setReview(false)
    } catch (cause) {
      const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : null
      if (code !== 4001 && code !== -32002 && !(cause instanceof Error && cause.message === 'Wallet changed')) setUncertain(true)
      setNotice(walletError(cause))
    } finally { setBusy(false) }
  }
  return <div className="sponsor-app"><header className="sponsor-heading"><PixelIcon name="sponsor" size={47} /><div><span className="browser-kicker">A LITTLE SUPPORT, A LOT OF LOVE.</span><h1>赞助 NEKO</h1></div></header><p className="sponsor-intro">如果这个小世界让你停留了一会儿，<br />欢迎给猫猫的下一次创造加一点能量。</p><div className="sponsor-network">ETHEREUM MAINNET <span>ETH · 链 ID 1</span></div><section className="sponsor-receiver" aria-label="赞助收款地址">
    <Image unoptimized src="/images/neko-ethereum-qr.png" width="150" height="150" alt="NEKO 的 Ethereum 主网收款地址二维码" /><div><span>收款人 / NEKO</span><code>{SPONSOR_ADDRESS}</code><button className="pixel-button" onClick={async () => { try { await navigator.clipboard.writeText(SPONSOR_ADDRESS); setNotice('收款地址已复制，请在钱包中选择 Ethereum 主网和 ETH。') } catch { setNotice('请长按或选中地址手动复制。') } }}>复制收款地址</button><a href={`https://etherscan.io/address/${SPONSOR_ADDRESS}`} target="_blank" rel="noopener noreferrer">在 Etherscan 查看 ↗</a></div></section><p className="sponsor-help">请使用 Ethereum 主网的 ETH。二维码只包含地址，不会自动选择网络。</p>
    <section className="sponsor-wallet"><h2>从你的钱包出发 <small>YOUR WALLET</small></h2>{!account ? <><p>仅连接公开地址；赞助需要你在钱包里另行确认。</p>{wallets.length ? wallets.map(item => <button className="pixel-button" key={item.id} disabled={busy} onClick={() => connect(item)}>{busy ? '请在钱包中确认…' : `连接 ${item.name}`}</button>) : <p className="wallet-empty">未检测到浏览器钱包。可以在钱包 App 的浏览器中打开本站，或扫描上方二维码赞助。</p>}</> : <><div className="connected-wallet"><span>已连接 · {wallet?.name}</span><code>{account}</code><button className="text-button" disabled={busy || transfer?.state === 'pending'} onClick={() => { generation.current++; setWallet(null); setAccount(null); setChain(''); setReview(false); setNotice('本站已断开连接。授权管理可在钱包中操作。') }}>断开本站连接</button></div>{chain !== ETHEREUM_CHAIN ? <button className="pixel-button" disabled={busy} onClick={switchNetwork}>切换到 Ethereum 主网</button> : <form onSubmit={event => { event.preventDefault(); try { ethToHex(amount); setReview(true); setNotice('') } catch (cause) { setNotice((cause as Error).message) } }}><label htmlFor="sponsor-amount">赞助金额 · ETH</label><div className="sponsor-amount-row"><input id="sponsor-amount" inputMode="decimal" value={amount} disabled={busy || review || transfer?.state === 'pending'} onChange={event => setAmount(event.target.value)} /><button className="pixel-button" disabled={busy || review || transfer?.state === 'pending'}>核对赞助</button></div><div className="sponsor-presets">{['0.001', '0.005', '0.01'].map(value => <button type="button" disabled={busy || review || transfer?.state === 'pending'} onClick={() => setAmount(value)} key={value}>{value} ETH</button>)}</div></form>}</>}
    {review && <div className="sponsor-review"><strong>请核对这笔赞助</strong><p>{amount} ETH · Ethereum 主网</p><code>收款：{SPONSOR_ADDRESS}</code><p>网络手续费由钱包显示。请在钱包中确认收款地址和金额。</p><button className="pixel-button" disabled={busy || uncertain} onClick={send}>{busy ? '等待钱包确认…' : '去钱包确认赞助'}</button><button className="text-button" disabled={busy} onClick={() => setReview(false)}>返回修改</button></div>}
    {uncertain && <p role="alert">交易状态暂时无法确认。请先核查钱包活动记录；本站已暂停再次提交，避免重复转账。</p>}
    {transfer && <div className="sponsor-transfer" role="status"><strong>{transfer.state === 'confirmed' ? '链上已确认，谢谢你的支持 ♡' : transfer.state === 'failed' ? '链上执行失败，请查看交易详情。' : '已提交，等待链上确认；请勿重复转账。'}</strong><p>{transfer.amount} ETH</p><a href={`https://etherscan.io/tx/${transfer.hash}`} target="_blank" rel="noopener noreferrer">在 Etherscan 查看进度 ↗</a></div>}
    <p className="software-feedback" role="status">{notice}</p></section><footer className="sponsor-footer">不论是否赞助，谢谢你来猫猫的世界做客。♡</footer></div>
}
