import { createContext } from 'react';
import type { UserProfile, QuotaResponse } from '../types/api';

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
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export type { AuthContextType };