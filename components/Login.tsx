import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail, isSupabaseConfigured } from '../services/supabase';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      alert("Cloud configuration is missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        alert("Account created! If email confirmation is enabled in your Supabase settings, please check your inbox. Otherwise, you can log in now.");
        setIsSignUp(false);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 p-8 md:p-12 border border-slate-100 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl shadow-2xl shadow-indigo-200 mx-auto mb-6 transform -rotate-6">
            <i className="fas fa-graduation-cap"></i>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase mb-2">EduPlan <span className="text-indigo-600">Pro</span></h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">CBE Master Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isSupabaseConfigured && (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-[10px] font-bold text-amber-700 uppercase tracking-widest text-center">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Cloud keys missing. Authentication disabled.
            </div>
          )}

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
            disabled={loading || !isSupabaseConfigured}
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] disabled:opacity-50 mt-4"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className={`fas fa-${isSignUp ? 'user-plus' : 'sign-in-alt'}`}></i>}
            {loading ? 'Processing...' : isSignUp ? 'Create Teacher Account' : 'Sign In To EduPlan'}
          </button>

          <div className="text-center mt-6">
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition"
            >
              {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Register"}
            </button>
          </div>
        </form>

        <p className="text-center text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-12">
          Secure Pedagogical Environment • KICD Compliant
        </p>
      </div>
    </div>
  );
};

export default Login;