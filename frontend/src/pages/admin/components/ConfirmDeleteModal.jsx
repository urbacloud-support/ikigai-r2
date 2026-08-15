import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, itemName, itemType }) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (confirmText !== itemName) return;
    setLoading(true);
    await onConfirm();
    setLoading(false);
    setConfirmText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">Delete {itemType}</h3>
          <p className="text-gray-600 text-sm mb-6">
            This action cannot be undone. This will permanently delete the {itemType.toLowerCase()} 
            <span className="font-semibold text-gray-900"> {itemName}</span> and remove all associated data.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Please type <strong>{itemName}</strong> to confirm.
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
              placeholder={itemName}
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmText !== itemName || loading}
            className={`px-4 py-2 font-medium rounded-xl flex items-center gap-2 transition-all shadow-sm ${
              confirmText === itemName 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20' 
                : 'bg-red-200 text-red-50 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Delete Forever'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
