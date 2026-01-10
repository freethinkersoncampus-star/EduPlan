
import React, { useState, useMemo } from 'react';
import { TimetableConfig, TeacherAssignment, LessonSlot, UserProfile } from '../types';
import { generateMasterTimetable } from '../services/geminiService';

interface TimetableProps {
  slots: LessonSlot[];
  setSlots: React.Dispatch<React.SetStateAction<LessonSlot[]>>;
  profile: UserProfile;
}

const Timetable: React.FC<TimetableProps> = ({ slots, setSlots, profile }) => {
  const [view, setView] = useState<'setup' | 'master' | 'individual'>('setup');
  const [loading, setLoading] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [mobileDay, setMobileDay] = useState<string>('Monday');

  const [config, setConfig] = useState<TimetableConfig>(() => {
    const saved = localStorage.getItem('eduplan_timetable_config');
    return saved ? JSON.parse(saved) : {
      daysToTeach: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      dayStartTime: '07:00',
      dayEndTime: '16:30',
      lessonDuration: 40,
      breaks: [
        { name: 'ASSEMBLY / CLASS MEETINGS', startTime: '07:00', endTime: '08:20', type: 'activity' },
        { name: 'SHORT BREAK', startTime: '09:40', endTime: '09:50', type: 'break' },
        { name: 'LONG BREAK', startTime: '11:10', endTime: '11:30', type: 'break' },
        { name: 'LUNCH BREAK', startTime: '12:50', endTime: '14:00', type: 'break' },
        { name: 'CLUBS & SOCIETIES', startTime: '15:20', endTime: '16:00', type: 'activity' },
        { name: 'GAMES', startTime: '16:00', endTime: '16:30', type: 'activity' }
      ],
      constraints: 'Double periods for Science and Creative Arts. Ensure Science labs are prioritized in the morning.'
    };
  });

  const [assignments, setAssignments] = useState<TeacherAssignment[]>(() => {
    const saved = localStorage.getItem('eduplan_teacher_assignments');
    return saved ? JSON.parse(saved) : [];
  });

  const timePeriods = useMemo(() => {
    const periods = new Set<string>();
    config.breaks.forEach(b => periods.add(`${b.startTime}-${b.endTime}`));
    slots.forEach(s => periods.add(`${s.startTime}-${s.endTime}`));
    
    return Array.from(periods).sort((a, b) => {
      const timeA = a.split('-')[0].replace(':', '');
      const timeB = b.split('-')[0].replace(':', '');
      return parseInt(timeA) - parseInt(timeB);
    });
  }, [slots, config.breaks]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const generated = await generateMasterTimetable(config, assignments);
      setSlots(generated || []);
      localStorage.setItem('eduplan_timetable_config', JSON.stringify(config));
      localStorage.setItem('eduplan_teacher_assignments', JSON.stringify(assignments));
      setView('master');
    } catch (err) {
      alert("Failed to generate timetable. Check assignments.");
    } finally {
      setLoading(false);
    }
  };

  const addAssignment = () => {
    const newAss: TeacherAssignment = {
      id: Date.now().toString(),
      teacherName: '',
      subject: '',
      grade: '',
      lessonsPerWeek: 5
    };
    setAssignments([...assignments, newAss]);
  };

  const updateAssignment = (id: string, updates: Partial<TeacherAssignment>) => {
    setAssignments(assignments.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAssignment = (id: string) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const uniqueTeachers = Array.from(new Set((slots || []).map(s => s.teacherName))).filter(t => t);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="p-2 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">School Timetable</h2>
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
          <button onClick={() => setView('setup')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition whitespace-nowrap ${view === 'setup' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500'}`}>Setup</button>
          <button onClick={() => setView('master')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition whitespace-nowrap ${view === 'master' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500'}`}>Master</button>
          <button onClick={() => setView('individual')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] md:text-sm font-bold transition whitespace-nowrap ${view === 'individual' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500'}`}>Staff</button>
        </div>
      </div>

      {view === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 print:hidden">
          <div className="bg-white p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><i className="fas fa-cog text-indigo-500"></i> School Structure</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">First Activity</label>
                  <input type="time" className="w-full border-slate-200 border p-3 rounded-xl mt-1 bg-slate-50 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={config.dayStartTime} onChange={e => setConfig({...config, dayStartTime: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">School Day Ends</label>
                  <input type="time" className="w-full border-slate-200 border p-3 rounded-xl mt-1 bg-slate-50 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={config.dayEndTime} onChange={e => setConfig({...config, dayEndTime: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Period (Mins)</label>
                  <input type="number" className="w-full border-slate-200 border p-3 rounded-xl mt-1 bg-slate-50 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-center" value={config.lessonDuration} onChange={e => setConfig({...config, lessonDuration: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">AI Constraints</label>
                <textarea className="w-full border-slate-200 border p-4 rounded-2xl mt-1 h-32 text-sm bg-slate-50 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="e.g. Double periods for Science. Mr. Rotich teaches Grade 8 Science only." value={config.constraints} onChange={e => setConfig({...config, constraints: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><i className="fas fa-users text-indigo-500"></i> Staff Loads</h3>
              <button onClick={addAssignment} className="text-indigo-600 text-[10px] font-black bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100">ADD LOAD</button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
              {assignments.map(ass => (
                <div key={ass.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group hover:border-indigo-200 transition">
                  <button onClick={() => deleteAssignment(ass.id)} className="absolute -top-1 -right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md z-10"><i className="fas fa-times text-[10px]"></i></button>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase">Teacher</label>
                      <select className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold" value={ass.teacherName} onChange={e => updateAssignment(ass.id, { teacherName: e.target.value })}>
                        <option value="">Select Staff</option>
                        {(profile.onboardedStaff || []).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase">Grade</label>
                      <select className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs" value={ass.grade} onChange={e => updateAssignment(ass.id, { grade: e.target.value })}>
                        <option value="">Select Grade</option>
                        {(profile.grades || []).map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase">Subject</label>
                      <select className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs" value={ass.subject} onChange={e => updateAssignment(ass.id, { subject: e.target.value })}>
                        <option value="">Select Subject</option>
                        {(profile.subjects || []).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase">Lsns/Wk</label>
                      <input type="number" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-center font-bold" value={ass.lessonsPerWeek} onChange={e => updateAssignment(ass.id, { lessonsPerWeek: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleGenerate} disabled={loading || assignments.length === 0} className="mt-6 w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2">
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>} GENERATE MASTER PLAN
            </button>
          </div>
        </div>
      )}

      {(view === 'master' || view === 'individual') && (slots?.length > 0) && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-end print:hidden gap-4">
            {view === 'individual' ? (
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Staff Schedule</label>
                <select className="w-full border p-3 rounded-xl text-sm bg-white font-bold text-indigo-900 shadow-sm" value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
                  <option value="">Select a Staff Member</option>
                  {uniqueTeachers.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            ) : (
              <div className="flex-1 md:hidden">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Select Day View</label>
                <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
                  {days.map(d => (
                    <button key={d} onClick={() => setMobileDay(d)} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${mobileDay === d ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>
                      {d.substring(0, 3).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => window.print()} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition flex items-center justify-center gap-3 text-sm">
              <i className="fas fa-file-pdf"></i> PRINT (A4)
            </button>
          </div>

          {/* Master Table - Full on Desktop, Day-specific on Mobile */}
          <div className="bg-white border-2 border-black shadow-2xl overflow-hidden print:border-black print:border-4 max-w-[1200px] mx-auto print:max-w-none print:w-full">
            <div className="p-6 md:p-10 border-b-4 border-black text-center bg-white">
              <h1 className="text-xl md:text-3xl font-black text-black uppercase tracking-[0.2em]">{profile.school}</h1>
              <p className="text-[10px] md:text-sm font-black uppercase tracking-widest text-slate-600 mt-2">
                {view === 'master' ? 'Master Timetable 2025' : `${selectedTeacher} - Individual Schedule`}
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse table-fixed border-black min-w-[800px] md:min-w-full">
                <thead>
                  <tr className="bg-slate-50 border-b-4 border-black">
                    <th className="p-3 border-r-4 border-black w-24 md:w-32 text-[8px] md:text-[10px] font-black uppercase text-black text-center">Time</th>
                    {/* On mobile, only show selected day, on desktop show all 5 */}
                    {days.map(day => (
                      <th key={day} className={`p-4 border-r-4 border-black last:border-r-0 text-lg md:text-xl font-black uppercase text-black ${mobileDay !== day ? 'hidden md:table-cell' : ''}`}>
                        {day.substring(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timePeriods.map((period, pIdx) => {
                    const [start, end] = period.split('-');
                    const isBreak = config.breaks.find(b => b.startTime === start && b.endTime === end);
                    
                    if (isBreak) {
                      return (
                        <tr key={period} className="border-b-4 border-black h-12 md:h-16">
                          <td className="p-1 border-r-4 border-black bg-slate-50 text-[8px] font-black text-black text-center leading-tight">
                            {start}<br/>{end}
                          </td>
                          <td colSpan={5} className="p-2 text-center bg-slate-100 font-black uppercase tracking-[0.4em] md:tracking-[0.8em] text-black text-sm md:text-lg">
                            {isBreak.name}
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={period} className="border-b-4 border-black h-24 md:h-28">
                        <td className="p-1 border-r-4 border-black bg-slate-50 text-[8px] font-black text-black text-center leading-tight">
                          {start}<br/>{end}
                        </td>
                        {days.map(day => {
                          const match = slots.find(s => s.day === day && s.startTime === start && s.endTime === end);
                          const isTeacherVisible = view === 'individual' && selectedTeacher 
                            ? (match?.teacherName === selectedTeacher)
                            : true;

                          const content = (match && isTeacherVisible) ? match : null;

                          return (
                            <td key={day} className={`p-2 border-r-4 border-black last:border-r-0 align-middle text-center relative ${mobileDay !== day ? 'hidden md:table-cell' : ''}`}>
                              {content ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                  <p className="text-sm md:text-lg font-black uppercase leading-tight text-black">
                                    {content.subject.replace(' DOUBLE', '')}
                                    {content.subject.includes('DOUBLE') && <span className="block text-[6px] md:text-[8px] mt-0.5 tracking-tighter opacity-50 underline">DOUBLE</span>}
                                  </p>
                                  <div className="absolute bottom-1 right-1">
                                    <span className="text-[8px] md:text-[10px] font-black text-black bg-white px-1 border border-black">{getInitials(content.teacherName)}</span>
                                  </div>
                                  <div className="absolute top-1 left-1">
                                     <span className="text-[6px] md:text-[8px] font-black text-slate-400">{content.grade.split(' ')[0]}</span>
                                  </div>
                                </div>
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 md:p-6 border-t-4 border-black bg-white flex justify-between items-center text-[8px] md:text-[10px] font-black text-black uppercase tracking-widest">
               <span>DATE: {new Date().toLocaleDateString('en-GB')}</span>
               <span className="hidden sm:inline">OFFICIAL CBC TIMETABLE</span>
               <span className="opacity-30">@EDUPLAN</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
