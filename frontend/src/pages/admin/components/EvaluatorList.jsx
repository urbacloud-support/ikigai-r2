import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Phone, MoreVertical, Loader2 } from 'lucide-react';
import { authFetch } from '../../../config/api';

export default function EvaluatorList({ event, trackCode, onRefresh }) {
  const [evaluators, setEvaluators] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Inline form state
  const [isAdding, setIsAdding] = useState(false);
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

  if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-primary-400" /></div>;

  return (
    <div className="mt-4 border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50">
      <div className="flex justify-between items-center p-3 border-b border-gray-100 bg-white">
        <h4 className="font-medium text-sm text-gray-700">Evaluators ({evaluators.length})</h4>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium px-2 py-1 hover:bg-primary-50 rounded-lg transition-colors"
        >
          {isAdding ? <X size={14} /> : <UserPlus size={14} />}
          {isAdding ? 'Cancel' : 'Add Evaluator'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 bg-primary-50/50 border-b border-gray-100">
          {error && <div className="text-red-600 text-xs mb-3">{error}</div>}
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
              className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
            >
              {addLoading && <Loader2 size={14} className="animate-spin" />} Save
            </button>
          </div>
        </form>
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
              <button className="text-gray-400 hover:text-gray-600 p-1">
                <MoreVertical size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
