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
            <button onClick={onClose} className="btn btn-icon">
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
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmText !== itemName || loading}
            className="btn btn-danger-solid"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Delete Forever'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
