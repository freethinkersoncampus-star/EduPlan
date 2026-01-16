
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
  { id: 'js-is', title: 'Integrated Science', content: 'Rationalized: Biological, Physical and Chemical systems.', type: 'KICD', size: '5.8 MB', date: '2025', category: 'Junior School', isActiveContext: true, isSystemDoc: true }
];

const getStorageKey = (userId: string) => `eduplan_vault_v2_${userId}`;

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
  const [currentSowMeta, setCurrentSowMeta] = useState({ id: '', subject: '', grade: '', term: 1, year: 2025, termStart: new Date().toISOString().split('T')[0], termEnd: '', halfTermStart: '', halfTermEnd: '' });
  const [plannerPrefill, setPlannerPrefill] = useState<any>(null);

  const [sowHistory, setSowHistory] = useState<SavedSOW[]>([]);
  const [planHistory, setPlanHistory] = useState<SavedLessonPlan[]>([]);
  const [noteHistory, setNoteHistory] = useState<SavedLessonNote[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ name: '', tscNumber: '', school: '', subjects: [], availableSubjects: [], grades: [], onboardedStaff: [] });
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(SYSTEM_CURRICULUM_DOCS);
  const [slots, setSlots] = useState<LessonSlot[]>([]);

  const hydrationAttempted = useRef<string | null>(null);

  const resetLocalState = useCallback(() => {
    setIsHydrated(false); setIsDirty(false); setSlots([]); setSowHistory([]); setPlanHistory([]); setNoteHistory([]);
    setProfile({ name: '', tscNumber: '', school: '', subjects: [], availableSubjects: [], grades: [], onboardedStaff: [] });
    setDocuments(SYSTEM_CURRICULUM_DOCS);
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'SIGNED_OUT' || !newSession) { hydrationAttempted.current = null; resetLocalState(); }
    });
    return () => subscription.unsubscribe();
  }, [resetLocalState]);

  const loadFromCloud = useCallback(async (userId: string) => {
    if (!supabase || hydrationAttempted.current === userId) return;
    setSyncStatus('syncing');
    setSyncMessage('Syncing Documents...');
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

      if (dataRes.data && Array.isArray(dataRes.data.slots)) {
        const rawSlots = dataRes.data.slots as any[];
        // Look for the Hidden Storage Tunnel slot
        const storageSlot = rawSlots.find(s => s.subject === 'SYSTEM_INTERNAL_STORAGE');
        const timetableSlots = rawSlots.filter(s => s.subject !== 'SYSTEM_INTERNAL_STORAGE');

        if (storageSlot && storageSlot.vault) {
          const v = storageSlot.vault;
          setSowHistory(v.sow || []);
          setPlanHistory(v.plans || []);
          setNoteHistory(v.notes || []);
          if (v.docs) setDocuments([...SYSTEM_CURRICULUM_DOCS, ...v.docs]);
        }
        setSlots(timetableSlots);
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
    setSyncMessage('Saving Documents...');
    const userId = session.user.id;
    
    try {
      // 1. Sync Profile (Working)
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

      // 2. Storage Tunneling: We bundle all documents into a hidden entry inside the working 'slots' column
      const storageSlot = {
        day: 'SYSTEM',
        startTime: '00:00',
        endTime: '00:00',
        subject: 'SYSTEM_INTERNAL_STORAGE',
        grade: 'VAULT_V1',
        type: 'activity',
        vault: {
          sow: sowHistory,
          plans: planHistory,
          notes: noteHistory,
          docs: documents.filter(d => !d.isSystemDoc)
        }
      };

      const transportSlots = [...slots, storageSlot];

      const { error: dataErr } = await supabase.from('user_data').upsert({
        user_id: userId,
        slots: transportSlots, // Saving everything into the one column we know works
        updated_at: new Date().toISOString()
      });

      if (dataErr) throw dataErr;

      setSyncStatus('online');
      setSyncMessage('All Documents Secured');
      setLastSynced(new Date().toLocaleTimeString());
      setIsDirty(false);
      
      localStorage.setItem(getStorageKey(userId), JSON.stringify({ slots, sowHistory, planHistory, noteHistory, profile }));
    } catch (err: any) {
      console.error("Cloud write failed:", err);
      setSyncStatus('error');
      setSyncMessage('Cloud Sync Issue (Saved Locally)');
    } finally {
      syncLock.current = false;
    }
  }, [session, profile, slots, sowHistory, planHistory, noteHistory, documents, isHydrated, isDirty]);

  useEffect(() => {
    if (!isHydrated || !isDirty) return;
    const timer = setTimeout(() => syncToCloud(), 3000);
    return () => clearTimeout(timer);
  }, [isDirty, syncToCloud, isHydrated]);

  const wrapUpdate = (fn: Function) => (val: any) => { fn(val); if (isHydrated) setIsDirty(true); };

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
              <div className={`w-2 h-2 rounded-full ${syncStatus === 'error' ? 'bg-red-500' : syncStatus === 'syncing' ? 'bg-amber-500 animate-bounce' : 'bg-emerald-500'}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${syncStatus === 'error' ? 'text-red-600' : 'text-slate-700'}`}>
                {syncMessage}
              </span>
            </div>
            {lastSynced && <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">Synced: {lastSynced}</span>}
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1">{profile.name || 'Teacher'}</p>
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none">{profile.school || 'EduPlan Pro'}</p>
             </div>
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`} className="w-10 h-10 rounded-xl border-2 border-indigo-50 shadow-sm" />
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
