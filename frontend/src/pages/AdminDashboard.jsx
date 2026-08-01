import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { FiLogOut, FiPlus, FiUsers, FiLayers } from 'react-icons/fi';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('tracks'); // 'tracks' or 'teams'
  
  const [tracks, setTracks] = useState([]);
  const [newTrack, setNewTrack] = useState({ title: '', description: '' });
  
  const [newTeam, setNewTeam] = useState({ teamName: '', leaderName: '', leaderEmail: '', leaderPassword: '' });

  const [message, setMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'tracks') {
      fetchTracks();
    }
  }, [activeTab]);

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

  const handleCreateTrack = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/tracks', newTrack);
      if (res.data.success) {
        setMessage('Track created successfully!');
        setNewTrack({ title: '', description: '' });
        fetchTracks();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating track');
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/teams', newTeam);
      if (res.data.success) {
        setMessage('Team created successfully!');
        setNewTeam({ teamName: '', leaderName: '', leaderEmail: '', leaderPassword: '' });
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error creating team');
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 glass-panel p-4 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-green-800">Admin Dashboard</h1>
          <p className="text-sm text-green-700">Welcome back, {user?.name}</p>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white/80 text-green-800 rounded-lg transition-all shadow-sm font-medium"
        >
          <FiLogOut /> Logout
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('tracks')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${activeTab === 'tracks' ? 'bg-green-600 text-white shadow-md' : 'bg-white/50 text-green-800 hover:bg-white/70'}`}
        >
          <FiLayers /> Tracks
        </button>
        <button 
          onClick={() => setActiveTab('teams')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${activeTab === 'teams' ? 'bg-green-600 text-white shadow-md' : 'bg-white/50 text-green-800 hover:bg-white/70'}`}
        >
          <FiUsers /> Teams
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-white/80 border border-green-200 text-green-800 font-medium">
          {message}
        </div>
      )}

      {/* Content */}
      <div className="glass-panel p-6 rounded-3xl">
        {activeTab === 'tracks' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2"><FiPlus /> Create Track</h2>
              <form onSubmit={handleCreateTrack} className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Track Title" 
                  required
                  value={newTrack.title}
                  onChange={(e) => setNewTrack({...newTrack, title: e.target.value})}
                  className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-slate-800"
                />
                <textarea 
                  placeholder="Track Description" 
                  required
                  rows="3"
                  value={newTrack.description}
                  onChange={(e) => setNewTrack({...newTrack, description: e.target.value})}
                  className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-slate-800"
                ></textarea>
                <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all shadow-md">
                  Add Track
                </button>
              </form>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-green-800 mb-4">Existing Tracks</h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {tracks.length === 0 ? <p className="text-slate-500 text-sm">No tracks found.</p> : null}
                {tracks.map(track => (
                  <div key={track._id} className="p-4 rounded-xl bg-white/70 border border-white/50 shadow-sm">
                    <h3 className="font-bold text-slate-800">{track.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{track.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="max-w-xl mx-auto">
            <h2 className="text-xl font-bold text-green-800 mb-6 flex items-center gap-2"><FiUsers /> Create New Team</h2>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <input 
                type="text" 
                placeholder="Team Name" 
                required
                value={newTeam.teamName}
                onChange={(e) => setNewTeam({...newTeam, teamName: e.target.value})}
                className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-slate-800"
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Leader Name" 
                  required
                  value={newTeam.leaderName}
                  onChange={(e) => setNewTeam({...newTeam, leaderName: e.target.value})}
                  className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-slate-800"
                />
                <input 
                  type="email" 
                  placeholder="Leader Email" 
                  required
                  value={newTeam.leaderEmail}
                  onChange={(e) => setNewTeam({...newTeam, leaderEmail: e.target.value})}
                  className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-slate-800"
                />
              </div>
              <input 
                type="text" 
                placeholder="Leader Password" 
                required
                value={newTeam.leaderPassword}
                onChange={(e) => setNewTeam({...newTeam, leaderPassword: e.target.value})}
                className="w-full px-4 py-3 bg-white/60 border border-white/50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-slate-800"
              />
              <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all shadow-md mt-2">
                Create Team & Leader Account
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
