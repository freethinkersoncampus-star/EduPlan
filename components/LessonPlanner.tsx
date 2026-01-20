import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateLessonPlan, generateLessonNotes } from '../services/geminiService';
import { exportLessonPlanToDocx, exportNotesToDocx } from '../services/exportService';
import { LessonPlan, SavedLessonPlan, SavedLessonNote, UserProfile } from '../types';

interface LessonPlannerProps {
  knowledgeContext?: string;
  prefill?: any;
  onClearPrefill: () => void;
  userProfile: UserProfile;
  savedPlans: SavedLessonPlan[];
  setSavedPlans: (plans: SavedLessonPlan[]) => void;
  savedNotes: SavedLessonNote[];
  setSavedNotes: (notes: SavedLessonNote[]) => void;
}

const LessonPlanner: React.FC<LessonPlannerProps> = ({ 
  knowledgeContext, 
  prefill, 
  onClearPrefill, 
  userProfile,
  savedPlans,
  setSavedPlans,
  savedNotes,
  setSavedNotes
}) => {
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [view, setView] = useState<'editor' | 'library'>('editor');
  const [input, setInput] = useState({ subject: '', grade: '', strand: '', subStrand: '' });

  useEffect(() => {
    if (prefill) {
      const newInput = { subject: prefill.subject || '', grade: prefill.grade || '', strand: prefill.strand || '', subStrand: prefill.subStrand || '' };
      setInput(newInput);
      setView('editor');
      if (prefill.autoTrigger === 'plan') handleGeneratePlan(newInput.subject, newInput.grade, newInput.strand, newInput.subStrand);
      onClearPrefill();
    }
  }, [prefill]);

  const handleGeneratePlan = async (subj = input.subject, grd = input.grade, strnd = input.strand, subStrnd = input.subStrand) => {
    if (!subj || !subStrnd) return alert("Select subject and sub-strand.");
    setLoadingPlan(true); setPlan(null);
    try {
      const result = await generateLessonPlan(subj, grd, strnd, subStrnd, userProfile.school || "CBE SCHOOL", knowledgeContext);
      setPlan(result);
    } catch (err: any) { 
      console.error("DeepSeek Plan Generation Failed:", err);
      alert("DeepSeek Service: " + err.message); 
    } 
    finally { setLoadingPlan(false); }
  };

  const handleGenerateNotes = async (subj = input.subject, grd = input.grade, subStrnd = input.subStrand) => {
    if (!subj || !subStrnd) return alert("Select subject and sub-strand.");
    setLoadingNotes(true); setNotes('');
    try {
      const result = await generateLessonNotes(subj, grd, subStrnd);
      setNotes(result);
    } catch (err: any) { 
      console.error("DeepSeek Notes Generation Failed:", err);
      alert("DeepSeek Service: " + err.message); 
    } 
    finally { setLoadingNotes(false); }
  };

  // Helper to safely access arrays and prevent .map() crashes
  const safeArray = (arr: any) => Array.isArray(arr) ? arr : [];

  const saveCurrentPlan = () => {
    if (!plan) return;
    // Prioritize input.subject if plan.learningArea is generic or missing
    const subjectName = (plan.learningArea && plan.learningArea !== '-' && plan.learningArea !== 'Lesson') 
      ? plan.learningArea 
      : input.subject;
      
    const entry: SavedLessonPlan = { 
      id: Date.now().toString(), 
      dateCreated: new Date().toLocaleDateString(), 
      title: `${subjectName} - ${plan.subStrand || 'Topic'}`, 
      subject: subjectName, 
      grade: plan.grade || input.grade, 
      plan: { ...plan, learningArea: subjectName } 
    };
    setSavedPlans([entry, ...savedPlans]); alert("Plan Saved to Archive.");
  };

  const saveCurrentNotes = () => {
    if (!notes) return;
    const entry: SavedLessonNote = { id: Date.now().toString(), dateCreated: new Date().toLocaleDateString(), title: `${input.subject} - ${input.subStrand} Notes`, content: notes, subject: input.subject, grade: input.grade };
    setSavedNotes([entry, ...savedNotes]); alert("Notes Saved to Archive.");
  };

  const handleDownloadPlanDoc = () => {
    if (!plan) return;
    exportLessonPlanToDocx(plan, userProfile);
  };

  const handleDownloadNotesDoc = () => {
    if (!notes) return;
    exportNotesToDocx(`${input.subject} - ${input.subStrand} Notes`, notes);
  };

  return (
    <div className="p-4 md:p-8 pb-24 font-inter">
      <div className="flex justify-between items-center mb-10 print:hidden">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Pedagogical Studio</h2>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button onClick={() => setView('editor')} className={`px-6 py-2 rounded-xl font-black text-[10px] tracking-widest ${view === 'editor' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500'}`}>BUILDER</button>
          <button onClick={() => setView('library')} className={`px-6 py-2 rounded-xl font-black text-[10px] tracking-widest ${view === 'library' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500'}`}>LIBRARY</button>
        </div>
      </div>

      {view === 'editor' && (
        <div className="space-y-8">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 print:hidden shadow-sm">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Workload Pair</label>
                    <select className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 font-black text-[10px] uppercase outline-none" value={`${input.subject}|${input.grade}`} onChange={e => { const [s,g] = e.target.value.split('|'); setInput({...input, subject: s, grade: g}); }}>
                      <option value="|">-- SELECT --</option>
                      {userProfile.subjects.map(p => <option key={p.id} value={`${p.subject}|${p.grade}`}>{p.subject} ({p.grade})</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Learning Strand</label>
                    <input className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 text-[10px] font-black uppercase outline-none" value={input.strand} onChange={e => setInput({...input, strand: e.target.value})} placeholder="e.g. Scientific Investigation" />
                </div>
                <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Sub-Strand / Topic</label>
                    <input className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 text-[10px] font-black uppercase outline-none" value={input.subStrand} onChange={e => setInput({...input, subStrand: e.target.value})} placeholder="e.g. Laboratory Safety" />
                </div>
             </div>
             <div className="flex gap-4">
                <button onClick={() => handleGeneratePlan()} disabled={loadingPlan || !input.subStrand} className="flex-1 bg-indigo-600 text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition disabled:opacity-30">
                  {loadingPlan ? <i className="fas fa-spinner fa-spin mr-3"></i> : <i className="fas fa-magic mr-3"></i>} 
                  {loadingPlan ? 'ARCHITECTING...' : 'GENERATE CBE LESSON PLAN'}
                </button>
                <button onClick={() => handleGenerateNotes()} disabled={loadingNotes || !input.subStrand} className="flex-1 bg-emerald-600 text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition disabled:opacity-30">
                  {loadingNotes ? <i className="fas fa-spinner fa-spin mr-3"></i> : <i className="fas fa-file-alt mr-3"></i>}
                  {loadingNotes ? 'COMPILING...' : 'GENERATE STUDY NOTES'}
                </button>
             </div>
           </div>

           {(plan || notes || loadingPlan || loadingNotes) && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 md:p-14 rounded-[3.5rem] border border-slate-100 shadow-2xl relative min-h-[900px] print:border-black print:p-8 lesson-plan-card">
                   {loadingPlan ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-20 rounded-[3.5rem]">
                        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-[11px] font-black uppercase text-indigo-900 tracking-[0.3em]">Constructing Professional Plan...</p>
                     </div>
                   ) : plan ? (
                     <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex flex-wrap gap-2 justify-between border-b pb-6 mb-10 print:hidden">
                           <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Rationalized CBE Plan</span>
                           <div className="flex flex-wrap gap-2">
                              <button onClick={() => window.print()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition hover:bg-black"><i className="fas fa-print mr-2"></i>PRINT</button>
                              <button onClick={handleDownloadPlanDoc} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition hover:bg-blue-700"><i className="fas fa-file-word mr-2"></i>DOCX</button>
                              <button onClick={saveCurrentPlan} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition">SAVE VAULT</button>
                           </div>
                        </div>

                        <div className="text-center border-b-2 border-black pb-6 mb-10">
                           <h1 className="text-2xl font-black uppercase underline underline-offset-8 text-black tracking-tight">{plan.year || 2026} RATIONALIZED {(plan.learningArea || input.subject || '').toUpperCase()} LESSON PLAN</h1>
                           <h2 className="text-sm font-black uppercase mt-3 text-black">TERM {plan.term || 'ONE'} — {plan.textbook || 'KICD APPROVED TEXT'}</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-x-16 gap-y-4 text-[12px] font-bold border-b-2 border-black pb-8 mb-10 text-black">
                           <p className="flex justify-between"><span>STRAND:</span> <span className="font-black uppercase">{plan.strand || '-'}</span></p>
                           <p className="flex justify-between"><span>DATE:</span> <span className="font-black uppercase">{plan.date || new Date().toLocaleDateString()}</span></p>
                           <p className="flex justify-between"><span>SUB-STRAND:</span> <span className="font-black uppercase">{plan.subStrand || '-'}</span></p>
                           <p className="flex justify-between"><span>ROLL:</span> <span className="font-black uppercase">{plan.roll || '-'}</span></p>
                        </div>

                        <div className="border-2 border-black p-8 space-y-5 rounded-2xl bg-slate-50/20 mb-10 text-black">
                           <p className="text-[13px] leading-relaxed"><span className="font-black underline uppercase text-[11px] mr-2">CORE COMPETENCIES:</span> {safeArray(plan.coreCompetencies).join(', ') || 'N/A'}</p>
                           <p className="text-[13px] leading-relaxed"><span className="font-black underline uppercase text-[11px] mr-2">VALUES:</span> {safeArray(plan.values).join(', ') || 'N/A'}</p>
                           <p className="text-[13px] leading-relaxed"><span className="font-black underline uppercase text-[11px] mr-2">PCIs:</span> {safeArray(plan.pcis).join(', ') || 'N/A'}</p>
                           <p className="text-[13px] leading-relaxed"><span className="font-black underline uppercase text-[11px] mr-2">KIQs:</span> <span className="italic">{safeArray(plan.keyInquiryQuestions).join(' ') || 'N/A'}</span></p>
                        </div>

                        <div className="space-y-10 text-black">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div>
                                 <h4 className="font-black underline uppercase mb-4 text-[12px]">Learning Outcomes:</h4>
                                 <ul className="list-disc pl-8 space-y-2 font-medium text-[13px]">{safeArray(plan.outcomes).map((o,i)=><li key={i}>{o}</li>)}</ul>
                              </div>
                              <div>
                                 <h4 className="font-black underline uppercase mb-4 text-[12px]">Learning Resources:</h4>
                                 <ul className="list-disc pl-8 space-y-2 font-medium text-[13px]">{safeArray(plan.learningResources).map((r,i)=><li key={i}>{r}</li>)}</ul>
                              </div>
                           </div>

                           <div className="space-y-10">
                              <h4 className="font-black underline uppercase border-b-2 border-black pb-2 text-[14px] tracking-tight">Organization of Learning:</h4>
                              
                              <div className="space-y-10">
                                 <div className="pl-6 border-l-4 border-slate-300">
                                    <h5 className="font-black uppercase mb-3 text-[12px]">Introduction (5 minutes)</h5>
                                    <p className="text-[13px] leading-relaxed">{safeArray(plan.introduction).join(' ') || 'Class begins with a review...'}</p>
                                 </div>

                                 <div className="space-y-10">
                                    <h5 className="font-black uppercase border-l-4 border-indigo-600 pl-6 text-[12px]">Lesson Development (30 minutes)</h5>
                                    {safeArray(plan.lessonDevelopment).length > 0 ? safeArray(plan.lessonDevelopment).map((step, idx) => (
                                       <div key={idx} className="ml-6 p-8 bg-slate-50/50 rounded-3xl border border-slate-100 shadow-sm">
                                          <p className="font-black italic mb-4 text-indigo-950 text-[13px]">Step {idx+1}: {step.title || 'Discussion'} ({step.duration || '5m'})</p>
                                          <ul className="list-disc pl-8 space-y-3 text-[13px] leading-relaxed">{safeArray(step.content).map((c,si)=><li key={si}>{c}</li>)}</ul>
                                       </div>
                                    )) : <p className="ml-6 text-[13px] italic text-slate-400">Lesson development steps were not generated. Please try again.</p>}
                                 </div>

                                 <div className="pl-6 border-l-4 border-slate-300">
                                    <h5 className="font-black uppercase mb-3 text-[12px]">Conclusion (5 minutes)</h5>
                                    <p className="text-[13px] leading-relaxed">{safeArray(plan.conclusion).join(' ') || 'Lesson ends with a summary...'}</p>
                                 </div>

                                 <div>
                                    <h4 className="font-black underline uppercase mb-4 text-[12px]">Extended Activities:</h4>
                                    <ul className="list-disc pl-8 space-y-3 text-[13px] leading-relaxed">{safeArray(plan.extendedActivities).map((ea,i)=><li key={i}>{ea}</li>)}</ul>
                                 </div>

                                 <div className="pt-10 border-t-2 border-black mt-16">
                                    <h5 className="font-black uppercase italic underline text-[11px] mb-4">Teacher Self-Evaluation:</h5>
                                    <div className="w-full h-12 border-b border-black border-dashed opacity-30 mb-4"></div>
                                    <div className="w-full h-12 border-b border-black border-dashed opacity-30"></div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                   ) : <div className="h-full flex flex-col items-center justify-center text-slate-200 uppercase font-black text-[10px] py-60"><i className="fas fa-file-signature text-7xl mb-6 opacity-10"></i><span>Plan Preview Canvas</span></div>}
                </div>

                <div className="bg-white p-10 md:p-14 rounded-[3.5rem] border border-slate-100 shadow-2xl relative min-h-[900px] print:border-black print:p-8 notes-card">
                   {loadingNotes ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-20 rounded-[3.5rem]">
                        <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-[11px] font-black uppercase text-emerald-900 tracking-[0.3em]">Generating Educational Content...</p>
                     </div>
                   ) : notes ? (
                     <div className="animate-in fade-in duration-700">
                        <div className="flex flex-wrap gap-2 justify-between border-b pb-6 mb-10 print:hidden">
                           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Comprehensive Study Notes</span>
                           <div className="flex flex-wrap gap-2">
                              <button onClick={() => window.print()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition hover:bg-black"><i className="fas fa-print mr-2"></i>PRINT</button>
                              <button onClick={handleDownloadNotesDoc} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition hover:bg-blue-700"><i className="fas fa-file-word mr-2"></i>DOCX</button>
                              <button onClick={saveCurrentNotes} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition">SAVE VAULT</button>
                           </div>
                        </div>
                        <div className="prose prose-sm md:prose-base max-w-none text-black prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-li:font-medium"><ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown></div>
                     </div>
                   ) : <div className="h-full flex flex-col items-center justify-center text-slate-200 uppercase font-black text-[10px] py-60"><i className="fas fa-feather-alt text-7xl mb-6 opacity-10"></i><span>Notes Preview Canvas</span></div>}
                </div>
             </div>
           )}
        </div>
      )}

      {view === 'library' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div>
                    <h3 className="text-xs font-black uppercase text-indigo-900 mb-8 tracking-widest flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center"><i className="fas fa-book-open"></i></div>
                      Saved Lesson Plans ({(savedPlans || []).length})
                    </h3>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                       {(savedPlans || []).map(p => (
                         <div key={p.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:border-indigo-400 hover:bg-white cursor-pointer transition-all shadow-sm" onClick={() => { setPlan(p.plan); setView('editor'); }}>
                            <h4 className="font-black text-slate-800 uppercase text-[12px] mb-2">{p.title}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.grade} &bull; {p.dateCreated}</p>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div>
                    <h3 className="text-xs font-black uppercase text-emerald-900 mb-8 tracking-widest flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><i className="fas fa-file-alt"></i></div>
                      Saved Study Notes ({(savedNotes || []).length})
                    </h3>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                       {(savedNotes || []).map(n => (
                         <div key={n.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:border-emerald-400 hover:bg-white cursor-pointer transition-all shadow-sm" onClick={() => { setNotes(n.content); setInput({...input, subject: n.subject, grade: n.grade}); setView('editor'); }}>
                            <h4 className="font-black text-slate-800 uppercase text-[12px] mb-2">{n.title}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{n.grade} &bull; {n.dateCreated}</p>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlanner;