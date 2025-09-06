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
// 添加移动端钱包适配器（支持 App 深链唤起）
import { SolanaMobileWalletAdapter, createDefaultAuthorizationResultCache, createDefaultAddressSelector, createDefaultWalletNotFoundHandler } from '@solana-mobile/wallet-adapter-mobile'

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
// 站点地址用于钱包返回（移动端深链回跳）
const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://memegen.flipflop.plus'
// 同时支持 Phantom 浏览器扩展与移动端钱包适配器
const wallets = [
  new PhantomWalletAdapter(),
  new SolanaMobileWalletAdapter({
    appIdentity: {
      name: 'memeGen',
      uri: appUrl,
      icon: `${appUrl}/logo.png`,
    },
    authorizationResultCache: createDefaultAuthorizationResultCache(),
    addressSelector: createDefaultAddressSelector(),
    onWalletNotFound: createDefaultWalletNotFoundHandler(),
    cluster: network === WalletAdapterNetwork.Mainnet ? 'mainnet-beta' : 'devnet',
  }),
]

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
