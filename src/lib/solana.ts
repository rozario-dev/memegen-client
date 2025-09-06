// Solana wallet utilities

interface PhantomProvider {
  isPhantom: boolean;
  isConnected: boolean;
  publicKey: {
    toString(): string;
  };
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
  signTransaction(transaction: any): Promise<any>;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

export class SolanaWalletError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SolanaWalletError';
  }
}

export const getSolanaProvider = (): PhantomProvider => {
  if (typeof window === 'undefined' || !window.solana) {
    throw new SolanaWalletError('Solana wallet not detected. Please install Phantom wallet.');
  }

  if (!window.solana.isPhantom) {
    throw new SolanaWalletError('Please install Phantom wallet to connect with Solana.');
  }

  return window.solana;
};

export const connectSolanaWallet = async (): Promise<string> => {
  const provider = getSolanaProvider();
  
  try {
    const response = await provider.connect();
    return response.publicKey.toString();
  } catch (error) {
    console.error('Failed to connect to Solana wallet:', error);
    throw new SolanaWalletError('Failed to connect to Solana wallet. Please try again.');
  }
};

export const signMessage = async (message: string): Promise<{ signature: string; publicKey: string }> => {
  const provider = getSolanaProvider();
  
  if (!provider.isConnected) {
    throw new SolanaWalletError('Wallet not connected. Please connect your wallet first.');
  }

  try {
    // Convert message to Uint8Array
    const messageBytes = new TextEncoder().encode(message);
    
    // Sign the message
    const signedMessage = await provider.signMessage(messageBytes);
    
    // Convert signature to base64 string
    const signature = btoa(String.fromCharCode(...signedMessage.signature));
    const publicKey = provider.publicKey.toString();
    
    return { signature, publicKey };
  } catch (error) {
    console.error('Failed to sign message:', error);
    throw new SolanaWalletError('Failed to sign message. Please try again.');
  }
};

export const disconnectSolanaWallet = async (): Promise<void> => {
  const provider = getSolanaProvider();
  
  if (provider.isConnected) {
    try {
      await provider.disconnect();
      console.log('Solana wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting Solana wallet:', error);
      throw new SolanaWalletError('Failed to disconnect wallet.');
    }
  }
};

// Generate a unique message for signing
export const generateAuthMessage = (publicKey: string): string => {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(2, 15);
  return `Sign this message to authenticate with MemeGen.\n\nPublic Key: ${publicKey}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
};