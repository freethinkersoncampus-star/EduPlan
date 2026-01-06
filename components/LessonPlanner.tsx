
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateLessonPlan, generateLessonNotes } from '../services/geminiService';
import { LessonPlan, SavedLessonPlan, SavedLessonNote, UserProfile } from '../types';

interface LessonPlannerProps {
  knowledgeContext?: string;
}

const LessonPlanner: React.FC<LessonPlannerProps> = ({ knowledgeContext }) => {
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const [planHistory, setPlanHistory] = useState<SavedLessonPlan[]>([]);
  const [noteHistory, setNoteHistory] = useState<SavedLessonNote[]>([]);

  const [input, setInput] = useState({
    subject: 'Integrated Science',
    grade: '9',
    strand: 'Living Things and Their Environment',
    subStrand: 'Nutrition in Animals: Process of Digestion',
    week: '1',
    lessonNumber: '1',
    term: '2'
  });

  useEffect(() => {
    const savedPlans = localStorage.getItem('eduplan_plan_history');
    const savedNotes = localStorage.getItem('eduplan_note_history');
    const savedProfile = localStorage.getItem('eduplan_profile');
    if (savedPlans) setPlanHistory(JSON.parse(savedPlans));
    if (savedNotes) setNoteHistory(JSON.parse(savedNotes));
    if (savedProfile) setProfile(JSON.parse(savedProfile));
  }, []);

  const handleGeneratePlan = async () => {
    setLoadingPlan(true);
    try {
      const result = await generateLessonPlan(input.subject, input.grade, input.strand, input.subStrand, knowledgeContext);
      // Inject user input week/lesson/term if model didn't provide specific ones
      const enrichedPlan = {
        ...result,
        week: input.week,
        lessonNumber: input.lessonNumber,
        term: input.term
      };
      setPlan(enrichedPlan);
      const newPlan: SavedLessonPlan = {
        id: Date.now().toString(),
        dateCreated: new Date().toLocaleDateString(),
        title: `${input.subject} - ${input.subStrand}`,
        plan: enrichedPlan
      };
      const updated = [newPlan, ...planHistory];
      setPlanHistory(updated);
      localStorage.setItem('eduplan_plan_history', JSON.stringify(updated));
    } catch (err) { 
      console.error(err);
      alert("Error generating plan"); 
    } finally { setLoadingPlan(false); }
  };

  const handleGenerateNotes = async () => {
    setLoadingNotes(true);
    try {
      const result = await generateLessonNotes(input.subject, input.grade, input.subStrand, "", knowledgeContext);
      setNotes(result);
      const newNote: SavedLessonNote = {
        id: Date.now().toString(),
        dateCreated: new Date().toLocaleDateString(),
        title: `${input.subject} - ${input.subStrand}`,
        content: result,
        subject: input.subject,
        grade: input.grade
      };
      const updated = [newNote, ...noteHistory];
      setNoteHistory(updated);
      localStorage.setItem('eduplan_note_history', JSON.stringify(updated));
    } catch (err) { 
      console.error(err);
      alert("Error generating notes"); 
    } finally { setLoadingNotes(false); }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-6 print:hidden">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <i className="fas fa-pencil-ruler text-indigo-500"></i>
              Session Planning
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Grade</label>
                <input className="w-full border p-2.5 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" value={input.grade} onChange={e => setInput({...input, grade: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Term</label>
                <input className="w-full border p-2.5 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" value={input.term} onChange={e => setInput({...input, term: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Week</label>
                <input className="w-full border p-2.5 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" value={input.week} onChange={e => setInput({...input, week: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Lesson No.</label>
                <input className="w-full border p-2.5 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" value={input.lessonNumber} onChange={e => setInput({...input, lessonNumber: e.target.value})} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Learning Area</label>
                <input className="w-full border p-2.5 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" value={input.subject} onChange={e => setInput({...input, subject: e.target.value})} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Strand</label>
                <input className="w-full border p-2.5 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" value={input.strand} onChange={e => setInput({...input, strand: e.target.value})} />
              </div>
              <div className="space-y-1 md:col-span-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Sub-strand / Specific Topic</label>
                <input className="w-full border p-2.5 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" value={input.subStrand} onChange={e => setInput({...input, subStrand: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleGeneratePlan} 
                disabled={loadingPlan} 
                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                {loadingPlan ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                Generate Rationalized Plan
              </button>
              <button 
                onClick={handleGenerateNotes} 
                disabled={loadingNotes} 
                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition flex items-center justify-center gap-2"
              >
                {loadingNotes ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-alt"></i>}
                Generate Study Notes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[500px]">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                <h3 className="font-bold text-slate-800">CBE Lesson Plan Document</h3>
                {plan && (
                  <button 
                    onClick={() => downloadFile(JSON.stringify(plan, null, 2), `Plan_${input.subStrand}.json`)} 
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg"
                  >
                    <i className="fas fa-download"></i> Save Document
                  </button>
                )}
              </div>
              {plan ? (
                <div className="text-slate-900 leading-normal text-xs">
                  <div className="text-center font-black uppercase mb-2 underline text-sm">
                    {plan.grade} Rationalized {plan.subject} Lesson Plans
                  </div>
                  <div className="text-center font-black uppercase mb-4 text-sm">
                    Term {plan.term || input.term} - {plan.referenceBook || 'Spark Integrated Science'}
                  </div>
                  
                  <div className="font-black uppercase mb-2">
                    Week {plan.week || input.week}: Lesson {plan.lessonNumber || input.lessonNumber}
                  </div>

                  <table className="w-full border-collapse border border-black mb-4">
                    <tbody>
                      <tr>
                        <td className="border border-black p-1 font-bold">SCHOOL</td>
                        <td className="border border-black p-1 font-bold">LEVEL</td>
                        <td className="border border-black p-1 font-bold">LEARNING AREA</td>
                        <td className="border border-black p-1 font-bold">DATE</td>
                        <td className="border border-black p-1 font-bold">TIME</td>
                        <td className="border border-black p-1 font-bold">ROLL</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1 truncate max-w-[100px]">{profile?.school || ''}</td>
                        <td className="border border-black p-1 font-bold">{plan.grade}</td>
                        <td className="border border-black p-1 font-bold uppercase">{plan.subject}</td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="mb-4">
                    <p><strong>Strand:</strong> {plan.strand}</p>
                    <p><strong>Sub Strand:</strong> {plan.subStrand}</p>
                  </div>

                  <div className="mb-4">
                    <p className="font-bold underline">Specific Learning Outcomes:</p>
                    <p className="mb-1">By the end of the lesson, learners should be able to:</p>
                    <ul className="list-disc pl-5">
                      {plan.outcomes.map((o, i) => <li key={i}>{o}</li>)}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <p className="font-bold underline">Key Inquiry Questions:</p>
                    <ul className="list-disc pl-5">
                      {plan.keyInquiryQuestions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <p className="font-bold underline">Learning Resources:</p>
                    <ul className="list-disc pl-5">
                      {plan.learningResources.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <p className="font-bold underline">Organisation of Learning:</p>
                    <div className="mt-2">
                      <p className="font-bold">Introduction ({plan.introduction.duration})</p>
                      <p className="mb-2 italic text-slate-600">{plan.introduction.content}</p>
                      
                      <p className="font-bold">Lesson Development</p>
                      {plan.lessonDevelopment.map((step, i) => (
                        <div key={i} className="mb-2">
                          <p className="font-bold">Step {i+1}: {step.title} ({step.duration})</p>
                          <p className="italic text-slate-600">{step.content}</p>
                        </div>
                      ))}

                      <p className="font-bold">Conclusion ({plan.conclusion.duration})</p>
                      <p className="mb-2 italic text-slate-600">{plan.conclusion.content}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="font-bold underline">Extended Activities:</p>
                    <ul className="list-disc pl-5">
                      {plan.extendedActivities.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>

                  <div className="mt-6 pt-2 border-t border-slate-200">
                    <p className="font-bold uppercase underline">Teacher Self-Evaluation:</p>
                    <div className="h-12 border-b border-dashed border-slate-300"></div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-slate-300">
                  <i className="fas fa-book-open text-5xl mb-4 opacity-10"></i>
                  <p className="text-xs font-medium">No lesson plan generated yet.</p>
                </div>
              )}
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[500px]">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                <h3 className="font-bold text-slate-800">Student Handout Notes</h3>
                {notes && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => downloadFile(notes, `Notes_${input.subStrand}.md`)} 
                      className="text-emerald-600 hover:text-emerald-800 text-xs font-bold flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg"
                    >
                      <i className="fas fa-download"></i> Markdown
                    </button>
                    <button 
                      onClick={() => window.print()} 
                      className="text-slate-600 hover:text-slate-800 text-xs font-bold flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg"
                    >
                      <i className="fas fa-print"></i>
                    </button>
                  </div>
                )}
              </div>
              {notes ? (
                <div className="prose prose-sm prose-indigo max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-slate-300">
                  <i className="fas fa-file-alt text-5xl mb-4 opacity-10"></i>
                  <p className="text-xs font-medium">Handout notes will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6 print:hidden">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 flex items-center gap-2">
              <i className="fas fa-history text-indigo-400"></i>
              Plan History
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {planHistory.length > 0 ? planHistory.map(p => (
                <div 
                  key={p.id} 
                  className="p-3 bg-slate-50 rounded-2xl border border-transparent cursor-pointer hover:border-indigo-400 hover:bg-white transition group"
                  onClick={() => setPlan(p.plan)}
                >
                  <p className="font-bold text-xs text-slate-700 truncate group-hover:text-indigo-600">{p.title}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{p.dateCreated}</p>
                </div>
              )) : (
                <p className="text-[10px] text-slate-400 text-center py-4">No saved plans.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 flex items-center gap-2">
              <i className="fas fa-book text-emerald-400"></i>
              Notes Library
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {noteHistory.length > 0 ? noteHistory.map(n => (
                <div 
                  key={n.id} 
                  className="p-3 bg-slate-50 rounded-2xl border border-transparent cursor-pointer hover:border-emerald-400 hover:bg-white transition group"
                  onClick={() => setNotes(n.content)}
                >
                  <p className="font-bold text-xs text-slate-700 truncate group-hover:text-emerald-600">{n.title}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{n.dateCreated}</p>
                </div>
              )) : (
                <p className="text-[10px] text-slate-400 text-center py-4">No saved notes.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlanner;
