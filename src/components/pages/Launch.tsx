import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocation, Navigate } from 'react-router-dom';

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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, imageUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
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
      // This would involve creating a token on Solana with the provided metadata
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">
            🚀 Create Flipflop Token
          </h1>
          
          <div className="space-y-6">
            {/* Token Name Input */}
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
                placeholder="Enter token name (e.g., My Awesome Token)"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Token Symbol Input */}
            <div>
              <label htmlFor="symbol" className="block text-white text-sm font-medium mb-2">
                Token Symbol
              </label>
              <input
                type="text"
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder="Enter token symbol (e.g., MAT)"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={10}
              />
            </div>

            {/* Image Upload */}
            <div>
              <label htmlFor="image" className="block text-white text-sm font-medium mb-2">
                Token Image
              </label>
              <div className="space-y-4">
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                
                {/* Image Preview */}
                {formData.imageUrl && (
                  <div className="flex justify-center">
                    <div className="relative">
                      <img
                        src={formData.imageUrl}
                        alt="Token preview"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-white/20"
                      />
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '', image: null }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Message */}
            {createStatus.message && (
              <div className={`p-4 rounded-lg ${
                createStatus.type === 'success' 
                  ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                  : 'bg-red-500/20 border border-red-500/30 text-red-300'
              }`}>
                {createStatus.message}
              </div>
            )}

            {/* Create Button */}
            <button
              onClick={handleCreateToken}
              disabled={isCreating || !formData.name.trim() || !formData.symbol.trim()}
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

            {/* Wallet Info */}
            <div className="text-center text-white/60 text-sm">
              Connected wallet: {solanaWalletAddress?.slice(0, 8)}...{solanaWalletAddress?.slice(-8)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};