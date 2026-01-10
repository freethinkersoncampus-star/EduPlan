
import React, { useState } from 'react';
import { OnboardedTeacher, UserProfile } from '../types';

interface StaffManagementProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ profile, setProfile }) => {
  const [newStaff, setNewStaff] = useState({
    name: '',
    tscNumber: '',
    role: 'Teacher' as OnboardedTeacher['role']
  });

  const [newSubject, setNewSubject] = useState('');
  const [newGrade, setNewGrade] = useState('');

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
    if (!newSubject || (profile.subjects || []).includes(newSubject)) return;
    setProfile({ ...profile, subjects: [...(profile.subjects || []), newSubject] });
    setNewSubject('');
  };

  const removeSubject = (subject: string) => {
    setProfile({ ...profile, subjects: (profile.subjects || []).filter(s => s !== subject) });
  };

  const handleAddGrade = () => {
    if (!newGrade || (profile.grades || []).includes(newGrade)) return;
    setProfile({ ...profile, grades: [...(profile.grades || []), newGrade] });
    setNewGrade('');
  };

  const removeGrade = (grade: string) => {
    setProfile({ ...profile, grades: (profile.grades || []).filter(g => g !== grade) });
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">School Registry Management</h2>
        <p className="text-slate-500 text-sm">Configure your school's staff, subjects, and grades to enable automated timetable generation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Staff Management Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <i className="fas fa-user-plus text-indigo-500"></i>
            Onboard New Staff
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
              <input 
                type="text" 
                className="w-full border p-3 rounded-xl bg-slate-50 mt-1 outline-none focus:ring-2 focus:ring-indigo-500" 
                value={newStaff.name} 
                onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                placeholder="e.g. Ms. Sarah Kemunto"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">TSC Number</label>
              <input 
                type="text" 
                className="w-full border p-3 rounded-xl bg-slate-50 mt-1 outline-none focus:ring-2 focus:ring-indigo-500" 
                value={newStaff.tscNumber} 
                onChange={e => setNewStaff({...newStaff, tscNumber: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Role</label>
              <select 
                className="w-full border p-3 rounded-xl bg-slate-50 mt-1 outline-none font-bold text-slate-700"
                value={newStaff.role}
                onChange={e => setNewStaff({...newStaff, role: e.target.value as any})}
              >
                <option>Teacher</option>
                <option>HOD</option>
                <option>Deputy</option>
                <option>Principal</option>
              </select>
            </div>
            <button 
              onClick={handleAddStaff}
              disabled={!newStaff.name || !newStaff.tscNumber}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition disabled:opacity-50"
            >
              Add Staff
            </button>
          </div>
        </div>

        {/* Subject Management Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <i className="fas fa-book text-indigo-500"></i>
            Manage Subjects
          </h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 border p-3 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500" 
                value={newSubject} 
                onChange={e => setNewSubject(e.target.value)}
                placeholder="e.g. Mathematics"
                onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
              />
              <button onClick={handleAddSubject} className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-700">
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {(profile.subjects || []).map(subject => (
                <div key={subject} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl group">
                  <span className="font-semibold text-slate-700">{subject}</span>
                  <button onClick={() => removeSubject(subject)} className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
              {(profile.subjects || []).length === 0 && <p className="text-center text-slate-400 text-xs italic py-4">No subjects added.</p>}
            </div>
          </div>
        </div>

        {/* Grades Management Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <i className="fas fa-school text-indigo-500"></i>
            Manage Grades/Streams
          </h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 border p-3 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500" 
                value={newGrade} 
                onChange={e => setNewGrade(e.target.value)}
                placeholder="e.g. Grade 7 Alpha"
                onKeyDown={e => e.key === 'Enter' && handleAddGrade()}
              />
              <button onClick={handleAddGrade} className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-700">
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {(profile.grades || []).map(grade => (
                <div key={grade} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl group">
                  <span className="font-semibold text-slate-700">{grade}</span>
                  <button onClick={() => removeGrade(grade)} className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
              {(profile.grades || []).length === 0 && <p className="text-center text-slate-400 text-xs italic py-4">No grades added.</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Staff Registry - {profile.school}</h3>
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black">
            {profile.onboardedStaff?.length || 0} Registered
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="p-4 text-left">Staff Member</th>
                <th className="p-4 text-left">TSC Number</th>
                <th className="p-4 text-left">Role</th>
                <th className="p-4 text-left">Onboarded</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profile.onboardedStaff?.map(staff => (
                <tr key={staff.id} className="hover:bg-slate-50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={`https://picsum.photos/seed/${staff.tscNumber}/50/50`} className="w-8 h-8 rounded-full" />
                      <span className="font-bold text-slate-700">{staff.name}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-indigo-600 font-bold">{staff.tscNumber}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      staff.role === 'Principal' ? 'bg-purple-100 text-purple-700' :
                      staff.role === 'HOD' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {staff.role}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-400">{staff.onboardedDate}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => removeStaff(staff.id)} className="text-slate-300 hover:text-red-500 transition">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {(!profile.onboardedStaff || profile.onboardedStaff.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 italic">
                    No staff onboarded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
