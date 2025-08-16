import React, { useState, useEffect } from 'react';
import { Plus, Minus, MapPin, X, CheckCircle, AlertCircle } from 'lucide-react';
import AddShadeDevice from './AddShadeDevice';
import ShadeControlPanel from './ShadeControlPanel';

const InteractiveMap = ({ area, onClose, onMapUpdated }) => {
  const [zoom, setZoom] = useState(1);
  const [devices, setDevices] = useState([]);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceControl, setShowDeviceControl] = useState(false);
  const [notification, setNotification] = useState(null);

  // Load existing data when area changes
  useEffect(() => {
    if (area) {
      loadAreaData();
    }
  }, [area]);

  const loadAreaData = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/maps/areas/${area.id}`);
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      }
    } catch {
      // Error loading area data
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));

  // Map click handling
  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    setClickPosition({ x, y });
    setShowAddDevice(true);
  };

  // Device control functions
  const handleDeviceClick = (device) => {
    setSelectedDevice(device);
    setShowDeviceControl(true);
  };

  // Handle device added successfully
  const handleDeviceAdded = () => {
    setShowAddDevice(false);
    loadAreaData();
    showNotification('Device added successfully!', 'success');
  };

  // Handle device added error
  const handleDeviceError = () => {
    showNotification('Failed to add device. Please try again.', 'error');
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type, timestamp: Date.now() });
    setTimeout(() => setNotification(null), 3000);
  };

  // Device visual helpers
  const getDeviceColor = (position) => {
    if (position >= 80) return '#22c55e'; // green (mostly open)
    if (position >= 40) return '#f59e0b'; // amber (half open)
    if (position >= 0) return '#ef4444'; // red (mostly closed)
    return '#6b7280'; // gray (unknown)
  };

  const getDeviceOpacity = () => {
    return 1.0;
  };

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-7xl mx-4 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {area.map_name} - Interactive Map
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Zoom: {Math.round(zoom * 100)}% | Click anywhere to add device
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-white rounded-md transition-all duration-200"
                title="Zoom Out"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-white rounded-md transition-all duration-200"
                title="Zoom In"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Map Container */}
          <div className="flex-1 relative overflow-hidden bg-gray-100">
            <div
              className="w-full h-full relative cursor-crosshair"
              onClick={handleMapClick}
            >
              {/* Map Image */}
              <img
                src={`http://localhost:3001/api/maps/files/${area.map_file_path}`}
                alt={area.map_name}
                className="absolute inset-0 w-full h-full object-contain"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: '0 0'
                }}
              />

              {/* Devices */}
              {devices.map(device => (
                <div
                  key={device.id}
                  className="absolute w-10 h-10 rounded-full border-3 border-white shadow-lg cursor-pointer hover:scale-125 transition-all duration-200"
                  style={{
                    left: (device.x || 0) * zoom - 20,
                    top: (device.y || 0) * zoom - 20,
                    backgroundColor: getDeviceColor(device.current_position),
                    opacity: getDeviceOpacity()
                  }}
                  title={`${device.description} (${device.type}) - ${device.current_position}%`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeviceClick(device);
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                </div>
              ))}

              {/* Click indicator when adding device */}
              {showAddDevice && (
                <div className="absolute w-6 h-6 bg-green-500 rounded-full border-3 border-white animate-pulse pointer-events-none shadow-lg"
                  style={{
                    left: clickPosition.x * zoom - 12,
                    top: clickPosition.y * zoom - 12,
                  }}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Map Controls</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage devices and view information
              </p>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Add Device Section */}
              {showAddDevice && (
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900">Add New Device</h4>
                    <button
                      onClick={() => setShowAddDevice(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Position:</strong> ({Math.round(clickPosition.x)}, {Math.round(clickPosition.y)})
                    </p>
                  </div>
                  <AddShadeDevice
                    area={area}
                    onDeviceAdded={handleDeviceAdded}
                    onDeviceError={handleDeviceError}
                    user={{ id: 1 }}
                    position={clickPosition}
                    isSidebar={true}
                  />
                </div>
              )}

              {/* Device Control Section */}
              {showDeviceControl && selectedDevice && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900">Device Control</h4>
                    <button
                      onClick={() => {
                        setShowDeviceControl(false);
                        setSelectedDevice(null);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <ShadeControlPanel
                    area={area}
                    shades={[selectedDevice]}
                    onShadeUpdate={() => {
                      loadAreaData();
                      if (onMapUpdated) onMapUpdated();
                    }}
                    user={{ id: 1 }}
                  />
                </div>
              )}

              {/* Default State */}
              {!showAddDevice && !showDeviceControl && (
                <div className="p-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Ready to Add Devices</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Click anywhere on the map to add a new shading device
                    </p>
                    <div className="space-y-2 text-xs text-gray-500">
                      <p>• Click on existing devices to control them</p>
                      <p>• Use zoom controls to navigate the map</p>
                      <p>• Devices are color-coded by position</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <strong>Quick Guide:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Click anywhere on the map to add shading devices</li>
              <li>Click on devices to control their settings</li>
              <li>Use zoom buttons to navigate the map</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-60 flex items-center space-x-3 p-4 rounded-lg shadow-lg border transition-all duration-300 transform translate-x-0 ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span className="font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
