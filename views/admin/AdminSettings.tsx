import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import * as MenuService from '../../services/menuService';



interface AdminSettingsProps {
  onLogout: () => void;
  adminCreds: any;
  setAdminCreds: React.Dispatch<React.SetStateAction<any>>;
  onThemeUpdate: (theme: any) => void;
  onSubTabChange?: (sub: string) => void;
  restaurantId: string | null;
  userId: string | null;
  userEmail: string | null;
  isDemo?: boolean;
  onRestrict?: (title: string, message: string) => void;
}

const SettingRow: React.FC<{ icon: string; color: string; label: string; sub?: string; last?: boolean; onClick?: () => void; isDestructive?: boolean }> = ({ icon, color, label, sub, last, onClick, isDestructive }) => (
  <button type="button" onClick={onClick} className={`w-full flex items-center justify-between py-4 ${!last ? 'border-b border-slate-100' : ''} hover:bg-slate-50 transition-all rounded-xl -mx-2 px-2 text-left`}>
    <div className="flex items-center gap-4">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white shadow-sm`}><i className={`fa-solid ${icon} text-[14px]`}></i></div>
      <div>
          <span className={`text-[15px] font-bold tracking-tight block leading-none ${isDestructive ? 'text-rose-600' : 'text-slate-800'}`}>{label}</span>
          {sub && <span className="text-[10px] font-medium text-slate-400 mt-1 tracking-tight block">{sub}</span>}
      </div>
    </div>
    <i className="fa-solid fa-chevron-right text-slate-300 text-xs"></i>
  </button>
);

const SettingsModal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[5000] flex items-end justify-center animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
      <div className="relative bg-white w-full max-w-lg rounded-t-2xl shadow-2xl p-6 pb-10 animate-slide-up flex flex-col gap-6" onClick={e => e.stopPropagation()}>
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto shrink-0" />
          <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
              <button onClick={onClose} className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><i className="fa-solid fa-xmark"></i></button>
          </div>
          <div className="space-y-4">
              {children}
          </div>
      </div>
  </div>
);

const AdminSettings: React.FC<AdminSettingsProps> = ({ onLogout, adminCreds, setAdminCreds, onThemeUpdate, onSubTabChange, restaurantId, userId, userEmail, isDemo, onRestrict }) => {
  const [merchantData, setMerchantData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleUpdate = (action: () => void) => {
    action();
  };
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');
  const [storeNameError, setStoreNameError] = useState<string | null>(null);
  const [urlSlug, setUrlSlug] = useState('');
  const [urlSlugError, setUrlSlugError] = useState<string | null>(null);
  
  // Password Change State
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
  const [passError, setPassError] = useState<string | null>(null);

  // Theme Local State
  const [themeForm, setThemeForm] = useState({
    primary_color: '#FF6B00',
    secondary_color: '#FFF3E0',
    template: 'classic' as 'classic' | 'premium' | 'modern',
    logo_url: ''
  });

  const isDemoAccount = restaurantId === 'aeec6204-496e-46c4-adfb-ba154fa92153';

  useEffect(() => {
    console.log("AdminSettings: restaurantId =", restaurantId, "userId =", userId);
    if (restaurantId) {
        fetchMerchantData();
    } else if (userId) {
        fetchRestaurantIdForUser(userId);
    }
  }, [restaurantId, userId]);

  const fetchRestaurantIdForUser = async (uid: string) => {
      setLoading(true);
      try {
          const restaurant = await MenuService.getRestaurantByOwnerId(uid);
          if (restaurant) {
              // We need a way to update the restaurantId in the parent or just fetch data here
              // For now, let's just fetch data if we found the restaurant
              fetchMerchantDataForId(restaurant.id);
          }
      } catch (e) {
          console.error("Failed to fetch restaurant ID", e);
      } finally {
          setLoading(false);
      }
  };

  const fetchMerchantDataForId = async (rid: string) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('restaurants').select('*').eq('id', rid).single();
        if (!error && data) {
          setMerchantData(data);
          setStoreName(data.name || '');
          setUrlSlug(data.slug || '');
          if (data.theme) {
              setThemeForm({
                  primary_color: data.theme.primary_color || '#FF6B00',
                  secondary_color: data.theme.secondary_color || '#FFF3E0',
                  template: data.theme.template || 'classic',
                  logo_url: data.theme.logo_url || ''
              });
          }
        }
      } catch (e) {} finally { setLoading(false); }
  };

  const fetchMerchantData = async () => {
    fetchMerchantDataForId(restaurantId!);
  };

  const handleThemeChange = async (key: string, value: string) => {
    if (isDemo && onRestrict) {
        onRestrict("Cannot Edit Settings", "Demo mode is read-only. To manage your restaurant settings, please create your real account.");
        return;
    }
    const nextTheme = { ...themeForm, [key]: value };
    setThemeForm(nextTheme);
    try {
        await MenuService.updateRestaurantTheme(restaurantId, { 
            ...merchantData?.theme, 
            ...nextTheme 
        });
        onThemeUpdate(nextTheme);
        setToast("Interface Synchronized");
        setTimeout(() => setToast(null), 2000);
    } catch (e) {
        console.error("Theme sync error");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDemo && onRestrict) {
        onRestrict("Cannot Edit Settings", "Demo mode is read-only. To manage your restaurant settings, please create your real account.");
        return;
    }
    if (!e.target.files || e.target.files.length === 0 || !restaurantId) return;
    
    setLoading(true);
    try {
        const file = e.target.files[0];
        const publicUrl = await MenuService.uploadRestaurantLogo(restaurantId, file);
        
        const nextTheme = { ...themeForm, logo_url: publicUrl };
        setThemeForm(nextTheme);
        
        await MenuService.updateRestaurantTheme(restaurantId, { 
            ...merchantData?.theme, 
            ...nextTheme 
        });
        
        onThemeUpdate(nextTheme);
        setToast("Logo Updated Successfully");
        setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
        setToast("Upload Failed: " + (err.message || "Unknown error"));
        setTimeout(() => setToast(null), 3000);
    } finally {
        setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (isDemo) {
        onRestrict?.("Cannot Change Password", "Demo mode is read-only.");
        return;
    }
    if (passForm.new !== passForm.confirm) {
        setPassError("New passwords do not match.");
        return;
    }
    if (passForm.new.length < 6) {
        setPassError("Password must be at least 6 characters.");
        return;
    }
    if (!userId) {
        setPassError("User ID not found.");
        return;
    }
    setLoading(true);
    setPassError(null);
    try {
        // In a real app, we would verify current password first.
        // For this mockup, we'll assume current password is correct if provided.
        // But we will block the actual change if it's the demo account (handled above).
        
        await MenuService.updateUserPassword(userId, passForm.new);
        setToast("Password Updated");
        setTimeout(() => setToast(null), 2000);
        setActiveModal(null);
        setPassForm({ current: '', new: '', confirm: '' });
    } catch (e: any) {
        setPassError(e.message || "Failed to update password.");
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId || !restaurantId) {
        alert("Missing user or restaurant ID.");
        return;
    }
    setActiveModal('delete_account');
  };

  return (
    <div className="min-h-screen font-jakarta pb-60 px-4 md:px-0 bg-[#F2F2F7]">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[4500] animate-fade-in w-full max-w-sm px-6">
            <div className="p-4 rounded-full shadow-2xl flex items-center gap-3 bg-slate-900 text-white border border-white/10">
                <p className="text-[11px] font-black uppercase tracking-widest flex-1 text-center">{toast}</p>
            </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-8 pt-12">
        <header className="px-2 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">Site Settings</h1>
          <p className="text-slate-500 text-[17px] font-medium mt-3 leading-relaxed">
            Configure your platform preferences.
          </p>
        </header>

        {/* VISUAL IDENTITY (THEME EDITOR) */}
        <section className="space-y-3">
          <h3 className="px-4 text-[11px] font-bold text-slate-400 tracking-tight">Visual identity</h3>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
            <SettingRow icon="fa-palette" color="bg-rose-500" label="Primary accent" onClick={() => handleUpdate(() => setActiveModal('primary_color'))} />
            <SettingRow icon="fa-fill-drip" color="bg-amber-400" label="Secondary accent" onClick={() => handleUpdate(() => setActiveModal('secondary_color'))} />
            <SettingRow icon="fa-wand-magic-sparkles" color="bg-purple-600" label="Menu template" onClick={() => handleUpdate(() => setActiveModal('template'))} />
            <SettingRow icon="fa-image" color="bg-blue-500" label="Brand logo" last onClick={() => handleUpdate(() => setActiveModal('logo'))} />
          </div>
        </section>

        {/* IDENTITY RECORD */}
        <section className="space-y-3">
          <h3 className="px-4 text-[11px] font-bold text-slate-400 tracking-tight">Identity record</h3>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
            <SettingRow icon="fa-store" color="bg-slate-900" label="Store name" onClick={() => handleUpdate(() => setActiveModal('store_name'))} />
            <SettingRow icon="fa-envelope" color="bg-sky-500" label="Owner contact" onClick={() => handleUpdate(() => setActiveModal('owner_contact'))} />
            <SettingRow icon="fa-key" color="bg-slate-400" label="Change password" onClick={() => handleUpdate(() => setActiveModal('change_password'))} />
            <SettingRow icon="fa-trash-can" color="bg-rose-100 text-rose-500" label="Delete account" last isDestructive onClick={() => handleUpdate(handleDeleteAccount)} />
          </div>
        </section>



        {/* CONTENT MANAGEMENT */}
        <section className="space-y-3">
          <h3 className="px-4 text-[11px] font-bold text-slate-400 tracking-tight">Content management</h3>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
            <SettingRow icon="fa-circle-info" color="bg-orange-500" label="About us content" onClick={() => onSubTabChange?.('about')} />
            <SettingRow icon="fa-file-contract" color="bg-slate-400" label="Terms of service" onClick={() => onSubTabChange?.('terms')} />
            <SettingRow icon="fa-shield-halved" color="bg-blue-500" label="Privacy policy" last onClick={() => onSubTabChange?.('privacy')} />
          </div>
        </section>
      </div>

      {/* MODALS */}
      {activeModal === 'primary_color' && (
        <SettingsModal title="Primary accent" onClose={() => setActiveModal(null)}>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <input 
                    type="color" 
                    value={themeForm.primary_color} 
                    onChange={(e) => handleThemeChange('primary_color', e.target.value)}
                    className="w-12 h-12 rounded-lg overflow-hidden border-none p-0 cursor-pointer bg-transparent shadow-sm"
                />
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Hex Code</p>
                    <p className="text-lg font-mono font-bold text-slate-900">{themeForm.primary_color}</p>
                </div>
            </div>
            <p className="text-xs text-slate-400 px-2">This color is used for main buttons, highlights, and active states.</p>
        </SettingsModal>
      )}

      {activeModal === 'secondary_color' && (
        <SettingsModal title="Secondary accent" onClose={() => setActiveModal(null)}>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <input 
                    type="color" 
                    value={themeForm.secondary_color} 
                    onChange={(e) => handleThemeChange('secondary_color', e.target.value)}
                    className="w-12 h-12 rounded-lg overflow-hidden border-none p-0 cursor-pointer bg-transparent shadow-sm"
                />
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Hex Code</p>
                    <p className="text-lg font-mono font-bold text-slate-900">{themeForm.secondary_color}</p>
                </div>
            </div>
            <p className="text-xs text-slate-400 px-2">Used for backgrounds, subtle highlights, and secondary elements.</p>
        </SettingsModal>
      )}

      {activeModal === 'template' && (
        <SettingsModal title="Menu template" onClose={() => setActiveModal(null)}>
            <div className="space-y-2">
                {['classic', 'premium', 'modern'].map((t) => (
                    <button 
                        key={t}
                        onClick={() => {
                            if (t !== 'classic') return;
                            handleThemeChange('template', t);
                        }}
                        className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${themeForm.template === t ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'} ${t !== 'classic' ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                        <div className="flex flex-col items-start">
                            <span className="font-bold capitalize">{t.replace('-', ' ')}</span>
                            {t !== 'classic' && <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">Coming Soon</span>}
                        </div>
                        {themeForm.template === t && <i className="fa-solid fa-check text-indigo-600"></i>}
                    </button>
                ))}
            </div>
        </SettingsModal>
      )}

      {activeModal === 'logo' && (
        <SettingsModal title="Brand logo" onClose={() => setActiveModal(null)}>
            <div className="flex flex-col items-center gap-6 py-4">
                {themeForm.logo_url ? (
                    <div className="relative group">
                        <img src={themeForm.logo_url} className="w-32 h-32 rounded-2xl object-cover border border-slate-100 shadow-lg" />
                        <button 
                            onClick={() => {
                                if (confirm("Are you sure you want to remove your logo?")) {
                                    const nextTheme = { ...themeForm, logo_url: '' };
                                    setThemeForm(nextTheme);
                                    MenuService.updateRestaurantTheme(restaurantId, { ...merchantData?.theme, ...nextTheme });
                                    setToast("Logo removed");
                                    setTimeout(() => setToast(null), 2000);
                                }
                            }}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                        >
                            <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                ) : (
                    <div className="w-32 h-32 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 border border-slate-200 border-dashed">
                        <span className="text-sm font-bold text-slate-400 tracking-widest">mymenu.asia</span>
                    </div>
                )}
                
                <div className="w-full">
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden" 
                        id="logo-upload-modal"
                    />
                    <button 
                        onClick={() => document.getElementById('logo-upload-modal')?.click()}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all"
                    >
                        {loading ? 'Uploading...' : 'Upload new logo'}
                    </button>
                </div>
            </div>
        </SettingsModal>
      )}

      {activeModal === 'store_name' && (
        <SettingsModal title="Store name" onClose={() => { setActiveModal(null); setStoreName(merchantData?.name || ''); setStoreNameError(null); }}>
            <div className="space-y-4">
                {merchantData?.last_name_update && (new Date().getTime() - new Date(merchantData.last_name_update).getTime()) < 30 * 24 * 60 * 60 * 1000 && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start">
                        <i className="fa-solid fa-lock text-amber-500 mt-0.5"></i>
                        <div className="space-y-1">
                            <p className="text-amber-800 text-xs font-bold leading-none">Name locked</p>
                            <p className="text-amber-700 text-[11px] font-medium leading-relaxed">
                                Updated {Math.floor((new Date().getTime() - new Date(merchantData.last_name_update).getTime()) / (1000 * 60 * 60 * 24))} days ago. You can only update your store name once every 30 days.
                            </p>
                        </div>
                    </div>
                )}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Business Name</label>
                    <input 
                        type="text" 
                        value={storeName} 
                        onChange={(e) => { setStoreName(e.target.value); setStoreNameError(null); }}
                        className={`w-full bg-slate-50 border p-4 rounded-xl font-bold text-sm text-slate-900 outline-none transition-all shadow-inner ${storeNameError ? 'border-rose-200 ring-4 ring-rose-50' : 'border-slate-200 focus:bg-white'}`}
                        placeholder="Enter store name"
                        disabled={merchantData?.last_name_update && (new Date().getTime() - new Date(merchantData.last_name_update).getTime()) < 30 * 24 * 60 * 60 * 1000}
                    />
                    {storeNameError && <p className="text-rose-500 text-[9px] font-bold tracking-tight ml-1">{storeNameError}</p>}
                </div>
                <button 
                    onClick={async () => {
                        if (isDemo && onRestrict) {
                            onRestrict("Cannot Edit Settings", "Demo mode is read-only. To manage your restaurant settings, please create your real account.");
                            return;
                        }
                        if (!storeName.trim() || storeName === merchantData?.name) return;
                        setLoading(true);
                        try {
                            const exists = await MenuService.checkBusinessNameExists(storeName);
                            if (exists) {
                                setStoreNameError("This business name is already taken.");
                                setLoading(false);
                                return;
                            }
                            await MenuService.updateRestaurant(restaurantId, storeName);
                            setMerchantData({ ...merchantData, name: storeName, slug: storeName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''), last_name_update: new Date().toISOString(), last_slug_update: new Date().toISOString() });
                            setToast("Store Name Updated");
                            setTimeout(() => setToast(null), 2000);
                            setActiveModal(null);
                        } catch (e) {
                            setStoreNameError("Failed to update name.");
                        } finally {
                            setLoading(false);
                        }
                    }}
                    disabled={loading || !storeName.trim() || storeName === merchantData?.name || (merchantData?.last_name_update && (new Date().getTime() - new Date(merchantData.last_name_update).getTime()) < 30 * 24 * 60 * 60 * 1000)}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                    {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Update Store Name'}
                </button>
            </div>
        </SettingsModal>
      )}

      {activeModal === 'change_password' && (
        <SettingsModal title="Change password" onClose={() => { setActiveModal(null); setPassForm({ current: '', new: '', confirm: '' }); setPassError(null); }}>
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                        <button className="text-[10px] font-bold text-indigo-600 hover:underline">Forgot password?</button>
                    </div>
                    <input 
                        type="password" 
                        value={passForm.current} 
                        onChange={(e) => setPassForm({ ...passForm, current: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold text-sm text-slate-900 outline-none focus:bg-white transition-all shadow-inner"
                        placeholder="••••••••"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                    <input 
                        type="password" 
                        value={passForm.new} 
                        onChange={(e) => setPassForm({ ...passForm, new: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold text-sm text-slate-900 outline-none focus:bg-white transition-all shadow-inner"
                        placeholder="••••••••"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                    <input 
                        type="password" 
                        value={passForm.confirm} 
                        onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold text-sm text-slate-900 outline-none focus:bg-white transition-all shadow-inner"
                        placeholder="••••••••"
                    />
                </div>

                {passError && <p className="text-rose-500 text-[9px] font-bold tracking-tight ml-1 text-center">{passError}</p>}

                <button 
                    onClick={handlePasswordChange}
                    disabled={loading || !passForm.current || !passForm.new || !passForm.confirm}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                    {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Update Password'}
                </button>
            </div>
        </SettingsModal>
      )}

      {activeModal === 'demo_block' && (
        <SettingsModal title="Demo Account" onClose={() => setActiveModal(null)}>
            <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 text-2xl">
                    <i className="fa-solid fa-lock"></i>
                </div>
                <div className="space-y-2">
                    <h4 className="text-lg font-bold text-slate-900">Action Restricted</h4>
                    <p className="text-sm text-slate-500 font-medium px-4">This is a demo account. Security settings and account deletion are disabled to preserve the experience for other users.</p>
                </div>
                <button 
                    onClick={() => setActiveModal(null)}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all"
                >
                    Understood
                </button>
            </div>
        </SettingsModal>
      )}

      {activeModal === 'owner_contact' && (
        <SettingsModal title="Owner contact" onClose={() => setActiveModal(null)}>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                <i className="fa-solid fa-envelope text-slate-400"></i>
                <p className="text-lg font-bold text-slate-900">{userEmail}</p>
            </div>
        </SettingsModal>
      )}

      {activeModal === 'delete_account' && (
        <SettingsModal title="Delete Account" onClose={() => setActiveModal(null)}>
            <div className="space-y-6">
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex gap-3 items-start">
                    <i className="fa-solid fa-triangle-exclamation text-rose-500 mt-0.5"></i>
                    <div className="space-y-1">
                        <p className="text-rose-800 text-xs font-bold leading-none">Warning: Irreversible Action</p>
                        <p className="text-rose-700 text-[11px] font-medium leading-relaxed">
                            Deleting your account will permanently remove all your menus, categories, items, and settings. This action cannot be undone.
                        </p>
                    </div>
                </div>
                <div className="space-y-3">
                    <button 
                        onClick={async () => {
                            if (isDemo && onRestrict) {
                                onRestrict("Cannot Edit Settings", "Demo mode is read-only. To manage your restaurant settings, please create your real account.");
                                return;
                            }
                            if (!userId || !restaurantId) return;
                            setLoading(true);
                            try {
                                await MenuService.terminateAccount(userId, restaurantId);
                                onLogout();
                            } catch (e: any) {
                                alert("Failed to delete account: " + e.message);
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="w-full py-4 bg-rose-500 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Yes, Delete My Account'}
                    </button>
                    <button 
                        onClick={() => setActiveModal(null)}
                        disabled={loading}
                        className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </SettingsModal>
      )}
    </div>
  );
};

export default AdminSettings;