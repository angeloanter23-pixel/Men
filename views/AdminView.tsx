
import React, { useState } from 'react';
import AdminDashboard from './admin/AdminDashboard';
import { MenuItem, Category, Feedback, SalesRecord } from '../types';

interface AdminViewProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  feedbacks: Feedback[];
  setFeedbacks: React.Dispatch<React.SetStateAction<Feedback[]>>;
  salesHistory: SalesRecord[];
  setSalesHistory: React.Dispatch<React.SetStateAction<SalesRecord[]>>;
  adminCreds: any;
  setAdminCreds: React.Dispatch<React.SetStateAction<any>>;
  onExit: () => void;
  onLogoUpdate: (logo: string | null) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ 
  menuItems, setMenuItems, categories, setCategories, feedbacks, setFeedbacks, salesHistory, setSalesHistory, adminCreds, setAdminCreds, onExit, onLogoUpdate 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === adminCreds.email && password === adminCreds.password) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid credentials');
    }
  };

  if (isAuthenticated) {
    return (
      <AdminDashboard 
        onLogout={() => {
          setIsAuthenticated(false);
          onExit();
        }} 
        menuItems={menuItems} 
        setMenuItems={setMenuItems} 
        categories={categories} 
        setCategories={setCategories}
        feedbacks={feedbacks}
        setFeedbacks={setFeedbacks}
        salesHistory={salesHistory}
        setSalesHistory={setSalesHistory}
        adminCreds={adminCreds}
        setAdminCreds={setAdminCreds}
        onLogoUpdate={onLogoUpdate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-sm space-y-8 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-100">
        <div className="text-center">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase">SHARP<span className="text-indigo-600">ADMIN</span></h2>
          <p className="mt-2 text-slate-400 text-xs font-bold uppercase tracking-widest">Management Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email address"
              className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-indigo-500/20 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 ring-indigo-500/20 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-rose-500 text-[10px] font-bold text-center uppercase tracking-widest">{error}</p>}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all"
          >
            Login
          </button>
          
          <button 
            type="button"
            onClick={onExit}
            className="w-full text-slate-400 py-2 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            Back to Home
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminView;
