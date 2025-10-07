import React, { useState, useEffect } from 'react';
import { RefreshCw, Edit, AlertTriangle, Clock, CheckCircle, Filter, Upload, Wrench, Calendar, User } from 'lucide-react';
import { getAuthHeaders, handleApiError } from '../utils/api';

const ActivityLog = ({ activities = [] }) => {
  const [allActivities, setAllActivities] = useState(activities);
  const [filter, setFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    setAllActivities(activities);
  }, [activities]);

  // Load users for filter
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch('/api/users', { headers: getAuthHeaders() });
        const err = await handleApiError(res);
        if (err) {
          // Not authorized? fall back to empty list to avoid UI crash
          setUsers([]);
          return;
        }
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch {
        setUsers([]);
      }
    };
    loadUsers();
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'reboot': return RefreshCw;
      case 'override': return Edit;
      case 'alert': return AlertTriangle;
      case 'update': return Clock;
      case 'check': return CheckCircle;
      case 'installation': return Wrench;
      case 'schedule': return Calendar;
      case 'map_upload': return Upload;
      case 'maintenance': return Wrench;
      default: return Clock;
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'reboot': return 'text-green-600 bg-green-50';
      case 'override': return 'text-blue-600 bg-blue-50';
      case 'alert': return 'text-red-600 bg-red-50';
      case 'update': return 'text-gray-600 bg-gray-50';
      case 'check': return 'text-green-600 bg-green-50';
      case 'installation': return 'text-purple-600 bg-purple-50';
      case 'schedule': return 'text-orange-600 bg-orange-50';
      case 'map_upload': return 'text-indigo-600 bg-indigo-50';
      case 'maintenance': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'maintenance': return 'bg-yellow-100 text-yellow-700';
      case 'planner': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredActivities = allActivities.filter(activity => {
    const typeMatch = filter === 'all' || activity.type === filter;
    const userMatch = userFilter === 'all' || String(activity.user_id) === String(userFilter);
    return typeMatch && userMatch;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
        <Filter className="w-4 h-4 text-gray-400" />
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Type</label>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="all">All Types</option>
            <option value="override">⚡ Overrides</option>
            <option value="installation">🔧 Installations</option>
            <option value="alert">🚨 Alerts</option>
            <option value="maintenance">🛠️ Maintenance</option>
            <option value="map_upload">🗺️ Maps</option>
            <option value="schedule">📅 Schedules</option>
            <option value="update">👤 Users</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">User</label>
          <select 
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="all">All Users</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      
      {filteredActivities.length === 0 ? (
        <p className="text-gray-500 text-center py-8 text-sm">No activity found</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredActivities.map((activity, index) => {
            const IconComponent = getActivityIcon(activity.type);
            const iconColor = getIconColor(activity.type);
            return (
              <div key={activity.id || index} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-b-0">
                <div className={`p-2 rounded-lg ${iconColor} flex-shrink-0`}>
                  <IconComponent size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-900 leading-tight">{activity.description}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {activity.user_name && (
                      <div className="flex items-center gap-1">
                        <User size={10} className="text-gray-400" />
                        <span className="text-xs font-medium text-gray-700">{activity.user_name}</span>
                        {activity.user_role && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${getRoleBadgeColor(activity.user_role)}`}>
                            {activity.user_role}
                          </span>
                        )}
                      </div>
                    )}
                    <span className="text-xs text-gray-400">• {activity.time_description}</span>
                  </div>
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