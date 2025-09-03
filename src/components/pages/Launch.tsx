import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocation, Navigate } from 'react-router-dom';
import { compressImage, formatAddress } from '../../utils/format';
import { Connection, clusterApiUrl, PublicKey, VersionedTransaction, TransactionMessage } from '@solana/web3.js';

const LazyLaunchTokenButton = React.lazy(() => import('@flipflop-sdk/tools').then(m => ({ default: m.LaunchTokenButton })));

interface LaunchProps {}

interface TokenFormData {
  name: string;
  symbol: string;
  image: File | null;
  imageUrl: string;
}

export const Launch: React.FC<LaunchProps> = () => {
  const { user, solanaWalletAddress } = useAuth();
  const location = useLocation();
  const [formData, setFormData] = useState<TokenFormData>({
    name: '',
    symbol: '',
    image: null,
    imageUrl: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createStatus, setCreateStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [dragActive, setDragActive] = useState(false);

  // Match SDK image size constraint (MAX_AVATAR_SIZE = 250KB)
  const MAX_IMAGE_SIZE_MB = 0.25;
  const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

  // Check if user is logged in with Solana wallet
  if (!user || !solanaWalletAddress) {
    return <Navigate to="/" replace />;
  }

  // Handle image from navigation state (from History or ResultsDisplay)
  useEffect(() => {
    const state = location.state as { imageUrl?: string } | null;
    if (state?.imageUrl) {
      setFormData(prev => ({ ...prev, imageUrl: state.imageUrl || '' }));
      // Try to convert incoming imageUrl to a File so SDK can upload it
      (async () => {
        try {
          const res = await fetch(state.imageUrl!);
          const blob = await res.blob();
          const type = blob.type || 'image/png';
          const ext = type.split('/')[1] || 'png';
          const file = new File([blob], `token.${ext}` , { type });
          setFormData(prev => ({ ...prev, image: file }));
        } catch (_e) {
          // noop if cannot fetch due to CORS or invalid URL; user can re-upload manually
        }
      })();
    }
  }, [location.state]);

  // Prepare Solana connection and wallet wrapper for LaunchTokenButton
  const network = useMemo(() => (
    import.meta.env.VITE_SOLANA_NETWORK === 'mainnet' ? 'mainnet' : 'devnet'
  ) as 'devnet' | 'mainnet', []);

  const connection = useMemo(() => {
    const cluster = network === 'mainnet' ? 'mainnet-beta' : 'devnet';
    const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(cluster);
    return new Connection(rpcUrl, 'confirmed');
  }, [network]);

  // ######
  const wallet = useMemo(() => {
    const provider = (window as any)?.solana;
    try {
      if (provider?.publicKey && (provider?.signTransaction || provider?.signAndSendTransaction)) {
        const publicKey = new PublicKey(provider.publicKey.toString());

        // Base signer references
        const rawSignTx: ((tx: any) => Promise<any>) | undefined = provider.signTransaction?.bind(provider);
        const rawSignAll: ((txs: any[]) => Promise<any[]>) | undefined = provider.signAllTransactions?.bind(provider);

        // Wrapper: try legacy sign, fallback to v0 VersionedTransaction
        const signTransaction = async (tx: any) => {
          if (!rawSignTx) throw new Error('Wallet does not support signTransaction');
          try {
            return await rawSignTx(tx);
          } catch (e: any) {
            const msg = String(e?.message || e || '');
            // Fallback: build and sign v0 tx if wallet complains about message.header/numRequiredSignatures
            if (msg.includes('numRequiredSignatures') || msg.includes('message.header')) {
              if (!tx?.feePayer || !tx?.recentBlockhash || !tx?.instructions) throw e;
              const compiled = new TransactionMessage({
                payerKey: tx.feePayer,
                recentBlockhash: tx.recentBlockhash,
                instructions: tx.instructions,
              }).compileToV0Message();
              const vtx = new VersionedTransaction(compiled);
              return await rawSignTx(vtx);
            }
            throw e;
          }
        };

        const signAllTransactions = async (txs: any[]) => {
          if (rawSignAll) {
            try {
              return await rawSignAll(txs);
            } catch (e: any) {
              const msg = String(e?.message || e || '');
              if (msg.includes('numRequiredSignatures') || msg.includes('message.header')) {
                const converted: any[] = txs.map((tx) => {
                  if (!tx?.feePayer || !tx?.recentBlockhash || !tx?.instructions) return tx;
                  const compiled = new TransactionMessage({
                    payerKey: tx.feePayer,
                    recentBlockhash: tx.recentBlockhash,
                    instructions: tx.instructions,
                  }).compileToV0Message();
                  return new VersionedTransaction(compiled);
                });
                return await (rawSignAll ? rawSignAll(converted) : Promise.all(converted.map(rawSignTx!)));
              }
              throw e;
            }
          }
          // 简易回退：逐个签名
          const out: any[] = [];
          for (const tx of txs) out.push(await signTransaction(tx));
          return out;
        };

        const sendTransaction = async (tx: any, conn: Connection, opts?: { skipPreflight?: boolean; preflightCommitment?: string }) => {
          // 优先使用钱包原生的 signAndSendTransaction（通常处理 VersionedTransaction 更稳）
          try {
            if (provider.signAndSendTransaction) {
              const res = await provider.signAndSendTransaction(tx, opts);
              const sig = (res && (res.signature || res)) as any;
              return typeof sig === 'string' ? sig : sig?.toString?.();
            }
          } catch (_) {
            // 如果 signAndSendTransaction 失败，降级到本地 sendRaw
          }

          const signed = await signTransaction(tx);
          const raw = typeof signed?.serialize === 'function' ? signed.serialize() : signed;
          const signature = await conn.sendRawTransaction(raw, {
            skipPreflight: opts?.skipPreflight ?? false,
            preflightCommitment: (opts?.preflightCommitment as any) ?? 'confirmed',
          } as any);
          return signature;
        };

        return {
          publicKey,
          signTransaction,
          signAllTransactions,
          sendTransaction,
        } as any; // wallet-like object compatible with common SDKs/Anchor
      }
    } catch (_e) {
      // ignore and return null below
    }
    return null;
  }, [solanaWalletAddress, connection]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'symbol') {
      // Uppercase and restrict to alphanumerics, max length 10
      const next = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, symbol: next }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const setImageFromFile = (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setCreateStatus({ type: 'error', message: 'Unsupported image type. Use PNG, JPG, WEBP, or GIF.' });
      return;
    }
    const sizeMb = file.size / (1024 * 1024);
    // GIF 压缩在前端较复杂，这里仅在超限时提示
    const isGif = /gif$/i.test(file.type);

    if (sizeMb > MAX_IMAGE_SIZE_MB) {
      if (isGif) {
        setCreateStatus({ type: 'error', message: `GIF is larger than ${MAX_IMAGE_SIZE_MB}MB and cannot be compressed in browser.` });
        return;
      }
      compressImage(file, MAX_IMAGE_SIZE_MB, 300, 300)
        .then((compressedFile) => {
          setFormData((prev) => ({ ...prev, image: compressedFile }));
          const reader = new FileReader();
          reader.onload = (event) => {
            setFormData((prev) => ({ ...prev, imageUrl: event.target?.result as string }));
          };
          reader.readAsDataURL(compressedFile);
        })
        .catch(() => {
          setCreateStatus({ type: 'error', message: 'Image compression failed.' });
        });
      return;
    }

    setFormData((prev) => ({ ...prev, image: file }));

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, imageUrl: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFromFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setImageFromFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const item = Array.from(e.clipboardData.items).find(i => i.kind === 'file');
    const file = item?.getAsFile();
    if (file) setImageFromFile(file);
  };

  // Removed old handleCreateToken; integration is now via LaunchTokenButton

  const readySteps = [
    { label: 'Image', done: !!formData.imageUrl },
    { label: 'Name', done: !!formData.name.trim() },
    { label: 'Symbol', done: !!formData.symbol.trim() },
  ];

  // Helper to determine if action should be disabled (require actual File per SDK)
  const formNotReady = !formData.name.trim() || !formData.symbol.trim() || !formData.image || !wallet;

  return (
    <div className="-mt-16 -mb-12 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 pt-16 pb-20">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-6 text-center">
            🚀 Create Flipflop Token
          </h1>

          {/* Steps Indicator */}
          <div className="flex items-center justify-center gap-6 mb-8">
            {readySteps.map((s, idx) => (
              <div key={s.label} className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full border ${s.done ? 'bg-green-400 border-green-300' : 'bg-transparent border-white/40'}`}></div>
                <span className={`text-sm ${s.done ? 'text-green-200' : 'text-white/70'}`}>{s.label}</span>
                {idx < readySteps.length - 1 && <div className="w-8 h-[1px] bg-white/30 mx-2" />}
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Image Upload / Preview */}
            <div>
              <label htmlFor="image" className="block text-white text-sm font-medium mb-2">
                Token Image
              </label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onPaste={handlePaste}
                className={`relative rounded-xl border-2 ${dragActive ? 'border-purple-400' : 'border-dashed border-white/30'} bg-white/5 overflow-hidden`}
              >
                {!formData.imageUrl ? (
                  <div className="flex flex-col items-center justify-center text-center p-10 text-white/70">
                    <div className="mb-3 text-6xl">🖼️</div>
                    <p className="mb-2">Drag & drop an image here, paste from clipboard, or</p>
                    <label className="inline-block">
                      <span className="cursor-pointer px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium">Browse Files</span>
                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="mt-3 text-xs text-white/50">PNG, JPG, WEBP, or GIF up to {MAX_IMAGE_SIZE_MB}MB</p>
                  </div>
                ) : (
                  <div className="relative group">
                    <img
                      src={formData.imageUrl}
                      alt="Token preview"
                      className="w-full aspect-square object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '', image: null }))}
                        className="bg-red-500/90 hover:bg-red-600 text-white rounded-lg px-3 py-1.5 text-sm"
                      >
                        Remove
                      </button>
                      <label className="bg-white/80 hover:bg-white text-gray-900 rounded-lg px-3 py-1.5 text-sm cursor-pointer">
                        Replace
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Form */}
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-white text-sm font-medium mb-2">
                  Token Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter token name (e.g., Flipflop Token)"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {/* <p className="mt-2 text-xs text-white/50">Tip: Short, catchy names work best.</p> */}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="symbol" className="block text-white text-sm font-medium">
                    Token Symbol
                  </label>
                  {/* <span className="text-xs text-white/50">{formData.symbol.length}/10</span> */}
                </div>
                <input
                  type="text"
                  id="symbol"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  placeholder="Enter token symbol (e.g., FFT)"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent tracking-widest"
                  maxLength={10}
                />
                {/* <p className="mt-2 text-xs text-white/50">Uppercase letters and numbers only.</p> */}
              </div>

              {createStatus.message && (
                <div className={`p-4 rounded-lg ${
                  createStatus.type === 'success' 
                    ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                    : 'bg-red-500/20 border border-red-500/30 text-red-300'
                }`}>
                  {createStatus.message}
                </div>
              )}

              <div className={formNotReady ? 'opacity-50 pointer-events-none' : ''}>
                <Suspense fallback={<div className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-center">Loading launcher...</div>}>
                  <LazyLaunchTokenButton
                    network={network}
                    wallet={wallet as any}
                    connection={connection}
                    name={formData.name}
                    symbol={formData.symbol}
                    file={(formData.image as unknown as File)}
                    tokenType="meme"
                    buttonTitle={isCreating ? 'Creating Token...' : 'Create Flipflop Token'}
                    buttonStyle={{
                      width: '100%',
                      padding: '1rem 1.5rem', // higher button like screenshot
                      // Gradient background (purple -> indigo -> pink)
                      backgroundImage: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 40%, #EC4899 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '9999px', // pill
                      fontSize: '1rem',
                      lineHeight: '1.5rem',
                      fontWeight: 600,
                      letterSpacing: '0.2px',
                      textAlign: 'center',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
                      transition: 'transform 150ms ease, box-shadow 150ms ease',
                      cursor: 'pointer',
                    }}
                    onStart={() => {
                      setIsCreating(true);
                      setCreateStatus({ type: null, message: '' });
                    }}
                    onSuccess={(data: any) => {
                      setIsCreating(false);
                      setCreateStatus({ type: 'success', message: `Token \"${formData.name}\" (${formData.symbol}) created successfully!` });
                      // Reset form
                      setFormData({ name: '', symbol: '', image: null, imageUrl: '' });
                      // Optionally, you can log data
                      console.log('Launch success:', data);
                    }}
                    onError={(error: string) => {
                      setIsCreating(false);
                      setCreateStatus({ type: 'error', message: error || 'Failed to create token. Please try again.' });
                      console.error('Launch error:', error);
                    }}
                  />
                </Suspense>
              </div>

              <div className="text-center text-white/60 text-sm">
                Connected wallet: {solanaWalletAddress ? formatAddress(solanaWalletAddress, 8, 8) : ''}
              </div>

              <div className="text-xs text-white/50 leading-relaxed">
                By creating a token you acknowledge that this is an experimental feature. Make sure your image does not violate any copyrights. Network fees may apply.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};