import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { authFetch } from '../../../config/api';
import { ROLE_LABELS } from '../../../config/constants';

export default function EditUserModal({ isOpen, onClose, user, onSaved }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'evaluator',
    isJudge: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'evaluator',
        isJudge: user.isJudge || false
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await authFetch(`/admin/users/${user._id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update user');
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
          <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
          <button onClick={onClose} type="button" className="btn btn-icon">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              >
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {formData.role === 'evaluator' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isJudge}
                    onChange={(e) => setFormData({...formData, isJudge: e.target.checked})}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 border-gray-300"
                  />
                  <div>
                    <span className="block text-sm font-semibold text-gray-900">Is this Evaluator a Judge?</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Judges have special UI privileges for final events.</span>
                  </div>
                </label>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
