import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiService } from '../services/api';
import { supabase } from '../lib/supabase';
import type { UserProfile, QuotaResponse } from '../types/api';
import { AuthContext, type AuthContextType } from './AuthContextDefinition';

const SOLANA_WALLET_KEY = 'solana_wallet_address';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [quota, setQuota] = useState<QuotaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [solanaWalletAddress, setSolanaWalletAddress] = useState<string | null>(null);

  const initializeAuth = useCallback(async () => {
    try {
      // Restore Solana wallet from localStorage if available
      const storedWallet = localStorage.getItem(SOLANA_WALLET_KEY);
      if (storedWallet) {
        setSolanaWalletAddress(storedWallet);
      } else if (typeof window !== 'undefined' && 'solana' in window) {
        // Attempt trusted auto-connect to restore wallet on refresh
        try {
          const provider = (window as any).solana;
          const resp = await provider.connect?.({ onlyIfTrusted: true });
          const addr = resp?.publicKey?.toString?.();
          if (addr) {
            setSolanaWalletAddress(addr);
            localStorage.setItem(SOLANA_WALLET_KEY, addr);
          }
        } catch (_) {
          // ignore if wallet not trusted or auto-connect not supported
        }
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
    initializeAuth();

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const token = session.access_token;
          apiService.setToken(token);
          try {
            await loadUserData();
            // Determine provider type
            const provider = session.user?.app_metadata?.provider || 'unknown';
            
            // If this is a Solana login, get the wallet address
            if (provider === 'solana' && typeof window !== 'undefined' && 'solana' in window) {
              const solanaProvider = (window as any).solana;
              if (solanaProvider && solanaProvider.publicKey) {
                const walletAddress = solanaProvider.publicKey.toString();
                setSolanaWalletAddress(walletAddress);
                localStorage.setItem(SOLANA_WALLET_KEY, walletAddress);
                console.log('Solana wallet address stored:', walletAddress);
              }
            }
            

          } catch (error) {
            console.error('Failed to load user data after sign in:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          // Only clear local state if not already cleared
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

    // Wallet event listeners (account change / disconnect)
    let provider: any;
    if (typeof window !== 'undefined' && 'solana' in window) {
      provider = (window as any).solana;
      const handleAccountChange = (pk: any) => {
        const addr = pk?.toString?.();
        if (addr) {
          setSolanaWalletAddress(addr);
          localStorage.setItem(SOLANA_WALLET_KEY, addr);
        } else {
          setSolanaWalletAddress(null);
          localStorage.removeItem(SOLANA_WALLET_KEY);
        }
      };
      const handleDisconnect = () => {
        setSolanaWalletAddress(null);
        localStorage.removeItem(SOLANA_WALLET_KEY);
      };
      try {
        provider?.on?.('accountChanged', handleAccountChange);
        provider?.on?.('disconnect', handleDisconnect);
      } catch {}
    }

    // Listen for auth expiration
    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('auth:expired', handleAuthExpired);
      try {
        provider?.removeListener?.('accountChanged');
        provider?.removeListener?.('disconnect');
      } catch {}
    };
  }, [initializeAuth]);

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

      // Disconnect Solana wallet if connected
      if (typeof window !== 'undefined' && 'solana' in window) {
        const provider = (window as any).solana;
        if (provider && provider.isPhantom && provider.isConnected) {
          try {
            await provider.disconnect();
            console.log('Solana wallet disconnected');
          } catch (solanaError) {
            console.error('Error disconnecting Solana wallet:', solanaError);
          }
        }
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