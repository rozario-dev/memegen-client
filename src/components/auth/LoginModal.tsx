import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { setSolanaWallet } = useAuth();
  const { connected, connecting, publicKey, connect, wallets, wallet, select } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true);
      setLoadingProvider(provider);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) {
        console.error(`${provider} login error:`, error);
        alert(`Login failed: ${error.message}`);
        return;
      }
      onClose();
    } catch (error) {
      console.error(`Unexpected error during ${provider} login:`, error);
      alert('An unexpected error occurred during login');
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const autoSelectWalletIfNeeded = () => {
    if (wallet) return; // already selected
    // 优先选择 Phantom，如果可用
    const phantom = wallets.find(w => w.adapter.name === 'Phantom' && (w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable));
    const installed = wallets.find(w => w.readyState === WalletReadyState.Installed);
    const loadable = wallets.find(w => w.readyState === WalletReadyState.Loadable);
    const target = phantom || installed || loadable;
    if (!target) {
      throw new Error('No available Solana wallet detected. Please install Phantom or open in a supported wallet.');
    }
    select(target.adapter.name);
  };

  // 等待 publicKey 就绪，解决断开后首次重连时 publicKey 读取为 null 的竞态
  const waitForPublicKey = async (getPk: () => any, timeoutMs = 3000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const pk = getPk();
      if (pk) return pk;
      await new Promise((r) => setTimeout(r, 50));
    }
    return null;
  };

  // 等待 Supabase 会话完全清空，避免与上一次 SIGNED_OUT 事件产生竞态
  const waitForSignedOut = async (timeoutMs = 1500) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return true;
      await new Promise((r) => setTimeout(r, 50));
    }
    return false;
  };

  const handleSolanaLogin = async () => {
    try {
      setIsLoading(true);
      setLoadingProvider('solana');
      console.log("===1===")
      // 确保上一次登出的 SIGNED_OUT 已经完全处理
      await waitForSignedOut();
      console.log("===2===")
      // 通过 wallet-adapter 连接钱包（未选择时自动选择一个可用钱包）
      let didConnectNow = false;
      if (!connected) {
        console.log("===2.1===")
        autoSelectWalletIfNeeded();
        console.log("===2.2===")
        await connect();
        console.log("===2.3===")
        didConnectNow = true;
      }
      console.log("===3===")
      // 某些环境下，connect() 刚结束时 publicKey 可能尚未同步到 hook，等待其就绪
      let effectivePk: any = (wallet as any)?.adapter?.publicKey ?? publicKey;
      console.log("effectivePk", effectivePk)
      if (!effectivePk) {
        effectivePk = await waitForPublicKey(() => (wallet as any)?.adapter?.publicKey ?? publicKey);
      }
      console.log("===4===")
      const addr = effectivePk?.toBase58?.();
      if (!addr) {
        throw new Error('Failed to obtain wallet public key. Please approve in wallet and try again.');
      }
      console.log("===5===")
      // 持久化地址到全局 AuthContext
      setSolanaWallet(addr);
      console.log("===6===")
      // 如果是“刚刚完成连接”，给扩展一点冷却时间，避免连续弹出两个授权窗口造成失败
      if (didConnectNow) {
        await new Promise((r) => setTimeout(r, 400));
      }
      console.log("===7===")
      // 在调用 Web3 登录前稍作等待，给钱包适配器完成状态同步的时间
      await new Promise((r) => setTimeout(r, 100));
      console.log("===8===")
      // 继续使用 Supabase 的 Web3 登录实现（兼容现有后端配置）- 带一次性短重试
      const attemptSignIn = async () => {
        return supabase.auth.signInWithWeb3({
          chain: 'solana',
          statement: 'I accept the Terms of Service and want to sign in to this application',
        });
      };
      console.log("===9===")
      let { data, error } = await attemptSignIn();
      console.log("===10===")
      // 如果首次尝试失败且不是用户主动拒绝，进行一次短重试
      if (error) {
        const msg = (error.message || '').toLowerCase();
        const isUserReject = msg.includes('reject') || msg.includes('denied') || msg.includes('declin');
        if (!isUserReject) {
          await new Promise((r) => setTimeout(r, 300));
          ({ data, error } = await attemptSignIn());
        }
      }
      console.log("===11===")
      if (error) {
        console.error('Supabase Web3 signin error:', error);
        if (error.message?.includes('Web3 provider not enabled') || error.message?.includes('provider not configured')) {
          throw new Error('Web3 authentication is not enabled in Supabase. Please enable the Web3 Wallet provider in your Supabase dashboard.');
        }
        throw new Error(`Web3 authentication failed: ${error.message}`);
      }
      console.log("===12===")
      if (data?.user) {
        console.log('Supabase Web3 sign in successful!');
      }

      onClose();
    } catch (error: any) {
      console.error('Solana authentication error:', error);
      alert(error?.message || 'Failed to authenticate with Solana wallet. Please try again.');
      // 保持钱包连接，便于用户直接重试，不主动 disconnect()
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="space-y-4">
          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border hover:bg-gray-50"
          >
            <span className="text-sm font-medium text-gray-700">
              {loadingProvider === 'google' ? 'Connecting...' : 'Continue with Google'}
            </span>
          </button>

          <button
            onClick={() => handleOAuthLogin('github')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border hover:bg-gray-50"
          >
            <span className="text-sm font-medium text-gray-700">
              {loadingProvider === 'github' ? 'Connecting...' : 'Continue with GitHub'}
            </span>
          </button>

          <button
            onClick={handleSolanaLogin}
            disabled={isLoading || connecting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border hover:bg-gray-50"
          >
            <span className="text-sm font-medium text-gray-700">
              {loadingProvider === 'solana' ? 'Connecting...' : (connected ? 'Sign in with Solana' : 'Connect with Solana')}
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