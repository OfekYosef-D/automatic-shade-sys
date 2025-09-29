import React, { useState } from 'react';
import { Sun, Moon, Settings, AlertTriangle, CheckCircle, XCircle, Blinds, Umbrella, Building, Home, VenetianMask, Trash2 } from 'lucide-react';

const ShadeControlPanel = ({ area, shades, onShadeUpdate, user, allowDelete = false }) => {
  const [overrides, setOverrides] = useState({});
  const [loading, setLoading] = useState({});

  const handlePositionChange = async (shadeId, newPosition) => {
    if (!user) return;
    
    setLoading(prev => ({ ...prev, [shadeId]: true }));
    
    try {
      const response = await fetch(`http://localhost:3001/api/shades/shades/${shadeId}/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          override_type: 'partial',
          position: newPosition,
          reason: 'Manual adjustment',
          user_id: user.id
        }),
      });

      if (response.ok) {
        // Update local state
        setOverrides(prev => ({
          ...prev,
          [shadeId]: {
            position: newPosition,
            timestamp: new Date().toISOString()
          }
        }));
        
        // Refresh shades data
        if (onShadeUpdate) {
          onShadeUpdate(area.id);
        }
      } else {
        // Failed to update shade position
      }
    } catch {
      // Error updating shade position
    } finally {
      setLoading(prev => ({ ...prev, [shadeId]: false }));
    }
  };

  const handleQuickAction = async (shadeId, action) => {
    if (!user) return;
    
    let position, reason, overrideType;
    switch (action) {
      case 'open':
        position = 100;
        reason = 'Manual open';
        overrideType = 'open';
        break;
      case 'close':
        position = 0;
        reason = 'Manual close';
        overrideType = 'close';
        break;
      case 'half':
        position = 50;
        reason = 'Manual half-open';
        overrideType = 'partial';
        break;
      default:
        return;
    }

    setLoading(prev => ({ ...prev, [shadeId]: true }));
    
    try {
      const response = await fetch(`http://localhost:3001/api/shades/shades/${shadeId}/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          override_type: overrideType,
          position: position,
          reason: reason,
          user_id: user.id
        }),
      });

      if (response.ok) {
        setOverrides(prev => ({
          ...prev,
          [shadeId]: {
            position: position,
            timestamp: new Date().toISOString()
          }
        }));
        
        if (onShadeUpdate) {
          onShadeUpdate(area.id);
        }
      }
    } catch {
      // Error performing quick action
    } finally {
      setLoading(prev => ({ ...prev, [shadeId]: false }));
    }
  };

  const handleDeleteDevice = async (shadeId) => {
    if (!user) return;
    
    if (!window.confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
      return;
    }

    setLoading(prev => ({ ...prev, [shadeId]: true }));
    
    try {
      const response = await fetch(`http://localhost:3001/api/shades/shades/${shadeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from overrides if exists
        setOverrides(prev => {
          const newOverrides = { ...prev };
          delete newOverrides[shadeId];
          return newOverrides;
        });
        
        if (onShadeUpdate) {
          onShadeUpdate(area.id);
        }
      } else {
        // Failed to delete device
      }
    } catch {
      // Error deleting device
    } finally {
      setLoading(prev => ({ ...prev, [shadeId]: false }));
    }
  };

  const getShadeIcon = (type) => {
    switch (type) {
      case 'blinds':
        return <Blinds className="w-6 h-6" />;
      case 'curtains':
        return <VenetianMask className="w-6 h-6" />;
      case 'umbrella':
        return <Umbrella className="w-6 h-6" />;
      case 'pergola':
        return <Building className="w-6 h-6" />;
      case 'shutters':
        return <Home className="w-6 h-6" />;
      default:
        return <Blinds className="w-6 h-6" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'under_maintenance':
        return 'text-yellow-600';
      case 'inactive':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'under_maintenance':
        return <AlertTriangle className="w-4 h-4" />;
      case 'inactive':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Shades Control */}
      {shades.length > 0 ? (
        <div className="space-y-4">
          {shades.map((shade) => (
            <div key={shade.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getShadeIcon(shade.type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{shade.description}</h3>
                    <p className="text-sm text-gray-500 capitalize">{shade.type}</p>
                  </div>
                </div>
                <div className={`flex items-center space-x-2 ${getStatusColor(shade.status)}`}>
                  {getStatusIcon(shade.status)}
                  <span className="text-sm font-medium capitalize">{shade.status.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Current Position Display */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Current Position</span>
                  <span className="font-medium">{shade.current_position}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${shade.current_position}%` }}
                  ></div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => handleQuickAction(shade.id, 'close')}
                  disabled={loading[shade.id] || shade.status !== 'active'}
                  className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Moon className="w-4 h-4 inline mr-1" />
                  Close
                </button>
                <button
                  onClick={() => handleQuickAction(shade.id, 'half')}
                  disabled={loading[shade.id] || shade.status !== 'active'}
                  className="flex-1 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Settings className="w-4 h-4 inline mr-1" />
                  Half
                </button>
                <button
                  onClick={() => handleQuickAction(shade.id, 'open')}
                  disabled={loading[shade.id] || shade.status !== 'active'}
                  className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Sun className="w-4 h-4 inline mr-1" />
                  Open
                </button>
              </div>

              {/* Manual Position Control */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Manual Control</span>
                  <span className="font-medium">
                    {overrides[shade.id]?.position !== undefined 
                      ? `${overrides[shade.id].position}%` 
                      : `${shade.current_position}%`
                    }
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={overrides[shade.id]?.position !== undefined 
                    ? overrides[shade.id].position 
                    : shade.current_position
                  }
                  onChange={(e) => handlePositionChange(shade.id, parseInt(e.target.value))}
                  disabled={loading[shade.id] || shade.status !== 'active'}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Closed</span>
                  <span>Open</span>
                </div>
              </div>

                             {/* Override Status */}
               {overrides[shade.id] && (
                 <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                   <p className="text-sm text-blue-700">
                     Manual override active - {overrides[shade.id].position}% position
                   </p>
                   <p className="text-xs text-blue-600">
                     Set at {new Date(overrides[shade.id].timestamp).toLocaleTimeString()}
                   </p>
                 </div>
               )}

              {allowDelete && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleDeleteDevice(shade.id)}
                    disabled={loading[shade.id]}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Device
                  </button>
                </div>
              )}

               {loading[shade.id] && (
                 <div className="mt-3 text-center">
                   <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                   <span className="ml-2 text-sm text-gray-600">Updating...</span>
                 </div>
               )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">🪟</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Shading Devices</h3>
          <p className="text-gray-600">
            This area doesn't have any shading devices installed yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default ShadeControlPanel;
