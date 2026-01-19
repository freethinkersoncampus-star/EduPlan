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
    } catch (err: any) { alert("Generation Error: " + err.message); } 
    finally { setLoadingPlan(false); }
  };

  const handleGenerateNotes = async (subj = input.subject, grd = input.grade, subStrnd = input.subStrand) => {
    if (!subj || !subStrnd) return alert("Select subject and sub-strand.");
    setLoadingNotes(true); setNotes('');
    try {
      const result = await generateLessonNotes(subj, grd, subStrnd, "", knowledgeContext);
      setNotes(result);
    } catch (err: any) { alert("Notes Error: " + err.message); } 
    finally { setLoadingNotes(false); }
  };

  const saveCurrentPlan = () => {
    if (!plan) return;
    const entry: SavedLessonPlan = { id: Date.now().toString(), dateCreated: new Date().toLocaleDateString(), title: `${plan.learningArea} - ${plan.subStrand}`, subject: plan.learningArea, grade: plan.grade, plan: plan };
    setSavedPlans([entry, ...savedPlans]); alert("Plan Saved to Archive.");
  };

  const saveCurrentNotes = () => {
    if (!notes) return;
    const entry: SavedLessonNote = { id: Date.now().toString(), dateCreated: new Date().toLocaleDateString(), title: `${input.subject} - ${input.subStrand} Notes`, content: notes, subject: input.subject, grade: input.grade };
    setSavedNotes([entry, ...savedNotes]); alert("Notes Saved to Archive.");
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
                    <select className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 font-black text-[10px] uppercase" value={`${input.subject}|${input.grade}`} onChange={e => { const [s,g] = e.target.value.split('|'); setInput({...input, subject: s, grade: g}); }}>
                      <option value="|">-- SELECT --</option>
                      {userProfile.subjects.map(p => <option key={p.id} value={`${p.subject}|${p.grade}`}>{p.subject} ({p.grade})</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Learning Strand</label>
                    <input className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 text-[10px] font-black uppercase" value={input.strand} onChange={e => setInput({...input, strand: e.target.value})} placeholder="e.g. Geometry" />
                </div>
                <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Sub-Strand / Topic</label>
                    <input className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 text-[10px] font-black uppercase" value={input.subStrand} onChange={e => setInput({...input, subStrand: e.target.value})} placeholder="e.g. Area of Circles" />
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
                {/* Formal CBE Lesson Plan Document */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl relative min-h-[700px] print:border-black print:p-0 lesson-plan-card">
                   {loadingPlan ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 rounded-[3rem]">
                        <i className="fas fa-brain text-4xl text-indigo-600 animate-pulse mb-4"></i>
                        <p className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">Constructing Pedagogical Content...</p>
                     </div>
                   ) : plan ? (
                     <div className="animate-in fade-in duration-700">
                        <div className="flex justify-between border-b pb-4 mb-10 print:hidden">
                           <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Rationalized CBE Plan</span>
                           <div className="flex gap-3">
                              <button onClick={() => window.print()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"><i className="fas fa-print"></i></button>
                              <button onClick={saveCurrentPlan} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">SAVE ARCHIVE</button>
                           </div>
                        </div>

                        <div className="text-center border-b-2 border-black pb-4 mb-8">
                           <h1 className="text-xl font-black uppercase underline decoration-1 underline-offset-4 text-black">{plan.year || 2025} RATIONALIZED {(plan.learningArea || '').toUpperCase()} LESSON PLAN</h1>
                           <h2 className="text-sm font-black uppercase mt-2 text-black">TERM {plan.term || 'TWO'} — {plan.textbook || 'KICD APPROVED TEXT'}</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-[11px] font-bold border-b border-slate-100 pb-6 mb-8 text-black">
                           <p>STRAND: <span className="font-black uppercase">{plan.strand || '-'}</span></p>
                           <p>DATE: <span className="font-black uppercase">{plan.date || new Date().toLocaleDateString()}</span></p>
                           <p>SUB-STRAND: <span className="font-black uppercase">{plan.subStrand || '-'}</span></p>
                           <p>ROLL: <span className="font-black uppercase">{plan.roll || '-'}</span></p>
                        </div>

                        <div className="space-y-8 text-[12px] leading-relaxed text-black">
                           {/* CBE CORE ELEMENTS - INTEGRATED FORMALLY */}
                           <div className="border border-black p-6 space-y-4 rounded-xl bg-slate-50/30">
                              <div><span className="font-black underline uppercase text-[10px]">CORE COMPETENCIES:</span> {(plan.coreCompetencies || []).join(', ')}</div>
                              <div><span className="font-black underline uppercase text-[10px]">VALUES:</span> {(plan.values || []).join(', ')}</div>
                              <div><span className="font-black underline uppercase text-[10px]">PCIs:</span> {(plan.pcis || []).join(', ')}</div>
                              <div><span className="font-black underline uppercase text-[10px]">KIQs:</span> {(plan.keyInquiryQuestions || []).join(' ')}</div>
                           </div>

                           <div>
                              <h4 className="font-black underline uppercase mb-3 text-[11px]">Learning Outcomes:</h4>
                              <ul className="list-disc pl-6 space-y-1.5 font-medium">{(plan.outcomes || []).map((o,i)=><li key={i}>{o}</li>)}</ul>
                           </div>

                           <div className="space-y-6">
                              <h4 className="font-black underline uppercase border-b-2 border-black pb-2 text-[11px]">Organization of Learning:</h4>
                              <div className="space-y-6">
                                 <div className="p-4 border-l-4 border-slate-200">
                                    <span className="font-black uppercase block mb-1 text-[10px]">Introduction (5 mins)</span>
                                    <p>{(plan.introduction || []).join(' ')}</p>
                                 </div>
                                 <div className="space-y-6">
                                    <span className="font-black uppercase block border-l-4 border-indigo-600 pl-4 text-[10px]">Lesson Development (30 mins)</span>
                                    {(plan.lessonDevelopment || []).map((step, idx) => (
                                       <div key={idx} className="ml-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                          <p className="font-black italic mb-2 text-indigo-900">Step {idx+1}: {step.title} ({step.duration})</p>
                                          <ul className="list-disc pl-6 space-y-1">{(step.content || []).map((c,si)=><li key={si}>{c}</li>)}</ul>
                                       </div>
                                    ))}
                                 </div>
                                 <div className="p-4 border-l-4 border-slate-200">
                                    <span className="font-black uppercase block mb-1 text-[10px]">Conclusion (5 mins)</span>
                                    <p>{(plan.conclusion || []).join(' ')}</p>
                                 </div>
                                 <div className="pt-8 border-t border-slate-100">
                                    <span className="font-black uppercase italic underline text-[10px]">Teacher Self-Evaluation:</span>
                                    <p className="italic text-slate-500 mt-2">{plan.teacherSelfEvaluation || '________________________________________________________________________________________________________________________'}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                   ) : <div className="h-full flex flex-col items-center justify-center text-slate-200 uppercase font-black text-[10px] py-40"><i className="fas fa-file-signature text-6xl mb-4 opacity-5"></i><span>Plan Canvas</span></div>}
                </div>

                {/* Subject Study Notes */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl relative min-h-[700px] print:border-black print:p-0 notes-card">
                   {loadingNotes ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 rounded-[3rem]">
                        <i className="fas fa-feather text-4xl text-emerald-600 animate-pulse mb-4"></i>
                        <p className="text-[10px] font-black uppercase text-emerald-900 tracking-widest">Compiling Educational Resources...</p>
                     </div>
                   ) : notes ? (
                     <div className="animate-in fade-in duration-700">
                        <div className="flex justify-between border-b pb-4 mb-10 print:hidden">
                           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Comprehensive Notes</span>
                           <div className="flex gap-3">
                              <button onClick={() => window.print()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"><i className="fas fa-print"></i></button>
                              <button onClick={saveCurrentNotes} className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100">SAVE NOTES</button>
                           </div>
                        </div>
                        <div className="prose prose-sm max-w-none text-black prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter"><ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown></div>
                     </div>
                   ) : <div className="h-full flex flex-col items-center justify-center text-slate-200 uppercase font-black text-[10px] py-40"><i className="fas fa-feather-alt text-6xl mb-4 opacity-5"></i><span>Notes Canvas</span></div>}
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
                    <h3 className="text-xs font-black uppercase text-indigo-900 mb-6 tracking-widest flex items-center gap-3">
                      <i className="fas fa-book-open"></i> Saved Lesson Plans ({(savedPlans || []).length})
                    </h3>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                       {(savedPlans || []).map(p => (
                         <div key={p.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-indigo-300 cursor-pointer transition" onClick={() => { setPlan(p.plan); setView('editor'); }}>
                            <h4 className="font-black text-slate-800 uppercase text-[11px] mb-1">{p.title}</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.grade} • {p.dateCreated}</p>
                         </div>
                       ))}
                    </div>
                 </div>
                 <div>
                    <h3 className="text-xs font-black uppercase text-emerald-900 mb-6 tracking-widest flex items-center gap-3">
                      <i className="fas fa-file-alt"></i> Saved Study Notes ({(savedNotes || []).length})
                    </h3>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                       {(savedNotes || []).map(n => (
                         <div key={n.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:border-emerald-300 cursor-pointer transition" onClick={() => { setNotes(n.content); setInput({...input, subject: n.subject, grade: n.grade}); setView('editor'); }}>
                            <h4 className="font-black text-slate-800 uppercase text-[11px] mb-1">{n.title}</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{n.grade} • {n.dateCreated}</p>
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