import React, { useState, useEffect } from 'react';
import { Settings, Clock, User, MapPin } from 'lucide-react';

const ActiveOverrides = () => {
  const [overrides, setOverrides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverrides();
  }, []);

  const fetchOverrides = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/shades/overrides');
      const data = await response.json();
      setOverrides(data);
    } catch (error) {
      console.error('Error fetching overrides:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getOverrideTypeColor = (type) => {
    switch (type) {
      case 'open':
        return 'text-green-600 bg-green-100';
      case 'close':
        return 'text-red-600 bg-red-100';
      case 'partial':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getOverrideTypeLabel = (type) => {
    switch (type) {
      case 'open':
        return 'Open';
      case 'close':
        return 'Closed';
      case 'partial':
        return 'Partial';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Active Manual Overrides
        </h2>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
          {overrides.length} active
        </span>
      </div>

      {overrides.length > 0 ? (
        <div className="space-y-3">
          {overrides.map((override) => (
            <div key={override.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getOverrideTypeColor(override.override_type)}`}>
                      {getOverrideTypeLabel(override.override_type)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Position: {override.position}%
                    </span>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-1">
                    {override.shade_description}
                  </h3>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>B{override.building_number}, {override.floor}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      <span>{override.user_name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{formatTime(override.created_at)}</span>
                    </div>
                  </div>
                  
                  {override.reason && (
                    <p className="text-sm text-gray-500 mt-2">
                      Reason: {override.reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No active manual overrides</p>
          <p className="text-sm">All shading devices are operating automatically</p>
        </div>
      )}
    </div>
  );
};

export default ActiveOverrides;
