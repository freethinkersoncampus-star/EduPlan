
import React from 'react';
import { UserProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: UserProfile;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, profile }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'fa-th-large', label: 'My Dashboard' },
    { id: 'timetable', icon: 'fa-calendar-alt', label: 'My Timetable' },
    { id: 'sow', icon: 'fa-file-signature', label: 'My Schemes' },
    { id: 'lesson-planner', icon: 'fa-book-open', label: 'Planner & Notes' },
    { id: 'documents', icon: 'fa-folder-open', label: 'Knowledge Base' },
  ];

  return (
    <div className="w-64 bg-indigo-900 text-white h-full fixed left-0 top-0 overflow-y-auto flex flex-col z-40 shadow-2xl">
      <div className="p-6">
        <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
          <i className="fas fa-graduation-cap text-yellow-400"></i>
          <span>EduPlan</span>
        </h1>
        <p className="text-indigo-300 text-[9px] mt-1 font-black uppercase tracking-[0.2em]">Personal Assistant</p>
      </div>

      <nav className="mt-8 px-4 flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ${
              activeTab === item.id 
                ? 'bg-white text-indigo-900 shadow-xl' 
                : 'text-indigo-200 hover:bg-indigo-800/50'
            }`}
          >
            <i className={`fas ${item.icon} w-5 text-sm`}></i>
            <span className="font-bold text-xs uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 bg-indigo-950/40 border-t border-white/10">
        <div className="flex items-center gap-3">
          <img 
            src={`https://picsum.photos/seed/${profile.tscNumber || 'default'}/100/100`} 
            className="w-10 h-10 rounded-full border-2 border-indigo-400/50"
            alt="Teacher"
          />
          <div className="overflow-hidden">
            <p className="text-xs font-black truncate">{profile.name || 'Teacher'}</p>
            <p className="text-[9px] text-indigo-400 font-black uppercase truncate tracking-widest">{profile.school || 'KICD Master'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
