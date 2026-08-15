import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { authFetch } from '../../../config/api';

export default function CreateEventForm({ tracks, onCreated, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    trackIds: tracks.map(t => t._id) // All checked by default
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrackToggle = (id) => {
    setFormData(prev => ({
      ...prev,
      trackIds: prev.trackIds.includes(id) 
        ? prev.trackIds.filter(tId => tId !== id)
        : [...prev.trackIds, id]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      setError('Title and date are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authFetch('/admin/events', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        onCreated();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create event');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-primary-100 shadow-md p-6 mb-8 animate-in slide-in-from-top-4 duration-300">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Event</h3>
      
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
          <input
            type="text" required
            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            placeholder="e.g. Ikigai Hackathon 2026 Round-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date" required
            value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
            rows="2" placeholder="Brief description of the event..."
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Include Tracks</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {tracks.map(track => (
            <label key={track._id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              formData.trackIds.includes(track._id) ? 'bg-primary-50 border-primary-200' : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}>
              <input
                type="checkbox"
                checked={formData.trackIds.includes(track._id)}
                onChange={() => handleTrackToggle(track._id)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-gray-300"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">{track.title}</div>
                <div className="text-xs text-gray-500">Code: {track.code}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">
          Cancel
        </button>
        <button 
          type="submit" disabled={loading}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-md flex items-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Create Event
        </button>
      </div>
    </form>
  );
}
