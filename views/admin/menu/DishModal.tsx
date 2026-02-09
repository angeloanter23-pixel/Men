
import React, { useState, useEffect } from 'react';
import { MenuItem, Category, ItemOptionGroup } from '../../../types';

interface DishModalProps {
  editingItem: MenuItem | null;
  formData: any;
  setFormData: (data: any) => void;
  cats: Category[];
  loading: boolean;
  onClose: () => void;
  onSave: () => void;
}

const SettingRow: React.FC<{ icon: string; color: string; label: string; children: React.ReactNode; last?: boolean }> = ({ icon, color, label, children, last }) => (
  <div className={`flex items-center justify-between py-3 ${!last ? 'border-b border-slate-100' : ''}`}>
    <div className="flex items-center gap-3 min-w-0">
      <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center text-white shrink-0 shadow-sm`}>
        <i className={`fa-solid ${icon} text-[12px]`}></i>
      </div>
      <span className="text-[14px] font-bold text-slate-800 tracking-tight truncate">{label}</span>
    </div>
    <div className="flex items-center gap-3 shrink-0 ml-4">
      {children}
    </div>
  </div>
);

const DishModal: React.FC<DishModalProps> = ({ 
  editingItem, formData, setFormData, cats, loading, onClose, onSave 
}) => {
  const [modalTab, setModalTab] = useState<'general' | 'options'>('general');
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsRendered(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => { if (loadEvent.target?.result) setFormData({ ...formData, image: loadEvent.target!.result as string }); };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const isGroupHeader = formData.has_variations;
  const isVariant = !!formData.parent_id;

  return (
    <div className="fixed inset-0 z-[4000] flex items-end sm:items-center justify-center font-jakarta">
      <div 
        onClick={() => !loading && onClose()} 
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isRendered ? 'opacity-100' : 'opacity-0'}`} 
      />
      
      <div 
        className={`relative bg-[#F2F2F7] w-full max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl flex flex-col p-0 transition-transform duration-300 ease-out max-h-[92vh] overflow-hidden z-[4001]
          ${isRendered ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        
        <header className="px-6 pt-6 pb-4 bg-white border-b border-slate-100 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div className="min-w-0">
              <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none truncate">
                {isGroupHeader ? (editingItem ? 'Edit Group' : 'New Group') : (editingItem ? 'Edit Dish' : 'New Dish')}
              </h3>
              <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-widest">
                {isGroupHeader ? 'Group Holder' : (isVariant ? 'Nested Variant' : 'Single Dish')}
              </p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 text-slate-300 hover:text-slate-900 transition-all active:scale-90 flex items-center justify-center shadow-sm border border-slate-100 shrink-0"><i className="fa-solid fa-xmark text-sm"></i></button>
          </div>

          {!isGroupHeader && (
            <div className="bg-[#E8E8ED] p-1 rounded-xl flex border border-slate-100 shadow-inner">
              <button onClick={() => setModalTab('general')} className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${modalTab === 'general' ? 'bg-white text-[#007AFF] shadow-sm' : 'text-slate-500'}`}>Information</button>
              <button onClick={() => setModalTab('options')} className={`flex-1 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${modalTab === 'options' ? 'bg-white text-[#007AFF] shadow-sm' : 'text-slate-500'}`}>Add-ons</button>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
          {modalTab === 'general' ? (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/60 space-y-5">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Dish Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-transparent p-4 rounded-xl font-bold text-[14px] outline-none transition-all focus:bg-white focus:border-slate-100 shadow-inner" placeholder="e.g. Cheese Burger" />
                </div>
                
                {!isGroupHeader && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Price (₱)</label>
                    <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-50 border border-transparent p-4 rounded-xl font-black text-[18px] outline-none transition-all focus:bg-white focus:border-slate-100 shadow-inner" placeholder="0.00" />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Description</label>
                  <textarea value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} className="w-full bg-slate-50 border border-transparent p-4 rounded-xl font-bold text-xs outline-none h-20 resize-none transition-all focus:bg-white focus:border-slate-100 shadow-inner" placeholder="Briefly describe this dish..." />
                </div>
                
                {!isGroupHeader && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Ingredients</label>
                    <textarea value={formData.ingredients} onChange={e => setFormData({...formData, ingredients: e.target.value})} className="w-full bg-slate-50 border border-transparent p-4 rounded-xl font-bold text-xs outline-none h-20 resize-none transition-all focus:bg-white focus:border-slate-100 shadow-inner" placeholder="Beef, Bread, Cheese..." />
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-200/60">
                <SettingRow icon="fa-folder-tree" color="bg-indigo-500" label="Section">
                  <select value={formData.cat} onChange={e => setFormData({...formData, cat: e.target.value})} className="bg-transparent text-xs font-black text-[#007AFF] outline-none appearance-none cursor-pointer text-right pr-4">
                    <option value="">Global</option>
                    {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </SettingRow>
                
                {!isGroupHeader && (
                  <>
                    <SettingRow icon="fa-users" color="bg-purple-500" label="Serving Size">
                      <input type="text" value={formData.people} onChange={e => setFormData({...formData, people: e.target.value})} className="w-24 bg-slate-50 border-none rounded-lg p-2 text-center font-bold text-[10px] outline-none shadow-inner" placeholder="1 Person" />
                    </SettingRow>
                    <SettingRow icon="fa-clock" color="bg-orange-500" label="Cook Time">
                      <input type="number" value={formData.mins} onChange={e => setFormData({...formData, mins: e.target.value})} className="w-16 bg-slate-50 border-none rounded-lg p-2 text-center font-bold text-[10px] outline-none shadow-inner" placeholder="15" />
                    </SettingRow>
                  </>
                )}

                <SettingRow icon="fa-bolt" color="bg-amber-400" label="Show as Popular">
                  <div onClick={() => setFormData({...formData, isPopular: !formData.isPopular})} className={`w-10 h-5 rounded-full transition-all flex items-center p-1 cursor-pointer shadow-inner ${formData.isPopular ? 'bg-[#34C759]' : 'bg-slate-300'}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-lg transform transition-all ${formData.isPopular ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                </SettingRow>

                {!isGroupHeader && (
                  <SettingRow icon="fa-eye" color="bg-emerald-500" label="Show on Menu" last>
                    <div onClick={() => setFormData({...formData, isAvailable: !formData.isAvailable})} className={`w-10 h-5 rounded-full transition-all flex items-center p-1 cursor-pointer shadow-inner ${formData.isAvailable ? 'bg-[#34C759]' : 'bg-slate-300'}`}>
                      <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-lg transform transition-all ${formData.isAvailable ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                  </SettingRow>
                )}
              </div>

              <div className="space-y-3 pb-4">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3">Photo</label>
                <input type="file" id="dish-img-up" className="hidden" onChange={handleImage} />
                <button onClick={() => document.getElementById('dish-img-up')?.click()} className="w-full aspect-video bg-white border border-slate-200 rounded-[2rem] overflow-hidden flex flex-col items-center justify-center gap-3 transition-all hover:border-[#007AFF]/30 group relative shadow-inner">
                  {formData.image ? (
                    <>
                      <img src={formData.image} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <span className="bg-white/90 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl border border-white">Change Photo</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-200 shadow-sm border border-slate-100"><i className="fa-solid fa-camera text-xl"></i></div>
                      <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Click to upload</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in pb-10">
              {isGroupHeader ? (
                <div className="py-20 text-center space-y-4 px-8">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-200 text-2xl shadow-inner border border-slate-100"><i className="fa-solid fa-ban"></i></div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Add-ons Restricted</p>
                  <p className="text-[9px] text-slate-300 font-bold leading-relaxed">Add-ons must be assigned to individual items inside this group.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center px-2">
                    <div>
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none italic">Add-ons</h4>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Configure choices</p>
                    </div>
                    <button onClick={() => {
                      const newGroup: ItemOptionGroup = { name: '', required: false, min_choices: 0, max_choices: 1, options: [{ name: '', price: 0 }] };
                      setFormData({ ...formData, optionGroups: [...formData.optionGroups, newGroup] });
                    }} className="bg-[#007AFF] text-white px-4 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all">+ New Options</button>
                  </div>

                  {formData.optionGroups.map((group: any, gIdx: number) => (
                    <div key={gIdx} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5 relative animate-fade-in">
                      <button onClick={() => setFormData({ ...formData, optionGroups: formData.optionGroups.filter((_: any, i: number) => i !== gIdx) })} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 shadow-lg active:scale-90"><i className="fa-solid fa-xmark text-xs"></i></button>
                      
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-3">Option Group Name</label>
                          <input type="text" value={group.name} onChange={e => {
                            const newG = [...formData.optionGroups];
                            newG[gIdx].name = e.target.value;
                            setFormData({...formData, optionGroups: newG});
                          }} placeholder="e.g. Choose Sauce" className="w-full bg-slate-50 border border-transparent p-4 rounded-xl font-bold text-xs outline-none shadow-inner focus:bg-white focus:border-slate-100 transition-all" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl shadow-inner">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Required?</span>
                            <div onClick={() => {
                              const newG = [...formData.optionGroups];
                              newG[gIdx].required = !newG[gIdx].required;
                              if (newG[gIdx].required && newG[gIdx].min_choices < 1) newG[gIdx].min_choices = 1;
                              setFormData({...formData, optionGroups: newG});
                            }} className={`w-9 h-5 rounded-full transition-all flex items-center p-1 cursor-pointer ${group.required ? 'bg-[#34C759]' : 'bg-slate-300'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-all ${group.required ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl shadow-inner">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Max Picks</span>
                            <input 
                              type="number" 
                              value={group.max_choices} 
                              onChange={e => {
                                const newG = [...formData.optionGroups];
                                newG[gIdx].max_choices = parseInt(e.target.value) || 1;
                                setFormData({...formData, optionGroups: newG});
                              }}
                              className="w-10 bg-transparent text-center font-black text-slate-900 outline-none text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center px-3">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Choices</label>
                          <button onClick={() => {
                            const newG = [...formData.optionGroups];
                            newG[gIdx].options.push({ name: '', price: 0 });
                            setFormData({...formData, optionGroups: newG});
                          }} className="text-[9px] font-bold text-[#007AFF] hover:underline">+ Add Entry</button>
                        </div>
                        <div className="space-y-2">
                          {group.options.map((opt: any, oIdx: number) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <input type="text" value={opt.name} onChange={e => {
                                const newG = [...formData.optionGroups];
                                newG[gIdx].options[oIdx].name = e.target.value;
                                setFormData({...formData, optionGroups: newG});
                              }} placeholder="Title" className="flex-1 bg-slate-50 border border-transparent px-4 py-2.5 rounded-lg font-bold text-[10px] outline-none shadow-inner focus:bg-white focus:border-slate-100 transition-all" />
                              <div className="w-20 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-300 font-black">₱</span>
                                <input type="number" value={opt.price} onChange={e => {
                                  const newG = [...formData.optionGroups];
                                  newG[gIdx].options[oIdx].price = parseFloat(e.target.value) || 0;
                                  setFormData({...formData, optionGroups: newG});
                                }} className="w-full bg-slate-50 border border-transparent pl-6 pr-3 py-2.5 rounded-lg font-bold text-[10px] outline-none shadow-inner focus:bg-white focus:border-slate-100 transition-all" />
                              </div>
                              <button onClick={() => {
                                const newG = [...formData.optionGroups];
                                newG[gIdx].options = newG[gIdx].options.filter((_: any, i: number) => i !== oIdx);
                                setFormData({...formData, optionGroups: newG});
                              }} className="text-slate-200 hover:text-rose-500 p-2 transition-colors active:scale-90"><i className="fa-solid fa-circle-minus"></i></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          <div className="pt-2 pb-10">
            <button 
              onClick={onSave} 
              disabled={loading || !formData.name.trim()} 
              className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <i className="fa-solid fa-sync-alt animate-spin text-sm"></i> : <i className="fa-solid fa-cloud-arrow-up text-sm"></i>}
              <span>Save Changes</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DishModal;
