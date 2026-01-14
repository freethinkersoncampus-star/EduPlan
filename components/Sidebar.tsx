
import React from 'react';
import { UserProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: UserProfile;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, profile, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'fa-th-large', label: 'My Dashboard' },
    { id: 'registry', icon: 'fa-school', label: 'School Registry' },
    { id: 'timetable', icon: 'fa-calendar-alt', label: 'My Timetable' },
    { id: 'sow', icon: 'fa-file-signature', label: 'My Schemes' },
    { id: 'lesson-planner', icon: 'fa-book-open', label: 'Planner & Notes' },
    { id: 'documents', icon: 'fa-folder-open', label: 'Knowledge Base' },
  ];

  return (
    <div className="w-64 bg-indigo-900 text-white h-full fixed left-0 top-0 overflow-y-auto flex flex-col z-40 shadow-2xl hidden md:flex">
      <div className="p-8 text-center border-b border-white/5">
        <h1 className="text-2xl font-black tracking-tighter flex items-center justify-center gap-3">
          <i className="fas fa-graduation-cap text-yellow-400"></i>
          <span>EduPlan</span>
        </h1>
        <p className="text-indigo-400 text-[9px] mt-1.5 font-black uppercase tracking-[0.2em]">CBE Master Edition</p>
      </div>

      <nav className="mt-8 px-5 flex-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
              activeTab === item.id 
                ? 'bg-white text-indigo-900 shadow-2xl scale-[1.02]' 
                : 'text-indigo-200 hover:bg-indigo-800/50'
            }`}
          >
            <i className={`fas ${item.icon} w-5 text-sm`}></i>
            <span className="font-black text-[10px] uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-8 bg-indigo-950/40 border-t border-white/5 space-y-6">
        <div className="flex items-center gap-4">
          <img 
            src={`https://picsum.photos/seed/${profile.tscNumber || 'teacher'}/100/100`} 
            className="w-10 h-10 rounded-full border-2 border-indigo-400/30 shadow-lg"
            alt="Teacher"
          />
          <div className="overflow-hidden">
            <p className="text-[11px] font-black truncate uppercase leading-none mb-1 text-white">{profile.name || 'Teacher'}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">Active Now</p>
            </div>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 py-3 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-300 hover:bg-red-500 hover:text-white transition-all duration-300"
        >
          <i className="fas fa-sign-out-alt"></i>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
