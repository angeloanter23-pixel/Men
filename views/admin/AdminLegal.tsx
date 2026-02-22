import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import RichTextMenu from '../../components/admin/RichTextMenu';
import MenuFAQ from './menu/MenuFAQ';

interface AdminLegalProps {
  restaurantId: string;
  initialDocType?: 'terms' | 'privacy';
  onBack: () => void;
}

const DEFAULT_TERMS = `
  <div>
    <h3>1. Ordering Agreement</h3>
    <p>By using this digital menu, you agree that all orders sent through your table QR code are considered binding. The restaurant will prepare these items immediately upon receipt.</p>
    <h3>2. Pricing and Payments</h3>
    <p>All prices listed include applicable taxes unless stated otherwise. Payments must be settled before leaving the premises, either via digital gateway or at the counter.</p>
    <h3>3. Service Availability</h3>
    <p>We strive to keep the menu updated in real-time. However, certain items may become unavailable due to kitchen demand. Staff will notify you if an item in your order is out of stock.</p>
    <h3>4. User Conduct</h3>
    <p>Please use the digital calling and messaging features respectfully. Harassment of staff via digital channels will result in the immediate termination of your digital session.</p>
  </div>
`;

const DEFAULT_PRIVACY = `
  <div>
    <h3>1. Information Collection</h3>
    <p>We collect minimal data required to fulfill your order, including your name, table number, and order history for the duration of your dining session.</p>
    <h3>2. Use of Data</h3>
    <p>Your data is used strictly for order fulfillment, staff assistance, and internal kitchen analytics. We do not sell your personal information to third parties.</p>
    <h3>3. Data Retention</h3>
    <p>Session data and chat history are stored securely. Personal identifiers are typically cleared once the restaurant closes your table session.</p>
    <h3>4. Digital Security</h3>
    <p>All communications between your device and our kitchen are encrypted. We utilize industry-standard protocols to ensure your digital experience is safe.</p>
  </div>
`;

