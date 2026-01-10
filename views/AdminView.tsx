
import React, { useState, useEffect } from 'react';
import AdminDashboard from './admin/AdminDashboard';
import { MenuItem, Category } from '../types';

interface AdminViewProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

const AdminView: React.FC<AdminViewProps> = ({ menuItems, setMenuItems, categories, setCategories }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [creds, setCreds] = useState<any>(null);

  useEffect(() => {
    fetch('./data/admin.json')
      .then(res => res.json())
      .then(data => setCreds(data))
      .catch(err => console.error("Could not load admin credentials", err));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creds) {
      setError('System initializing, please wait...');
      return;
    }

    if (email === creds.email && password === creds.password) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid credentials');
    }
  };

  if (isAuthenticated) {
    return (
      <AdminDashboard 
        onLogout={() => setIsAuthenticated(false)} 
        menuItems={menuItems} 
        setMenuItems={setMenuItems} 
        categories={categories} 
        setCategories={setCategories}
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
        </form>

        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
          <button type="button" className="hover:text-indigo-600">Forgot Password?</button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
          <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-white px-2 text-slate-300">Mock Social Login</span></div>
        </div>

        <button 
          type="button"
          onClick={() => alert('Mock Google Login Activated')}
          className="w-full bg-white border border-slate-200 text-slate-700 py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
        >
          <i className="fa-brands fa-google text-indigo-500"></i>
          Login with Google
        </button>
      </div>
    </div>
  );
};

export default AdminView;
