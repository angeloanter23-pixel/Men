
import React, { useState, useEffect, useMemo } from 'react';
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
  const userRole = session?.user?.role;
  const userBranchId = session?.user?.branch_id;
  const restaurantId = session?.restaurant?.id;
  
  const isSuperAdmin = userRole === 'super-admin';
  const isBranchManager = userRole === 'branch-manager';

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeSubTab, setActiveSubTab] = useState<'super' | 'branch' | 'list' | 'invite'>(isSuperAdmin ? 'super' : 'list');
  
  const [formData, setFormData] = useState({ name: '', email: '', branch_id: isBranchManager ? userBranchId : '', role: 'waiter' });
  const [generatedInvite, setGeneratedInvite] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (restaurantId) {
        fetchStaff();
    }
  }, [restaurantId]);

  const fetchStaff = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
        const data = await MenuService.getStaffByRestaurantId(restaurantId);
        setStaff(data);
    } catch (err) {
        console.error("Staff update failed", err);
    } finally {
        setLoading(false);
    }
  };

  const branchWaiters = useMemo(() => {
    return staff.filter(s => s.role === 'waiter' && s.branch_id === userBranchId);
  }, [staff, userBranchId]);

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

        // Branch Manager can only ever invite waiters
        let targetRole: StaffMember['role'] = isBranchManager ? 'waiter' : (formData.role as any);
        let targetBranch = isBranchManager ? userBranchId : formData.branch_id;

        if (isBranchManager && branchWaiters.length >= 10) {
            setError("You reached the limit of 10 Waiters for this branch.");
            setModalLoading(false);
            return;
        }

        const invite = await MenuService.createStaffInvite(formData.email, targetRole, restaurantId);
        
        if (targetBranch) {
            await MenuService.supabase.from('users').update({ branch_id: targetBranch }).eq('id', invite.id);
        }

        const inviteLink = `https://men-brown.vercel.app/#/accept-invite/${invite.invite_token}`;
        setGeneratedInvite(inviteLink);
        await fetchStaff();
    } catch (err: any) {
        setError(err.message || "Could not create invite.");
    } finally {
        setModalLoading(false);
    }
  };

  const handleRemoveStaff = async (id: string, role: string, email: string) => {
    if (role === 'super-admin') {
        alert("You cannot remove Admins here.");
        return;
    }

    if (confirm(`Remove ${email} from your staff?`)) {
        try {
            await MenuService.deleteStaffMember(id);
            await fetchStaff();
        } catch (err: any) {
            alert("Error: " + err.message);
        }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Loading Accounts...</p>
    </div>
  );

  const renderHeader = () => {
    const tabs = isBranchManager ? [
      { id: 'list', label: 'Waiters' },
      { id: 'invite', label: 'Invite Waiter' }
    ] : [
      { id: 'super', label: 'Admins' },
      { id: 'branch', label: 'Branch Staff' },
      { id: 'invite', label: 'Invite Staff' }
    ];

    return (
      <div className="bg-slate-50 border-b border-slate-100 p-6 lg:p-10 space-y-4 sticky top-0 z-[40] backdrop-blur-md bg-slate-50/90 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Accounts</h2>
            </div>
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit overflow-x-auto no-scrollbar">
              {tabs.map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => { setActiveSubTab(tab.id as any); setGeneratedInvite(null); setError(null); }} 
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
      </div>
    );
  };

  const renderInviteForm = () => (
    <section className="animate-fade-in max-w-lg mx-auto py-10">
      <div className="bg-white p-10 lg:p-14 rounded-[4rem] border border-slate-100 shadow-2xl space-y-10 relative overflow-hidden">
        {generatedInvite ? (
          <div className="text-center space-y-10 py-4 animate-fade-in">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto text-4xl shadow-xl shadow-emerald-50"><i className="fa-solid fa-check"></i></div>
            <div className="space-y-3">
              <h4 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Invite Link Ready</h4>
              <p className="text-xs text-slate-400 font-medium px-4 leading-relaxed">Copy this link and send it to the person you want to invite.</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 break-all shadow-inner">
                <p className="text-[9px] font-mono font-bold text-indigo-500 leading-relaxed">{generatedInvite}</p>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(generatedInvite!); alert("Copied!"); }} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Copy Link</button>
            <button onClick={() => setGeneratedInvite(null)} className="w-full text-[10px] font-black uppercase text-slate-300 tracking-widest">Invite Someone Else</button>
          </div>
        ) : (
          <>
            <header className="text-center space-y-4">
              <div className="w-20 h-20 bg-indigo-600 text-white rounded-[1.8rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-100">
                <i className="fa-solid fa-user-plus text-3xl"></i>
              </div>
              <h4 className="text-4xl font-black uppercase tracking-tighter text-slate-900">New Invite</h4>
            </header>
            <form onSubmit={handleAddStaff} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Work Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border-none rounded-3xl p-6 text-sm font-bold outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" placeholder="staff@example.com" />
              </div>
              
              {isSuperAdmin && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Account Type</label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-50 p-6 rounded-3xl text-sm font-bold outline-none shadow-inner cursor-pointer">
                      <option value="waiter">Waiter</option>
                      <option value="branch-manager">Branch Manager</option>
                      <option value="super-admin">Admin (Full Access)</option>
                    </select>
                  </div>
                  {(formData.role === 'waiter' || formData.role === 'branch-manager') && (
                    <div className="space-y-2 animate-fade-in">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Assign Branch</label>
                      <select required value={formData.branch_id} onChange={e => setFormData({...formData, branch_id: e.target.value})} className="w-full bg-slate-50 p-6 rounded-3xl text-sm font-bold outline-none shadow-inner cursor-pointer">
                        <option value="">Select a branch...</option>
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}
              
              {error && <p className="text-rose-500 text-[10px] font-black text-center uppercase tracking-widest bg-rose-50 p-5 rounded-2xl border border-rose-100">{error}</p>}
              <button type="submit" disabled={modalLoading} className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl active:scale-95 transition-all hover:bg-indigo-600">
                {modalLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Generate Link'}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );

  if (isBranchManager) {
    return (
      <div className="flex flex-col h-full animate-fade-in font-jakarta bg-white overflow-y-auto no-scrollbar pb-32">
        {renderHeader()}
        <div className="p-6 lg:p-10 max-w-4xl mx-auto w-full space-y-12">
          {activeSubTab === 'list' ? (
            <section className="animate-fade-in space-y-8">
              <div className="px-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Branch Staff</h3>
                  <h4 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Waiter List</h4>
                  <p className="text-slate-500 text-sm font-medium">People working at this location ({branchWaiters.length}/10).</p>
                </div>
                <button onClick={() => setActiveSubTab('invite')} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all">Invite Waiter</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {branchWaiters.map(s => (
                  <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 ${s.status === 'pending' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-600'} rounded-2xl flex items-center justify-center shadow-inner`}>
                        <i className={`fa-solid ${s.status === 'pending' ? 'fa-envelope' : 'fa-user-tie'} text-xl`}></i>
                      </div>
                      <div>
                        <h4 className="text-lg font-black uppercase tracking-tight text-slate-800 leading-none mb-1.5">{s.name || s.email.split('@')[0]}</h4>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-slate-400 font-bold uppercase truncate tracking-widest leading-none">{s.email}</p>
                          {s.status === 'pending' && <span className="text-[8px] bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter font-black">PENDING</span>}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveStaff(s.id, s.role, s.email)} className="w-11 h-11 rounded-xl bg-slate-50 text-slate-200 hover:text-rose-500 transition-all border border-slate-100 flex items-center justify-center shadow-sm active:scale-90"><i className="fa-solid fa-trash-can text-sm"></i></button>
                  </div>
                ))}
              </div>
            </section>
          ) : renderInviteForm()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in font-jakarta bg-white overflow-y-auto no-scrollbar pb-32">
      {renderHeader()}
      <div className="p-6 lg:p-10 space-y-12 max-w-7xl mx-auto w-full pb-32">
        {activeSubTab === 'super' && (
          <section className="space-y-12 animate-fade-in">
            {superAdminGroups.you && (
              <div className="space-y-6">
                  <p className="px-4 text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em]">My Account</p>
                  <div className="bg-slate-900 p-10 lg:p-14 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                      <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
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
                                      <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-4 py-1 rounded-full uppercase tracking-widest border border-indigo-500/20">Logged In</span>
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">• SYSTEM ADMIN</span>
                                  </div>
                                  <h4 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter text-white leading-none truncate">
                                    {superAdminGroups.you.name || 'Admin Owner'}
                                  </h4>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                                  <div className="space-y-1.5">
                                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Email</p>
                                      <p className="text-sm font-bold text-slate-300 truncate">{superAdminGroups.you.email}</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 pt-8 border-t border-slate-100">
                <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Admins</h3>
                    <h4 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Team Admins</h4>
                    <p className="text-slate-500 text-sm font-medium">Other people with full access to the business ({superAdminGroups.totalCount}/10)</p>
                </div>
                <button onClick={() => setActiveSubTab('invite')} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all">Invite Admin</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {superAdminGroups.others.map(s => (
                    <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm transition-all relative overflow-hidden group hover:shadow-xl">
                        <div className="flex justify-between items-start mb-8">
                            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                <i className="fa-solid fa-user-shield text-lg"></i>
                            </div>
                        </div>
                        <h4 className="text-xl font-black uppercase tracking-tighter text-slate-800 leading-none mb-2 truncate pr-4">{s.name || s.email.split('@')[0]}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase truncate pr-4 mb-8 tracking-widest leading-none">{s.email}</p>
                        <div className="pt-6 border-t border-slate-50 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
                            <span className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em]">Admin</span>
                        </div>
                    </div>
                ))}
            </div>
          </section>
        )}

        {activeSubTab === 'branch' && (
          <section className="space-y-12 animate-fade-in">
             <div className="px-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Branch Staff</h3>
                    <h4 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Local Teams</h4>
                    <p className="text-slate-500 text-sm font-medium">All staff members working across your different locations.</p>
                </div>
                <button onClick={() => setActiveSubTab('invite')} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all">Invite Staff</button>
             </div>
             <div className="grid grid-cols-1 gap-12">
               {branches.map(branch => {
                 const branchStaff = staff.filter(s => s.branch_id === branch.id);
                 return (
                   <div key={branch.id} className="bg-white rounded-[4.5rem] border border-slate-100 shadow-xl overflow-hidden group hover:shadow-2xl transition-all relative">
                      <div className="p-10 lg:p-14 flex flex-col xl:flex-row gap-12 relative z-10">
                         <div className="xl:w-1/3 xl:border-r border-slate-50 xl:pr-14 flex flex-col justify-between">
                            <div>
                              <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.8rem] flex items-center justify-center mb-8 shadow-2xl">
                                  <i className="fa-solid fa-store text-2xl"></i>
                              </div>
                              <h4 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-tight mb-4 truncate">{branch.name}</h4>
                              <div className="flex items-center gap-3 mb-10">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100/50">/{branch.subdomain}</span>
                              </div>
                            </div>
                         </div>
                         <div className="xl:w-2/3 space-y-12">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-4"><span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Directory</span><div className="h-px bg-slate-50 flex-1 ml-6 opacity-60"></div></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {branchStaff.map(s => (
                                        <div key={s.id} className="p-6 bg-slate-50 rounded-[2.5rem] flex items-center justify-between border border-slate-100 hover:bg-white hover:shadow-xl transition-all">
                                            <div className="flex items-center gap-5 min-w-0">
                                                <div className={`w-14 h-14 ${s.status === 'pending' ? 'bg-white text-slate-200' : s.role === 'branch-manager' ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'} rounded-[1.2rem] flex items-center justify-center shadow-lg`}><i className={`fa-solid ${s.role === 'branch-manager' ? 'fa-user-tie' : 'fa-concierge-bell'}`}></i></div>
                                                <div className="min-w-0">
                                                    <p className="text-base font-black uppercase text-slate-800 leading-none mb-1.5 truncate">{s.name || s.email.split('@')[0]}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate tracking-widest leading-none">{s.email}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleRemoveStaff(s.id, s.role, s.email)} className="w-10 h-10 rounded-xl text-slate-200 hover:text-rose-500 transition-all flex items-center justify-center active:scale-90 shadow-sm border border-slate-100"><i className="fa-solid fa-trash-can text-sm"></i></button>
                                        </div>
                                    ))}
                                    {branchStaff.length === 0 && <p className="text-center py-6 text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em] opacity-40">No staff yet</p>}
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

        {activeSubTab === 'invite' && renderInviteForm()}
      </div>

      <footer className="text-center opacity-30 py-16 border-t border-slate-50 mt-auto">
        <p className="text-[10px] font-black uppercase tracking-[1.5em]">System Access Control</p>
      </footer>
    </div>
  );
};

export default AdminAccounts;
