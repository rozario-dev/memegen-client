import { createContext } from 'react';
import type { UserProfile, QuotaResponse } from '../lib/types';

interface AuthContextType {
  user: UserProfile | null;
  quota: QuotaResponse | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshQuota: () => Promise<void>;
  isAuthenticated: boolean;
  solanaWalletAddress: string | null;
  setSolanaWallet: (walletAddress: string) => void;
  // 新增：标记当前是否为 Solana 自定义登录
  isSolanaAuth: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export type { AuthContextType };