
import React from 'react';
import { LessonSlot, UserProfile } from '../types';

interface DashboardProps {
  stats: {
    sowCount: number;
    planCount: number;
    subjectCount: number;
    nextLesson: string;
  };
  slots: LessonSlot[];
  user: UserProfile;
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, slots, user, onNavigate }) => {
  const statCards = [
    { label: 'Schemes', value: stats.sowCount.toString(), icon: 'fa-file-invoice', color: 'bg-blue-600' },
    { label: 'Lesson Plans', value: stats.planCount.toString(), icon: 'fa-book-open', color: 'bg-emerald-600' },
    { label: 'My Subjects', value: stats.subjectCount.toString(), icon: 'fa-graduation-cap', color: 'bg-amber-500' },
    { label: 'Staff Registry', value: (user.onboardedStaff?.length || 0).toString(), icon: 'fa-users', color: 'bg-indigo-600' },
  ];

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySlots = slots.filter(s => s.day === currentDay).sort((a,b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="p-4 md:p-8 pb-20 animate-in fade-in duration-700">
      <div className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase mb-1">Jambo, {user.name || 'Teacher'}</h1>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase tracking-widest">{user.school || 'Private Institution'}</span>
          <span className="text-slate-400 text-[10px] uppercase tracking-widest font-black">{currentDay}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg`}>
              <i className={`fas ${stat.icon} text-lg`}></i>
            </div>
            <div className="w-full">
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-xl md:text-2xl font-black text-slate-800 truncate leading-none">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Schedule Section */}
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Today's Academic Schedule</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Live from your timetable</p>
              </div>
              <button onClick={() => onNavigate('timetable')} className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl uppercase hover:bg-indigo-100 transition">View Full</button>
            </div>
            <div className="divide-y flex-1">
              {todaySlots.length > 0 ? todaySlots.map((lsn, idx) => (
                <div key={idx} className="p-8 flex items-center justify-between hover:bg-slate-50/80 transition group cursor-pointer">
                  <div className="flex items-center gap-8">
                    <div className="text-center w-24 flex-shrink-0">
                      <p className="text-[12px] font-black text-indigo-600 leading-none mb-1">{lsn.startTime}</p>
                      <div className="h-4 w-[1px] bg-indigo-100 mx-auto"></div>
                      <p className="text-[10px] font-bold text-slate-400 leading-none">{lsn.endTime}</p>
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition uppercase tracking-tight leading-none mb-1.5">{lsn.subject}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                        <i className="fas fa-layer-group text-indigo-300"></i>
                        {lsn.grade}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black px-4 py-2 rounded-2xl bg-slate-100 text-slate-500 uppercase tracking-widest">Period {idx + 1}</span>
                    <button className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-400 opacity-0 group-hover:opacity-100 transition"><i className="fas fa-arrow-right text-[10px]"></i></button>
                  </div>
                </div>
              )) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-slate-300">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <i className="fas fa-calendar-day text-4xl opacity-10"></i>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">No Lessons Scheduled for Today</p>
                </div>
              )}
            </div>
          </div>

          {/* Registry Quick View */}
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
             <div className="flex justify-between items-center mb-10 relative z-10">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">School Registry</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Staff and Curriculum Database</p>
                </div>
                <button onClick={() => onNavigate('registry')} className="bg-white/10 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition border border-white/10">Manage →</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
                   <div className="flex items-center gap-3 mb-4">
                      <i className="fas fa-layer-group text-indigo-400"></i>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Grades</p>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {user.grades?.length ? user.grades.slice(0, 4).map(g => <span key={g} className="text-[10px] font-black px-4 py-1.5 bg-white/10 rounded-xl border border-white/5">{g}</span>) : <span className="text-[9px] opacity-30 italic">No grades defined</span>}
                      {user.grades && user.grades.length > 4 && <span className="text-[10px] font-black px-4 py-1.5 bg-indigo-600/30 rounded-xl">+{user.grades.length - 4} More</span>}
                   </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
                   <div className="flex items-center gap-3 mb-4">
                      <i className="fas fa-book-reader text-emerald-400"></i>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Learning Areas</p>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {user.availableSubjects?.length ? user.availableSubjects.slice(0, 4).map(s => <span key={s} className="text-[10px] font-black px-4 py-1.5 bg-white/10 rounded-xl border border-white/5">{s}</span>) : <span className="text-[9px] opacity-30 italic">No subjects defined</span>}
                      {user.availableSubjects && user.availableSubjects.length > 4 && <span className="text-[10px] font-black px-4 py-1.5 bg-emerald-600/30 rounded-xl">+{user.availableSubjects.length - 4} More</span>}
                   </div>
                </div>
             </div>
             <i className="fas fa-school absolute bottom-[-40px] right-[-40px] text-white/5 text-[15rem] pointer-events-none -rotate-12"></i>
          </div>
        </div>

        {/* AI Launch Section */}
        <div className="bg-indigo-700 rounded-[3rem] shadow-2xl shadow-indigo-200 p-10 text-white relative overflow-hidden flex flex-col">
          <div className="relative z-10 flex-1">
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-8 border border-white/20 backdrop-blur-md">
              <i className="fas fa-robot text-3xl text-yellow-400"></i>
            </div>
            <h3 className="text-3xl font-black tracking-tighter uppercase mb-4 leading-none">Pedagogical<br/>Studio</h3>
            <p className="text-indigo-100 text-[11px] mb-12 leading-relaxed font-medium opacity-80">Generate KICD-compliant Schemes of Work and Lesson Plans instantly using Gemini 3.0 Pro.</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => onNavigate('sow')}
                className="w-full bg-yellow-400 text-indigo-900 py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-yellow-300 transition-all shadow-xl shadow-indigo-900/20 active:scale-95"
              >
                Start Scheme AI
              </button>
              <button 
                onClick={() => onNavigate('lesson-planner')}
                className="w-full bg-indigo-800 text-white py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-900 transition-all border border-indigo-600 shadow-xl shadow-indigo-900/10"
              >
                Open Lesson Studio
              </button>
            </div>
          </div>
          
          <div className="mt-16 relative z-10">
            <div className="bg-black/20 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                 <i className="fas fa-shield-alt text-yellow-400 text-sm"></i>
                 <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Cloud Secured</span>
              </div>
              <p className="text-[10px] text-indigo-100 leading-relaxed font-bold uppercase tracking-wide">
                Authorized for {user.school || 'Unset Institution'}.
              </p>
            </div>
          </div>
          <i className="fas fa-graduation-cap absolute bottom-[-50px] left-[-50px] text-white/5 text-[15rem] pointer-events-none rotate-45"></i>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
