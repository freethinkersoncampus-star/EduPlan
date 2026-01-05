
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'fa-th-large', label: 'Dashboard' },
    { id: 'timetable', icon: 'fa-calendar-alt', label: 'Timetable' },
    { id: 'sow', icon: 'fa-file-signature', label: 'Schemes of Work' },
    { id: 'lesson-planner', icon: 'fa-book-open', label: 'Lesson Planner' },
    { id: 'notes', icon: 'fa-sticky-note', label: 'Subject Notes' },
    { id: 'documents', icon: 'fa-folder-open', label: 'Documents & KICD' },
  ];

  return (
    <div className="w-64 bg-indigo-900 text-white h-full fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <i className="fas fa-graduation-cap text-yellow-400"></i>
          <span>EduPlan</span>
        </h1>
        <p className="text-indigo-300 text-xs mt-1 uppercase tracking-widest">CBC Master Platform</p>
      </div>

      <nav className="mt-6 px-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 mb-2 ${
              activeTab === item.id 
                ? 'bg-white text-indigo-900 shadow-lg' 
                : 'text-indigo-200 hover:bg-indigo-800'
            }`}
          >
            <i className={`fas ${item.icon} w-5`}></i>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full p-6 bg-indigo-950/50">
        <div className="flex items-center gap-3">
          <img 
            src="https://picsum.photos/seed/teacher/100/100" 
            className="w-10 h-10 rounded-full border-2 border-indigo-500"
            alt="Teacher"
          />
          <div>
            <p className="text-sm font-semibold">Jane M. Doe</p>
            <p className="text-xs text-indigo-400">TSC: 12345678</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