const AdminLegal: React.FC<AdminLegalProps> = ({ restaurantId, initialDocType = 'terms', onBack }) => {
  const [docType, setDocType] = useState<'terms' | 'privacy'>(initialDocType);
  const [content, setContent] = useState({ terms: '', privacy: '' });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showFaq, setShowFaq] = useState(false);
  const [editingDoc, setEditingDoc] = useState<'terms' | 'privacy' | null>(null);
  const [tempContent, setTempContent] = useState('');
  const [showDemoBlock, setShowDemoBlock] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const isDemoAccount = restaurantId === 'aeec6204-496e-46c4-adfb-ba154fa92153';
  const editorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);

  useEffect(() => {
    if (restaurantId) fetchLegalData();
    document.execCommand('styleWithCSS', false, 'true');
  }, [restaurantId]);

  useEffect(() => {
    if (editingDoc && editorRef.current) {
        editorRef.current.innerHTML = tempContent;
    }
  }, [editingDoc]);

  const persistSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        savedRange.current = range.cloneRange();
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!editorRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLegalData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('terms_content, privacy_content')
        .eq('id', restaurantId)
        .single();
      if (error) throw error;
      setContent({ 
        terms: data.terms_content || DEFAULT_TERMS, 
        privacy: data.privacy_content || DEFAULT_PRIVACY 
      });
    } catch (e) {
      console.error("Legal fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newContent?: { terms: string, privacy: string }) => {
    if (!restaurantId || isSaving) return;
    if (isDemoAccount) {
        setShowDemoBlock(true);
        return;
    }
    setIsSaving(true);
    
    const payload = newContent || content;
    
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ terms_content: payload.terms, privacy_content: payload.privacy })
        .eq('id', restaurantId);
      if (error) throw error;
      setContent(payload);
      setToast("Records Synchronized");
      setTimeout(() => setToast(null), 3000);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const openEditor = (type: 'terms' | 'privacy') => {
    setEditingDoc(type);
    setTempContent(content[type]);
  };

  const commitEdit = () => {
    if (!editingDoc) return;
    if (isDemoAccount) {
        setShowDemoBlock(true);
        return;
    }
    const nextContent = { ...content, [editingDoc]: tempContent };
    setContent(nextContent);
    setEditingDoc(null);
    handleSave(nextContent);
  };

  const handleFormat = (type: string, value?: string) => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    let range: Range | null = selection?.rangeCount ? selection.getRangeAt(0) : null;

    if (!range && savedRange.current) range = savedRange.current;
    if (!range) { editorRef.current.focus(); return; }

    selection?.removeAllRanges();
    selection?.addRange(range);

    if (['bold', 'italic', 'underline'].includes(type)) {
        document.execCommand(type, false);
    } else if (type === 'bullet') {
        document.execCommand('insertUnorderedList', false);
    } else if (type === 'number') {
        document.execCommand('insertOrderedList', false);
    } else if (type === 'size') {
        if (!range.collapsed) {
            const span = document.createElement('span');
            span.style.fontSize = value || '16px';
            try {
                const fragment = range.extractContents();
                span.appendChild(fragment);
                range.insertNode(span);
                const newRange = document.createRange();
                newRange.selectNodeContents(span);
                savedRange.current = newRange;
                selection?.removeAllRanges();
                selection?.addRange(newRange);
            } catch (e) { console.error(e); }
        }
    }
    
    if (editorRef.current) {
        setTempContent(editorRef.current.innerHTML);
    }
  };

  const legalFaqs = [
    { q: "Where do these documents appear?", a: "These documents are linked in the guest's mobile view sidebar and the landing page footer. Updating them here reflects changes instantly for all users." },
    { q: "Can I use images in my policy?", a: "The current editor focuses on rich text formatting (bold, lists, sizes) to ensure high performance and fast loading for mobile guests." },
    { q: "Is there a template available?", a: "We provide basic starters, but we recommend consulting with a legal professional to ensure your terms match your local business laws." }
  ];

  if (showFaq) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <MenuFAQ 
          onBack={() => setShowFaq(false)} 
          title="Legal Support" 
          items={legalFaqs}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Vault...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in font-jakarta bg-[#F2F2F7] min-h-screen relative pb-60">
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[4000] bg-slate-900 text-white px-8 py-3 rounded-full shadow-2xl animate-fade-in border border-white/10">
          <p className="text-[11px] font-bold uppercase tracking-widest leading-none">{toast}</p>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between px-6 py-6 max-w-3xl mx-auto w-full">
          <button 
            onClick={onBack}
            className="group flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-95"
          >
            <i className="fa-solid fa-arrow-left text-[8px] group-hover:-translate-x-0.5 transition-transform"></i>
            Back to Identity
          </button>

          <button 
            onClick={() => handleSave()}
            disabled={isSaving}
            className="rounded-none px-6 py-3 font-black text-[11px] tracking-[0.2em] text-slate-900 hover:text-indigo-600 transition-all disabled:opacity-30 active:scale-95"
          >
            {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : 'save'}
          </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-12">
        <header className="px-2 text-center">
          <p className="text-[10px] font-bold uppercase text-orange-500 tracking-[0.4em] mb-2">{docType === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}</p>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none uppercase">Legal Documents</h1>
          <p className="text-slate-500 text-[17px] font-medium mt-3 leading-relaxed">
            Edit your store rules and privacy info.
            <button onClick={() => setShowFaq(true)} className="ml-1.5 text-[#007AFF] font-bold hover:underline">FAQs</button>
          </p>
        </header>

        <div className="pb-20">
            {docType === 'terms' ? (
                <div className="space-y-2 animate-fade-in">
                    <div 
                        onClick={() => openEditor('terms')}
                        className="w-full bg-white border border-slate-200 p-8 rounded-3xl min-h-[500px] cursor-pointer hover:shadow-xl transition-all relative group"
                    >
                        <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><i className="fa-solid fa-pen text-sm"></i></div>
                        </div>
                        <div className="prose prose-lg prose-slate max-w-none pointer-events-none opacity-80">
                            <div dangerouslySetInnerHTML={{ __html: content.terms }} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-2 animate-fade-in">
                    <div 
                        onClick={() => openEditor('privacy')}
                        className="w-full bg-white border border-slate-200 p-8 rounded-3xl min-h-[500px] cursor-pointer hover:shadow-xl transition-all relative group"
                    >
                        <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><i className="fa-solid fa-pen text-sm"></i></div>
                        </div>
                        <div className="prose prose-lg prose-slate max-w-none pointer-events-none opacity-80">
                            <div dangerouslySetInnerHTML={{ __html: content.privacy }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* FULL PAGE EDITOR MODAL */}
      {editingDoc && (
        <div className="fixed inset-0 z-[5000] bg-white animate-fade-in flex flex-col">
           {/* Header */}
           <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <button onClick={() => setEditingDoc(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                <i className="fa-solid fa-xmark"></i>
              </button>
              <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">{editingDoc === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}</p>
              <button onClick={commitEdit} className="px-6 py-2.5 bg-slate-900 text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                Update
              </button>
           </div>
           
           {/* Editor Area */}
           <div className="flex-1 relative overflow-y-auto no-scrollbar">
             <div 
                ref={editorRef} 
                contentEditable
                suppressContentEditableWarning
                onFocus={() => { setShowMenu(true); persistSelection(); }}
                onMouseUp={persistSelection}
                onKeyUp={persistSelection}
                onClick={() => setShowMenu(true)}
                onInput={() => setTempContent(editorRef.current?.innerHTML || '')}
                className="w-full min-h-full p-6 md:p-12 text-lg font-medium text-slate-800 leading-relaxed outline-none prose prose-slate max-w-none"
             />
           </div>
        </div>
      )}

      {editingDoc && <RichTextMenu ref={menuRef} isVisible={showMenu} onFormat={handleFormat} />}

      {/* DEMO BLOCK MODAL */}
      {showDemoBlock && (
        <div className="fixed inset-0 z-[6000] flex items-end justify-center animate-fade-in" onClick={() => setShowDemoBlock(false)}>
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <div className="relative bg-white w-full max-w-lg rounded-t-2xl shadow-2xl p-6 pb-10 animate-slide-up flex flex-col gap-6" onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto shrink-0" />
                <div className="text-center space-y-4 py-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 text-2xl">
                        <i className="fa-solid fa-lock"></i>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-lg font-bold text-slate-900">Action Restricted</h4>
                        <p className="text-sm text-slate-500 font-medium px-4">This is a demo account. Content updates are disabled to preserve the experience for other users.</p>
                    </div>
                    <button 
                        onClick={() => setShowDemoBlock(false)}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all"
                    >
                        Understood
                    </button>
                </div>
            </div>
        </div>
      )}

      <style>{`
        .prose h3 { font-size: 1.25rem; font-weight: 800; text-transform: uppercase; margin-top: 2rem; margin-bottom: 1rem; color: #0f172a; letter-spacing: -0.025em; }
        .prose p { margin-bottom: 1.25rem; color: #475569; }
        .prose ul { margin-bottom: 1.5rem; padding-left: 1.5rem; list-style-type: disc; }
        .prose ol { margin-bottom: 1.5rem; padding-left: 1.5rem; list-style-type: decimal; }
        .prose li { margin-bottom: 0.5rem; color: #475569; }
        .prose b, .prose strong { color: #0f172a; font-weight: 900; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminLegal;