
import React, { useState, useEffect } from 'react';
import { generateSOW } from '../services/geminiService';
import { SOWRow, LessonSlot, SchoolCalendar, SavedSOW } from '../types';

interface SOWGeneratorProps {
  timetableSlots: LessonSlot[];
  knowledgeContext?: string;
}

const SOWGenerator: React.FC<SOWGeneratorProps> = ({ timetableSlots, knowledgeContext }) => {
  const [loading, setLoading] = useState(false);
  const [sow, setSow] = useState<SOWRow[]>([]);
  const [history, setHistory] = useState<SavedSOW[]>([]);
  
  const [formData, setFormData] = useState({
    subject: 'Integrated Science',
    grade: '8',
    term: 2,
    school: '',
    year: '2025'
  });

  const [calendar, setCalendar] = useState<SchoolCalendar>({
    term: 2,
    startDate: '2025-05-05',
    endDate: '2025-08-01',
    halfTermStart: '2025-06-16',
    halfTermEnd: '2025-06-20'
  });

  useEffect(() => {
    const saved = localStorage.getItem('eduplan_sow_history');
    if (saved) setHistory(JSON.parse(saved));
    
    const profile = localStorage.getItem('eduplan_profile');
    if (profile) {
      const p = JSON.parse(profile);
      setFormData(prev => ({ ...prev, school: p.school }));
    }
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const relevantSlots = timetableSlots.filter(
        s => s.subject.toLowerCase().includes(formData.subject.toLowerCase())
      );
      const estimatedTotalLessons = 60; // Standard term estimate
      const result = await generateSOW(formData.subject, formData.grade, formData.term, estimatedTotalLessons, knowledgeContext);
      
      let finalRows: SOWRow[] = [];
      let currentDate = new Date(calendar.startDate);
      let sowIndex = 0;

      // Simple date attribution (ignores weekends/holidays for this logic, focus on sequence)
      while (currentDate <= new Date(calendar.endDate) && sowIndex < result.length) {
        finalRows.push({
          ...result[sowIndex],
          date: currentDate.toLocaleDateString('en-GB')
        });
        sowIndex++;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      setSow(finalRows);
    } catch (err) {
      alert("Failed to generate SOW.");
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = () => {
    if (sow.length === 0) return;
    const newEntry: SavedSOW = {
      id: Date.now().toString(),
      dateCreated: new Date().toLocaleDateString(),
      subject: formData.subject,
      grade: formData.grade,
      term: formData.term,
      data: sow
    };
    const updated = [newEntry, ...history];
    setHistory(updated);
    localStorage.setItem('eduplan_sow_history', JSON.stringify(updated));
    alert("Saved to SOW Library!");
  };

  const downloadCSV = () => {
    const headers = ["Week", "Lesson", "Strand", "Sub-strand", "Outcomes", "Experiences", "Inquiry", "Resources", "Assessment", "Reflection"];
    const rows = sow.map(r => [r.week, r.lesson, r.strand, r.subStrand, `"${r.learningOutcomes}"`, `"${r.learningExperiences}"`, `"${r.keyInquiryQuestion}"`, `"${r.resources}"`, `"${r.assessment}"`, ""]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SOW_${formData.subject}_G${formData.grade}.csv`;
    link.click();
  };

  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 print:hidden">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-file-invoice text-indigo-500"></i>
          SOW Generation Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Subject</label>
            <input className="w-full border p-2.5 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Subject" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Grade</label>
            <input className="w-full border p-2.5 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Grade" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Term</label>
            <input className="w-full border p-2.5 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" type="number" value={formData.term} onChange={e => setFormData({...formData, term: parseInt(e.target.value)})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Year</label>
            <input className="w-full border p-2.5 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Year" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleGenerate} 
              disabled={loading} 
              className="w-full bg-indigo-600 text-white font-bold h-[42px] rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
              Generate
            </button>
          </div>
        </div>
      </div>

      {sow.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-12">
          {/* Header Metadata Section - Modern Look */}
          <div className="p-8 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-xl font-black text-indigo-900 uppercase tracking-tight">
                {formData.year} Rationalized CBC {formData.subject}
              </h1>
              <p className="text-sm text-slate-500 font-medium">Schemes of Work - Grade {formData.grade} (Term {formData.term})</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <p>School</p>
                <p className="text-indigo-600 truncate max-w-[120px]">{formData.school || 'Not Set'}</p>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <p>Grade</p>
                <p className="text-indigo-600">{formData.grade}</p>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <p>Term</p>
                <p className="text-indigo-600">{formData.term}</p>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <p>Year</p>
                <p className="text-indigo-600">{formData.year}</p>
              </div>
            </div>
          </div>

          {/* Table Content Section */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">
                  <th className="p-4 border-r border-slate-100 w-12">Wk</th>
                  <th className="p-4 border-r border-slate-100 w-12">Lsn</th>
                  <th className="p-4 border-r border-slate-100">Strand</th>
                  <th className="p-4 border-r border-slate-100">Sub-strand</th>
                  <th className="p-4 border-r border-slate-100 min-w-[200px]">Specific-Learning outcomes</th>
                  <th className="p-4 border-r border-slate-100 min-w-[200px]">Learning Experience</th>
                  <th className="p-4 border-r border-slate-100">Inquiry Question(S)</th>
                  <th className="p-4 border-r border-slate-100">Resources</th>
                  <th className="p-4 border-r border-slate-100">Assessment</th>
                  <th className="p-4">Reflection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sow.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-center font-bold text-indigo-600 bg-indigo-50/30 border-r border-slate-100">{r.week}</td>
                    <td className="p-4 text-center text-slate-400 border-r border-slate-100">{r.lesson}</td>
                    <td className="p-4 font-semibold text-slate-700 border-r border-slate-100">{r.strand}</td>
                    <td className="p-4 text-slate-500 border-r border-slate-100">{r.subStrand}</td>
                    <td className="p-4 whitespace-pre-wrap leading-relaxed border-r border-slate-100">{r.learningOutcomes}</td>
                    <td className="p-4 whitespace-pre-wrap leading-relaxed border-r border-slate-100 italic text-slate-600">{r.learningExperiences}</td>
                    <td className="p-4 text-indigo-700 font-medium border-r border-slate-100">{r.keyInquiryQuestion}</td>
                    <td className="p-4 text-slate-500 border-r border-slate-100">{r.resources}</td>
                    <td className="p-4 border-r border-slate-100">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[9px] font-bold text-slate-600">{r.assessment}</span>
                    </td>
                    <td className="p-4 bg-slate-50/30"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 print:hidden">
            <button onClick={saveToHistory} className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-6 py-2 rounded-xl font-bold hover:bg-emerald-100 transition">
              <i className="fas fa-save mr-2"></i> Save to Records
            </button>
            <button onClick={downloadCSV} className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-6 py-2 rounded-xl font-bold hover:bg-indigo-100 transition">
              <i className="fas fa-file-excel mr-2"></i> Export Excel (CSV)
            </button>
            <button onClick={() => window.print()} className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
              <i className="fas fa-print mr-2"></i> Print to PDF
            </button>
          </div>
        </div>
      )}

      {/* Modern Library Section */}
      <div className="mt-8 print:hidden">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-archive text-indigo-500"></i>
          Scheme Library
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {history.length > 0 ? history.map(h => (
            <div key={h.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition group">
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-slate-800">{h.subject}</p>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">Term {h.term}</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Grade {h.grade} • {h.dateCreated}</p>
              <button 
                onClick={() => setSow(h.data)} 
                className="w-full bg-slate-50 text-slate-600 py-2 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition"
              >
                View Records
              </button>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
              <i className="fas fa-folder-open text-4xl mb-3 opacity-20"></i>
              <p className="text-sm font-medium">No saved schemes yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SOWGenerator;
