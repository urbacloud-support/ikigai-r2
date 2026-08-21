import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Filter, ListOrdered, CheckSquare, 
  Square, Search, Layout, Printer, Save, FileSpreadsheet, FileJson, Loader2 
} from 'lucide-react';
import { getTrackName, getProblemStatementName } from '../../utils/mappingUtils';
import { authFetch } from '../../config/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function ReportBuilderView() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Field Selection
  const [selectedFixedFields, setSelectedFixedFields] = useState({
    teamName: true,
    teamId: true,
    trackName: true,
    problemStatement: true,
    members: true,
    institute: true,
    teamLeader: true,
    finalResult: true
  });

  const [selectedCriteria, setSelectedCriteria] = useState({});
  const [criteriaFilter, setCriteriaFilter] = useState('all'); // 'all', 'numeric', 'text'

  // Sort & Filter
  const [sortBy, setSortBy] = useState('teamName'); // 'teamName', 'totalScore', 'trackName'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
  const [minScoreFilter, setMinScoreFilter] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchTeams(selectedEventId);
      
      // Auto-select all criteria for the selected event initially
      const event = events.find(e => e._id === selectedEventId);
      if (event && event.criteria) {
        const initialSelected = {};
        event.criteria.forEach(c => {
          initialSelected[c.name] = true;
        });
        setSelectedCriteria(initialSelected);
      }
    } else {
      setTeams([]);
      setSelectedCriteria({});
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const res = await authFetch(`/admin/events`);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeams = async (eventId) => {
    setLoading(true);
    try {
      const res = await authFetch(`/admin/teams?eventId=${eventId}`);
      const data = await res.json();
      setTeams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedEvent = events.find(e => e._id === selectedEventId);

  // Compute Data for preview
  const getProcessedTeams = () => {
    if (!selectedEvent) return [];

    let processed = teams.map(team => {
      // Find assessments for this event
      const assessmentData = team.assessments?.find(a => a.eventId === selectedEventId || a.eventName === selectedEvent.title);
      
      let totalScore = 0;
      let criteriaScores = {};
      
      if (assessmentData && assessmentData.evaluatorScores) {
        // Compute average for each criteria across evaluators
        const criteriaTotals = {};
        const criteriaCounts = {};
        
        assessmentData.evaluatorScores.forEach(evalScore => {
          if (evalScore.mode === 'absent') return;
          
          evalScore.criteria.forEach(c => {
            if (c.inputType === 'number' || c.inputType === 'boolean') {
              criteriaTotals[c.name] = (criteriaTotals[c.name] || 0) + Number(c.score || 0);
              criteriaCounts[c.name] = (criteriaCounts[c.name] || 0) + 1;
            } else if (c.inputType === 'text') {
              if (!criteriaScores[c.name]) criteriaScores[c.name] = [];
              if (c.score) criteriaScores[c.name].push(`${evalScore.evaluatorName}: ${c.score}`);
            }
          });
        });

        // Calculate averages
        selectedEvent.criteria.forEach(c => {
          if (c.inputType === 'number' || c.inputType === 'boolean') {
            const avg = criteriaCounts[c.name] ? (criteriaTotals[c.name] / criteriaCounts[c.name]).toFixed(1) : 0;
            criteriaScores[c.name] = avg;
            totalScore += Number(avg);
          } else if (c.inputType === 'text') {
            criteriaScores[c.name] = criteriaScores[c.name] ? criteriaScores[c.name].join(' | ') : 'No remarks';
          }
        });
      }

      return {
        ...team,
        calculatedTotalScore: totalScore,
        criteriaScores
      };
    });

    // Apply Filter
    if (minScoreFilter) {
      processed = processed.filter(t => t.calculatedTotalScore >= Number(minScoreFilter));
    }

    // Apply Sort
    processed.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'teamName') {
        valA = a.teamName?.toLowerCase() || '';
        valB = b.teamName?.toLowerCase() || '';
      } else if (sortBy === 'totalScore') {
        valA = a.calculatedTotalScore;
        valB = b.calculatedTotalScore;
      } else if (sortBy === 'trackName') {
        valA = a.assignedTrack;
        valB = b.assignedTrack;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return processed;
  };

  const processedTeams = getProcessedTeams();

  const handleToggleFixedField = (field) => {
    setSelectedFixedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleToggleCriteria = (criteriaName) => {
    setSelectedCriteria(prev => ({ ...prev, [criteriaName]: !prev[criteriaName] }));
  };

  const exportExcelCsv = (format) => {
    if (!selectedEvent || processedTeams.length === 0) return alert("No data to export.");
    
    const headers = [];
    if (selectedFixedFields.teamName) headers.push("Team Name");
    if (selectedFixedFields.teamId) headers.push("Team ID");
    if (selectedFixedFields.trackName) headers.push("Track");
    if (selectedFixedFields.problemStatement) headers.push("Problem Statement");
    if (selectedFixedFields.members) headers.push("Members");
    if (selectedFixedFields.teamLeader) headers.push("Team Leader");
    if (selectedFixedFields.institute) headers.push("Institute");
    if (selectedFixedFields.finalResult) headers.push("Result");
    
    const criteriaHeaders = selectedEvent.criteria.filter(c => selectedCriteria[c.name]).map(c => c.name);
    headers.push(...criteriaHeaders);
    headers.push("Total Score");

    const rows = processedTeams.map(team => {
      const row = {};
      if (selectedFixedFields.teamName) row["Team Name"] = team.teamName || 'Unnamed Team';
      if (selectedFixedFields.teamId) row["Team ID"] = team._id;
      if (selectedFixedFields.trackName) row["Track"] = getTrackName(team.assignedTrack) || '-';
      if (selectedFixedFields.problemStatement) row["Problem Statement"] = getProblemStatementName(team.assignedProblemStatement, true) || '-';
      if (selectedFixedFields.members) row["Members"] = team.members?.length || 0;
      if (selectedFixedFields.teamLeader) row["Team Leader"] = team.leaderEmail || '-';
      if (selectedFixedFields.institute) row["Institute"] = team.members?.[0]?.organisation || '-';
      if (selectedFixedFields.finalResult) row["Result"] = team.status || '-';
      
      criteriaHeaders.forEach(c => {
        row[c] = team.criteriaScores?.[c] ?? '-';
      });
      row["Total Score"] = team.calculatedTotalScore;
      
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    
    if (format === 'csv') {
      XLSX.writeFile(workbook, `${selectedEvent.title}_Report.csv`);
    } else {
      XLSX.writeFile(workbook, `${selectedEvent.title}_Report.xlsx`);
    }
  };

  const exportPDF = () => {
    if (!selectedEvent || processedTeams.length === 0) return alert("No data to export.");
    
    const doc = new jsPDF();
    
    // Global Document Header (Violet 700)
    doc.setFillColor(109, 40, 217); 
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`Assessment Report`, 14, 20);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`${selectedEvent.title} | Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    let currentY = 50;
    
    processedTeams.forEach((team, idx) => {
      // Add page if we don't have enough space for at least the team header and some info
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }
      
      // Team Section Banner (Violet 100)
      doc.setFillColor(237, 233, 254);
      doc.rect(14, currentY - 6, 182, 12, 'F');
      
      doc.setFontSize(14);
      doc.setTextColor(91, 33, 182); // Violet 800
      doc.setFont("helvetica", "bold");
      const tName = selectedFixedFields.teamName ? team.teamName || 'Unnamed Team' : `Team ${idx+1}`;
      doc.text(tName.toUpperCase(), 16, currentY + 2);
      currentY += 12;
      
      const infoBody = [];
      if (selectedFixedFields.teamId) infoBody.push(['Team ID', team._id]);
      if (selectedFixedFields.trackName) infoBody.push(['Track', getTrackName(team.assignedTrack) || '-']);
      if (selectedFixedFields.problemStatement) infoBody.push(['Problem', getProblemStatementName(team.assignedProblemStatement, true) || '-']);
      if (selectedFixedFields.members) infoBody.push(['Members Count', String(team.members?.length || 0)]);
      if (selectedFixedFields.teamLeader) infoBody.push(['Team Leader', team.leaderEmail || '-']);
      if (selectedFixedFields.institute) infoBody.push(['Institute', team.members?.[0]?.organisation || '-']);
      if (selectedFixedFields.finalResult) infoBody.push(['Result', team.status || '-']);
      
      if (infoBody.length > 0) {
        autoTable(doc, {
          startY: currentY,
          body: infoBody,
          theme: 'plain',
          styles: { cellPadding: 1.5, fontSize: 10, textColor: [75, 85, 99] }, // Gray 600
          columnStyles: { 0: { fontStyle: 'bold', textColor: [219, 39, 119], cellWidth: 45 } } // Pink 600 for keys
        });
        currentY = doc.lastAutoTable.finalY + 8;
      }
      
      const criteriaBody = selectedEvent.criteria
        .filter(c => selectedCriteria[c.name])
        .map(c => [c.name, team.criteriaScores?.[c.name] ?? '-']);
        
      criteriaBody.push(['Calculated Total Score', String(team.calculatedTotalScore)]);
      
      autoTable(doc, {
        startY: currentY,
        head: [['Assessment Criteria', 'Value / Remarks']],
        body: criteriaBody,
        theme: 'grid',
        headStyles: { fillColor: [192, 38, 211], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 11 }, // Fuchsia 600
        alternateRowStyles: { fillColor: [253, 244, 255] }, // Fuchsia 50
        styles: { fontSize: 9.5, textColor: [31, 41, 55], lineColor: [250, 232, 255], lineWidth: 0.1 }, // Fuchsia 100 borders
        columnStyles: { 0: { fontStyle: 'bold' } },
        didParseCell: function (data) {
          // Highlight the total score row
          if (data.row.index === criteriaBody.length - 1 && data.section === 'body') {
            data.cell.styles.fillColor = [253, 232, 243]; // Pink 100
            data.cell.styles.textColor = [190, 24, 93]; // Pink 700
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });
      
      currentY = doc.lastAutoTable.finalY + 18;
    });
    
    doc.save(`${selectedEvent.title}_Report.pdf`);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 bg-white border-b border-gray-200 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Layout className="text-primary-600" /> Report Builder
          </h1>
          <p className="text-sm text-gray-500 mt-1">Design and generate dynamic event assessment reports.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportExcelCsv('csv')} className="btn btn-secondary flex items-center gap-2 text-sm py-1.5 px-3">
            <FileJson size={16} /> CSV
          </button>
          <button onClick={() => exportExcelCsv('xlsx')} className="btn btn-secondary flex items-center gap-2 text-sm py-1.5 px-3">
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button onClick={exportPDF} className="btn btn-primary flex items-center gap-2 text-sm py-1.5 px-3">
            <Printer size={16} /> PDF
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-gray-50">
        
        {/* Left Panel: Event, Filter, Sort */}
        <div className="w-full md:w-1/4 lg:w-1/5 bg-white border-r border-gray-200 overflow-y-auto p-5 shrink-0 shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-10">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText size={16} className="text-primary-500"/> Step 1: Event
          </h3>
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Select Event</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500"
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
            >
              <option value="">-- Choose an Event --</option>
              {events.map(e => (
                <option key={e._id} value={e._id}>{e.title}</option>
              ))}
            </select>
          </div>

          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-t pt-4">
            <Filter size={16} className="text-primary-500"/> Filters
          </h3>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Minimum Total Score</label>
            <input 
              type="number"
              placeholder="e.g. 50"
              value={minScoreFilter}
              onChange={e => setMinScoreFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:bg-white"
            />
          </div>

          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-t pt-4">
            <ListOrdered size={16} className="text-primary-500"/> Sorting
          </h3>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Sort By</label>
            <select 
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm mb-2 bg-gray-50 focus:bg-white"
            >
              <option value="teamName">Team Name</option>
              <option value="totalScore">Total Score</option>
              <option value="trackName">Track</option>
            </select>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setSortOrder('asc')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border ${sortOrder === 'asc' ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200 text-gray-600'}`}
              >Ascending</button>
              <button 
                onClick={() => setSortOrder('desc')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border ${sortOrder === 'desc' ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200 text-gray-600'}`}
              >Descending</button>
            </div>
          </div>
        </div>

        {/* Middle Panel: Field Configuration */}
        <div className="w-full md:w-1/4 lg:w-1/4 bg-white border-r border-gray-200 overflow-y-auto p-5 shrink-0 shadow-[2px_0_10px_rgba(0,0,0,0.02)] z-10">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CheckSquare size={16} className="text-primary-500"/> Step 2: Configure Fields
          </h3>
          
          <div className="mb-6">
            <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Team Information</h4>
            <div className="space-y-1.5">
              {Object.keys(selectedFixedFields).map(field => (
                <label key={field} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedFixedFields[field]}
                    onChange={() => handleToggleFixedField(field)}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedEvent && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase">Assessment Criteria</h4>
              </div>
              
              <div className="flex gap-1 mb-3 bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setCriteriaFilter('all')}
                  className={`flex-1 text-[10px] font-bold uppercase py-1 rounded ${criteriaFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                >All</button>
                <button 
                  onClick={() => setCriteriaFilter('numeric')}
                  className={`flex-1 text-[10px] font-bold uppercase py-1 rounded ${criteriaFilter === 'numeric' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                >Numeric</button>
                <button 
                  onClick={() => setCriteriaFilter('text')}
                  className={`flex-1 text-[10px] font-bold uppercase py-1 rounded ${criteriaFilter === 'text' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                >Text</button>
              </div>

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-2">
                {selectedEvent.criteria
                  .filter(c => {
                    if (criteriaFilter === 'numeric') return c.inputType === 'number' || c.inputType === 'boolean';
                    if (criteriaFilter === 'text') return c.inputType === 'text';
                    return true;
                  })
                  .map((c, idx) => (
                  <label key={idx} className="flex items-start gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={!!selectedCriteria[c.name]}
                      onChange={() => handleToggleCriteria(c.name)}
                      className="w-4 h-4 text-primary-600 rounded border-gray-300 mt-0.5 shrink-0"
                    />
                    <div>
                      <span className="text-sm text-gray-700 leading-tight block">{c.name}</span>
                      <span className="text-[10px] text-gray-400 uppercase">{c.inputType}</span>
                    </div>
                  </label>
                ))}
                {selectedEvent.criteria.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No criteria defined for this event.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Live Preview */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-100/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">Report Preview</h2>
            <div className="text-sm text-gray-500">
              {loading ? (
                <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading data...</span>
              ) : (
                <span>Showing {processedTeams.length} teams</span>
              )}
            </div>
          </div>

          {!selectedEvent ? (
            <div className="bg-white border border-gray-200 rounded-2xl border-dashed h-64 flex flex-col items-center justify-center text-gray-400">
              <FileText size={48} className="mb-4 opacity-50" />
              <p>Select an event to preview the report</p>
            </div>
          ) : (
            <div className="space-y-8 pb-10">
              {processedTeams.map((team, idx) => (
                <div key={team._id || idx} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden page-break-after-auto break-inside-avoid">
                  
                  {/* Team Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900">{selectedFixedFields.teamName ? team.teamName || 'Unnamed Team' : `Team ${idx+1}`}</h3>
                  </div>

                  <div className="p-6">
                    {/* Fixed Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
                      {selectedFixedFields.teamId && (
                        <div className="flex border-b border-gray-100 pb-2">
                          <span className="w-1/3 text-sm font-semibold text-gray-500">Team ID</span>
                          <span className="w-2/3 text-sm font-medium text-gray-900">{team._id}</span>
                        </div>
                      )}
                      {selectedFixedFields.trackName && (
                        <div className="flex border-b border-gray-100 pb-2">
                          <span className="w-1/3 text-sm font-semibold text-gray-500">Track</span>
                          <span className="w-2/3 text-sm font-medium text-gray-900">{getTrackName(team.assignedTrack) || '-'}</span>
                        </div>
                      )}
                      {selectedFixedFields.problemStatement && (
                        <div className="flex border-b border-gray-100 pb-2">
                          <span className="w-1/3 text-sm font-semibold text-gray-500">Problem</span>
                          <span className="w-2/3 text-sm font-medium text-gray-900">{getProblemStatementName(team.assignedProblemStatement, true) || '-'}</span>
                        </div>
                      )}
                      {selectedFixedFields.members && (
                        <div className="flex border-b border-gray-100 pb-2">
                          <span className="w-1/3 text-sm font-semibold text-gray-500">Members</span>
                          <span className="w-2/3 text-sm font-medium text-gray-900">{team.members?.length || 0}</span>
                        </div>
                      )}
                      {selectedFixedFields.teamLeader && (
                        <div className="flex border-b border-gray-100 pb-2">
                          <span className="w-1/3 text-sm font-semibold text-gray-500">Leader</span>
                          <span className="w-2/3 text-sm font-medium text-gray-900">{team.leaderEmail || '-'}</span>
                        </div>
                      )}
                      {selectedFixedFields.institute && (
                        <div className="flex border-b border-gray-100 pb-2">
                          <span className="w-1/3 text-sm font-semibold text-gray-500">Institute</span>
                          <span className="w-2/3 text-sm font-medium text-gray-900">{team.members?.[0]?.organisation || '-'}</span>
                        </div>
                      )}
                      {selectedFixedFields.finalResult && (
                        <div className="flex border-b border-gray-100 pb-2">
                          <span className="w-1/3 text-sm font-semibold text-gray-500">Result</span>
                          <span className="w-2/3 text-sm font-bold text-primary-700">{team.status || '-'}</span>
                        </div>
                      )}
                    </div>

                    {/* Assessment Criteria Vertical Layout */}
                    <h4 className="text-base font-bold text-gray-800 mb-4 border-b pb-2">Assessment Details</h4>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="py-3 px-4 text-sm font-bold text-gray-700 w-1/3">Assessment Criteria</th>
                            <th className="py-3 px-4 text-sm font-bold text-gray-700 w-2/3">Value / Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedEvent.criteria
                            .filter(c => selectedCriteria[c.name])
                            .map((c, i) => (
                            <tr key={i} className="hover:bg-gray-50/50">
                              <td className="py-3 px-4 text-sm font-medium text-gray-800 align-top">
                                {c.name}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 align-top break-words whitespace-pre-wrap">
                                {team.criteriaScores?.[c.name] ?? '-'}
                              </td>
                            </tr>
                          ))}
                          
                          {/* Total Score Row */}
                          <tr className="bg-primary-50/30">
                            <td className="py-3 px-4 text-sm font-bold text-gray-900 uppercase">
                              Calculated Total Score
                            </td>
                            <td className="py-3 px-4 text-sm font-bold text-primary-700">
                              {team.calculatedTotalScore}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
              
              {processedTeams.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500">
                  No teams match the current filters for this event.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
