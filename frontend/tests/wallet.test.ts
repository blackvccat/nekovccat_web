import assert from 'node:assert/strict'
import test from 'node:test'
import { ethToHex, SPONSOR_ADDRESS, submitSponsor, type WalletProvider } from '../src/lib/wallet'
const account = '0x0000000000000000000000000000000000000001'
test('ETH amounts retain all 18 decimals without floating point rounding', () => {
  assert.equal(ethToHex('0.000000000000000001'), '0x1')
  assert.equal(BigInt(ethToHex('1.123456789012345678')), 1123456789012345678n)
  for (const amount of ['0', '-1', '1e3', 'NaN', '01', '0.0000000000000000001', '1.2 ETH']) assert.throws(() => ethToHex(amount))
})
test('a donation can only use the confirmed Ethereum account and fixed receiver', async () => {
  const calls: { method: string; params?: unknown[] }[] = []
  const provider: WalletProvider = { async request(args) { calls.push(args); return args.method === 'eth_accounts' ? [account] : args.method === 'eth_chainId' ? '0x1' : '0x' + '1'.repeat(64) } }
  await submitSponsor(provider, account, '0.001', () => true)
  assert.deepEqual(calls.at(-1), { method: 'eth_sendTransaction', params: [{ from: account, to: SPONSOR_ADDRESS, value: ethToHex('0.001'), chainId: '0x1' }] })
  assert.ok(!calls.some(call => /sign|approve/i.test(call.method)))
})
test('wrong network, changed accounts and stale confirmation never submit a transaction', async () => {
  for (const [network, accounts, current] of [['0x89', [account], true], ['0x1', [SPONSOR_ADDRESS], true], ['0x1', [account], false]] as const) {
    let sent = false
    const provider: WalletProvider = { async request(args) { if (args.method === 'eth_sendTransaction') sent = true; return args.method === 'eth_accounts' ? accounts : network } }
    await assert.rejects(submitSponsor(provider, account, '0.01', () => current))
    assert.equal(sent, false)
  }
})
