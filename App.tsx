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
  { 
    id: 'kicd-eyp-2025', 
    title: 'KICD Early Years Education (PP1-PP2) Design', 
    content: 'Rationalized Learning Areas for Early Years: 1. Language Activities 2. Mathematical Activities 3. Environmental Activities 4. Psychomotor and Creative Activities 5. Religious Education Activities. Focus: Transition from home to school, basic literacy, numeracy, and social-emotional development.', 
    type: 'KICD', size: '12.4 MB', date: '2025', category: 'Pre-Primary', isActiveContext: true, isSystemDoc: true 
  },
  { 
    id: 'kicd-lp-2025', 
    title: 'KICD Lower Primary (Grade 1-3) Design', 
    content: 'Learning Areas: Literacy, Kiswahili/KSL, English, Mathematics, Environmental Activities, Hygiene and Nutrition, Religious Education (CRE/IRE/HRE), Creative Activities (Art, Craft, Music), Physical and Health Education. Focus: Core competencies including Communication, Collaboration, and Critical Thinking.', 
    type: 'KICD', size: '18.7 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true 
  },
  { 
    id: 'kicd-up-2025', 
    title: 'KICD Upper Primary (Grade 4-6) Design', 
    content: 'Rationalized Subjects: English, Kiswahili/KSL, Mathematics, Science and Technology, Agriculture and Nutrition, Social Studies, Religious Education, Creative Arts (Art, Craft, Music, Theatre), Physical and Health Education. Learning outcomes focus on applying knowledge to real-life situations.', 
    type: 'KICD', size: '22.1 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true 
  },
  { 
    id: 'kicd-js-2025', 
    title: 'KICD Junior School (Grade 7-9) Design', 
    content: 'Core Learning Areas: English, Kiswahili/KSL, Mathematics, Pre-Technical Studies, Integrated Science, Social Studies, Agriculture and Nutrition, Religious Education, Business Studies, Life Skills Education, Physical Education and Sports, Creative Arts and Sports. Focus: Career exploration and technical skill foundation.', 
    type: 'KICD', size: '34.5 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true 
  },
  { 
    id: 'kicd-rationalization-memo', 
    title: 'Official Rationalization of Learning Areas (2024 Update)', 
    content: 'Directive on reducing the number of subjects to ease learner workload. Upper Primary reduced to 8 subjects. Junior School reduced to 9 subjects. This document outlines the integration of Home Science into Agriculture and Nutrition, and the merging of Creative Arts.', 
    type: 'KICD', size: '4.2 MB', date: 'Dec 2024', category: 'Official Memo', isActiveContext: true, isSystemDoc: true 
  },
  { 
    id: 'sys-kts-standards', 
    title: 'Kenya Professional Standards for Teachers', 
    content: 'Guidelines on teacher professional conduct, pedagogical knowledge, and professional development. Teachers are required to use learner-centered approaches and maintain digital records of learner progress (Formative Assessment).', 
    type: 'TSC', size: '3.1 MB', date: '2024', category: 'Standards', isActiveContext: true, isSystemDoc: true 
  }
];

const LOCAL_STORAGE_KEY = 'eduplan_backup_data';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'online' | 'syncing' | 'offline'>('online');
  
  // LOCK 1: Hydration Guard (Is the cloud data loaded?)
  const [isHydrated, setIsHydrated] = useState(false);
  // LOCK 2: Dirty Flag (Have we made changes THIS session?)
  const [isDirty, setIsDirty] = useState(false);

  // States
  const [currentSow, setCurrentSow] = useState<SOWRow[]>([]);
  const [currentSowMeta, setCurrentSowMeta] = useState({ subject: '', grade: '', term: 1, termStart: new Date().toISOString().split('T')[0] });
  const [plannerPrefill, setPlannerPrefill] = useState<any>(null);
  
  // Archives with Initial LocalStorage Hydration (Safety Net)
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

  // LocalStorage Mirroring (Instant Buffer)
  useEffect(() => {
    if (!isHydrated) return; // Don't backup if we haven't even finished loading the cloud data
    const backup = {
      sowHistory, planHistory, noteHistory, profile, slots,
      documents: documents.filter(d => !d.isSystemDoc)
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(backup));
  }, [sowHistory, planHistory, noteHistory, profile, slots, documents, isHydrated]);

  // Auth Listener
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

  // Hydration logic (Fetch from Supabase)
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
        // Prioritize cloud data, but only if it exists
        if (d.slots) setSlots(d.slots);
        if (d.sow_history) setSowHistory(d.sow_history);
        if (d.plan_history) setPlanHistory(d.plan_history);
        if (d.note_history) setNoteHistory(d.note_history);
        if (d.docs) setDocuments([...SYSTEM_CURRICULUM_DOCS, ...d.docs]);
      }
      
      setIsHydrated(true); // RELEASE THE LOCK
      setSyncStatus('online');
    } catch (err) {
      console.error("Cloud hydration failed:", err);
      setIsHydrated(true); // Proceed with local data if cloud fails
      setSyncStatus('offline');
    }
  };

  const syncToCloud = useCallback(async () => {
    // LOCK 3: Non-Empty Enforcement & Guards
    if (!session?.user || !supabase || !isHydrated || !isDirty) return;
    
    // Safety check: Don't overwrite cloud with empty data if we know we previously had data
    const isStateEmpty = sowHistory.length === 0 && planHistory.length === 0 && slots.length === 0;
    if (isStateEmpty && isDirty) {
      console.warn("Sync blocked: Attempting to overwrite with empty state.");
      return;
    }

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

  // Auto-Save Loop (4s delay after changes)
  useEffect(() => {
    if (!isHydrated || !isDirty) return;
    const timer = setTimeout(() => syncToCloud(), 4000);
    return () => clearTimeout(timer);
  }, [isDirty, syncToCloud, isHydrated]);

  // State Update Wrappers (Trigger Dirty Flag)
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