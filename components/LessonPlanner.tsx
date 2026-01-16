
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
  
  const [input, setInput] = useState({
    subject: '', grade: '', strand: '', subStrand: ''
  });

  useEffect(() => {
    if (prefill) {
      const newInput = { 
        subject: prefill.subject || '', 
        grade: prefill.grade || '', 
        strand: prefill.strand || '', 
        subStrand: prefill.subStrand || '' 
      };
      setInput(newInput);
      setView('editor');
      
      if (prefill.autoTrigger === 'both') {
        handleGenerateBoth(newInput.subject, newInput.grade, newInput.strand, newInput.subStrand);
      } else if (prefill.autoTrigger === 'plan') {
        handleGeneratePlan(newInput.subject, newInput.grade, newInput.strand, newInput.subStrand);
      } else if (prefill.autoTrigger === 'notes') {
        handleGenerateNotes(newInput.subject, newInput.grade, newInput.subStrand);
      }
      
      onClearPrefill();
    }
  }, [prefill]);

  const handleGenerateBoth = async (subj: string, grd: string, strnd: string, subStrnd: string) => {
    handleGeneratePlan(subj, grd, strnd, subStrnd);
    handleGenerateNotes(subj, grd, subStrnd);
  };

  const handleGeneratePlan = async (subj = input.subject, grd = input.grade, strnd = input.strand, subStrnd = input.subStrand) => {
    if (!subj || !subStrnd) return alert("Please fill the subject and sub-strand topic.");
    setLoadingPlan(true);
    setPlan(null);
    try {
      const result = await generateLessonPlan(subj, grd, strnd, subStrnd, userProfile.school || "KICD MASTER", knowledgeContext);
      setPlan(result);
    } catch (err: any) { 
      console.error(err);
      if (err.message?.includes('429')) {
        alert("AI QUOTA EXCEEDED: You have reached the free tier limit. Please try again in 1 minute or upgrade your Gemini API key.");
      } else {
        alert("System Error: Failed to architect the lesson plan. Please refine your topic and try again.");
      }
    } finally { 
      setLoadingPlan(false); 
    }
  };

  const handleGenerateNotes = async (subj = input.subject, grd = input.grade, subStrnd = input.subStrand) => {
    if (!subj || !subStrnd) return alert("Please fill the subject and sub-strand topic.");
    setLoadingNotes(true);
    setNotes('');
    try {
      const result = await generateLessonNotes(subj, grd, subStrnd, "", knowledgeContext);
      setNotes(result);
    } catch (err: any) { 
      console.error(err);
      if (err.message?.includes('429')) {
        alert("AI QUOTA EXCEEDED: You have reached the free tier limit. Please wait a moment.");
      } else {
        alert("Failed to generate notes. Please check your internet connection.");
      }
    } finally { 
      setLoadingNotes(false); 
    }
  };

  const saveCurrentPlan = () => {
    if (!plan) return;
    const newEntry: SavedLessonPlan = {
      id: Date.now().toString(),
      dateCreated: new Date().toLocaleDateString(),
      title: `${(plan.learningArea || '').toUpperCase()} - ${(plan.subStrand || '').toUpperCase()}`,
      subject: plan.learningArea || '',
      grade: plan.grade || '',
      plan: plan
    };
    setSavedPlans([newEntry, ...savedPlans]);
    alert("Plan Added to Cloud Archive.");
  };

  const saveCurrentNotes = () => {
    if (!notes) return;
    const newEntry: SavedLessonNote = {
      id: Date.now().toString(),
      dateCreated: new Date().toLocaleDateString(),
      title: `${input.subject} - ${input.subStrand} Notes`,
      content: notes,
      subject: input.subject,
      grade: input.grade
    };
    setSavedNotes([newEntry, ...savedNotes]);
    alert("Notes Added to Cloud Archive.");
  };

  const isFormValid = input.subject !== '' && input.subStrand !== '';

  const handleDownloadPlanDocx = () => {
    if (plan) exportLessonPlanToDocx(plan, userProfile);
  };

  const handleDownloadNotesDocx = () => {
    if (notes) exportNotesToDocx(`${input.subject} - ${input.subStrand}`, notes);
  };

  const handleDeletePlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this lesson plan from archive?")) {
      setSavedPlans(savedPlans.filter(p => p.id !== id));
    }
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete these study notes from archive?")) {
      setSavedNotes(savedNotes.filter(n => n.id !== id));
    }
  };

  return (
    <div className="p-4 md:p-8 pb-24">
      <div className="flex justify-between items-center mb-10 print:hidden">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter text-black">Pedagogical Studio</h2>
        <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner">
          <button onClick={() => setView('editor')} className={`px-6 py-2 rounded-xl font-black text-[10px] tracking-widest transition-all ${view === 'editor' ? 'bg-white text-indigo-900 shadow-md' : 'text-slate-500'}`}>BUILDER</button>
          <button onClick={() => setView('library')} className={`px-6 py-2 rounded-xl font-black text-[10px] tracking-widest transition-all ${view === 'library' ? 'bg-white text-indigo-900 shadow-md' : 'text-slate-500'}`}>HISTORY</button>
        </div>
      </div>

      {view === 'editor' && (
        <div className="space-y-8">
           <div className={`bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 print:hidden animate-in slide-in-from-top-4 duration-500`}>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Workload Pair</label>
                    <select className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 font-black text-[10px] tracking-widest uppercase outline-none focus:border-indigo-500 transition" value={`${input.subject}|${input.grade}`} onChange={e => {
                    const [s, g] = e.target.value.split('|');
                    setInput({...input, subject: s, grade: g});
                    }}>
                    <option value="|">-- SELECT --</option>
                    {(userProfile.subjects || []).map(p => <option key={p.id} value={`${p.subject}|${p.grade}`}>{p.subject} ({p.grade})</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Learning Strand</label>
                    <input placeholder="e.g. Geometry" className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 transition" value={input.strand} onChange={e => setInput({...input, strand: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Sub-Strand / Specific Topic</label>
                    <input placeholder="e.g. Angles in Polygons" className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 transition" value={input.subStrand} onChange={e => setInput({...input, subStrand: e.target.value})} />
                </div>
             </div>
             <div className="flex flex-col sm:flex-row gap-4 border-t pt-8">
                <button 
                  onClick={() => handleGeneratePlan()} 
                  disabled={loadingPlan || !isFormValid} 
                  className="flex-1 bg-indigo-600 text-white font-black py-5 rounded-3xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition text-[10px] uppercase tracking-[0.2em] disabled:opacity-30"
                >
                  {loadingPlan ? <i className="fas fa-spinner fa-spin mr-3"></i> : <i className="fas fa-magic mr-3"></i>} 
                  {loadingPlan ? 'ARCHITECTING PLAN...' : 'GENERATE CBE LESSON PLAN'}
                </button>
                <button 
                  onClick={() => handleGenerateNotes()} 
                  disabled={loadingNotes || !isFormValid} 
                  className="flex-1 bg-emerald-600 text-white font-black py-5 rounded-3xl shadow-2xl shadow-emerald-100 hover:bg-emerald-700 transition text-[10px] uppercase tracking-[0.2em] disabled:opacity-30"
                >
                  {loadingNotes ? <i className="fas fa-spinner fa-spin mr-3"></i> : <i className="fas fa-file-alt mr-3"></i>} 
                  {loadingNotes ? 'COMPILING NOTES...' : 'GENERATE STUDY NOTES'}
                </button>
             </div>
           </div>

           {(plan || notes || loadingPlan || loadingNotes) && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl min-h-[600px] lesson-plan-card relative print:border-black print:p-0">
                   {loadingPlan ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-[2.5rem] print:hidden">
                        <i className="fas fa-magic text-4xl text-indigo-600 animate-bounce mb-4"></i>
                        <p className="font-black text-indigo-900 uppercase tracking-widest text-[10px]">Architecting Lesson Plan...</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2">Checking Quota & Reasoning...</p>
                     </div>
                   ) : plan ? (
                     <div className="animate-in fade-in duration-700">
                        <div className="flex flex-wrap justify-between items-center mb-10 pb-4 border-b print:hidden gap-3">
                           <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Rationalized Lesson Plan</span>
                           <div className="flex gap-2">
                             <button onClick={() => window.print()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition">
                                <i className="fas fa-print"></i>
                             </button>
                             <button onClick={handleDownloadPlanDocx} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
                                <i className="fas fa-file-word"></i>
                             </button>
                             <button onClick={saveCurrentPlan} className="bg-indigo-500 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition shadow-lg shadow-indigo-100">
                                <i className="fas fa-save mr-2"></i> Save
                             </button>
                           </div>
                        </div>
                        
                        <div className="text-center mb-12 border-b-2 border-black pb-4">
                           <h1 className="text-xl font-black uppercase tracking-tight underline underline-offset-4 mb-2 text-black">
                              {(plan.year || 2025)} RATIONALIZED {(plan.learningArea || '').toUpperCase()} LESSON PLANS
                           </h1>
                           <h2 className="text-lg font-black uppercase tracking-widest mb-4 text-black">
                              TERM {(plan.term || 'TWO')} - {(plan.textbook || 'SPARK INTEGRATED SCIENCE')}
                           </h2>
                           <div className="text-left font-black uppercase text-sm mt-6 text-black">
                              WEEK {(plan.week || 1)}: LESSON {(plan.lessonNumber || 1)}
                           </div>
                        </div>

                        <div className="mb-8">
                           <table className="w-full border-collapse border border-black text-[10px]">
                              <tbody>
                                 <tr>
                                    <td className="border border-black p-2 font-black w-32">SCHOOL</td>
                                    <td className="border border-black p-2 font-black w-24">LEVEL</td>
                                    <td className="border border-black p-2 font-black">LEARNING AREA</td>
                                    <td className="border border-black p-2 font-black w-24">DATE</td>
                                    <td className="border border-black p-2 font-black w-24">TIME</td>
                                    <td className="border border-black p-2 font-black w-24">ROLL</td>
                                 </tr>
                                 <tr>
                                    <td className="border border-black p-4 font-bold text-center text-black">{userProfile.school || '-'}</td>
                                    <td className="border border-black p-4 font-bold text-center text-black">{plan.grade || '-'}</td>
                                    <td className="border border-black p-4 font-bold text-center uppercase text-black">{plan.learningArea || '-'}</td>
                                    <td className="border border-black p-4 text-black"></td>
                                    <td className="border border-black p-4 text-black"></td>
                                    <td className="border border-black p-4 text-black"></td>
                                 </tr>
                              </tbody>
                           </table>
                        </div>

                        <div className="space-y-8 text-[11px] leading-relaxed text-black">
                           <div className="space-y-1">
                              <p className="font-black">Strand: <span className="font-bold text-slate-700 print:text-black">{plan.strand || '-'}</span></p>
                              <p className="font-black">Sub Strand: <span className="font-bold text-slate-700 print:text-black">{plan.subStrand || '-'}</span></p>
                           </div>

                           <div>
                              <h4 className="font-black uppercase tracking-widest mb-2 underline">Specific Learning Outcomes:</h4>
                              <p className="font-bold italic mb-2">By the end of the lesson, learners should be able to:</p>
                              <ul className="list-disc pl-5 space-y-1">
                                {(plan.outcomes || []).map((o, idx) => <li key={idx} className="font-medium text-slate-700 print:text-black">{o}</li>)}
                                {!(plan.outcomes?.length) && <li className="text-slate-300 italic">No outcomes defined.</li>}
                              </ul>
                           </div>

                           <div>
                              <h4 className="font-black uppercase tracking-widest mb-2 underline">Key Inquiry Questions:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                {(plan.keyInquiryQuestions || []).map((q, idx) => <li key={idx} className="font-medium">{q}</li>)}
                              </ul>
                           </div>

                           <div>
                              <h4 className="font-black uppercase tracking-widest mb-2 underline">Learning Resources:</h4>
                              <ul className="list-disc pl-5 space-y-1 font-medium italic">
                                {(plan.learningResources || []).map((r, i) => <li key={i}>{r}</li>)}
                              </ul>
                           </div>

                           <div>
                              <h4 className="font-black uppercase tracking-widest mb-4 border-b border-black pb-1">Organization of Learning:</h4>
                              
                              <div className="space-y-6">
                                 <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    <h5 className="font-black underline mb-2 uppercase text-[10px]">Introduction (5 minutes)</h5>
                                    <ul className="list-disc pl-5 space-y-1">
                                       {(plan.introduction || []).map((item, idx) => <li key={idx}>{item}</li>)}
                                    </ul>
                                 </div>

                                 <div className="space-y-6">
                                    <h5 className="font-black underline uppercase text-[10px]">Lesson Development (30 minutes)</h5>
                                    {(plan.lessonDevelopment || []).map((step, idx) => (
                                       <div key={idx} className="ml-2 p-4 border-l-2 border-indigo-100 bg-white shadow-sm rounded-r-2xl">
                                          <p className="font-black mb-1 text-indigo-700 uppercase text-[10px]">Step {idx + 1}: {step?.title || 'Procedure'} ({step?.duration || '10m'})</p>
                                          <ul className="list-disc pl-5 space-y-1">
                                             {(step?.content || []).map((item, subIdx) => <li key={subIdx}>{item}</li>)}
                                          </ul>
                                       </div>
                                    ))}
                                 </div>

                                 <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    <h5 className="font-black underline mb-2 uppercase text-[10px]">Conclusion (5 minutes)</h5>
                                    <ul className="list-disc pl-5 space-y-1">
                                       {(plan.conclusion || []).map((item, idx) => <li key={idx}>{item}</li>)}
                                    </ul>
                                 </div>
                              </div>
                           </div>

                           <div>
                              <h4 className="font-black uppercase tracking-widest mb-2 underline">Extended Activities:</h4>
                              <ul className="list-disc pl-5 space-y-1">
                                 {(plan.extendedActivities || []).map((item, idx) => <li key={idx} className="font-medium">{item}</li>)}
                              </ul>
                           </div>

                           <div className="pt-8 border-t border-black">
                              <h4 className="font-black uppercase text-[10px] mb-2">Teacher Self-Evaluation:</h4>
                              <div className="border-b border-dotted border-black h-12 w-full"></div>
                           </div>
                        </div>
                     </div>
                   ) : <div className="h-full flex flex-col items-center justify-center text-slate-200 py-32">
                         <i className="fas fa-file-invoice text-5xl mb-4 opacity-10"></i>
                         <p className="text-[10px] font-black uppercase tracking-widest">Plan Preview</p>
                       </div>}
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl min-h-[600px] relative notes-card print:border-black print:p-0">
                   {loadingNotes ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-[2.5rem] print:hidden">
                        <i className="fas fa-feather text-4xl text-emerald-600 animate-pulse mb-4"></i>
                        <p className="font-black text-emerald-900 uppercase tracking-widest text-[10px]">Compiling Subject Notes...</p>
                     </div>
                   ) : notes ? (
                     <div className="animate-in fade-in duration-700">
                        <div className="flex flex-wrap justify-between items-center mb-10 pb-4 border-b print:hidden gap-3">
                           <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Comprehensive Study Notes</span>
                           <div className="flex gap-2">
                             <button onClick={() => window.print()} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition">
                                <i className="fas fa-print"></i>
                             </button>
                             <button onClick={handleDownloadNotesDocx} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-100">
                                <i className="fas fa-file-word"></i>
                             </button>
                             <button onClick={saveCurrentNotes} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 border border-emerald-500">
                                <i className="fas fa-save mr-2"></i> Save
                             </button>
                           </div>
                        </div>
                        
                        <div className="mb-10 text-center print:block hidden">
                            <h1 className="text-xl font-black uppercase tracking-tighter mb-1 text-black">{input.subject} Notes</h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-black">{input.grade} • {input.subStrand}</p>
                            <hr className="mt-4 border-black" />
                        </div>

                        <div className="prose prose-sm max-w-none print:prose-black text-black">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
                        </div>
                     </div>
                   ) : <div className="h-full flex flex-col items-center justify-center text-slate-200 py-32">
                         <i className="fas fa-feather-alt text-5xl mb-4 opacity-10"></i>
                         <p className="text-[10px] font-black uppercase tracking-widest">Notes Preview</p>
                       </div>}
                </div>
             </div>
           )}
        </div>
      )}

      {view === 'library' && (
        <div className="space-y-8 animate-in fade-in duration-500 print:hidden">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex bg-slate-100 p-1 rounded-2xl w-fit mb-10 shadow-inner">
                 <button onClick={() => setLibraryTab('plans')} className={`px-10 py-3 rounded-xl font-black text-[10px] tracking-widest transition-all uppercase ${libraryTab === 'plans' ? 'bg-white text-indigo-900 shadow-md' : 'text-slate-500'}`}>Plans Archive ({(savedPlans || []).length})</button>
                 <button onClick={() => setLibraryTab('notes')} className={`px-10 py-3 rounded-xl font-black text-[10px] tracking-widest transition-all uppercase ${libraryTab === 'notes' ? 'bg-white text-indigo-900 shadow-md' : 'text-slate-500'}`}>Notes Archive ({(savedNotes || []).length})</button>
              </div>

              {libraryTab === 'plans' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {(savedPlans || []).map(item => (
                     <div key={item.id} className="group relative p-8 border-2 border-slate-50 rounded-[2rem] hover:border-indigo-200 transition bg-slate-50/50 cursor-pointer" onClick={() => { setPlan(item.plan); setView('editor'); }}>
                        <div className="flex justify-between mb-6">
                           <span className="text-[9px] font-black text-indigo-500 uppercase bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">CBE PLAN</span>
                           <div className="flex items-center gap-2">
                             <span className="text-[9px] text-slate-400 font-bold">{item.dateCreated}</span>
                             <button onClick={(e) => handleDeletePlan(item.id, e)} className="text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1">
                                <i className="fas fa-trash-alt text-xs"></i>
                             </button>
                           </div>
                        </div>
                        <h4 className="font-black text-slate-800 uppercase text-sm mb-1 truncate">{item.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.grade}</p>
                     </div>
                   ))}
                   {(!savedPlans?.length) && <div className="col-span-full py-32 text-center text-slate-300 italic font-black uppercase tracking-widest">No plans archived.</div>}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {(savedNotes || []).map(item => (
                     <div key={item.id} className="group relative p-8 border-2 border-slate-50 rounded-[2rem] hover:border-emerald-200 transition bg-slate-50/50 cursor-pointer" onClick={() => { setNotes(item.content); setInput({...input, subject: item.subject, grade: item.grade}); setView('editor'); }}>
                        <div className="flex justify-between mb-6">
                           <span className="text-[9px] font-black text-emerald-500 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">NOTES</span>
                           <div className="flex items-center gap-2">
                             <span className="text-[9px] text-slate-400 font-bold">{item.dateCreated}</span>
                             <button onClick={(e) => handleDeleteNote(item.id, e)} className="text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1">
                                <i className="fas fa-trash-alt text-xs"></i>
                             </button>
                           </div>
                        </div>
                        <h4 className="font-black text-slate-800 uppercase text-sm mb-1 truncate">{item.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.grade}</p>
                     </div>
                   ))}
                   {(!savedNotes?.length) && <div className="col-span-full py-32 text-center text-slate-300 italic font-black uppercase tracking-widest">No notes archived.</div>}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlanner;
