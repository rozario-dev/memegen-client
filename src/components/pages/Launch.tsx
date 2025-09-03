import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocation, Navigate } from 'react-router-dom';
import { formatAddress } from '../../utils/format';

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

  const MAX_IMAGE_SIZE_MB = 5;
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
    }
  }, [location.state]);

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
    if (sizeMb > MAX_IMAGE_SIZE_MB) {
      setCreateStatus({ type: 'error', message: `Image too large. Max ${MAX_IMAGE_SIZE_MB}MB.` });
      return;
    }
    setFormData(prev => ({ ...prev, image: file }));

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, imageUrl: event.target?.result as string }));
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

  const handleCreateToken = async () => {
    if (!formData.name.trim() || !formData.symbol.trim()) {
      setCreateStatus({
        type: 'error',
        message: 'Please fill in both token name and symbol'
      });
      return;
    }

    if (!formData.imageUrl && !formData.image) {
      setCreateStatus({
        type: 'error',
        message: 'Please upload an image or select one from your history'
      });
      return;
    }

    setIsCreating(true);
    setCreateStatus({ type: null, message: '' });

    try {
      // TODO: Implement actual token creation logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCreateStatus({
        type: 'success',
        message: `Token "${formData.name}" (${formData.symbol}) created successfully!`
      });
      
      // Reset form
      setFormData({
        name: '',
        symbol: '',
        image: null,
        imageUrl: ''
      });
    } catch (error) {
      setCreateStatus({
        type: 'error',
        message: 'Failed to create token. Please try again.'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const readySteps = [
    { label: 'Image', done: !!formData.imageUrl },
    { label: 'Name', done: !!formData.name.trim() },
    { label: 'Symbol', done: !!formData.symbol.trim() },
  ];

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
                  placeholder="Enter token name (e.g., Flipflop Inu)"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="mt-2 text-xs text-white/50">Tip: Short, catchy names work best.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="symbol" className="block text-white text-sm font-medium">
                    Token Symbol
                  </label>
                  <span className="text-xs text-white/50">{formData.symbol.length}/10</span>
                </div>
                <input
                  type="text"
                  id="symbol"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  placeholder="Enter token symbol (e.g., FFI)"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent tracking-widest"
                  maxLength={10}
                />
                <p className="mt-2 text-xs text-white/50">Uppercase letters and numbers only.</p>
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

              <button
                onClick={handleCreateToken}
                disabled={isCreating || !formData.name.trim() || !formData.symbol.trim() || !formData.imageUrl}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating Token...</span>
                  </div>
                ) : (
                  'Create Flipflop Token'
                )}
              </button>

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