import React from 'react';
import { Mail, Phone, Briefcase } from 'lucide-react';

const EvaluatorList = ({ evaluators }) => {
    if (!evaluators || evaluators.length === 0) {
        return <p className="text-gray-500 text-sm">No evaluators assigned yet.</p>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evaluators.map(ev => (
                <div key={ev._id || ev.email} className="bg-white border rounded-lg p-5 hover:border-primary-300 transition-colors">
                    <h4 className="font-semibold text-gray-900 text-lg">{ev.name}</h4>
                    <p className="text-primary-600 text-sm font-medium mb-3">{ev.designation} @ {ev.company}</p>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-400" />
                            <span className="truncate">{ev.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-400" />
                            <span>{ev.mobile || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                            <Briefcase size={14} className="text-gray-400" />
                            <span className="text-xs">Assigned to: {ev.assignedTracks?.length > 0 ? ev.assignedTracks.join(', ') : 'All/Floating'}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default EvaluatorList;
