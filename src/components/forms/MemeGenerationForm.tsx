import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useParameterOptions } from '../../hooks/useParameterOptions';
import { apiService } from '../../services/api';
import { LoginModal } from '../auth/LoginModal';
import { CREDIT_COSTS, USER_TIER_LABELS, USER_TIER_DESCRIPTIONS, type UserTierType } from '../../config/config';
import type { DirectImageGenerationRequest, DirectImageGenerationResponse } from '../../types/api';

interface MemeGenerationFormProps {
  onGenerated?: (result: DirectImageGenerationResponse) => void;
}

export const MemeGenerationForm: React.FC<MemeGenerationFormProps> = ({ onGenerated }) => {
  const { quota, refreshQuota, isAuthenticated } = useAuth();
  const { options, loading: optionsLoading } = useParameterOptions();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<UserTierType>('free');

  const [formData, setFormData] = useState<DirectImageGenerationRequest>({
    user_input: '',
    user_tier: 'free',
    image_count: 1,
    shape: 'circle',
    text_option: 'no_text',
    aspect_ratio: '1:1',
    image_format: 'png',
    style_preference: '',
    background_preference: '',
  });

  const [charCount, setCharCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    setCharCount(formData.user_input.length);
  }, [formData.user_input]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, user_tier: selectedTier }));
  }, [selectedTier]);

  const handleInputChange = (field: keyof DirectImageGenerationRequest, value: string) => {
    const processedValue = field === 'image_count' ? parseInt(value, 10) : value;
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
    const requiredCredits = CREDIT_COSTS[selectedTier];
    if (!quota || quota.remaining_quota < requiredCredits) {
      setShowLoginModal(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.generateImageDirect(formData);
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
            <span className="ml-2 text-xs text-gray-500">({charCount}/500)</span>
          </label>
          <textarea
            value={formData.user_input}
            onChange={(e) => handleInputChange('user_input', e.target.value)}
            maxLength={500}
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
              value={formData.image_count}
              onChange={(e) => handleInputChange('image_count', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1 Image</option>
              <option value={2}>2 Images</option>
              <option value={3}>3 Images</option>
              <option value={4}>4 Images</option>
            </select>
          </div>

          {/* Shape */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shape</label>
            <select
              value={formData.shape}
              onChange={(e) => handleInputChange('shape', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {options.shapes.map(shape => (
                <option key={shape} value={shape}>
                  {shape.charAt(0).toUpperCase() + shape.slice(1)} - {options.descriptions.shapes[shape]}
                </option>
              ))}
            </select>
          </div>

          {/* Text Option */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Text</label>
            <select
              value={formData.text_option}
              onChange={(e) => handleInputChange('text_option', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {options.text_options.map(option => (
                <option key={option} value={option}>
                  {option.replace('_', ' ').charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')} - {options.descriptions.text_options[option]}
                </option>
              ))}
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
          <div>
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
          </div>

          {/* Style Preference */}
          <div>
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

          {/* Background Preference */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Preference (Optional)
            </label>
            <input
              type="text"
              value={formData.background_preference || ''}
              onChange={(e) => handleInputChange('background_preference', e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., neon city, cosmic space"
            />
          </div>
        </div>

        {/* Model Selection */}
        <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 p-6 rounded-xl border border-indigo-200 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white text-lg">🎯</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Choose Your AI Model</h3>
              <p className="text-sm text-gray-600">Select the quality tier that fits your needs</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(USER_TIER_LABELS).map(([tier, label]) => {
              const tierKey = tier as UserTierType;
              const cost = CREDIT_COSTS[tierKey];
              const description = USER_TIER_DESCRIPTIONS[tierKey];
              const isSelected = selectedTier === tier;
              const tierColors = {
                free: 'from-green-400 to-green-600',
                dev: 'from-blue-400 to-blue-600', 
                pro: 'from-purple-400 to-purple-600',
                max: 'from-orange-400 to-red-600'
              };
              
              return (
                <label key={tier} className={`relative cursor-pointer group transform transition-all duration-200 hover:scale-105 ${
                  isSelected ? 'scale-105' : ''
                }`}>
                  <input
                    type="radio"
                    name="userTier"
                    value={tier}
                    checked={isSelected}
                    onChange={(e) => setSelectedTier(e.target.value as UserTierType)}
                    className="sr-only"
                  />
                  <div className={`relative p-5 rounded-xl border-2 transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? 'border-transparent bg-white shadow-lg ring-2 ring-blue-500 ring-opacity-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}>
                    {/* Gradient background for selected */}
                    {isSelected && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${tierColors[tierKey]} opacity-5`}></div>
                    )}
                    
                    {/* Content */}
                    <div className="relative text-center">
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${tierColors[tierKey]} flex items-center justify-center`}>
                        <span className="text-white font-bold text-lg">
                          {tier === 'free' ? '🆓' : tier === 'dev' ? '⚡' : tier === 'pro' ? '💎' : '🚀'}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-lg text-gray-800 mb-1">
                        {label}
                      </h4>
                      
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mb-3 ${
                        isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        <span className="mr-1">💳</span>
                        {cost} credit{cost > 1 ? 's' : ''}
                      </div>
                      
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {description}
                      </p>
                    </div>
                    
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          
          {/* Current selection summary */}
          {/* <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">Selected:</span>
                <span className="ml-2 font-bold text-gray-900">{USER_TIER_LABELS[selectedTier]}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Cost:</span>
                <span className="font-bold text-blue-600">{CREDIT_COSTS[selectedTier]} credit{CREDIT_COSTS[selectedTier] > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div> */}
        </div>

        {/* Submit Button */}
        <div className="relative">
          <button
            type="submit"
            disabled={loading || charCount === 0 || (quota != null && quota.remaining_quota < CREDIT_COSTS[selectedTier])}
            className={`group relative w-full py-5 px-8 rounded-xl font-bold text-lg transition-all duration-300 overflow-hidden ${
              loading || charCount === 0 || (quota && quota.remaining_quota < CREDIT_COSTS[selectedTier])
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transform hover:scale-105 shadow-xl hover:shadow-2xl cursor-pointer'
            }`}
          >
            {/* Animated background */}
            {!loading && charCount > 0 && (!quota || quota.remaining_quota >= CREDIT_COSTS[selectedTier]) && (
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
                  <span>Generate Meme Image{formData.image_count && formData.image_count > 1 ? 's' : ''}</span>
                  <div className="ml-3 px-3 py-1 text-gray-500 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                    {(CREDIT_COSTS[selectedTier] * (formData.image_count || 1))} credit{(CREDIT_COSTS[selectedTier] * (formData.image_count || 1)) > 1 ? 's' : ''}
                  </div>
                </>
              )}
            </div>
            
            {/* Shine effect */}
            {!loading && charCount > 0 && (!quota || quota.remaining_quota >= (CREDIT_COSTS[selectedTier] * (formData.image_count || 1))) && (
              <div className="absolute inset-0 -top-2 -left-2 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transform -skew-x-12 group-hover:animate-pulse"></div>
            )}
          </button>
          
          {/* Credit warning */}
          {quota && quota.remaining_quota < (CREDIT_COSTS[selectedTier] * (formData.image_count || 1)) && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <span className="text-sm text-red-700">
                  Insufficient credits. You need {CREDIT_COSTS[selectedTier] * (formData.image_count || 1)} credits but only have {quota.remaining_quota}.
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