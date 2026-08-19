import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { authFetch } from '../../../config/api';

export default function EditEventModal({ isOpen, onClose, event, allEvents = [], onSaved }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    linkedPastEvents: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
        linkedPastEvents: event.linkedPastEvents || []
      });
    }
  }, [event]);

  if (!isOpen) return null;

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

  const handleSave = async () => {
    if (!formData.title || !formData.date) {
      setError('Title and date are required.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await authFetch(`/admin/events/${event._id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update event');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Edit Event</h3>
          <button onClick={onClose} className="btn btn-icon">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Linked Past Events</label>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <select 
                onChange={addLinkedEvent}
                defaultValue=""
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3 bg-white"
              >
                <option value="" disabled>Select an event to link...</option>
                {allEvents
                  .filter(ev => ev._id !== event?._id && !formData.linkedPastEvents.includes(ev.title))
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
        </div>

        <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
