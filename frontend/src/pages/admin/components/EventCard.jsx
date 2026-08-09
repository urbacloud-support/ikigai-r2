import React from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';

const EventCard = ({ event }) => {
    return (
        <div className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{event?.name || 'Loading...'}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${event?.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {event?.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{event?.date ? new Date(event.date).toLocaleDateString() : 'TBD'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{event?.venue || 'TBD'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>{event?.tracks?.length || 0} Tracks</span>
                </div>
            </div>
        </div>
    );
};

export default EventCard;
