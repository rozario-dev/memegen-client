import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../lib/api';
import { TIER_CONFIG, DEFAULT_USER_TIER } from '../../lib/constants';
import type { DirectImageGenerationResponse, ImageModifyRequest, ModifiedImage, UserTierType } from '../../lib/types';
import { ModelSelector } from '../forms/ModelSelector';
import { StyleSelector } from '../forms/StyleSelector';

interface ResultsDisplayProps {
  result: DirectImageGenerationResponse;
  onRegenerate?: () => void;
}

interface ModifyState {
  selectedImageUuid: string | null;
  selectedImageUrl: string | null;
  modifyPrompt: string;
  selectedStyle: string;
  selectedTier: UserTierType;
  isModifying: boolean;
  error: string | null;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  result, 
  onRegenerate 
}) => {  
  const navigate = useNavigate();
  const { solanaWalletAddress } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCreateToken = (imageUrl: string) => {
    if (!solanaWalletAddress) {
      alert('Please connect your Solana wallet first to create tokens.');
      return;
    }
    navigate('/launch', { state: { imageUrl } });
  };
  
  // Helper function to get credits consumed
  const getCreditsConsumed = () => {
    return 'credits_consumed' in result ? result.credits_consumed : 0;
  };
  const [modifyState, setModifyState] = useState<ModifyState>({
    selectedImageUuid: null,
    selectedImageUrl: null,
    modifyPrompt: '',
    selectedStyle: '',
    selectedTier: DEFAULT_USER_TIER,
    isModifying: false,
    error: null
  });
  const [modifiedImages, setModifiedImages] = useState<ModifiedImage[]>([]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.generated_prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleImageClick = (imageUuid: string, imageUrl: string) => {
    setModifyState(prev => ({
      ...prev,
      selectedImageUuid: prev.selectedImageUuid === imageUuid ? null : imageUuid,
      selectedImageUrl: prev.selectedImageUuid === imageUuid ? null : imageUrl,
      modifyPrompt: '',
      error: null
    }));
  };

  const handleModifyImage = async () => {
    if (!modifyState.selectedImageUuid || !modifyState.selectedImageUrl || !modifyState.modifyPrompt.trim()) {
      return;
    }

    setModifyState(prev => ({ ...prev, isModifying: true, error: null }));

    try {
      const modifyRequest: ImageModifyRequest = {
        prompt: modifyState.modifyPrompt.trim() + ", " + modifyState.selectedStyle,
        seed_images: [modifyState.selectedImageUrl],
        user_tier: modifyState.selectedTier
      };

      // console.log('[ResultsDisplay] /images/modify seed_images:', modifyRequest.seed_images);
      const response = await apiService.modifyImage(modifyRequest);
      const newModifiedImage: ModifiedImage = {
        id: response.image_uuid,
        imageUrl: response.image_url,
        modelName: response.model_name || 'Modified Image',
        createdAt: response.created_at || new Date().toISOString(),
        userTier: response.user_tier || modifyState.selectedTier,
        prompt: modifyState.modifyPrompt,
        timestamp: new Date()
      };
      setModifiedImages(prev => [...prev, newModifiedImage]);
      setModifyState({
        selectedImageUuid: null,
        selectedImageUrl: null,
        modifyPrompt: '',
        selectedStyle: '',
        selectedTier: DEFAULT_USER_TIER,
        isModifying: false,
        error: null
      });
    } catch (error: any) {
      console.error('Image modification failed:', error);
      setModifyState(prev => ({
        ...prev,
        isModifying: false,
        error: error?.message || 'Failed to modify image'
      }));
    }
  };

  // Create a unified image structure for display
  const originalImages = (result.images || []).map(img => ({
    ...img,
    isModified: false
  }));
  
  const modifiedImagesList = modifiedImages.map(img => ({
    image_uuid: img.id,
    image_url: img.imageUrl,
    isModified: true,
    model_name: img.modelName
  }));
  
  const allImages = [...originalImages, ...modifiedImagesList];

  return (
    <div className="max-w-4xl mx-auto md:p-6">
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <h2 className="text-3xl font-bold text-white">Generated Images</h2>
          </div>
          <p className="text-blue-100 mt-2 text-lg">Click on any image to modify it with AI</p>
        </div>

        {/* Content */}
        <div className="md:p-6 p-3 space-y-6">
          {/* Generated Prompt */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Generated Prompt</h3>
            </div>
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 md:p-6 p-3 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-300">
              <p className="text-gray-700 leading-relaxed font-medium">{result.generated_prompt}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onRegenerate}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Generate New
            </button>
            
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg transition-colors ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {copied ? '✅ Copied!' : 'Copy Prompt'}
            </button>
          </div>

          {/* Images Grid */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Generated Images</h3>
              <div className="flex-1"></div>
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {allImages.length} image{allImages.length > 1 ? 's' : ''}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {allImages.map((imageResult, index) => (
                 <div key={`${imageResult.image_uuid}-${index}`} className="relative group">
                   <div 
                     className={`relative overflow-hidden rounded-2xl border-3 cursor-pointer transition-all duration-500 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 ${
                       modifyState.selectedImageUuid === imageResult.image_uuid
                         ? 'border-blue-500 ring-4 ring-blue-200'
                         : 'border-gray-200 hover:border-blue-400'
                     }`}
                     onClick={() => handleImageClick(imageResult.image_uuid, imageResult.image_url)}
                   >
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
                      <img
                        src={imageResult.image_url}
                        alt={`Generated image ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-4 left-4 right-4 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-800">Click to modify with AI</p>
                        {/* {imageResult.model_name && (
                          <p className="text-xs text-gray-600 mt-1">Model: {imageResult.model_name}</p>
                        )} */}
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      {/* Create Token Button - Only show for Solana users */}
                      {solanaWalletAddress && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateToken(imageResult.image_url);
                          }}
                          className="p-2 bg-gradient-to-r text-sm cursor-pointer from-purple-500 to-pink-500 text-white rounded-lg shadow-lg hover:from-purple-600 hover:to-pink-600 hover:scale-110 transition-all duration-300"
                          title="Create token"
                        >
                          Create Token
                          {/* <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg> */}
                        </button>
                      )}
                      
                      {/* Download Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(imageResult.image_url, '_blank');
                        }}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white hover:scale-110 transition-all duration-300"
                        title="Open image in new tab"
                      >
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    </div>
                    
                    {imageResult.isModified && (
                       <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                         ✨ Modified
                       </div>
                     )}
                     
                     {/* Model info badge */}
                     {imageResult.model_name && (
                       <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{top: imageResult.isModified ? '60px' : '16px'}}>
                         {imageResult.model_name}
                       </div>
                     )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image Modification Panel */}
          {modifyState.selectedImageUuid && (
            <div className="mt-8 p-3 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {/* <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  </div> */}
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    🎨 Modification
                  </h3>
                </div>
                <button
                  onClick={() => setModifyState(prev => ({ ...prev, selectedImageUuid: null, selectedImageUrl: null, modifyPrompt: '', selectedTier: DEFAULT_USER_TIER, error: null }))}
                  className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-1/3 space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <h4 className="text-lg font-bold text-gray-800">Original Image</h4>
                  </div>
                  <div className="relative group">
                    <img
                      src={modifyState.selectedImageUrl || ''}
                      alt="Selected image"
                      className="w-full h-auto rounded-xl border-3 border-gray-300 shadow-lg group-hover:shadow-xl transition-all duration-300"
                    />
                    {/* <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div> */}
                  </div>
                </div>
                
                <div className="lg:w-2/3 space-y-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <h4 className="text-lg font-bold text-gray-800">Modification Instructions</h4>
                  </div>
                  <div className="relative">
                    <textarea
                      value={modifyState.modifyPrompt}
                      onChange={(e) => setModifyState(prev => ({ ...prev, modifyPrompt: e.target.value }))}
                      placeholder="Describe how you want to modify this image... ex: Change the background to a sunset, Add sunglasses to the character, Make it more colorful"
                      className="w-full h-40 p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 resize-none transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      maxLength={500}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                      {modifyState.modifyPrompt.length}/500
                    </div>
                  </div>

                  <StyleSelector
                    label="Style Preset"
                    onSelect={({ name, description }) => {
                      setModifyState(prev => ({
                        ...prev,
                        selectedStyle: name + "(" + description + ")"
                      }));
                    }}
                  />

                  {/* Tier Selection for Modification */}
                  <ModelSelector 
                    selectedTier={modifyState.selectedTier}
                    setSelectedTier={(tier) => setModifyState(prev => ({ ...prev, selectedTier: tier }))}
                    action='modify'
                  />
                  
                  {modifyState.error && (
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-800 font-medium">{modifyState.error}</p>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={handleModifyImage}
                    disabled={modifyState.isModifying || !modifyState.modifyPrompt.trim()}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                      modifyState.isModifying
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : !modifyState.modifyPrompt.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {modifyState.isModifying ? (
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Modifying Image...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        <span>Modify Image</span>
                        <div className="ml-2 px-2 py-1 text-gray-500 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                          {TIER_CONFIG[modifyState.selectedTier]?.credit} credit{(TIER_CONFIG[modifyState.selectedTier]?.credit as number) > 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Usage Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">💡 Usage Tips</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Click on any image to select and modify it</li>
              <li>• Modified images will appear alongside the original</li>
              <li>• You can continue modifying the modified images</li>
              <li>• Copy the prompt to use with other AI image generators</li>
            </ul>
          </div>

          {/* Metadata */}
           <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200 md:p-6 p-3 mt-6">
             <div className="flex items-center space-x-3 mb-4">
               <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-blue-500 rounded-lg flex items-center justify-center">
                 <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                   <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                 </svg>
               </div>
               <h3 className="text-lg font-bold text-gray-800">Generation Metadata</h3>
             </div>
             <div className="grid grid-cols-2 grid-cols-3 gap-2">
               <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
                 <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                 <div>
                   <span className="text-xs font-medium text-gray-600 block">Credits</span>
                   <span className="text-sm font-bold text-green-700">{getCreditsConsumed()}</span>
                 </div>
               </div>
               <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
                 <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                 <div>
                   <span className="text-xs font-medium text-gray-600 block">Avg Time</span>
                   <span className="text-sm font-bold text-purple-700">{result.images?.[0]?.generation_time ? `${result.images[0].generation_time.toFixed(1)}s` : 'N/A'}</span>
                 </div>
               </div>
               <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200">
                 <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                 <div>
                   <span className="text-xs font-medium text-gray-600 block">Images</span>
                   <span className="text-xs font-bold text-orange-700">{result.images?.length || 0}</span>
                 </div>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};