import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Router } from './components/Router.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { Buffer } from 'buffer'

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Router />
    </AuthProvider>
  </StrictMode>,
)
