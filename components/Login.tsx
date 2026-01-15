import React, { useState, useEffect } from 'react';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  isSupabaseConfigured, 
  getMissingConfigInfo, 
  saveManualConfig, 
  isUsingManualConfig,
  clearManualConfig,
  supabaseUrl
} from '../services/supabase';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [smartPaste, setSmartPaste] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    // Detect if running in AI Studio or similar preview environment
    const host = window.location.hostname;
    if (host.includes('ai.studio') || host.includes('googleusercontent')) {
      setIsPreview(true);
    }
  }, []);

  const { missing } = getMissingConfigInfo();

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (smartPaste) {
      const urlMatch = smartPaste.match(/https:\/\/[a-z0-9-]+\.supabase\.co/i);
      const keyMatch = smartPaste.match(/[a-zA-Z0-9\-_]{50,}/); 
      if (urlMatch && keyMatch) {
        saveManualConfig(urlMatch[0], keyMatch[0]);
        return;
      }
    }
    if (!manualUrl || !manualKey) return alert("Please provide both the URL and the Key.");
    saveManualConfig(manualUrl, manualKey);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return;

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        alert("Success! Account registered on this database. You can now sign in.");
        setIsSignUp(false);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      const errMsg = err.message || "";
      console.error("Auth Error:", err);
      
      // DIAGNOSTIC: If manual override is active and login fails, it's likely a missing user in the new DB
      if (isUsingManualConfig && !isSignUp && (errMsg.includes('Invalid login') || errMsg.includes('credentials'))) {
        setError("PREVIEW SYNC ISSUE: You are using a custom database link. Your main account doesn't exist here yet. Please click 'CREATE AN ACCOUNT' below to register on this specific project first!");
      } else {
        setError(errMsg || "Authentication failed. Please check your details.");
      }
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
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase mb-1">EduPlan <span className="text-indigo-600">Pro</span></h1>
          <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em]">CBE Master Platform</p>
        </div>

        {isUsingManualConfig && (
          <div className="mb-6 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
             <div className="flex justify-between items-center mb-2">
                <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-check-circle"></i> {isPreview ? 'Studio Preview Active' : 'Manual Override Active'}
                </p>
                <button onClick={clearManualConfig} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">Reset</button>
             </div>
             <p className="text-[8px] font-bold text-emerald-600/60 truncate uppercase tracking-tighter">Connected to: {supabaseUrl?.split('//')[1]}</p>
          </div>
        )}

        {!isSupabaseConfigured ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {showManual ? (
              <form onSubmit={handleManualSubmit} className="space-y-4 bg-indigo-50 p-6 rounded-[2rem] border-2 border-indigo-200">
                <h3 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <i className="fas fa-tools"></i> {isPreview ? 'Studio Preview Setup' : 'Manual Connection'}
                </h3>
                
                <div>
                   <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Smart Paste (Paste whole block of keys here)</label>
                   <textarea 
                     className="w-full bg-white p-3 rounded-xl border border-indigo-100 text-[10px] font-bold outline-none min-h-[60px]" 
                     placeholder="Paste everything from Supabase settings here..."
                     value={smartPaste}
                     onChange={e => setSmartPaste(e.target.value)}
                   />
                </div>

                <div className="relative py-2 flex items-center">
                  <div className="flex-grow border-t border-indigo-200"></div>
                  <span className="flex-shrink mx-4 text-[8px] font-black text-indigo-300 uppercase">Or Individual Keys</span>
                  <div className="flex-grow border-t border-indigo-200"></div>
                </div>

                <div>
                   <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Supabase URL</label>
                   <input 
                     className="w-full bg-white p-3 rounded-xl border border-indigo-100 text-[10px] font-bold outline-none" 
                     placeholder="https://xxx.supabase.co"
                     value={manualUrl}
                     onChange={e => setManualUrl(e.target.value)}
                   />
                </div>
                <div>
                   <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Anon Key</label>
                   <textarea 
                     className="w-full bg-white p-3 rounded-xl border border-indigo-100 text-[10px] font-bold outline-none min-h-[60px]" 
                     placeholder="eyJhbGciOi..."
                     value={manualKey}
                     onChange={e => setManualKey(e.target.value)}
                   />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Save & Launch Preview</button>
                <button type="button" onClick={() => setShowManual(false)} className="w-full text-[9px] font-black text-slate-400 uppercase tracking-widest py-2">Back to Guide</button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className={`p-6 rounded-[2rem] border-2 ${isPreview ? 'bg-indigo-50 border-indigo-100' : 'bg-amber-50 border-amber-100'}`}>
                  <h3 className={`text-[11px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${isPreview ? 'text-indigo-900' : 'text-amber-900'}`}>
                    <i className={`fas ${isPreview ? 'fa-eye' : 'fa-exclamation-triangle'}`}></i> 
                    {isPreview ? 'Preview Environment' : 'Production Environment'}
                  </h3>
                  <p className="text-[10px] leading-relaxed font-bold text-slate-700">
                    {isPreview 
                      ? "This is the AI Studio Preview. To test features here, click the button below and paste your Supabase URL and Key."
                      : "Your production keys are missing. Please check your Vercel Dashboard or use the rescue button below."}
                  </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100">
                  <div className="space-y-3">
                    <div className={`p-4 rounded-2xl border ${missing.includes('SUPABASE_URL') ? 'bg-white border-red-200' : 'bg-emerald-50 border-emerald-100'}`}>
                      <code className="text-[10px] font-black text-indigo-600 block">SUPABASE_URL</code>
                    </div>
                    <div className={`p-4 rounded-2xl border ${missing.includes('SUPABASE_ANON_KEY') ? 'bg-white border-red-200' : 'bg-emerald-50 border-emerald-100'}`}>
                      <code className="text-[10px] font-black text-indigo-600 block">SUPABASE_ANON_KEY</code>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowManual(true)}
                    className="w-full mt-6 bg-indigo-600 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all"
                  >
                    {isPreview ? 'Setup Preview Connection' : 'Fix with Manual Override'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-700">
            {error && (
              <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 text-[10px] font-bold text-indigo-800 uppercase tracking-widest text-center leading-relaxed shadow-sm">
                <i className="fas fa-info-circle mb-2 block text-sm text-indigo-600"></i>
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
              {loading ? 'Processing...' : isSignUp ? 'Create New Teacher Profile' : 'Sign In To EduPlan'}
            </button>

            <div className="text-center mt-6">
              <button 
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition"
              >
                {isSignUp ? 'Already have an account? Log In' : "New on this Database? Create an Account"}
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