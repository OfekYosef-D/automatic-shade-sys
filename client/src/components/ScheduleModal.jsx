import React, { useState } from 'react';

const days = [
  'monday','tuesday','wednesday','thursday','friday','saturday','sunday','daily'
];

const ScheduleModal = ({ shadeId, userId, onClose, onScheduleAdded }) => {
  const [name, setName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('daily');
  const [startTime, setStartTime] = useState('');
  const [targetPosition, setTargetPosition] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shade_id: shadeId,
          name,
          day_of_week: dayOfWeek,
          start_time: startTime,
          target_position: targetPosition,
          created_by_user_id: userId
        })
      });
      if (res.ok) {
        onScheduleAdded();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Add Schedule</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Schedule Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border rounded px-2 py-1"
            required
          />
          <select
            value={dayOfWeek}
            onChange={e => setDayOfWeek(e.target.value)}
            className="w-full border rounded px-2 py-1"
          >
            {days.map(day => (
              <option key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</option>
            ))}
          </select>
          <input
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            className="w-full border rounded px-2 py-1"
            required
          />
          <input
            type="number"
            min="0"
            max="100"
            value={targetPosition}
            onChange={e => setTargetPosition(Number(e.target.value))}
            className="w-full border rounded px-2 py-1"
            placeholder="Target Position (%)"
            required
          />
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleModal;