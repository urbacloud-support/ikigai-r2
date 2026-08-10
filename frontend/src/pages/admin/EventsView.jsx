import React, { useState, useEffect } from 'react';
import { authFetch } from '../../config/api';
import { Plus, Calendar, MapPin, Loader2 } from 'lucide-react';

export default function EventsView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await authFetch('/admin/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
        <h2 className="text-2xl font-bold text-gray-800">Events</h2>
        <button className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors shadow-md shadow-primary-500/20">
          <Plus size={18} />
          <span className="hidden sm:inline">New Event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
            No events found. Create one to get started.
          </div>
        ) : (
          events.map(event => (
            <div key={event._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">{event.title}</h3>
              <p className="text-gray-500 text-sm mt-1 line-clamp-2">{event.description}</p>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600 gap-2">
                  <Calendar size={14} className="text-primary-500" />
                  {new Date(event.date).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-600 gap-2">
                  <MapPin size={14} className="text-primary-500" />
                  {event.location || 'Online'}
                </div>
              </div>

              <div className="mt-5 flex gap-2 flex-wrap">
                {event.selectedTracks?.map(track => (
                  <span key={track.trackId} className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-md border border-primary-100">
                    {track.title}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
