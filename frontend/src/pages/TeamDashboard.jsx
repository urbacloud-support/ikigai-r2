import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

function SortableTrackItem({ track, index }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: track._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center gap-3 p-4 rounded-xl border bg-white/80 border-white/50 shadow-sm"
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:text-green-600 p-1">
        <GripVertical size={20} className="text-slate-400" />
      </div>
      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-green-100 text-green-700 font-bold rounded-full text-sm">
        #{index + 1}
      </div>
      <div>
        <p className="font-bold text-slate-800">{track.title}</p>
        <p className="text-sm text-slate-600">{track.description}</p>
      </div>
    </div>
  );
}

export default function TeamDashboard() {
  const { user } = useAuthStore();
  const [tracks, setTracks] = useState([]);
  const [transactionId, setTransactionId] = useState('');
  const [message, setMessage] = useState('');
  const [isRegistered, setIsRegistered] = useState(user?.team?.isRegistered || false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
    if (user?.team?.isRegistered) {
      setIsRegistered(true);
    }
  }, [user]);

  const fetchTracks = async () => {
    try {
      const res = await axios.get('/api/admin/tracks');
      if (res.data.success) {
        setTracks(res.data.tracks);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setTracks((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    if (tracks.length === 0) {
      setMessage('No tracks available to set preferences.');
      return;
    }
    
    setIsLoading(true);
    try {
      const trackPreferences = tracks.map(t => t._id);
      const res = await axios.post('/api/registration', {
        trackPreferences,
        transactionId
      });
      if (res.data.success) {
        setIsRegistered(true);
        setMessage('Registration successful! You are now fully registered.');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error completing registration');
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full">
      <div className="max-w-2xl mx-auto glass-panel p-6 sm:p-8 rounded-3xl">
        {isRegistered ? (
          <div className="text-center py-10">
            <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">You are officially registered!</h2>
            <p className="text-slate-600">Your team's transaction ID and track preferences have been recorded. Await further events from the admin.</p>
          </div>
        ) : user?.role === 'teamLeader' ? (
          <div>
            <h2 className="text-xl font-bold text-green-800 mb-6 border-b border-green-200 pb-2">Complete Registration</h2>
            
            {message && (
              <div className="mb-6 p-4 rounded-xl bg-white/80 border border-green-200 text-green-800 font-medium flex items-center gap-2">
                <FiAlertCircle /> {message}
              </div>
            )}

            <form onSubmit={handleRegistration} className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 mb-3">1. Rank Track Preferences (Drag to Reorder)</h3>
                <div className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={tracks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                      {tracks.map((track, index) => (
                        <SortableTrackItem key={track._id} track={track} index={index} />
                      ))}
                    </SortableContext>
                  </DndContext>
                  {tracks.length === 0 && <p className="text-sm text-slate-500">No tracks available yet.</p>}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-3">2. Payment Verification</h3>
                <input 
                  type="text" 
                  placeholder="Enter Transaction ID" 
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-slate-800"
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold text-lg transition-all shadow-xl shadow-green-500/20 disabled:opacity-50"
              >
                {isLoading ? 'Submitting...' : 'Submit Registration'}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-10">
            <FiAlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-amber-600 mb-2">Registration Pending</h2>
            <p className="text-slate-600">Please wait for your Team Leader to complete the registration process.</p>
          </div>
        )}
      </div>
    </div>
  );
}
