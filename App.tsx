
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Timetable from './components/Timetable';
import SOWGenerator from './components/SOWGenerator';
import LessonPlanner from './components/LessonPlanner';
import DocumentLibrary from './components/DocumentLibrary';
import { LessonSlot, UserProfile, KnowledgeDocument, SOWRow } from './types';

// Comprehensive National Repository of KICD Rationalized Curriculum Designs (Grades 4-12)
const SYSTEM_CURRICULUM_DOCS: KnowledgeDocument[] = [
  // Frameworks
  {
    id: 'sys-kicd-framework-2025',
    title: 'National Rationalized Curriculum Framework (All Levels)',
    content: 'The official 2025 framework defining core competencies, values, and the structure of rationalized learning areas for primary, junior, and senior school levels.',
    type: 'KICD', size: '6.2 MB', date: 'Jan 2025', category: 'Framework', isActiveContext: true, isSystemDoc: true,
    officialSourceUrl: 'https://kicd.ac.ke/rationalized-curriculum-designs/'
  },
  // Grade 4-6 (Primary)
  {
    id: 'sys-kicd-math-primary',
    title: 'Mathematics Curriculum Design - Grades 4-6',
    content: 'Rationalized Primary Math. Topics: Whole numbers, Addition, Subtraction, Multiplication, Division, Fractions, Decimals, Measurement, Geometry, Data handling.',
    type: 'KICD', size: '2.2 MB', date: '2024', category: 'Primary (4-6)', isActiveContext: true, isSystemDoc: true,
    officialSourceUrl: 'https://kicd.ac.ke/rationalized-curriculum-designs/'
  },
  // Grade 7-9 (Junior School)
  {
    id: 'sys-kicd-math-junior',
    title: 'Mathematics Curriculum Design - Junior School (G7-9)',
    content: 'Rationalized Junior School Math. Rational numbers, Algebra, Geometry (Angles), Measurement (Surface Area & Volume). Prep for senior pathways.',
    type: 'KICD', size: '2.8 MB', date: 'Oct 2024', category: 'Junior (7-9)', isActiveContext: true, isSystemDoc: true,
    officialSourceUrl: 'https://kicd.ac.ke/rationalized-curriculum-designs/'
  },
  {
    id: 'sys-kicd-science-junior',
    title: 'Integrated Science Design - Junior School (G7-9)',
    content: 'Rationalized Science. Mixtures, Elements, Laboratory safety, Human physiology (Respiratory system), and Environmental conservation.',
    type: 'KICD', size: '3.1 MB', date: 'Nov 2024', category: 'Junior (7-9)', isActiveContext: true, isSystemDoc: true,
    officialSourceUrl: 'https://kicd.ac.ke/rationalized-curriculum-designs/'
  },
  {
    id: 'sys-kicd-languages-junior',
    title: 'English & Kiswahili Designs - Junior School (G7-9)',
    content: 'Functional writing, Grammar (Tenses, Pronouns), Listening and Speaking. Sarufi ya Kiswahili na uandishi bunifu.',
    type: 'KICD', size: '4.0 MB', date: 'Dec 2024', category: 'Junior (7-9)', isActiveContext: true, isSystemDoc: true,
    officialSourceUrl: 'https://kicd.ac.ke/rationalized-curriculum-designs/'
  },
  // Grade 10-12 (Senior School Pathways)
  {
    id: 'sys-kicd-stem-senior',
    title: 'Senior School STEM Pathway Design (G10-12)',
    content: 'Advanced Pure Mathematics, Physics, Chemistry, Biology, and ICT. Focus on innovation and technical proficiency for tertiary transition.',
    type: 'KICD', size: '5.2 MB', date: '2025', category: 'Senior (10-12)', isActiveContext: true, isSystemDoc: true,
    officialSourceUrl: 'https://kicd.ac.ke/rationalized-curriculum-designs/'
  },
  {
    id: 'sys-kicd-soc-senior',
    title: 'Social Sciences Pathway Design (G10-12)',
    content: 'History, Geography, Christian/Islamic Religious Education, and Business Studies. Development of critical analysis and global citizenship.',
    type: 'KICD', size: '4.8 MB', date: '2025', category: 'Senior (10-12)', isActiveContext: true, isSystemDoc: true,
    officialSourceUrl: 'https://kicd.ac.ke/rationalized-curriculum-designs/'
  },
  {
    id: 'sys-kicd-arts-senior',
    title: 'Arts & Sports Science Pathway Design (G10-12)',
    content: 'Music, Theatre, Fine Arts, and Sports Science. Focus on talent commercialization and professional creative development.',
    type: 'KICD', size: '4.5 MB', date: '2025', category: 'Senior (10-12)', isActiveContext: true, isSystemDoc: true,
    officialSourceUrl: 'https://kicd.ac.ke/rationalized-curriculum-designs/'
  },
  // Technical & Applied
  {
    id: 'sys-kicd-tech-applied',
    title: 'Pre-Technical & Applied Sciences Design',
    content: 'Introduction to Technical Drawing, Materials, Energy, Agriculture, and Nutrition. Foundations of engineering and vocational skills.',
    type: 'KICD', size: '3.8 MB', date: 'Jan 2025', category: 'Technical/Applied', isActiveContext: true, isSystemDoc: true,
    officialSourceUrl: 'https://kicd.ac.ke/rationalized-curriculum-designs/'
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [currentSow, setCurrentSow] = useState<SOWRow[]>([]);
  const [currentSowMeta, setCurrentSowMeta] = useState({
    subject: '',
    grade: '',
    term: 1,
    termStart: new Date().toISOString().split('T')[0],
    termEnd: '',
    halfTermStart: '',
    halfTermEnd: ''
  });

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
      subjects: []
    };
  });

  const [documents, setDocuments] = useState<KnowledgeDocument[]>(() => {
    const saved = localStorage.getItem('eduplan_docs');
    const existingDocs: KnowledgeDocument[] = saved ? JSON.parse(saved) : [];
    
    // Refresh System Docs: Filter out old ones and inject current SYSTEM_CURRICULUM_DOCS
    const nonSystemDocs = existingDocs.filter(d => !d.isSystemDoc);
    return [...SYSTEM_CURRICULUM_DOCS, ...nonSystemDocs];
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
    subjectCount: profile.subjects.length,
    nextLesson: slots.length > 0 ? `${slots[0].subject} (${slots[0].grade})` : 'Setup timetable'
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard stats={stats} slots={slots} user={profile} />;
      case 'timetable': return <Timetable slots={slots} setSlots={setSlots} profile={profile} setProfile={setProfile} />;
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
            userProfile={profile}
          />
        );
      case 'lesson-planner': 
        return (
          <LessonPlanner 
            knowledgeContext={knowledgeContext} 
            prefill={plannerPrefill}
            onClearPrefill={() => setPlannerPrefill(null)}
            userProfile={profile}
          />
        );
      case 'documents': return <DocumentLibrary documents={documents} setDocuments={setDocuments} />;
      default: return <Dashboard stats={stats} slots={slots} user={profile} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 flex-col md:flex-row">
      <div className="hidden md:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} />
      </div>
      
      <main className="flex-1 md:ml-64 overflow-y-auto min-h-screen pb-24 md:pb-12">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="md:hidden w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
              {activeTab}
            </span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={() => setIsProfileModalOpen(true)}>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition">{profile.name || 'Set Name'}</p>
              <p className="text-[9px] font-bold text-indigo-500 uppercase">{profile.school || 'Set School'}</p>
            </div>
            <img src={`https://picsum.photos/seed/${profile.tscNumber || 'def'}/100/100`} className="w-8 h-8 rounded-full border-2 border-indigo-100" alt="Profile" />
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 flex justify-around items-center p-3 z-50 shadow-lg">
        {[
          { id: 'dashboard', icon: 'fa-th-large', label: 'Home' },
          { id: 'timetable', icon: 'fa-calendar-alt', label: 'Time' },
          { id: 'sow', icon: 'fa-file-signature', label: 'SOW' },
          { id: 'lesson-planner', icon: 'fa-book-open', label: 'Planner' },
          { id: 'documents', icon: 'fa-folder-open', label: 'Docs' },
        ].map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
            <i className={`fas ${item.icon} text-lg`}></i>
            <span className="text-[9px] font-bold uppercase">{item.label}</span>
          </button>
        ))}
      </nav>

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-indigo-900 text-white"><h3 className="text-xl font-bold">Teacher Profile</h3></div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                <input type="text" className="w-full border p-3 rounded-xl bg-slate-50 text-sm" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">TSC Number</label>
                <input type="text" className="w-full border p-3 rounded-xl bg-slate-50 text-sm" value={profile.tscNumber} onChange={e => setProfile({...profile, tscNumber: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">School Name</label>
                <input type="text" className="w-full border p-3 rounded-xl bg-slate-50 text-sm" value={profile.school} onChange={e => setProfile({...profile, school: e.target.value})} />
              </div>
              <button onClick={() => setIsProfileModalOpen(false)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold">Save Settings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
