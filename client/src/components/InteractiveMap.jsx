import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Minus, MapPin, X, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import AddShadeDevice from './AddShadeDevice';
import ShadeControlPanel from './ShadeControlPanel';
import ErrorModal from './ErrorModal';
import { getAuthHeaders, getAuthHeadersForFormData, handleApiError } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const InteractiveMap = ({ area, onClose, onMapUpdated, isEditMode = false }) => {
  const { user } = useAuth();
  const [zoom, setZoom] = useState(1);
  const [devices, setDevices] = useState([]);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceControl, setShowDeviceControl] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mapSettingsOpen, setMapSettingsOpen] = useState(false);
  const [currentArea, setCurrentArea] = useState(area);
  const [areaForm, setAreaForm] = useState({
    map_name: area?.map_name || '',
    map_description: area?.map_description || ''
  });
  const [currentMapFile, setCurrentMapFile] = useState(area?.map_file_path);
  const [imageBust, setImageBust] = useState(Date.now());
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageRetry, setImageRetry] = useState(0);
  const [newMapFile, setNewMapFile] = useState(null);
  const [isDraggingId, setIsDraggingId] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const [moveMode, setMoveMode] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  const loadAreaData = useCallback(async () => {
    try {
      const response = await fetch(`/api/maps/areas/${area.id}`);
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
        if (data.area) {
          setCurrentArea(data.area);
          // Sync the form to the latest DB values so reopening settings shows fresh data
          setAreaForm({
            map_name: data.area.map_name || '',
            map_description: data.area.map_description || ''
          });
          // Update map file if changed elsewhere
          if (data.area.map_file_path && data.area.map_file_path !== currentMapFile) {
            setCurrentMapFile(data.area.map_file_path);
            setImageBust(Date.now());
            setImageLoaded(false);
          }
        }
      }
    } catch {
      // Error loading area data
    }
  }, [area?.id, currentMapFile]);

  // Load existing data when area changes
  useEffect(() => {
    if (area) {
      loadAreaData();
    }
  }, [area, loadAreaData]);

  // Keep form and map file in sync when area changes
  useEffect(() => {
    setAreaForm({
      map_name: area?.map_name || '',
      map_description: area?.map_description || ''
    });
    setCurrentArea(area);
    setCurrentMapFile(area?.map_file_path);
    setImageBust(Date.now());
    setImageLoaded(false);
    setImageRetry(0);
  }, [area]);

  // Reset image loaded flag when src parameters change
  useEffect(() => {
    setImageLoaded(false);
  }, [currentMapFile, imageBust]);

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));

  // Map click handling
  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    if (isEditMode) {
      setClickPosition({ x, y });
      setShowAddDevice(true);
    }
  };

  // Device control functions
  const handleDeviceClick = (device) => {
    if (isEditMode) {
      // In edit mode, open edit panel (not drag mode)
      setEditingDevice(device);
      setShowAddDevice(false);
      return;
    }
    // In view mode, open simple control panel
    setSelectedDevice(device);
    setShowDeviceControl(true);
  };

  // Drag handlers for devices in edit mode
  const startDrag = (deviceId) => setIsDraggingId(deviceId);
  const stopDrag = () => setIsDraggingId(null);
  
  const onDrag = (e) => {
    if (!isEditMode || !isDraggingId || !moveMode) return;
    const container = e.currentTarget.closest('[data-map-container]');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    
    // Handle both mouse and touch events
    let clientX, clientY;
    if (e.type.includes('touch')) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = (clientX - rect.left) / zoom;
    const y = (clientY - rect.top) / zoom;
    setDevices(prev => prev.map(d => d.id === isDraggingId ? { ...d, x, y } : d));
  };

  const persistDevicePosition = async (device) => {
    try {
      const res = await fetch(`/api/shades/shades/${device.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ x: Math.round(device.x), y: Math.round(device.y) })
      });
      
      const error = await handleApiError(res);
      if (error) {
        if (res.status === 403) {
          setErrorModal(error);
        } else {
          showNotification(error.message, 'error');
        }
        return;
      }
      
      if (onMapUpdated) onMapUpdated();
      showNotification('Device position saved', 'success');
    } catch {
      showNotification('Failed to save device position', 'error');
    }
  };

  const handleAreaFormChange = (e) => {
    const { name, value } = e.target;
    setAreaForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveAreaSettings = async () => {
    setSavingSettings(true);
    const toNull = (v) => (v === '' || v === undefined ? null : v);
    const payload = {
      map_name: toNull(areaForm.map_name),
      map_description: toNull(areaForm.map_description)
    };
    try {
      const res = await fetch(`/api/maps/areas/${area.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const error = await handleApiError(res);
      if (error) {
        if (res.status === 403) {
          setErrorModal(error);
        } else {
          showNotification(error.message, 'error');
        }
      } else {
        showNotification('Area settings saved', 'success');
        // Pull fresh data from DB so UI reflects saved values immediately
        await loadAreaData();
        if (onMapUpdated) onMapUpdated();
      }
    } catch {
      showNotification('Network error - please try again', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleReplaceMap = async () => {
    if (!newMapFile) return;
    const fd = new FormData();
    fd.append('mapFile', newMapFile);
    try {
      const res = await fetch(`/api/maps/areas/${area.id}/map`, {
        method: 'PUT',
        headers: getAuthHeadersForFormData(),
        body: fd
      });
      const error = await handleApiError(res);
      if (error) {
        if (res.status === 403) {
          setErrorModal(error);
        } else {
          showNotification(error.message + (error.detail ? ` (${error.detail})` : ''), 'error');
        }
      } else {
        const data = await res.json();
        setNewMapFile(null);
        showNotification('Map replaced successfully', 'success');
        if (data?.filename) {
          setCurrentMapFile(data.filename);
        }
        setImageBust(Date.now());
        setImageRetry(0);
        await loadAreaData();
        if (onMapUpdated) onMapUpdated();
      }
    } catch {
      showNotification('Network error - please try again', 'error');
    }
  };

  // Handle device added successfully
  const handleDeviceAdded = () => {
    setShowAddDevice(false);
    loadAreaData();
    if (onMapUpdated) onMapUpdated(); // Refresh parent areas list to update device count
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

  const getDeviceOpacity = (status) => {
    if (status === 'inactive') return 0.4;
    if (status === 'under_maintenance') return 0.7;
    return 1.0;
  };

  const getDeviceBorderColor = (status) => {
    if (status === 'inactive') return '#dc2626'; // red border
    if (status === 'under_maintenance') return '#f59e0b'; // amber border
    return '#ffffff'; // white border (normal)
  };

  const getDeviceBorderWidth = (status) => {
    if (status === 'inactive' || status === 'under_maintenance') return '3px';
    return '3px';
  };

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-7xl mx-4 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? areaForm.map_name : (currentArea?.map_name || area.map_name)} 
              {isEditMode ? ' - Configure' : ' - Interactive Map'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Zoom: {Math.round(zoom * 100)}% 
              {isEditMode 
                ? (moveMode ? ' | Move Mode Active - Drag devices to reposition' : ' | Click device to edit, click map to add')
                : ' | Click device to control'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {isEditMode && user?.role === 'admin' && (
              <button
                onClick={() => setMapSettingsOpen(v => !v)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Area Settings
              </button>
            )}
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="p-3 md:p-2 hover:bg-white rounded-md transition-all duration-200 active:scale-95"
                title="Zoom Out"
              >
                <Minus className="w-5 h-5 md:w-4 md:h-4" />
              </button>
              <button
                onClick={handleZoomIn}
                className="p-3 md:p-2 hover:bg-white rounded-md transition-all duration-200 active:scale-95"
                title="Zoom In"
              >
                <Plus className="w-5 h-5 md:w-4 md:h-4" />
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="p-3 md:p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 active:scale-95"
              title="Close"
            >
              <X className="w-6 h-6 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Map Container */}
          <div className="flex-1 relative overflow-hidden bg-gray-100" data-map-container>
            <div
              className={`w-full h-full relative ${
                isEditMode 
                  ? (moveMode ? 'cursor-move' : 'cursor-crosshair') 
                  : 'cursor-default'
              } select-none`}
              onClick={handleMapClick}
              onMouseMove={onDrag}
              onMouseUp={stopDrag}
              onTouchMove={onDrag}
              onTouchEnd={stopDrag}
            >
              {/* Map Image */}
              <img
                src={`/api/maps/files/${currentMapFile}?v=${imageBust}&r=${imageRetry}`}
                alt={currentArea?.map_name || area.map_name}
                className="absolute inset-0 w-full h-full object-contain"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: '0 0'
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  if (imageRetry < 3) {
                    setTimeout(() => {
                      setImageBust(Date.now());
                      setImageRetry(prev => prev + 1);
                    }, 400 * (imageRetry + 1));
                  }
                }}
              />

              {/* Image loading overlay */}
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="px-3 py-1 rounded-md bg-white/80 text-gray-700 text-sm shadow">Loading map…</div>
                </div>
              )}

              {/* Devices */}
              {devices.map(device => (
                <div
                  key={device.id}
                  className={`absolute w-12 h-12 md:w-10 md:h-10 rounded-full shadow-lg ${isEditMode ? 'cursor-move' : (device.status === 'active' ? 'cursor-pointer' : 'cursor-not-allowed')} hover:scale-110 active:scale-95 transition-all duration-200 touch-none`}
                  style={{
                    left: (device.x || 0) * zoom - 24,
                    top: (device.y || 0) * zoom - 24,
                    backgroundColor: getDeviceColor(device.current_position),
                    opacity: getDeviceOpacity(device.status),
                    border: `${getDeviceBorderWidth(device.status)} solid ${getDeviceBorderColor(device.status)}`,
                    boxShadow: device.status !== 'active' ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                  title={`${device.description} (${device.type}) - ${device.current_position}% [${device.status}]`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeviceClick(device);
                  }}
                  onMouseDown={(e) => {
                    if (!isEditMode || !moveMode) return;
                    e.stopPropagation();
                    startDrag(device.id);
                  }}
                  onMouseUp={(e) => {
                    if (!isEditMode || !moveMode) return;
                    e.stopPropagation();
                    stopDrag();
                    const updated = devices.find(d => d.id === device.id);
                    if (updated) {
                      persistDevicePosition(updated);
                    }
                  }}
                  onTouchStart={(e) => {
                    if (!isEditMode || !moveMode) return;
                    e.stopPropagation();
                    startDrag(device.id);
                  }}
                  onTouchEnd={(e) => {
                    if (!isEditMode || !moveMode) return;
                    e.stopPropagation();
                    stopDrag();
                    const updated = devices.find(d => d.id === device.id);
                    if (updated) {
                      persistDevicePosition(updated);
                    }
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center relative">
                    <MapPin className="w-6 h-6 text-white" />
                    {device.status === 'under_maintenance' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        🔧
                      </div>
                    )}
                    {device.status === 'inactive' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        ✕
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Click indicator when adding device */}
              {isEditMode && showAddDevice && (
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
          <div className="w-full md:w-96 bg-white border-l border-gray-200 flex flex-col">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditMode ? 'Device Management' : 'Device Controls'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isEditMode 
                  ? (user?.role === 'admin' ? 'Add, position, and configure devices' : 'Add and position devices')
                  : 'Control device positions and settings'}
              </p>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Edit Device Section - Configure mode */}
              {isEditMode && editingDevice && (
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900">Edit Device</h4>
                    <button
                      onClick={() => {
                        setEditingDevice(null);
                        setMoveMode(false);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Move Mode Toggle */}
                  <div className="mb-4">
                    <button
                      onClick={() => setMoveMode(!moveMode)}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        moveMode 
                          ? 'bg-orange-600 text-white hover:bg-orange-700' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {moveMode ? '🔒 Lock Position' : '🔓 Enable Move Mode'}
                    </button>
                    {moveMode && (
                      <p className="text-xs text-orange-600 mt-2">Drag the device on the map to reposition it</p>
                    )}
                  </div>

                  {/* Device Configuration */}
                  <ShadeControlPanel
                    area={area}
                    shades={[editingDevice]}
                    onShadeUpdate={() => {
                      loadAreaData();
                      if (onMapUpdated) onMapUpdated();
                    }}
                    user={user}
                    allowDelete={true}
                    allowSchedules={true}
                  />
                </div>
              )}

              {/* Add Device Section */}
              {isEditMode && showAddDevice && !editingDevice && (
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
                    user={user}
                    position={clickPosition}
                    isSidebar={true}
                  />
                </div>
              )}

              {/* Area Settings Panel */}
              {isEditMode && mapSettingsOpen && (
                <div className="p-6 border-b border-gray-200 space-y-3">
                  <h4 className="text-md font-medium text-gray-900">Area Settings</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input name="map_name" value={areaForm.map_name} onChange={handleAreaFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="map_description" value={areaForm.map_description} onChange={handleAreaFormChange} rows="2" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={handleSaveAreaSettings} disabled={savingSettings} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50">
                      {savingSettings ? 'Saving…' : 'Save Settings'}
                    </button>
                    <label className="px-3 py-2 border border-gray-300 rounded-md text-sm cursor-pointer">
                      Replace Map
                      <input type="file" className="hidden" accept="image/*,.svg" onChange={(e) => setNewMapFile(e.target.files?.[0] || null)} />
                    </label>
                    <button onClick={handleReplaceMap} disabled={!newMapFile} className="px-3 py-2 bg-green-600 disabled:opacity-50 text-white rounded-md text-sm">Upload</button>
                  </div>
                </div>
              )}

              {/* Device Control Section - View Mode (simple controls only) */}
              {!isEditMode && showDeviceControl && selectedDevice && (
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
                    user={user}
                    allowDelete={false}
                    allowSchedules={false}
                  />
                </div>
              )}

              {/* Default State - View Mode */}
              {!isEditMode && !showAddDevice && !showDeviceControl && (
                <div className="p-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">View Mode</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Click any device on the map to control its position
                    </p>
                    <div className="space-y-2 text-xs text-gray-500">
                      <p>• Green = Open, Yellow = Half, Red = Closed</p>
                      <p>• 🔧 = Under Maintenance</p>
                      <p>• ❌ = Inactive</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Default State - Edit Mode */}
              {isEditMode && !showAddDevice && !editingDevice && !mapSettingsOpen && (
                <div className="p-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Settings className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Configure Mode
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      {user?.role === 'admin' 
                        ? 'Configure area settings and manage devices'
                        : 'Manage shading devices'}
                    </p>
                    <div className="space-y-2 text-xs text-gray-500">
                      <p>• Click map to add new device</p>
                      <p>• Click device to edit and configure</p>
                      <p>• Enable move mode to reposition devices</p>
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

      {/* Error Modal */}
      <ErrorModal error={errorModal} onClose={() => setErrorModal(null)} />
    </div>
  );
};

export default InteractiveMap;
