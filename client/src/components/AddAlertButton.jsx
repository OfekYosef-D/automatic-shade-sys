import React from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AddAlertButton = () => {
  const navigate = useNavigate();

  const handleAddAlert = () => {
    navigate('/add-alert');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Alert</h3>
        <p className="text-sm text-gray-600 mb-4">
          Add new alerts to the system to inform users of important issues
        </p>
        <button
          onClick={handleAddAlert}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Alert
        </button>
      </div>
    </div>
  );
};

export default AddAlertButton;