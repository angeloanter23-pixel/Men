import React, { useState } from 'react';
import SignUpModal from '../components/SignUpModal';

const AffiliateAuth: React.FC<{ onBack: () => void; onLogin: () => void }> = ({ onBack, onLogin }) => {
  const [email, setEmail] = useState('partner@demo.com');
  const [pass, setPass] = useState('12345678');
  const [loading, setLoading] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-jakarta">
      <div className="w-full max-w-[400px] flex flex-col">
        <header className="mb-14 text-center">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <span className="text-xl font-bold">M</span>
            </div>
          </div>
          <h1 className="text-[32px] font-bold text-slate-900 tracking-tight leading-none mb-4 uppercase">
            Partner Login
          </h1>
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl mb-8">
            <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-1">Mockup Access</p>
            <p className="text-indigo-900 text-xs font-bold leading-tight">
              Use <span className="underline">partner@demo.com</span> and password <span className="underline">12345678</span> to enter the console.
            </p>
          </div>
        </header>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">Partner Email</label>
              <input 
                required 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-[15px] font-bold text-slate-900 outline-none focus:ring-4 ring-slate-900/5 transition-all shadow-sm" 
                placeholder="name@email.com" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">Password</label>
              <input 
                required 
                type="password" 
                value={pass} 
                onChange={e => setPass(e.target.value)} 
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-[15px] font-bold text-slate-900 outline-none focus:ring-4 ring-slate-900/5 transition-all shadow-sm" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full h-[64px] bg-slate-900 text-white rounded-full font-bold text-[15px] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-30 uppercase tracking-[0.2em]"
          >
            {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Enter Console'}
          </button>
        </form>

        <div className="mt-12 text-center space-y-4">
          <button 
            onClick={() => setIsSignUpOpen(true)}
            className="text-indigo-600 text-[13px] font-bold uppercase tracking-widest hover:underline"
          >
            Create Partner Account
          </button>
          <div className="block">
            <button onClick={onBack} className="text-slate-300 text-[10px] font-bold hover:text-slate-900 transition-colors uppercase tracking-[0.4em]">
              Return Home
            </button>
          </div>
        </div>
      </div>

      <SignUpModal isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} onComplete={() => { setIsSignUpOpen(false); onLogin(); }} />
    </div>
  );
};

export default AffiliateAuth;