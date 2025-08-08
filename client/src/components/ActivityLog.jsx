import React from 'react';
import { RefreshCw, Edit, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const ActivityLog = ({ activities = [] }) => {
  // This function determines which icon to show based on activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'reboot': return RefreshCw;
      case 'override': return Edit;
      case 'alert': return AlertTriangle;
      case 'update': return Clock;
      case 'check': return CheckCircle;
      default: return Clock;
    }
  };

  // This function determines what color to use for the icon
  const getIconColor = (type) => {
    switch (type) {
      case 'reboot': return 'text-green-600';
      case 'override': return 'text-blue-600';
      case 'alert': return 'text-red-600';
      case 'update': return 'text-gray-600';
      case 'check': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity Log</h3>
      
      {activities.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No recent activity</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const IconComponent = getActivityIcon(activity.type);
            return (
              <div key={index} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${getIconColor(activity.type)} bg-opacity-10`}>
                  <IconComponent size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityLog; 