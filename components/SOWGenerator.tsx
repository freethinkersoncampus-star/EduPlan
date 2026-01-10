
import React, { useState, useEffect, useMemo } from 'react';
import { generateSOW } from '../services/geminiService';
import { SOWRow, LessonSlot, SavedSOW } from '../types';

interface SOWGeneratorProps {
  timetableSlots: LessonSlot[];
  knowledgeContext?: string;
  persistedSow: SOWRow[];
  setPersistedSow: (sow: SOWRow[]) => void;
  persistedMeta: any;
  setPersistedMeta: (meta: any) => void;
  onPrefillPlanner: (data: any) => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SOWGenerator: React.FC<SOWGeneratorProps> = ({ 
  timetableSlots, 
  knowledgeContext, 
  persistedSow, 
  setPersistedSow, 
  persistedMeta, 
  setPersistedMeta,
  onPrefillPlanner
}) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<SavedSOW[]>([]);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState(persistedMeta);

  useEffect(() => {
    const saved = localStorage.getItem('eduplan_sow_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const calculateDateForLesson = (week: number, dayName?: string) => {
    if (!formData.termStart || !dayName) return '';
    const startDate = new Date(formData.termStart);
    const dayIndex = DAYS_OF_WEEK.indexOf(dayName);
    if (dayIndex === -1) return '';
    
    // Days from start (week - 1) * 7 + dayIndex
    const lessonDate = new Date(startDate);
    lessonDate.setDate(startDate.getDate() + ((week - 1) * 7) + dayIndex);
    return lessonDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const estimatedTotalLessons = 45;
      const result = await generateSOW(formData.subject, formData.grade, formData.term, estimatedTotalLessons, knowledgeContext);
      
      const enriched: SOWRow[] = [];
      
      (result || []).forEach((row) => {
        if (row.week === 6 && enriched.find(e => e.week === 6 && e.isBreak) === undefined) {
          enriched.push({
            week: 6,
            lesson: 0,
            date: `${formData.halfTermStart} to ${formData.halfTermEnd}`,
            strand: 'HALF TERM BREAK',
            subStrand: 'N/A',
            learningOutcomes: 'Rest and Recuperation',
            learningExperiences: 'Holiday Break',
            keyInquiryQuestion: '-',
            resources: '-',
            assessment: '-',
            reflection: '',
            isBreak: true
          });
        }
        
        enriched.push({
          ...row,
          isCompleted: false,
          selectedDay: 'Monday', // Default
          date: calculateDateForLesson(row.week >= 6 ? row.week + 1 : row.week, 'Monday'),
          week: row.week >= 6 ? row.week + 1 : row.week
        });
      });

      setPersistedSow(enriched);
      setPersistedMeta(formData);
    } catch (err) {
      alert("Failed to generate SOW.");
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (saved: SavedSOW) => {
    setPersistedSow(saved.data);
    const meta = {
      subject: saved.subject,
      grade: saved.grade,
      term: saved.term,
      termStart: saved.termStart || '',
      termEnd: saved.termEnd || '',
      halfTermStart: saved.halfTermStart || '',
      halfTermEnd: saved.halfTermEnd || '',
      year: '2025'
    };
    setFormData(meta);
    setPersistedMeta(meta);
    setShowLibrary(false);
  };

  const toggleComplete = (idx: number) => {
    const updated = [...persistedSow];
    updated[idx].isCompleted = !updated[idx].isCompleted;
    setPersistedSow(updated);
  };

  const handleEditRow = (idx: number, field: keyof SOWRow, value: any) => {
    const updated = [...persistedSow];
    const newRow = { ...updated[idx], [field]: value };
    
    // Recalculate date if day or week changed
    if (field === 'selectedDay' || field === 'week') {
      newRow.date = calculateDateForLesson(newRow.week, newRow.selectedDay);
    }
    
    updated[idx] = newRow;
    setPersistedSow(updated);
  };

  const filteredSow = useMemo(() => {
    if (!searchQuery) return persistedSow;
    return persistedSow.filter(r => 
      r.strand.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.subStrand.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [persistedSow, searchQuery]);

  const saveToHistory = () => {
    if (persistedSow.length === 0) return;
    const newEntry: SavedSOW = {
      id: Date.now().toString(),
      dateCreated: new Date().toLocaleDateString(),
      subject: formData.subject,
      grade: formData.grade,
      term: formData.term,
      termStart: formData.termStart,
      termEnd: formData.termEnd,
      halfTermStart: formData.halfTermStart,
      halfTermEnd: formData.halfTermEnd,
      data: persistedSow
    };
    const updated = [newEntry, ...(history || []).filter(h => h.subject !== formData.subject || h.grade !== formData.grade)];
    setHistory(updated);
    localStorage.setItem('eduplan_sow_history', JSON.stringify(updated));
    alert("Saved successfully!");
  };

  const progress = persistedSow.filter(r => !r.isBreak).length > 0 
    ? Math.round((persistedSow.filter(r => !r.isBreak && r.isCompleted).length / persistedSow.filter(r => !r.isBreak).length) * 100) 
    : 0;

  return (
    <div className="p-2 md:p-6 pb-20">
      <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 mb-4 md:mb-6 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-file-invoice text-indigo-500"></i>
            SOW Builder
          </h2>
          <button 
            onClick={() => setShowLibrary(!showLibrary)}
            className="w-full md:w-auto text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-3 md:py-2 rounded-xl hover:bg-indigo-100 transition"
          >
            <i className="fas fa-layer-group mr-2"></i>
            {showLibrary ? "Back to Editor" : "Scheme Library"}
          </button>
        </div>

        {showLibrary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
            {history.map(item => (
              <div key={item.id} className="p-4 border rounded-2xl bg-slate-50 hover:border-indigo-300 transition group">
                <div className="flex justify-between items-start mb-2">
                   <h4 className="font-bold text-slate-800">{item.subject}</h4>
                   <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-black">G{item.grade}</span>
                </div>
                <p className="text-[10px] text-slate-400 uppercase font-black">Term {item.term} • {item.dateCreated}</p>
                <button 
                  onClick={() => loadFromHistory(item)}
                  className="mt-4 w-full bg-white border border-slate-200 py-3 md:py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition"
                >
                  Load Scheme
                </button>
              </div>
            ))}
            {history.length === 0 && <p className="col-span-full text-center py-10 text-slate-400 italic text-sm">No saved schemes found.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
            <div className="md:col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase">Subject</label>
              <input className="w-full border p-3 md:p-2.5 rounded-xl text-sm bg-slate-50 mt-1" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase">Grade</label>
              <input className="w-full border p-3 md:p-2.5 rounded-xl text-sm bg-slate-50 mt-1" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} />
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase">Term</label>
              <select className="w-full border p-3 md:p-2.5 rounded-xl text-sm bg-slate-50 mt-1" value={formData.term} onChange={e => setFormData({...formData, term: parseInt(e.target.value)})}>
                <option value={1}>Term 1</option>
                <option value={2}>Term 2</option>
                <option value={3}>Term 3</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 md:col-span-1">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Term Start</label>
                <input type="date" className="w-full border p-3 md:p-2 rounded-xl text-xs bg-slate-50 mt-1" value={formData.termStart} onChange={e => setFormData({...formData, termStart: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Term End</label>
                <input type="date" className="w-full border p-3 md:p-2 rounded-xl text-xs bg-slate-50 mt-1" value={formData.termEnd} onChange={e => setFormData({...formData, termEnd: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 md:col-span-2">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Half Term Start</label>
                <input type="date" className="w-full border p-3 md:p-2.5 rounded-xl text-sm bg-slate-50 mt-1" value={formData.halfTermStart} onChange={e => setFormData({...formData, halfTermStart: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Half Term End</label>
                <input type="date" className="w-full border p-3 md:p-2.5 rounded-xl text-sm bg-slate-50 mt-1" value={formData.halfTermEnd} onChange={e => setFormData({...formData, halfTermEnd: e.target.value})} />
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end items-end">
              <button 
                onClick={handleGenerate} 
                disabled={loading} 
                className="bg-indigo-600 text-white font-bold px-8 py-4 md:py-3 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg w-full"
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                Generate Rationalized Scheme
              </button>
            </div>
          </div>
        )}
      </div>

      {!showLibrary && persistedSow.length > 0 && (
        <div className="space-y-4">
          <div className="bg-indigo-900 p-4 md:p-6 rounded-2xl md:rounded-3xl text-white flex flex-col md:flex-row justify-between items-start md:items-center print:hidden shadow-xl gap-4">
             <div className="flex-1 w-full">
                <h3 className="text-lg md:text-xl font-black uppercase">{formData.subject} - Grade {formData.grade}</h3>
                <p className="text-[10px] md:text-xs text-indigo-300">Term {formData.term} ({formData.termStart} to {formData.termEnd})</p>
                
                <div className="w-full max-w-md mt-4">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-[8px] md:text-[10px] font-black uppercase text-indigo-400 tracking-widest">Coverage</span>
                    <span className="text-[8px] md:text-[10px] font-black uppercase text-white">{progress}%</span>
                  </div>
                  <div className="w-full bg-indigo-950/50 rounded-full h-1.5 md:h-2 overflow-hidden border border-indigo-800/50">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(52,211,153,0.3)]" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
             </div>
             <div className="flex flex-wrap gap-2 md:gap-3 mt-2 md:mt-0 w-full md:w-auto">
               <div className="relative flex-1 md:flex-none">
                 <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-[10px]"></i>
                 <input 
                   placeholder="SEARCH..." 
                   className="bg-white/10 border border-white/20 rounded-xl px-8 py-2.5 md:py-2 text-xs font-bold focus:bg-white/20 outline-none w-full md:w-48"
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                 />
               </div>
               <button onClick={saveToHistory} className="flex-1 md:flex-none bg-emerald-500 px-4 md:px-6 py-2.5 md:py-2 rounded-xl font-black text-[10px] md:text-xs hover:bg-emerald-600 transition shadow-lg">SAVE</button>
               <button onClick={() => window.print()} className="flex-1 md:flex-none bg-white/10 px-4 md:px-6 py-2.5 md:py-2 rounded-xl font-black text-[10px] md:text-xs hover:bg-white/20 transition border border-white/10">PRINT</button>
             </div>
          </div>

          <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-10">
             <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[9px] min-w-[800px] md:min-w-full">
                   <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                         <th className="p-3 border-r border-slate-100 print:hidden sticky left-0 z-20 bg-slate-50">Action</th>
                         <th className="p-3 border-r border-slate-100 text-left sticky left-[64px] z-20 bg-slate-50">Wk</th>
                         <th className="p-3 border-r border-slate-100 text-left sticky left-[96px] z-20 bg-slate-50">Lsn</th>
                         <th className="p-3 border-r border-slate-100 text-left">Day/Date</th>
                         <th className="p-3 border-r border-slate-100 text-left min-w-[120px]">Strand</th>
                         <th className="p-3 border-r border-slate-100 text-left min-w-[120px]">Sub-strand</th>
                         <th className="p-3 border-r border-slate-100 text-left min-w-[180px]">Specific Learning Outcomes</th>
                         <th className="p-3 border-r border-slate-100 text-left min-w-[180px]">Learning Experiences</th>
                         <th className="p-3 border-r border-slate-100 text-left min-w-[120px]">Key Inquiry Question(s)</th>
                         <th className="p-3 border-r border-slate-100 text-left min-w-[120px]">Learning Resources</th>
                         <th className="p-3 border-r border-slate-100 text-left min-w-[100px]">Assessment</th>
                         <th className="p-3 text-left min-w-[100px]">Reflection</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {filteredSow.map((r, i) => (
                        <tr key={i} className={`${r.isBreak ? 'bg-amber-50 font-bold' : ''} ${r.isCompleted ? 'bg-emerald-50/20' : ''}`}>
                           <td className="p-3 text-center border-r border-slate-100 print:hidden sticky left-0 z-10 bg-inherit shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                              <div className="flex flex-col gap-2 items-center">
                                {!r.isBreak && <input type="checkbox" checked={r.isCompleted} onChange={() => toggleComplete(i)} className="rounded border-slate-300 text-indigo-600 cursor-pointer w-4 h-4" />}
                                
                                <div className="flex gap-2">
                                  {editingRowIndex === i ? (
                                    <button onClick={() => setEditingRowIndex(null)} className="text-emerald-600 hover:text-emerald-700 p-1" title="Save">
                                      <i className="fas fa-check"></i>
                                    </button>
                                  ) : (
                                    <button onClick={() => setEditingRowIndex(i)} className="text-slate-400 hover:text-indigo-600 p-1" title="Edit Row">
                                      <i className="fas fa-edit"></i>
                                    </button>
                                  )}
                                  
                                  {!r.isBreak && (
                                    <>
                                      <button 
                                        onClick={() => onPrefillPlanner({ subject: formData.subject, grade: formData.grade, strand: r.strand, subStrand: r.subStrand, autoTrigger: 'plan' })}
                                        className="text-slate-400 hover:text-blue-600 p-1" 
                                        title="Generate Lesson Plan"
                                      >
                                        <i className="fas fa-book-open"></i>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                           </td>
                           <td className="p-3 font-bold text-indigo-900 border-r border-slate-100 sticky left-[64px] z-10 bg-inherit">
                             {editingRowIndex === i ? (
                               <input type="number" className="w-10 border rounded p-1" value={r.week} onChange={e => handleEditRow(i, 'week', parseInt(e.target.value))} />
                             ) : r.week}
                           </td>
                           <td className="p-3 text-slate-400 border-r border-slate-100 sticky left-[96px] z-10 bg-inherit shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                             {editingRowIndex === i ? (
                               <input type="number" className="w-10 border rounded p-1" value={r.lesson} onChange={e => handleEditRow(i, 'lesson', parseInt(e.target.value))} />
                             ) : r.lesson}
                           </td>
                           <td className="p-3 border-r border-slate-100">
                             <div className="flex flex-col gap-1">
                               {!r.isBreak && (editingRowIndex === i ? (
                                 <select 
                                   className="border rounded p-1 text-[8px]" 
                                   value={r.selectedDay} 
                                   onChange={e => handleEditRow(i, 'selectedDay', e.target.value)}
                                 >
                                   {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                                 </select>
                               ) : (
                                 <span className="font-bold text-slate-400 uppercase">{r.selectedDay}</span>
                               ))}
                               <span className="font-medium text-slate-700">{r.date}</span>
                             </div>
                           </td>
                           <td className="p-3 border-r border-slate-100 font-black uppercase text-slate-700">
                             {editingRowIndex === i ? (
                               <textarea className="w-full border rounded p-1 text-[9px]" rows={2} value={r.strand} onChange={e => handleEditRow(i, 'strand', e.target.value)} />
                             ) : r.strand}
                           </td>
                           <td className="p-3 border-r border-slate-100 font-medium text-slate-600">
                             {editingRowIndex === i ? (
                               <textarea className="w-full border rounded p-1 text-[9px]" rows={2} value={r.subStrand} onChange={e => handleEditRow(i, 'subStrand', e.target.value)} />
                             ) : r.subStrand}
                           </td>
                           <td className="p-3 border-r border-slate-100 leading-relaxed text-slate-600">
                             {editingRowIndex === i ? (
                               <textarea className="w-full border rounded p-1 text-[9px]" rows={4} value={r.learningOutcomes} onChange={e => handleEditRow(i, 'learningOutcomes', e.target.value)} />
                             ) : r.learningOutcomes}
                           </td>
                           <td className="p-3 border-r border-slate-100 leading-relaxed italic text-slate-500">
                             {editingRowIndex === i ? (
                               <textarea className="w-full border rounded p-1 text-[9px]" rows={4} value={r.learningExperiences} onChange={e => handleEditRow(i, 'learningExperiences', e.target.value)} />
                             ) : r.learningExperiences}
                           </td>
                           <td className="p-3 border-r border-slate-100 text-indigo-600 font-medium">
                             {editingRowIndex === i ? (
                               <textarea className="w-full border rounded p-1 text-[9px]" rows={2} value={r.keyInquiryQuestion} onChange={e => handleEditRow(i, 'keyInquiryQuestion', e.target.value)} />
                             ) : r.keyInquiryQuestion}
                           </td>
                           <td className="p-3 border-r border-slate-100 text-slate-500">
                             {editingRowIndex === i ? (
                               <textarea className="w-full border rounded p-1 text-[9px]" rows={2} value={r.resources} onChange={e => handleEditRow(i, 'resources', e.target.value)} />
                             ) : r.resources}
                           </td>
                           <td className="p-3 border-r border-slate-100 font-bold text-slate-600">
                             {editingRowIndex === i ? (
                               <textarea className="w-full border rounded p-1 text-[9px]" rows={2} value={r.assessment} onChange={e => handleEditRow(i, 'assessment', e.target.value)} />
                             ) : r.assessment}
                           </td>
                           <td className="p-3 bg-slate-50/30">
                             {editingRowIndex === i ? (
                               <textarea className="w-full border rounded p-1 text-[9px]" rows={2} value={r.reflection} onChange={e => handleEditRow(i, 'reflection', e.target.value)} />
                             ) : r.reflection}
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOWGenerator;
