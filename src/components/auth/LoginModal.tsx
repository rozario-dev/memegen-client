import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { connectSolanaWallet, SolanaWalletError } from '../../lib/solana';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { setSolanaWallet } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true);
      setLoadingProvider(provider);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error(`${provider} login error:`, error);
        alert(`Login failed: ${error.message}`);
        return;
      }

      // The redirect will handle the rest
      onClose();
    } catch (error) {
      console.error(`Unexpected error during ${provider} login:`, error);
      alert('An unexpected error occurred during login');
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleSolanaLogin = async () => {
    try {
      setIsLoading(true);
      setLoadingProvider('solana');
      
      // Step 1: Check if Solana wallet is available
      if (!window.solana) {
        throw new Error('Solana wallet not found. Please install a Solana wallet like Phantom.');
      }
      
      // Step 2: Connect to Solana wallet
      console.log('Connecting to Solana wallet...');
      const publicKey = await connectSolanaWallet();
      console.log('Connected to Solana wallet:', publicKey);
      
      // Step 3: Ensure wallet is connected
      if (!window.solana.isConnected) {
        console.log('Wallet not connected, attempting to connect...');
        await window.solana.connect();
      }
      
      console.log('Wallet connection status:', window.solana.isConnected);
      console.log('Wallet public key:', window.solana.publicKey?.toString());
      
      // Step 4: Use Supabase's native Web3 authentication
      console.log('Attempting Supabase Web3 authentication...');
      const { data, error } = await supabase.auth.signInWithWeb3({
        chain: 'solana',
        statement: 'I accept the Terms of Service and want to sign in to this application',
      });
      
      if (error) {
        console.error('Supabase Web3 signin error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Check if it's a configuration issue
        if (error.message?.includes('Web3 provider not enabled') || 
            error.message?.includes('provider not configured')) {
          throw new Error('Web3 authentication is not enabled in Supabase. Please enable the Web3 Wallet provider in your Supabase dashboard.');
        }
        
        throw new Error(`Web3 authentication failed: ${error.message}`);
      }
      
      if (data?.user) {
        console.log('Supabase Web3 sign in successful!');
        console.log('User ID:', data.user.id);
        console.log('User metadata:', data.user.user_metadata);
        console.log('User app metadata:', data.user.app_metadata);
        // Only set in context after successful auth
        setSolanaWallet(publicKey);
      }
      
      console.log('Solana authentication successful');
      onClose();
      
    } catch (error) {
      console.error('Solana authentication error:', error);
      
      if (error instanceof SolanaWalletError) {
        alert(error.message);
      } else if (error && typeof error === 'object' && 'message' in error) {
        alert(`Authentication failed: ${(error as any).message}`);
      } else {
        alert('Failed to authenticate with Solana wallet. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Google Login */}
          {isSupabaseConfigured && (
            <button
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingProvider === 'google' ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span className="text-sm font-medium text-gray-700">
                {loadingProvider === 'google' ? 'Connecting...' : 'Continue with Google'}
              </span>
            </button>
          )}

          {/* GitHub Login */}
          {isSupabaseConfigured && (
            <button
              onClick={() => handleOAuthLogin('github')}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingProvider === 'github' ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              )}
              <span className="text-sm font-medium text-gray-700">
                {loadingProvider === 'github' ? 'Connecting...' : 'Continue with GitHub'}
              </span>
            </button>
          )}

          {/* Solana Login */}
          <button
            onClick={handleSolanaLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingProvider === 'solana' ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4.5 7.5L19.5 7.5C20.3284 7.5 21 8.17157 21 9C21 9.82843 20.3284 10.5 19.5 10.5L4.5 10.5C3.67157 10.5 3 9.82843 3 9C3 8.17157 3.67157 7.5 4.5 7.5Z"
                  fill="#9945FF"
                />
                <path
                  d="M4.5 13.5L19.5 13.5C20.3284 13.5 21 14.1716 21 15C21 15.8284 20.3284 16.5 19.5 16.5L4.5 16.5C3.67157 16.5 3 15.8284 3 15C3 14.1716 3.67157 13.5 4.5 13.5Z"
                  fill="#14F195"
                />
              </svg>
            )}
            <span className="text-sm font-medium text-gray-700">
              {loadingProvider === 'solana' ? 'Connecting...' : 'Connect with Solana'}
            </span>
          </button>

          {!isSupabaseConfigured && (
            <div className="text-center text-sm text-gray-500">
              OAuth providers not configured
            </div>
          )}
        </div>
      </div>
    </div>
  );
};