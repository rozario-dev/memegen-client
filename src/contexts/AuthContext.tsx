import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiService } from '../services/api';
import { supabase } from '../lib/supabase';
import type { UserProfile, QuotaResponse } from '../types/api';
import { AuthContext, type AuthContextType } from './AuthContextDefinition';



interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [quota, setQuota] = useState<QuotaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const initializeAuth = useCallback(async () => {
    try {
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
          } catch (error) {
            console.error('Failed to load user data after sign in:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          // Only clear local state if not already cleared
          if (apiService.isAuthenticated()) {
            apiService.clearToken();
            setUser(null);
            setQuota(null);
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
  }, [initializeAuth]);

  const loadUserData = async () => {
    try {
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

  const logout = async () => {
    try {
      // Clear local state first
      apiService.clearToken();
      setUser(null);
      setQuota(null);

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

  const isAuthenticated = apiService.isAuthenticated();

  const value: AuthContextType = {
    user,
    quota,
    loading,
    login,
    logout,
    refreshQuota,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};