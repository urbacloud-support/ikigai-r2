import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Phone, MoreVertical, Loader2, X } from 'lucide-react';
import { authFetch } from '../../../config/api';

export default function EvaluatorList({ event, trackCode, onRefresh }) {
  const [evaluators, setEvaluators] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Inline form state
  const [isAdding, setIsAdding] = useState(false);
  const [addMode, setAddMode] = useState('existing'); // 'existing' or 'new'
  const [allEvaluators, setAllEvaluators] = useState([]);
  const [selectedExistingId, setSelectedExistingId] = useState('');
  
  const [form, setForm] = useState({ title: 'Mr.', firstName: '', lastName: '', email: '', phone: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEvaluators = async () => {
    try {
      const res = await authFetch(`/admin/events/${event._id}/evaluators`);
      if (res.ok) {
        const data = await res.json();
        // Filter client-side by track code
        const trackEvaluators = data.filter(e => e.assignedTrackId === trackCode);
        setEvaluators(trackEvaluators);
        
        // Fetch all users to find existing evaluators
        const usersRes = await authFetch('/admin/users');
        if (usersRes.ok) {
          const allUsers = await usersRes.json();
          setAllEvaluators(allUsers.filter(u => u.role === 'evaluator'));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluators();
  }, [event._id, trackCode]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.email) return;

    setAddLoading(true);
    setError('');
    
    try {
      const name = `${form.title} ${form.firstName} ${form.lastName}`.trim();
      
      // 1. Create user
      const createRes = await authFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify({ name, email: form.email, role: 'evaluator' })
      });
      
      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.message || 'Failed to create user');
      }
      
      const { user } = await createRes.json();

      // 2. Assign to this event and track
      const assignRes = await authFetch(`/admin/users/${user._id}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ trackCode, eventId: event._id })
      });

      if (!assignRes.ok) {
        throw new Error('User created but assignment failed');
      }

      setForm({ title: 'Mr.', firstName: '', lastName: '', email: '', phone: '' });
      setIsAdding(false);
      fetchEvaluators();
      if (onRefresh) onRefresh();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleAssignExisting = async () => {
    if (!selectedExistingId) return;
    setAddLoading(true);
    setError('');
    
    try {
      const assignRes = await authFetch(`/admin/users/${selectedExistingId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ trackCode, eventId: event._id })
      });

      if (!assignRes.ok) {
        throw new Error('Failed to assign evaluator');
      }

      setSelectedExistingId('');
      setIsAdding(false);
      fetchEvaluators();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-primary-400" /></div>;

  return (
    <div className="mt-4 border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50">
      <div className="flex justify-between items-center p-3 border-b border-gray-100 bg-white">
        <h4 className="font-medium text-sm text-gray-700">Evaluators ({evaluators.length})</h4>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="btn btn-secondary btn-sm"
        >
          {isAdding ? <X size={14} /> : <UserPlus size={14} />}
          {isAdding ? 'Cancel' : 'Add Evaluator'}
        </button>
      </div>

      {isAdding && (
        <div className="p-4 bg-primary-50/50 border-b border-gray-100 space-y-4">
          <div className="flex gap-2 mb-2">
            <button 
              type="button" 
              onClick={() => setAddMode('existing')}
              className={`btn flex-1 ${addMode === 'existing' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Select Existing
            </button>
            <button 
              type="button" 
              onClick={() => setAddMode('new')}
              className={`btn flex-1 ${addMode === 'new' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Create New
            </button>
          </div>

          {error && <div className="text-red-600 text-xs">{error}</div>}

          {addMode === 'existing' ? (
            <div className="flex items-center gap-2">
              <select 
                className="flex-1 text-sm border-gray-200 rounded-lg py-2 px-3"
                value={selectedExistingId}
                onChange={e => setSelectedExistingId(e.target.value)}
              >
                <option value="">-- Select Evaluator --</option>
                {allEvaluators
                  .filter(u => !evaluators.some(ev => ev._id === u._id))
                  .map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <button 
                onClick={handleAssignExisting}
                disabled={addLoading || !selectedExistingId}
                className="btn btn-primary btn-sm h-[38px]"
              >
                {addLoading && <Loader2 size={14} className="animate-spin" />} Assign
              </button>
            </div>
          ) : (
            <form onSubmit={handleAdd}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <select
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  className="text-sm border-gray-200 rounded-lg"
                >
                  <option>Mr.</option>
                  <option>Mrs.</option>
                  <option>Ms.</option>
                  <option>Dr.</option>
                  <option>Prof.</option>
                </select>
                <input 
                  placeholder="First Name" required
                  value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})}
                  className="text-sm border-gray-200 rounded-lg"
                />
                <input 
                  placeholder="Last Name"
                  value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})}
                  className="text-sm border-gray-200 rounded-lg"
                />
                <input 
                  type="email" placeholder="Email" required
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="text-sm border-gray-200 rounded-lg"
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button 
                  type="submit" disabled={addLoading}
                  className="btn btn-primary btn-sm"
                >
                  {addLoading && <Loader2 size={14} className="animate-spin" />} Save
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {evaluators.length === 0 && !isAdding ? (
        <div className="p-6 text-center text-sm text-gray-500">No evaluators assigned to this track yet.</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {evaluators.map(ev => (
            <li key={ev._id} className="p-3 bg-white flex justify-between items-center hover:bg-gray-50 transition-colors">
              <div>
                <div className="font-medium text-sm text-gray-900">{ev.name}</div>
                <div className="text-xs text-gray-500 flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1"><Mail size={12}/> {ev.email}</span>
                </div>
              </div>
              <button className="btn btn-icon">
                <MoreVertical size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
