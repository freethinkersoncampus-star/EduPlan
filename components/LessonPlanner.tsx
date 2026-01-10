
import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateLessonPlan, generateLessonNotes } from '../services/geminiService';
import { LessonPlan, SavedLessonPlan, SavedLessonNote, UserProfile } from '../types';

interface LessonPlannerProps {
  knowledgeContext?: string;
  prefill?: {
    subject: string;
    grade: string;
    strand: string;
    subStrand: string;
    autoTrigger: 'plan' | 'notes' | null;
  } | null;
  onClearPrefill: () => void;
}

const LessonPlanner: React.FC<LessonPlannerProps> = ({ knowledgeContext, prefill, onClearPrefill }) => {
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'editor' | 'library'>('editor');
  const [editorSubView, setEditorSubView] = useState<'form' | 'preview'>('form');
  const [libraryTab, setLibraryTab] = useState<'plans' | 'notes'>('plans');
  const [searchQuery, setSearchQuery] = useState('');

  const [savedPlans, setSavedPlans] = useState<SavedLessonPlan[]>(() => {
    const saved = localStorage.getItem('eduplan_plan_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedNotes, setSavedNotes] = useState<SavedLessonNote[]>(() => {
    const saved = localStorage.getItem('eduplan_note_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [input, setInput] = useState({
    subject: '', grade: '', strand: '', subStrand: '', week: '1', lessonNumber: '1', term: '2'
  });

  useEffect(() => {
    const savedProfile = localStorage.getItem('eduplan_profile');
    if (savedProfile) setProfile(JSON.parse(savedProfile));
  }, []);

  useEffect(() => {
    if (prefill) {
      setInput({
        ...input,
        subject: prefill.subject,
        grade: prefill.grade,
        strand: prefill.strand,
        subStrand: prefill.subStrand
      });
      setView('editor');
      if (prefill.autoTrigger === 'plan') {
        setTimeout(() => handleGeneratePlan(prefill.subject, prefill.grade, prefill.strand, prefill.subStrand), 100);
      } else if (prefill.autoTrigger === 'notes') {
        setTimeout(() => handleGenerateNotes(prefill.subject, prefill.grade, prefill.subStrand), 100);
      }
      onClearPrefill();
    }
  }, [prefill]);

  const handleGeneratePlan = async (subj = input.subject, grd = input.grade, strnd = input.strand, subStrnd = input.subStrand) => {
    if (!subj || !subStrnd) return alert("Fill in subject/topic");
    setLoadingPlan(true);
    try {
      const result = await generateLessonPlan(subj, grd, strnd, subStrnd, profile?.school || "KABIANGEK COMPREHENSIVE", knowledgeContext);
      setPlan(result);
      setEditorSubView('preview'); // Auto-flip on mobile
    } catch (err) { alert("Generation error"); } finally { setLoadingPlan(false); }
  };

  const handleGenerateNotes = async (subj = input.subject, grd = input.grade, subStrnd = input.subStrand) => {
    if (!subj || !subStrnd) return alert("Fill in subject/topic");
    setLoadingNotes(true);
    try {
      const result = await generateLessonNotes(subj, grd, subStrnd, "", knowledgeContext);
      setNotes(result);
      setEditorSubView('preview'); // Auto-flip on mobile
    } catch (err) { alert("Generation error"); } finally { setLoadingNotes(false); }
  };

  const savePlanToLibrary = () => {
    if (!plan) return;
    const newSavedPlan: SavedLessonPlan = {
      id: Date.now().toString(),
      dateCreated: new Date().toLocaleDateString(),
      title: `${plan.learningArea} - ${plan.subStrand}`,
      subject: plan.learningArea,
      grade: plan.grade,
      plan: plan
    };
    const updated = [newSavedPlan, ...savedPlans];
    setSavedPlans(updated);
    localStorage.setItem('eduplan_plan_history', JSON.stringify(updated));
    alert("Saved!");
  };

  const saveNoteToLibrary = () => {
    if (!notes) return;
    const newSavedNote: SavedLessonNote = {
      id: Date.now().toString(),
      dateCreated: new Date().toLocaleDateString(),
      title: `${input.subject} Notes - ${input.subStrand}`,
      content: notes,
      subject: input.subject,
      grade: input.grade
    };
    const updated = [newSavedNote, ...savedNotes];
    setSavedNotes(updated);
    localStorage.setItem('eduplan_note_history', JSON.stringify(updated));
    alert("Saved!");
  };

  const downloadNotesAsFile = (content: string, title: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const deleteSavedItem = (id: string, type: 'plans' | 'notes') => {
    if (!confirm("Delete this?")) return;
    if (type === 'plans') {
      const updated = savedPlans.filter(p => p.id !== id);
      setSavedPlans(updated);
      localStorage.setItem('eduplan_plan_history', JSON.stringify(updated));
    } else {
      const updated = savedNotes.filter(n => n.id !== id);
      setSavedNotes(updated);
      localStorage.setItem('eduplan_note_history', JSON.stringify(updated));
    }
  };

  const filteredLibrary = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (libraryTab === 'plans') {
      return savedPlans
        .filter(p => p.title.toLowerCase().includes(query) || p.grade.toLowerCase().includes(query))
        .sort((a, b) => a.grade.localeCompare(b.grade));
    } else {
      return savedNotes
        .filter(n => n.title.toLowerCase().includes(query) || n.grade.toLowerCase().includes(query))
        .sort((a, b) => a.grade.localeCompare(b.grade));
    }
  }, [savedPlans, savedNotes, libraryTab, searchQuery]);

  return (
    <div className="p-2 md:p-6 pb-20">
      {/* View Switcher Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 print:hidden gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-3">
            <i className={`fas ${view === 'editor' ? 'fa-magic' : 'fa-layer-group'} text-indigo-500`}></i>
            {view === 'editor' ? 'Lesson Architect' : 'Library'}
          </h2>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button 
            onClick={() => setView('editor')} 
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-[10px] md:text-sm transition ${view === 'editor' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500'}`}
          >
            CREATOR
          </button>
          <button 
            onClick={() => setView('library')} 
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold text-[10px] md:text-sm transition ${view === 'library' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500'}`}
          >
            COLLECTION
          </button>
        </div>
      </div>

      {view === 'editor' ? (
        <>
          {/* Mobile Form/Preview Toggle */}
          <div className="md:hidden flex bg-indigo-50 p-1 rounded-xl mb-4">
             <button onClick={() => setEditorSubView('form')} className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest ${editorSubView === 'form' ? 'bg-indigo-600 text-white' : 'text-indigo-400'}`}>FORM</button>
             <button onClick={() => setEditorSubView('preview')} className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest ${editorSubView === 'preview' ? 'bg-indigo-600 text-white' : 'text-indigo-400'}`}>VIEW</button>
          </div>

          <div className={`bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 mb-6 md:mb-8 print:hidden animate-in fade-in duration-300 ${editorSubView === 'preview' ? 'hidden md:block' : ''}`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-6">
              <input placeholder="Subject" className="border p-3 md:p-3 rounded-xl bg-slate-50 font-bold text-sm" value={input.subject} onChange={e => setInput({...input, subject: e.target.value})} />
              <input placeholder="Grade" className="border p-3 md:p-3 rounded-xl bg-slate-50 text-sm" value={input.grade} onChange={e => setInput({...input, grade: e.target.value})} />
              <input placeholder="Strand" className="border p-3 md:p-3 rounded-xl bg-slate-50 md:col-span-2 text-sm" value={input.strand} onChange={e => setInput({...input, strand: e.target.value})} />
              <input placeholder="Topic" className="border p-3 md:p-3 rounded-xl bg-slate-50 md:col-span-4 text-sm" value={input.subStrand} onChange={e => setInput({...input, subStrand: e.target.value})} />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => handleGeneratePlan()} disabled={loadingPlan} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-indigo-700 transition text-sm">
                {loadingPlan ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-pencil-ruler mr-2"></i>}
                PLAN
              </button>
              <button onClick={() => handleGenerateNotes()} disabled={loadingNotes} className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-emerald-700 transition text-sm">
                {loadingNotes ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-file-alt mr-2"></i>}
                NOTES
              </button>
            </div>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 ${editorSubView === 'form' ? 'hidden md:grid' : 'grid'}`}>
            {/* Lesson Plan Preview Card */}
            <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm min-h-[500px] lesson-plan-card relative">
              {plan ? (
                <div className="animate-in fade-in duration-500 font-serif overflow-x-auto">
                  <div className="flex justify-between items-center mb-6 print:hidden">
                    <span className="text-[10px] font-black uppercase text-indigo-400">PLAN</span>
                    <button onClick={savePlanToLibrary} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-black text-[9px] hover:bg-indigo-100 transition">SAVE</button>
                  </div>
                  
                  <div className="doc-header-grid mb-6">
                    <div className="space-y-1">
                      <div className="doc-header-item"><span>SCH:</span> <span className="font-bold underline truncate">{plan.school}</span></div>
                      <div className="doc-header-item"><span>L.A:</span> <span className="font-bold underline">{plan.learningArea}</span></div>
                      <div className="doc-header-item"><span>GRD:</span> <span className="font-bold underline">{plan.grade}</span></div>
                    </div>
                    <div className="space-y-1">
                      <div className="doc-header-item"><span>DATE:</span> <span className="font-bold underline">{plan.date}</span></div>
                      <div className="doc-header-item"><span>TIME:</span> <span className="font-bold underline">{plan.time}</span></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-[10px]">
                      <h4 className="font-black mb-0.5 uppercase">SUBSTRAND:</h4>
                      <p className="font-medium underline">{plan.subStrand}</p>
                    </div>
                    <div className="text-[10px]">
                      <h4 className="font-black mb-0.5 uppercase">KEY QUESTION:</h4>
                      <p className="italic">{plan.keyInquiryQuestion}</p>
                    </div>
                    
                    <div className="text-[10px]">
                      <h4 className="font-black mb-1 uppercase">LESSON STEPS:</h4>
                      <table className="w-full border border-black border-collapse">
                        <tbody>
                          {plan.lessonDevelopment.map((step, i) => (
                            <tr key={i} className="border-b border-black last:border-0">
                              <td className="p-1 border-r border-black w-12 font-bold">{step.duration}</td>
                              <td className="p-1 border-r border-black w-24 font-black uppercase">{step.title}</td>
                              <td className="p-1 leading-tight">{step.content}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end print:hidden">
                    <button onClick={() => window.print()} className="bg-black text-white px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg">
                      <i className="fas fa-print"></i> PRINT
                    </button>
                  </div>
                </div>
              ) : <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">No plan generated yet...</div>}
            </div>

            {/* Lesson Notes Preview Card */}
            <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col min-h-[500px]">
              {notes ? (
                <div className="animate-in fade-in duration-500 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-6 border-b pb-4 print:hidden">
                    <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Study Handout</h3>
                    <div className="flex gap-2">
                      <button onClick={saveNoteToLibrary} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-black text-[9px] hover:bg-indigo-100 transition">SAVE</button>
                      <button onClick={() => downloadNotesAsFile(notes, input.subStrand || 'Notes')} className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[9px] font-black hover:bg-black transition">D/L</button>
                    </div>
                  </div>
                  <div className="prose prose-sm prose-indigo max-w-none flex-1 overflow-x-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
                  </div>
                </div>
              ) : <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">No notes generated yet...</div>}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Library Controls */}
          <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setLibraryTab('plans')}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-black text-[10px] md:text-xs transition whitespace-nowrap ${libraryTab === 'plans' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-400'}`}
              >
                PLANS ({savedPlans.length})
              </button>
              <button 
                onClick={() => setLibraryTab('notes')}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-black text-[10px] md:text-xs transition whitespace-nowrap ${libraryTab === 'notes' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-400'}`}
              >
                NOTES ({savedNotes.length})
              </button>
            </div>
            <div className="relative w-full md:w-80">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <input 
                type="text" 
                placeholder="Search Grade or Topic..." 
                className="w-full pl-10 pr-4 py-3 md:py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Library Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-12">
            {filteredLibrary.map((item: any) => (
              <div key={item.id} className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-400 transition-all flex flex-col overflow-hidden">
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                      Grade {item.grade}
                    </span>
                    <button onClick={() => deleteSavedItem(item.id, libraryTab)} className="text-slate-200 hover:text-red-500 transition p-1">
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                  <h4 className="text-base font-black text-slate-800 leading-tight mb-2 line-clamp-2">{item.title}</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.dateCreated}</p>
                </div>
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <button 
                    onClick={() => { 
                      if (libraryTab === 'plans') setPlan(item.plan); 
                      else { setNotes(item.content); setInput({...input, subject: item.subject, grade: item.grade}); }
                      setEditorSubView('preview');
                      setView('editor'); 
                    }}
                    className="flex-1 bg-white border border-slate-200 py-2 rounded-lg text-[9px] font-black uppercase text-indigo-600 hover:bg-indigo-600 hover:text-white transition shadow-sm"
                  >
                    VIEW
                  </button>
                  {libraryTab === 'notes' && (
                    <button 
                      onClick={() => downloadNotesAsFile(item.content, item.title)}
                      className="bg-slate-800 text-white w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black transition"
                    >
                      <i className="fas fa-download text-[10px]"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlanner;
