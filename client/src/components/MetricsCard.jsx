import React from 'react';

const MetricsCard = ({ title, value, color = 'gray', icon: Icon, className = '' }) => {
  // This function determines what color to use for the text
  const colorClasses = {
    red: 'text-red-600',
    yellow: 'text-yellow-600', 
    green: 'text-green-600',
    blue: 'text-blue-600',
    gray: 'text-gray-700'
  };

  // This function determines what color to use for the left border
  const borderClasses = {
    red: 'border-l-4 border-l-red-500',
    yellow: 'border-l-4 border-l-yellow-500',
    green: 'border-l-4 border-l-green-500', 
    blue: 'border-l-4 border-l-blue-500',
    gray: 'border-l-4 border-l-gray-500'
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${borderClasses[color]} ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-full ${colorClasses[color]} bg-opacity-10`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsCard; 