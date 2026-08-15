import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, Loader2, Edit, Trash2, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { authFetch } from '../../config/api';

import CreateEventForm from './components/CreateEventForm';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import EditEventModal from './components/EditEventModal';
import DefineCriteriaModal from './components/DefineCriteriaModal';
import EvaluatorList from './components/EvaluatorList';

export default function EventsView() {
  const [events, setEvents] = useState([]);
  const [globalTracks, setGlobalTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState({});

  // Modals state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, event: null });
  const [editModal, setEditModal] = useState({ isOpen: false, event: null });
  const [criteriaModal, setCriteriaModal] = useState({ isOpen: false, event: null });

  const fetchData = async () => {
    try {
      const [eventsRes, tracksRes] = await Promise.all([
        authFetch('/admin/events'),
        authFetch('/admin/tracks')
      ]);
      
      if (eventsRes.ok && tracksRes.ok) {
        setEvents(await eventsRes.json());
        setGlobalTracks(await tracksRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    try {
      await authFetch(`/admin/events/${deleteModal.event._id}`, { method: 'DELETE' });
      setDeleteModal({ isOpen: false, event: null });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpand = (eventId) => {
    setExpandedEvents(prev => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Events Management</h2>
        {!showCreateForm && (
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Create Event</span>
          </button>
        )}
      </div>

      {showCreateForm && (
        <CreateEventForm 
          tracks={globalTracks} 
          onCreated={() => { setShowCreateForm(false); fetchData(); }} 
          onCancel={() => setShowCreateForm(false)} 
        />
      )}

      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
            No events found. Create one to get started.
          </div>
        ) : (
          events.map(event => (
            <div key={event._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 cursor-pointer" onClick={() => toggleExpand(event._id)}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-gray-900">{event.title}</h3>
                    {expandedEvents[event._id] ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><Calendar size={14} className="text-primary-500" /> {new Date(event.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} className="text-primary-500" /> {event.location || 'Online'}</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-2 line-clamp-2">{event.description}</p>
                </div>
                
                <div className="flex items-start gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                  <button 
                    onClick={() => setCriteriaModal({ isOpen: true, event })}
                    className="btn btn-secondary btn-sm"
                  >
                    <Settings size={14} /> Define Criteria
                  </button>
                  <button 
                    onClick={() => setEditModal({ isOpen: true, event })}
                    className="btn btn-icon"
                    title="Edit Event"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => setDeleteModal({ isOpen: true, event })}
                    className="btn btn-icon hover:!bg-red-50 hover:!text-red-600"
                    title="Delete Event"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {expandedEvents[event._id] && (
                <div className="p-5 bg-gray-50/50 border-t border-gray-100">
                  <h4 className="font-semibold text-gray-800 mb-4">Event Tracks ({event.selectedTracks?.length || 0})</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {event.selectedTracks?.map(track => (
                      <div key={track.trackId} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-gray-900">{track.title}</h5>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">
                              Code: {track.code}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{track.description}</p>
                        
                        <EvaluatorList event={event} trackCode={track.code} onRefresh={fetchData} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, event: null })}
        onConfirm={handleDelete}
        itemName={deleteModal.event?.title || ''}
        itemType="Event"
      />

      <EditEventModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, event: null })}
        event={editModal.event}
        onSaved={fetchData}
      />

      <DefineCriteriaModal
        isOpen={criteriaModal.isOpen}
        onClose={() => setCriteriaModal({ isOpen: false, event: null })}
        event={criteriaModal.event}
        onSaved={fetchData}
      />
    </div>
  );
}
