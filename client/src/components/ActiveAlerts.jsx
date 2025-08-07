import React from 'react';
import { MapPin } from 'lucide-react';

const ActiveAlerts = ({ alerts = [] }) => {
  // This function determines what color to use for priority badges
  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
      
      {alerts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No active alerts</p>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{alert.description}</p>
                  <p className="text-sm text-gray-600 mt-1">{alert.location}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                    {alert.priority}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
                    <MapPin size={16} className="mr-1" />
                    View on Map
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveAlerts; 