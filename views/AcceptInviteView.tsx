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
  const [restaurantId, setRestaurantId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const urlToken = params.get('token');
    const urlEmail = params.get('email');

    if (!urlToken || !urlEmail) {
      setStep('expired');
      return;
    }

    // Verify token from local storage simulation
    const invites = JSON.parse(localStorage.getItem('foodie_invites') || '[]');
    const invite = invites.find((i: any) => i.token === urlToken && i.email === urlEmail);

    if (!invite || Date.now() > invite.expires) {
      setStep('expired');
    } else {
      setToken(urlToken);
      setEmail(urlEmail);
      setRestaurantId(invite.restaurant_id);
      setStep('setup');
    }
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
      // Save new account to the actual database
      await MenuService.createStaffUser(email, password, restaurantId);

      // Also update local staff registry for simulation consistency
      const staff = JSON.parse(localStorage.getItem('foodie_staff_registry') || '[]');
      staff.push({
        id: Math.random().toString(36).substr(2, 9),
        name: fullName,
        email: email,
        role: 'super-admin',
        status: 'active'
      });
      localStorage.setItem('foodie_staff_registry', JSON.stringify(staff));

      // Remove the invitation
      const invites = JSON.parse(localStorage.getItem('foodie_invites') || '[]');
      const filtered = invites.filter((i: any) => i.token !== token);
      localStorage.setItem('foodie_invites', JSON.stringify(filtered));

      setLoading(false);
      alert("Account created successfully. You can now log in.");
      onComplete();
    } catch (err: any) {
      setError(err.message || "Failed to save account.");
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 font-jakarta">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Verifying Invite Token</p>
      </div>
    );
  }

  if (step === 'expired') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 font-jakarta text-center space-y-10 animate-fade-in">
        <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center text-3xl shadow-xl shadow-rose-100"><i className="fa-solid fa-clock"></i></div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Token Expired</h2>
          <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto leading-relaxed">This invitation is no longer valid or has reached its 24-hour limit.</p>
        </div>
        <button onClick={onCancel} className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all">Back to Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center p-8 font-jakarta animate-fade-in">
      <div className="w-full max-w-sm bg-white p-12 rounded-[4.5rem] shadow-2xl border border-slate-50 space-y-12">
        <header className="text-center space-y-4">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto text-3xl shadow-xl shadow-indigo-100"><i className="fa-solid fa-user-shield"></i></div>
            <div>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] leading-none mb-3">Welcome to the Team</p>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">Account Setup</h2>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 py-2 px-4 rounded-full inline-block">{email}</p>
        </header>

        <form onSubmit={handleSetup} className="space-y-8">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Full Name</label>
                <input required autoFocus value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-slate-50 border-none rounded-3xl p-6 text-sm font-black outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Create Password</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border-none rounded-3xl p-6 text-sm font-black outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" placeholder="••••••••" />
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest ml-4">At least 8 characters</p>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Confirm Password</label>
                <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-slate-50 border-none rounded-3xl p-6 text-sm font-black outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" placeholder="••••••••" />
            </div>

            {error && <p className="text-rose-500 text-[10px] font-black text-center uppercase tracking-widest bg-rose-50 p-4 rounded-2xl border border-rose-100">{error}</p>}

            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-7 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:bg-indigo-600 disabled:opacity-50">
              {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Create Account'}
            </button>
        </form>
      </div>
      <p className="mt-12 text-[10px] font-black text-slate-300 uppercase tracking-[1em] opacity-30">SECURE ACCESS NODE</p>
    </div>
  );
};

export default AcceptInviteView;