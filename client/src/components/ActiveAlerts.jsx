import React, { useState } from 'react';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const ActiveAlerts = ({ alerts = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const alertsPerPage = 3;
  const totalPages = Math.ceil(alerts.length / alertsPerPage);

  // This function determines what color to use for priority badges
  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const nextPage = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const getCurrentAlerts = () => {
    const startIndex = currentIndex * alertsPerPage;
    return alerts.slice(startIndex, startIndex + alertsPerPage);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={prevPage}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              disabled={totalPages <= 1}
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <span className="text-sm text-gray-500">
              {currentIndex + 1} of {totalPages}
            </span>
            <button
              onClick={nextPage}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              disabled={totalPages <= 1}
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        )}
      </div>
      
      {alerts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No active alerts</p>
      ) : (
        <div className="space-y-4">
          {getCurrentAlerts().map((alert, index) => (
            <div key={alert.id || index} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{alert.description}</p>
                  <p className="text-sm text-gray-600 mt-1">{alert.location}</p>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                    {alert.priority}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center whitespace-nowrap">
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