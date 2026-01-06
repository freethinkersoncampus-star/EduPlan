
import React, { useState } from 'react';
import { LessonSlot } from '../types';

interface TimetableProps {
  slots: LessonSlot[];
  setSlots: React.Dispatch<React.SetStateAction<LessonSlot[]>>;
}

const Timetable: React.FC<TimetableProps> = ({ slots, setSlots }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const [newSlot, setNewSlot] = useState<Partial<LessonSlot>>({ day: 'Monday' });

  const addSlot = () => {
    if (newSlot.subject && newSlot.startTime && newSlot.endTime) {
      setSlots([...slots, { ...newSlot, id: Date.now().toString() } as LessonSlot]);
      setNewSlot({ day: 'Monday' });
    }
  };

  const deleteSlot = (id: string) => {
    setSlots(slots.filter(s => s.id !== id));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Weekly Timetable</h2>
        <button 
          onClick={() => (document.getElementById('add-slot-modal') as HTMLDialogElement)?.showModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <i className="fas fa-plus mr-2"></i> Add Lesson
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {days.map(day => (
          <div key={day} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-indigo-50 px-4 py-2 border-b border-slate-200 text-center font-bold text-indigo-900">
              {day}
            </div>
            <div className="p-2 space-y-2 min-h-[300px]">
              {slots.filter(s => s.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime)).map(slot => (
                <div key={slot.id} className="p-3 bg-white border-l-4 border-indigo-500 rounded shadow-sm text-sm relative group">
                  <button 
                    onClick={() => deleteSlot(slot.id)}
                    className="absolute top-2 right-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                  <p className="font-bold text-indigo-700 pr-4">{slot.subject}</p>
                  <p className="text-slate-500 font-medium">{slot.grade}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    <i className="far fa-clock mr-1"></i> {slot.startTime} - {slot.endTime}
                  </p>
                </div>
              ))}
              {slots.filter(s => s.day === day).length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 py-10">
                  <i className="fas fa-calendar-day text-3xl mb-2"></i>
                  <p className="text-xs">No lessons</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <dialog id="add-slot-modal" className="rounded-xl p-0 shadow-2xl glass-panel w-full max-w-md overflow-hidden">
        <div className="p-6 bg-indigo-900 text-white flex justify-between items-center">
          <h3 className="text-lg font-bold">Add New Lesson Slot</h3>
          <button onClick={() => (document.getElementById('add-slot-modal') as HTMLDialogElement)?.close()}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="p-6 space-y-4 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Day</label>
              <select 
                className="w-full border rounded-lg p-2"
                value={newSlot.day}
                onChange={e => setNewSlot({...newSlot, day: e.target.value})}
              >
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
              <input 
                type="text" 
                placeholder="e.g. Grade 4"
                className="w-full border rounded-lg p-2"
                value={newSlot.grade || ''}
                onChange={e => setNewSlot({...newSlot, grade: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input 
              type="text" 
              placeholder="e.g. Mathematics"
              className="w-full border rounded-lg p-2"
              value={newSlot.subject || ''}
              onChange={e => setNewSlot({...newSlot, subject: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
              <input 
                type="time" 
                className="w-full border rounded-lg p-2"
                value={newSlot.startTime || ''}
                onChange={e => setNewSlot({...newSlot, startTime: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
              <input 
                type="time" 
                className="w-full border rounded-lg p-2"
                value={newSlot.endTime || ''}
                onChange={e => setNewSlot({...newSlot, endTime: e.target.value})}
              />
            </div>
          </div>
          <button 
            onClick={() => { addSlot(); (document.getElementById('add-slot-modal') as HTMLDialogElement)?.close(); }}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700"
          >
            Save Lesson
          </button>
        </div>
      </dialog>
    </div>
  );
};

export default Timetable;
