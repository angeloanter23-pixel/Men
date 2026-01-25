
import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as MenuService from '../../services/menuService';

interface StaffMember {
  id: string;
  name?: string;
  email: string;
  role: 'super-admin' | 'branch-manager' | 'waiter';
  branch_id?: string;
  status: 'active' | 'invited' | 'pending';
}

interface AdminAccountsProps {
  branches: any[];
  setActiveTab: (tab: any) => void;
}

const AdminAccounts: React.FC<AdminAccountsProps> = ({ branches, setActiveTab }) => {
  const sessionRaw = localStorage.getItem('foodie_supabase_session');
  const session = sessionRaw ? JSON.parse(sessionRaw) : null;
  const currentUserEmail = session?.user?.email || '';
  const currentUserId = session?.user?.id || '';
  const restaurantId = session?.restaurant?.id;

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<StaffMember['role']>('super-admin');
  const [formData, setFormData] = useState({ name: '', email: '', branch_id: '' });
  const [activeSubTab, setActiveSubTab] = useState<'super' | 'branch'>('super');
  const [generatedInvite, setGeneratedInvite] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Menu State for active session card
  const [showYouMenu, setShowYouMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (restaurantId) {
        fetchStaff();
    }
  }, [restaurantId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowYouMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStaff = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
        const data = await MenuService.getStaffByRestaurantId(restaurantId);
        setStaff(data);
    } catch (err) {
        console.error("Staff sync failed", err);
    } finally {
        setLoading(false);
    }
  };

  const superAdminGroups = useMemo(() => {
    const verifiedAdmins = staff.filter(s => s.role === 'super-admin' && s.status === 'active');
    const pendingInvites = staff.filter(s => s.role === 'super-admin' && s.status === 'pending');
    
    const you = verifiedAdmins.find(s => s.email.toLowerCase() === currentUserEmail.toLowerCase());
    const others = verifiedAdmins.filter(s => s.email.toLowerCase() !== currentUserEmail.toLowerCase());
    
    return {
      you,
      others,
      pending: pendingInvites,
      totalCount: verifiedAdmins.length + pendingInvites.length,
      verifiedCount: verifiedAdmins.length
    };
  }, [staff, currentUserEmail]);

  const getManagersForBranch = (branchId: string) => staff.filter(s => s.role === 'branch-manager' && s.branch_id === branchId);
  const getWaitersForBranch = (branchId: string) => staff.filter(s => s.role === 'waiter' && s.branch_id === branchId);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setError(null);

    try {
        const emailExists = await MenuService.checkEmailExists(formData.email);
        if (emailExists) {
            setError("This email is already registered.");
            setModalLoading(false);
            return;
        }

        if (modalType === 'super-admin' && superAdminGroups.totalCount >= 10) {
            setError("You can only have up to 10 Super Admins.");
            setModalLoading(false);
            return;
        } else if (modalType === 'branch-manager') {
            if (getManagersForBranch(formData.branch_id).length >= 2) {
                setError("Only 2 Managers allowed per branch.");
                setModalLoading(false);
                return;
            }
        } else if (modalType === 'waiter') {
            if (getWaitersForBranch(formData.branch_id).length >= 10) {
                setError("Only 10 Staff allowed per branch.");
                setModalLoading(false);
                return;
            }
        }

        const invite = await MenuService.createStaffInvite(formData.email, modalType, restaurantId);
        const baseUrl = "https://men-brown.vercel.app";
        const inviteLink = `${baseUrl}/#/accept-invite?token=${invite.invite_token}&email=${encodeURIComponent(formData.email)}`;
        setGeneratedInvite(inviteLink);
        await fetchStaff();
    } catch (err: any) {
        setError(err.message || "Failed to create invite.");
    } finally {
        setModalLoading(false);
    }
  };

  const handleRemoveStaff = async (id: string, role: string, email: string) => {
    const isMe = email.toLowerCase() === currentUserEmail.toLowerCase();
    
    if (role === 'super-admin') {
        alert("Co-owners (Super Admins) cannot be deleted from here for security.");
        return;
    }

    if (confirm(`Are you sure you want to remove ${email}?`)) {
        try {
            await MenuService.deleteStaffMember(id);
            await fetchStaff();
        } catch (err: any) {
            alert("Error removing staff: " + err.message);
        }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Syncing Accounts...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-fade-in font-jakarta bg-white overflow-y-auto no-scrollbar">
      {/* Header with Account ID Injection */}
      <div className="bg-slate-50 border-b border-slate-100 p-6 lg:p-10 space-y-4 sticky top-0 z-[40] backdrop-blur-md bg-slate-50/90 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                 <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] leading-none">Admin Panel</p>
                 <div className="h-px w-6 bg-slate-200"></div>
                 <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest">Login ID: {currentUserId.slice(0, 14)}...</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none italic">Accounts</h2>
            </div>
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit">
              <button onClick={() => setActiveSubTab('super')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'super' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>Admins</button>
              <button onClick={() => setActiveSubTab('branch')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'branch' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}>Branch Staff</button>
            </div>
          </div>
      </div>

      <div className="p-6 lg:p-10 space-y-12 max-w-7xl mx-auto w-full pb-32">
        {activeSubTab === 'super' && (
          <section className="space-y-12 animate-fade-in">
            {/* MY ACCOUNT CARD - UNIQUE & AT THE TOP */}
            {superAdminGroups.you && (
              <div className="space-y-6">
                  <p className="px-4 text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] italic">My Login Profile</p>
                  <div className="bg-slate-900 p-10 lg:p-14 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                      <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                      <div className="flex flex-col md:flex-row gap-12 relative z-10 items-center md:items-start">
                          <div className="w-28 h-28 bg-white text-slate-900 rounded-[2.8rem] flex items-center justify-center shadow-2xl relative shrink-0">
                              <i className="fa-solid fa-crown text-5xl"></i>
                              <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-[6px] border-slate-900 w-10 h-10 rounded-full flex items-center justify-center">
                                 <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                              </div>
                          </div>

                          <div className="flex-1 space-y-10 min-w-0 text-center md:text-left">
                              <div>
                                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                      <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-4 py-1 rounded-full uppercase tracking-widest italic border border-indigo-500/20">Active Session</span>
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">• GLOBAL SYSTEM ADMIN</span>
                                  </div>
                                  <h4 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter text-white italic leading-none truncate">
                                    {superAdminGroups.you.name || 'Account Owner'}
                                  </h4>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-4">
                                  <div className="space-y-1.5">
                                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Registered Email</p>
                                      <p className="text-sm font-bold text-slate-300 truncate">{superAdminGroups.you.email}</p>
                                  </div>
                                  <div className="space-y-1.5 sm:col-span-2">
                                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Unique Account ID</p>
                                      <div className="flex items-center gap-3">
                                          <p className="text-[11px] font-mono font-bold text-indigo-400 truncate bg-white/5 px-4 py-2 rounded-xl inline-block border border-white/5 shadow-inner">
                                            {currentUserId}
                                          </p>
                                          <i className="fa-solid fa-fingerprint text-slate-700 text-sm"></i>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
            )}

            {/* TEAM SECTION */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 pt-8 border-t border-slate-100">
                <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Admins & Co-Owners</h3>
                    <h4 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Team Admins</h4>
                    <p className="text-slate-500 text-sm font-medium">Other users with full access to the business ({superAdminGroups.totalCount}/10)</p>
                </div>
                <button 
                    disabled={superAdminGroups.totalCount >= 10}
                    onClick={() => { setModalType('super-admin'); setFormData({ name: '', email: '', branch_id: '' }); setShowModal(true); setGeneratedInvite(null); setError(null); }}
                    className="bg-indigo-600 text-white px-10 py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all hover:bg-slate-900 flex items-center gap-3 disabled:opacity-30"
                >
                    <i className="fa-solid fa-user-plus"></i>
                    {superAdminGroups.totalCount >= 10 ? 'Limit Reached' : 'Invite New Admin'}
                </button>
            </div>

            <div className="space-y-12">
              {/* OTHER CO-OWNERS / SUPER ADMINS (NO DELETE BUTTON) */}
              {superAdminGroups.others.length > 0 && (
                <div className="space-y-6">
                    <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Active Co-Owners</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {superAdminGroups.others.map(s => (
                            <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm transition-all relative overflow-hidden group hover:shadow-xl">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                        <i className="fa-solid fa-user-shield text-lg"></i>
                                    </div>
                                    {/* Delete button removed for co-owners as requested */}
                                </div>
                                <h4 className="text-xl font-black uppercase tracking-tighter text-slate-800 italic leading-none mb-2 truncate pr-4">{s.name || s.email.split('@')[0]}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase truncate pr-4 mb-8 tracking-widest leading-none">{s.email}</p>
                                <div className="pt-6 border-t border-slate-50 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
                                    <span className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] italic">Full Access Admin</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {/* PENDING INVITES */}
              {superAdminGroups.pending.length > 0 && (
                <div className="space-y-6">
                    <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Pending Invites</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {superAdminGroups.pending.map(s => (
                            <div key={s.id} className="bg-slate-50/50 p-8 rounded-[3rem] border border-dashed border-slate-200 shadow-sm transition-all relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                                        <i className="fa-solid fa-paper-plane text-sm"></i>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveStaff(s.id, s.role, s.email)} 
                                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm border bg-white text-slate-200 hover:text-rose-500 border-slate-100"
                                        title="Cancel Invite"
                                    >
                                        <i className="fa-solid fa-xmark text-xs"></i>
                                    </button>
                                </div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 italic">Waiting for setup...</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase truncate pr-4 tracking-widest bg-white p-2 rounded-lg border border-slate-100 mb-4 italic">{s.email}</p>
                            </div>
                        ))}
                    </div>
                </div>
              )}
            </div>
          </section>
        )}

        {activeSubTab === 'branch' && (
          <section className="space-y-12 animate-fade-in">
             <div className="px-2 space-y-2">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Local Staff</h3>
                <h4 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Branch Staff</h4>
                <p className="text-slate-500 text-sm font-medium italic">Managers (max 2) and Staff (max 10) per location.</p>
             </div>
             <div className="grid grid-cols-1 gap-12">
               {branches.map(branch => {
                 const mgrs = getManagersForBranch(branch.id);
                 const waiters = getWaitersForBranch(branch.id);
                 return (
                   <div key={branch.id} className="bg-white rounded-[4.5rem] border border-slate-100 shadow-xl overflow-hidden group hover:shadow-2xl transition-all relative">
                      <div className="p-10 lg:p-14 flex flex-col xl:flex-row gap-12 relative z-10">
                         <div className="xl:w-1/3 xl:border-r border-slate-50 xl:pr-14 flex flex-col justify-between">
                            <div>
                              <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.8rem] flex items-center justify-center mb-8 shadow-2xl">
                                  <i className="fa-solid fa-store text-2xl"></i>
                              </div>
                              <h4 className="text-4xl font-black uppercase tracking-tighter text-slate-900 italic leading-tight mb-4 truncate">{branch.name}</h4>
                              <div className="flex items-center gap-3 mb-10">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100/50">/{branch.subdomain}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <button onClick={() => { setModalType('branch-manager'); setFormData({ name: '', email: '', branch_id: branch.id }); setShowModal(true); setGeneratedInvite(null); setError(null); }} disabled={mgrs.length >= 2} className="w-full py-5 bg-emerald-50 text-emerald-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-4 disabled:opacity-20">Add Manager</button>
                                <button onClick={() => { setModalType('waiter'); setFormData({ name: '', email: '', branch_id: branch.id }); setShowModal(true); setGeneratedInvite(null); setError(null); }} disabled={waiters.length >= 10} className="w-full py-5 bg-indigo-50 text-indigo-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-4 disabled:opacity-20">Add Staff Member</button>
                            </div>
                         </div>
                         <div className="xl:w-2/3 space-y-12">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-4"><span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] italic">Branch Managers ({mgrs.length}/2)</span><div className="h-px bg-slate-50 flex-1 ml-6 opacity-60"></div></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {mgrs.map(s => (
                                        <div key={s.id} className="p-6 bg-slate-50 rounded-[2.5rem] flex items-center justify-between border border-slate-100 hover:bg-white hover:shadow-xl transition-all">
                                            <div className="flex items-center gap-5 min-w-0">
                                                <div className={`w-14 h-14 ${s.status === 'pending' ? 'bg-white text-slate-200' : 'bg-emerald-500 text-white'} rounded-[1.2rem] flex items-center justify-center shadow-lg`}><i className="fa-solid fa-user-tie"></i></div>
                                                <div className="min-w-0">
                                                    <p className="text-base font-black uppercase italic text-slate-800 leading-none mb-1.5 truncate">{s.name || s.email.split('@')[0]}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate tracking-widest leading-none">{s.email}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleRemoveStaff(s.id, s.role, s.email)} className="w-10 h-10 rounded-xl text-slate-200 hover:text-rose-500 transition-all flex items-center justify-center active:scale-90 shadow-sm border border-slate-100"><i className="fa-solid fa-xmark text-sm"></i></button>
                                        </div>
                                    ))}
                                    {mgrs.length === 0 && <p className="text-center py-6 text-[10px] text-slate-300 font-bold uppercase italic tracking-[0.3em] opacity-40">No managers yet</p>}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-4"><span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] italic">Service Staff ({waiters.length}/10)</span><div className="h-px bg-slate-50 flex-1 ml-6 opacity-60"></div></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {waiters.map(s => (
                                        <div key={s.id} className="p-6 bg-slate-50 rounded-[2.5rem] flex items-center justify-between border border-slate-100 hover:bg-white hover:shadow-xl transition-all">
                                            <div className="flex items-center gap-5 min-w-0">
                                                <div className={`w-14 h-14 ${s.status === 'pending' ? 'bg-white text-slate-200' : 'bg-indigo-500 text-white'} rounded-[1.2rem] flex items-center justify-center shadow-lg`}><i className="fa-solid fa-concierge-bell"></i></div>
                                                <div className="min-w-0">
                                                    <p className="text-base font-black uppercase italic text-slate-800 leading-none mb-1.5 truncate">{s.name || s.email.split('@')[0]}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate tracking-widest leading-none">{s.email}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleRemoveStaff(s.id, s.role, s.email)} className="w-10 h-10 rounded-xl text-slate-200 hover:text-rose-500 transition-all flex items-center justify-center active:scale-90 shadow-sm border border-slate-100"><i className="fa-solid fa-xmark text-sm"></i></button>
                                        </div>
                                    ))}
                                    {waiters.length === 0 && <p className="text-center py-6 text-[10px] text-slate-300 font-bold uppercase italic tracking-[0.3em] opacity-40">No staff yet</p>}
                                </div>
                            </div>
                         </div>
                      </div>
                   </div>
                 );
               })}
             </div>
          </section>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-2xl animate-fade-in" onClick={() => !modalLoading && setShowModal(false)}>
            <div className="bg-white w-full max-w-sm rounded-[4rem] p-10 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                {generatedInvite ? (
                  <div className="text-center animate-fade-in space-y-10 py-8">
                      <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-lg border border-emerald-100"><i className="fa-solid fa-link"></i></div>
                      <div><h4 className="text-3xl font-black uppercase tracking-tighter text-slate-900 italic">Invite Ready</h4><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-4 leading-relaxed italic">Send this secure setup link to the team member.</p></div>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 break-all shadow-inner"><p className="text-[9px] font-mono font-bold text-indigo-400 leading-relaxed italic">{generatedInvite}</p></div>
                      <div className="space-y-3">
                        <button onClick={() => { navigator.clipboard.writeText(generatedInvite!); alert("Copied to clipboard."); }} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Copy Link</button>
                        <button onClick={() => { setShowModal(false); setGeneratedInvite(null); }} className="w-full py-4 text-slate-300 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-colors italic">Done</button>
                      </div>
                  </div>
                ) : (
                  <>
                    <header className="mb-12 text-center">
                        <div className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center text-white mb-8 shadow-2xl ${modalType === 'super-admin' ? 'bg-slate-900' : 'bg-indigo-500'}`}>
                          <i className={`fa-solid ${modalType === 'super-admin' ? 'fa-shield-halved' : 'fa-user-plus'} text-3xl`}></i>
                        </div>
                        <h4 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none italic">
                            Invite <br/> <span className="text-indigo-600">{modalType.split('-').join(' ')}</span>
                        </h4>
                    </header>
                    <form onSubmit={handleAddStaff} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Recipient Email</label>
                            <input required type="email" autoFocus value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border-none rounded-[2rem] p-6 text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 shadow-inner italic" placeholder="staff@business.com" />
                        </div>
                        {(modalType === 'branch-manager' || modalType === 'waiter') && (
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 italic">Assign to Branch</label>
                              <select required value={formData.branch_id} onChange={e => setFormData({...formData, branch_id: e.target.value})} className="w-full bg-slate-50 border-none rounded-[2rem] p-6 text-[11px] font-black uppercase outline-none shadow-inner cursor-pointer appearance-none border-r-[12px] border-transparent">
                                  <option value="">Select a Branch...</option>
                                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                              </select>
                          </div>
                        )}
                        {error && <p className="text-rose-500 text-[10px] font-black text-center uppercase tracking-widest bg-rose-50 p-5 rounded-2xl border border-rose-100 shadow-sm leading-relaxed">{error}</p>}
                        <div className="pt-6 flex gap-4">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-7 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-slate-300 bg-slate-50">Cancel</button>
                            <button type="submit" disabled={modalLoading} className="flex-[2] py-7 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-xl active:scale-95 transition-all hover:bg-indigo-600 disabled:opacity-50">
                                {modalLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Create Invite'}
                            </button>
                        </div>
                    </form>
                  </>
                )}
            </div>
        </div>
      )}

      <footer className="text-center opacity-30 py-16 border-t border-slate-50 mt-auto">
        <p className="text-[10px] font-black uppercase tracking-[1.5em] italic">PLATINUM CORE v4.3 • SECURE AUTH</p>
      </footer>
    </div>
  );
};

export default AdminAccounts;
