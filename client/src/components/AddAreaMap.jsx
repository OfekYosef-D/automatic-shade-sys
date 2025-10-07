import React, { useState } from 'react';
import { Plus, X, Map, Upload } from 'lucide-react';
import { getAuthHeadersForFormData } from '../utils/api';

const AddAreaMap = ({ onMapAdded }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    mapName: '',
    mapDescription: '',
    mapFile: null
  });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, mapFile: file }));
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mapFile || !formData.mapName.trim()) return;

    setLoading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 200);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('mapFile', formData.mapFile);
      formDataToSend.append('mapName', formData.mapName);
      formDataToSend.append('mapDescription', formData.mapDescription);

      const response = await fetch('/api/maps/upload', {
        method: 'POST',
        headers: getAuthHeadersForFormData(),
        body: formDataToSend,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        // Reset form and close modal
        setTimeout(() => {
          setFormData({
            mapName: '',
            mapDescription: '',
            mapFile: null
          });
          setPreviewUrl('');
          setUploadProgress(0);
          setIsModalOpen(false);
          
          // Notify parent component
          if (onMapAdded) {
            onMapAdded();
          }
        }, 500);
      } else {
        // Failed to upload map
        clearInterval(progressInterval);
        setUploadProgress(0);
      }
    } catch {
      // Error uploading map
      clearInterval(progressInterval);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      {/* Add Map Button */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Map className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Area Map</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload a map, floor plan, or sketch of your area
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Map
          </button>
        </div>
      </div>

      {/* Modal */}  
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-transparent bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Upload Area Map</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* File Upload */}
              <div>
                <label htmlFor="mapFile" className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Map File *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="mapFile"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="mapFile"
                          name="mapFile"
                          type="file"
                          accept="image/*,.svg"
                          onChange={handleFileChange}
                          className="sr-only"
                          required
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, SVG up to 10MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {previewUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preview
                  </label>
                  <div className="border border-gray-300 rounded-md p-2">
                    <img 
                      src={previewUrl} 
                      alt="Map preview" 
                      className="w-full h-auto max-h-64 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Map Name */}
              <div>
                <label htmlFor="mapName" className="block text-sm font-medium text-gray-700 mb-1">
                  Map Name *
                </label>
                <input
                  type="text"
                  id="mapName"
                  name="mapName"
                  value={formData.mapName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Main Building Floor Plan, Patio Layout"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Map Description */}
              <div>
                <label htmlFor="mapDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="mapDescription"
                  name="mapDescription"
                  value={formData.mapDescription}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Describe the area, its features, and any important details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Upload Progress */}
              {loading && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.mapFile || !formData.mapName.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading {uploadProgress}%
                    </>
                  ) : (
                    'Upload Map'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddAreaMap;
