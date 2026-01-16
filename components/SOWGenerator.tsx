
// Add React import for React.FC and React.MouseEvent types
import React, { useState, useEffect, useMemo } from 'react';
import { generateSOWChunk } from '../services/geminiService';
import { exportSOWToDocx } from '../services/exportService';
import { SOWRow, LessonSlot, SavedSOW, UserProfile } from '../types';

interface SOWGeneratorProps {
  timetableSlots: LessonSlot[];
  knowledgeContext?: string;
  persistedSow: SOWRow[];
  setPersistedSow: (sow: SOWRow[]) => void;
  persistedMeta: any;
  setPersistedMeta: (meta: any) => void;
  onPrefillPlanner: (data) => void;
  userProfile: UserProfile;
  history: SavedSOW[];
  setHistory: (history: SavedSOW[]) => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SOWGenerator: React.FC<SOWGeneratorProps> = ({ 
  timetableSlots, 
  knowledgeContext, 
  persistedSow, 
  setPersistedSow, 
  persistedMeta, 
  setPersistedMeta,
  onPrefillPlanner,
  userProfile,
  history,
  setHistory
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    subject: persistedMeta?.subject || '',
    grade: persistedMeta?.grade || '',
    term: persistedMeta?.term || 1,
    year: persistedMeta?.year || 2025,
    termStart: persistedMeta?.termStart || new Date().toISOString().split('T')[0],
    termEnd: persistedMeta?.termEnd || '',
    halfTermStart: persistedMeta?.halfTermStart || '',
    halfTermEnd: persistedMeta?.halfTermEnd || ''
  });

  useEffect(() => {
    if (persistedMeta) {
      setFormData(prev => ({ ...prev, ...persistedMeta }));
    }
  }, [persistedMeta]);

  const lessonsPerWeek = useMemo(() => {
    if (!formData.subject || !formData.grade) return 0;
    return timetableSlots.filter(s => 
      s.subject === formData.subject && 
      s.grade === formData.grade && 
      s.type === 'lesson'
    ).length;
  }, [timetableSlots, formData.subject, formData.grade]);

  const coverageStats = useMemo(() => {
    const validLessons = persistedSow.filter(r => !r.isBreak);
    const total = validLessons.length;
    const completed = validLessons.filter(r => r.isCompleted).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { percentage, total, completed };
  }, [persistedSow]);

  const getTermString = (term: number) => {
    switch(term) {
      case 1: return 'ONE';
      case 2: return 'TWO';
      case 3: return 'THREE';
      default: return 'ONE';
    }
  };

  const calculateDatesFromTimetable = (enrichedSow: SOWRow[]) => {
    if (!formData.termStart) return enrichedSow;
    const startDate = new Date(formData.termStart);
    const myLessons = timetableSlots
      .filter(s => s.subject === formData.subject && s.grade === formData.grade && s.type === 'lesson')
      .sort((a, b) => DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day));

    if (myLessons.length === 0) return enrichedSow;

