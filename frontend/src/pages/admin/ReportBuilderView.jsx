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
import logo from '../../assets/ikigai.png';

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
    finalResult: true,
    progressRemarks: true
  });

  const [selectedCriteria, setSelectedCriteria] = useState({});
  const [criteriaFilter, setCriteriaFilter] = useState('all'); // 'all', 'numeric', 'text'
  const [showTotal, setShowTotal] = useState(true);
  const [includeMarks, setIncludeMarks] = useState(true);

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
        setShowTotal(true);
      }
    } else {
      setTeams([]);
      setSelectedCriteria({});
    }
  }, [selectedEventId, events]);

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
      let progressRemarks = '';
      
      if (assessmentData && assessmentData.evaluatorScores) {
        // Compute average for each criteria across evaluators
        const criteriaTotals = {};
        const criteriaCounts = {};
        const progressTexts = [];
        
        assessmentData.evaluatorScores.forEach(evalScore => {
          if (evalScore.mode === 'absent') return;
          
          if (evalScore.progress) {
            progressTexts.push(`${evalScore.evaluatorName}: ${evalScore.progress}`);
          }
          
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
        progressRemarks = progressTexts.join(' | ');
      }

      return {
        ...team,
        calculatedTotalScore: totalScore,
        criteriaScores,
        progressRemarks
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
    if (selectedFixedFields.progressRemarks) headers.push("Progress Remarks");
    
    const criteriaHeaders = selectedEvent.criteria.filter(c => selectedCriteria[c.name]).map(c => c.name);
    headers.push(...criteriaHeaders);
    if (showTotal) headers.push("Total Score");

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
      if (selectedFixedFields.progressRemarks) row["Progress Remarks"] = includeMarks ? (team.progressRemarks || '-') : '';
      
      criteriaHeaders.forEach(c => {
        row[c] = includeMarks ? (team.criteriaScores?.[c] ?? '-') : '';
      });
      if (showTotal) row["Total Score"] = includeMarks ? team.calculatedTotalScore : '';
      
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
    
    const doc = new jsPDF('landscape');
    
    // Purple to Pink Gradient Header
    for (let i = 0; i < doc.internal.pageSize.width; i++) {
      const ratio = i / doc.internal.pageSize.width;
      const r = 109 + (236 - 109) * ratio;
      const g = 40 + (72 - 40) * ratio;
      const b = 217 + (153 - 217) * ratio;
      doc.setFillColor(r, g, b);
      doc.rect(i, 0, 1, 32, 'F');
    }
    
    const logoEl = document.getElementById('report-logo');
    if (logoEl) {
      doc.addImage(logoEl, 'PNG', doc.internal.pageSize.width - 50, 4, 38, 24);
    }
    
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`Assessment Report${!includeMarks ? ' (Shell / Empty)' : ''}`, 14, 18);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${selectedEvent.title} | Generated: ${new Date().toLocaleString()}`, 14, 25);
    
    const headers = [];
    const colStyles = {};
    let colIdx = 0;

    if (selectedFixedFields.teamName) { headers.push("Team Name"); colStyles[colIdx++] = {}; }
    if (selectedFixedFields.teamId) { headers.push("Team ID"); colStyles[colIdx++] = { fontSize: 7 }; }
    if (selectedFixedFields.trackName) { headers.push("Track"); colStyles[colIdx++] = { fontSize: 7 }; }
    if (selectedFixedFields.problemStatement) { headers.push("Problem"); colStyles[colIdx++] = { fontSize: 7 }; }
    if (selectedFixedFields.members) { headers.push("Members"); colStyles[colIdx++] = { halign: 'center' }; }
    if (selectedFixedFields.teamLeader) { headers.push("Leader"); colStyles[colIdx++] = { fontSize: 7 }; }
    if (selectedFixedFields.institute) { headers.push("Institute"); colStyles[colIdx++] = { fontSize: 7 }; }
    if (selectedFixedFields.finalResult) { headers.push("Result"); colStyles[colIdx++] = {}; }
    if (selectedFixedFields.progressRemarks) { headers.push("Progress Remarks"); colStyles[colIdx++] = { fontSize: 7, minCellWidth: 35 }; }
    
    const criteriaHeaders = selectedEvent.criteria.filter(c => selectedCriteria[c.name]);
    criteriaHeaders.forEach(c => {
      headers.push(c.name);
      if (c.inputType === 'text') {
        colStyles[colIdx++] = { fontSize: 7, minCellWidth: 30 };
      } else {
        colStyles[colIdx++] = { minCellWidth: 16, halign: 'center' };
      }
    });

    if (showTotal) { 
      headers.push("Total"); 
      colStyles[colIdx++] = { minCellWidth: 16, halign: 'center', fontStyle: 'bold' }; 
    }

    const rows = processedTeams.map((team) => {
      const row = [];
      if (selectedFixedFields.teamName) row.push(team.teamName || 'Unnamed Team');
      if (selectedFixedFields.teamId) row.push(team._id);
      if (selectedFixedFields.trackName) row.push(getTrackName(team.assignedTrack) || '-');
      if (selectedFixedFields.problemStatement) row.push(getProblemStatementName(team.assignedProblemStatement, true) || '-');
      if (selectedFixedFields.members) row.push(String(team.members?.length || 0));
      if (selectedFixedFields.teamLeader) row.push(team.leaderEmail || '-');
      if (selectedFixedFields.institute) row.push(team.members?.[0]?.organisation || '-');
      if (selectedFixedFields.finalResult) row.push(team.status || '-');
      if (selectedFixedFields.progressRemarks) row.push(includeMarks ? (team.progressRemarks || '-') : ' ');
      
      criteriaHeaders.forEach(c => {
        row.push(includeMarks ? String(team.criteriaScores?.[c.name] ?? '-') : ' ');
      });
      if (showTotal) {
        row.push(includeMarks ? String(team.calculatedTotalScore) : ' ');
      }
      return row;
    });

    autoTable(doc, {
      startY: 37,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [147, 51, 234], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: colStyles
    });
    
    doc.save(`${selectedEvent.title}_Report${!includeMarks ? '_Shell' : ''}.pdf`);
  };

  return (
    <div className="h-full flex flex-col">
      <img id="report-logo" src={logo} className="hidden" alt="logo" />
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
          
          <div className="mb-6 border-b pb-6 border-gray-100">
            <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Export Mode</h4>
            <label className="flex items-center gap-2 p-1.5 bg-primary-50 rounded-lg border border-primary-100 cursor-pointer mb-1">
              <input 
                type="checkbox" 
                checked={includeMarks}
                onChange={() => setIncludeMarks(!includeMarks)}
                className="w-4 h-4 text-primary-600 rounded border-primary-300"
              />
              <span className="text-sm font-semibold text-primary-900">Include Evaluator Marks</span>
            </label>
            <p className="text-[10px] text-gray-500 leading-tight px-1.5">Uncheck to download an empty shell report (useful for physical pen-paper marking).</p>
          </div>

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
                
                {criteriaFilter !== 'text' && (
                  <label className="flex items-start gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer border-t border-gray-100 mt-2 pt-2">
                    <input 
                      type="checkbox" 
                      checked={showTotal}
                      onChange={() => setShowTotal(!showTotal)}
                      className="w-4 h-4 text-primary-600 rounded border-gray-300 mt-0.5 shrink-0"
                    />
                    <div>
                      <span className="text-sm font-bold text-gray-800 leading-tight block">Total (Numeric Sum)</span>
                      <span className="text-[10px] text-gray-400 uppercase">calculated</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Live Preview */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-100/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800">Report Preview {includeMarks ? '' : '(Shell Mode)'}</h2>
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
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto pb-4">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {selectedFixedFields.teamName && <th className="py-3 px-4 text-xs font-bold text-gray-700">Team Name</th>}
                    {selectedFixedFields.teamId && <th className="py-3 px-4 text-xs font-bold text-gray-700">Team ID</th>}
                    {selectedFixedFields.trackName && <th className="py-3 px-4 text-xs font-bold text-gray-700">Track</th>}
                    {selectedFixedFields.problemStatement && <th className="py-3 px-4 text-xs font-bold text-gray-700 max-w-[200px] truncate">Problem</th>}
                    {selectedFixedFields.members && <th className="py-3 px-4 text-xs font-bold text-gray-700">Members</th>}
                    {selectedFixedFields.teamLeader && <th className="py-3 px-4 text-xs font-bold text-gray-700">Leader</th>}
                    {selectedFixedFields.institute && <th className="py-3 px-4 text-xs font-bold text-gray-700 max-w-[150px] truncate">Institute</th>}
                    {selectedFixedFields.finalResult && <th className="py-3 px-4 text-xs font-bold text-gray-700">Result</th>}
                    {selectedFixedFields.progressRemarks && <th className="py-3 px-4 text-xs font-bold text-gray-700 max-w-[200px] truncate">Progress / Remarks</th>}
                    {selectedEvent.criteria.filter(c => selectedCriteria[c.name]).map((c, i) => (
                      <th key={i} className="py-3 px-4 text-xs font-bold text-gray-700">{c.name}</th>
                    ))}
                    {showTotal && <th className="py-3 px-4 text-xs font-bold text-gray-700 bg-primary-50">Total</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {processedTeams.map((team, idx) => (
                    <tr key={team._id || idx} className="hover:bg-gray-50">
                      {selectedFixedFields.teamName && <td className="py-2.5 px-4 text-sm font-medium text-gray-900">{team.teamName || 'Unnamed Team'}</td>}
                      {selectedFixedFields.teamId && <td className="py-2.5 px-4 text-xs text-gray-500 font-mono">{team._id}</td>}
                      {selectedFixedFields.trackName && <td className="py-2.5 px-4 text-sm text-gray-600">{getTrackName(team.assignedTrack) || '-'}</td>}
                      {selectedFixedFields.problemStatement && <td className="py-2.5 px-4 text-sm text-gray-600 max-w-[200px] truncate" title={getProblemStatementName(team.assignedProblemStatement, true)}>{getProblemStatementName(team.assignedProblemStatement, true) || '-'}</td>}
                      {selectedFixedFields.members && <td className="py-2.5 px-4 text-sm text-gray-600">{team.members?.length || 0}</td>}
                      {selectedFixedFields.teamLeader && <td className="py-2.5 px-4 text-sm text-gray-600">{team.leaderEmail || '-'}</td>}
                      {selectedFixedFields.institute && <td className="py-2.5 px-4 text-sm text-gray-600 max-w-[150px] truncate">{team.members?.[0]?.organisation || '-'}</td>}
                      {selectedFixedFields.finalResult && <td className="py-2.5 px-4 text-sm font-bold text-primary-700">{team.status || '-'}</td>}
                      {selectedFixedFields.progressRemarks && <td className="py-2.5 px-4 text-xs text-gray-600 max-w-[200px] truncate" title={team.progressRemarks}>{includeMarks ? (team.progressRemarks || '-') : ''}</td>}
                      {selectedEvent.criteria.filter(c => selectedCriteria[c.name]).map((c, i) => (
                        <td key={i} className="py-2.5 px-4 text-sm text-gray-600 border-l border-gray-100">
                          {includeMarks ? (team.criteriaScores?.[c.name] ?? '-') : ''}
                        </td>
                      ))}
                      {showTotal && (
                        <td className="py-2.5 px-4 text-sm font-bold text-primary-700 bg-primary-50/30 border-l border-primary-100">
                          {includeMarks ? team.calculatedTotalScore : ''}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
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
