import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { FiLogOut, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export default function TeamDashboard() {
  const { user, logout } = useAuthStore();
  const [tracks, setTracks] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [transactionId, setTransactionId] = useState('');
  const [message, setMessage] = useState('');
  const [isRegistered, setIsRegistered] = useState(user?.team?.isRegistered || false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchTracks();
  }, []);

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

  const toggleTrack = (trackId) => {
    if (selectedTracks.includes(trackId)) {
      setSelectedTracks(selectedTracks.filter(id => id !== trackId));
    } else {
      setSelectedTracks([...selectedTracks, trackId]);
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    if (selectedTracks.length === 0) {
      setMessage('Please select at least one track preference.');
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await axios.post('/api/registration', {
        trackPreferences: selectedTracks,
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
    <div className="min-h-screen p-4 sm:p-8 bg-gradient-to-br from-green-50 via-green-100 to-green-200 text-slate-800 font-sans">
      <header className="flex justify-between items-center mb-8 glass-panel p-4 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-green-800">Team Portal</h1>
          <p className="text-sm text-green-700">Welcome, {user?.name} ({user?.role === 'teamLeader' ? 'Leader' : 'Member'})</p>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white/80 text-green-800 rounded-lg transition-all shadow-sm font-medium"
        >
          <FiLogOut /> Logout
        </button>
      </header>

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
                <h3 className="font-bold text-slate-800 mb-3">1. Select Track Preferences</h3>
                <div className="space-y-2">
                  {tracks.map(track => (
                    <label key={track._id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedTracks.includes(track._id) ? 'bg-green-100 border-green-400' : 'bg-white/60 border-white/50 hover:bg-white/80'}`}>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                        checked={selectedTracks.includes(track._id)}
                        onChange={() => toggleTrack(track._id)}
                      />
                      <div>
                        <p className="font-bold text-slate-800">{track.title}</p>
                        <p className="text-sm text-slate-600">{track.description}</p>
                      </div>
                    </label>
                  ))}
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