    return enrichedSow.map(row => {
      if (row.isBreak) return row;
      
      const rawIdx = (row.lesson - 1) % myLessons.length;
      const lessonInWeekIndex = rawIdx < 0 ? rawIdx + myLessons.length : rawIdx;
      
      const lessonDay = myLessons[lessonInWeekIndex];
      
      if (!lessonDay || !lessonDay.day) return row;

      const date = new Date(startDate);
      const daysToAdd = (row.week - 1) * 7 + DAYS_OF_WEEK.indexOf(lessonDay.day);
      date.setDate(startDate.getDate() + daysToAdd);
      
      return {
        ...row,
        selectedDay: lessonDay.day,
        date: date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
      };
    });
  };

  const handleGenerate = async () => {
    if (!formData.subject) return alert("Select a subject first.");
    if (lessonsPerWeek === 0) {
      alert("Timetable Check: No assigned periods found for this subject.");
      return;
    }

    setLoading(true);
    setPersistedSow([]); 
    
    try {
      const chunks = [
        { start: 1, end: 4 },
        { start: 5, end: 8 },
        { start: 9, end: 12 }
      ];

      let allLessons: SOWRow[] = [];

      for (const chunk of chunks) {
        setLoadingStatus(`Architecting Weeks ${chunk.start}-${chunk.end}...`);
        
        let retries = 0;
        let chunkResult: SOWRow[] = [];
        
        while (retries < 2) {
          try {
            chunkResult = await generateSOWChunk(
              formData.subject,
              formData.grade,
              formData.term,
              chunk.start,
              chunk.end,
              lessonsPerWeek,
              knowledgeContext
            );
            break; 
          } catch (e) {
            retries++;
            if (retries === 2) throw e;
            setLoadingStatus(`Syncing Issue. Retrying Weeks ${chunk.start}-${chunk.end}...`);
            await new Promise(r => setTimeout(r, 2000));
          }
        }

        allLessons = [...allLessons, ...chunkResult];
        
        const intermediaryEnriched: SOWRow[] = allLessons.map(row => ({
          ...row,
          isCompleted: false,
          week: row.week >= 7 ? row.week + 1 : row.week 
        }));
        setPersistedSow(calculateDatesFromTimetable(intermediaryEnriched));
      }

      const finalSow: SOWRow[] = [];
      let breakInserted = false;
      
      allLessons.forEach((row) => {
        const targetWeek = row.week >= 7 ? row.week + 1 : row.week;

        if (targetWeek > 7 && !breakInserted) {
          finalSow.push({
            week: 7, 
            lesson: 0, 
            strand: 'HALF TERM BREAK', 
            subStrand: '-', 
            learningOutcomes: 'Academic Review & Assessment', 
            teachingExperiences: 'Learner reflection and remedial activities', 
            keyInquiryQuestions: '-', 
            learningResources: '-', 
            assessmentMethods: '-', 
            reflection: '-', 
            isBreak: true
          });
          breakInserted = true;
        }
        
        finalSow.push({ ...row, isCompleted: false, week: targetWeek });
      });

      const datedSow = calculateDatesFromTimetable(finalSow);
      setPersistedSow(datedSow);
      setPersistedMeta(formData);
      
    } catch (err: any) {
      console.error(err);
      alert("Vault Sync Interrupted: " + (err.message || "Please check your internet and try again."));
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  const toggleCompletion = (index: number) => {
    const updated = [...persistedSow];
    updated[index].isCompleted = !updated[index].isCompleted;
    setPersistedSow(updated);
  };

  const handleEditRow = (index: number, field: keyof SOWRow, value: string) => {
    const updated = [...persistedSow];
    updated[index] = { ...updated[index], [field]: value };
    setPersistedSow(updated);
  };

  const handlePrint = () => { setTimeout(() => { window.print(); }, 100); };
  const handleDownloadDocx = () => { exportSOWToDocx(persistedSow, formData, userProfile); };

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Permanently delete this saved Scheme of Work?")) {
      const newHistory = history.filter(item => item.id !== id);
      setHistory(newHistory);
    }
  };

  return (
    <div className="p-4 md:p-8 pb-32 overflow-x-hidden">
      <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-sm border border-slate-200 mb-8 print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none text-black">SOW Architect</h2>
            <p className="text-[9px] text-slate-400 font-bold tracking-[0.2em] mt-1.5 uppercase">KICD Rationalized Engine</p>
          </div>
          <button onClick={() => setShowLibrary(!showLibrary)} className="w-full sm:w-auto text-[10px] font-black text-indigo-600 bg-indigo-50 px-6 py-3 rounded-xl uppercase tracking-widest hover:bg-indigo-100 transition">
            {showLibrary ? "← CONFIG" : `SOW ARCHIVE (${history.length})`}
          </button>
        </div>

        {!showLibrary && (
          <div className="space-y-8 animate-in slide-in-from-top duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Workload Area</label>
                <select className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 font-black text-[11px] outline-none focus:border-indigo-500 transition" 
                  value={`${formData.subject}|${formData.grade}`} 
                  onChange={e => {
                    const [s, g] = e.target.value.split('|');
                    const updated = {...formData, subject: s, grade: g};
                    setFormData(updated);
                    setPersistedMeta(updated);
                  }}
                >
                  <option value="|">-- Select Subject & Grade --</option>
                  {userProfile.subjects.map(p => <option key={p.id} value={`${p.subject}|${p.grade}`}>{p.subject} — {p.grade}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Year</label>
                <input type="number" className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 font-black text-[11px] outline-none" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Term</label>
                <select className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 font-black text-[11px] outline-none" value={formData.term} onChange={e => setFormData({...formData, term: parseInt(e.target.value)})}>
                  <option value={1}>Term 1</option>
                  <option value={2}>Term 2</option>
                  <option value={3}>Term 3</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Term Start</label>
                <input type="date" className="w-full border-2 border-white p-3.5 rounded-xl bg-white font-black text-[10px]" value={formData.termStart} onChange={e => setFormData({...formData, termStart: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Half Term Start</label>
                <input type="date" className="w-full border-2 border-white p-3.5 rounded-xl bg-white font-black text-[10px]" value={formData.halfTermStart} onChange={e => setFormData({...formData, halfTermStart: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Half Term End</label>
                <input type="date" className="w-full border-2 border-white p-3.5 rounded-xl bg-white font-black text-[10px]" value={formData.halfTermEnd} onChange={e => setFormData({...formData, halfTermEnd: e.target.value})} />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Term End</label>
                <input type="date" className="w-full border-2 border-white p-3.5 rounded-xl bg-white font-black text-[10px]" value={formData.termEnd} onChange={e => setFormData({...formData, termEnd: e.target.value})} />
              </div>
            </div>

            <button onClick={handleGenerate} disabled={loading || !formData.subject || lessonsPerWeek === 0} className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-700 transition disabled:opacity-30">
               {loading ? `ARCHITECTING... ${loadingStatus}` : "CONSTRUCT KICD SCHEME (SEQUENTIAL)"}
            </button>
          </div>
        )}

        {showLibrary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {history.map(item => (
              <div key={item.id} className="group relative p-8 border-2 border-slate-50 rounded-[2.5rem] bg-slate-50/50 hover:bg-white transition cursor-pointer" onClick={() => { setPersistedSow(item.data); setFormData(item as any); setPersistedMeta(item); setShowLibrary(false); }}>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.year} • TERM {item.term}</p>
                  <button onClick={(e) => handleDeleteHistory(item.id, e)} className="text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"><i className="fas fa-trash-alt text-[10px]"></i></button>
                </div>
                <h4 className="font-black text-slate-800 uppercase text-xs tracking-tight">{item.subject} ({item.grade})</h4>
              </div>
            ))}
            {history.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">No archived schemes.</div>}
          </div>
        )}
      </div>

      {!showLibrary && (persistedSow.length > 0 || loading) && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white p-4 md:p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 md:gap-8 print:hidden">
            <div className="flex-1 w-full">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                 {loading 
                   ? `Architecting Pipeline: ${persistedSow.length} Lessons Generated` 
                   : `Curriculum Coverage: ${coverageStats.percentage}% (${coverageStats.completed}/${coverageStats.total} Lessons Covered)`}
               </span>
               <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className={`h-full ${loading ? 'bg-indigo-400 animate-pulse' : 'bg-indigo-500'} transition-all duration-700`} 
                    style={{ 
                      width: `${loading 
                        ? Math.min(100, (persistedSow.length / (13 * lessonsPerWeek)) * 100) 
                        : coverageStats.percentage}%` 
                    }}
                  ></div>
               </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button onClick={handlePrint} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest">PRINT</button>
              <button onClick={handleDownloadDocx} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest">DOCX</button>
              <button onClick={() => {
                const entry = { id: Date.now().toString(), dateCreated: new Date().toLocaleDateString(), ...formData, data: persistedSow };
                setHistory([entry, ...history]);
                alert("Saved to Vault.");
              }} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest">SAVE</button>
            </div>
          </div>

          <div className="bg-white p-6 md:p-14 border-2 border-slate-100 shadow-2xl mb-32 sow-card rounded-[3rem] print:p-0 print:border-none">
            <div className="text-center mb-10">
              <h1 className="text-lg md:text-2xl font-black uppercase underline decoration-2 mb-4 leading-relaxed text-black">
                {formData.year} {formData.subject} {formData.grade} SCHEMES OF WORK
              </h1>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">TERM {getTermString(formData.term)} — 2025 RATIONALIZED</p>
            </div>

            <div className="overflow-x-auto relative custom-scrollbar">
              <table className="w-full text-[9px] border-collapse border border-black print:text-[8px] min-w-[1200px] md:min-w-0">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-black p-4 font-black uppercase w-20 print:hidden">TOOLS</th>
                    <th className="border border-black p-4 font-black uppercase w-10 text-center">Wk</th>
                    <th className="border border-black p-4 font-black uppercase w-10 text-center">Lsn</th>
                    <th className="border border-black p-4 font-black uppercase w-24 text-center">Date</th>
                    <th className="border border-black p-4 font-black uppercase w-40 text-left">Strand</th>
                    <th className="border border-black p-4 font-black uppercase w-40 text-left">Sub Strand</th>
                    <th className="border border-black p-4 font-black uppercase w-64 text-left">Outcomes</th>
                    <th className="border border-black p-4 font-black uppercase w-64 text-left">Experiences</th>
                    <th className="border border-black p-4 font-black uppercase w-44 text-left">Resources</th>
                    <th className="border border-black p-4 font-black uppercase w-44 text-left">Assessment</th>
                    <th className="border border-black p-4 font-black uppercase w-24 text-left">Refl.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {persistedSow.map((r, i) => (
                    <tr key={i} className={`${r.isBreak ? 'bg-amber-50/60 font-black italic' : ''} ${r.isCompleted ? 'bg-indigo-50/30' : ''}`}>
                      <td className="border border-black p-3 text-center print:hidden">
                        {!r.isBreak && (
                          <div className="flex items-center gap-2 justify-center">
                            <input type="checkbox" checked={r.isCompleted} onChange={() => toggleCompletion(i)} className="w-4 h-4 text-indigo-600" />
                            <button onClick={() => setEditingIndex(editingIndex === i ? null : i)} className="p-1.5 bg-slate-100 rounded text-[8px] font-black">{editingIndex === i ? 'SAVE' : 'EDIT'}</button>
                            <button onClick={() => onPrefillPlanner({ subject: formData.subject, grade: formData.grade, strand: r.strand, subStrand: r.subStrand, autoTrigger: 'plan' })} className="p-1.5 bg-indigo-600 text-white rounded"><i className="fas fa-magic text-[8px]"></i></button>
                          </div>
                        )}
                      </td>
                      <td className="border border-black p-3 text-center font-black">{r.isBreak ? '-' : r.week}</td>
                      <td className="border border-black p-3 text-center font-bold">{r.isBreak ? '-' : r.lesson}</td>
                      <td className="border border-black p-3 text-center font-black text-indigo-800">{r.date || '-'}</td>
                      <td className="border border-black p-3 font-medium">{editingIndex === i ? <textarea className="w-full text-[9px]" value={r.strand} onChange={e => handleEditRow(i, 'strand', e.target.value)} /> : (r.strand || '—')}</td>
                      <td className="border border-black p-3 font-medium">{editingIndex === i ? <textarea className="w-full text-[9px]" value={r.subStrand} onChange={e => handleEditRow(i, 'subStrand', e.target.value)} /> : (r.subStrand || '—')}</td>
                      <td className="border border-black p-3">{editingIndex === i ? <textarea className="w-full text-[9px]" value={r.learningOutcomes} onChange={e => handleEditRow(i, 'learningOutcomes', e.target.value)} /> : (r.learningOutcomes || '—')}</td>
                      <td className="border border-black p-3">{editingIndex === i ? <textarea className="w-full text-[9px]" value={r.teachingExperiences} onChange={e => handleEditRow(i, 'teachingExperiences', e.target.value)} /> : (r.teachingExperiences || '—')}</td>
                      <td className="border border-black p-3">{editingIndex === i ? <textarea className="w-full text-[9px]" value={r.learningResources} onChange={e => handleEditRow(i, 'learningResources', e.target.value)} /> : (r.learningResources || '—')}</td>
                      <td className="border border-black p-3">{editingIndex === i ? <textarea className="w-full text-[9px]" value={r.assessmentMethods} onChange={e => handleEditRow(i, 'assessmentMethods', e.target.value)} /> : (r.assessmentMethods || '—')}</td>
                      <td className="border border-black p-3">{editingIndex === i ? <textarea className="w-full text-[9px]" value={r.reflection} onChange={e => handleEditRow(i, 'reflection', e.target.value)} /> : (r.reflection || '—')}</td>
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
