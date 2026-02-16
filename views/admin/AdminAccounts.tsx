
import React, { useState, useEffect, useMemo } from 'react';
import * as MenuService from '../../services/menuService';

interface StaffMember {
  id: string;
  name?: string;
  email: string;
  role: 'super-admin' | 'waiter';
  status: 'active' | 'pending';
}

interface AdminAccountsProps {
  setActiveTab: (tab: any) => void;
}

const AdminAccounts: React.FC<AdminAccountsProps> = ({ setActiveTab }) => {
  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const currentUserEmail = session?.user?.email || '';
  const restaurantId = session?.restaurant?.id;

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ email: '' });
  const [generatedInvite, setGeneratedInvite] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (restaurantId) fetchStaff(); }, [restaurantId]);

  const fetchStaff = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try { 
      const data = await MenuService.getStaffByRestaurantId(restaurantId); 
      setStaff(data); 
    } catch (err) { 
      console.error("Staff loading failed", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const staffGroups = useMemo(() => {
    const verified = staff.filter(s => s.status === 'active');
    const pending = staff.filter(s => s.status === 'pending');
    return { 
        you: verified.find(s => s.email.toLowerCase() === currentUserEmail.toLowerCase()), 
        others: verified.filter(s => s.email.toLowerCase() !== currentUserEmail.toLowerCase()),
        pending 
    };
  }, [staff, currentUserEmail]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setModalLoading(true); 
    setError(null);
    try {
        const emailExists = await MenuService.checkEmailExists(formData.email);
        if (emailExists) { 
          setError("This email is already in use."); 
          setModalLoading(false); 
          return; 
        }
        // Role defaults to 'waiter' automatically
        const invite = await MenuService.createStaffInvite(formData.email, 'waiter', restaurantId);
        const inviteLink = `${window.location.origin}/#/accept-invite/${invite.invite_token}`;
        setGeneratedInvite(inviteLink); 
        await fetchStaff();
    } catch (err: any) { 
      setError(err.message || "Invitation system error."); 
    } finally { 
      setModalLoading(false); 
    }
  };

  const handleRemoveStaff = async (id: string, role: string, email: string) => {
    if (role === 'super-admin') return alert("Main accounts cannot be removed.");
    if (confirm(`Remove ${email} from your team?`)) {
        try { 
          await MenuService.deleteStaffMember(id); 
          await fetchStaff(); 
        } catch (err: any) { 
          alert(err.message); 
        }
    }
  };

  const SettingRow: React.FC<{ icon: string; color: string; label: string; sub?: string; children: React.ReactNode; last?: boolean }> = ({ icon, color, label, sub, children, last }) => (
    <div className={`flex items-center justify-between py-4 ${!last ? 'border-b border-slate-100' : ''}`}>
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white shrink-0 shadow-sm`}>
          <i className={`fa-solid ${icon} text-[14px]`}></i>
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-slate-800 tracking-tight leading-none mb-1 truncate">{label}</p>
          {sub && <p className="text-[11px] text-slate-400 font-medium truncate">{sub}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        {children}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-white border-t-indigo-600 rounded-full animate-spin shadow-sm"></div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Accessing records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-jakarta pb-40">
      <div className="max-w-2xl mx-auto px-6 pt-12 space-y-10">
        
        {/* Page Header */}
        <header className="px-2 text-center">
          <p className="text-[10px] font-bold uppercase text-orange-500 tracking-[0.4em] mb-2">Team Access</p>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">Team Members</h1>
          <p className="text-slate-500 text-[17px] font-medium mt-3 leading-relaxed">
            Manage who can access your dashboard.
          </p>
        </header>

        {/* Your Profile */}
        <section className="space-y-3">
          <h3 className="px-4 text-[11px] font-black uppercase text-slate-400 tracking-[0.1em]">Your Profile</h3>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/50">
            {staffGroups.you && (
              <SettingRow 
                icon="fa-crown" 
                color="bg-slate-900" 
                label={staffGroups.you.email.split('@')[0]} 
                sub={staffGroups.you.email}
                last
              >
                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Owner
                </span>
              </SettingRow>
            )}
          </div>
        </section>

        {/* Team Members */}
        <section className="space-y-3">
          <h3 className="px-4 text-[11px] font-black uppercase text-slate-400 tracking-[0.1em]">Active Staff</h3>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/50">
            {staffGroups.others.length > 0 ? staffGroups.others.map((s, idx) => (
              <SettingRow 
                key={s.id} 
                icon="fa-user" 
                color="bg-emerald-500" 
                label={s.email.split('@')[0]} 
                sub={s.email}
                last={idx === staffGroups.others.length - 1}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.role}</span>
                  <button onClick={() => handleRemoveStaff(s.id, s.role, s.email)} className="text-rose-400 hover:text-rose-600 transition-colors p-2">
                    <i className="fa-solid fa-circle-minus text-lg"></i>
                  </button>
                </div>
              </SettingRow>
            )) : (
              <p className="py-4 text-center text-sm font-medium text-slate-300 italic">No other staff members added.</p>
            )}
          </div>
        </section>

        {/* Pending Invites */}
        {staffGroups.pending.length > 0 && (
          <section className="space-y-3">
            <h3 className="px-4 text-[11px] font-black uppercase text-slate-400 tracking-[0.1em]">Pending Setup</h3>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/50">
              {staffGroups.pending.map((s, idx) => (
                <SettingRow 
                  key={s.id} 
                  icon="fa-envelope" 
                  color="bg-amber-400" 
                  label={s.email} 
                  sub="Waiting for password setup"
                  last={idx === staffGroups.pending.length - 1}
                >
                  <button onClick={() => handleRemoveStaff(s.id, s.role, s.email)} className="text-rose-400 hover:text-rose-600 transition-colors p-2">
                    <i className="fa-solid fa-circle-xmark text-lg"></i>
                  </button>
                </SettingRow>
              ))}
            </div>
          </section>
        )}

        {/* Add Member Form */}
        <section className="space-y-3">
          <h3 className="px-4 text-[11px] font-black uppercase text-slate-400 tracking-[0.1em]">New Invitation</h3>
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-200/50">
            {generatedInvite ? (
              <div className="text-center space-y-6 animate-fade-in">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto text-xl">
                  <i className="fa-solid fa-link"></i>
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-2">Invite Ready</h4>
                  <p className="text-xs text-slate-500 font-medium">Copy this link and send it to your staff member.</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl break-all border border-slate-100 shadow-inner">
                  <p className="text-[10px] font-mono font-bold text-indigo-600 leading-relaxed">{generatedInvite}</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => { navigator.clipboard.writeText(generatedInvite!); alert("Copied!"); }} className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Copy Link</button>
                  <button onClick={() => { setGeneratedInvite(null); setFormData({ email: '' }); }} className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Done</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddStaff} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200/60 p-5 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:bg-white transition-all shadow-inner" 
                    placeholder="staff@restaurant.com" 
                  />
                </div>

                {error && <p className="text-rose-500 text-[10px] font-black text-center uppercase tracking-widest">{error}</p>}
                
                <button 
                  type="submit" 
                  disabled={modalLoading} 
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {modalLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Send Invite'}
                </button>
              </form>
            )}
          </div>
        </section>

        <footer className="text-center pt-8 opacity-40 pb-20">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em]">Identity Security Core</p>
        </footer>
      </div>
    </div>
  );
};

export default AdminAccounts;
