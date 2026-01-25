
import React, { useState, useEffect } from 'react';
import * as MenuService from '../services/menuService';

interface AcceptInviteViewProps {
  onComplete: () => void;
  onCancel: () => void;
}

const AcceptInviteView: React.FC<AcceptInviteViewProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'verify' | 'setup' | 'expired'>('verify');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.split('?')[1];
    const params = new URLSearchParams(hash);
    const urlToken = params.get('token');
    const urlEmail = params.get('email');

    if (!urlToken || !urlEmail) {
      setStep('expired');
      return;
    }

    const verify = async () => {
      try {
        const invite = await MenuService.verifyStaffInvite(urlToken, urlEmail);
        if (!invite) {
          setStep('expired');
        } else {
          setToken(urlToken);
          setEmail(urlEmail);
          setStep('setup');
        }
      } catch (err) {
        setStep('expired');
      }
    };
    verify();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      await MenuService.acceptStaffInvite(token, password);
      setLoading(false);
      alert("Account active! Please sign in.");
      onComplete();
    } catch (err: any) {
      setError(err.message || "Failed to setup account.");
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 font-jakarta">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Verifying Identity...</p>
      </div>
    );
  }

  if (step === 'expired') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 font-jakarta text-center space-y-10 animate-fade-in">
        <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center text-3xl shadow-xl shadow-rose-100"><i className="fa-solid fa-clock"></i></div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Node Expired</h2>
          <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto leading-relaxed">This invitation node is no longer valid or has already been consumed.</p>
        </div>
        <button onClick={onCancel} className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all">Exit Terminal</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center p-8 font-jakarta animate-fade-in">
      <div className="w-full max-w-sm bg-white p-12 rounded-[4.5rem] shadow-2xl border border-slate-50 space-y-12">
        <header className="text-center space-y-4">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto text-3xl shadow-xl"><i className="fa-solid fa-user-shield"></i></div>
            <div>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-2 leading-none">Team Provisioning</p>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">Setup Account</h2>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 py-2 px-4 rounded-full inline-block italic">{email}</p>
        </header>

        <form onSubmit={handleSetup} className="space-y-8">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Full Name</label>
                <input required autoFocus value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-50 border-none rounded-3xl p-6 text-sm font-black outline-none focus:ring-4 ring-indigo-500/5 shadow-inner italic" placeholder="e.g. Alex Mercer" />
            </div>
            
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Secure Password</label>
                <div className="relative group">
                    <input 
                        required 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="w-full bg-slate-50 border-none rounded-3xl p-6 pr-14 text-sm font-black outline-none focus:ring-4 ring-indigo-500/5 shadow-inner" 
                        placeholder="••••••••" 
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                    >
                        <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-lg`}></i>
                    </button>
                </div>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest ml-4">Min. 8 characters</p>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Confirm Key</label>
                <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="w-full bg-slate-50 border-none rounded-3xl p-6 text-sm font-black outline-none focus:ring-4 ring-indigo-500/5 shadow-inner" 
                    placeholder="••••••••" 
                />
            </div>

            {error && <p className="text-rose-500 text-[10px] font-black text-center uppercase tracking-widest bg-rose-50 p-4 rounded-2xl border border-rose-100 italic">{error}</p>}

            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-7 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:bg-indigo-600 disabled:opacity-50">
              {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Initialize Account'}
            </button>
        </form>
      </div>
      <p className="mt-12 text-[10px] font-black text-slate-300 uppercase tracking-[1em] opacity-30 italic">AUTHENTICATION PIPELINE 4.0</p>
    </div>
  );
};

export default AcceptInviteView;
