import React, { useState, useEffect } from 'react';
import { authFetch } from '../../config/api';
import { ASSESSMENT_CRITERIA } from '../../config/constants';
import Header from '../../components/shared/Header';
import { Loader2, Users as TeamIcon, CheckCircle, ChevronRight } from 'lucide-react';

export default function EvaluatorConsole() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  // Assessment state
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await authFetch('/evaluator/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (criteria, value) => {
    setScores(prev => ({ ...prev, [criteria]: parseInt(value, 10) }));
  };

  const calculateTotal = () => {
    return Object.values(scores).reduce((a, b) => a + (b || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;

    setSubmitting(true);
    setSubmitSuccess(false);

    try {
      const res = await authFetch(`/evaluator/teams/${selectedTeam._id}/assess`, {
        method: 'PATCH',
        body: JSON.stringify({
          criteriaScores: scores,
          totalScore: calculateTotal(),
          feedback
        })
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setSelectedTeam(null);
          setScores({});
          setFeedback('');
          setSubmitSuccess(false);
          fetchTeams(); // Refresh list to show updated status
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
      <Header />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Mobile: Hide team list if assessing a team */}
          <div className={`w-full md:w-1/3 flex-shrink-0 flex flex-col gap-3 ${selectedTeam ? 'hidden md:flex' : 'flex'}`}>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Assigned Teams</h2>
            
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary-500" /></div>
            ) : teams.length === 0 ? (
              <div className="p-6 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
                No teams assigned to you yet.
              </div>
            ) : (
              teams.map(team => (
                <button
                  key={team._id}
                  onClick={() => {
                    setSelectedTeam(team);
                    setScores({});
                    setFeedback('');
                  }}
                  className={`flex flex-col p-4 rounded-2xl border text-left transition-all ${
                    selectedTeam?._id === team._id
                      ? 'bg-primary-50 border-primary-200 shadow-sm shadow-primary-500/10'
                      : 'bg-white border-gray-100 hover:border-primary-100 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <h3 className={`font-bold ${selectedTeam?._id === team._id ? 'text-primary-800' : 'text-gray-800'} flex items-center gap-2`}>
                      <TeamIcon size={16} className="text-primary-500" />
                      {team.leaderEmail.split('@')[0]} {/* Mocking name via email */}
                    </h3>
                    <ChevronRight size={18} className={selectedTeam?._id === team._id ? 'text-primary-500' : 'text-gray-300'} />
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{team.project?.title || 'No Project Title'}</p>
                </button>
              ))
            )}
          </div>

          <div className={`flex-1 ${!selectedTeam ? 'hidden md:block' : 'block'}`}>
            {selectedTeam ? (
              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                
                {/* Mobile Back Button */}
                <button 
                  onClick={() => setSelectedTeam(null)}
                  className="md:hidden mb-6 text-sm font-semibold text-primary-600 flex items-center gap-1"
                >
                  &larr; Back to Teams
                </button>

                <div className="border-b border-gray-100 pb-6 mb-6">
                  <h2 className="text-2xl font-black text-gray-800 mb-2">Evaluate Team</h2>
                  <p className="text-gray-500">{selectedTeam.leaderEmail}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  
                  <div className="space-y-6">
                    <h3 className="font-bold text-lg text-gray-700 flex items-center justify-between">
                      Scoring Criteria
                      <span className="text-primary-600 font-black text-xl">{calculateTotal()} / 50</span>
                    </h3>
                    
                    <div className="space-y-5">
                      {ASSESSMENT_CRITERIA.map(criteria => (
                        <div key={criteria} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <label className="flex justify-between items-center mb-3 text-sm font-semibold text-gray-700">
                            {criteria}
                            <span className="text-gray-500 font-normal">Score: {scores[criteria] || 0}/10</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={scores[criteria] || 0}
                            onChange={(e) => handleScoreChange(criteria, e.target.value)}
                            className="w-full accent-primary-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block font-bold text-lg text-gray-700">Detailed Feedback</label>
                    <textarea
                      rows="4"
                      required
                      placeholder="Provide constructive feedback for the team..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-400 outline-none transition-all resize-none"
                    ></textarea>
                  </div>

                  {submitSuccess ? (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold animate-in zoom-in duration-300">
                      <CheckCircle size={20} />
                      Assessment Saved Successfully!
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-700 text-white font-bold text-lg shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {submitting ? <Loader2 className="animate-spin" size={24} /> : 'Submit Assessment'}
                    </button>
                  )}

                </form>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 p-12 bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="text-center">
                  <TeamIcon size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-lg font-medium text-gray-500">Select a team from the list to begin evaluation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
