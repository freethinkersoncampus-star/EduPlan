
import React, { useState } from 'react';
import { generateLessonPlan, generateLessonNotes, generateNoteSummary } from '../services/geminiService';
import { LessonPlan } from '../types';

const LessonPlanner: React.FC = () => {
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  
  const initialInput = {
    subject: 'Mathematics',
    grade: 'Grade 4',
    strand: 'Numbers',
    subStrand: 'Addition of 4-digit numbers'
  };

  const [input, setInput] = useState(initialInput);

  const handleGeneratePlan = async () => {
    setLoadingPlan(true);
    try {
      const result = await generateLessonPlan(input.subject, input.grade, input.strand, input.subStrand);
      setPlan(result);
    } catch (err) {
      alert("Error generating plan");
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleGenerateNotes = async () => {
    setLoadingNotes(true);
    setSummary('');
    try {
      const result = await generateLessonNotes(input.subject, input.grade, `${input.strand}: ${input.subStrand}`, customPrompt);
      setNotes(result);
    } catch (err) {
      alert("Error generating notes");
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!notes) return;
    setLoadingSummary(true);
    try {
      const result = await generateNoteSummary(notes);
      setSummary(result);
    } catch (err) {
      alert("Error generating summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleClear = () => {
    setInput({
      subject: '',
      grade: '',
      strand: '',
      subStrand: ''
    });
    setPlan(null);
    setNotes('');
    setSummary('');
    setCustomPrompt('');
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleCopyNotes = () => {
    if (notes) {
      navigator.clipboard.writeText(notes);
      alert('Notes copied to clipboard!');
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 print:hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">Lesson Prep Tool</h2>
          <button 
            onClick={handleClear}
            className="text-xs font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest transition flex items-center gap-2"
          >
            <i className="fas fa-eraser"></i>
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Subject</label>
            <input 
              type="text" 
              className="border p-2 rounded-lg text-sm"
              value={input.subject}
              onChange={e => setInput({...input, subject: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Grade</label>
            <input 
              type="text" 
              className="border p-2 rounded-lg text-sm"
              value={input.grade}
              onChange={e => setInput({...input, grade: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Strand</label>
            <input 
              type="text" 
              className="border p-2 rounded-lg text-sm"
              value={input.strand}
              onChange={e => setInput({...input, strand: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Sub-strand</label>
            <input 
              type="text" 
              className="border p-2 rounded-lg text-sm"
              value={input.subStrand}
              onChange={e => setInput({...input, subStrand: e.target.value})}
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
            AI Prompting / Custom Context (e.g. "Focus on hands-on activities", "Simple English")
          </label>
          <textarea 
            className="w-full border rounded-lg p-2 text-sm h-16 resize-none"
            placeholder="Add special instructions for lesson notes..."
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
          ></textarea>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleGeneratePlan}
            disabled={loadingPlan}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
          >
            {loadingPlan ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
            Plan
          </button>
          <button 
            onClick={handleGenerateNotes}
            disabled={loadingNotes}
            className="flex-1 bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2"
          >
            {loadingNotes ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-alt"></i>}
            Notes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Display */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print-container">
          <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center print:hidden">
            <h3 className="font-bold text-indigo-900">Lesson Plan</h3>
            {plan && (
              <button 
                onClick={handleDownloadPDF}
                className="text-xs text-indigo-600 font-bold uppercase tracking-wider hover:underline"
              >
                Download PDF
              </button>
            )}
          </div>
          
          <div className="hidden print:block p-8 border-b-2 border-indigo-900 mb-6">
            <h1 className="text-2xl font-black text-center uppercase mb-2">Lesson Plan</h1>
            <div className="grid grid-cols-2 gap-4 text-sm font-bold">
              <p>SUBJECT: {input.subject.toUpperCase()}</p>
              <p>GRADE: {input.grade.toUpperCase()}</p>
              <p>STRAND: {input.strand.toUpperCase()}</p>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[600px] print:max-h-none">
            {plan ? (
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider mb-2">Outcomes</h4>
                  <ul className="list-disc ml-5 text-sm text-slate-600 space-y-1">
                    {plan.outcomes.map((o, idx) => <li key={idx}>{o}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider mb-2">Development</h4>
                  <div className="space-y-4">
                    {plan.lessonDevelopment.map((step, idx) => (
                      <div key={idx} className="flex gap-4 text-sm">
                        <span className="flex-none w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                        <p className="text-slate-600 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-300">
                <i className="fas fa-file-signature text-5xl mb-4 opacity-20"></i>
                <p>No plan generated.</p>
              </div>
            )}
          </div>
        </div>

        {/* Notes Display */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:hidden">
          <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
            <h3 className="font-bold text-emerald-900">Subject Notes</h3>
            <div className="flex gap-3">
              {notes && (
                <button 
                  onClick={handleGenerateSummary}
                  disabled={loadingSummary}
                  className="text-xs text-indigo-600 font-bold uppercase tracking-wider hover:underline"
                >
                  {loadingSummary ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-bolt mr-1"></i>}
                  Summary
                </button>
              )}
              {notes && (
                <button 
                  onClick={handleCopyNotes}
                  className="text-xs text-emerald-600 font-bold uppercase tracking-wider hover:underline"
                >
                  <i className="fas fa-copy mr-1"></i>
                  Copy
                </button>
              )}
            </div>
          </div>
          <div className="p-6 overflow-y-auto max-h-[600px]">
            {summary && (
              <div className="mb-6 bg-indigo-50 border border-indigo-100 p-4 rounded-xl animate-in slide-in-from-top-4 duration-300">
                <h4 className="text-[10px] font-bold text-indigo-400 uppercase mb-2 flex items-center gap-1">
                  <i className="fas fa-sparkles"></i> AI Summary
                </h4>
                <div className="text-sm text-indigo-900 italic font-medium whitespace-pre-wrap">
                  {summary}
                </div>
              </div>
            )}
            
            {notes ? (
              <div className="whitespace-pre-wrap text-sm text-slate-600 leading-relaxed prose prose-indigo max-w-none">
                {notes}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-slate-300">
                <i className="fas fa-sticky-note text-4xl opacity-20 mb-4"></i>
                <h4 className="font-bold text-slate-400">Lesson Notes</h4>
                <p className="text-xs text-center max-w-[250px] mt-2">
                  Generated learner-friendly notes with CBC formatting will appear here. 
                  Use the instruction box above to guide the AI.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlanner;
