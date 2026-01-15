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
  { id: 'kicd-pp-lang', title: 'PP1-PP2: Language Activities Design', content: 'Focus: Pre-reading, pre-writing, listening and speaking skills. Competencies: Communication and Collaboration.', type: 'KICD', size: '2.1 MB', date: '2025', category: 'Pre-Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'kicd-pp-math', title: 'PP1-PP2: Mathematical Activities Design', content: 'Focus: Classification, number recognition, simple patterns, and measurement activities.', type: 'KICD', size: '1.8 MB', date: '2025', category: 'Pre-Primary', isActiveContext: true, isSystemDoc: true },
  
  // LOWER PRIMARY
  { id: 'kicd-lp-eng', title: 'Grade 1-3: English Language Design', content: 'Rationalized Focus: Literacy, grammar foundation, and creative writing. Focus on core competencies.', type: 'KICD', size: '3.4 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'kicd-lp-env', title: 'Grade 1-3: Environmental Activities Design', content: 'Social and natural environment, health, safety and nutrition integrated into daily experiences.', type: 'KICD', size: '2.9 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true },

  // UPPER PRIMARY
  { id: 'kicd-up-science', title: 'Grade 4-6: Science & Technology Design', content: 'Key Strands: Living things, the environment, matter, energy, and digital literacy application.', type: 'KICD', size: '4.2 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'kicd-up-agri', title: 'Grade 4-6: Agriculture & Nutrition Design', content: 'Integrated subject covering soil, crop production, animal rearing, and basic human nutrition.', type: 'KICD', size: '3.8 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },

  // JUNIOR SCHOOL
  { id: 'kicd-js-intsci', title: 'Grade 7-9: Integrated Science Design', content: 'Rationalized: Physics, Chemistry, and Biology combined with emphasis on inquiry-based learning.', type: 'KICD', size: '5.1 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true },
  { id: 'kicd-js-pretech', title: 'Grade 7-9: Pre-Technical Studies Design', content: 'Foundations of Engineering, Woodwork, Metalwork, and Electronics. Focus on career pathways.', type: 'KICD', size: '6.2 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true },
  { id: 'kicd-js-creative', title: 'Grade 7-9: Creative Arts & Sports Design', content: 'Integrated approach to Art, Music, Theatre, and Physical Education for holistic development.', type: 'KICD', size: '4.9 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true },

  // SENIOR SCHOOL
  { id: 'kicd-ss-stem', title: 'Grade 10-12: STEM Pathway Framework', content: 'Specialized focus on Pure Sciences, Applied Sciences, Mathematics, and Technical Studies.', type: 'KICD', size: '7.5 MB', date: '2025', category: 'Senior School', isActiveContext: true, isSystemDoc: true },
  { id: 'kicd-ss-arts', title: 'Grade 10-12: Arts & Sports Science Pathway', content: 'Focus on Performing Arts, Visual Arts, and Sports Science careers and industry integration.', type: 'KICD', size: '6.8 MB', date: '2025', category: 'Senior School', isActiveContext: true, isSystemDoc: true },
  { id: 'kicd-ss-social', title: 'Grade 10-12: Social Sciences Pathway', content: 'Humanities, Languages, and Business Studies. Focus on global citizenship and leadership.', type: 'KICD', size: '6.5 MB', date: '2025', category: 'Senior School', isActiveContext: true, isSystemDoc: true },

  // GENERAL FRAMEWORK
  { id: 'kicd-core-comp', title: 'Kenya National Curriculum Framework (2024)', content: 'The overarching document for CBE implementation. Outlines 7 core competencies and values.', type: 'KICD', size: '15.2 MB', date: '2024', category: 'Framework', isActiveContext: true, isSystemDoc: true }
];

const LOCAL_STORAGE_KEY = 'eduplan_backup_data';

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
      
      <main className="flex-1 md:ml-64 overflow-y-auto min-h-screen pb-24 md:pb-12 scroll-smooth">
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
      </main>
    </div>
  );
};

export default App;