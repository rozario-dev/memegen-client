import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Router } from './contexts/Router.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { Buffer } from 'buffer'
import { clusterApiUrl } from '@solana/web3.js'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'

// Ensure Buffer is available in browser for libs that expect Node.js Buffer
if (typeof window !== 'undefined' && !(window as any).Buffer) {
  (window as any).Buffer = Buffer
}

// Provide minimal Node.js globals for browser to satisfy some CJS libs
if (typeof window !== 'undefined') {
  // Some libraries expect global to exist (Node.js global)
  if (!(window as any).global) {
    (window as any).global = window
  }
  // Minimal process shim used by libs that inspect env
  if (!(window as any).process) {
    (window as any).process = {
      env: { NODE_ENV: import.meta.env.MODE },
      browser: true,
    }
  }
}

const network: WalletAdapterNetwork = (import.meta.env.VITE_SOLANA_NETWORK === 'mainnet' ? WalletAdapterNetwork.Mainnet : WalletAdapterNetwork.Devnet)
const endpoint = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(network === WalletAdapterNetwork.Mainnet ? 'mainnet-beta' : 'devnet')
const wallets = [new PhantomWalletAdapter()]

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConnectionProvider endpoint={endpoint} config={{ commitment: 'confirmed' }}>
      <WalletProvider wallets={wallets} autoConnect>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </WalletProvider>
    </ConnectionProvider>
  </StrictMode>,
)
