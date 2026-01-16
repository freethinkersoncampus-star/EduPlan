import React from 'react';
import { UserProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: UserProfile;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, profile, onLogout, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'fa-th-large', label: 'My Dashboard' },
    { id: 'registry', icon: 'fa-school', label: 'School Registry' },
    { id: 'timetable', icon: 'fa-calendar-alt', label: 'My Timetable' },
    { id: 'sow', icon: 'fa-file-signature', label: 'My Schemes' },
    { id: 'lesson-planner', icon: 'fa-book-open', label: 'Planner & Notes' },
    { id: 'documents', icon: 'fa-folder-open', label: 'Knowledge Base' },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-indigo-950/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300" 
          onClick={onClose}
        />
      )}

      <div className={`
        fixed left-0 top-0 h-full w-72 bg-indigo-900 text-white z-50 shadow-2xl transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col overflow-y-auto
      `}>
        <div className="p-8 text-center border-b border-white/5 relative">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 text-indigo-300 hover:text-white md:hidden p-2"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
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
              onClick={() => handleTabClick(item.id)}
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
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.tscNumber || 'teacher'}`} 
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
    </>
  );
};

export default Sidebar;