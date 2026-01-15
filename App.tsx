
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Timetable from './components/Timetable';
import SOWGenerator from './components/SOWGenerator';
import LessonPlanner from './components/LessonPlanner';
import DocumentLibrary from './components/DocumentLibrary';
import StaffManagement from './components/StaffManagement';
import Login from './components/Login';
import { supabase, signOut as supabaseSignOut } from './services/supabase';
import { LessonSlot, UserProfile, KnowledgeDocument, SOWRow, SavedSOW, SavedLessonPlan, SavedLessonNote } from './types';

const SYSTEM_CURRICULUM_DOCS: KnowledgeDocument[] = [
  // PRE-PRIMARY
  { id: 'pp-lang', title: 'Language Activities (PP1-PP2)', content: 'KICD Design: Pre-reading, listening, and speaking skills for early learners.', type: 'KICD', size: '2.1 MB', date: '2025', category: 'Pre-Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'pp-math', title: 'Mathematical Activities (PP1-PP2)', content: 'KICD Design: Classification, number recognition, and simple pattern awareness.', type: 'KICD', size: '1.9 MB', date: '2025', category: 'Pre-Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'pp-env', title: 'Environmental Activities (PP1-PP2)', content: 'KICD Design: Exploration of the immediate natural and social environment.', type: 'KICD', size: '2.0 MB', date: '2025', category: 'Pre-Primary', isActiveContext: true, isSystemDoc: true },

  // LOWER PRIMARY (Grade 1-3)
  { id: 'lp-literacy', title: 'Literacy (Grade 1-3)', content: 'Rationalized Design: Foundational reading and writing in English and Kiswahili.', type: 'KICD', size: '3.1 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'lp-math', title: 'Mathematics (Grade 1-3)', content: 'Rationalized Design: Operations, measurement, and geometry foundations.', type: 'KICD', size: '3.4 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'lp-hygiene', title: 'Hygiene and Nutrition (Grade 1-3)', content: 'Rationalized Design: Healthy living habits and basic nutrition for young learners.', type: 'KICD', size: '2.8 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true },

  // UPPER PRIMARY (Grade 4-6)
  { id: 'up-science', title: 'Science & Technology (Grade 4-6)', content: 'Rationalized Design: Inquiry-based exploration of biological and physical science concepts.', type: 'KICD', size: '4.5 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'up-agri', title: 'Agriculture & Nutrition (Grade 4-6)', content: 'Rationalized Design: Integrated approach to farming practices and human nutrition.', type: 'KICD', size: '4.1 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'up-social', title: 'Social Studies (Grade 4-6)', content: 'Rationalized Design: Understanding community, history, and geographical environment.', type: 'KICD', size: '3.9 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },

  // JUNIOR SCHOOL (Grade 7-9)
  { id: 'js-int-science', title: 'Integrated Science (Grade 7-9)', content: 'Rationalized Design: Combined Physics, Chemistry, and Biology for technical foundation.', type: 'KICD', size: '5.2 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true },
  { id: 'js-pre-tech', title: 'Pre-Technical Studies (Grade 7-9)', content: 'Rationalized Design: Engineering, woodwork, and metalwork foundations.', type: 'KICD', size: '6.4 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true },
  { id: 'js-bus-studies', title: 'Business Studies (Grade 7-9)', content: 'Rationalized Design: Entrepreneurship, financial literacy, and trade basics.', type: 'KICD', size: '4.8 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true },

  // SENIOR SCHOOL (Grade 10-12)
  { id: 'ss-pathway-stem', title: 'STEM Pathway: Pure Sciences (G10-12)', content: 'KICD Senior School Design: Specialized Physics, Chemistry, and Biology designs.', type: 'KICD', size: '7.8 MB', date: '2025', category: 'Senior School', isActiveContext: true, isSystemDoc: true },
  { id: 'ss-pathway-arts', title: 'Arts & Sports Science Pathway (G10-12)', content: 'KICD Senior School Design: Performing Arts, Visual Arts, and Physical Education specialization.', type: 'KICD', size: '7.2 MB', date: '2025', category: 'Senior School', isActiveContext: true, isSystemDoc: true },
  { id: 'ss-pathway-social', title: 'Social Sciences Pathway (G10-12)', content: 'KICD Senior School Design: Humanities, Languages, and Global Citizenship focus.', type: 'KICD', size: '6.9 MB', date: '2025', category: 'Senior School', isActiveContext: true, isSystemDoc: true }
];

const LOCAL_STORAGE_KEY = 'eduplan_backup_data';

const MobileNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => (
  <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
    {[
      { id: 'dashboard', icon: 'fa-th-large', label: 'Home' },
      { id: 'timetable', icon: 'fa-calendar-alt', label: 'Schedule' },
      { id: 'sow', icon: 'fa-file-signature', label: 'Schemes' },
      { id: 'lesson-planner', icon: 'fa-book-open', label: 'Planner' },
      { id: 'documents', icon: 'fa-folder-open', label: 'Vault' },
    ].map(item => (
      <button 
        key={item.id} 
        onClick={() => setActiveTab(item.id)}
        className="flex flex-col items-center gap-1.5"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400'}`}>
          <i className={`fas ${item.icon} text-sm`}></i>
        </div>
        <span className={`text-[8px] font-black uppercase tracking-widest ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>{item.label}</span>
      </button>
    ))}
  </nav>
);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'online' | 'syncing' | 'offline'>('online');
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [currentSow, setCurrentSow] = useState<SOWRow[]>([]);
  const [currentSowMeta, setCurrentSowMeta] = useState({ subject: '', grade: '', term: 1, termStart: new Date().toISOString().split('T')[0] });
  const [plannerPrefill, setPlannerPrefill] = useState<any>(null);
  
  const getInitialState = (key: string, fallback: any) => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return fallback;
    try {
      const parsed = JSON.parse(saved);
      return parsed[key] || fallback;
    } catch { return fallback; }
  };

  const [sowHistory, setSowHistory] = useState<SavedSOW[]>(() => getInitialState('sowHistory', []));
  const [planHistory, setPlanHistory] = useState<SavedLessonPlan[]>(() => getInitialState('planHistory', []));
  const [noteHistory, setNoteHistory] = useState<SavedLessonNote[]>(() => getInitialState('noteHistory', []));
  const [profile, setProfile] = useState<UserProfile>(() => getInitialState('profile', { 
    name: '', tscNumber: '', school: '', subjects: [], availableSubjects: [], grades: [], onboardedStaff: [] 
  }));
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(() => [...SYSTEM_CURRICULUM_DOCS, ...getInitialState('documents', [])]);
  const [slots, setSlots] = useState<LessonSlot[]>(() => getInitialState('slots', []));

  useEffect(() => {
    if (!isHydrated) return;
    const backup = {
      sowHistory, planHistory, noteHistory, profile, slots,
      documents: documents.filter(d => !d.isSystemDoc)
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(backup));
  }, [sowHistory, planHistory, noteHistory, profile, slots, documents, isHydrated]);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setIsHydrated(false);
        setIsDirty(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user && supabase) {
      loadFromCloud(session.user.id);
    }
  }, [session]);

  const loadFromCloud = async (userId: string) => {
    if (!supabase) return;
    setSyncStatus('syncing');
    try {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single();
      const { data: d } = await supabase.from('user_data').select('*').eq('user_id', userId).single();

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
      if (d) {
        if (d.slots) setSlots(d.slots);
        if (d.sow_history) setSowHistory(d.sow_history);
        if (d.plan_history) setPlanHistory(d.plan_history);
        if (d.note_history) setNoteHistory(d.note_history);
        if (d.docs) setDocuments([...SYSTEM_CURRICULUM_DOCS, ...d.docs]);
      }
      
      setIsHydrated(true);
      setSyncStatus('online');
    } catch (err) {
      console.error("Cloud hydration failed:", err);
      setIsHydrated(true);
      setSyncStatus('offline');
    }
  };

  const syncToCloud = useCallback(async () => {
    if (!session?.user || !supabase || !isHydrated || !isDirty) return;
    
    const isStateEmpty = sowHistory.length === 0 && planHistory.length === 0 && slots.length === 0;
    if (isStateEmpty && isDirty) return;

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
      setIsDirty(false);
    } catch (err) {
      console.error("Cloud sync failed:", err);
      setSyncStatus('offline');
    }
  }, [session, profile, slots, sowHistory, planHistory, noteHistory, documents, isHydrated, isDirty]);

  useEffect(() => {
    if (!isHydrated || !isDirty) return;
    const timer = setTimeout(() => syncToCloud(), 4000);
    return () => clearTimeout(timer);
  }, [isDirty, syncToCloud, isHydrated]);

  const wrapUpdate = (fn: Function) => (val: any) => { fn(val); setIsDirty(true); };

  const handleLogout = async () => {
    if (confirm("Logout? Changes not yet synced will be kept in local cache.")) {
      if (supabase) await supabaseSignOut();
      setSession(null);
      setIsHydrated(false);
      setIsDirty(false);
      setActiveTab('dashboard');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading EduPlan...</p>
      </div>
    </div>
  );

  if (!session) return <Login />;

  return (
    <div className="flex min-h-screen bg-slate-50 flex-col md:flex-row font-inter">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} onLogout={handleLogout} />
      
      <main className="flex-1 md:ml-64 overflow-y-auto min-h-screen pb-32 md:pb-12 scroll-smooth">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 md:px-12 py-4 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full ${isDirty ? 'bg-amber-50' : 'bg-emerald-50'}`}>
              <div className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : isDirty ? 'bg-amber-400' : 'bg-emerald-500'}`}></div>
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">
                {syncStatus === 'syncing' ? 'Syncing...' : isDirty ? 'Pending Save' : 'Cloud Synced'}
              </span>
            </div>
            {!isHydrated && <span className="text-[8px] font-black text-indigo-400 uppercase animate-pulse">Fetching Cloud Data...</span>}
          </div>
          
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setIsProfileModalOpen(true)}>
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-black text-slate-700 leading-none mb-1 uppercase tracking-tight">{profile.name || 'Teacher'}</p>
              <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest leading-none">{profile.school || 'Private Institution'}</p>
            </div>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`} className="w-9 h-9 rounded-xl border-2 border-indigo-50 shadow-sm" alt="Profile" />
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard stats={{ sowCount: sowHistory.length, planCount: planHistory.length, subjectCount: profile.subjects.length, nextLesson: slots.length > 0 ? slots[0].subject : 'None' }} slots={slots} user={profile} onNavigate={setActiveTab} />}
          {activeTab === 'registry' && <StaffManagement profile={profile} setProfile={wrapUpdate(setProfile)} />}
          {activeTab === 'timetable' && <Timetable slots={slots} setSlots={wrapUpdate(setSlots)} profile={profile} setProfile={wrapUpdate(setProfile)} />}
          {activeTab === 'sow' && (
            <SOWGenerator 
              timetableSlots={slots} 
              knowledgeContext={documents.filter(d => d.isActiveContext).map(d => d.content).join('\n\n')} 
              persistedSow={currentSow} setPersistedSow={setCurrentSow}
              persistedMeta={currentSowMeta} setPersistedMeta={setCurrentSowMeta}
              onPrefillPlanner={(data) => { setPlannerPrefill(data); setActiveTab('lesson-planner'); }}
              userProfile={profile} history={sowHistory} setHistory={wrapUpdate(setSowHistory)}
            />
          )}
          {activeTab === 'lesson-planner' && (
            <LessonPlanner 
              knowledgeContext={documents.filter(d => d.isActiveContext).map(d => d.content).join('\n\n')} 
              prefill={plannerPrefill} onClearPrefill={() => setPlannerPrefill(null)}
              userProfile={profile} savedPlans={planHistory} setSavedPlans={wrapUpdate(setPlanHistory)}
              savedNotes={noteHistory} setSavedNotes={wrapUpdate(setNoteHistory)}
            />
          )}
          {activeTab === 'documents' && <DocumentLibrary documents={documents} setDocuments={wrapUpdate(setDocuments)} />}
        </div>

        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </main>
    </div>
  );
};

export default App;
