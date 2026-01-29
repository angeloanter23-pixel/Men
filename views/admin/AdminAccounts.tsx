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
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'invite'>('list');
  const [formData, setFormData] = useState({ name: '', email: '', role: 'waiter' });
  const [generatedInvite, setGeneratedInvite] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (restaurantId) fetchStaff(); }, [restaurantId]);

  const fetchStaff = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try { const data = await MenuService.getStaffByRestaurantId(restaurantId); setStaff(data); } 
    catch (err) { console.error("Staff sync failed", err); } 
    finally { setLoading(false); }
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
    e.preventDefault(); setModalLoading(true); setError(null);
    try {
        const emailExists = await MenuService.checkEmailExists(formData.email);
        if (emailExists) { setError("Email in use."); setModalLoading(false); return; }
        const invite = await MenuService.createStaffInvite(formData.email, formData.role, restaurantId);
        const inviteLink = `${window.location.origin}/#/accept-invite/${invite.invite_token}`;
        setGeneratedInvite(inviteLink); await fetchStaff();
    } catch (err: any) { setError(err.message || "Invite failed."); } 
    finally { setModalLoading(false); }
  };

  const handleRemoveStaff = async (id: string, role: string, email: string) => {
    if (role === 'super-admin') return alert("Cannot remove owners here.");
    if (confirm(`Remove ${email} from staff?`)) {
        try { await MenuService.deleteStaffMember(id); await fetchStaff(); } 
        catch (err: any) { alert(err.message); }
    }
  };

  if (loading) return <div className="flex flex-col items-center justify-center h-full gap-6"><div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Synchronizing Accounts...</p></div>;

  return (
    <div className="flex flex-col h-full animate-fade-in font-jakarta bg-white overflow-y-auto no-scrollbar pb-32">
      <div className="bg-slate-50 border-b border-slate-100 p-6 lg:p-10 sticky top-0 z-[40] shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Team Portal</h2>
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                <button onClick={() => setActiveSubTab('list')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Staff List</button>
                <button onClick={() => setActiveSubTab('invite')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'invite' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>New Access</button>
            </div>
          </div>
      </div>

      <div className="p-6 lg:p-14 max-w-6xl mx-auto w-full space-y-12">
        {activeSubTab === 'list' ? (
          <section className="space-y-12">
            {staffGroups.you && (
              <div className="bg-slate-900 p-10 lg:p-14 rounded-[4rem] text-white shadow-2xl flex flex-col md:flex-row items-center gap-10">
                <div className="w-24 h-24 bg-white text-slate-900 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-2xl shrink-0"><i className="fa-solid fa-crown"></i></div>
                <div>
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Active Session / Master</p>
                   <h3 className="text-4xl font-black uppercase tracking-tighter truncate mb-2">{staffGroups.you.email}</h3>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {staffGroups.others.concat(staffGroups.pending).map(s => (
                <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-xl transition-all">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 ${s.status === 'pending' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-600'} rounded-2xl flex items-center justify-center`}><i className={`fa-solid ${s.status === 'pending' ? 'fa-envelope' : 'fa-user-tie'}`}></i></div>
                    <div className="min-w-0"><p className="text-lg font-black uppercase tracking-tight text-slate-800 leading-none mb-2 truncate">{s.email.split('@')[0]}</p><p className="text-[10px] text-slate-400 font-bold uppercase truncate tracking-widest leading-none">{s.email}</p></div>
                  </div>
                  <button onClick={() => handleRemoveStaff(s.id, s.role, s.email)} className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-200 hover:text-rose-500 border border-slate-100 transition-all"><i className="fa-solid fa-trash-can text-sm"></i></button>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="max-w-lg mx-auto">
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl space-y-10">
              {generatedInvite ? (
                <div className="text-center space-y-10 py-4">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto text-3xl"><i className="fa-solid fa-link"></i></div>
                  <h4 className="text-3xl font-black uppercase tracking-tighter">Access Linked</h4>
                  <div className="bg-slate-50 p-6 rounded-3xl break-all shadow-inner"><p className="text-[9px] font-mono font-bold text-indigo-500">{generatedInvite}</p></div>
                  <button onClick={() => { navigator.clipboard.writeText(generatedInvite!); alert("Copied!"); }} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl">Copy Invite Link</button>
                  <button onClick={() => setGeneratedInvite(null)} className="text-[10px] font-black uppercase text-slate-300">New Invite</button>
                </div>
              ) : (
                <form onSubmit={handleAddStaff} className="space-y-8">
                  <div className="text-center space-y-4"><div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.8rem] flex items-center justify-center mx-auto shadow-xl"><i className="fa-solid fa-user-plus text-2xl"></i></div><h4 className="text-3xl font-black uppercase tracking-tighter">Team Access</h4></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Staff Email</label><input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border-none rounded-3xl p-6 text-sm font-bold outline-none shadow-inner" placeholder="staff@example.com" /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Account Role</label><select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-50 p-6 rounded-3xl text-sm font-bold outline-none shadow-inner cursor-pointer"><option value="waiter">Staff Member</option><option value="super-admin">Administrator</option></select></div>
                  {error && <p className="text-rose-500 text-[10px] font-black text-center uppercase tracking-widest">{error}</p>}
                  <button type="submit" disabled={modalLoading} className="w-full py-7 bg-slate-900 text-white rounded-3xl font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl hover:bg-indigo-600 active:scale-95 transition-all">{modalLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Deploy Access Token'}</button>
                </form>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminAccounts;