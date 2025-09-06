import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiService } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { UserProfile, QuotaResponse } from '../lib/types';
import { AuthContext, type AuthContextType } from './AuthContextDefinition';
import { useWallet } from '@solana/wallet-adapter-react';

const SOLANA_WALLET_KEY = 'solana_wallet_address';
const LOGOUT_GUARD_KEY = 'logout_guard';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [quota, setQuota] = useState<QuotaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [solanaWalletAddress, setSolanaWalletAddress] = useState<string | null>(null);

  // Wallet-adapter hook for Solana wallet state
  const { connected, publicKey, disconnect } = useWallet();

  const initializeAuth = useCallback(async () => {
    try {
      // Restore Solana wallet address from localStorage for initial UI gating
      const storedWallet = localStorage.getItem(SOLANA_WALLET_KEY);
      if (storedWallet) {
        setSolanaWalletAddress(storedWallet);
      }

      const hasLogoutGuard = !!localStorage.getItem(LOGOUT_GUARD_KEY);

      // Check for existing Supabase session first (unless logout guard is set)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!hasLogoutGuard && session) {
        // Use Supabase JWT token (non-persistent; Supabase manages session persistence)
        const token = session.access_token;
        apiService.setToken(token, false);
        await loadUserData();
      } else {
        // If logout guard exists but Supabase still has a session, proactively clear it
        if (hasLogoutGuard && session) {
          try { await supabase.auth.signOut(); } catch {}
        }
        // Fallback to stored token (only for app-managed tokens like Solana custom token)
        const token = apiService.getToken();
        if (token) {
          await loadUserData();
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      apiService.clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync wallet-adapter connection state to our AuthContext
  useEffect(() => {
    const addr = publicKey?.toBase58();
    if (connected && addr) {
      setSolanaWallet(addr);
    }
  }, [connected, publicKey]);

  useEffect(() => {
    initializeAuth();

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Clear logout guard upon successful sign-in
          localStorage.removeItem(LOGOUT_GUARD_KEY);

          const token = session.access_token;
          apiService.setToken(token, false);
          try {
            await loadUserData();
            // If this is a Solana login, persist the wallet address using wallet-adapter state
            const addr = publicKey?.toBase58();
            if (addr) {
              setSolanaWallet(addr);
            }
          } catch (error) {
            console.error('Failed to load user data after sign in:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          if (apiService.isAuthenticated()) {
            apiService.clearToken();
            setUser(null);
            setQuota(null);
            removeSolanaWallet();
          }
        }
      }
    );

    // Listen for auth expiration
    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [initializeAuth, publicKey]);

  const loadUserData = async () => {
    try {
      const token = apiService.getToken();
      
      // Check if this is a Solana custom token
      if (token && isSolanaCustomToken(token)) {
        const solanaData = parseSolanaToken(token);
        
        // Create mock user data for Solana authentication
         const mockQuota: QuotaResponse = {
           user_id: solanaData.publicKey,
           total_quota: 100,
           used_quota: 0,
           remaining_quota: 100,
           reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
         };
         
         const mockUser: UserProfile = {
           id: solanaData.publicKey,
           email: `${solanaData.publicKey.slice(0, 8)}...@solana.wallet`,
           quota: mockQuota,
           created_at: new Date().toISOString()
         };
        
        setUser(mockUser);
        setQuota(mockQuota);
        return;
      }
      
      // For regular tokens, use API calls
      const [userData, quotaData] = await Promise.all([
        apiService.getUserProfile(),
        apiService.getUserQuota()
      ]);
      
      setUser(userData);
      setQuota(quotaData);
    } catch (error) {
      console.error('Failed to load user data:', error);
      throw error;
    }
  };

  const login = async (token: string) => {
    // Clear logout guard on explicit login
    localStorage.removeItem(LOGOUT_GUARD_KEY);

    // Persist only for Solana custom tokens; Supabase tokens are non-persistent
    const persist = isSolanaCustomToken(token);
    apiService.setToken(token, persist);
    await loadUserData();
  };
  
  function parseTokenPayload(token: string): any | null {
    try {
      // 若为 JWT（x.y.z），只解析 payload 段
      const parts = token.split('.');
      const b64 = parts.length === 3 ? parts[1] : token; // 不是 JWT 就当作单段处理

      // Base64URL -> Base64，并补齐 =
      const normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

      const json = atob(padded);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  // Helper functions for Solana token handling
  const isSolanaCustomToken = (token: string): boolean => {
    try {
      const payload = parseTokenPayload(token);
      console.log(payload)
      return !!(payload && payload.provider === 'solana' && payload.publicKey && payload.signature);
    } catch (e) {
      return false;
    }
  };
  
  const parseSolanaToken = (token: string) => {
    try {
      return JSON.parse(atob(token));
    } catch {
      throw new Error('Invalid Solana token format');
    }
  };

  const logout = async () => {
    try {
      // Set logout guard so we don't auto-restore Supabase on refresh
      localStorage.setItem(LOGOUT_GUARD_KEY, Date.now().toString());

      // Clear local state first
      apiService.clearToken();
      setUser(null);
      setQuota(null);
      removeSolanaWallet();

      // Sign out from Supabase (handles Google and GitHub)
      await supabase.auth.signOut();

      // Disconnect Solana wallet if connected via wallet-adapter
      try {
        await disconnect();
        console.log('Solana wallet disconnected');
      } catch (solanaError) {
        console.error('Error disconnecting Solana wallet:', solanaError);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const refreshQuota = async () => {
    if (apiService.isAuthenticated()) {
      try {
        const quotaData = await apiService.getUserQuota();
        setQuota(quotaData);
      } catch (error) {
        console.error('Failed to refresh quota:', error);
      }
    }
  };

  const setSolanaWallet = (walletAddress: string) => {
    setSolanaWalletAddress(walletAddress);
    localStorage.setItem(SOLANA_WALLET_KEY, walletAddress);
  };

  const removeSolanaWallet = () => {
    setSolanaWalletAddress(null);
    localStorage.removeItem(SOLANA_WALLET_KEY);
  }

  const isAuthenticated = apiService.isAuthenticated();
  const isSolanaAuth = (() => {
    try {
      const t = apiService.getToken();
      return !!(t && isSolanaCustomToken(t));
    } catch {
      return false;
    }
  })();

  const value: AuthContextType = {
    user,
    quota,
    loading,
    login,
    logout,
    refreshQuota,
    isAuthenticated,
    solanaWalletAddress,
    setSolanaWallet,
    isSolanaAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};