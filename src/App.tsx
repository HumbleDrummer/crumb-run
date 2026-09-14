import { useCallback, useEffect, useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction, type ParsedInstruction } from '@solana/web3.js'
import './App.css'

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
const APP_PREFIX = 'CRUMB.RUN:v1'
const EXPLORER = 'https://cookiescan.io'
const pulses = [
  { id: 'BUILD', icon: '◩', hint: 'Proof that you are cooking.' },
  { id: 'SHIP', icon: '↗', hint: 'Launch energy, permanently.' },
  { id: 'HODL', icon: '◆', hint: 'Diamond crumbs, on-chain.' },
  { id: 'CHAOS', icon: '✦', hint: 'No roadmap. Pure oven.' },
] as const
type PulseId = (typeof pulses)[number]['id']
type TxState = 'idle' | 'preparing' | 'signing' | 'confirming' | 'confirmed' | 'failed'
type TrailItem = { signature: string; pulse: PulseId; timestamp: number | null; status: 'confirmed' | 'failed' }
const short = (value: string, head = 5, tail = 5) => `${value.slice(0, head)}…${value.slice(-tail)}`

function App() {
  const { connection } = useConnection()
  const { publicKey, connected, sendTransaction } = useWallet()
  const [selected, setSelected] = useState<PulseId>('BUILD')
  const [balance, setBalance] = useState<number | null>(null)
  const [txState, setTxState] = useState<TxState>('idle')
  const [signature, setSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [trail, setTrail] = useState<TrailItem[]>([])
  const [loadingTrail, setLoadingTrail] = useState(false)

  const refreshBalance = useCallback(async () => {
    if (!publicKey) return setBalance(null)
    try { setBalance((await connection.getBalance(publicKey, 'confirmed')) / LAMPORTS_PER_SOL) }
    catch { setBalance(null) }
  }, [connection, publicKey])

  const refreshTrail = useCallback(async () => {
    if (!publicKey) return setTrail([])
    setLoadingTrail(true)
    try {
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 15 }, 'confirmed')
      const transactions = await connection.getParsedTransactions(signatures.map((item) => item.signature), { commitment: 'confirmed', maxSupportedTransactionVersion: 0 })
      const items: TrailItem[] = []
      transactions.forEach((transaction, index) => {
        if (!transaction) return
        const memo = transaction.transaction.message.instructions.find((instruction) => {
          const parsed = instruction as ParsedInstruction
          return parsed.program === 'spl-memo' && typeof parsed.parsed === 'string' && parsed.parsed.startsWith(APP_PREFIX)
        }) as ParsedInstruction | undefined
        if (!memo || typeof memo.parsed !== 'string') return
        const pulse = memo.parsed.split(':')[2] as PulseId
        if (!pulses.some((item) => item.id === pulse)) return
        items.push({ signature: signatures[index].signature, pulse, timestamp: transaction.blockTime ?? null, status: transaction.meta?.err ? 'failed' : 'confirmed' })
      })
      setTrail(items)
    } catch { setTrail([]) }
    finally { setLoadingTrail(false) }
  }, [connection, publicKey])

  useEffect(() => { void refreshBalance(); void refreshTrail() }, [refreshBalance, refreshTrail])

  const publishPulse = async () => {
    if (!publicKey || !connected) return
    setError(null); setSignature(null); setTxState('preparing')
    try {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
      const memo = `${APP_PREFIX}:${selected}:${Date.now()}`
      const memoBytes = new TextEncoder().encode(memo) as unknown as ConstructorParameters<typeof TransactionInstruction>[0]['data']
      const transaction = new Transaction({ feePayer: publicKey, recentBlockhash: blockhash }).add(new TransactionInstruction({ keys: [], programId: MEMO_PROGRAM_ID, data: memoBytes }))
      setTxState('signing')
      const nextSignature = await sendTransaction(transaction, connection, { preflightCommitment: 'confirmed', skipPreflight: false })
      setSignature(nextSignature); setTxState('confirming')
      const confirmation = await connection.confirmTransaction({ signature: nextSignature, blockhash, lastValidBlockHeight }, 'confirmed')
      if (confirmation.value.err) throw new Error('The chain rejected this pulse.')
      setTxState('confirmed')
      await Promise.all([refreshBalance(), refreshTrail()])
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'The transaction could not be completed.'
      setError(message.includes('User rejected') ? 'Signature cancelled in wallet.' : message); setTxState('failed')
    }
  }

  const counts = useMemo(() => Object.fromEntries(pulses.map((pulse) => [pulse.id, trail.filter((item) => item.pulse === pulse.id).length])), [trail])
  const statusCopy: Record<TxState, string> = { idle: 'Ready when you are.', preparing: 'Building transaction…', signing: 'Confirm in Nightly…', confirming: 'Baking into the chain…', confirmed: 'Pulse confirmed. Permanent crumb.', failed: error ?? 'Transaction failed.' }

  return <main>
    <nav>
      <a className="brand" href="#top"><span className="brand-mark">C</span><span>CRUMB.RUN</span></a>
      <div className="network-pill"><i /> COOKIE CHAIN</div><WalletMultiButton />
    </nav>
    <section className="hero" id="top">
      <div className="eyebrow"><span>LIVE SIGNAL TERMINAL</span><span>CC—01</span></div>
      <h1>PUT YOUR<br /><em>PULSE</em> ON-CHAIN.</h1>
      <div className="hero-bottom"><p>Publish a mood. Sign with Nightly.<br />Leave a permanent crumb on Cookie Chain.</p><div className="chain-readout"><span>NETWORK</span><strong>COOKIE / SVM</strong><span>FINALITY</span><strong>CONFIRMED</strong></div></div>
    </section>
    <section className="terminal-grid">
      <article className="composer panel">
        <header><span>01 / CHOOSE SIGNAL</span><span className="live">LIVE</span></header>
        <div className="pulse-grid">{pulses.map((pulse) => <button className={`pulse ${selected === pulse.id ? 'selected' : ''}`} key={pulse.id} onClick={() => setSelected(pulse.id)} type="button"><span className="pulse-icon">{pulse.icon}</span><strong>{pulse.id}</strong><small>{pulse.hint}</small></button>)}</div>
        <div className="wallet-line"><div><span>SIGNER</span><strong>{publicKey ? short(publicKey.toBase58(), 7, 7) : 'NOT CONNECTED'}</strong></div><div><span>BALANCE</span><strong>{balance === null ? '—' : `${balance.toFixed(5)} COOK`}</strong></div></div>
        <button className="publish" type="button" onClick={publishPulse} disabled={!connected || !['idle', 'confirmed', 'failed'].includes(txState)}><span>{connected ? `PUBLISH ${selected}` : 'CONNECT NIGHTLY TO START'}</span><b>↗</b></button>
        <div className={`tx-status ${txState}`}><span className="status-dot" /><span>{statusCopy[txState]}</span>{signature && <a href={`${EXPLORER}/tx/${signature}`} target="_blank" rel="noreferrer">VIEW TX ↗</a>}</div>
      </article>
      <aside className="panel trail">
        <header><span>02 / YOUR TRAIL</span><button onClick={() => void refreshTrail()} type="button">REFRESH ↻</button></header>
        <div className="stats">{pulses.map((pulse) => <div key={pulse.id}><span>{pulse.id}</span><strong>{counts[pulse.id] ?? 0}</strong></div>)}</div>
        <div className="trail-list">{loadingTrail ? <p className="empty">SCANNING THE CHAIN…</p> : trail.length === 0 ? <div className="empty"><span>◎</span><p>No CRUMB.RUN signals found<br />for this wallet yet.</p></div> : trail.map((item) => <a className="trail-item" href={`${EXPLORER}/tx/${item.signature}`} target="_blank" rel="noreferrer" key={item.signature}><span className={`mini-pulse ${item.pulse.toLowerCase()}`}>{pulses.find((p) => p.id === item.pulse)?.icon}</span><div><strong>{item.pulse}</strong><small>{item.timestamp ? new Date(item.timestamp * 1000).toLocaleString() : 'Confirmed on-chain'}</small></div><code>{short(item.signature)}</code></a>)}</div>
      </aside>
    </section>
    <footer><span>POWERED BY COOKIE CHAIN</span><span>MEMO PROGRAM / v1.0</span><a href="https://docs.cookiechain.wtf" target="_blank" rel="noreferrer">DOCS ↗</a></footer>
  </main>
}
export default App
