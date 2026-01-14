import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Timetable from './components/Timetable';
import SOWGenerator from './components/SOWGenerator';
import LessonPlanner from './components/LessonPlanner';
import DocumentLibrary from './components/DocumentLibrary';
import StaffManagement from './components/StaffManagement';
import Login from './components/Login';
import { supabase, isSupabaseConfigured, signOut as supabaseSignOut, hasSystemConfig, isUsingManualConfig, clearManualConfig } from './services/supabase';
import { LessonSlot, UserProfile, KnowledgeDocument, SOWRow } from './types';

const SYSTEM_CURRICULUM_DOCS: KnowledgeDocument[] = [
  { 
    id: 'sys-kicd-framework-2025', 
    title: 'National Rationalized Curriculum Framework', 
    content: 'CBE 2025 structure: Focuses on core competencies: Communication and Collaboration, Self-efficacy, Critical Thinking and Problem Solving, Creativity and Imagination, Citizenship, Digital Literacy, Learning to Learn.', 
    type: 'KICD', 
    size: '12.4 MB', 
    date: 'Jan 2025', 
    category: 'Framework', 
    isActiveContext: true, 
    isSystemDoc: true 
  },
  { 
    id: 'sys-kicd-science-g7', 
    title: 'Integrated Science Grade 7 Rationalized Design', 
    content: 'Strands: Mixture, Elements and Molecules. Living Things and their Environment. Heat Transfer. Electricity and Magnetism. Human Body Systems.', 
    type: 'PDF', 
    size: '4.8 MB', 
    date: 'Jan 2025', 
    category: 'Science', 
    isActiveContext: true, 
    isSystemDoc: true 
  },
  { 
    id: 'sys-kicd-math-g7', 
    title: 'Mathematics Grade 7 Rationalized Design', 
    content: 'Strands: Numbers (Whole numbers, Fractions, Decimals, Percentages), Algebra (Linear Equations), Geometry (Angles, Triangles), Data Handling (Mean, Median, Mode).', 
    type: 'PDF', 
    size: '5.2 MB', 
    date: 'Jan 2025', 
    category: 'Mathematics', 
    isActiveContext: true, 
    isSystemDoc: true 
  },
  { 
    id: 'sys-kicd-pretech-g7', 
    title: 'Pre-Technical Studies Grade 7 Rationalized Design', 
    content: 'Strands: Foundations of Pre-Technical Studies, Materials (Metals, Wood, Plastics), Tools and Equipment, Safety in the Workshop, Drawing and Design Basics.', 
    type: 'PDF', 
    size: '8.1 MB', 
    date: 'Jan 2025', 
    category: 'Technical', 
    isActiveContext: true, 
    isSystemDoc: true 
  },
  { 
    id: 'sys-kicd-creative-g7', 
    title: 'Creative Arts and Sports Grade 7 Rationalized Design', 
    content: 'Strands: Performing Arts (Music, Dance, Drama), Visual Arts (Drawing, Painting, Sculpture), Physical Education and Sports (Athletics, Ball Games).', 
    type: 'PDF', 
    size: '9.5 MB', 
    date: 'Jan 2025', 
    category: 'Arts', 
    isActiveContext: true, 
    isSystemDoc: true 
  },
  { 
    id: 'sys-kicd-english-g7', 
    title: 'English Grade 7 Rationalized Design', 
    content: 'Strands: Listening and Speaking, Reading, Grammar in Context, Writing Skills. Focus on functional writing and comprehension.', 
    type: 'PDF', 
    size: '3.9 MB', 
    date: 'Jan 2025', 
    category: 'Languages', 
    isActiveContext: true, 
    isSystemDoc: true 
  },
  { 
    id: 'sys-kicd-ss-g7', 
    title: 'Social Studies Grade 7 Rationalized Design', 
    content: 'Strands: Physical Environment, African History and Governance, Resources and Economic Activities, Citizenship and Social Integration.', 
    type: 'PDF', 
    size: '7.3 MB', 
    date: 'Jan 2025', 
    category: 'Social Sciences', 
    isActiveContext: true, 
    isSystemDoc: true 
  },
  { 
    id: 'sys-kicd-kiswahili-g7', 
    title: 'Kiswahili Grade 7 Rationalized Design', 
    content: 'Mada: Kusikiliza na Kuzungumza, Kusoma, Sarufi, Kuandika. Mkazo katika Kiswahili Sanifu na mawasiliano ya kila siku.', 
    type: 'PDF', 
    size: '4.1 MB', 
    date: 'Jan 2025', 
    category: 'Languages', 
    isActiveContext: true, 
    isSystemDoc: true 
  },
  { 
    id: 'sys-kicd-science-g8', 
    title: 'Integrated Science Grade 8 Rationalized Design', 
    content: 'Strands: Chemical Substances, Light and Sound, Reproduction in Plants and Animals, Excretory System, Force and Pressure.', 
    type: 'PDF', 
    size: '5.0 MB', 
    date: 'Jan 2025', 
    category: 'Science', 
    isActiveContext: true, 
    isSystemDoc: true 
  },
  { 
    id: 'sys-kicd-math-g8', 
    title: 'Mathematics Grade 8 Rationalized Design', 
    content: 'Strands: Squares and Square Roots, Ratio and Proportion, Linear Inequalities, Circles and Polygons, Probability.', 
    type: 'PDF', 
    size: '5.5 MB', 
    date: 'Jan 2025', 
    category: 'Mathematics', 
    isActiveContext: true, 
    isSystemDoc: true 
  },
  { 
    id: 'sys-kicd-ict-g7-9', 
    title: 'Digital Literacy & Computer Science Grade 7-9', 
    content: 'Strands: Computer Systems, Internet and World Wide Web, Computational Thinking (Scratch/Python), Spreadsheet and Word Processing, Cyber Security.', 
    type: 'PDF', 
    size: '10.2 MB', 
    date: 'Jan 2025', 
    category: 'ICT', 
    isActiveContext: true, 
    isSystemDoc: true 
  },
  { 
    id: 'sys-kicd-life-skills-g7', 
    title: 'Life Skills Education Grade 7 Rationalized Design', 
    content: 'Strands: Self-Awareness, Empathy, Decision Making, Problem Solving, Effective Communication, Interpersonal Relationships.', 
    type: 'PDF', 
    size: '3.1 MB', 
    date: 'Jan 2025', 
    category: 'Life Skills', 
    isActiveContext: true, 
    isSystemDoc: true 
  },
  { 
    id: 'sys-kicd-agr-g7', 
    title: 'Agriculture and Nutrition Grade 7 Rationalized Design', 
    content: 'Strands: Conserving the Environment, Crop Production, Animal Production, Human Nutrition, Food Preservation.', 
    type: 'PDF', 
    size: '6.7 MB', 
    date: 'Jan 2025', 
    category: 'Agriculture', 
    isActiveContext: true, 
    isSystemDoc: true 
  }
];

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'online' | 'syncing' | 'offline'>(isSupabaseConfigured ? 'online' : 'offline');
  
  const [currentSow, setCurrentSow] = useState<SOWRow[]>([]);
  const [currentSowMeta, setCurrentSowMeta] = useState({ subject: '', grade: '', term: 1, termStart: new Date().toISOString().split('T')[0] });
  const [plannerPrefill, setPlannerPrefill] = useState<any>(null);
  
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
        // Merge system docs with user docs
        setDocuments([...SYSTEM_CURRICULUM_DOCS, ...(appData.docs || [])]);
      }
      setSyncStatus('online');
    } catch (err) {
      console.error("Load failed:", err);
      setSyncStatus('offline');
    }
  };

  const syncToCloud = useCallback(async () => {
    if (!session?.user || !navigator.onLine || !supabase) return;
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
        docs: documents.filter(d => !d.isSystemDoc),
        updated_at: new Date().toISOString()
      });

      setSyncStatus('online');
    } catch (err) {
      console.error("Sync failed:", err);
      setSyncStatus('offline');
    }
  }, [session, profile, slots, documents]);

  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    const timer = setTimeout(() => {
      syncToCloud();
    }, 5000); 
    return () => clearTimeout(timer);
  }, [profile, slots, documents, syncToCloud, session]);

  const handleLogout = async () => {
    if (confirm("Log out of EduPlan?")) {
      if (supabase) await supabaseSignOut();
      setSession(null);
      setProfile({ name: '', tscNumber: '', school: '', subjects: [], availableSubjects: [], grades: [], onboardedStaff: [] });
      setSlots([]);
      setDocuments(SYSTEM_CURRICULUM_DOCS);
      setActiveTab('dashboard');
    }
  };

  const stats = {
    sowCount: JSON.parse(localStorage.getItem('eduplan_sow_history') || '[]').length,
    planCount: JSON.parse(localStorage.getItem('eduplan_plan_history') || '[]').length,
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
                {syncStatus === 'online' ? 'Cloud' : syncStatus === 'syncing' ? 'Sync' : 'Local'}
              </span>
            </div>
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
          {activeTab === 'registry' && <StaffManagement profile={profile} setProfile={setProfile} />}
          {activeTab === 'timetable' && <Timetable slots={slots} setSlots={setSlots} profile={profile} setProfile={setProfile} />}
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
            />
          )}
          {activeTab === 'lesson-planner' && (
            <LessonPlanner 
              knowledgeContext={documents.filter(d => d.isActiveContext).map(d => d.content).join('\n\n')} 
              prefill={plannerPrefill}
              onClearPrefill={() => setPlannerPrefill(null)}
              userProfile={profile}
            />
          )}
          {activeTab === 'documents' && <DocumentLibrary documents={documents} setDocuments={setDocuments} />}
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
                <input type="text" className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 text-sm font-black outline-none focus:border-indigo-600 transition" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="e.g. Ms. Jane Doe" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">TSC Professional ID</label>
                <input type="text" className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 text-sm font-black outline-none focus:border-indigo-600 transition" value={profile.tscNumber} onChange={e => setProfile({...profile, tscNumber: e.target.value})} placeholder="7654321" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Current Institution</label>
                <input type="text" className="w-full border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 text-sm font-black outline-none focus:border-indigo-600 transition" value={profile.school} onChange={e => setProfile({...profile, school: e.target.value})} placeholder="Mombasa Academy" />
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
                    {isUsingManualConfig && (
                      <div className="flex justify-between items-center border-t pt-3 border-slate-200">
                         <span className="text-[9px] font-bold text-indigo-600 uppercase">Manual Override:</span>
                         <button onClick={clearManualConfig} className="text-[9px] font-black bg-red-100 text-red-600 px-3 py-1 rounded-lg uppercase tracking-widest">Clear</button>
                      </div>
                    )}
                 </div>
                 {!hasSystemConfig && (
                   <p className="text-[8px] text-amber-600 font-bold mt-2 uppercase text-center leading-relaxed">
                     System keys missing. Teachers will see setup screen until "Production" keys are fixed in Vercel.
                   </p>
                 )}
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