import React from 'react';

// Reusable skeleton loading component
export const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
    <div className="aspect-video bg-gray-200"></div>
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="flex space-x-2 mt-4">
        <div className="flex-1 h-9 bg-gray-200 rounded"></div>
        <div className="h-9 w-9 bg-gray-200 rounded"></div>
        <div className="h-9 w-9 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

export const SkeletonAlert = () => (
  <div className="border border-gray-200 rounded-lg p-4 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
    </div>
  </div>
);

export const SkeletonActivity = () => (
  <div className="flex items-start gap-3 border-b border-gray-100 pb-3 animate-pulse">
    <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0"></div>
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

