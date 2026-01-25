import React, { useState, useEffect } from 'react';
import * as MenuService from '../../services/menuService';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'super-admin' | 'branch-manager' | 'waiter';
  branch_id?: string;
  branch_name?: string;
  status: 'active' | 'invited' | 'pending';
}

interface AdminAccountsProps {
  branches: any[];
}

const AdminAccounts: React.FC<AdminAccountsProps> = ({ branches }) => {
  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const masterAdminEmail = session?.user?.email || 'master@foodie.com';
  const restaurantId = session?.restaurant?.id;

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<StaffMember['role']>('super-admin');
  const [formData, setFormData] = useState({ name: '', email: '', branch_id: '' });
  const [activeSubTab, setActiveSubTab] = useState<'super' | 'branch'>('super');
  const [generatedInvite, setGeneratedInvite] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch from database should happen here in a real app
    // For now, we simulate with localStorage but invitations go to DB
    const saved = localStorage.getItem('foodie_staff_registry');
    if (saved) setStaff(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('foodie_staff_registry', JSON.stringify(staff));
  }, [staff]);

  const coOwners = staff.filter(s => s.role === 'super-admin');
  
  const getManagersForBranch = (branchId: string) => staff.filter(s => s.role === 'branch-manager' && s.branch_id === branchId);
  const getWaitersForBranch = (branchId: string) => staff.filter(s => s.role === 'waiter' && s.branch_id === branchId);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        const emailExists = await MenuService.checkEmailExists(formData.email);
        if (emailExists) {
            setError("This email is already used.");
            setLoading(false);
            return;
        }

        if (modalType === 'super-admin') {
          if (coOwners.length >= 10) {
              alert("Limit reached: Max 10 Co-owners.");
              setLoading(false);
              return;
          }
          
          const invite = await MenuService.createStaffInvite(formData.email, 'super-admin', restaurantId);
          // Updated to use the requested base URL
          const baseUrl = "https://men-brown.vercel.app";
          const inviteLink = `${baseUrl}/#/accept-invite?token=${invite.invite_token}&email=${encodeURIComponent(formData.email)}`;
          
          setGeneratedInvite(inviteLink);
          
          // Locally track invitation
          setStaff(prev => [...prev, {
              id: invite.id,
              name: 'Pending Invite',
              email: formData.email,
              role: 'super-admin',
              status: 'pending'
          }]);
          
          setLoading(false);
          return;
        }

        // Branch Manager / Waiter logic (Simulation but uses same duplicate check)
        const branch = branches.find(b => b.id === formData.branch_id);
        const newStaff: StaffMember = {
          id: Math.random().toString(36).substr(2, 9),
          name: formData.name,
          email: formData.email,
          role: modalType,
          branch_id: formData.branch_id || undefined,
          branch_name: branch?.name,
          status: 'active'
        };

        setStaff([...staff, newStaff]);
        setShowModal(false);
        setFormData({ name: '', email: '', branch_id: '' });
    } catch (err: any) {
        setError(err.message || "Failed to add staff.");
    } finally {
        setLoading(false);
    }
  };

  const shareInvite = async () => {
    if (!generatedInvite) return;
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Join Foodie Team',
                text: `You have been invited to manage ${session?.restaurant?.name || 'our restaurant'}. Setup your account here:`,
                url: generatedInvite
            });
        } catch (e) {
            copyToClipboard(generatedInvite);
        }
    } else {
        copyToClipboard(generatedInvite);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Invitation link copied to clipboard.");
  };

  const removeStaff = (id: string) => {
    if (confirm("Remove this account?")) {
        setStaff(staff.filter(s => s.id !== id));
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in font-jakarta bg-white overflow-y-auto no-scrollbar">
      <div className="bg-slate-50 border-b border-slate-100 p-6 lg:p-10 space-y-4 sticky top-0 z-[40] shadow-sm backdrop-blur-md bg-slate-50/90">
          <div>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] leading-none">Management Console</p>
            <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none mt-2">Staff & Accounts</h2>
          </div>

          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
            <button onClick={() => setActiveSubTab('super')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'super' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>Super Admin</button>
            <button onClick={() => setActiveSubTab('branch')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'branch' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>Branch Manager</button>
          </div>
      </div>

      <div className="p-6 lg:p-10 space-y-16 max-w-7xl mx-auto w-full pb-32">
        {activeSubTab === 'super' && (
          <section className="space-y-8 animate-fade-in">
            <div className="px-2 space-y-2">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Access Level</h3>
                <h4 className="text-2xl font-black text-slate-800 uppercase">Co-Owner Network</h4>
                <p className="text-slate-500 text-sm font-medium">Manage the main owners. These accounts can control everything.</p>
            </div>

            <div className="flex justify-end px-2">
                <button 
                    onClick={() => { setModalType('super-admin'); setFormData({ name: '', email: '', branch_id: '' }); setShowModal(true); setGeneratedInvite(null); setError(null); }}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all hover:bg-slate-900 flex items-center gap-3"
                >
                    <i className="fa-solid fa-user-plus"></i>
                    Add Co-Owner
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-slate-900 p-8 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden border border-slate-800 min-h-[220px]">
                 <div className="relative z-10 flex flex-col justify-between h-full">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-white">
                                <i className="fa-solid fa-crown text-base"></i>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] bg-white/10 px-3 py-1.5 rounded-full">Main Account</span>
                        </div>
                        <h4 className="text-2xl font-black uppercase tracking-tighter leading-none mb-2">System Master</h4>
                        <p className="text-xs text-slate-400 font-bold opacity-60 truncate">{masterAdminEmail}</p>
                    </div>
                 </div>
              </div>

              {coOwners.map(s => (
                <div key={s.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-2xl transition-all relative overflow-hidden">
                    <div>
                       <div className="flex justify-between items-start mb-6 relative z-10">
                           <div className={`w-12 h-12 bg-slate-50 ${s.status === 'pending' ? 'text-amber-400' : 'text-slate-400'} rounded-2xl flex items-center justify-center border border-slate-100`}>
                                <i className={`fa-solid ${s.status === 'pending' ? 'fa-envelope' : 'fa-user-shield'} text-base`}></i>
                           </div>
                           <button onClick={() => removeStaff(s.id)} className="w-10 h-10 rounded-xl text-slate-200 hover:text-rose-500 transition-all flex items-center justify-center active:scale-90"><i className="fa-solid fa-trash-can text-xs"></i></button>
                       </div>
                       <h4 className="text-xl font-black uppercase tracking-tighter text-slate-800 leading-none mb-2">{s.name}</h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase truncate pr-4">{s.email}</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${s.status === 'pending' ? 'bg-amber-400' : 'bg-indigo-500'}`}></span>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">{s.status === 'pending' ? 'Invited' : 'Partner'}</span>
                        </div>
                    </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeSubTab === 'branch' && (
          <section className="space-y-10 animate-fade-in">
             <div className="px-2 space-y-2">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Branch Access</h3>
                <h4 className="text-2xl font-black text-slate-800 uppercase">Staff List</h4>
                <p className="text-slate-500 text-sm font-medium">Assign managers and waiters to specific locations.</p>
             </div>

             <div className="grid grid-cols-1 gap-12">
               {branches.map(branch => (
                 <div key={branch.id} className="bg-white rounded-[4.5rem] border border-slate-100 shadow-xl overflow-hidden group hover:shadow-2xl transition-all relative">
                    <div className="p-10 lg:p-14 grid grid-cols-1 xl:grid-cols-12 gap-12 relative z-10">
                       <div className="xl:col-span-4 border-r border-slate-50 pr-0 xl:pr-14 flex flex-col justify-between">
                          <div>
                            <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.8rem] flex items-center justify-center mb-8 shadow-xl">
                                <i className="fa-solid fa-store text-2xl"></i>
                            </div>
                            <h4 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-tight mb-4">{branch.name}</h4>
                            <div className="flex items-center gap-3 mb-10">
                              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] bg-indigo-50 px-3 py-1 rounded-lg">/{branch.subdomain}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                              <button onClick={() => { setModalType('branch-manager'); setFormData({ name: '', email: '', branch_id: branch.id }); setShowModal(true); setGeneratedInvite(null); setError(null); }} className="w-full py-5 bg-emerald-50 text-emerald-600 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-3"><i className="fa-solid fa-user-tie"></i>Add Manager</button>
                              <button onClick={() => { setModalType('waiter'); setFormData({ name: '', email: '', branch_id: branch.id }); setShowModal(true); setGeneratedInvite(null); setError(null); }} className="w-full py-5 bg-amber-50 text-amber-600 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center gap-3"><i className="fa-solid fa-concierge-bell"></i>Add Waiter</button>
                          </div>
                       </div>

                       <div className="xl:col-span-8 space-y-14">
                          <div className="space-y-6">
                              <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] px-4">Managers</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {getManagersForBranch(branch.id).map(s => (
                                      <div key={s.id} className="p-6 bg-slate-50 rounded-[2.5rem] flex items-center justify-between border border-slate-100 group transition-all">
                                          <div className="flex items-center gap-5">
                                              <div className="w-14 h-14 bg-emerald-500 text-white rounded-[1.2rem] flex items-center justify-center"><i className="fa-solid fa-user-tie"></i></div>
                                              <div>
                                                  <p className="text-base font-black uppercase text-slate-800 leading-none mb-1.5">{s.name}</p>
                                                  <p className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[140px] tracking-widest">{s.email}</p>
                                              </div>
                                          </div>
                                          <button onClick={() => removeStaff(s.id)} className="w-10 h-10 rounded-xl text-slate-300 hover:text-rose-500 transition-all flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </section>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-2xl animate-fade-in" onClick={() => setShowModal(false)}>
            <div className="bg-white w-full max-w-sm rounded-[4.5rem] p-10 lg:p-14 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                {generatedInvite ? (
                  <div className="text-center animate-fade-in space-y-10 py-8">
                      <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto text-3xl"><i className="fa-solid fa-paper-plane"></i></div>
                      <div>
                        <h4 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Invite Ready</h4>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-4">Send this link to the co-owner. It works on any browser and expires in 24 hours.</p>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 break-all">
                        <p className="text-[10px] font-mono font-bold text-slate-400 leading-relaxed">{generatedInvite}</p>
                      </div>
                      <div className="space-y-3">
                        <button onClick={shareInvite} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Share Invite</button>
                        <button onClick={() => { setShowModal(false); setGeneratedInvite(null); }} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Close</button>
                      </div>
                  </div>
                ) : (
                  <>
                    <header className="mb-12 text-center">
                        <div className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center text-white mb-8 shadow-2xl transition-all ${modalType === 'super-admin' ? 'bg-indigo-600' : modalType === 'branch-manager' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                          <i className={`fa-solid ${modalType === 'super-admin' ? 'fa-crown' : modalType === 'branch-manager' ? 'fa-user-tie' : 'fa-concierge-bell'} text-3xl`}></i>
                        </div>
                        <h4 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Add {modalType === 'super-admin' ? 'Co-Owner' : modalType === 'branch-manager' ? 'Manager' : 'Waiter'}</h4>
                    </header>

                    <form onSubmit={handleAddStaff} className="space-y-8">
                        {modalType !== 'super-admin' && (
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Full Name</label>
                              <input required autoFocus value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-3xl p-6 text-sm font-black outline-none focus:ring-4 ring-indigo-500/5 shadow-inner" placeholder="Name" />
                          </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Email Address</label>
                            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border-none rounded-3xl p-6 text-sm font-black outline-none focus:ring-4 ring-indigo-500/5 shadow-inner" placeholder="email@company.com" />
                        </div>
                        {(modalType === 'branch-manager' || modalType === 'waiter') && (
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Branch</label>
                              <select required value={formData.branch_id} onChange={e => setFormData({...formData, branch_id: e.target.value})} className="w-full bg-slate-50 border-none rounded-3xl p-6 text-[11px] font-black uppercase outline-none shadow-inner">
                                  <option value="">Select Location</option>
                                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                              </select>
                          </div>
                        )}
                        {error && <p className="text-rose-500 text-[10px] font-black text-center uppercase tracking-widest bg-rose-50 p-4 rounded-2xl border border-rose-100">{error}</p>}
                        <div className="pt-6 flex gap-4">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-7 rounded-[2.2rem] text-[10px] font-black uppercase tracking-widest text-slate-300 bg-slate-50 hover:text-slate-900 transition-all">Cancel</button>
                            <button type="submit" disabled={loading} className="flex-[2] py-7 bg-slate-900 text-white rounded-[2.2rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-xl active:scale-95 transition-all hover:bg-indigo-600 disabled:opacity-50">
                                {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : (modalType === 'super-admin' ? 'Generate Invite' : 'Save')}
                            </button>
                        </div>
                    </form>
                  </>
                )}
            </div>
        </div>
      )}

      <footer className="text-center opacity-30 py-16 border-t border-slate-50 mt-auto">
        <p className="text-[10px] font-black uppercase tracking-[1.5em]">PLATINUM CORE v2.0</p>
      </footer>
    </div>
  );
};

export default AdminAccounts;