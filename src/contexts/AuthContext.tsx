import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiService } from '../services/api';
import { supabase } from '../lib/supabase';
import type { UserProfile, QuotaResponse } from '../types/api';
import { AuthContext, type AuthContextType } from './AuthContextDefinition';
import { useWallet } from '@solana/wallet-adapter-react';

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

  // Sync wallet-adapter connection state to our AuthContext
  useEffect(() => {
    const addr = publicKey?.toBase58();
    if (connected && addr) {
      setSolanaWalletAddress(addr);
      localStorage.setItem(SOLANA_WALLET_KEY, addr);
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
            if (addr) {
              setSolanaWalletAddress(addr);
              localStorage.setItem(SOLANA_WALLET_KEY, addr);
              console.log('Solana wallet address stored:', addr);
            }
          } catch (error) {
            console.error('Failed to load user data after sign in:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          if (apiService.isAuthenticated()) {
            apiService.clearToken();
            setUser(null);
            setQuota(null);
            setSolanaWalletAddress(null);
            localStorage.removeItem(SOLANA_WALLET_KEY);
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
    apiService.setToken(token);
    await loadUserData();
  };
  
  // Helper functions for Solana token handling
  const isSolanaCustomToken = (token: string): boolean => {
    try {
      const decoded = JSON.parse(atob(token));
      return decoded.provider === 'solana' && decoded.publicKey && decoded.signature;
    } catch {
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
      // Clear local state first
      apiService.clearToken();
      setUser(null);
      setQuota(null);
      setSolanaWalletAddress(null);
      localStorage.removeItem(SOLANA_WALLET_KEY);

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
    console.log('Solana wallet address set:', walletAddress);
  };

  const isAuthenticated = apiService.isAuthenticated();

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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};