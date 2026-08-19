import React, { useState } from 'react';
import { Loader2, X, Users } from 'lucide-react';
import { authFetch } from '../../../config/api';
import TeamSelectionModal from './TeamSelectionModal';

export default function CreateEventForm({ tracks, allEvents = [], allTeams = [], onCreated, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    trackIds: tracks.map(t => t._id), // All checked by default
    linkedPastEvents: [],
    selectedTeams: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTeamModal, setShowTeamModal] = useState(false);

  const handleTrackToggle = (id) => {
    setFormData(prev => ({
      ...prev,
      trackIds: prev.trackIds.includes(id) 
        ? prev.trackIds.filter(tId => tId !== id)
        : [...prev.trackIds, id]
    }));
  };

  const addLinkedEvent = (e) => {
    const selectedTitle = e.target.value;
    if (selectedTitle && !formData.linkedPastEvents.includes(selectedTitle)) {
      setFormData(prev => ({
        ...prev,
        linkedPastEvents: [...prev.linkedPastEvents, selectedTitle]
      }));
    }
    // Reset dropdown
    e.target.value = '';
  };

  const removeLinkedEvent = (title) => {
    setFormData(prev => ({
      ...prev,
      linkedPastEvents: prev.linkedPastEvents.filter(t => t !== title)
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

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Linked Past Events</label>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <select 
            onChange={addLinkedEvent}
            defaultValue=""
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3 bg-white"
          >
            <option value="" disabled>Select an event to link...</option>
            {allEvents
              .filter(ev => !formData.linkedPastEvents.includes(ev.title))
              .map(ev => (
                <option key={ev._id} value={ev.title}>{ev.title}</option>
              ))
            }
          </select>

          {formData.linkedPastEvents.length > 0 ? (
            <div className="flex flex-col gap-2">
              {formData.linkedPastEvents.map((title, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white border border-gray-200 p-2.5 rounded-lg shadow-sm">
                  <span className="text-sm font-medium text-gray-800">{title}</span>
                  <button type="button" onClick={() => removeLinkedEvent(title)} className="text-red-500 hover:text-red-700 p-1">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No events linked yet.</p>
          )}
        </div>
      </div>

      <div className="mb-6 border-t border-gray-100 pt-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Specific Teams (Final Session UI)</label>
            <p className="text-xs text-gray-500 mt-1">Select specific teams for Judges to evaluate in this event.</p>
          </div>
          <button 
            type="button" 
            onClick={() => setShowTeamModal(true)}
            className="btn btn-secondary btn-sm bg-white border-gray-200"
          >
            <Users size={14} />
            Manage Teams ({formData.selectedTeams.length})
          </button>
        </div>
        
        {formData.selectedTeams.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {formData.selectedTeams.map(tid => {
              const team = allTeams.find(t => t._id === tid);
              if (!team) return null;
              return (
                <div key={tid} className="bg-white border border-gray-200 text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                  {team.teamName}
                  <button type="button" onClick={() => setFormData(p => ({...p, selectedTeams: p.selectedTeams.filter(id => id !== tid)}))} className="text-red-500 hover:text-red-700 ml-1">
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button 
          type="submit" disabled={loading}
          className="btn btn-primary"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Create Event
        </button>
      </div>

      <TeamSelectionModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        allTeams={allTeams}
        selectedTeams={formData.selectedTeams}
        onSave={(teams) => setFormData(prev => ({ ...prev, selectedTeams: teams }))}
      />
    </form>
  );
}
