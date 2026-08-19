import React, { useState, useEffect } from 'react';
import { authFetch } from '../../config/api';
import { ROLE_LABELS } from '../../config/constants';
import { Loader2, Mail, Shield, Plus, Trash2, Users, ChevronDown, ChevronRight } from 'lucide-react';
import CreateUserModal from './components/CreateUserModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export default function UsersView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const initialExpanded = Object.keys(ROLE_LABELS).reduce((acc, key) => ({ ...acc, [key]: true }), {});
  const [expandedRoles, setExpandedRoles] = useState(initialExpanded);

  const toggleRole = (roleKey) => {
    setExpandedRoles(prev => ({ ...prev, [roleKey]: !prev[roleKey] }));
  };
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });

  const fetchUsers = async () => {
    try {
      const res = await authFetch('/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        if (loading) {
          const newExpanded = {};
          Object.keys(ROLE_LABELS).forEach(key => {
            newExpanded[key] = data.some(u => u.role === key);
          });
          setExpandedRoles(newExpanded);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    try {
      await authFetch(`/admin/users/${deleteModal.user._id}`, { method: 'DELETE' });
      setDeleteModal({ isOpen: false, user: null });
      fetchUsers();
    } catch (err) {
      console.error(err);
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
        <h2 className="text-2xl font-bold text-gray-800">Users Directory</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary btn-sm"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add User</span>
        </button>
      </div>
      
      <div className="space-y-4">
        {Object.entries(ROLE_LABELS).map(([roleKey, roleLabel]) => {
          const roleUsers = users.filter(u => u.role === roleKey);
          const isExpanded = expandedRoles[roleKey];

          return (
            <div key={roleKey} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Accordion Header */}
              <button 
                onClick={() => toggleRole(roleKey)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-50 transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-800">{roleLabel}s</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">
                    {roleUsers.length}
                  </span>
                </div>
                <div className="text-gray-400">
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </button>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {roleUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-white text-center">
                      <Users className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="text-gray-500">No {roleLabel.toLowerCase()}s found.</p>
                    </div>
                  ) : (
                    <div>
                      {/* Mobile View: Cards */}
                      <div className="md:hidden divide-y divide-gray-100">
                        {roleUsers.map(user => (
                          <div key={user._id} className="p-4 hover:bg-gray-50/50 transition-colors">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center flex-shrink-0 border border-primary-200">
                                  {getInitials(user.name)}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-800">{user.name}</h3>
                                  <div className="flex items-center text-xs text-gray-500 mt-0.5 gap-1.5">
                                    <Mail size={12} />
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => setDeleteModal({ isOpen: true, user })}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop View: Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100 text-xs uppercase tracking-wider font-bold text-gray-500">
                              <th className="px-6 py-3">User</th>
                              <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {roleUsers.map(user => (
                              <tr key={user._id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 text-primary-700 font-bold flex items-center justify-center border border-primary-200 shadow-sm">
                                      {getInitials(user.name)}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-gray-900">{user.name}</div>
                                      <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                                        <Mail size={12} className="text-gray-400" />
                                        {user.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button 
                                    onClick={() => setDeleteModal({ isOpen: true, user })}
                                    className="btn btn-icon hover:!bg-red-50 hover:!text-red-600 opacity-0 group-hover:opacity-100"
                                    title="Delete User"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchUsers}
      />

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        onConfirm={handleDelete}
        itemName={deleteModal.user?.name || ''}
        itemType="User"
      />
    </div>
  );
}
