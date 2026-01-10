
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
}

const Dashboard: React.FC<DashboardProps> = ({ stats, slots, user }) => {
  const statCards = [
    { label: 'Schemes', value: stats.sowCount.toString(), icon: 'fa-file-invoice', color: 'bg-blue-500' },
    { label: 'Plans', value: stats.planCount.toString(), icon: 'fa-book-open', color: 'bg-emerald-500' },
    { label: 'Subjects', value: stats.subjectCount.toString(), icon: 'fa-graduation-cap', color: 'bg-amber-500' },
    { label: 'Next Lsn', value: stats.nextLesson, icon: 'fa-clock', color: 'bg-indigo-500' },
  ];

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySlots = slots.filter(s => s.day === currentDay).sort((a,b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="p-4 md:p-6 pb-20">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Hello, {user.name || 'Teacher'}</h1>
        <p className="text-slate-500 text-sm mt-1">Today is {currentDay}. Here is your classroom overview.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-5">
            <div className={`${stat.color} w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
              <i className={`fas ${stat.icon} text-sm md:text-lg`}></i>
            </div>
            <div className="overflow-hidden">
              <p className="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
              <p className="text-base md:text-xl font-bold text-slate-800 truncate">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 md:p-5 border-b flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm md:text-base">Today's Lessons</h3>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-tighter">{currentDay}</span>
          </div>
          <div className="divide-y">
            {todaySlots.length > 0 ? todaySlots.map((lsn, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition group">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="text-center w-16 flex-shrink-0">
                    <p className="text-[10px] font-black text-indigo-600 leading-none">{lsn.startTime}</p>
                    <div className="h-2 w-[1px] bg-slate-200 mx-auto my-0.5"></div>
                    <p className="text-[8px] font-bold text-slate-400 leading-none">{lsn.endTime}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 text-sm md:text-base group-hover:text-indigo-600 transition">{lsn.subject}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{lsn.grade}</p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span className="text-[9px] font-black px-2 py-1 rounded bg-slate-100 text-slate-500 uppercase">Lesson {idx + 1}</span>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400">
                <i className="fas fa-calendar-day text-3xl mb-2 opacity-10"></i>
                <p className="text-xs font-medium uppercase tracking-widest">Free Day</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-indigo-900 rounded-2xl md:rounded-3xl shadow-xl p-6 md:p-8 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-3">AI Quick Launch</h3>
            <p className="text-indigo-200 text-xs mb-8 leading-relaxed">Start your weekly planning by generating a KICD-compliant Scheme of Work instantly.</p>
            <button className="w-full bg-yellow-400 text-indigo-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-300 transition shadow-lg active:scale-95 duration-75">
              Launch SOW AI
            </button>
          </div>
          <div className="mt-12 relative z-10 hidden sm:block">
            <div className="flex gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <i className="fas fa-lightbulb text-yellow-400 mt-1"></i>
              <p className="text-[10px] text-indigo-100 leading-relaxed italic">Did you know? You can upload your KICD books to the Knowledge Base to make your generated notes 100% accurate to the text book.</p>
            </div>
          </div>
          <i className="fas fa-graduation-cap absolute bottom-[-40px] right-[-40px] text-indigo-800 text-9xl opacity-10 pointer-events-none"></i>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
