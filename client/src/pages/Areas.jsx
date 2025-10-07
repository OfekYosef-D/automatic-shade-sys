import React, { useState, useEffect } from 'react';
import { Map, Plus, Trash2, Eye, Settings } from 'lucide-react';
import AddAreaMap from '../components/AddAreaMap';
import InteractiveMap from '../components/InteractiveMap';
import { SkeletonCard } from '../components/SkeletonLoader';
import { getAuthHeaders } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const Areas = () => {
    const { user } = useAuth();
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedArea, setSelectedArea] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        fetchAreas();
    }, []);

    const fetchAreas = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/maps/areas');
                  if (response.ok) {
        const data = await response.json();
        setAreas(data);
      } else {
        // Failed to fetch areas
      }
    } catch {
      // Error fetching areas
    } finally {
            setLoading(false);
        }
    };

    const handleMapAdded = () => {
        fetchAreas(); // Refresh the areas list
    };

    const handleDeleteArea = async (areaId) => {
        if (!window.confirm('Are you sure you want to delete this area? This will also delete the map file and all associated devices.')) {
            return;
        }

        try {
            setDeletingId(areaId);
            const response = await fetch(`/api/maps/areas/${areaId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                fetchAreas(); // Refresh the list
            } else {
                // Failed to delete area
            }
        } catch {
            // Error deleting area
        } finally {
            setDeletingId(null);
        }
    };

    const handleViewArea = (area) => {
        setEditMode(false);
        setSelectedArea(area);
    };

    const handleConfigureArea = (area) => {
        setEditMode(true);
        setSelectedArea(area);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Areas & Maps</h1>
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Areas & Maps</h1>
                    <p className="text-gray-600">Manage your uploaded maps and areas</p>
                </div>
                {user?.role === 'admin' && <AddAreaMap onMapAdded={handleMapAdded} />}
            </div>

            {/* Areas Grid */}
            {areas.length === 0 ? (
                <div className="text-center py-12">
                    <Map className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No areas yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Get started by uploading your first map.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {areas.map((area) => (
                        <div key={area.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {/* Map Preview */}
                            <div className="aspect-video bg-gray-100 relative">
                                {area.map_file_path ? (
                                    <>
                                        <img
                                            src={`/api/maps/files/${area.map_file_path}`}
                                            alt={area.map_name || 'Map preview'}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Failed to load image
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.classList.remove('hidden');
                                                e.target.nextSibling.classList.add('flex');
                                            }}
                                        />
                                        <div className="hidden items-center justify-center h-full absolute inset-0 bg-gray-100">
                                            <Map className="h-8 w-8 text-gray-400" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <Map className="h-8 w-8 text-gray-400" />
                                    </div>
                                )}

                                {/* Device Count Badge */}
                                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                    {area.device_count || 0} devices
                                </div>
                            </div>

                            {/* Area Info */}
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {area.map_name}
                                </h3>

                                {area.building_number && (
                                    <p className="text-sm text-gray-600 mb-1">
                                        Building {area.building_number}
                                        {area.floor && ` • ${area.floor}`}
                                        {area.room && ` • ${area.room}`}
                                    </p>
                                )}

                                {area.map_description && (
                                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                        {area.map_description}
                                    </p>
                                )}

                                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                    <span>Created by {area.created_by_name}</span>
                                    <span>{new Date(area.created_at).toLocaleDateString()}</span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleViewArea(area)}
                                        className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        View
                                    </button>

                                    {/* Configure/Manage button - Admin & Maintenance */}
                                    {(user?.role === 'admin' || user?.role === 'maintenance') && (
                                        <button
                                            onClick={() => handleConfigureArea(area)}
                                            disabled={deletingId === area.id}
                                            className={`flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${deletingId === area.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={user?.role === 'admin' ? 'Configure area and manage devices' : 'Manage devices'}
                                        >
                                            <Settings className="w-4 h-4 mr-1" />
                                            Configure
                                        </button>
                                    )}

                                    {/* Delete Area button - Admin only */}
                                    {user?.role === 'admin' && (
                                        <button
                                            onClick={() => handleDeleteArea(area.id)}
                                            disabled={deletingId === area.id}
                                            className={`flex items-center justify-center px-3 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors ${deletingId === area.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title="Delete area"
                                        >
                                            {deletingId === area.id ? (
                                                <svg className="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

                  {/* Interactive Map Modal */}
      {selectedArea && (
        <InteractiveMap
          area={selectedArea}
          onClose={() => setSelectedArea(null)}
          onMapUpdated={fetchAreas}
          isEditMode={editMode}
        />
      )}
        </div>
    );
};

export default Areas;
