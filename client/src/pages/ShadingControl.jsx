import React, { useState, useEffect } from 'react';
import { Building, MapPin, Sun, Moon, Settings, Clock, Users } from 'lucide-react';
import ShadeControlPanel from '../components/ShadeControlPanel';
import ScheduleManager from '../components/ScheduleManager';
import { useAuth } from '../hooks/useAuth';

const ShadingControl = () => {
  const [buildings, setBuildings] = useState({});
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [shades, setShades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('control'); // 'control' or 'schedule'
  const { user } = useAuth();

  useEffect(() => {
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (selectedArea) {
      fetchShadesForArea(selectedArea.id);
    }
  }, [selectedArea]);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/shades/areas');
      const data = await response.json();
      setBuildings(data);
      
      // Auto-select first building if available
      const buildingNumbers = Object.keys(data);
      if (buildingNumbers.length > 0) {
        setSelectedBuilding(parseInt(buildingNumbers[0]));
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShadesForArea = async (areaId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/shades/areas/${areaId}/shades`);
      const data = await response.json();
      setShades(data);
    } catch (error) {
      console.error('Error fetching shades:', error);
    }
  };

  const handleBuildingSelect = (buildingNumber) => {
    setSelectedBuilding(buildingNumber);
    setSelectedArea(null);
    setShades([]);
  };

  const handleAreaSelect = (area) => {
    setSelectedArea(area);
  };

  const getBuildingFloors = () => {
    if (!selectedBuilding || !buildings[selectedBuilding]) return [];
    return Object.entries(buildings[selectedBuilding].floors);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading buildings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shading Control System</h1>
          <p className="text-gray-600 mt-2">Manage and control automatic shading devices across campus</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('control')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'control'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sun className="inline-block w-4 h-4 mr-2" />
            Manual Control
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'schedule'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="inline-block w-4 h-4 mr-2" />
            Schedules
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Building/Area Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Buildings & Areas
            </h2>
            
            {/* Building Selection */}
            <div className="space-y-3">
              {Object.keys(buildings).map((buildingNumber) => (
                <div key={buildingNumber}>
                  <button
                    onClick={() => handleBuildingSelect(parseInt(buildingNumber))}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedBuilding === parseInt(buildingNumber)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">Building {buildingNumber}</div>
                    <div className="text-sm text-gray-500">
                      {Object.keys(buildings[buildingNumber].floors).length} floors
                    </div>
                  </button>
                  
                  {/* Floor and Area Selection */}
                  {selectedBuilding === parseInt(buildingNumber) && (
                    <div className="mt-3 ml-4 space-y-2">
                      {getBuildingFloors().map(([floor, areas]) => (
                        <div key={floor}>
                          <div className="text-sm font-medium text-gray-700 mb-2">{floor}</div>
                          <div className="space-y-1">
                            {areas.map((area) => (
                              <button
                                key={area.id}
                                onClick={() => handleAreaSelect(area)}
                                className={`w-full text-left p-2 rounded text-sm transition-colors ${
                                  selectedArea?.id === area.id
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'hover:bg-gray-100 text-gray-600'
                                }`}
                              >
                                <div className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-2" />
                                  {area.room}
                                  {area.room_number && ` (${area.room_number})`}
                                </div>
                                {area.description && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {area.description}
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {selectedArea ? (
            activeTab === 'control' ? (
              <ShadeControlPanel 
                area={selectedArea} 
                shades={shades} 
                onShadeUpdate={fetchShadesForArea}
                user={user}
              />
            ) : (
              <ScheduleManager 
                area={selectedArea} 
                shades={shades} 
                user={user}
              />
            )
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Building and Area</h3>
              <p className="text-gray-600">
                Choose a building from the sidebar and select an area to view and control shading devices.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShadingControl;
