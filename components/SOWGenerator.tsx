
import React, { useState, useEffect, useMemo } from 'react';
import { generateSOW } from '../services/geminiService';
import { exportSOWToDocx } from '../services/exportService';
import { SOWRow, LessonSlot, SavedSOW, UserProfile } from '../types';

interface SOWGeneratorProps {
  timetableSlots: LessonSlot[];
  knowledgeContext?: string;
  persistedSow: SOWRow[];
  setPersistedSow: (sow: SOWRow[]) => void;
  persistedMeta: any;
  setPersistedMeta: (meta: any) => void;
  onPrefillPlanner: (data: any) => void;
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
      const lessonInWeekIndex = (row.lesson - 1) % myLessons.length;
      const lessonDay = myLessons[lessonInWeekIndex];
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
      alert("No lessons found for this subject/grade in your timetable.");
      return;
    }

    setLoading(true);
    setLoadingStatus('Architecting Phase 1 (Weeks 1-6)...');
    try {
      // Phase 1: Weeks 1-6
      const result1 = await generateSOW(
        formData.subject, 
        formData.grade, 
        formData.term, 
        6 * lessonsPerWeek, 
        knowledgeContext,
        1
      );

      setLoadingStatus('Architecting Phase 2 (Weeks 7-12)...');
      // Phase 2: Weeks 7-12
      const result2 = await generateSOW(
        formData.subject, 
        formData.grade, 
        formData.term, 
        6 * lessonsPerWeek, 
        knowledgeContext,
        7
      );
      
      const rawResult = [...result1, ...result2];
      const enriched: SOWRow[] = [];
      
      rawResult.forEach((row) => {
        // Inject Half-Term Break logic after Week 6
        if (row.week === 7 && !enriched.find(e => e.isBreak)) {
          enriched.push({
            week: 7, lesson: 0, 
            strand: 'HALF TERM BREAK', subStrand: '-', 
            learningOutcomes: 'Recuperation & Academic Review', 
            teachingExperiences: 'Learner-led review', keyInquiryQuestions: '-', 
            learningResources: '-', assessmentMethods: '-', reflection: '-', isBreak: true
          });
        }
        enriched.push({ ...row, isCompleted: false, week: row.week >= 7 ? row.week + 1 : row.week });
      });

      const datedSow = calculateDatesFromTimetable(enriched);
      setPersistedSow(datedSow);
      setPersistedMeta(formData);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "AI Generation Error. Please try again.");
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
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">SOW Architect</h2>
            <p className="text-[9px] text-slate-400 font-bold tracking-[0.2em] mt-1.5 uppercase">KICD Rationalized Engine</p>
          </div>
          <button onClick={() => setShowLibrary(!showLibrary)} className="w-full sm:w-auto text-[10px] font-black text-indigo-600 bg-indigo-50 px-6 py-3 rounded-xl uppercase tracking-widest hover:bg-indigo-100 transition">
            {showLibrary ? "← CONFIG" : `SOW ARCHIVE (${history.length})`}
          </button>
        </div>

        {!showLibrary && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Teaching Area</label>
                <select className="w-full border-2 border-slate-50 p-3.5 rounded-xl bg-slate-50 font-black text-[11px] outline-none" 
                  value={`${formData.subject}|${formData.grade}`} 
                  onChange={e => {
                    const [s, g] = e.target.value.split('|');
                    setFormData({...formData, subject: s, grade: g});
                  }}
                >
                  <option value="|">-- Select Timetable Slot --</option>
                  {userProfile.subjects.map(p => <option key={p.id} value={`${p.subject}|${p.grade}`}>{p.subject} ({p.grade})</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Year</label>
                <input type="number" className="w-full border-2 border-slate-50 p-3.5 rounded-xl bg-slate-50 font-black text-[11px] outline-none" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Term</label>
                <select className="w-full border-2 border-slate-50 p-3.5 rounded-xl bg-slate-50 font-black text-[11px] outline-none" value={formData.term} onChange={e => setFormData({...formData, term: parseInt(e.target.value)})}>
                  <option value={1}>Term 1</option>
                  <option value={2}>Term 2</option>
                  <option value={3}>Term 3</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleGenerate} 
              disabled={loading || !formData.subject || lessonsPerWeek === 0} 
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition disabled:opacity-30 flex flex-col items-center justify-center"
            >
              <div className="flex items-center gap-3">
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-bolt"></i>}
                {loading ? "GENERATING SCHEMES..." : "CONSTRUCT KICD SCHEME"}
              </div>
              {loading && <span className="text-[8px] mt-1 opacity-70 tracking-widest">{loadingStatus}</span>}
            </button>
          </div>
        )}

        {showLibrary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {history.map(item => (
              <div key={item.id} className="group relative p-6 border-2 border-slate-50 rounded-2xl bg-slate-50/50 hover:border-indigo-300 hover:bg-white transition cursor-pointer" onClick={() => { setPersistedSow(item.data); setFormData(item as any); setShowLibrary(false); }}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase">{item.year} • TERM {item.term}</p>
                  <button onClick={(e) => handleDeleteHistory(item.id, e)} className="text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1">
                    <i className="fas fa-trash-alt text-[10px]"></i>
                  </button>
                </div>
                <h4 className="font-black text-slate-800 uppercase text-xs">{item.subject} ({item.grade})</h4>
              </div>
            ))}
          </div>
        )}
      </div>

      {!showLibrary && persistedSow.length > 0 && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 md:gap-8 print:hidden">
            <div className="flex-1 w-full">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Coverage</span>
                <span className="text-sm font-black text-indigo-600">{coverageStats.percentage}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${coverageStats.percentage}%` }}></div>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button onClick={handlePrint} className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest">PRINT</button>
              <button onClick={handleDownloadDocx} className="flex-1 md:flex-none bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest">DOCX</button>
              <button onClick={() => {
                const entry = { id: Date.now().toString(), dateCreated: new Date().toLocaleDateString(), ...formData, data: persistedSow };
                setHistory([entry, ...history]);
                alert("Cloud Archive Updated.");
              }} className="flex-1 md:flex-none bg-emerald-600 text-white px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest">SAVE</button>
            </div>
          </div>

          <div className="bg-white p-6 md:p-12 border-2 border-slate-100 shadow-2xl mb-32 print:p-0 print:border-none sow-card rounded-[2rem]">
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-lg md:text-2xl font-black uppercase underline decoration-2 underline-offset-8 mb-6 md:mb-10 leading-relaxed">
                {formData.year} {formData.subject} {formData.grade} SCHEMES OF WORK TERM {getTermString(formData.term)}
              </h1>
            </div>

            <div className="overflow-x-auto relative custom-scrollbar">
              <table className="w-full text-[9px] border-collapse border border-black print:text-[8px] min-w-[1000px] md:min-w-0">
                <thead className="bg-slate-50 print:bg-transparent">
                  <tr>
                    <th className="border border-black p-3 font-black uppercase w-20 text-center print:hidden sticky left-0 z-20 bg-slate-50">ACTIONS</th>
                    <th className="border border-black p-3 font-black uppercase w-10 text-center">Wk</th>
                    <th className="border border-black p-3 font-black uppercase w-10 text-center">Lsn</th>
                    <th className="border border-black p-3 font-black uppercase w-20 text-center">Date</th>
                    <th className="border border-black p-3 font-black uppercase w-32 text-left">Strand</th>
                    <th className="border border-black p-3 font-black uppercase w-32 text-left">Sub Strand</th>
                    <th className="border border-black p-3 font-black uppercase w-64 text-left">Specific Outcomes</th>
                    <th className="border border-black p-3 font-black uppercase w-64 text-left">Experiences</th>
                    <th className="border border-black p-3 font-black uppercase w-40 text-left">Resources</th>
                    <th className="border border-black p-3 font-black uppercase w-40 text-left">Assessment</th>
                    <th className="border border-black p-3 font-black uppercase w-20 text-left">Reflection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {persistedSow.map((r, i) => (
                    <tr key={i} className={`${r.isBreak ? 'bg-amber-50/40 italic' : ''} ${r.isCompleted ? 'bg-indigo-50/20' : ''}`}>
                      <td className="border border-black p-2 text-center print:hidden bg-white sticky left-0 z-10">
                        {!r.isBreak && (
                          <div className="flex items-center gap-1.5 justify-center">
                            <input type="checkbox" checked={r.isCompleted} onChange={() => toggleCompletion(i)} className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600" />
                            <button onClick={() => setEditingIndex(editingIndex === i ? null : i)} className="p-1.5 bg-slate-100 rounded text-[8px] font-black uppercase">{editingIndex === i ? 'SAVE' : 'EDIT'}</button>
                            <button onClick={() => onPrefillPlanner({ subject: formData.subject, grade: formData.grade, strand: r.strand, subStrand: r.subStrand, autoTrigger: 'plan' })} className="p-1.5 bg-indigo-600 text-white rounded"><i className="fas fa-magic text-[8px]"></i></button>
                          </div>
                        )}
                      </td>
                      <td className="border border-black p-2 text-center font-bold">{r.isBreak ? '-' : r.week}</td>
                      <td className="border border-black p-2 text-center">{r.isBreak ? '-' : r.lesson}</td>
                      <td className="border border-black p-2 text-center font-bold text-indigo-700">{r.date || '-'}</td>
                      <td className="border border-black p-2 font-black italic uppercase leading-tight">{editingIndex === i ? <textarea className="w-full bg-slate-100 p-1 text-[8px]" value={r.strand} onChange={e => handleEditRow(i, 'strand', e.target.value)} /> : r.strand}</td>
                      <td className="border border-black p-2 leading-tight">{editingIndex === i ? <textarea className="w-full bg-slate-100 p-1 text-[8px]" value={r.subStrand} onChange={e => handleEditRow(i, 'subStrand', e.target.value)} /> : r.subStrand}</td>
                      <td className="border border-black p-2 text-[8px]">{editingIndex === i ? <textarea className="w-full bg-slate-100 p-1 text-[8px]" value={r.learningOutcomes} onChange={e => handleEditRow(i, 'learningOutcomes', e.target.value)} /> : r.learningOutcomes}</td>
                      <td className="border border-black p-2 text-[8px]">{editingIndex === i ? <textarea className="w-full bg-slate-100 p-1 text-[8px]" value={r.teachingExperiences} onChange={e => handleEditRow(i, 'teachingExperiences', e.target.value)} /> : r.teachingExperiences}</td>
                      <td className="border border-black p-2 text-[8px] font-bold italic">{editingIndex === i ? <textarea className="w-full bg-slate-100 p-1 text-[8px]" value={r.learningResources} onChange={e => handleEditRow(i, 'learningResources', e.target.value)} /> : r.learningResources}</td>
                      <td className="border border-black p-2 text-[8px]">{editingIndex === i ? <textarea className="w-full bg-slate-100 p-1 text-[8px]" value={r.assessmentMethods} onChange={e => handleEditRow(i, 'assessmentMethods', e.target.value)} /> : r.assessmentMethods}</td>
                      <td className="border border-black p-2">{editingIndex === i ? <textarea className="w-full bg-slate-100 p-1 text-[8px]" value={r.reflection} onChange={e => handleEditRow(i, 'reflection', e.target.value)} /> : r.reflection}</td>
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
