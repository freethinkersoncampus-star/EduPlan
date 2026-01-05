
import React, { useState } from 'react';
import { generateSOW } from '../services/geminiService';
import { SOWRow, LessonSlot, SchoolCalendar } from '../types';

interface SOWGeneratorProps {
  timetableSlots: LessonSlot[];
}

const SOWGenerator: React.FC<SOWGeneratorProps> = ({ timetableSlots }) => {
  const [loading, setLoading] = useState(false);
  const [sow, setSow] = useState<SOWRow[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    subject: 'Mathematics',
    grade: 'Grade 4',
    term: 1,
  });

  const [calendar, setCalendar] = useState<SchoolCalendar>({
    term: 1,
    startDate: '2024-01-08',
    endDate: '2024-04-05',
    halfTermStart: '2024-02-19',
    halfTermEnd: '2024-02-23'
  });

  const [syncWithTimetable, setSyncWithTimetable] = useState(true);

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const isDateInHalfTerm = (date: Date) => {
    const d = new Date(date).setHours(0,0,0,0);
    const start = new Date(calendar.halfTermStart).setHours(0,0,0,0);
    const end = new Date(calendar.halfTermEnd).setHours(0,0,0,0);
    return d >= start && d <= end;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setSow([]);
    try {
      const relevantSlots = timetableSlots.filter(
        s => s.subject.toLowerCase() === formData.subject.toLowerCase() && 
             s.grade.toLowerCase() === formData.grade.toLowerCase()
      );

      if (relevantSlots.length === 0 && syncWithTimetable) {
        alert(`No lessons for ${formData.subject} (${formData.grade}) found in your timetable. Please add them first or disable timetable sync.`);
        setLoading(false);
        return;
      }

      const estimatedTotalLessons = syncWithTimetable ? (relevantSlots.length * 12) : 60;
      const result = await generateSOW(formData.subject, formData.grade, formData.term, estimatedTotalLessons);
      
      let finalRows: SOWRow[] = [];

      if (syncWithTimetable) {
        let currentDate = new Date(calendar.startDate);
        const termEndDate = new Date(calendar.endDate);
        let sowIndex = 0;

        while (currentDate <= termEndDate && sowIndex < result.length) {
          if (!isDateInHalfTerm(currentDate)) {
            const dayName = getDayName(currentDate);
            const slotsToday = relevantSlots.filter(s => s.day === dayName);
            slotsToday.sort((a,b) => a.startTime.localeCompare(b.startTime));

            for (let i = 0; i < slotsToday.length && sowIndex < result.length; i++) {
              finalRows.push({
                ...result[sowIndex],
                date: currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
              });
              sowIndex++;
            }
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        finalRows = result.map((row, index) => {
          const d = new Date(calendar.startDate);
          d.setDate(d.getDate() + (row.week - 1) * 7 + (row.lesson - 1));
          return { ...row, date: d.toLocaleDateString('en-GB') };
        });
      }

      setSow(finalRows);
    } catch (err) {
      console.error(err);
      alert("Failed to generate Scheme of Work.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRow = (index: number, field: keyof SOWRow, value: any) => {
    const updatedSow = [...sow];
    updatedSow[index] = { ...updatedSow[index], [field]: value };
    setSow(updatedSow);
  };

  const downloadCSV = () => {
    if (sow.length === 0) return;

    const headers = ["Week", "Lesson", "Date", "Strand", "Sub-strand", "Learning Outcomes", "Inquiry Questions", "Assessment"];
    const rows = sow.map(row => [
      row.week,
      row.lesson,
      row.date,
      `"${row.strand.replace(/"/g, '""')}"`,
      `"${row.subStrand.replace(/"/g, '""')}"`,
      `"${row.learningOutcomes.replace(/"/g, '""')}"`,
      `"${row.keyInquiryQuestion.replace(/"/g, '""')}"`,
      `"${row.assessment.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SOW_${formData.subject}_${formData.grade}_Term${formData.term}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 print:hidden">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-sync-alt text-indigo-500"></i>
          Smart CBC SOW Generator
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">1. Class Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Subject</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2 text-sm"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Grade</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2 text-sm"
                  placeholder="e.g. Grade 4"
                  value={formData.grade}
                  onChange={e => setFormData({...formData, grade: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Term</label>
              <select 
                className="w-full border rounded-lg p-2 text-sm"
                value={formData.term}
                onChange={e => setFormData({...formData, term: parseInt(e.target.value)})}
              >
                {[1,2,3].map(t => <option key={t} value={t}>Term {t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">2. School Calendar</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Term Start</label>
                <input 
                  type="date" 
                  className="w-full border rounded-lg p-2 text-xs"
                  value={calendar.startDate}
                  onChange={e => setCalendar({...calendar, startDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Term End</label>
                <input 
                  type="date" 
                  className="w-full border rounded-lg p-2 text-xs"
                  value={calendar.endDate}
                  onChange={e => setCalendar({...calendar, endDate: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Half-Term Start</label>
                <input 
                  type="date" 
                  className="w-full border rounded-lg p-2 text-xs"
                  value={calendar.halfTermStart}
                  onChange={e => setCalendar({...calendar, halfTermStart: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Half-Term End</label>
                <input 
                  type="date" 
                  className="w-full border rounded-lg p-2 text-xs"
                  value={calendar.halfTermEnd}
                  onChange={e => setCalendar({...calendar, halfTermEnd: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">3. Automation</h3>
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
              <input 
                type="checkbox" 
                id="sync-toggle"
                className="w-5 h-5 accent-indigo-600 rounded"
                checked={syncWithTimetable}
                onChange={e => setSyncWithTimetable(e.target.checked)}
              />
              <label htmlFor="sync-toggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Sync with my Timetable
              </label>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              When enabled, Gemini will only schedule lessons on days where you have "{formData.subject}" for "{formData.grade}" in your current weekly timetable.
            </p>
            <button 
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full bg-indigo-600 text-white py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 ${loading ? 'opacity-50' : 'hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
              Generate & Sync SOW
            </button>
          </div>
        </div>
      </div>

      {sow.length > 0 && (
        <div id="printable-sow" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-5 bg-slate-50 border-b flex justify-between items-center print:hidden">
            <div>
              <h3 className="font-bold text-slate-800">Scheme of Work: {formData.subject} {formData.grade}</h3>
              <p className="text-xs text-slate-500">Synchronized & Editable. Use the <i className="fas fa-pen text-[10px]"></i> icon to customize rows.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handlePrint}
                className="bg-white text-slate-700 border px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-slate-50 transition"
              >
                <i className="fas fa-print mr-2"></i> Print / PDF
              </button>
              <button 
                onClick={downloadCSV}
                className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <i className="fas fa-file-csv"></i> Download CSV
              </button>
            </div>
          </div>
          
          <div className="hidden print:block p-8 border-b-2 border-slate-900 mb-6">
            <h1 className="text-2xl font-black text-center uppercase mb-2">Scheme of Work</h1>
            <div className="grid grid-cols-2 gap-4 text-sm font-bold">
              <p>SUBJECT: {formData.subject.toUpperCase()}</p>
              <p>GRADE: {formData.grade.toUpperCase()}</p>
              <p>TERM: {formData.term}</p>
              <p>YEAR: {new Date().getFullYear()}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50/50 border-b text-slate-500 font-bold uppercase text-[10px] tracking-widest print:bg-slate-200 print:text-black">
                <tr>
                  <th className="p-4 border-r w-12 text-center">Wk</th>
                  <th className="p-4 border-r w-12 text-center">Lsn</th>
                  <th className="p-4 border-r w-32">Date</th>
                  <th className="p-4 border-r">Strand & Sub-strand</th>
                  <th className="p-4 border-r">Learning Outcomes</th>
                  <th className="p-4 border-r">Inquiry Questions</th>
                  <th className="p-4 border-r">Assessment</th>
                  <th className="p-4 print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-900">
                {sow.map((row, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/30 transition group print:break-inside-avoid">
                    <td className="p-4 border-r font-medium text-center text-slate-400 group-hover:text-indigo-600 print:text-black">{row.week}</td>
                    <td className="p-4 border-r text-center font-bold text-slate-700 group-hover:text-indigo-600 print:text-black">{row.lesson}</td>
                    <td className="p-4 border-r">
                      <div className="flex flex-col">
                        <span className="text-indigo-600 font-bold text-xs print:text-black">{row.date}</span>
                      </div>
                    </td>
                    <td className="p-4 border-r">
                      {editingIndex === idx ? (
                        <div className="space-y-2">
                          <input 
                            className="w-full border rounded p-1 text-xs" 
                            value={row.strand} 
                            onChange={e => handleEditRow(idx, 'strand', e.target.value)} 
                          />
                          <input 
                            className="w-full border rounded p-1 text-xs" 
                            value={row.subStrand} 
                            onChange={e => handleEditRow(idx, 'subStrand', e.target.value)} 
                          />
                        </div>
                      ) : (
                        <>
                          <p className="font-bold text-slate-800 text-xs mb-1 print:text-black">{row.strand}</p>
                          <p className="text-xs text-indigo-600 font-medium print:text-black">{row.subStrand}</p>
                        </>
                      )}
                    </td>
                    <td className="p-4 border-r text-xs leading-relaxed text-slate-600 max-w-xs print:text-black">
                      {editingIndex === idx ? (
                        <textarea 
                          className="w-full border rounded p-1 text-xs" 
                          rows={3}
                          value={row.learningOutcomes} 
                          onChange={e => handleEditRow(idx, 'learningOutcomes', e.target.value)} 
                        />
                      ) : row.learningOutcomes}
                    </td>
                    <td className="p-4 border-r text-xs text-slate-500 italic print:text-black">
                      {editingIndex === idx ? (
                        <input 
                          className="w-full border rounded p-1 text-xs" 
                          value={row.keyInquiryQuestion} 
                          onChange={e => handleEditRow(idx, 'keyInquiryQuestion', e.target.value)} 
                        />
                      ) : row.keyInquiryQuestion}
                    </td>
                    <td className="p-4 border-r">
                      {editingIndex === idx ? (
                        <input 
                          className="w-full border rounded p-1 text-xs" 
                          value={row.assessment} 
                          onChange={e => handleEditRow(idx, 'assessment', e.target.value)} 
                        />
                      ) : (
                        <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-600 font-bold text-[9px] uppercase print:bg-transparent print:p-0 print:text-black">
                          {row.assessment}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center print:hidden">
                      {editingIndex === idx ? (
                        <button 
                          onClick={() => setEditingIndex(null)}
                          className="text-green-600 hover:text-green-700 font-bold text-xs bg-green-50 px-3 py-1 rounded"
                        >
                          Save
                        </button>
                      ) : (
                        <button 
                          onClick={() => setEditingIndex(idx)}
                          className="text-slate-400 hover:text-indigo-600 transition"
                        >
                          <i className="fas fa-pen text-sm"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sow.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-32 text-slate-300 print:hidden">
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
            <i className="fas fa-calendar-check text-4xl"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-400">Ready to Plan?</h3>
          <p className="max-w-xs text-center mt-2 text-sm">Fill in your class details and sync with your timetable to generate a fully dated SOW.</p>
        </div>
      )}
    </div>
  );
};

export default SOWGenerator;
