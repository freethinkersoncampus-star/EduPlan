import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, LessonSlot, SubjectGradePair } from '../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface GridRow {
  id: string;
  label: string;
  duration: number; // in minutes
  type: 'lesson' | 'break' | 'activity';
}

interface TimetableProps {
  slots: LessonSlot[];
  setSlots: React.Dispatch<React.SetStateAction<LessonSlot[]>>;
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
}

const Timetable: React.FC<TimetableProps> = ({ slots, setSlots, profile, setProfile }) => {
  const [activeView, setActiveView] = useState<'registry' | 'grid'>('grid');
  const [newSubj, setNewSubj] = useState('');
  const [newGrd, setNewGrd] = useState('');

  // Configuration for the dynamic grid structure
  const [gridConfig, setGridConfig] = useState(() => {
    const saved = localStorage.getItem('eduplan_grid_config');
    if (saved) return JSON.parse(saved);
    return {
      dayStart: '08:20',
      dayEnd: '16:00',
      defaultLessonDuration: 40,
      rows: [
        { id: '1', label: 'Period 1', duration: 40, type: 'lesson' },
        { id: '2', label: 'Period 2', duration: 40, type: 'lesson' },
        { id: '3', label: 'Short Break', duration: 20, type: 'break' },
        { id: '4', label: 'Period 3', duration: 40, type: 'lesson' },
        { id: '5', label: 'Period 4', duration: 40, type: 'lesson' },
        { id: '6', label: 'Lunch Break', duration: 50, type: 'break' },
        { id: '7', label: 'Period 5', duration: 40, type: 'lesson' },
      ] as GridRow[]
    };
  });

  // Save config to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('eduplan_grid_config', JSON.stringify(gridConfig));
  }, [gridConfig]);

  // Derived: Calculate the Start/End times for each row based on the sequence
  const rowsWithTimes = useMemo(() => {
    let currentMin = (() => {
      const [h, m] = gridConfig.dayStart.split(':').map(Number);
      return h * 60 + m;
    })();

    return gridConfig.rows.map(row => {
      const startMin = currentMin;
      const endMin = startMin + row.duration;
      currentMin = endMin;

      const toTime = (min: number) => {
        const h = Math.floor(min / 60);
        const m = min % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      };

      return {
        ...row,
        startTime: toTime(startMin),
        endTime: toTime(endMin)
      };
    });
  }, [gridConfig.rows, gridConfig.dayStart]);

  const handlePopulateInitial = () => {
    const [sh, sm] = gridConfig.dayStart.split(':').map(Number);
    const [eh, em] = gridConfig.dayEnd.split(':').map(Number);
    
    const startTotal = sh * 60 + sm;
    const endTotal = eh * 60 + em;
    const totalAvailableMins = endTotal - startTotal;
    
    if (totalAvailableMins <= 0) {
      alert("Closing time must be later than opening time.");
      return;
    }

    if (confirm("This will reset your grid structure. Lessons already assigned to these times will remain, but the rows will be re-aligned. Continue?")) {
      const newRows: GridRow[] = [];
      let currentMinutesUsed = 0;
      let lessonCounter = 1;

      while (currentMinutesUsed + gridConfig.defaultLessonDuration <= totalAvailableMins) {
        newRows.push({
          id: Math.random().toString(36).substr(2, 9),
          label: `Period ${lessonCounter++}`,
          duration: gridConfig.defaultLessonDuration,
          type: 'lesson'
        });
        currentMinutesUsed += gridConfig.defaultLessonDuration;
      }

      if (currentMinutesUsed < totalAvailableMins) {
        newRows.push({
          id: 'end-block',
          label: 'Day Wrap-up',
          duration: totalAvailableMins - currentMinutesUsed,
          type: 'activity'
        });
      }

      setGridConfig({ ...gridConfig, rows: newRows });
    }
  };

  const updateRowProperty = (id: string, updates: Partial<GridRow>) => {
    const newRows = gridConfig.rows.map(r => r.id === id ? { ...r, ...updates } : r);
    setGridConfig({ ...gridConfig, rows: newRows });
  };

  const addRowAt = (index: number) => {
    const newRow: GridRow = {
      id: Math.random().toString(36).substr(2, 9),
      label: 'New Period',
      duration: gridConfig.defaultLessonDuration,
      type: 'lesson'
    };
    const newRows = [...gridConfig.rows];
    newRows.splice(index + 1, 0, newRow);
    setGridConfig({ ...gridConfig, rows: newRows });
  };

  const deleteRow = (id: string) => {
    setGridConfig({ ...gridConfig, rows: gridConfig.rows.filter(r => r.id !== id) });
  };

  const assignToSlot = (day: string, startTime: string, endTime: string, subject: string, grade: string) => {
    const otherSlots = slots.filter(s => !(s.day === day && s.startTime === startTime));
    setSlots([...otherSlots, { day, startTime, endTime, subject, grade, type: 'lesson' }]);
  };

  const clearSlot = (day: string, startTime: string) => {
    setSlots(slots.filter(s => !(s.day === day && s.startTime === startTime)));
  };

  const addSubjectToRegistry = () => {
    if (!newSubj || !newGrd) return;
    const pair: SubjectGradePair = { id: Date.now().toString(), subject: newSubj, grade: newGrd };
    setProfile({ ...profile, subjects: [...profile.subjects, pair] });
    setNewSubj(''); setNewGrd('');
  };

  const removeSubjectFromRegistry = (id: string) => {
    if (confirm("Remove this subject from your active teaching workload?")) {
      setProfile({...profile, subjects: profile.subjects.filter(s => s.id !== id)});
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500 overflow-x-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 print:hidden">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter text-black">Adaptive Timetable</h2>
          <p className="text-slate-500 text-[10px] md:text-sm mt-1 uppercase tracking-wider font-bold">Synchronized CBE Scheduler</p>
        </div>
        <div className="flex bg-slate-200/50 p-1 rounded-2xl shadow-inner w-full md:w-auto">
          <button onClick={() => setActiveView('registry')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${activeView === 'registry' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>LOADS</button>
          <button onClick={() => setActiveView('grid')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${activeView === 'grid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>GRID</button>
        </div>
      </div>

      {activeView === 'registry' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm h-fit">
            <h3 className="font-black text-slate-800 mb-6 uppercase text-[10px] tracking-widest border-b pb-4">Register Subject</h3>
            <div className="space-y-4">
              <input placeholder="Subject" className="w-full border-2 border-slate-50 p-4 rounded-xl bg-slate-50 text-[11px] font-bold outline-none focus:border-indigo-500 transition" value={newSubj} onChange={e => setNewSubj(e.target.value)} />
              <input placeholder="Grade/Stream" className="w-full border-2 border-slate-50 p-4 rounded-xl bg-slate-50 text-[11px] font-bold outline-none focus:border-indigo-500 transition" value={newGrd} onChange={e => setNewGrd(e.target.value)} />
              <button onClick={addSubjectToRegistry} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition">Save Registry</button>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-fit">
            <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Teaching Workload</span>
            </div>
            <div className="divide-y max-h-[400px] overflow-y-auto custom-scrollbar">
              {profile.subjects.map(p => (
                <div key={p.id} className="p-4 md:p-6 flex justify-between items-center hover:bg-slate-50 transition">
                  <div>
                    <p className="font-black text-slate-800 text-sm uppercase">{p.subject}</p>
                    <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{p.grade}</p>
                  </div>
                  <button onClick={() => removeSubjectFromRegistry(p.id)} className="text-slate-200 hover:text-red-500 transition p-2"><i className="fas fa-trash-alt"></i></button>
                </div>
              ))}
              {profile.subjects.length === 0 && <p className="p-10 text-center text-slate-400 font-medium italic text-xs uppercase tracking-widest">Registry is empty.</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col items-center justify-between gap-6 print:hidden">
            <div className="flex flex-wrap gap-4 items-center justify-center w-full">
              <div className="flex-1 min-w-[120px]">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Starts</label>
                <input type="time" className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 rounded-xl font-black text-[11px] outline-none" value={gridConfig.dayStart} onChange={e => setGridConfig({...gridConfig, dayStart: e.target.value})} />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Ends</label>
                <input type="time" className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 rounded-xl font-black text-[11px] outline-none" value={gridConfig.dayEnd} onChange={e => setGridConfig({...gridConfig, dayEnd: e.target.value})} />
              </div>
              <div className="flex-1 min-w-[80px]">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Period (M)</label>
                <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 rounded-xl font-black text-[11px] outline-none text-center" value={gridConfig.defaultLessonDuration} onChange={e => setGridConfig({...gridConfig, defaultLessonDuration: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={handlePopulateInitial} className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100">Sync Grid</button>
              <button onClick={handlePrint} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"><i className="fas fa-file-pdf"></i> PRINT</button>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden print:border-black print:rounded-none">
            <div className="overflow-x-auto relative custom-scrollbar">
              <table className="w-full text-sm border-collapse print:text-black min-w-[800px] md:min-w-0">
                <thead className="bg-slate-50 print:bg-transparent">
                  <tr className="border-b print:border-black">
                    <th className="p-4 border-r text-left w-24 md:w-32 bg-white print:border-black print:bg-transparent sticky left-0 z-20">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Time</span>
                    </th>
                    {DAYS.map(day => (
                      <th key={day} className="p-4 border-r text-center print:border-black">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-900 print:text-black">{day.substring(0,3)}</span>
                      </th>
                    ))}
                    <th className="p-4 w-44 text-center bg-slate-50 print:hidden">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Manage</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rowsWithTimes.map((row, idx) => (
                    <tr key={row.id} className={`${row.type !== 'lesson' ? 'bg-amber-50/40 print:bg-slate-50' : ''} group`}>
                      <td className="p-4 border-b border-r bg-white font-black print:border-black print:bg-transparent sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        <p className="text-[10px] text-slate-800 leading-none mb-1">{row.startTime}</p>
                        <p className="text-[8px] text-slate-400 leading-none mb-2">{row.endTime}</p>
                        <input className="print:hidden text-[8px] bg-slate-100 p-1 w-full rounded font-black uppercase tracking-tighter outline-none mb-1" value={row.label} onChange={e => updateRowProperty(row.id, { label: e.target.value })} />
                      </td>

                      {DAYS.map(day => {
                        const slot = slots.find(s => s.day === day && s.startTime === row.startTime);
                        if (row.type !== 'lesson') {
                          return (
                            <td key={day} className="p-1 border-b border-r print:border-black">
                               <div className={`p-2 py-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center font-black uppercase tracking-widest text-[8px] h-full ${
                                 row.type === 'break' ? 'bg-amber-100/50 border-amber-200 text-amber-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                               }`}>
                                 {row.label}
                               </div>
                            </td>
                          );
                        }

                        return (
                          <td key={day} className="p-1 border-b border-r print:border-black group relative min-h-[80px]">
                            {slot ? (
                              <div className="bg-white border-2 border-slate-100 p-2 md:p-3 rounded-xl shadow-sm hover:border-indigo-400 transition h-full flex flex-col justify-center">
                                 <div className="flex justify-between items-start mb-0.5">
                                    <p className="font-black text-slate-950 text-[10px] uppercase leading-tight">{slot.subject}</p>
                                    <button onClick={() => clearSlot(day, row.startTime)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition print:hidden text-[10px]"><i className="fas fa-times"></i></button>
                                 </div>
                                 <p className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest">{slot.grade}</p>
                              </div>
                            ) : (
                              <div className="p-2 py-4 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center print:hidden h-full hover:border-indigo-300 transition-colors">
                                 <select 
                                   className="w-full bg-transparent font-black text-[9px] uppercase tracking-widest text-slate-400 outline-none cursor-pointer text-center appearance-none"
                                   onChange={(e) => {
                                     const [subj, grd] = e.target.value.split('|');
                                     if (subj) assignToSlot(day, row.startTime, row.endTime, subj, grd);
                                   }}
                                   value=""
                                 >
                                    <option value="" className="text-slate-200">+</option>
                                    {profile.subjects.map(p => <option key={p.id} value={`${p.subject}|${p.grade}`} className="text-slate-900">{p.subject} — {p.grade}</option>)}
                                 </select>
                              </div>
                            )}
                          </td>
                        );
                      })}

                      <td className="p-2 border-b bg-slate-50/30 print:hidden align-middle">
                         <div className="flex flex-col gap-1.5">
                            <div className="flex gap-1">
                                <input 
                                  type="number" 
                                  className="w-12 bg-white border border-slate-200 p-1.5 rounded-lg text-[9px] font-black outline-none focus:border-indigo-500"
                                  value={row.duration}
                                  onChange={e => updateRowProperty(row.id, { duration: parseInt(e.target.value) || 0 })}
                                  title="Duration (mins)"
                                />
                                <select 
                                  className="flex-1 bg-white border border-slate-200 p-1.5 rounded-lg text-[8px] font-black uppercase outline-none"
                                  value={row.type}
                                  onChange={e => updateRowProperty(row.id, { type: e.target.value as any })}
                                >
                                   <option value="lesson">Teach</option>
                                   <option value="break">Break</option>
                                   <option value="activity">Act</option>
                                </select>
                            </div>
                            <div className="flex gap-1.5">
                               <button onClick={() => addRowAt(idx)} className="flex-1 bg-white border border-slate-200 p-1.5 rounded-lg text-[8px] font-black text-indigo-600"><i className="fas fa-plus"></i></button>
                               <button onClick={() => deleteRow(row.id)} className="flex-1 bg-white border border-slate-200 p-1.5 rounded-lg text-[8px] font-black text-red-500"><i className="fas fa-trash-alt"></i></button>
                            </div>
                         </div>
                      </td>
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

export default Timetable;