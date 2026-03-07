import React, { useState } from 'react';
import { authSignUp } from '../services/menuService';

const SignUpView: React.FC<{ onBack: () => void; onComplete: () => void }> = ({ onBack, onComplete }) => {
  const [restaurantName, setRestaurantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authSignUp(email, password, restaurantName);
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-jakarta">
      <div className="w-full max-w-[400px] flex flex-col">
        <h1 className="text-[32px] font-bold text-slate-900 tracking-tight leading-none mb-8 uppercase text-center">
          Sign Up
        </h1>
        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">Restaurant Name</label>
            <input required type="text" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-[15px] font-bold text-slate-900 outline-none focus:ring-4 ring-slate-900/5 transition-all shadow-sm" placeholder="My Restaurant" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-[15px] font-bold text-slate-900 outline-none focus:ring-4 ring-slate-900/5 transition-all shadow-sm" placeholder="name@email.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest ml-1">Password</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-[15px] font-bold text-slate-900 outline-none focus:ring-4 ring-slate-900/5 transition-all shadow-sm" placeholder="••••••••" />
          </div>
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <button type="submit" disabled={loading} className="w-full h-[64px] bg-slate-900 text-white rounded-full font-bold text-[15px] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-30 uppercase tracking-[0.2em]">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <button onClick={onBack} className="mt-8 text-slate-300 text-[10px] font-bold hover:text-slate-900 transition-colors uppercase tracking-[0.4em] text-center">
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default SignUpView;
