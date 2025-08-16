import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Settings } from 'lucide-react';
import MetricsCard from '../components/MetricsCard';
import ActiveAlerts from '../components/ActiveAlerts';
import ActiveOverrides from '../components/ActiveOverrides';
import ActivityLog from '../components/ActivityLog';
import AddAlertButton from '../components/AddAlertButton';
import AddAreaMap from '../components/AddAreaMap';

const Home = () => {
  const [metrics, setMetrics] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to refresh alerts data
  const refreshAlerts = async () => {
    try {
      const alertsRes = await fetch('http://localhost:3001/api/dashboard/alerts');
      const alertsData = await alertsRes.json();
      setAlerts(alertsData);
    } catch {
      // Error refreshing alerts
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
          fetch('http://localhost:3001/api/dashboard/metrics'),
          fetch('http://localhost:3001/api/dashboard/alerts'),
          fetch('http://localhost:3001/api/dashboard/activities')
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
      } catch {
        // Error fetching dashboard data
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
          <ActivityLog activities={activities} />
          <AddAlertButton />
        </div>
      </div>
    </div>
  );
};

export default Home;