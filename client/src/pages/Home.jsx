import React from 'react';
import { Shield, AlertTriangle, Settings } from 'lucide-react';
import MetricsCard from '../components/MetricsCard';
import ActiveAlerts from '../components/ActiveAlerts';
import ActivityLog from '../components/ActivityLog';
import AddDeviceButton from '../components/AddDeviceButton';

const Home = () => {
  // Mock data for metrics cards
  const metrics = [
    { title: 'Active Shades', value: '245', color: 'gray', icon: Shield },
    { title: 'Active Alerts', value: '3', color: 'red', icon: AlertTriangle },
    { title: 'Manual Overrides', value: '12', color: 'gray', icon: Settings }
  ];

  // Mock data for alerts
  const alerts = [
    {
      description: 'Shade 12 in Room 203 is stuck',
      location: 'Building A, Room 203',
      priority: 'High'
    },
    {
      description: 'Sensor malfunction in Room 101',
      location: 'Building B, Room 101', 
      priority: 'Medium'
    },
    {
      description: 'Unexpected shade movement',
      location: 'Building C, Room 305',
      priority: 'Low'
    }
  ];

  // Mock data for activity log
  const activities = [
    { type: 'reboot', description: 'System rebooted successfully', time: '2 hours ago' },
    { type: 'override', description: 'Manual override in Room 203', time: '4 hours ago' },
    { type: 'alert', description: 'Alert triggered in Room 101', time: '6 hours ago' },
    { type: 'update', description: 'System updated shade positions', time: '8 hours ago' },
    { type: 'check', description: 'System check completed', time: '10 hours ago' }
  ];

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
        {/* Active Alerts - Takes up 2 columns on large screens */}
        <div className="lg:col-span-2">
          <ActiveAlerts alerts={alerts} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <ActivityLog activities={activities} />
          <AddDeviceButton />
        </div>
      </div>
    </div>
  );
};

export default Home;