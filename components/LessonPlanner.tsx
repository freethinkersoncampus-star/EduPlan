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
  const [libraryTab, setLibraryTab] = useState<'plans' | 'notes'>('plans');
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
    setSavedPlans([entry, ...savedPlans]); alert("Plan Saved.");
  };

  return (
    <div className="p-4 md:p-8 pb-24">
      <div className="flex justify-between items-center mb-10 print:hidden">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Lesson Studio</h2>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button onClick={() => setView('editor')} className={`px-6 py-2 rounded-xl font-black text-[10px] tracking-widest ${view === 'editor' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500'}`}>BUILDER</button>
          <button onClick={() => setView('library')} className={`px-6 py-2 rounded-xl font-black text-[10px] tracking-widest ${view === 'library' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500'}`}>ARCHIVE</button>
        </div>
      </div>

      {view === 'editor' && (
        <div className="space-y-8">
           <div className="bg-white p-8 rounded-[2rem] border border-slate-200 print:hidden shadow-sm">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Learning Area</label>
                    <select className="w-full border-2 border-slate-50 p-4 rounded-xl bg-slate-50 font-black text-[10px] uppercase" value={`${input.subject}|${input.grade}`} onChange={e => { const [s,g] = e.target.value.split('|'); setInput({...input, subject: s, grade: g}); }}>
                      <option value="|">-- SELECT --</option>
                      {userProfile.subjects.map(p => <option key={p.id} value={`${p.subject}|${p.grade}`}>{p.subject} ({p.grade})</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Strand</label>
                    <input className="w-full border-2 border-slate-50 p-4 rounded-xl bg-slate-50 text-[10px] font-black uppercase" value={input.strand} onChange={e => setInput({...input, strand: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Sub-Strand</label>
                    <input className="w-full border-2 border-slate-50 p-4 rounded-xl bg-slate-50 text-[10px] font-black uppercase" value={input.subStrand} onChange={e => setInput({...input, subStrand: e.target.value})} />
                </div>
             </div>
             <div className="flex gap-4">
                <button onClick={() => handleGeneratePlan()} disabled={loadingPlan} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest">{loadingPlan ? 'Architecting...' : 'Generate CBE Lesson Plan'}</button>
                <button onClick={() => handleGenerateNotes()} disabled={loadingNotes} className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest">{loadingNotes ? 'Compiling...' : 'Generate Notes'}</button>
             </div>
           </div>

           {(plan || notes || loadingPlan || loadingNotes) && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl relative min-h-[600px] print:border-black print:p-0">
                   {loadingPlan ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20">
                        <i className="fas fa-magic text-3xl text-indigo-600 animate-bounce mb-4"></i>
                        <p className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">Constructing CBE Plan...</p>
                     </div>
                   ) : plan ? (
                     <div className="animate-in fade-in duration-700">
                        <div className="flex justify-between border-b pb-4 mb-8 print:hidden">
                           <span className="text-[10px] font-black text-indigo-500 uppercase">CBE Rationalized Plan</span>
                           <div className="flex gap-2">
                              <button onClick={() => window.print()} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[9px] font-black"><i className="fas fa-print"></i></button>
                              <button onClick={saveCurrentPlan} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-[9px] font-black">SAVE</button>
                           </div>
                        </div>

                        <div className="text-center border-b-2 border-black pb-4 mb-6">
                           <h1 className="text-lg font-black uppercase underline">{plan.year || 2025} RATIONALIZED {(plan.learningArea || '').toUpperCase()} LESSON PLAN</h1>
                           <h2 className="text-xs font-black uppercase mt-1">TERM {plan.term || 'ONE'} — {plan.textbook || 'KICD APPROVED TEXT'}</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-[10px] font-bold border-b border-slate-100 pb-4 mb-6 text-black">
                           <p>STRAND: <span className="font-black uppercase">{plan.strand}</span></p>
                           <p>DATE: <span className="font-black uppercase">{plan.date || new Date().toLocaleDateString()}</span></p>
                           <p>SUB-STRAND: <span className="font-black uppercase">{plan.subStrand}</span></p>
                           <p>ROLL: <span className="font-black uppercase">{plan.roll || '-'}</span></p>
                        </div>

                        <div className="space-y-6 text-[11px] leading-tight text-black">
                           {/* CBE CORE ELEMENTS INTEGRATED AS TEXT */}
                           <div className="border border-black p-4 space-y-3">
                              <div><span className="font-black underline uppercase">CORE COMPETENCIES:</span> {(plan.coreCompetencies || []).join(', ')}</div>
                              <div><span className="font-black underline uppercase">VALUES:</span> {(plan.values || []).join(', ')}</div>
                              <div><span className="font-black underline uppercase">PCIs:</span> {(plan.pcis || []).join(', ')}</div>
                              <div><span className="font-black underline uppercase">KIQs:</span> {(plan.keyInquiryQuestions || []).join(' ')}</div>
                           </div>

                           <div>
                              <h4 className="font-black underline uppercase mb-2">Learning Outcomes:</h4>
                              <ul className="list-disc pl-5">{(plan.outcomes || []).map((o,i)=><li key={i}>{o}</li>)}</ul>
                           </div>

                           <div className="space-y-4">
                              <h4 className="font-black underline uppercase border-b border-black pb-1">Organization of Learning:</h4>
                              <div className="space-y-4">
                                 <div><span className="font-black uppercase">Introduction:</span> {(plan.introduction || []).join(' ')}</div>
                                 <div className="space-y-4">
                                    <span className="font-black uppercase block border-l-4 border-black pl-2">Lesson Development:</span>
                                    {(plan.lessonDevelopment || []).map((step, idx) => (
                                       <div key={idx} className="ml-4">
                                          <p className="font-black italic">Step {idx+1}: {step.title} ({step.duration})</p>
                                          <ul className="list-disc pl-5">{(step.content || []).map((c,si)=><li key={si}>{c}</li>)}</ul>
                                       </div>
                                    ))}
                                 </div>
                                 <div><span className="font-black uppercase">Conclusion:</span> {(plan.conclusion || []).join(' ')}</div>
                                 <div><span className="font-black uppercase italic underline">Teacher Self-Evaluation:</span> <span className="italic">{plan.teacherSelfEvaluation || '____________________'}</span></div>
                              </div>
                           </div>
                        </div>
                     </div>
                   ) : <div className="h-full flex items-center justify-center text-slate-200 uppercase font-black text-[10px]">Plan Preview</div>}
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl relative min-h-[600px] print:border-black print:p-0">
                   {loadingNotes ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20">
                        <i className="fas fa-feather text-3xl text-emerald-600 animate-pulse mb-4"></i>
                        <p className="text-[10px] font-black uppercase text-emerald-900 tracking-widest">Compiling Notes...</p>
                     </div>
                   ) : notes ? (
                     <div className="animate-in fade-in duration-700">
                        <div className="flex justify-between border-b pb-4 mb-8 print:hidden">
                           <span className="text-[10px] font-black text-emerald-500 uppercase">Subject Notes</span>
                           <button onClick={() => window.print()} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[9px] font-black"><i className="fas fa-print"></i></button>
                        </div>
                        <div className="prose prose-sm max-w-none text-black"><ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown></div>
                     </div>
                   ) : <div className="h-full flex items-center justify-center text-slate-200 uppercase font-black text-[10px]">Notes Preview</div>}
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default LessonPlanner;