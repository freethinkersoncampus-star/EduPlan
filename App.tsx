import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Timetable from './components/Timetable';
import SOWGenerator from './components/SOWGenerator';
import LessonPlanner from './components/LessonPlanner';
import DocumentLibrary from './components/DocumentLibrary';
import StaffManagement from './components/StaffManagement';
import Login from './components/Login';
import { supabase, isSupabaseConfigured, signOut as supabaseSignOut, hasSystemConfig, isUsingManualConfig, clearManualConfig } from './services/supabase';
import { LessonSlot, UserProfile, KnowledgeDocument, SOWRow, SavedSOW, SavedLessonPlan, SavedLessonNote } from './types';

const SYSTEM_CURRICULUM_DOCS: KnowledgeDocument[] = [
  // --- FRAMEWORKS & STANDARDS ---
  { 
    id: 'sys-framework-2025', 
    title: 'National Rationalized Curriculum Framework (Revised 2025)', 
    content: 'Comprehensive framework for all levels (PP1 to Grade 12). Core Competencies: Communication, Self-efficacy, Critical Thinking, Creativity, Citizenship, Digital Literacy, Learning to Learn. Emphasis on Pertinent and Contemporary Issues (PCIs).', 
    type: 'KICD', size: '15.2 MB', date: 'Jan 2025', category: 'Framework', isActiveContext: true, isSystemDoc: true 
  },
  { 
    id: 'sys-kts-standards', 
    title: 'Kenya Professional Standards for Teachers', 
    content: 'Guidelines on teacher professional conduct, pedagogical knowledge, and professional development. Integration of ICT in teaching and learner-centered approaches.', 
    type: 'TSC', size: '3.1 MB', date: '2024', category: 'Standards', isActiveContext: true, isSystemDoc: true 
  },

  // --- PRIMARY SCHOOL (Grades 1-6) ---
  { 
    id: 'sys-pri-lower-literacy', 
    title: 'Primary Grade 1-3 Literacy and Languages', 
    content: 'Lower Primary CBC focus: Developing foundational literacy in English, Kiswahili, and Indigenous Languages. Strands: Listening, Speaking, Reading, and Writing foundational skills.', 
    type: 'PDF', size: '4.5 MB', date: '2024', category: 'Primary', isActiveContext: true, isSystemDoc: true 
  },
  { 
    id: 'sys-pri-lower-math', 
    title: 'Primary Grade 1-3 Mathematics Activities', 
    content: 'Numbers (up to 1000), Measurement (Length, Mass, Capacity), Geometry (Lines, Shapes), and Algebra (Simple patterns).', 
    type: 'PDF', size: '4.2 MB', date: '2024', category: 'Primary', isActiveContext: true, isSystemDoc: true 
  },
  { 
    id: 'sys-pri-upper-science', 
    title: 'Upper Primary (Grades 4-6) Science & Tech', 
    content: 'Strands: Living Things (Plants and Animals), Environment (Pollution), Human Body (Circulatory system), Matter (Physical/Chemical changes), Force and Energy.', 
    type: 'PDF', size: '6.8 MB', date: '2024', category: 'Primary', isActiveContext: true, isSystemDoc: true 
  },

  // --- JUNIOR SECONDARY (Grades 7-9) ---
  { 
    id: 'sys-jss-english', 
    title: 'Junior Secondary (G7-9) English Rationalized', 
    content: 'Strands: Listening and Speaking (Public speaking), Reading (Literary and Non-literary texts), Grammar (Complex structures), Writing (Functional and Creative writing).', 
    type: 'PDF', size: '5.4 MB', date: 'Jan 2025', category: 'Junior Secondary', isActiveContext: true, isSystemDoc: true 
  },
  { 
    id: 'sys-jss-math', 
    title: 'Junior Secondary (G7-9) Mathematics Rationalized', 
    content: 'Strands: Numbers (Integers, Powers), Algebra (Linear inequalities), Geometry (Circles, Pythagoras), Data Handling (Statistics and Probability).', 
    type: 'PDF', size: '6.5 MB', date: 'Jan 2025', category: 'Junior Secondary', isActiveContext: true, isSystemDoc: true 
  },
  { 
    id: 'sys-jss-integrated-science', 
    title: 'Junior Secondary (G7-9) Integrated Science', 
    content: 'Strands: Scientific Investigation, Mixtures, Force and Energy, Living Things, Human Body Systems, Electricity and Magnetism, Space Science.', 
    type: 'PDF', size: '8.2 MB', date: 'Jan 2025', category: 'Junior Secondary', isActiveContext: true, isSystemDoc: true 
  },
  { 
    id: 'sys-jss-social-studies', 
    title: 'Junior Secondary (G7-9) Social Studies', 
    content: 'Strands: The Environment (Map work, Climate), History (Ancient civilizations, Colonization), Citizenship (Governance, Law), Economic Activities (Trade, Tourism).', 
    type: 'PDF', size: '5.9 MB', date: 'Jan 2025', category: 'Junior Secondary', isActiveContext: true, isSystemDoc: true 
  },

  // --- SENIOR SECONDARY (Grades 10-12 Pathways) ---
  { 
    id: 'sys-sss-stem-pathway', 
    title: 'Senior Secondary STEM Pathway Design', 
    content: 'Focused on Pure Sciences (Biology, Chemistry, Physics), Applied Sciences (Agriculture, Home Science), and Mathematics (Core and Elective). Preparation for technical careers.', 
    type: 'PDF', size: '10.5 MB', date: '2025', category: 'Senior Secondary', isActiveContext: true, isSystemDoc: true 
  },
  { 
    id: 'sys-sss-humanities-pathway', 
    title: 'Senior Secondary Social Sciences Pathway', 
    content: 'Focused on Languages, Humanities (History, Geography, Religious Studies), and Business Studies. Preparation for careers in law, public service, and commerce.', 
    type: 'PDF', size: '9.8 MB', date: '2025', category: 'Senior Secondary', isActiveContext: true, isSystemDoc: true 
  },
  { 
    id: 'sys-sss-arts-sports-pathway', 
    title: 'Senior Secondary Arts & Sports Pathway', 
    content: 'Focused on Performing Arts, Visual Arts, and Sports Science. Integration of professional skills for the creative economy and athletic excellence.', 
    type: 'PDF', size: '11.2 MB', date: '2025', category: 'Senior Secondary', isActiveContext: true, isSystemDoc: true 
  }
];

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'online' | 'syncing' | 'offline'>('online');
  
  // Guard 1: Data has finished loading from Cloud
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  // Guard 2: Something has actually changed in THIS session
  const [isDirty, setIsDirty] = useState(false);

  // State for Work / Current Views
  const [currentSow, setCurrentSow] = useState<SOWRow[]>([]);
  const [currentSowMeta, setCurrentSowMeta] = useState({ subject: '', grade: '', term: 1, termStart: new Date().toISOString().split('T')[0] });
  const [plannerPrefill, setPlannerPrefill] = useState<any>(null);
  
  // ARCHIVES
  const [sowHistory, setSowHistory] = useState<SavedSOW[]>([]);
  const [planHistory, setPlanHistory] = useState<SavedLessonPlan[]>([]);
  const [noteHistory, setNoteHistory] = useState<SavedLessonNote[]>([]);
  
  const [profile, setProfile] = useState<UserProfile>({ 
    name: '', 
    tscNumber: '', 
    school: '', 
    subjects: [],
    availableSubjects: [],
    grades: [],
    onboardedStaff: []
  });
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(SYSTEM_CURRICULUM_DOCS);
  const [slots, setSlots] = useState<LessonSlot[]>([]);

  // Auth Listener
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setIsDataInitialized(false);
        setIsDirty(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Data Fetcher
  useEffect(() => {
    if (session?.user && supabase) {
      loadUserData(session.user.id);
    }
  }, [session]);

  const loadUserData = async (userId: string) => {
    if (!supabase) return;
    setSyncStatus('syncing');
    try {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single();
      const { data: appData } = await supabase.from('user_data').select('*').eq('user_id', userId).single();

      if (p) {
        setProfile({
          name: p.name || '',
          tscNumber: p.tsc_number || '',
          school: p.school || '',
          subjects: p.subjects || [],
          onboardedStaff: p.onboarded_staff || [],
          availableSubjects: p.available_subjects || [],
          grades: p.grades || []
        });
      }
      if (appData) {
        setSlots(appData.slots || []);
        setSowHistory(appData.sow_history || []);
        setPlanHistory(appData.plan_history || []);
        setNoteHistory(appData.note_history || []);
        setDocuments([...SYSTEM_CURRICULUM_DOCS, ...(appData.docs || [])]);
      }
      
      // Delay enabling the sync slightly to ensure React has flushed state updates
      setTimeout(() => {
        setIsDataInitialized(true);
        setSyncStatus('online');
      }, 500);
    } catch (err) {
      console.error("Load failed:", err);
      setIsDataInitialized(true); 
      setSyncStatus('offline');
    }
  };

  const syncToCloud = useCallback(async () => {
    // CRITICAL: NEVER SYNC IF NOT INITIALIZED OR NOT DIRTY
    if (!session?.user || !navigator.onLine || !supabase || !isDataInitialized || !isDirty) return;
    
    setSyncStatus('syncing');
    try {
      await supabase.from('profiles').upsert({
        id: session.user.id,
        name: profile.name,
        tsc_number: profile.tscNumber,
        school: profile.school,
        subjects: profile.subjects,
        onboarded_staff: profile.onboardedStaff,
        available_subjects: profile.availableSubjects,
        grades: profile.grades,
        updated_at: new Date().toISOString()
      });

      await supabase.from('user_data').upsert({
        user_id: session.user.id,
        slots,
        sow_history: sowHistory,
        plan_history: planHistory,
        note_history: noteHistory,
        docs: documents.filter(d => !d.isSystemDoc),
        updated_at: new Date().toISOString()
      });

      setSyncStatus('online');
      setIsDirty(false); // Reset dirty flag after successful sync
    } catch (err) {
      console.error("Sync failed:", err);
      setSyncStatus('offline');
    }
  }, [session, profile, slots, sowHistory, planHistory, noteHistory, documents, isDataInitialized, isDirty]);

  // Sync Timer
  useEffect(() => {
    if (!isDataInitialized || !isDirty) return;
    const timer = setTimeout(() => {
      syncToCloud();
    }, 4000); 
    return () => clearTimeout(timer);
  }, [isDirty, syncToCloud, isDataInitialized]);

  // Helper wrappers to trigger dirty flag
  const updateProfile = (p: UserProfile) => { setProfile(p); setIsDirty(true); };
  const updateSlots = (s: LessonSlot[]) => { setSlots(s); setIsDirty(true); };
  const updateSowHistory = (h: SavedSOW[]) => { setSowHistory(h); setIsDirty(true); };
  const updatePlanHistory = (h: SavedLessonPlan[]) => { setPlanHistory(h); setIsDirty(true); };
  const updateNoteHistory = (h: SavedLessonNote[]) => { setNoteHistory(h); setIsDirty(true); };
  const updateDocuments = (d: KnowledgeDocument[]) => { setDocuments(d); setIsDirty(true); };

  const handleLogout = async () => {
    if (confirm("Log out of EduPlan?")) {
      if (supabase) await supabaseSignOut();
      setSession(null);
      setIsDataInitialized(false);
      setIsDirty(false);
      setProfile({ name: '', tscNumber: '', school: '', subjects: [], availableSubjects: [], grades: [], onboardedStaff: [] });
      setSlots([]);
      setSowHistory([]);
      setPlanHistory([]);
      setNoteHistory([]);
      setDocuments(SYSTEM_CURRICULUM_DOCS);
      setActiveTab('dashboard');
    }
  };

  const stats = {
    sowCount: sowHistory.length,
    planCount: planHistory.length,
    subjectCount: profile?.subjects?.length || 0,
    nextLesson: slots.length > 0 ? `${slots[0].subject}` : 'Schedule Empty'
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-[6px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-xl"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Booting EduPlan Pro...</p>
      </div>
    </div>
  );

  if (!session) return <Login />;

  return (
    <div className="flex min-h-screen bg-slate-50 flex-col md:flex-row font-inter">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} onLogout={handleLogout} />
      
      <main className="flex-1 md:ml-64 overflow-y-auto min-h-screen pb-24 md:pb-12 scroll-smooth">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 md:px-12 py-4 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 rounded-full">
              <div className={`w-2 h-2 rounded-full ${syncStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">
                {syncStatus === 'online' ? (isDirty ? 'Changes Pending' : 'Cloud Ready') : syncStatus === 'syncing' ? 'Syncing...' : 'Offline'}
              </span>
            </div>
            {!isDataInitialized && <span className="text-[8px] font-black text-indigo-400 uppercase animate-pulse">Safeguarding Archives...</span>}
          </div>
          
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setIsProfileModalOpen(true)}>
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-black text-slate-700 leading-none mb-1 uppercase tracking-tight">{profile.name || session.user.email?.split('@')[0]}</p>
              <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest leading-none">{profile.school || 'Set School Name'}</p>
            </div>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`} className="w-9 h-9 rounded-xl border-2 border-indigo-50 shadow-sm" alt="Profile" />
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard stats={stats} slots={slots} user={profile} onNavigate={setActiveTab} />}
          {activeTab === 'registry' && <StaffManagement profile={profile} setProfile={updateProfile} />}
          {activeTab === 'timetable' && <Timetable slots={slots} setSlots={updateSlots} profile={profile} setProfile={updateProfile} />}
          {activeTab === 'sow' && (
            <SOWGenerator 
              timetableSlots={slots} 
              knowledgeContext={documents.filter(d => d.isActiveContext).map(d => d.content).join('\n\n')} 
              persistedSow={currentSow}
              setPersistedSow={setCurrentSow}
              persistedMeta={currentSowMeta}
              setPersistedMeta={setCurrentSowMeta}
              onPrefillPlanner={(data) => { setPlannerPrefill(data); setActiveTab('lesson-planner'); }}
              userProfile={profile}
              history={sowHistory}
              setHistory={updateSowHistory}
            />
          )}
          {activeTab === 'lesson-planner' && (
            <LessonPlanner 
              knowledgeContext={documents.filter(d => d.isActiveContext).map(d => d.content).join('\n\n')} 
              prefill={plannerPrefill}
              onClearPrefill={() => setPlannerPrefill(null)}
              userProfile={profile}
              savedPlans={planHistory}
              setSavedPlans={updatePlanHistory}
              savedNotes={noteHistory}
              setSavedNotes={updateNoteHistory}
            />
          )}
          {activeTab === 'documents' && <DocumentLibrary documents={documents} setDocuments={updateDocuments} />}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 flex justify-around items-center p-3 z-50 shadow-2xl">
        {['dashboard', 'registry', 'timetable', 'sow', 'lesson-planner', 'documents'].map((id) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === id ? 'text-indigo-600 scale-110' : 'text-slate-400 opacity-60'}`}>
            <i className={`fas fa-${id === 'dashboard' ? 'th-large' : id === 'registry' ? 'school' : id === 'timetable' ? 'calendar-alt' : id === 'sow' ? 'file-signature' : id === 'lesson-planner' ? 'book-open' : 'folder-open'} text-lg`}></i>
            <span className="text-[8px] font-black uppercase tracking-tighter">{id.substring(0,4)}</span>
          </button>
        ))}
      </nav>

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-indigo-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-10 bg-indigo-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-1">Teacher Account</h3>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">Profile Sync</p>
              </div>
              <button onClick={() => setIsProfileModalOpen(false)} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Full Legal Name</label>
                <input type="text" className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 text-sm font-black outline-none focus:border-indigo-600 transition" value={profile.name} onChange={e => updateProfile({...profile, name: e.target.value})} placeholder="e.g. Ms. Jane Doe" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">TSC Professional ID</label>
                <input type="text" className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 text-sm font-black outline-none focus:border-indigo-600 transition" value={profile.tscNumber} onChange={e => updateProfile({...profile, tscNumber: e.target.value})} placeholder="7654321" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Current Institution</label>
                <input type="text" className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 text-sm font-black outline-none focus:border-indigo-600 transition" value={profile.school} onChange={e => updateProfile({...profile, school: e.target.value})} placeholder="Mombasa Academy" />
              </div>

              <div className="pt-6 border-t">
                 <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Connectivity Diagnostics</h4>
                 <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-bold text-slate-500 uppercase">System Config:</span>
                       <span className={`text-[9px] font-black uppercase ${hasSystemConfig ? 'text-emerald-500' : 'text-red-400'}`}>
                         {hasSystemConfig ? 'Linked' : 'Not Found'}
                       </span>
                    </div>
                 </div>
              </div>

              <button onClick={() => setIsProfileModalOpen(false)} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition duration-300 mt-4">Save & Sync Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;