import React, { useState } from 'react';
import { MapPin, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, MoreVertical, AlertTriangle, Trash2 } from 'lucide-react';

const ActiveAlerts = ({ alerts = [], onAlertUpdate }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [statusAction, setStatusAction] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const alertsPerPage = 3;
  const totalPages = Math.ceil(alerts.length / alertsPerPage);

  // This function determines what color to use for priority badges
  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status icon and color
  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' };
      case 'acknowledged':
        return { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' };
      case 'resolved':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' };
      default:
        return { icon: AlertTriangle, color: 'text-gray-500', bg: 'bg-gray-50' };
    }
  };

  const nextPage = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const getCurrentAlerts = () => {
    const startIndex = currentIndex * alertsPerPage;
    return alerts.slice(startIndex, startIndex + alertsPerPage);
  };

  const handleStatusAction = (alert, action) => {
    setSelectedAlert(alert);
    setStatusAction(action);
    setResolutionNotes('');
    setShowStatusModal(true);
  };

  const handleDeleteAlert = (alert) => {
    setSelectedAlert(alert);
    setShowDeleteModal(true);
  };

  const deleteAlert = async () => {
    if (!selectedAlert) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`http://localhost:3001/api/alerts/${selectedAlert.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await response.json();
        
        // Call the parent callback to refresh alerts
        if (onAlertUpdate) {
          onAlertUpdate();
        }
        
        // Close modal and reset state
        setShowDeleteModal(false);
        setSelectedAlert(null);
      } else {
        await response.json();
        alert('Failed to delete alert. Please try again.');
      }
    } catch {
      alert('Error deleting alert. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const updateAlertStatus = async () => {
    if (!selectedAlert || !statusAction) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`http://localhost:3001/api/alerts/${selectedAlert.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: statusAction,
          resolution_notes: resolutionNotes.trim() || null
        }),
      });

      if (response.ok) {
        await response.json();
        
        // Call the parent callback to refresh alerts
        if (onAlertUpdate) {
          onAlertUpdate();
        }
        
        // Close modal and reset state
        setShowStatusModal(false);
        setSelectedAlert(null);
        setStatusAction('');
        setResolutionNotes('');
      } else {
        await response.json();
        alert('Failed to update alert status. Please try again.');
      }
    } catch {
      alert('Error updating alert status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusActionText = (action) => {
    switch (action) {
      case 'acknowledged': return 'Acknowledge';
      case 'resolved': return 'Mark as Resolved';
      case 'active': return 'Reactivate';
      default: return action;
    }
  };

  const getStatusActionDescription = (action) => {
    switch (action) {
      case 'acknowledged': return 'Mark this alert as acknowledged - you are aware of the issue';
      case 'resolved': return 'Mark this alert as resolved - the issue has been fixed';
      case 'active': return 'Reactivate this alert - the issue needs attention again';
      default: return '';
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {alerts.length}
            </span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={prevPage}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
                disabled={totalPages <= 1}
              >
                <ChevronLeft size={16} className="text-gray-600" />
              </button>
              <span className="text-sm text-gray-500 min-w-[60px] text-center">
                {currentIndex + 1} of {totalPages}
              </span>
              <button
                onClick={nextPage}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
                disabled={totalPages <= 1}
              >
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          )}
        </div>
        
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-500 font-medium">No active alerts</p>
            <p className="text-sm text-gray-400 mt-1">All systems are running smoothly</p>
          </div>
        ) : (
          <div className="space-y-4">
            {getCurrentAlerts().map((alert, index) => {
              const StatusIcon = getStatusIcon(alert.status).icon;
              const statusColor = getStatusIcon(alert.status).color;
              const statusBg = getStatusIcon(alert.status).bg;
              
              return (
                <div key={alert.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${statusBg}`}>
                          <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 leading-tight">{alert.description}</p>
                            {alert.status === 'acknowledged' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                Being handled
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <p className="text-sm text-gray-600">{alert.location}</p>
                          </div>
                          {alert.created_at && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(alert.created_at).toLocaleDateString()} at {new Date(alert.created_at).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(alert.priority)}`}>
                        {alert.priority}
                      </span>
                      
                      <div className="flex items-center space-x-1">
                        {alert.status === 'active' && (
                          <button
                            onClick={() => handleStatusAction(alert, 'acknowledged')}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                            title="Manage Alert"
                          >
                            <MoreVertical size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAlert(alert)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Alert"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  {alert.status === 'active' && (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleStatusAction(alert, 'acknowledged')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-md transition-colors"
                      >
                        <Clock size={12} />
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleStatusAction(alert, 'resolved')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                      >
                        <CheckCircle size={12} />
                        Mark Resolved
                      </button>
                    </div>
                  )}
                  {alert.status === 'acknowledged' && (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleStatusAction(alert, 'resolved')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                      >
                        <CheckCircle size={12} />
                        Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedAlert && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Update Alert Status
                </h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Alert:</p>
                <p className="font-medium text-gray-900">{selectedAlert.description}</p>
                <p className="text-sm text-gray-500 mt-1">{selectedAlert.location}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Action:</p>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-medium text-blue-900">
                    {getStatusActionText(statusAction)}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {getStatusActionDescription(statusAction)}
                  </p>
                </div>
              </div>

              {(statusAction === 'resolved' || statusAction === 'acknowledged') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Add any notes about the resolution or acknowledgment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={updateAlertStatus}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAlert && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Alert
                </h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4">
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Are you sure?</p>
                    <p className="text-sm text-gray-600">This action cannot be undone.</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">Alert to delete:</p>
                  <p className="font-medium text-gray-900">{selectedAlert.description}</p>
                  <p className="text-sm text-gray-500 mt-1">{selectedAlert.location}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={deleteAlert}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActiveAlerts; 