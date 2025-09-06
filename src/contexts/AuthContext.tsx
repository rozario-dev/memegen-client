import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiService } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { UserProfile, QuotaResponse } from '../lib/types';
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
        // const addr = solInfo.address;
        
        // Create mock user data for Solana authentication
        // ###### 这里需要获取更多的Solana的supabase数据
        // const solQuota: QuotaResponse = {
        //   user_id: addr,
        //   total_quota: 100, // ######
        //   used_quota: 0, // ######
        //   remaining_quota: 100, // ######
        // };
        
        // const solUser: UserProfile = {
        //   id: addr,
        //   email: addr,
        //   quota: solQuota,
        // };
        // const [solUser, solQuota] = await Promise.all([
        //   apiService.getUserProfile(),
        //   apiService.getUserQuota()
        // ]);
        userData.email = solInfo.address;

        // console.log("solana user data: ", solUser);
        // console.log("solana user quota: ", solQuota);
        // setUser(solUser);
        // setQuota(solQuota);
      } 
      // else {
      //   // For regular tokens, use API calls
      //   const [userData, quotaData] = await Promise.all([
      //     apiService.getUserProfile(),
      //     apiService.getUserQuota()
      //   ]);
        
      //   console.log("Regular user data: ", userData);
      //   console.log("Regular user quota: ", quotaData);

      //   setUser(userData);
      //   setQuota(quotaData);
      // }
      console.log("Regular user data: ", userData);
      console.log("Regular user quota: ", quotaData);

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
  const isSolanaCustomToken = (token: string): boolean | {address: string, chain: string} => {
    try {
      const payload = parseTokenPayload(token);
      if (!payload) return false;

      // Case 1: Supabase Web3 JWT (preferred)
      const appMeta = payload.app_metadata;
      const isWeb3Provider = appMeta?.provider === 'web3' || (Array.isArray(appMeta?.providers) && appMeta.providers.includes('web3'));
      if (isWeb3Provider) {
        const custom = payload.user_metadata?.custom_claims || {};
        let address: string | undefined = custom.address;
        let chain: string | undefined = custom.chain;

        // Fallback: try to parse from sub like "web3:solana:<address>"
        const sub: string | undefined = payload.user_metadata?.sub || payload.sub;
        if (!address && typeof sub === 'string' && sub.startsWith('web3:')) {
          const parts = sub.split(':');
          if (parts.length >= 3) {
            chain = chain || parts[1];
            address = parts.slice(2).join(':');
          }
        }

        if (address) {
          return { address, chain: (chain || 'solana') as string };
        }
      }

      // Case 2: Legacy custom token shape
      if (payload.provider === 'solana' && payload.publicKey) {
        return { address: payload.publicKey as string, chain: 'solana' };
      }

      return false;
    } catch (e) {
      return false;
    }
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