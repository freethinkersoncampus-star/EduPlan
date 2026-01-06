
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
  // Added user property to DashboardProps to fix type error in App.tsx
  user: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, slots, user }) => {
  const statCards = [
    { label: 'SOW Generated', value: stats.sowCount.toString(), icon: 'fa-file-invoice', color: 'bg-blue-500' },
    { label: 'Lesson Plans', value: stats.planCount.toString(), icon: 'fa-book-open', color: 'bg-emerald-500' },
    { label: 'Total Subjects', value: stats.subjectCount.toString(), icon: 'fa-graduation-cap', color: 'bg-amber-500' },
    { label: 'Next Lesson', value: stats.nextLesson, icon: 'fa-clock', color: 'bg-indigo-500' },
  ];

  // Get current day name
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySlots = slots.filter(s => s.day === currentDay).sort((a,b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="p-6">
      <div className="mb-8">
        {/* Updated to display dynamic user name from props instead of hardcoded "Jane" */}
        <h1 className="text-3xl font-bold text-slate-800">Welcome Back, {user.name}</h1>
        <p className="text-slate-500 mt-1">Here is what's happening today, {currentDay}, in your CBC classroom.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg`}>
              <i className={`fas ${stat.icon} text-lg`}></i>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Today's Schedule</h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">{currentDay}</span>
          </div>
          <div className="divide-y">
            {todaySlots.length > 0 ? todaySlots.map((lsn, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{lsn.startTime} - {lsn.endTime}</span>
                  <div>
                    <p className="font-bold text-slate-700">{lsn.subject}</p>
                    <p className="text-xs text-slate-400">{lsn.grade}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-indigo-100 text-indigo-700">
                  Upcoming
                </span>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400">
                <i className="fas fa-calendar-day text-3xl mb-2 opacity-20"></i>
                <p className="text-sm">No lessons scheduled for today.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-indigo-900 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-4">Quick SOW Action</h3>
            <p className="text-indigo-200 text-sm mb-6">Need a quick Scheme of Work for next week? Let Gemini handle the heavy lifting.</p>
            <button className="w-full bg-yellow-400 text-indigo-900 py-3 rounded-xl font-bold hover:bg-yellow-300 transition shadow-lg">
              Smart Generate SOW
            </button>
            <div className="mt-8 pt-8 border-t border-indigo-800">
              <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">Resource Tip</h4>
              <div className="flex gap-3">
                <i className="fas fa-lightbulb text-yellow-400"></i>
                <p className="text-xs text-indigo-200 leading-relaxed">Ensure your Learning Resources list in SOW includes locally available materials to meet CBC requirements.</p>
              </div>
            </div>
          </div>
          <i className="fas fa-magic absolute bottom-[-20px] right-[-20px] text-indigo-800 text-9xl opacity-20"></i>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
