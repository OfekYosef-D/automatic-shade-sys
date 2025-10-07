import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Settings } from 'lucide-react';
import MetricsCard from '../components/MetricsCard';
import ActiveAlerts from '../components/ActiveAlerts';
import ActiveOverrides from '../components/ActiveOverrides';
import ActivityLog from '../components/ActivityLog';
import AddAlertButton from '../components/AddAlertButton';
import AddAreaMap from '../components/AddAreaMap';
import { useAuth } from '../hooks/useAuth';
import { getAuthHeaders } from '../utils/api';

const Home = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [schedulerEdit, setSchedulerEdit] = useState({ intervalMinutes: '', overrideWindowMinutes: '', paused: false });
  const [isSchedulerEditing, setIsSchedulerEditing] = useState(false);

  // Function to refresh alerts, activity log, and metrics
  const refreshAlerts = async () => {
    try {
      // Refresh alerts, activities, and metrics in parallel
      const [alertsRes, activitiesRes, metricsRes] = await Promise.all([
        fetch('/api/dashboard/alerts'),
        fetch('/api/dashboard/activities'),
        fetch('/api/dashboard/metrics')
      ]);
      
      const alertsData = await alertsRes.json();
      const activitiesData = await activitiesRes.json();
      const metricsData = await metricsRes.json();
      
      // Transform metrics data to include icon components
      const transformedMetrics = metricsData.map(metric => ({
        ...metric,
        icon: getIconComponent(metric.icon)
      }));
      
      setAlerts(alertsData);
      setActivities(activitiesData);
      setMetrics(transformedMetrics);
    } catch {
      // Error refreshing data
    }
  };

  // Map icon names to actual icon components
  const getIconComponent = (iconName) => {
    switch (iconName) {
      case 'Shield': return Shield;
      case 'AlertTriangle': return AlertTriangle;
      case 'Settings': return Settings;
      default: return Shield;
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all dashboard data in parallel
        const [metricsRes, alertsRes, activitiesRes] = await Promise.all([
          fetch('/api/dashboard/metrics'),
          fetch('/api/dashboard/alerts'),
          fetch('/api/dashboard/activities')
        ]);

        const metricsData = await metricsRes.json();
        const alertsData = await alertsRes.json();
        const activitiesData = await activitiesRes.json();

        // Transform metrics data to include icon components
        const transformedMetrics = metricsData.map(metric => ({
          ...metric,
          icon: getIconComponent(metric.icon)
        }));

        setMetrics(transformedMetrics);
        setAlerts(alertsData);
        setActivities(activitiesData);
        // Fetch scheduler status for admins
        if (user?.role === 'admin') {
          try {
            const statusRes = await fetch('/api/scheduler/status', { headers: getAuthHeaders() });
            if (statusRes.ok) {
              const status = await statusRes.json();
              setSchedulerStatus(status);
              setSchedulerEdit({
                intervalMinutes: String(status.settings?.intervalMinutes ?? ''),
                overrideWindowMinutes: String(status.settings?.overrideWindowMinutes ?? ''),
                paused: Boolean(status.settings?.paused ?? false)
              });
            }
          } catch {
            // ignore scheduler status errors in UI
          }
        }
      } catch {
        // Error fetching dashboard data
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <MetricsCard key={index} {...metric} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Active Alerts and Active Overrides */}
        <div className="lg:col-span-2 space-y-6">
          <ActiveAlerts alerts={alerts} onAlertUpdate={refreshAlerts} />
          <ActiveOverrides />
        </div>

        {/* Right Column - Activity Log and Add Device */}
        <div className="space-y-6">
          {user?.role === 'admin' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Scheduler</p>
                  <p className="text-sm font-medium text-gray-900">
                    {schedulerStatus?.running ? 'Running' : 'Stopped'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${schedulerStatus?.running ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {schedulerStatus?.running ? 'OK' : 'OFF'}
                  </span>
                  {user?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setIsSchedulerEditing((v) => !v)}
                      className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50"
                    >
                      {isSchedulerEditing ? 'Close' : 'Edit'}
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-gray-400">Last check: {schedulerStatus?.lastCheck ? new Date(schedulerStatus.lastCheck).toLocaleTimeString() : '—'}</p>
                {!isSchedulerEditing && (
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-gray-500">Interval</p>
                      <p className="font-medium text-gray-900">{schedulerStatus?.settings?.intervalMinutes} min</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Override window</p>
                      <p className="font-medium text-gray-900">{schedulerStatus?.settings?.overrideWindowMinutes} min</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Mode</p>
                      <p className="font-medium text-gray-900">{schedulerStatus?.settings?.paused ? 'Paused' : 'Active'}</p>
                    </div>
                  </div>
                )}
                {isSchedulerEditing && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Interval</label>
                      <div className="flex items-center gap-2">
                        {['1','2','5'].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setSchedulerEdit({ ...schedulerEdit, intervalMinutes: val })}
                            className={`px-2.5 py-1.5 text-xs rounded border transition ${schedulerEdit.intervalMinutes===val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            aria-pressed={schedulerEdit.intervalMinutes===val}
                          >
                            {val}m
                          </button>
                        ))}
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={schedulerEdit.intervalMinutes}
                            onChange={(e) => setSchedulerEdit({ ...schedulerEdit, intervalMinutes: e.target.value })}
                            className="w-16 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Custom interval minutes"
                          />
                          <span className="text-xs text-gray-500">min</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">How often the scheduler checks schedules.</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Override window</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={schedulerEdit.overrideWindowMinutes}
                          onChange={(e) => setSchedulerEdit({ ...schedulerEdit, overrideWindowMinutes: e.target.value })}
                          className="w-20 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Manual override window minutes"
                        />
                        <span className="text-xs text-gray-500">min</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">If a manual override happened within this window, skip schedule execution.</p>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSchedulerEdit({ ...schedulerEdit, paused: !schedulerEdit.paused })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${schedulerEdit.paused ? 'bg-red-500' : 'bg-gray-300'}`}
                          aria-pressed={schedulerEdit.paused}
                          aria-label="Pause scheduler"
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${schedulerEdit.paused ? 'translate-x-5' : 'translate-x-1'}`}></span>
                        </button>
                        <span className="text-xs text-gray-700">{schedulerEdit.paused ? 'Paused' : 'Active'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSchedulerEdit({
                            intervalMinutes: String(schedulerStatus?.settings?.intervalMinutes ?? '2'),
                            overrideWindowMinutes: String(schedulerStatus?.settings?.overrideWindowMinutes ?? '30'),
                            paused: Boolean(schedulerStatus?.settings?.paused ?? false)
                          })}
                          className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50"
                        >
                          Reset
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const body = {
                                intervalMinutes: Number(schedulerEdit.intervalMinutes),
                                overrideWindowMinutes: Number(schedulerEdit.overrideWindowMinutes),
                                paused: Boolean(schedulerEdit.paused),
                              };
                              const res = await fetch('/api/scheduler/settings', {
                                method: 'PATCH',
                                headers: { ...getAuthHeaders() },
                                body: JSON.stringify(body)
                              });
                              if (res.ok) {
                                const data = await res.json();
                                setSchedulerStatus((prev) => ({ ...prev, settings: data.settings }));
                                setIsSchedulerEditing(false);
                              }
                            } catch {
                              // ignore save errors
                            }
                          }}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <ActivityLog activities={activities} />
          <AddAlertButton />
        </div>
      </div>
    </div>
  );
};

export default Home;