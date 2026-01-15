
import { useState, useEffect, useCallback, useRef } from 'react';
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
  // PRE-PRIMARY (PP1-PP2)
  { id: 'pp-lang', title: 'Language Activities', content: 'KICD Rationalized: Pre-reading, listening, and speaking skills for early learners.', type: 'KICD', size: '2.1 MB', date: '2025', category: 'Pre-Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'pp-math', title: 'Mathematical Activities', content: 'KICD Rationalized: Classification, number recognition, and simple pattern awareness.', type: 'KICD', size: '1.9 MB', date: '2025', category: 'Pre-Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'pp-env', title: 'Environmental Activities', content: 'KICD Rationalized: Cleanliness, safety, and social environment.', type: 'KICD', size: '2.4 MB', date: '2025', category: 'Pre-Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'pp-psycho', title: 'Psychomotor & Creative Activities', content: 'KICD Rationalized: Fine and gross motor skills development.', type: 'KICD', size: '3.1 MB', date: '2025', category: 'Pre-Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'pp-rel', title: 'Religious Education Activities', content: 'KICD Rationalized: Foundational moral and spiritual values.', type: 'KICD', size: '1.8 MB', date: '2025', category: 'Pre-Primary', isActiveContext: true, isSystemDoc: true },

  // LOWER PRIMARY (GRADE 1-3)
  { id: 'lp-lit-e', title: 'English Literacy', content: 'Rationalized: Foundational English reading and writing.', type: 'KICD', size: '3.1 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'lp-lit-k', title: 'Kiswahili / KSL Literacy', content: 'Rationalized: Stadi za kusikiliza, kuzungumza, kusoma na kuandika.', type: 'KICD', size: '2.9 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'lp-math', title: 'Mathematics (G1-3)', content: 'Rationalized: Numbers, measurement, and basic geometry.', type: 'KICD', size: '3.5 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'lp-env', title: 'Environmental Activities (G1-3)', content: 'Rationalized: Weather, soil, water, and living things.', type: 'KICD', size: '2.8 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'lp-hygiene', title: 'Hygiene & Nutrition', content: 'Rationalized: Health habits and balanced diets.', type: 'KICD', size: '2.2 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'lp-creative', title: 'Movement & Creative Arts', content: 'Rationalized: Music, art, and physical education.', type: 'KICD', size: '4.1 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true },

  // UPPER PRIMARY (GRADE 4-6)
  { id: 'up-eng', title: 'English (G4-6)', content: 'Rationalized Curriculum: Complex grammar and comprehension.', type: 'KICD', size: '3.8 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'up-kis', title: 'Kiswahili (G4-6)', content: 'Mtaala uliopunguzwa makali: Sarufi na Insha.', type: 'KICD', size: '3.6 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'up-math', title: 'Mathematics (G4-6)', content: 'Rationalized Curriculum: Fractions, algebra, and data handling.', type: 'KICD', size: '4.2 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'up-science', title: 'Science & Technology (G4-6)', content: 'Rationalized Curriculum: Human body, plants, and simple machines.', type: 'KICD', size: '4.5 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'up-ss', title: 'Social Studies (G4-6)', content: 'Rationalized Curriculum: Citizenship, mapping, and resources.', type: 'KICD', size: '3.9 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'up-agri', title: 'Agriculture & Nutrition (G4-6)', content: 'Rationalized Curriculum: Food production and kitchen gardening.', type: 'KICD', size: '3.7 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'up-cre', title: 'C.R.E / I.R.E / H.R.E (G4-6)', content: 'Rationalized Curriculum: Spiritual and moral growth.', type: 'KICD', size: '2.5 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'up-arts', title: 'Creative Arts (G4-6)', content: 'Rationalized Curriculum: Integrated Music, Art and PE.', type: 'KICD', size: '4.8 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },

  // JUNIOR SCHOOL (GRADE 7-9)
  { id: 'js-eng', title: 'English (JS)', content: 'Rationalized Design: Literature, oral skills, and linguistics.', type: 'KICD', size: '4.2 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true },
  { id: 'js-kis', title: 'Kiswahili (JS)', content: 'Mtaala: Fasihi simulizi na andishi.', type: 'KICD', size: '4.0 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true },
  { id: 'js-math', title: 'Mathematics (JS)', content: 'Rationalized: Advanced algebra, probability, and spatial awareness.', type: 'KICD', size: '5.1 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true },
  { id: 'js-is', title: 'Integrated Science', content: 'Rationalized: Biological, Physical and Chemical systems.', type: 'KICD', size: '5.8 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true },
  { id: 'js-ss', title: 'Social Studies (JS)', content: 'Rationalized: African history, geography, and globalization.', type: 'KICD', size: '4.6 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true },
  { id: 'js-agri', title: 'Agriculture & Nutrition (JS)', content: 'Rationalized: Commercial farming and advanced nutrition.', type: 'KICD', size: '4.3 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true },
  { id: 'js-pretech', title: 'Pre-Technical Studies', content: 'Rationalized: Coding, materials, and safety.', type: 'KICD', size: '5.5 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true },
  { id: 'js-health', title: 'Health Education', content: 'Rationalized: Human wellness and environmental health.', type: 'KICD', size: '3.2 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true },
  { id: 'js-ca', title: 'Creative Arts & Sports', content: 'Rationalized: Performance arts and athletics.', type: 'KICD', size: '5.0 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true },
  { id: 'js-rel', title: 'Life Skills & Religious Education', content: 'Rationalized: Career guidance and ethical living.', type: 'KICD', size: '3.0 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true },

  // SENIOR SCHOOL (PRE-GENERAL)
  { id: 'ss-path', title: 'Senior School Pathways Guide', content: 'STEM, Social Sciences, and Arts & Sports guidelines.', type: 'KICD', size: '6.2 MB', date: '2025', category: 'Senior School', isActiveContext: true, isSystemDoc: true }
];

const getStorageKey = (userId: string) => `eduplan_vault_${userId}`;

const MobileNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => (
  <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
    {[
      { id: 'dashboard', icon: 'fa-th-large', label: 'Home' },
      { id: 'timetable', icon: 'fa-calendar-alt', label: 'Schedule' },
      { id: 'sow', icon: 'fa-file-signature', label: 'Schemes' },
      { id: 'lesson-planner', icon: 'fa-book-open', label: 'Planner' },
      { id: 'documents', icon: 'fa-folder-open', label: 'Vault' },
    ].map(item => (
      <button key={item.id} onClick={() => setActiveTab(item.id)} className="flex flex-col items-center gap-1.5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
          <i className={`fas ${item.icon} text-sm`}></i>
        </div>
        <span className={`text-[8px] font-black uppercase tracking-widest ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>{item.label}</span>
      </button>
    ))}
  </nav>
);

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [syncStatus, setSyncStatus] = useState<'online' | 'syncing' | 'offline'>('online');
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const [currentSow, setCurrentSow] = useState<SOWRow[]>([]);
  const [currentSowMeta, setCurrentSowMeta] = useState({ 
    subject: '', 
    grade: '', 
    term: 1, 
    year: 2025,
    termStart: new Date().toISOString().split('T')[0],
    termEnd: '',
    halfTermStart: '',
    halfTermEnd: ''
  });
  const [plannerPrefill, setPlannerPrefill] = useState<any>(null);

  const [sowHistory, setSowHistory] = useState<SavedSOW[]>([]);
  const [planHistory, setPlanHistory] = useState<SavedLessonPlan[]>([]);
  const [noteHistory, setNoteHistory] = useState<SavedLessonNote[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ name: '', tscNumber: '', school: '', subjects: [], availableSubjects: [], grades: [], onboardedStaff: [] });
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(SYSTEM_CURRICULUM_DOCS);
  const [slots, setSlots] = useState<LessonSlot[]>([]);

  const hydrationAttempted = useRef<string | null>(null);

  const resetLocalState = useCallback(() => {
    setIsHydrated(false);
    setIsDirty(false);
    setSlots([]);
    setSowHistory([]);
    setPlanHistory([]);
    setNoteHistory([]);
    setProfile({ name: '', tscNumber: '', school: '', subjects: [], availableSubjects: [], grades: [], onboardedStaff: [] });
    setDocuments(SYSTEM_CURRICULUM_DOCS);
    setCurrentSow([]);
    setCurrentSowMeta({ 
      subject: '', 
      grade: '', 
      term: 1, 
      year: 2025,
      termStart: new Date().toISOString().split('T')[0],
      termEnd: '',
      halfTermStart: '',
      halfTermEnd: ''
    });
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'SIGNED_OUT' || !newSession) {
        hydrationAttempted.current = null;
        resetLocalState();
      }
    });
    
    return () => subscription.unsubscribe();
  }, [resetLocalState]);

  const loadFromCloud = useCallback(async (userId: string) => {
    if (!supabase || hydrationAttempted.current === userId) return;
    
    setSyncStatus('syncing');
    console.log(`EDUPAN SYNC [${userId}]: Fetching cloud data...`);
    
    try {
      const [profileRes, dataRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_data').select('*').eq('user_id', userId).maybeSingle()
      ]);

      const p = profileRes.data;
      const d = dataRes.data;

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
      } else {
        const userSpecificKey = getStorageKey(userId);
        const localBackup = localStorage.getItem(userSpecificKey);
        if (localBackup) {
          const parsed = JSON.parse(localBackup);
          if (parsed.profile) setProfile(parsed.profile);
          if (parsed.slots) setSlots(parsed.slots);
          if (parsed.sowHistory) setSowHistory(parsed.sowHistory);
          if (parsed.planHistory) setPlanHistory(parsed.planHistory);
          if (parsed.noteHistory) setNoteHistory(parsed.noteHistory);
          if (parsed.documents) setDocuments([...SYSTEM_CURRICULUM_DOCS, ...parsed.documents]);
        }
      }

      setIsHydrated(true);
      setSyncStatus('online');
      hydrationAttempted.current = userId;
      console.log(`EDUPAN SYNC [${userId}]: Hydration successful.`);

    } catch (err) {
      console.error("Cloud fetch failed:", err);
      setIsHydrated(true);
      setSyncStatus('offline');
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id && !isHydrated && hydrationAttempted.current !== session.user.id) {
      loadFromCloud(session.user.id);
    }
  }, [session, loadFromCloud, isHydrated]);

  const syncToCloud = useCallback(async () => {
    if (!session?.user?.id || !supabase || !isHydrated || !isDirty) return;
    
    setSyncStatus('syncing');
    const userId = session.user.id;
    
    try {
      await Promise.all([
        supabase.from('profiles').upsert({
          id: userId,
          name: profile.name,
          tsc_number: profile.tscNumber,
          school: profile.school,
          subjects: profile.subjects,
          onboarded_staff: profile.onboardedStaff,
          available_subjects: profile.availableSubjects,
          grades: profile.grades,
          updated_at: new Date().toISOString()
        }),
        supabase.from('user_data').upsert({
          user_id: userId,
          slots,
          sow_history: sowHistory,
          plan_history: planHistory,
          note_history: noteHistory,
          docs: documents.filter(d => !d.isSystemDoc),
          updated_at: new Date().toISOString()
        })
      ]);

      setSyncStatus('online');
      setIsDirty(false);

      localStorage.setItem(getStorageKey(userId), JSON.stringify({ 
        slots, 
        sowHistory, 
        planHistory, 
        noteHistory, 
        profile, 
        documents: documents.filter(d => !d.isSystemDoc) 
      }));
      
    } catch (err) {
      console.error("Cloud write failed:", err);
      setSyncStatus('offline');
    }
  }, [session, profile, slots, sowHistory, planHistory, noteHistory, documents, isHydrated, isDirty]);

  useEffect(() => {
    if (!isHydrated || !isDirty) return;
    const timer = setTimeout(() => syncToCloud(), 3000);
    return () => clearTimeout(timer);
  }, [isDirty, syncToCloud, isHydrated]);

  const wrapUpdate = (fn: Function) => (val: any) => { 
    fn(val); 
    if (isHydrated) setIsDirty(true); 
  };

  const handleLogout = async () => {
    if (confirm("Logout from EduPlan?")) {
      if (supabase) await supabaseSignOut();
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verifying Identity...</p>
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
                {syncStatus === 'syncing' ? 'Vault Sync...' : isDirty ? 'Unsaved' : 'Secured'}
              </span>
            </div>
            {!isHydrated && <span className="text-[8px] font-black text-indigo-400 uppercase animate-pulse tracking-widest">Hydrating Vault...</span>}
          </div>
          <div className="flex items-center gap-4 cursor-pointer group">
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
              timetableSlots={slots} knowledgeContext={documents.filter(d => d.isActiveContext).map(d => d.content).join('\n\n')} 
              persistedSow={currentSow} setPersistedSow={setCurrentSow} persistedMeta={currentSowMeta} setPersistedMeta={setCurrentSowMeta}
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
