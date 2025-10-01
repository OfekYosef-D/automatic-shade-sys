import React, { useState, useEffect } from 'react';
import { Sun, Moon, Settings, AlertTriangle, CheckCircle, XCircle, Blinds, Umbrella, Building, Home, VenetianMask, Trash2, CalendarPlus, Clock, Calendar, X } from 'lucide-react';

const ShadeControlPanel = ({ area, shades, onShadeUpdate, user }) => {
  const [overrides, setOverrides] = useState({});
  const [loading, setLoading] = useState({});
  const [schedules, setSchedules] = useState({});
  const [showScheduleForm, setShowScheduleForm] = useState({});
  const [scheduleFormData, setScheduleFormData] = useState({});

  const days = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'daily'
  ];

  // Fetch schedules for a specific shade
  const fetchSchedules = async (shadeId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/schedules/shade/${shadeId}`);
      if (response.ok) {
        const data = await response.json();
        setSchedules(prev => ({ ...prev, [shadeId]: data }));
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  // Initialize schedule form data for a shade
  const initializeScheduleForm = (shadeId) => {
    setScheduleFormData(prev => ({
      ...prev,
      [shadeId]: {
        name: '',
        dayOfWeek: 'daily',
        startTime: '',
        endTime: '',
        targetPosition: 0
      }
    }));
  };

  // Handle schedule form input changes
  const handleScheduleInputChange = (shadeId, field, value) => {
    setScheduleFormData(prev => ({
      ...prev,
      [shadeId]: {
        ...prev[shadeId],
        [field]: field === 'targetPosition' ? parseInt(value) : value
      }
    }));
  };

  // Submit schedule form
  const handleScheduleSubmit = async (shadeId) => {
    const formData = scheduleFormData[shadeId];
    if (!formData) return;

    setLoading(prev => ({ ...prev, [shadeId]: true }));
    
    try {
      const response = await fetch('http://localhost:3001/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shade_id: shadeId,
          name: formData.name,
          day_of_week: formData.dayOfWeek,
          start_time: formData.startTime,
          end_time: formData.endTime,
          target_position: formData.targetPosition,
          created_by_user_id: user.id
        })
      });

      if (response.ok) {
        setShowScheduleForm(prev => ({ ...prev, [shadeId]: false }));
        fetchSchedules(shadeId);
        if (onShadeUpdate) {
          onShadeUpdate(area.id);
        }
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
    } finally {
      setLoading(prev => ({ ...prev, [shadeId]: false }));
    }
  };

  // Delete a schedule
  const handleDeleteSchedule = async (scheduleId, shadeId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/schedules/${scheduleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchSchedules(shadeId);
        if (onShadeUpdate) {
          onShadeUpdate(area.id);
        }
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  // Format time for display
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Format day of week for display
  const formatDayOfWeek = (day) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  // Fetch schedules when shades change
  useEffect(() => {
    shades.forEach(shade => {
      fetchSchedules(shade.id);
    });
  }, [shades]);

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
        setOverrides(prev => ({
          ...prev,
          [shadeId]: {
            position: newPosition,
            timestamp: new Date().toISOString()
          }
        }));
        if (onShadeUpdate) {
          onShadeUpdate(area.id);
        }
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
        setOverrides(prev => {
          const newOverrides = { ...prev };
          delete newOverrides[shadeId];
          return newOverrides;
        });
        if (onShadeUpdate) {
          onShadeUpdate(area.id);
        }
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

              {/* Schedules Section */}
              <div className="mt-4">
                {/* Schedules List */}
                {schedules[shade.id] && schedules[shade.id].length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Schedules ({schedules[shade.id].length})
                    </h4>
                    <div className="space-y-2">
                      {schedules[shade.id].map((schedule) => (
                        <div key={schedule.id} className="bg-gray-50 rounded-md p-3 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm text-gray-900">{schedule.name}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                schedule.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {schedule.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              </span>
                              <span className="ml-4">
                                {formatDayOfWeek(schedule.day_of_week)} • {schedule.target_position}% position
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id, shade.id)}
                            className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                            title="Delete schedule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Schedule Button */}
                {!showScheduleForm[shade.id] && (
                  <button
                    onClick={() => {
                      initializeScheduleForm(shade.id);
                      setShowScheduleForm(prev => ({ ...prev, [shade.id]: true }));
                    }}
                    className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center justify-center"
                  >
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    Add Schedule
                  </button>
                )}

                {/* Schedule Form */}
                {showScheduleForm[shade.id] && (
                  <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">Add New Schedule</h4>
                      <button
                        onClick={() => setShowScheduleForm(prev => ({ ...prev, [shade.id]: false }))}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <form onSubmit={(e) => { e.preventDefault(); handleScheduleSubmit(shade.id); }} className="space-y-3" lang="en">
                      <input
                        type="text"
                        placeholder="Schedule Name"
                        value={scheduleFormData[shade.id]?.name || ''}
                        onChange={(e) => handleScheduleInputChange(shade.id, 'name', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        lang="en"
                        onInvalid={(e) => e.target.setCustomValidity('Please enter a schedule name')}
                        onInput={(e) => e.target.setCustomValidity('')}
                      />
                      
                      <select
                        value={scheduleFormData[shade.id]?.dayOfWeek || 'daily'}
                        onChange={(e) => handleScheduleInputChange(shade.id, 'dayOfWeek', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        lang="en"
                      >
                        {days.map(day => (
                          <option key={day} value={day}>
                            {formatDayOfWeek(day)}
                          </option>
                        ))}
                      </select>
                      
                      <div className="flex space-x-2">
                        <input
                          type="time"
                          value={scheduleFormData[shade.id]?.startTime || ''}
                          onChange={(e) => handleScheduleInputChange(shade.id, 'startTime', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          lang="en"
                          onInvalid={(e) => e.target.setCustomValidity('Please select a start time')}
                          onInput={(e) => e.target.setCustomValidity('')}
                        />
                        <input
                          type="time"
                          value={scheduleFormData[shade.id]?.endTime || ''}
                          onChange={(e) => handleScheduleInputChange(shade.id, 'endTime', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          lang="en"
                          onInvalid={(e) => e.target.setCustomValidity('Please select an end time')}
                          onInput={(e) => e.target.setCustomValidity('')}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Target Position: {scheduleFormData[shade.id]?.targetPosition || 0}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={scheduleFormData[shade.id]?.targetPosition || 0}
                          onChange={(e) => handleScheduleInputChange(shade.id, 'targetPosition', e.target.value)}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowScheduleForm(prev => ({ ...prev, [shade.id]: false }))}
                          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading[shade.id]}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading[shade.id] ? 'Saving...' : 'Save Schedule'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Delete Device Button */}
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