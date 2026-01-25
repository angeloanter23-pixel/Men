import React, { useState, useEffect } from 'react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'super-admin' | 'branch-manager' | 'waiter';
  branch_id?: string;
  branch_name?: string;
  status: 'active' | 'invited';
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

  useEffect(() => {
    const saved = localStorage.getItem('foodie_staff_registry');
    if (saved) setStaff(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('foodie_staff_registry', JSON.stringify(staff));
  }, [staff]);

  const coOwners = staff.filter(s => s.role === 'super-admin');
  
  const getManagersForBranch = (branchId: string) => staff.filter(s => s.role === 'branch-manager' && s.branch_id === branchId);
  const getWaitersForBranch = (branchId: string) => staff.filter(s => s.role === 'waiter' && s.branch_id === branchId);

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (modalType === 'super-admin') {
      if (coOwners.length >= 10) return alert("Limit Reached: Maximum 10 Co-owners allowed.");
      
      const token = Math.random().toString(36).substr(2, 12).toUpperCase();
      // Using the domain provided by the user
      const inviteLink = `https://men-brown.vercel.app/#/accept-invite?token=${token}&email=${encodeURIComponent(formData.email)}`;
      
      const invites = JSON.parse(localStorage.getItem('foodie_invites') || '[]');
      invites.push({
        token,
        email: formData.email,
        restaurant_id: restaurantId,
        expires: Date.now() + (24 * 60 * 60 * 1000)
      });
      localStorage.setItem('foodie_invites', JSON.stringify(invites));
      
      setGeneratedInvite(inviteLink);
      return;
    }

    if (modalType === 'branch-manager' && formData.branch_id) {
        if (getManagersForBranch(formData.branch_id).length >= 2) return alert("Limit Reached: Maximum 2 Managers allowed per branch.");
    }

    if (modalType === 'waiter' && formData.branch_id) {
        if (getWaitersForBranch(formData.branch_id).length >= 10) return alert("Limit Reached: Maximum 10 Waiters allowed per branch.");
    }

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
  };

  const removeStaff = (id: string) => {
    if (confirm("Are you sure you want to remove this account?")) {
        setStaff(staff.filter(s => s.id !== id));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Invitation link copied to clipboard.");
  };

  return (
    <div className="flex flex-col h-full animate-fade-in font-jakarta bg-white overflow-y-auto no-scrollbar">
      <div className="bg-slate-50 border-b border-slate-100 p-6 lg:p-10 space-y-4 sticky top-0 z-[40] shadow-sm backdrop-blur-md bg-slate-50/90">
          <div>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] leading-none">Management Console</p>
            <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none mt-2">Staff & <span className="text-indigo-600">Accounts</span></h2>
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
                <p className="text-slate-500 text-sm font-medium">Manage the main owners of the business. These accounts have full access to everything.</p>
            </div>

            <div className="flex justify-end px-2">
                <button 
                    onClick={() => { setModalType('super-admin'); setFormData({ name: 'Pending Invite', email: '', branch_id: '' }); setShowModal(true); setGeneratedInvite(null); }}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all hover:bg-slate-900 flex items-center gap-3"
                >
                    <i className="fa-solid fa-user-plus"></i>
                    Add Co-Owner
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-slate-900 p-8 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group border border-slate-800 min-h-[220px]">
                 <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl group-hover:scale-150 transition-all duration-1000"></div>
                 <div className="relative z-10 flex flex-col justify-between h-full">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                <i className="fa-solid fa-crown text-base"></i>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] bg-white/10 px-3 py-1.5 rounded-full border border-white/5">Main Account</span>
                        </div>
                        <h4 className="text-2xl font-black uppercase tracking-tighter leading-none mb-2">System Master</h4>
                        <p className="text-xs text-slate-400 font-bold opacity-60 truncate">{masterAdminEmail}</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">Primary Node</span>
                        <i className="fa-solid fa-shield-halved text-white/20 text-xs"></i>
                    </div>
                 </div>
              </div>

              {coOwners.map(s => (
                <div key={s.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[3.5rem] -translate-y-2 translate-x-2 group-hover:bg-indigo-50 transition-colors"></div>
                    <div>
                       <div className="flex justify-between items-start mb-6 relative z-10">
                           <div className={`w-12 h-12 bg-slate-50 ${s.status === 'invited' ? 'text-amber-400' : 'text-slate-400'} rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all group-hover:shadow-lg group-hover:shadow-indigo-100`}>
                                <i className={`fa-solid ${s.status === 'invited' ? 'fa-envelope' : 'fa-user-shield'} text-base`}></i>
                           </div>
                           <button onClick={() => removeStaff(s.id)} className="w-10 h-10 rounded-xl text-slate-200 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center active:scale-90"><i className="fa-solid fa-trash-can text-xs"></i></button>
                       </div>
                       <h4 className="text-xl font-black uppercase tracking-tighter text-slate-800 leading-none mb-2">{s.name}</h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase truncate pr-4">{s.email}</p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${s.status === 'invited' ? 'bg-amber-400' : 'bg-indigo-500'}`}></span>
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">{s.status === 'invited' ? 'Waiting' : 'Partner'}</span>
                        </div>
                        <i className="fa-solid fa-key text-[10px] text-slate-200"></i>
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
                <h4 className="text-2xl font-black text-slate-800 uppercase">Staff Management</h4>
                <p className="text-slate-500 text-sm font-medium">Assign managers and waiters to specific store locations.</p>
             </div>

             <div className="grid grid-cols-1 gap-12">
               {branches.map(branch => (
                 <div key={branch.id} className="bg-white rounded-[4.5rem] border border-slate-100 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-700 animate-fade-in relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-full opacity-30 -translate-y-20 translate-x-20 pointer-events-none"></div>
                    <div className="p-10 lg:p-14 grid grid-cols-1 xl:grid-cols-12 gap-12 relative z-10">
                       <div className="xl:col-span-4 border-r border-slate-50 pr-0 xl:pr-14 flex flex-col justify-between">
                          <div>
                            <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.8rem] flex items-center justify-center mb-8 shadow-xl shadow-slate-200">
                                <i className="fa-solid fa-store text-2xl"></i>
                            </div>
                            <h4 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-tight mb-4">{branch.name}</h4>
                            <div className="flex items-center gap-3 mb-10">
                              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">/{branch.subdomain}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Local Unit</span>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                              <button onClick={() => { setModalType('branch-manager'); setFormData({ name: '', email: '', branch_id: branch.id }); setShowModal(true); setGeneratedInvite(null); }} className="w-full py-5 bg-emerald-50 text-emerald-600 rounded-3xl font-black text-[10px] uppercase tracking-widest border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-3 active:scale-95"><i className="fa-solid fa-user-tie"></i>Add Manager</button>
                              <button onClick={() => { setModalType('waiter'); setFormData({ name: '', email: '', branch_id: branch.id }); setShowModal(true); setGeneratedInvite(null); }} className="w-full py-5 bg-amber-50 text-amber-600 rounded-3xl font-black text-[10px] uppercase tracking-widest border border-amber-100 hover:bg-amber-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-3 active:scale-95"><i className="fa-solid fa-concierge-bell"></i>Add Waiter</button>
                          </div>
                       </div>

                       <div className="xl:col-span-8 space-y-14">
                          <div className="space-y-6">
                              <div className="flex justify-between items-center px-4">
                                  <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Store Managers</span>
                                    <div className="h-px w-20 bg-slate-100"></div>
                                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border transition-all ${getManagersForBranch(branch.id).length >= 2 ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>{getManagersForBranch(branch.id).length}/2 Max</span>
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {getManagersForBranch(branch.id).map(s => (
                                      <div key={s.id} className="p-6 bg-slate-50 rounded-[2.5rem] flex items-center justify-between border border-slate-100 shadow-inner group/item hover:bg-white hover:shadow-xl hover:border-emerald-100 transition-all duration-500 animate-fade-in">
                                          <div className="flex items-center gap-5">
                                              <div className="w-14 h-14 bg-emerald-500 text-white rounded-[1.2rem] flex items-center justify-center text-lg shadow-lg shadow-emerald-200 group-hover/item:scale-110 transition-transform"><i className="fa-solid fa-user-tie"></i></div>
                                              <div>
                                                  <p className="text-base font-black uppercase tracking-tight text-slate-800 leading-none mb-1.5">{s.name}</p>
                                                  <p className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[140px] tracking-widest">{s.email}</p>
                                              </div>
                                          </div>
                                          <button onClick={() => removeStaff(s.id)} className="w-10 h-10 rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center opacity-0 group-hover/item:opacity-100"><i className="fa-solid fa-xmark"></i></button>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div className="space-y-6">
                              <div className="flex justify-between items-center px-4">
                                  <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Waiter List</span>
                                    <div className="h-px w-20 bg-slate-100"></div>
                                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border transition-all ${getWaitersForBranch(branch.id).length >= 10 ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{getWaitersForBranch(branch.id).length}/10 Active</span>
                                  </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   {getWaitersForBranch(branch.id).map(s => (
                                      <div key={s.id} className="p-6 bg-slate-50 rounded-[2.5rem] flex items-center justify-between border border-slate-100 shadow-inner group/item hover:bg-white hover:shadow-xl hover:border-amber-100 transition-all duration-500 animate-fade-in">
                                          <div className="flex items-center gap-5">
                                              <div className="w-14 h-14 bg-amber-500 text-white rounded-[1.2rem] flex items-center justify-center text-lg shadow-lg shadow-amber-200 group-hover/item:scale-110 transition-transform"><i className="fa-solid fa-concierge-bell"></i></div>
                                              <div>
                                                  <p className="text-base font-black uppercase tracking-tight text-slate-800 leading-none mb-1.5">{s.name}</p>
                                                  <p className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[140px] tracking-widest">{s.email}</p>
                                              </div>
                                          </div>
                                          <button onClick={() => removeStaff(s.id)} className="w-10 h-10 rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center opacity-0 group-hover/item:opacity-100"><i className="fa-solid fa-xmark"></i></button>
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
            <div className="bg-white w-full max-w-sm rounded-[4.5rem] p-10 lg:p-14 shadow-2xl relative animate-scale overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className={`absolute top-0 left-0 w-full h-2 ${modalType === 'super-admin' ? 'bg-indigo-600' : modalType === 'branch-manager' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                
                {generatedInvite ? (
                  <div className="text-center animate-fade-in space-y-10 py-8">
                      <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-xl shadow-emerald-100"><i className="fa-solid fa-paper-plane"></i></div>
                      <div>
                        <h4 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Invite Ready</h4>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-4">Send this link to the co-owner. It expires in 24 hours.</p>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 break-all">
                        <p className="text-[10px] font-mono font-bold text-slate-400 leading-relaxed">{generatedInvite}</p>
                      </div>
                      <div className="space-y-3">
                        <button onClick={() => copyToClipboard(generatedInvite)} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95">Copy Invitation Link</button>
                        <button onClick={() => { setShowModal(false); setGeneratedInvite(null); }} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Close</button>
                      </div>
                  </div>
                ) : (
                  <>
                    <header className="mb-12 text-center">
                        <div className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center text-white mb-8 shadow-2xl transition-all duration-700 ${modalType === 'super-admin' ? 'bg-indigo-600 shadow-indigo-200' : modalType === 'branch-manager' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-amber-500 shadow-amber-200'}`}>
                          <i className={`fa-solid ${modalType === 'super-admin' ? 'fa-crown' : modalType === 'branch-manager' ? 'fa-user-tie' : 'fa-concierge-bell'} text-3xl`}></i>
                        </div>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-3">System Access</p>
                        <h4 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Add {modalType === 'super-admin' ? 'Co-Owner' : modalType === 'branch-manager' ? 'Manager' : 'Waiter'}</h4>
                    </header>

                    <form onSubmit={handleAddStaff} className="space-y-8">
                        {modalType !== 'super-admin' && (
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Full Name</label>
                              <input required autoFocus value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-3xl p-6 text-sm font-black outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" placeholder="Name" />
                          </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Work Email</label>
                            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border-none rounded-3xl p-6 text-sm font-black outline-none focus:ring-4 ring-indigo-500/5 transition-all shadow-inner" placeholder="email@company.com" />
                        </div>
                        {(modalType === 'branch-manager' || modalType === 'waiter') && (
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Store Location</label>
                              <select required value={formData.branch_id} onChange={e => setFormData({...formData, branch_id: e.target.value})} className="w-full bg-slate-50 border-none rounded-3xl p-6 text-[11px] font-black uppercase outline-none shadow-inner">
                                  <option value="">Select Branch</option>
                                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                              </select>
                          </div>
                        )}
                        <div className="pt-6 flex gap-4">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-7 rounded-[2.2rem] text-[10px] font-black uppercase tracking-widest text-slate-300 bg-slate-50 hover:text-slate-900 transition-all">Cancel</button>
                            <button type="submit" className="flex-[2] py-7 bg-slate-900 text-white rounded-[2.2rem] font-black uppercase text-[10px] tracking-[0.4em] shadow-[0_20px_40px_rgba(0,0,0,0.2)] active:scale-95 transition-all hover:bg-indigo-600">
                                {modalType === 'super-admin' ? 'Generate Invitation' : 'Save Account'}
                            </button>
                        </div>
                    </form>
                  </>
                )}
            </div>
        </div>
      )}

      <footer className="text-center opacity-30 py-16 border-t border-slate-50 mt-auto shrink-0">
        <p className="text-[10px] font-black uppercase tracking-[1.5em]">PLATINUM CORE v2.0</p>
      </footer>

      <style>{`
        @keyframes scale { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-scale { animation: scale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

export default AdminAccounts;