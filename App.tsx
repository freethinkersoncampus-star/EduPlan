
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Timetable from './components/Timetable';
import SOWGenerator from './components/SOWGenerator';
import LessonPlanner from './components/LessonPlanner';
import DocumentLibrary from './components/DocumentLibrary';
import { LessonSlot } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Load initial slots from localStorage or use defaults
  const [slots, setSlots] = useState<LessonSlot[]>(() => {
    const saved = localStorage.getItem('eduplan_slots');
    return saved ? JSON.parse(saved) : [
      { id: '1', day: 'Monday', startTime: '08:00', endTime: '08:40', subject: 'Mathematics', grade: 'Grade 4' },
      { id: '2', day: 'Monday', startTime: '08:40', endTime: '09:20', subject: 'English', grade: 'Grade 4' },
      { id: '3', day: 'Tuesday', startTime: '10:20', endTime: '11:00', subject: 'Mathematics', grade: 'Grade 4' },
      { id: '4', day: 'Wednesday', startTime: '11:40', endTime: '12:20', subject: 'Science & Tech', grade: 'Grade 6' },
    ];
  });

  // Persist slots whenever they change
  useEffect(() => {
    localStorage.setItem('eduplan_slots', JSON.stringify(slots));
  }, [slots]);

  const stats = {
    sowCount: 12, // This could be dynamically linked if SOWs were saved to a list
    planCount: 45,
    subjectCount: new Set(slots.map(s => s.subject)).size,
    nextLesson: slots.length > 0 ? `${slots[0].subject} @ ${slots[0].startTime}` : 'No lessons'
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} slots={slots} />;
      case 'timetable':
        return <Timetable slots={slots} setSlots={setSlots} />;
      case 'sow':
        return <SOWGenerator timetableSlots={slots} />;
      case 'lesson-planner':
        return <LessonPlanner />;
      case 'documents':
        return <DocumentLibrary />;
      case 'notes':
        return (
          <div className="p-20 text-center">
            <i className="fas fa-tools text-6xl text-slate-200 mb-4"></i>
            <h2 className="text-2xl font-bold text-slate-400">Subject Notes Feature</h2>
            <p className="text-slate-400">Please use the Lesson Planner to generate notes for now.</p>
          </div>
        );
      default:
        return <Dashboard stats={stats} slots={slots} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 overflow-y-auto min-h-screen pb-12">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center print:hidden">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Platform / {activeTab}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <i className="fas fa-bell text-slate-400 text-lg hover:text-indigo-600 transition cursor-pointer"></i>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600">Jane M. Doe</p>
                <p className="text-[10px] font-bold text-indigo-500 uppercase">Pro Teacher</p>
              </div>
              <img src="https://picsum.photos/seed/teacher/100/100" className="w-10 h-10 rounded-full border-2 border-indigo-100 shadow-sm" alt="Profile" />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
