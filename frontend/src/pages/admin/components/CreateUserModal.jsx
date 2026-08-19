import React, { useState } from 'react';
import { X, Copy, Check, Loader2 } from 'lucide-react';
import { authFetch } from '../../../config/api';

export default function CreateUserModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({ name: '', email: '', role: 'evaluator' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await authFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccessData(data); // { user, generatedPassword }
        onCreated();
      } else {
        setError(data.message || 'Failed to create user');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `Email: ${successData.user.email}\nPassword: ${successData.generatedPassword}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', role: 'evaluator' });
    setSuccessData(null);
    setCopied(false);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">
            {successData ? 'User Created' : 'Create New User'}
          </h3>
          <button onClick={handleClose} className="btn btn-icon">
            <X size={20} />
          </button>
        </div>

        {successData ? (
          <div className="p-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-800 text-sm font-medium mb-2">
                User successfully created! Please copy the credentials below. The password will not be shown again.
              </p>
              <div className="bg-white p-3 rounded-lg border border-green-100 font-mono text-sm space-y-1 relative group">
                <div>Email: {successData.user.email}</div>
                <div>Pass : {successData.generatedPassword}</div>
                
                <button 
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                  title="Copy Credentials"
                >
                  {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="btn btn-primary w-full"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text" required
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email" required
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                >
                  <option value="evaluator">Evaluator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button type="button" onClick={handleClose} className="btn btn-secondary">
                Cancel
              </button>
              <button 
                type="submit" disabled={loading}
                className="btn btn-primary"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Create User
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
