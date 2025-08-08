import React from 'react';
import { Plus, Blinds } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AddDeviceButton = () => {
  const navigate = useNavigate();

  const handleAddDevice = () => {
    navigate('/add-device');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Blinds className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Shading Device</h3>
        <p className="text-sm text-gray-600 mb-4">
          Add new blinds, shades, or other shading devices to rooms and buildings
        </p>
        <button
          onClick={handleAddDevice}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Device
        </button>
      </div>
    </div>
  );
};

export default AddDeviceButton; 