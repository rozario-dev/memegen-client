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
import { SolanaMobileWalletAdapter, createDefaultAuthorizationResultCache, createDefaultAddressSelector, createDefaultWalletNotFoundHandler } from '@solana-mobile/wallet-adapter-mobile'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack'

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
const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://memegen.flipflop.plus'
console.log("appUrl: ", appUrl);
// Order matters for auto-selection fallback in LoginModal: Phantom > Backpack > Solflare > Installed/Loadable others
const wallets = [
  new PhantomWalletAdapter(),
  new BackpackWalletAdapter(),
  new SolflareWalletAdapter({ network }),
  new SolanaMobileWalletAdapter({
    appIdentity: {
      name: 'memeGen',
      uri: appUrl,
      icon: '/logo.png',
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
// Dev-only mobile console (eruda)
if (import.meta.env.VITE_SOLANA_NETWORK === "devnet") {
  const shouldLoadEruda =
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    window.location.hash.includes('eruda');

  if (shouldLoadEruda) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/eruda';
    s.async = true;
    s.onload = () => {
      // @ts-ignore
      window.eruda?.init();
      // @ts-ignore
      // window.eruda?.show();
    };
    document.body.appendChild(s);
  }
}
