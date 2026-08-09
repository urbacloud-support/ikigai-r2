import React, { useState } from 'react';
import Header from '../../components/Header';
import { STORAGE_KEYS } from '../../config/constants';
import { ClipboardList, CheckCircle, Clock } from 'lucide-react';

const EvaluatorConsole = () => {
    const userName = sessionStorage.getItem(STORAGE_KEYS.EMAIL)?.split('@')[0] || 'Evaluator';
    
    // Mock Data for Phase 7 UI Scaffolding
    const [teams] = useState([
        { _id: '1', teamName: 'NeuroSync', track: 'Software', status: 'Pending' },
        { _id: '2', teamName: 'AgriTech Drone', track: 'Hardware', status: 'Completed', score: 85 },
        { _id: '3', teamName: 'CyberShield', track: 'Cybersecurity', status: 'Pending' }
    ]);

    const [selectedTeam, setSelectedTeam] = useState(null);

    const handleScoreSubmit = (e) => {
        e.preventDefault();
        alert(`Score submitted for ${selectedTeam.teamName}. (API binding in Phase 8)`);
        setSelectedTeam(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header title="Evaluator Console" userName={userName} role="evaluator" />
            
            <main className="flex-1 p-6 flex gap-6 max-w-7xl mx-auto w-full">
                {/* Team List Pane */}
                <div className="w-1/3 flex flex-col bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 font-semibold text-gray-800">
                        Assigned Teams ({teams.length})
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {teams.map(team => (
                            <button
                                key={team._id}
                                onClick={() => setSelectedTeam(team)}
                                className={`w-full text-left p-4 rounded-lg border transition-all ${
                                    selectedTeam?._id === team._id 
                                        ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' 
                                        : 'border-gray-100 hover:border-primary-300 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-gray-900">{team.teamName}</h4>
                                    {team.status === 'Completed' ? (
                                        <CheckCircle size={18} className="text-green-500" />
                                    ) : (
                                        <Clock size={18} className="text-yellow-500" />
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mb-2">{team.track}</p>
                                {team.status === 'Completed' && (
                                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                                        Score: {team.score}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Evaluation Form Pane */}
                <div className="w-2/3 bg-white rounded-xl shadow-sm border p-6">
                    {selectedTeam ? (
                        <div>
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                                    <ClipboardList size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Evaluate: {selectedTeam.teamName}</h2>
                                    <p className="text-gray-500">{selectedTeam.track} Track</p>
                                </div>
                            </div>

                            {selectedTeam.status === 'Completed' ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                                    <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                                    <h3 className="text-xl font-bold text-green-800 mb-2">Evaluation Complete</h3>
                                    <p className="text-green-600">You awarded this team a score of {selectedTeam.score}.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleScoreSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Innovation Score (1-10)</label>
                                            <input type="number" min="1" max="10" required className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Technical Execution (1-10)</label>
                                            <input type="number" min="1" max="10" required className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Presentation (1-10)</label>
                                            <input type="number" min="1" max="10" required className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Feasibility (1-10)</label>
                                            <input type="number" min="1" max="10" required className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none" />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Qualitative Feedback</label>
                                        <textarea required rows="4" className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Provide detailed feedback for the team..."></textarea>
                                    </div>

                                    <div className="flex justify-end pt-4 border-t">
                                        <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                                            Submit Evaluation
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <ClipboardList size={64} className="mb-4 opacity-20" />
                            <p className="text-lg">Select a team from the list to begin evaluation</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default EvaluatorConsole;
