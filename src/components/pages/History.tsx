import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import type { ImageHistoryResponse, HistoryRecord } from '../../types/api';

export const History: React.FC = () => {
  const [historyData, setHistoryData] = useState<ImageHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hideFailedRecords, setHideFailedRecords] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await apiService.getImageHistory();
        setHistoryData(data);
      } catch (err) {
        setError('Failed to load history data');
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderHistoryItem = (record: HistoryRecord) => {
    const isGenerate = record.operation_type.includes('generate');
    const isModify = record.operation_type.includes('modify');

    return (
      <div key={record.id} className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isGenerate ? '🎨 Generate' : '✏️ Modify'}
            </h3>
            <p className="text-sm text-gray-500">{formatDate(record.created_at)}</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              record.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : record.status === 'failed'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {record.status}
            </span>
            <p className="text-sm text-gray-600 mt-1">
              Cost: {record.credits_consumed} credits
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Prompt:</strong> {record.prompt}
          </p>
          {record.negative_prompt && (
            <p className="text-sm text-gray-700 mb-2">
              <strong>Negative Prompt:</strong> {record.negative_prompt}
            </p>
          )}
          <div className="flex gap-4 text-sm text-gray-600">
            <span>Model: {record.user_tier}</span>
            <span>Format: {record.image_format}</span>
            <span>Image Ratio: {record.aspect_ratio}</span>
            {record.generation_time && <span>Generation Time: {record.generation_time.toFixed(2)}s</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isModify && record.seed_image && (
            <div className="relative">
              <img
                src={record.seed_image}
                alt="Original Image"
                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedImage(record.seed_image!)}
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                Original Image
              </div>
            </div>
          )}
          
          {record.images && record.images.length > 0 && record.images.map((image, index) => (
            <div key={image.image_uuid} className="relative">
              <img
                src={image.image_url}
                alt={isModify ? 'Modified Image' : `Generated Image ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedImage(image.image_url)}
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {isModify ? 'Modified Image' : `Generated Image ${index + 1}`}
              </div>
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {image.model_name}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Load error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">📚 Generation History</h1>
                <p className="text-gray-600">
                  Total {historyData?.total_count || 0} records
                </p>
              </div>
              <button
                onClick={() => setHideFailedRecords(!hideFailedRecords)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  hideFailedRecords
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {hideFailedRecords ? 'Show all' : 'Hide Fail'}
              </button>
            </div>
          </div>

          {historyData?.history && historyData.history.length > 0 ? (
            <div>
              {historyData.history
                .filter(record => !hideFailedRecords || record.status === 'completed')
                .map(renderHistoryItem)}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No History</h3>
              <p className="text-gray-600">Start generating your first image!</p>
            </div>
          )}
        </div>
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="放大图片"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-opacity"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};