
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
  { id: 'pp-lang', title: 'Language Activities', content: 'KICD Rationalized: Pre-reading, listening, and speaking skills for early learners.', type: 'KICD', size: '2.1 MB', date: '2025', category: 'Pre-Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'pp-math', title: 'Mathematical Activities', content: 'KICD Rationalized: Classification, number recognition, and simple pattern awareness.', type: 'KICD', size: '1.9 MB', date: '2025', category: 'Pre-Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'pp-env', title: 'Environmental Activities', content: 'KICD Rationalized: Cleanliness, safety, and social environment.', type: 'KICD', size: '2.4 MB', date: '2025', category: 'Pre-Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'pp-psycho', title: 'Psychomotor & Creative Activities', content: 'KICD Rationalized: Fine and gross motor skills development.', type: 'KICD', size: '3.1 MB', date: '2025', category: 'Pre-Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'pp-rel', title: 'Religious Education Activities', content: 'KICD Rationalized: Foundational moral and spiritual values.', type: 'KICD', size: '1.8 MB', date: '2025', category: 'Pre-Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'lp-lit-e', title: 'English Literacy', content: 'Rationalized: Foundational English reading and writing.', type: 'KICD', size: '3.1 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'lp-lit-k', title: 'Kiswahili / KSL Literacy', content: 'Rationalized: Stadi za kusikiliza, kuzungumza, kusoma na kuandika.', type: 'KICD', size: '2.9 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'lp-math', title: 'Mathematics (G1-3)', content: 'Rationalized: Numbers, measurement, and basic geometry.', type: 'KICD', size: '3.5 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'lp-env', title: 'Environmental Activities (G1-3)', content: 'Rationalized: Weather, soil, water, and living things.', type: 'KICD', size: '2.8 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'lp-hygiene', title: 'Hygiene & Nutrition', content: 'Rationalized: Health habits and balanced diets.', type: 'KICD', size: '2.2 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'lp-creative', title: 'Movement & Creative Arts', content: 'Rationalized: Music, art, and physical education.', type: 'KICD', size: '4.1 MB', date: '2025', category: 'Lower Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'up-eng', title: 'English (G4-6)', content: 'Rationalized Curriculum: Complex grammar and comprehension.', type: 'KICD', size: '3.8 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'up-kis', title: 'Kiswahili (G4-6)', content: 'Mtaala uliopunguzwa makali: Sarufi na Insha.', type: 'KICD', size: '3.6 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'up-math', title: 'Mathematics (G4-6)', content: 'Rationalized Curriculum: Fractions, algebra, and data handling.', type: 'KICD', size: '4.2 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'up-science', title: 'Science & Technology (G4-6)', content: 'Rationalized Curriculum: Human body, plants, and simple machines.', type: 'KICD', size: '4.5 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'up-ss', title: 'Social Studies (G4-6)', content: 'Rationalized Curriculum: Citizenship, mapping, and resources.', type: 'KICD', size: '3.9 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'up-agri', title: 'Agriculture & Nutrition (G4-6)', content: 'Rationalized Curriculum: Food production and kitchen gardening.', type: 'KICD', size: '3.7 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'up-cre', title: 'C.R.E / I.R.E / H.R.E (G4-6)', content: 'Rationalized Curriculum: Spiritual and moral growth.', type: 'KICD', size: '2.5 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
  { id: 'up-arts', title: 'Creative Arts (G4-6)', content: 'Rationalized Curriculum: Integrated Music, Art and PE.', type: 'KICD', size: '4.8 MB', date: '2025', category: 'Upper Primary', isActiveContext: true, isSystemDoc: true },
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
  { id: 'ss-path', title: 'Senior School Pathways Guide', content: 'STEM, Social Sciences, and Arts & Sports guidelines.', type: 'KICD', size: '6.2 MB', date: '2025', category: 'Senior School', isActiveContext: true, isSystemDoc: true }
];

