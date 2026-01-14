import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail, isSupabaseConfigured, getMissingConfigInfo } from '../services/supabase';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { missing, hints } = getMissingConfigInfo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return;

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        alert("Account created! You can now sign in.");
        setIsSignUp(false);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Check your email/password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white font-inter">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl shadow-indigo-100 p-8 md:p-12 border border-slate-100 relative overflow-hidden">
        
        {/* Header */}
        <div className="text-center mb-10 relative z-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl shadow-2xl shadow-indigo-200 mx-auto mb-6 transform -rotate-6">
            <i className="fas fa-graduation-cap"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase mb-2">EduPlan <span className="text-indigo-600">Pro</span></h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">CBE Master Platform</p>
        </div>

        {!isSupabaseConfigured ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-amber-50 p-6 rounded-[2rem] border-2 border-amber-100 mb-6">
              <h3 className="text-[11px] font-black text-amber-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                <i className="fas fa-exclamation-triangle"></i> Environment Check
              </h3>
              <p className="text-[10px] text-amber-800 leading-relaxed font-bold">
                In Vercel Settings, click <b>Edit</b> on your keys and make sure the <b>"Production"</b> checkbox is checked. 
              </p>
              <p className="text-[9px] text-amber-700 mt-2 italic font-medium">
                Right now, your keys are set to "Preview" only, which hides them from your main website.
              </p>
            </div>

            <div className="bg-indigo-50 p-6 rounded-[2rem] border-2 border-indigo-100">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className={`p-4 rounded-2xl border ${missing.includes('SUPABASE_URL') ? 'bg-white border-red-200' : 'bg-emerald-50 border-emerald-100'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Variable 1</p>
                      {missing.includes('SUPABASE_URL') ? <i className="fas fa-times-circle text-red-400 text-xs"></i> : <i className="fas fa-check-circle text-emerald-500 text-xs"></i>}
                    </div>
                    <code className="text-[10px] font-black text-indigo-600 block mb-1">SUPABASE_URL</code>
                  </div>

                  <div className={`p-4 rounded-2xl border ${missing.includes('SUPABASE_ANON_KEY') ? 'bg-white border-red-200' : 'bg-emerald-50 border-emerald-100'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Variable 2</p>
                      {missing.includes('SUPABASE_ANON_KEY') ? <i className="fas fa-times-circle text-red-400 text-xs"></i> : <i className="fas fa-check-circle text-emerald-500 text-xs"></i>}
                    </div>
                    <code className="text-[10px] font-black text-indigo-600 block mb-1">SUPABASE_ANON_KEY</code>
                  </div>
                </div>

                <div className="pt-2 text-center">
                   <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                     After fixing the Production checkbox, you <b>MUST CLICK REDEPLOY</b> in Vercel.
                   </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-700">
            {error && (
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-[10px] font-bold text-red-600 uppercase tracking-widest text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input 
                  type="email" 
                  required
                  className="w-full bg-slate-50 border-2 border-slate-50 p-4 pl-12 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="teacher@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                <input 
                  type="password" 
                  required
                  minLength={6}
                  className="w-full bg-slate-50 border-2 border-slate-50 p-4 pl-12 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] disabled:opacity-50 mt-4"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className={`fas fa-${isSignUp ? 'user-plus' : 'sign-in-alt'}`}></i>}
              {loading ? 'Logging in...' : isSignUp ? 'Create Teacher Account' : 'Sign In To EduPlan'}
            </button>

            <div className="text-center mt-6">
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition"
              >
                {isSignUp ? 'Already have an account? Log In' : "New teacher? Create an Account"}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-12 border-t pt-8">
          KICD Compliant &bull; 2025 Master Edition
        </p>
      </div>
    </div>
  );
};

export default Login;