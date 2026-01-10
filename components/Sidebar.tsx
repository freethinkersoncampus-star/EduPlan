
import React from 'react';
import { UserProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: UserProfile;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, profile }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'fa-th-large', label: 'Dashboard' },
    { id: 'timetable', icon: 'fa-calendar-alt', label: 'Timetable' },
    { id: 'sow', icon: 'fa-file-signature', label: 'Schemes of Work' },
    { id: 'lesson-planner', icon: 'fa-book-open', label: 'Lesson Planner' },
    { id: 'documents', icon: 'fa-folder-open', label: 'Knowledge Base' },
  ];

  // Only Master Admin sees Staff Management
  if (profile.isMasterAdmin) {
    menuItems.push({ id: 'staff', icon: 'fa-user-tie', label: 'Staff Management' });
  }

  return (
    <div className="w-64 bg-indigo-900 text-white h-full fixed left-0 top-0 overflow-y-auto flex flex-col z-40">
      <div className="p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <i className="fas fa-graduation-cap text-yellow-400"></i>
          <span>EduPlan</span>
        </h1>
        <p className="text-indigo-300 text-[10px] mt-1 uppercase tracking-widest font-bold">CBC Master Platform</p>
      </div>

      <nav className="mt-6 px-4 flex-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${
              activeTab === item.id 
                ? 'bg-white text-indigo-900 shadow-xl' 
                : 'text-indigo-200 hover:bg-indigo-800'
            }`}
          >
            <i className={`fas ${item.icon} w-5`}></i>
            <span className="font-semibold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 bg-indigo-950/50">
        <div className="flex items-center gap-3">
          <img 
            src={`https://picsum.photos/seed/${profile.tscNumber || 'default'}/100/100`} 
            className="w-10 h-10 rounded-full border-2 border-indigo-500"
            alt="Teacher"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate">{profile.name}</p>
            <p className="text-[10px] text-indigo-400 font-bold uppercase truncate">{profile.school}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
