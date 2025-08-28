import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useParameterOptions } from '../../hooks/useParameterOptions';
import { useMemeGeneration } from '../../hooks/useMemeGeneration';
import { LoginModal } from '../auth/LoginModal';
import type { PromptRequest, PromptResponse } from '../../types/api';

interface MemeGenerationFormProps {
  onGenerated?: (result: PromptResponse) => void;
}

export const MemeGenerationForm: React.FC<MemeGenerationFormProps> = ({ onGenerated }) => {
  const { quota, refreshQuota, isAuthenticated } = useAuth();
  const { options, loading: optionsLoading } = useParameterOptions();
  const { generateSync, loading, error, result } = useMemeGeneration();

  const [formData, setFormData] = useState<PromptRequest>({
    user_input: '',
    shape: 'circle',
    text_option: 'no_text',
    quality: '8K',
    style_preference: '',
    background_preference: '',
  });

  const [charCount, setCharCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    setCharCount(formData.user_input.length);
  }, [formData.user_input]);

  useEffect(() => {
    if (result && onGenerated) {
      onGenerated(result);
    }
  }, [result, onGenerated]);

  const handleInputChange = (field: keyof PromptRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is authenticated first
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // Check quota for authenticated users
    if (!quota || quota.remaining_quota <= 0) {
      setShowLoginModal(true);
      return;
    }

    try {
      await generateSync(formData);
      await refreshQuota();
    } catch (error) {
      console.error('Generation failed:', error);
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
            <span className="ml-2 text-xs text-gray-500">({charCount}/200)</span>
          </label>
          <textarea
            value={formData.user_input}
            onChange={(e) => handleInputChange('user_input', e.target.value)}
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Describe your meme coin concept..."
            required
          />
          <div className="mt-2 text-xs text-gray-500">
            💡 Best practice - Role + Action: "Shiba Inu riding a rocket to the moon" or "Cyber cat with diamond hands"
          </div>
        </div>

        {/* Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
            <select
              value={formData.quality}
              onChange={(e) => handleInputChange('quality', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {options.quality_options.map(quality => (
                <option key={quality} value={quality}>
                  {quality} - {options.descriptions.quality_options[quality]}
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



        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || charCount === 0 || (quota != null && quota.remaining_quota <= 0)}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            loading || charCount === 0 || (quota && quota.remaining_quota <= 0)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : quota && quota.remaining_quota <= 0 ? (
            'No Credits Remaining'
          ) : (
            `Generate (${quota?.remaining_quota || '0'} credits)`
          )}
        </button>

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