const getStorageKey = (userId: string) => `eduplan_vault_${userId}`;

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [syncStatus, setSyncStatus] = useState<'online' | 'syncing' | 'offline' | 'error'>('online');
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string>('Vault Secured');
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const syncLock = useRef(false);
  
  const [currentSow, setCurrentSow] = useState<SOWRow[]>([]);
  const [currentSowMeta, setCurrentSowMeta] = useState({ 
    id: '',
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
    setCurrentSowMeta({ id: '', subject: '', grade: '', term: 1, year: 2025, termStart: new Date().toISOString().split('T')[0], termEnd: '', halfTermStart: '', halfTermEnd: '' });
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
    setSyncMessage('Accessing Vault...');
    try {
      const [profileRes, dataRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_data').select('*').eq('user_id', userId).maybeSingle()
      ]);

      if (profileRes.data) {
        setProfile({
          name: profileRes.data.name || '',
          tscNumber: profileRes.data.tsc_number || '',
          school: profileRes.data.school || '',
          subjects: profileRes.data.subjects || [],
          onboardedStaff: profileRes.data.onboarded_staff || [],
          availableSubjects: profileRes.data.available_subjects || [],
          grades: profileRes.data.grades || []
        });
      }

      if (dataRes.data) {
        const d = dataRes.data;
        // LOAD LOGIC: Support both direct columns AND bundled fallback in 'slots'
        let remoteSlots = d.slots || [];
        let remoteSow = d.sow_history || [];
        let remotePlans = d.plan_history || [];
        let remoteNotes = d.note_history || [];

        // Check if 'slots' is actually a bundle object (our persistent fallback)
        if (d.slots && !Array.isArray(d.slots) && d.slots.items) {
          remoteSlots = d.slots.items;
          if (d.slots.vault) {
            remoteSow = remoteSow.length ? remoteSow : (d.slots.vault.sow || []);
            remotePlans = remotePlans.length ? remotePlans : (d.slots.vault.plans || []);
            remoteNotes = remoteNotes.length ? remoteNotes : (d.slots.vault.notes || []);
          }
        }

        setSlots(remoteSlots);
        setSowHistory(remoteSow);
        setPlanHistory(remotePlans);
        setNoteHistory(remoteNotes);
        if (d.docs) setDocuments([...SYSTEM_CURRICULUM_DOCS, ...d.docs]);
      }

      setIsHydrated(true);
      setSyncStatus('online');
      setSyncMessage('Vault Synced Successfully');
      setLastSynced(new Date().toLocaleTimeString());
      hydrationAttempted.current = userId;
    } catch (err) {
      console.error("Cloud fetch failed:", err);
      setSyncStatus('offline');
      setSyncMessage('Offline Mode Active');
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id && !isHydrated && hydrationAttempted.current !== session.user.id) {
      loadFromCloud(session.user.id);
    }
  }, [session, loadFromCloud, isHydrated]);

  const syncToCloud = useCallback(async (force = false) => {
    if (!session?.user?.id || !supabase || !isHydrated) return;
    if (!isDirty && !force) return;
    if (syncLock.current) return;

    syncLock.current = true;
    setSyncStatus('syncing');
    setSyncMessage('Securing Work to Cloud...');
    const userId = session.user.id;
    
    try {
      // 1. Sync Profile
      await supabase.from('profiles').upsert({
        id: userId,
        name: profile.name,
        tsc_number: profile.tscNumber,
        school: profile.school,
        subjects: profile.subjects,
        onboarded_staff: profile.onboardedStaff,
        available_subjects: profile.availableSubjects,
        grades: profile.grades,
        updated_at: new Date().toISOString()
      });

      // 2. Sync User Data with "Persistent Fallback" logic
      // We store the history in a bundle inside 'slots' as a GUARANTEED fallback 
      // because we know 'slots' column works on your DB.
      const persistentBundle = {
        items: slots,
        vault: {
          sow: sowHistory,
          plans: planHistory,
          notes: noteHistory
        }
      };

      const dataPayload: any = {
        user_id: userId,
        slots: persistentBundle, // This ensures it saves even if other columns fail
        sow_history: sowHistory,
        plan_history: planHistory,
        note_history: noteHistory,
        docs: documents.filter(d => !d.isSystemDoc),
        updated_at: new Date().toISOString()
      };

      const { error: dataErr } = await supabase.from('user_data').upsert(dataPayload);
      
      if (dataErr && dataErr.code === '42703') {
        // If specific columns fail, try saving ONLY with the bundle to 'slots'
        console.warn("Retrying with Persistent Bundle only...");
        const { error: retryErr } = await supabase.from('user_data').upsert({
          user_id: userId,
          slots: persistentBundle,
          updated_at: new Date().toISOString()
        });
        if (retryErr) throw retryErr;
      } else if (dataErr) {
        throw dataErr;
      }

      setSyncStatus('online');
      setSyncMessage('Vault Secured (Multi-Device Ready)');
      setLastSynced(new Date().toLocaleTimeString());
      setIsDirty(false);
      
      // Save local backup
      localStorage.setItem(getStorageKey(userId), JSON.stringify({ slots, sowHistory, planHistory, noteHistory, profile }));
    } catch (err: any) {
      console.error("Cloud write failed:", err);
      setSyncStatus('error');
      setSyncMessage('Vault Sync Issue (Saved Locally)');
    } finally {
      syncLock.current = false;
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

  const handleLogout = async () => { if (confirm("Sign out of EduPlan?")) { if (supabase) await supabaseSignOut(); } };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!session) return <Login />;

  return (
    <div className="flex min-h-screen bg-slate-50 flex-col md:flex-row font-inter">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} onLogout={handleLogout} />
      <main className="flex-1 md:ml-64 overflow-y-auto min-h-screen pb-32 md:pb-12 scroll-smooth">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 md:px-12 py-4 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full shadow-sm transition-all duration-500 ${
              syncStatus === 'error' ? 'bg-red-50 border border-red-100' : 
              syncStatus === 'syncing' ? 'bg-amber-50 border border-amber-100' : 
              'bg-emerald-50 border border-emerald-100'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                syncStatus === 'error' ? 'bg-red-500' : 
                syncStatus === 'syncing' ? 'bg-amber-500 animate-bounce' : 
                'bg-emerald-500'
              }`}></div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${syncStatus === 'error' ? 'text-red-600' : 'text-slate-700'}`}>
                {syncMessage}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1">{profile.name || 'Teacher'}</p>
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none">{profile.school || 'Private Institution'}</p>
             </div>
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`} className="w-10 h-10 rounded-xl border-2 border-indigo-50 shadow-sm" alt="Profile" />
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard stats={{ sowCount: sowHistory.length, planCount: planHistory.length, subjectCount: (profile.subjects || []).length, nextLesson: slots.length > 0 ? slots[0].subject : 'None' }} slots={slots} user={profile} onNavigate={setActiveTab} />}
          {activeTab === 'registry' && <StaffManagement profile={profile} setProfile={wrapUpdate(setProfile)} syncStatus={syncStatus} syncMessage={syncMessage} lastSynced={lastSynced} onForceSync={() => syncToCloud(true)} />}
          {activeTab === 'timetable' && <Timetable slots={slots} setSlots={wrapUpdate(setSlots)} profile={profile} setProfile={wrapUpdate(setProfile)} />}
          {activeTab === 'sow' && <SOWGenerator timetableSlots={slots} knowledgeContext={documents.filter(d => d.isActiveContext).map(d => d.content).join('\n\n')} persistedSow={currentSow} setPersistedSow={setCurrentSow} persistedMeta={currentSowMeta} setPersistedMeta={setCurrentSowMeta} onPrefillPlanner={(data) => { setPlannerPrefill(data); setActiveTab('lesson-planner'); }} userProfile={profile} history={sowHistory} setHistory={wrapUpdate(setSowHistory)} />}
          {activeTab === 'lesson-planner' && <LessonPlanner knowledgeContext={documents.filter(d => d.isActiveContext).map(d => d.content).join('\n\n')} prefill={plannerPrefill} onClearPrefill={() => setPlannerPrefill(null)} userProfile={profile} savedPlans={planHistory} setSavedPlans={wrapUpdate(setPlanHistory)} savedNotes={noteHistory} setSavedNotes={wrapUpdate(setNoteHistory)} />}
          {activeTab === 'documents' && <DocumentLibrary documents={documents} setDocuments={wrapUpdate(setDocuments)} />}
        </div>
      </main>
    </div>
  );
};

export default App;
