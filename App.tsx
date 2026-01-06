
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Timetable from './components/Timetable';
import SOWGenerator from './components/SOWGenerator';
import LessonPlanner from './components/LessonPlanner';
import DocumentLibrary from './components/DocumentLibrary';
import { LessonSlot, UserProfile, KnowledgeDocument } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Profile State
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('eduplan_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Jane M. Doe',
      tscNumber: '12345678',
      school: 'Westlands Primary School'
    };
  });

  // Knowledge Documents State
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(() => {
    const saved = localStorage.getItem('eduplan_docs');
    return saved ? JSON.parse(saved) : [];
  });

  // Timetable State
  const [slots, setSlots] = useState<LessonSlot[]>(() => {
    const saved = localStorage.getItem('eduplan_slots');
    return saved ? JSON.parse(saved) : [
      { id: '1', day: 'Monday', startTime: '08:00', endTime: '08:40', subject: 'Mathematics', grade: 'Grade 4' },
      { id: '2', day: 'Monday', startTime: '08:40', endTime: '09:20', subject: 'English', grade: 'Grade 4' },
      { id: '3', day: 'Tuesday', startTime: '10:20', endTime: '11:00', subject: 'Mathematics', grade: 'Grade 4' },
    ];
  });

  // Persist Data
  useEffect(() => localStorage.setItem('eduplan_slots', JSON.stringify(slots)), [slots]);
  useEffect(() => localStorage.setItem('eduplan_profile', JSON.stringify(profile)), [profile]);
  useEffect(() => localStorage.setItem('eduplan_docs', JSON.stringify(documents)), [documents]);

  // Extract combined active knowledge context for the AI
  const knowledgeContext = documents
    .filter(d => d.isActiveContext)
    .map(d => `SOURCE: ${d.title}\nCONTENT: ${d.content}`)
    .join('\n\n---\n\n');

  const stats = {
    sowCount: JSON.parse(localStorage.getItem('eduplan_sow_history') || '[]').length,
    planCount: JSON.parse(localStorage.getItem('eduplan_plan_history') || '[]').length,
    subjectCount: new Set(slots.map(s => s.subject)).size,
    nextLesson: slots.length > 0 ? `${slots[0].subject} @ ${slots[0].startTime}` : 'No lessons'
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} slots={slots} user={profile} />;
      case 'timetable':
        return <Timetable slots={slots} setSlots={setSlots} />;
      case 'sow':
        return <SOWGenerator timetableSlots={slots} knowledgeContext={knowledgeContext} />;
      case 'lesson-planner':
        return <LessonPlanner knowledgeContext={knowledgeContext} />;
      case 'documents':
        return <DocumentLibrary documents={documents} setDocuments={setDocuments} />;
      default:
        return <Dashboard stats={stats} slots={slots} user={profile} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} />
      
      <main className="flex-1 ml-64 overflow-y-auto min-h-screen pb-12">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center print:hidden">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Platform / {activeTab}</span>
          </div>
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-2 rounded-xl transition"
              onClick={() => setIsProfileModalOpen(true)}
            >
              <div className="text-right">
                <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600">{profile.name}</p>
                <p className="text-[10px] font-bold text-indigo-500 uppercase">TSC: {profile.tscNumber}</p>
              </div>
              <img src={`https://picsum.photos/seed/${profile.tscNumber}/100/100`} className="w-10 h-10 rounded-full border-2 border-indigo-100 shadow-sm" alt="Profile" />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-indigo-900 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Edit Professional Profile</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="hover:rotate-90 transition duration-200">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full border p-3 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={profile.name} 
                  onChange={e => setProfile({...profile, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">TSC Number</label>
                <input 
                  type="text" 
                  className="w-full border p-3 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={profile.tscNumber} 
                  onChange={e => setProfile({...profile, tscNumber: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Current School</label>
                <input 
                  type="text" 
                  className="w-full border p-3 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={profile.school} 
                  onChange={e => setProfile({...profile, school: e.target.value})}
                />
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition mt-4"
              >
                Update Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
