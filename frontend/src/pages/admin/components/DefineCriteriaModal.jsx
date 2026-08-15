import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { authFetch } from '../../../config/api';

export default function DefineCriteriaModal({ isOpen, onClose, event, onSaved }) {
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setCriteria(event.criteria && event.criteria.length > 0 
        ? JSON.parse(JSON.stringify(event.criteria)) 
        : [{ name: '', maxMarks: 10, inputType: 'number' }]
      );
    }
  }, [event]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    setCriteria([...criteria, { name: '', maxMarks: 10, inputType: 'number' }]);
  };

  const handleRemoveRow = (index) => {
    if (criteria.length === 1) return;
    const newArr = [...criteria];
    newArr.splice(index, 1);
    setCriteria(newArr);
  };

  const handleChange = (index, field, value) => {
    const newArr = [...criteria];
    newArr[index][field] = value;
    setCriteria(newArr);
  };

  const handleSave = async () => {
    // Validate
    const invalid = criteria.some(c => !c.name.trim() || c.maxMarks <= 0);
    if (invalid) {
      setError('Please fill all criteria names and ensure max marks are > 0.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await authFetch(`/admin/events/${event._id}/criteria`, {
        method: 'PUT',
        body: JSON.stringify({ criteria })
      });
      
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save criteria');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Assessment Criteria</h3>
            <p className="text-sm text-gray-500 mt-1">Define scoring criteria for {event?.title}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {criteria.map((c, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Criterion Name</label>
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => handleChange(index, 'name', e.target.value)}
                    placeholder="e.g. Innovation"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                
                <div className="w-full sm:w-24">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Max Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={c.maxMarks}
                    onChange={(e) => handleChange(index, 'maxMarks', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>

                <div className="w-full sm:w-32">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Input Type</label>
                  <select
                    value={c.inputType}
                    onChange={(e) => handleChange(index, 'inputType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                  >
                    <option value="number">Number</option>
                    <option value="text">Text</option>
                    <option value="boolean">Yes/No</option>
                  </select>
                </div>

                <div className="sm:self-end sm:mb-[2px] mt-2 sm:mt-0">
                  <button
                    onClick={() => handleRemoveRow(index)}
                    disabled={criteria.length === 1}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddRow}
            className="mt-4 flex items-center gap-2 text-primary-600 font-medium hover:bg-primary-50 px-4 py-2 rounded-xl transition-colors w-full justify-center border border-dashed border-primary-200"
          >
            <Plus size={16} /> Add Criterion
          </button>
        </div>

        <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-md shadow-primary-500/20 flex items-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Criteria'}
          </button>
        </div>
      </div>
    </div>
  );
}
