
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Timetable from './components/Timetable';
import SOWGenerator from './components/SOWGenerator';
import LessonPlanner from './components/LessonPlanner';
import DocumentLibrary from './components/DocumentLibrary';
import StaffManagement from './components/StaffManagement';
import { LessonSlot, UserProfile, KnowledgeDocument, SOWRow } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Persisted SOW State
  const [currentSow, setCurrentSow] = useState<SOWRow[]>([]);
  const [currentSowMeta, setCurrentSowMeta] = useState({
    subject: 'Integrated Science',
    grade: '8',
    term: 2,
    termStart: '2025-05-05',
    termEnd: '2025-08-01',
    halfTermStart: '2025-06-23',
    halfTermEnd: '2025-06-27'
  });

  // Planner Prefill State
  const [plannerPrefill, setPlannerPrefill] = useState<{
    subject: string;
    grade: string;
    strand: string;
    subStrand: string;
    autoTrigger: 'plan' | 'notes' | null;
  } | null>(null);
  
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('eduplan_profile');
    if (saved) return JSON.parse(saved);
    return {
      name: '',
      tscNumber: '',
      school: '',
      isMasterAdmin: true,
      onboardedStaff: [],
      subjects: [],
      grades: []
    };
  });

  const [documents, setDocuments] = useState<KnowledgeDocument[]>(() => {
    const saved = localStorage.getItem('eduplan_docs');
    return saved ? JSON.parse(saved) : [];
  });

  const [slots, setSlots] = useState<LessonSlot[]>(() => {
    const saved = localStorage.getItem('eduplan_slots');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (!profile.name || !profile.tscNumber) {
      setIsProfileModalOpen(true);
    }
  }, []);

  useEffect(() => localStorage.setItem('eduplan_slots', JSON.stringify(slots)), [slots]);
  useEffect(() => localStorage.setItem('eduplan_profile', JSON.stringify(profile)), [profile]);
  useEffect(() => localStorage.setItem('eduplan_docs', JSON.stringify(documents)), [documents]);

  const knowledgeContext = documents
    .filter(d => d.isActiveContext)
    .map(d => `SOURCE: ${d.title}\nCONTENT: ${d.content}`)
    .join('\n\n---\n\n');

  const handlePrefillPlanner = (data: any) => {
    setPlannerPrefill(data);
    setActiveTab('lesson-planner');
  };

  const stats = {
    sowCount: JSON.parse(localStorage.getItem('eduplan_sow_history') || '[]').length,
    planCount: JSON.parse(localStorage.getItem('eduplan_plan_history') || '[]').length,
    subjectCount: new Set(slots.map(s => s.subject)).size,
    nextLesson: slots.length > 0 ? `${slots[0].subject} @ ${slots[0].startTime}` : 'No lessons'
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard stats={stats} slots={slots} user={profile} />;
      case 'timetable': return <Timetable slots={slots} setSlots={setSlots} profile={profile} />;
      case 'sow': 
        return (
          <SOWGenerator 
            timetableSlots={slots} 
            knowledgeContext={knowledgeContext} 
            persistedSow={currentSow}
            setPersistedSow={setCurrentSow}
            persistedMeta={currentSowMeta}
            setPersistedMeta={setCurrentSowMeta}
            onPrefillPlanner={handlePrefillPlanner}
          />
        );
      case 'lesson-planner': 
        return (
          <LessonPlanner 
            knowledgeContext={knowledgeContext} 
            prefill={plannerPrefill}
            onClearPrefill={() => setPlannerPrefill(null)}
          />
        );
      case 'documents': return <DocumentLibrary documents={documents} setDocuments={setDocuments} />;
      case 'staff': return <StaffManagement profile={profile} setProfile={setProfile} />;
      default: return <Dashboard stats={stats} slots={slots} user={profile} />;
    }
  };

  const navItems = [
    { id: 'dashboard', icon: 'fa-th-large', label: 'Home' },
    { id: 'timetable', icon: 'fa-calendar-alt', label: 'Time' },
    { id: 'sow', icon: 'fa-file-signature', label: 'SOW' },
    { id: 'lesson-planner', icon: 'fa-book-open', label: 'Planner' },
    { id: 'documents', icon: 'fa-folder-open', label: 'Docs' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 flex-col md:flex-row">
      {/* Sidebar - Hidden on Mobile */}
      <div className="hidden md:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 overflow-y-auto min-h-screen pb-24 md:pb-12">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="md:hidden w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest truncate max-w-[100px] md:max-w-none">
              {activeTab}
            </span>
            {profile.isMasterAdmin && (
              <span className="hidden sm:inline-block bg-amber-100 text-amber-700 text-[8px] md:text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Master</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 md:gap-6">
            <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={() => setIsProfileModalOpen(true)}>
              <div className="text-right hidden sm:block">
                <p className="text-xs md:text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition">{profile.name || 'Set Name'}</p>
                <p className="text-[9px] md:text-[10px] font-bold text-indigo-500 uppercase">{profile.school || 'Set School'}</p>
              </div>
              <img src={`https://picsum.photos/seed/${profile.tscNumber || 'def'}/100/100`} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-indigo-100 shadow-sm" alt="Profile" />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-2 md:px-0">
          {renderContent()}
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 flex justify-around items-center p-3 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === item.id ? 'text-indigo-600 scale-110' : 'text-slate-400'
            }`}
          >
            <i className={`fas ${item.icon} text-lg`}></i>
            <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
        {profile.isMasterAdmin && (
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === 'staff' ? 'text-indigo-600 scale-110' : 'text-slate-400'
            }`}
          >
            <i className="fas fa-user-tie text-lg"></i>
            <span className="text-[9px] font-bold uppercase tracking-tighter">Staff</span>
          </button>
        )}
      </nav>

      {/* Initialization Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-indigo-900 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Admin Initialization</h3>
            </div>
            <div className="p-6 md:p-8 space-y-4">
              <p className="text-[10px] md:text-xs text-indigo-600 bg-indigo-50 p-3 rounded-xl font-medium">
                <i className="fas fa-info-circle mr-2"></i>
                You are the Master Admin. Fill in these details to set up your school environment.
              </p>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <input type="text" className="w-full border p-3 rounded-xl bg-slate-50 text-sm" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="e.g. Principal Omari" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">TSC Number</label>
                <input type="text" className="w-full border p-3 rounded-xl bg-slate-50 text-sm" value={profile.tscNumber} onChange={e => setProfile({...profile, tscNumber: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">School Name</label>
                <input type="text" className="w-full border p-3 rounded-xl bg-slate-50 text-sm" value={profile.school} onChange={e => setProfile({...profile, school: e.target.value})} />
              </div>
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                disabled={!profile.name || !profile.tscNumber || !profile.school}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                Complete Initialization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
