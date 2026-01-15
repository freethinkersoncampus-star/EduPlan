
import React from 'react';
import { OnboardedTeacher, UserProfile } from '../types';

interface StaffManagementProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  syncStatus?: string;
  syncMessage?: string;
  lastSynced?: string | null;
  onForceSync?: () => void;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ 
  profile, 
  setProfile, 
  syncStatus, 
  syncMessage, 
  lastSynced, 
  onForceSync 
}) => {
  const [newStaff, setNewStaff] = useStateStaff({
    name: '',
    tscNumber: '',
    role: 'Teacher' as OnboardedTeacher['role']
  });

  const [newSubject, setNewSubject] = React.useState('');
  const [newGrade, setNewGrade] = React.useState('');

  // Helper to update specific fields in the teacher's own profile
  const updateMyProfile = (field: keyof UserProfile, value: any) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.tscNumber) return;
    const staff: OnboardedTeacher = {
      id: Date.now().toString(),
      name: newStaff.name,
      tscNumber: newStaff.tscNumber,
      role: newStaff.role,
      onboardedDate: new Date().toLocaleDateString()
    };
    const updatedStaff = [...(profile.onboardedStaff || []), staff];
    setProfile({ ...profile, onboardedStaff: updatedStaff });
    setNewStaff({ name: '', tscNumber: '', role: 'Teacher' });
  };

  const removeStaff = (id: string) => {
    const updatedStaff = (profile.onboardedStaff || []).filter(s => s.id !== id);
    setProfile({ ...profile, onboardedStaff: updatedStaff });
  };

  const handleAddSubject = () => {
    if (!newSubject || (profile.availableSubjects || []).includes(newSubject)) return;
    setProfile({ ...profile, availableSubjects: [...(profile.availableSubjects || []), newSubject] });
    setNewSubject('');
  };

  const removeSubject = (subject: string) => {
    setProfile({ ...profile, availableSubjects: (profile.availableSubjects || []).filter(s => s !== subject) });
  };

  const handleAddGrade = () => {
    if (!newGrade || (profile.grades || []).includes(newGrade)) return;
    setProfile({ ...profile, grades: [...(profile.grades || []), newGrade] });
    setNewGrade('');
  };

  const removeGrade = (grade: string) => {
    setProfile({ ...profile, grades: (profile.grades || []).filter(g => g !== grade) });
  };

  function useStateStaff(initial: any) {
    return React.useState(initial);
  }

  return (
    <div className="p-4 md:p-8 animate-in fade-in duration-500">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter text-black">Registry & Profile</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Configure your identity and school workload</p>
        </div>
        
        {/* NEW: VISUAL SYNC LOG / CONTROL PANEL */}
        <div className="bg-white border-2 border-slate-100 p-4 rounded-[1.5rem] shadow-sm flex items-center gap-4 animate-in slide-in-from-right duration-500">
           <div className="text-right">
              <p className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1 ${
                syncStatus === 'error' ? 'text-red-500' : syncStatus === 'syncing' ? 'text-amber-500' : 'text-emerald-500'
              }`}>
                {syncMessage || 'Vault Active'}
              </p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Last Sync: {lastSynced || 'Pending'}</p>
           </div>
           <button 
             onClick={onForceSync}
             className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-indigo-700 transition active:scale-95 shadow-lg shadow-indigo-100"
             title="Manual Cloud Sync"
           >
              <i className={`fas fa-sync-alt ${syncStatus === 'syncing' ? 'fa-spin' : ''}`}></i>
           </button>
        </div>
      </div>

      {/* PERSONAL PROFILE SETUP SECTION */}
      <div className="bg-indigo-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl mb-12 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
            <i className="fas fa-id-card text-yellow-400"></i>
            My Professional Identity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block mb-2 ml-1">My Full Name</label>
              <input 
                type="text" 
                placeholder="Enter your name"
                className="w-full bg-white/10 border-2 border-white/10 p-4 rounded-2xl text-white font-black text-xs outline-none focus:border-white/40 transition-all placeholder:text-white/20"
                value={profile.name || ''}
                onChange={e => updateMyProfile('name', e.target.value)}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block mb-2 ml-1">My TSC Number</label>
              <input 
                type="text" 
                placeholder="TSC-XXXXXX"
                className="w-full bg-white/10 border-2 border-white/10 p-4 rounded-2xl text-white font-black text-xs outline-none focus:border-white/40 transition-all placeholder:text-white/20"
                value={profile.tscNumber || ''}
                onChange={e => updateMyProfile('tscNumber', e.target.value)}
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block mb-2 ml-1">My Current School</label>
              <input 
                type="text" 
                placeholder="School Name"
                className="w-full bg-white/10 border-2 border-white/10 p-4 rounded-2xl text-white font-black text-xs outline-none focus:border-white/40 transition-all placeholder:text-white/20"
                value={profile.school || ''}
                onChange={e => updateMyProfile('school', e.target.value)}
              />
            </div>
          </div>
        </div>
        <i className="fas fa-user-circle absolute right-[-50px] bottom-[-50px] text-white/5 text-[20rem] pointer-events-none rotate-12"></i>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="font-black text-slate-800 mb-6 uppercase text-[10px] tracking-widest flex items-center gap-3">
            <i className="fas fa-book text-indigo-500"></i>
            Global Subjects Library
          </h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 text-[11px] font-bold outline-none focus:border-indigo-500 transition" 
                value={newSubject} 
                onChange={e => setNewSubject(e.target.value)}
                placeholder="e.g. Mathematics"
                onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
              />
              <button onClick={handleAddSubject} className="bg-indigo-600 text-white px-6 rounded-2xl hover:bg-indigo-700 transition">
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar flex flex-wrap gap-2 pt-2">
              {(profile.availableSubjects || []).map(subject => (
                <div key={subject} className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-xl group border border-slate-200">
                  <span className="font-black text-slate-700 text-[10px] uppercase tracking-tighter">{subject}</span>
                  <button onClick={() => removeSubject(subject)} className="text-slate-300 hover:text-red-500 transition">
                    <i className="fas fa-times-circle"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="font-black text-slate-800 mb-6 uppercase text-[10px] tracking-widest flex items-center gap-3">
            <i className="fas fa-school text-indigo-500"></i>
            Global Grade Registry
          </h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 border-2 border-slate-50 p-4 rounded-2xl bg-slate-50 text-[11px] font-bold outline-none focus:border-indigo-500 transition" 
                value={newGrade} 
                onChange={e => setNewGrade(e.target.value)}
                placeholder="e.g. Grade 7 Alpha"
                onKeyDown={e => e.key === 'Enter' && handleAddGrade()}
              />
              <button onClick={handleAddGrade} className="bg-indigo-600 text-white px-6 rounded-2xl hover:bg-indigo-700 transition">
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar flex flex-wrap gap-2 pt-2">
              {(profile.grades || []).map(grade => (
                <div key={grade} className="flex items-center gap-3 px-4 py-2 bg-slate-100 rounded-xl group border border-slate-200">
                  <span className="font-black text-slate-700 text-[10px] uppercase tracking-tighter">{grade}</span>
                  <button onClick={() => removeGrade(grade)} className="text-slate-300 hover:text-red-500 transition">
                    <i className="fas fa-times-circle"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mb-12">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Staff Directory</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Authorized educators at {profile.school || 'Unset School'}</p>
          </div>
          <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
             <i className="fas fa-user-plus"></i> Add Staff
          </button>
        </div>
        
        <div className="p-8 bg-slate-50/20 border-b">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input placeholder="Name" className="bg-white border p-3 rounded-xl text-[10px] font-black uppercase" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
              <input placeholder="TSC #" className="bg-white border p-3 rounded-xl text-[10px] font-black uppercase" value={newStaff.tscNumber} onChange={e => setNewStaff({...newStaff, tscNumber: e.target.value})} />
              <select className="bg-white border p-3 rounded-xl text-[10px] font-black uppercase" value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as any})}>
                <option>Teacher</option><option>HOD</option><option>Deputy</option><option>Principal</option>
              </select>
              <button onClick={handleAddStaff} className="bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Register Staff</button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-[0.2em]">
              <tr>
                <th className="p-6 text-left">Staff Member</th>
                <th className="p-6 text-left">TSC Number</th>
                <th className="p-6 text-left">Role</th>
                <th className="p-6 text-left">Onboarded</th>
                <th className="p-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profile.onboardedStaff?.map(staff => (
                <tr key={staff.id} className="hover:bg-slate-50 transition group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.tscNumber}`} className="w-10 h-10 rounded-xl border-2 border-slate-100" />
                      <span className="font-black text-slate-800 text-[11px] uppercase tracking-tight">{staff.name}</span>
                    </div>
                  </td>
                  <td className="p-6 font-black text-[10px] text-indigo-600 uppercase tracking-widest">{staff.tscNumber}</td>
                  <td className="p-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      staff.role === 'Principal' ? 'bg-purple-100 text-purple-700' :
                      staff.role === 'HOD' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {staff.role}
                    </span>
                  </td>
                  <td className="p-6 text-[10px] text-slate-400 font-bold">{staff.onboardedDate}</td>
                  <td className="p-6 text-center">
                    <button onClick={() => removeStaff(staff.id)} className="text-slate-200 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
