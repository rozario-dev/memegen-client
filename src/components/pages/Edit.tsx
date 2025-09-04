import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../lib/api';
import { CREDIT_COSTS, DEFAULT_USER_TIER, type UserTierType } from '../../lib/constants';
import { LoginModal } from '../auth/LoginModal';
import type { ImageModifyRequest } from '../../lib/types';
import { ModelSelector } from '../forms/ModelSelector';
import { useLocation } from 'react-router-dom';
import { StyleSelector } from '../forms/StyleSelector';

interface EditHistory {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: Date;
  isOriginal?: boolean;
}

export const Edit: React.FC = () => {
  const { quota, refreshQuota, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<EditHistory[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [selectedTier, setSelectedTier] = useState<UserTierType>(DEFAULT_USER_TIER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showReferenceImage, setShowReferenceImage] = useState(false);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('');

  const referenceInputRef = useRef<HTMLInputElement>(null);

  // Accept image URL passed from other pages (e.g., History)
  useEffect(() => {
    const state = location.state as { imageUrl?: string } | null;
    if (state?.imageUrl) {
      const imageUrl = state.imageUrl;
      setSelectedImage(imageUrl);
      setEditHistory([{
        id: 'original',
        imageUrl,
        prompt: 'Original Image',
        timestamp: new Date(),
        isOriginal: true
      }]);
      setReferenceImages([]);
      setError(null);
    }
  }, [location.state]);

  // Handle file upload
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setSelectedImage(imageUrl);
      setEditHistory([{
        id: 'original',
        imageUrl,
        prompt: 'Original Image',
        timestamp: new Date(),
        isOriginal: true
      }]);
      setReferenceImages([]);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  // Reference images handlers
  const handleReferenceAddClick = () => {
    referenceInputRef.current?.click();
  };

  const handleReferenceFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const maxToAdd = 6 - referenceImages.length;
    if (maxToAdd <= 0) return;
    const selected = Array.from(files).slice(0, maxToAdd);

    const readers = selected.map((file) => new Promise<string>((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve('');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    }));

    Promise.all(readers).then((urls) => {
      const valid = urls.filter(Boolean) as string[];
      setReferenceImages((prev) => [...prev, ...valid].slice(0, 6));
      if (referenceInputRef.current) referenceInputRef.current.value = '';
    });
  };

  const handleRemoveReference = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle image modification
  const handleModifyImage = async () => {
    if (!selectedImage || !currentPrompt.trim()) {
      setError('Please select an image and enter modification prompt');
      return;
    }

    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    const requiredCredits = CREDIT_COSTS[selectedTier] as number;
    if (!quota || quota.remaining_quota < requiredCredits) {
      setShowLoginModal(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const modifyRequest: ImageModifyRequest = {
        prompt: currentPrompt.trim() + ", " + selectedStyle,
        seed_images: [selectedImage, ...referenceImages],
        user_tier: selectedTier
      };

      // console.log('[Edit] /images/modify seed_images:', modifyRequest.seed_images);
      const response = await apiService.modifyImage(modifyRequest);
      
      // Add to edit history
      const newEdit: EditHistory = {
        id: response.image_uuid,
        imageUrl: response.image_url,
        prompt: currentPrompt,
        timestamp: new Date()
      };
      
      setEditHistory(prev => [...prev, newEdit]);
      setSelectedImage(response.image_url);
      setCurrentPrompt('');
      
      await refreshQuota();
    } catch (error: any) {
      console.error('Image modification failed:', error);
      setError(error?.message || 'Failed to modify image');
    } finally {
      setLoading(false);
    }
  };

  // Select history image
  const selectHistoryImage = (historyItem: EditHistory) => {
    setSelectedImage(historyItem.imageUrl);
  };

  // Revert to a specific history state
  // const revertToHistory = (targetId: string) => {
  //   const targetIndex = editHistory.findIndex(item => item.id === targetId);
  //   if (targetIndex !== -1) {
  //     const newHistory = editHistory.slice(0, targetIndex + 1);
  //     setEditHistory(newHistory);
  //     setSelectedImage(newHistory[newHistory.length - 1].imageUrl);
  //   }
  // };

  return (
    <>
      {/* Hero Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            🎨 Edit Your
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {' '}Images with AI
            </span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload your images and transform them with AI-powered editing.
            Support multiple rounds of editing with history tracking.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="text-green-500">✓</span>
              <span>Multi-round editing</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="text-green-500">✓</span>
              <span>History tracking</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="text-green-500">✓</span>
              <span>AI-powered</span>
            </div>
          </div>
        </div>
      </section>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left side: Image upload and preview */}
            <div className="space-y-6">
              {/* Image upload area */}
              {!selectedImage ? (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    📁 Upload Image
                  </h2>
                  
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          Drag image here, or
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Choose File
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Supports JPG, PNG, WEBP formats
                      </p>
                    </div>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              ) : (
                /* Image preview area */
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      🖼️ Current Image
                    </h2>
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setEditHistory([]);
                        setCurrentPrompt('');
                        setReferenceImages([]);
                        setError(null);
                      }}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={selectedImage}
                      alt="Selected image"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Reference Images Section */}
                  {showReferenceImage &&
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">Reference Images(Max 6)</h3>
                      <span className="text-sm text-gray-500">{referenceImages.length}/6</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {referenceImages.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                          <img src={url} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveReference(idx)}
                            className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded"
                            aria-label="Remove"
                          >
                            Remove
                          </button>
                        </div>
                      ))}

                      {referenceImages.length < 6 && (
                        <button
                          type="button"
                          onClick={handleReferenceAddClick}
                          className="aspect-square flex items-center justify-center rounded-lg border-2 border-dashed text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors bg-white"
                        >
                          <div className="text-center">
                            <div className="text-2xl">＋</div>
                            <div className="text-xs mt-1">Add</div>
                          </div>
                        </button>
                      )}
                    </div>

                    <input
                      ref={referenceInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleReferenceFilesChange}
                      className="hidden"
                    />
                  </div>}
                </div>
              )}

              {/* Edit history */}
              {editHistory.length > 1 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    📚 Edit History
                  </h3>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {editHistory.map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedImage === item.imageUrl
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => selectHistoryImage(item)}
                      >
                        <img
                          src={item.imageUrl}
                          alt={`Edit ${index}`}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.isOriginal ? 'Original Image' : item.prompt}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        {/* {!item.isOriginal && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              revertToHistory(item.id);
                            }}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          >
                            Revert to this
                          </button>
                        )} */}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Edit control panel */}
            <div className="space-y-6">
              {selectedImage && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    ✨ AI Edit Controls
                  </h2>
                  
                  {/* Modification prompt input */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Modification Prompt
                      </label>
                      <textarea
                        value={currentPrompt}
                        onChange={(e) => setCurrentPrompt(e.target.value)}
                        placeholder="Describe the modification you want, e.g.: Change background to night sky, add neon light effects"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={4}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {currentPrompt.length}/200 characters
                      </p>
                    </div>

                    <StyleSelector
                      label="Style Preset"
                      onSelect={({ name, description }) => {
                        setSelectedStyle(name + "(" + description + ")");
                      }}
                    />

                    {/* Model selection */}
                    <ModelSelector
                      selectedTier={selectedTier}
                      setSelectedTier={setSelectedTier}
                      setShowReferenceImage={setShowReferenceImage}
                      action='modify'
                    />

                    {/* Error message */}
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}

                    {/* Modify button */}
                    <button
                      onClick={handleModifyImage}
                      disabled={loading || !currentPrompt.trim()}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors cursor-pointer ${
                        loading || !currentPrompt.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Modifying...</span>
                        </div>
                      ) : (
                        'Start Modification'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Usage tips */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">💡 Usage Tips</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Upload an image to perform multiple rounds of AI modifications</li>
                  <li>• Each modification will be saved to the history</li>
                  <li>• Click on history items to return to previous versions</li>
                  <li>• The more specific the modification prompt, the better the result</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </>
  );
};