import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useParameterOptions } from '../../hooks/useParameterOptions';
import { apiService } from '../../lib/api';
import { LoginModal } from '../auth/LoginModal';
import { CREDIT_COSTS, DEFAULT_USER_TIER, type UserTierType } from '../../lib/constants';
import type { DirectImageGenerationResponse, DirectMultipleImageGenerationRequest } from '../../lib/types';
import { ModelSelector } from './ModelSelector';

interface MemeGenerationFormProps {
  onGenerated?: (result: DirectImageGenerationResponse) => void;
}

export const MemeGenerationForm: React.FC<MemeGenerationFormProps> = ({ onGenerated }) => {
  const { quota, refreshQuota, isAuthenticated } = useAuth();
  const { options, loading: optionsLoading } = useParameterOptions();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<UserTierType>(DEFAULT_USER_TIER);

  const [formData, setFormData] = useState<DirectMultipleImageGenerationRequest>({
    user_input: '',
    user_tier: DEFAULT_USER_TIER,
    count: 1,
    aspect_ratio: '1:1',
    image_format: 'png',
    style_preference: '',
  });

  const [charCount, setCharCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    setCharCount(formData.user_input.length);
  }, [formData.user_input]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, user_tier: selectedTier }));
  }, [selectedTier]);

  const handleInputChange = (field: keyof DirectMultipleImageGenerationRequest, value: string) => {
    const processedValue = field === 'count' ? parseInt(value, 10) : value;
    setFormData(prev => ({ ...prev, [field]: processedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is authenticated first
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // Check quota for authenticated users
    const imageCount = formData.count || 1;
    const requiredCredits = (CREDIT_COSTS[selectedTier] as number) * imageCount;
    if (!quota || quota.remaining_quota < requiredCredits) {
      setShowLoginModal(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const multipleRequest = {
        ...formData,
        count: imageCount
      };
      const response = await apiService.generateMultipleImagesDirect(multipleRequest);
      
      if (onGenerated) {
        onGenerated(response);
      }
      await refreshQuota();
    } catch (error: any) {
      console.error('Generation failed:', error);
      setError(error?.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  if (optionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!options) {
    return (
      <div className="text-center text-red-500 p-4">
        Failed to load parameter options. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Quota Display */}
      {quota && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">
              Remaining Credits: {quota.remaining_quota} / {quota.total_quota}
            </span>
            <div className="w-32 bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(quota.remaining_quota / quota.total_quota) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Meme Concept
            <span className="ml-2 text-xs text-gray-500">({charCount}/1000)</span>
          </label>
          <textarea
            value={formData.user_input}
            onChange={(e) => handleInputChange('user_input', e.target.value)}
            maxLength={1000}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Describe your meme image concept..."
            required
          />
          <div className="mt-2 text-xs text-gray-500">
            💡 Best practice - Role + Action: "Shiba Inu riding a rocket to the moon" or "Cyber cat with diamond hands"
          </div>
        </div>

        {/* Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Images</label>
            <select
              value={formData.count}
              onChange={(e) => handleInputChange('count', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1 Image</option>
              <option value={2}>2 Images</option>
              <option value={3}>3 Images</option>
              <option value={4}>4 Images</option>
            </select>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
            <select
              value={formData.aspect_ratio}
              onChange={(e) => handleInputChange('aspect_ratio', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {options.aspect_ratios.map(ratio => (
                <option key={ratio} value={ratio}>
                  {ratio} - {options.descriptions.aspect_ratios[ratio]}
                </option>
              ))}
            </select>
          </div>

          {/* Image Format */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image Format</label>
            <select
              value={formData.image_format}
              onChange={(e) => handleInputChange('image_format', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {options.image_formats.map(format => (
                <option key={format} value={format}>
                  {format} - {options.descriptions.image_formats[format]}
                </option>
              ))}
            </select>
          </div> */}

          {/* Style Preference */}
          <div className='hidden'>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Style Preference (Optional)
            </label>
            <input
              type="text"
              value={formData.style_preference || ''}
              onChange={(e) => handleInputChange('style_preference', e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., cyberpunk, vaporwave"
            />
          </div>

        </div>

        {/* Model Selection */}
        <ModelSelector selectedTier={selectedTier} setSelectedTier={setSelectedTier} action='create'/>

        {/* Submit Button */}
        <div className="relative">
          <button
            type="submit"
            disabled={loading || charCount === 0 || (quota != null && quota.remaining_quota < (CREDIT_COSTS[selectedTier] as number))}
            className={`group relative w-full py-5 px-8 rounded-xl font-bold text-lg transition-all duration-300 overflow-hidden ${
              loading || charCount === 0 || (quota && quota.remaining_quota < (CREDIT_COSTS[selectedTier] as number))
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transform hover:scale-105 shadow-xl hover:shadow-2xl cursor-pointer'
            }`}
          >
            {/* Animated background */}
            {!loading && charCount > 0 && (!quota || quota.remaining_quota >= (CREDIT_COSTS[selectedTier] as number)) && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
            
            {/* Button content */}
            <div className="relative flex items-center justify-center">
              {loading ? (
                <>
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-lg">Creating Your Meme...</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 animate-pulse"></div>
                </>
              ) : (
                <>
                  <span className="text-2xl mr-3">🎨</span>
                  <span>Generate Meme Image{formData.count && formData.count > 1 ? 's' : ''}</span>
                  <div className="ml-3 px-3 py-1 text-gray-500 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                    {((CREDIT_COSTS[selectedTier] as number) * (formData.count || 1))} credit{((CREDIT_COSTS[selectedTier] as number) * (formData.count || 1)) > 1 ? 's' : ''}
                  </div>
                </>
              )}
            </div>
            
            {/* Shine effect */}
            {!loading && charCount > 0 && (!quota || quota.remaining_quota >= ((CREDIT_COSTS[selectedTier] as number) * (formData.count || 1))) && (
              <div className="absolute inset-0 -top-2 -left-2 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transform -skew-x-12 group-hover:animate-pulse"></div>
            )}
          </button>
          
          {/* Credit warning */}
          {quota && quota.remaining_quota < ((CREDIT_COSTS[selectedTier] as number) * (formData.count || 1)) && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <span className="text-sm text-red-700">
                  Insufficient credits. You need {((CREDIT_COSTS[selectedTier] as number) * (formData.count || 1))} credits but only have {quota.remaining_quota}.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}


      </form>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
};