import React from 'react';
import { XCircle, AlertCircle, ShieldAlert } from 'lucide-react';

const ErrorModal = ({ error, onClose }) => {
  if (!error) return null;

  const isPermissionError = error.message?.includes('Permission denied') || error.message?.includes('Access denied');
  const isAuthError = error.message?.includes('login') || error.message?.includes('session');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 ${isPermissionError ? 'bg-orange-50 border-b border-orange-200' : 'bg-red-50 border-b border-red-200'}`}>
          <div className="flex items-center gap-3">
            {isPermissionError ? (
              <ShieldAlert className="w-6 h-6 text-orange-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
            <h3 className={`text-lg font-semibold ${isPermissionError ? 'text-orange-900' : 'text-red-900'}`}>
              {isPermissionError ? 'Permission Denied' : isAuthError ? 'Authentication Required' : 'Error'}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-900 mb-2">
              {error.message}
            </p>
            {error.detail && (
              <p className="text-sm text-gray-600">
                {error.detail}
              </p>
            )}
          </div>

          {isPermissionError && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-900 mb-1">💡 What can I do?</p>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>Contact your administrator for access</li>
                <li>Request role upgrade if needed</li>
                <li>Check if you're assigned to this area (planners only)</li>
              </ul>
            </div>
          )}

          {isAuthError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                Your session has expired. Please log in again to continue.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;

