import React, { useState } from 'react';
import { Plus, X, Blinds, Umbrella, Building, Home, Scissors, VenetianMask } from 'lucide-react';
import { getAuthHeaders } from '../utils/api';

const AddShadeDevice = ({ area, onDeviceAdded, onDeviceError, user, position, isSidebar = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    type: 'blinds',
    current_position: 50
  });
  const [loading, setLoading] = useState(false);

  const shadeTypes = [
    { value: 'blinds', label: 'Blinds', icon: <Blinds className="w-4 h-4" /> },
    { value: 'curtains', label: 'Curtains', icon: <VenetianMask className="w-4 h-4" /> },
    { value: 'shutters', label: 'Shutters', icon: <Home className="w-4 h-4" /> },
    { value: 'umbrella', label: 'Umbrella', icon: <Umbrella className="w-4 h-4" /> },
    { value: 'pergola', label: 'Pergola', icon: <Building className="w-4 h-4" /> }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    
    try {
      const response = await fetch('/api/shades/shades', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          area_id: area.id,
          description: formData.description,
          type: formData.type,
          current_position: formData.current_position,
          target_position: formData.current_position, // Use current_position as target_position
          x: position?.x || 0,
          y: position?.y || 0
        }),
      });

      if (response.ok) {
        // Reset form and close modal
        setFormData({
          description: '',
          type: 'blinds',
          current_position: 50
        });
        setIsModalOpen(false);
        
        // Notify parent component to refresh shades
        if (onDeviceAdded) {
          onDeviceAdded();
        }
      } else {
        // Failed to add shade device
        if (onDeviceError) {
          onDeviceError('Failed to add device');
        }
      }
    } catch {
      // Error adding shade device
      if (onDeviceError) {
        onDeviceError('Error adding device');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'current_position' ? parseInt(value) : value
    }));
  };

  return (
    <>
      {/* Add Device Button - Only show when not in sidebar mode */}
      {!isSidebar && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Blinds className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Shading Device</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add new shading devices to {area.map_name || 'this area'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Device
            </button>
          </div>
        </div>
      )}

      {/* Modal - Only show when not in sidebar mode */}
      {isModalOpen && !isSidebar && (
        <div className="fixed inset-0 bg-transparent bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add Shading Device</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Area Info */}
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">Adding device to:</p>
                <p className="font-medium text-gray-900">{area.map_name || 'Area'}</p>
                {area.map_description && (
                  <p className="text-sm text-gray-600">{area.map_description}</p>
                )}
                {position && (
                  <p className="text-sm text-gray-600 mt-1">
                    Position: ({Math.round(position.x)}, {Math.round(position.y)})
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Device Description *
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Main Window Blinds, Patio Umbrella"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Device Type *
                </label>
                                 <div className="grid grid-cols-2 gap-2">
                   {shadeTypes.map(type => (
                     <button
                       key={type.value}
                       type="button"
                       onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                       className={`flex items-center space-x-2 p-3 border rounded-md transition-colors ${
                         formData.type === type.value
                           ? 'border-blue-500 bg-blue-50 text-blue-700'
                           : 'border-gray-300 hover:border-gray-400'
                       }`}
                     >
                       {type.icon}
                       <span>{type.label}</span>
                     </button>
                   ))}
                 </div>
              </div>

              {/* Initial Position */}
              <div>
                <label htmlFor="current_position" className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Position: {formData.current_position}%
                </label>
                <input
                  type="range"
                  id="current_position"
                  name="current_position"
                  min="0"
                  max="100"
                  value={formData.current_position}
                  onChange={handleInputChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Closed</span>
                  <span>Open</span>
                </div>
              </div>



              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.description.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    'Add Device'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar Form - Show directly when in sidebar mode */}
      {isSidebar && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Device Description *
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="e.g., Main Window Blinds, Patio Umbrella"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Device Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {shadeTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  className={`flex items-center space-x-2 p-3 border rounded-md transition-colors ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {type.icon}
                  <span className="text-sm">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Initial Position */}
          <div>
            <label htmlFor="current_position" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Position: {formData.current_position}%
            </label>
            <input
              type="range"
              id="current_position"
              name="current_position"
              min="0"
              max="100"
              value={formData.current_position}
              onChange={handleInputChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Closed</span>
              <span>Open</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !formData.description.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding...
              </>
            ) : (
              'Add Device'
            )}
          </button>
        </form>
      )}
    </>
  );
};

export default AddShadeDevice;
