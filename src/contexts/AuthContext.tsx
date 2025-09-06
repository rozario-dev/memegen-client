import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiService } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { UserProfile, QuotaResponse } from '../lib/types';
import { AuthContext, type AuthContextType } from './AuthContextDefinition';
import { useWallet } from '@solana/wallet-adapter-react';
import { formatAddress, isSolanaCustomToken } from '../lib/format';

const SOLANA_WALLET_KEY = 'solana_wallet_address';

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

      // Check for existing Supabase session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Use Supabase JWT token
        const token = session.access_token;
        apiService.setToken(token);
        await loadUserData();
      } else {
        // Fallback to stored token
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
          const token = session.access_token;
          apiService.setToken(token);
          try {
            await loadUserData();
            // If this is a Solana login, persist the wallet address using wallet-adapter state
            const addr = publicKey?.toBase58();
            if (addr) setSolanaWallet(addr);
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
      const [userData, quotaData] = await Promise.all([
        apiService.getUserProfile(),
        apiService.getUserQuota()
      ]);
      const token = apiService.getToken();
      // Check if this is a Solana custom token
      const solInfo = token ? isSolanaCustomToken(token) : false;
      if (solInfo && typeof solInfo === 'object') {
        userData.email = formatAddress(solInfo.address);
      } 
      setUser(userData);
      setQuota(quotaData);      
    } catch (error) {
      console.error('Failed to load user data:', error);
      throw error;
    }
  };

  const login = async (token: string) => {
    apiService.setToken(token);
    await loadUserData();
  };
  
  const logout = async () => {
    try {
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