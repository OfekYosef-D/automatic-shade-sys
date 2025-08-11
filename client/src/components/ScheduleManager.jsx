import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Edit, Calendar, Sun, Moon } from 'lucide-react';

const ScheduleManager = ({ area, shades, user }) => {
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedShade, setSelectedShade] = useState(null);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    day_of_week: 'daily',
    start_time: '08:00',
    end_time: '18:00',
    target_position: 50
  });

  useEffect(() => {
    if (shades.length > 0) {
      shades.forEach(shade => {
        fetchSchedulesForShade(shade.id);
      });
    }
  }, [shades]);

  const fetchSchedulesForShade = async (shadeId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/shades/shades/${shadeId}/schedules`);
      const data = await response.json();
      setSchedules(prev => ({
        ...prev,
        [shadeId]: data
      }));
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!selectedShade || !user) return;

    setLoading(prev => ({ ...prev, add: true }));

    try {
      const response = await fetch('http://localhost:3001/api/shades/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newSchedule,
          shade_id: selectedShade,
          created_by_user_id: user.id
        }),
      });

      if (response.ok) {
        // Reset form
        setNewSchedule({
          name: '',
          day_of_week: 'daily',
          start_time: '08:00',
          end_time: '18:00',
          target_position: 50
        });
        setShowAddForm(false);
        setSelectedShade(null);
        
        // Refresh schedules
        fetchSchedulesForShade(selectedShade);
      } else {
        console.error('Failed to create schedule');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
    } finally {
      setLoading(prev => ({ ...prev, add: false }));
    }
  };

  const handleDeleteSchedule = async (scheduleId, shadeId) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    setLoading(prev => ({ ...prev, [scheduleId]: true }));

    try {
      const response = await fetch(`http://localhost:3001/api/shades/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setSchedules(prev => ({
          ...prev,
          [shadeId]: prev[shadeId].filter(s => s.id !== scheduleId)
        }));
      } else {
        console.error('Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    } finally {
      setLoading(prev => ({ ...prev, [scheduleId]: false }));
    }
  };

  const getDayLabel = (day) => {
    const days = {
      'monday': 'Monday',
      'tuesday': 'Tuesday',
      'wednesday': 'Wednesday',
      'thursday': 'Thursday',
      'friday': 'Friday',
      'saturday': 'Saturday',
      'sunday': 'Sunday',
      'daily': 'Daily'
    };
    return days[day] || day;
  };

  const getShadeIcon = (type) => {
    switch (type) {
      case 'blinds':
        return '🪟';
      case 'curtains':
        return '🪟';
      case 'umbrella':
        return '☂️';
      case 'pergola':
        return '🏗️';
      case 'shutters':
        return '🪟';
      default:
        return '🪟';
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Area Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{area.room} - Schedules</h2>
            {area.room_number && (
              <p className="text-gray-600">Room {area.room_number}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Building {area.building_number}</p>
            <p className="text-sm text-gray-500">{area.floor}</p>
          </div>
        </div>
      </div>

      {/* Add Schedule Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Schedule</h3>
          <form onSubmit={handleAddSchedule} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Name
                </label>
                <input
                  type="text"
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Morning Opening"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shade Device
                </label>
                <select
                  value={selectedShade || ''}
                  onChange={(e) => setSelectedShade(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a shade device</option>
                  {shades.map(shade => (
                    <option key={shade.id} value={shade.id}>
                      {shade.description} ({shade.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day of Week
                </label>
                <select
                  value={newSchedule.day_of_week}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, day_of_week: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={newSchedule.start_time}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, start_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={newSchedule.end_time}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, end_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Position ({newSchedule.target_position}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={newSchedule.target_position}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, target_position: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Closed</span>
                <span>Open</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading.add}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading.add ? 'Adding...' : 'Add Schedule'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedShade(null);
                  setNewSchedule({
                    name: '',
                    day_of_week: 'daily',
                    start_time: '08:00',
                    end_time: '18:00',
                    target_position: 50
                  });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedules List */}
      <div className="space-y-4">
        {shades.length > 0 ? (
          shades.map(shade => (
            <div key={shade.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getShadeIcon(shade.type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{shade.description}</h3>
                    <p className="text-sm text-gray-500 capitalize">{shade.type}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedShade(shade.id);
                    setShowAddForm(true);
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Schedule
                </button>
              </div>

              {schedules[shade.id] && schedules[shade.id].length > 0 ? (
                <div className="space-y-3">
                  {schedules[shade.id].map(schedule => (
                    <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <h4 className="font-medium text-gray-900">{schedule.name}</h4>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {getDayLabel(schedule.day_of_week)}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Time:</span> {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                            </div>
                            <div>
                              <span className="font-medium">Position:</span> {schedule.target_position}%
                            </div>
                            <div>
                              <span className="font-medium">Created by:</span> {schedule.created_by_name || 'Unknown'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id, shade.id)}
                          disabled={loading[schedule.id]}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No schedules configured for this device</p>
                  <p className="text-sm">Click "Add Schedule" to create automatic controls</p>
                </div>
              )}
            </div>
          ))
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
    </div>
  );
};

export default ScheduleManager;
