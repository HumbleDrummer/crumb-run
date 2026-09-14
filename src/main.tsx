import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import '@solana/wallet-adapter-react-ui/styles.css'
import './index.css'
import App from './App.tsx'
const RPC_ENDPOINT = import.meta.env.VITE_COOKIE_RPC_URL || 'https://rpc.cookiescan.io'
function Root() {
  const wallets = useMemo(() => [], [])
  return <ConnectionProvider endpoint={RPC_ENDPOINT} config={{ commitment: 'confirmed' }}><WalletProvider wallets={wallets} autoConnect><WalletModalProvider><App /></WalletModalProvider></WalletProvider></ConnectionProvider>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Root /></StrictMode>)
