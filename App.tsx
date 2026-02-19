import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, CartItem, Category, ViewState, Feedback } from './types';
import * as MenuService from './services/menuService';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DetailPanel from './components/DetailPanel';
import PremiumDetailPanel from './components/PremiumDetailPanel';
import ModernDetailPanel from './components/ModernDetailPanel';
import SupportHub from './components/SupportHub';
import BottomNav from './components/BottomNav';
import VariationDrawer from './components/VariationDrawer';
import FeedbackForm from './components/FeedbackForm';

import MenuView from './views/MenuView';
import PremiumMenuView from './views/PremiumMenuView';
import ModernMenuView from './views/ModernMenuView';
import CartView from './views/CartView';
import OrdersView from './views/OrdersView';
import QRVerifyView from './views/QRVerifyView';
import AdminView from './views/AdminView';
import LandingView from './views/LandingView';
import AboutView from './views/AboutView';
import FeedbackDataView from './views/FeedbackDataView';
import SuperAdminView from './views/SuperAdminView';
import TestSupabaseView from './views/TestSupabaseView';
import AcceptInviteView from './views/AcceptInviteView';
import AIAssistantView from './views/AIAssistantView';
import CreateMenuView from './views/CreateMenuView';
import DemoHubView from './views/DemoHubView';
import MenuFAQ from './views/admin/menu/MenuFAQ';
import LegalView from './views/LegalView';
import ArticlesView from './views/ArticlesView';
import ArticleViewer from './views/ArticleViewer';
import VerificationBarcodeView from './views/VerificationBarcodeView';
import CareersView from './views/CareersView';
import AffiliateAuth from './views/AffiliateAuth';
import AffiliateDashboard from './views/AffiliateDashboard';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [activeVariantSource, setActiveVariantSource] = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSupportHubOpen, setIsSupportHubOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [lastPayFirstOrders, setLastPayFirstOrders] = useState<any[]>([]);
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isBooting, setIsBooting] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [lastError, setLastError] = useState<{msg: string, log: string} | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [pendingSingleItem, setPendingSingleItem] = useState<CartItem | null>(null);
  const [initialTokenFromUrl, setInitialTokenFromUrl] = useState<string | undefined>(undefined);

  const [appTheme, setAppTheme] = useState<any>({ 
    primary_color: '#FF6B00', 
    secondary_color: '#FFF3E0', 
    font_family: 'Plus Jakarta Sans',
    template: 'classic',
    feedback_metrics: ["Cleanliness", "Food Quality", "Speed", "Service", "Value", "Experience"]
  });

  const applyTheme = (themeData: any) => {
    if (!themeData) return;
    setAppTheme(prev => ({ 
      ...prev, 
      ...themeData,
      feedback_metrics: themeData.feedback_metrics || prev.feedback_metrics 
    }));
  };

  const syncDatabaseData = async (restaurantId: string) => {
    try {
      const menu = await MenuService.getMenuByRestaurantId(restaurantId);
      setMenuItems(menu.items || []);
      setCategories(menu.categories || []);
      
      const fbs = await MenuService.getFeedbacks(restaurantId);
      setFeedbacks(fbs || []);
    } catch (e) {
      console.error("Critical Sync Error", e);
    }
  };

  const handleVerificationSuccess = async (session: any) => {
    setActiveSession(session);
    localStorage.setItem('foodie_active_session', JSON.stringify(session));
    if (session.theme) applyTheme(session.theme);
    
    await syncDatabaseData(session.restaurant_id);
    
    if (pendingSingleItem) {
        finalizeOrder(session, [pendingSingleItem]);
        setPendingSingleItem(null);
    } else if (cart.length > 0) {
        finalizeOrder(session, cart);
        setCart([]);
    } else {
        navigateTo('menu');
    }
  };

  const checkSessionValid = async () => {
    const saved = localStorage.getItem('foodie_active_session');
    if (!saved) return false;
    try {
        const session = JSON.parse(saved);
        const status = await MenuService.getSessionStatus(session.id);
        if (!status || status.status === 'ended') {
            localStorage.removeItem('foodie_active_session');
            setActiveSession(null);
            return false;
        }
        setActiveSession(session);
        if (session.theme) applyTheme(session.theme);
        await syncDatabaseData(session.restaurant_id);
        return true;
    } catch (e) { return false; }
  };

  const syncStateWithURL = async () => {
    const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    const hashParts = hash.split('/');
    const route = (hashParts[0] || 'landing') as ViewState;
    if (route === 'article' && hashParts[1]) setSelectedArticleId(hashParts[1]);
    setCurrentView(route);
  };

  useEffect(() => {
    const init = async () => {
      setIsBooting(true);
      const isPersistent = await checkSessionValid();
      await syncStateWithURL();
      if (isPersistent && (window.location.hash === '#/landing' || !window.location.hash)) {
          navigateTo('menu');
      }
      setIsBooting(false);
    };
    init();
    window.addEventListener('hashchange', syncStateWithURL);
    return () => window.removeEventListener('hashchange', syncStateWithURL);
  }, []);

  const navigateTo = (view: ViewState, param?: string) => { 
    setCurrentView(view); 
    setSelectedItem(null); 
    setIsSupportHubOpen(false);
    if (view === 'article' && param) {
      setSelectedArticleId(param);
      window.location.hash = `/${view}/${param}`;
    } else {
      window.location.hash = `/${view}`; 
    }
  };

  const generateVerificationCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  };

  const finalizeOrder = async (sessionOverride?: any, itemsOverride?: CartItem[]) => {
    const session = sessionOverride || activeSession;
    const items = itemsOverride || (pendingSingleItem ? [pendingSingleItem] : cart);
    if (!session) { navigateTo('qr-verify'); return; }
    if (items.length === 0) return;
    setIsDispatching(true);
    setLastError(null);
    try {
      const hasPayFirst = items.some(i => i.pay_as_you_order);
      const sharedVerificationCode = hasPayFirst ? generateVerificationCode() : null;

      const dbOrders = items.map(item => ({
        restaurant_id: session.restaurant_id,
        item_id: String(item.id),
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        amount: item.price * item.quantity,
        table_number: session.label || 'Walk-in',
        customer_name: item.orderTo || 'Guest',
        order_status: 'Pending',
        payment_status: 'Unpaid',
        instructions: item.customInstructions || '',
        qr_code_token: session.session_token || session.id,
        pay_as_you_order: !!item.pay_as_you_order,
        verification_code: hasPayFirst ? sharedVerificationCode : null
      }));
      
      const response = await MenuService.insertOrders(dbOrders);
      
      // TRACK LOCAL ORDERS
      const localIds = JSON.parse(localStorage.getItem('foodie_my_order_ids') || '[]');
      const newIds = response.map((o: any) => String(o.id));
      localStorage.setItem('foodie_my_order_ids', JSON.stringify([...localIds, ...newIds]));

      if (itemsOverride || !pendingSingleItem) setCart([]);
      if (pendingSingleItem) setPendingSingleItem(null);

      if (hasPayFirst) {
        setLastPayFirstOrders(response);
        navigateTo('verification-barcode');
      } else {
        navigateTo('orders');
      }
    } catch (e: any) { 
      setLastError({ msg: "Your order could not be sent to the kitchen.", log: e.message || "" });
    } finally { setIsDispatching(false); }
  };

  const handleItemSelect = (item: MenuItem) => {
    const children = menuItems.filter(i => i.parent_id === item.id);
    if (children.length > 0 || item.has_variations) setActiveVariantSource(item);
    else setSelectedItem(item);
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing': return <LandingView onStart={() => navigateTo('demo')} onCreateMenu={() => navigateTo('create-menu')} onImportMenu={() => {}} onMenuClick={() => setIsSidebarOpen(true)} onAffiliateAuth={() => navigateTo('affiliate-auth')} />;
      case 'create-menu': return <CreateMenuView onCancel={() => navigateTo('landing')} onComplete={() => navigateTo('admin')} />;
      case 'demo': return <DemoHubView onBack={() => navigateTo('landing')} onSelectDemo={() => navigateTo('menu')} />;
      case 'articles': return <ArticlesView onBack={() => navigateTo('landing')} />;
      case 'article': return <ArticleViewer id={selectedArticleId} onBack={() => navigateTo('articles')} />;
      case 'verification-barcode': return <VerificationBarcodeView orders={lastPayFirstOrders} onDismiss={() => navigateTo('orders')} />;
      case 'menu': 
        if (appTheme.template === 'premium') return <PremiumMenuView categories={categories} filteredItems={menuItems.filter(i => activeCategory === 'all' || i.cat_name === activeCategory)} activeCategory={activeCategory} searchQuery={searchQuery} onSearchChange={setSearchQuery} onCategorySelect={setActiveCategory} onItemSelect={handleItemSelect} />;
        if (appTheme.template === 'modern') return <ModernMenuView categories={categories} filteredItems={menuItems.filter(i => activeCategory === 'all' || i.cat_name === activeCategory)} activeCategory={activeCategory} searchQuery={searchQuery} onSearchChange={setSearchQuery} onCategorySelect={setActiveCategory} onItemSelect={handleItemSelect} />;
        return <MenuView popularItems={menuItems.filter(i => i.is_popular)} categories={categories} filteredItems={menuItems.filter(i => activeCategory === 'all' || i.cat_name === activeCategory)} activeCategory={activeCategory} searchQuery={searchQuery} onSearchChange={setSearchQuery} onCategorySelect={setActiveCategory} onItemSelect={handleItemSelect} />;
      case 'cart': return <CartView cart={cart} onUpdateQuantity={(idx, d) => setCart(p => p.map((it, i) => i === idx ? {...it, quantity: Math.max(1, it.quantity + d)} : it))} onRemove={(idx) => setCart(p => p.filter((_, i) => i !== idx))} onCheckout={() => activeSession ? finalizeOrder() : navigateTo('qr-verify')} onGoBack={() => navigateTo('menu')} />;
      case 'qr-verify': return <QRVerifyView initialToken={initialTokenFromUrl} onVerify={handleVerificationSuccess} onCancel={() => navigateTo('menu')} />;
      case 'orders': return <OrdersView restaurantId={activeSession?.restaurant_id} tableNumber={activeSession?.label} onIdentifyTable={() => navigateTo('qr-verify')} onPayNow={() => {}} onGoToMenu={() => navigateTo('menu')} />;
      case 'about': return <AboutView />;
      case 'privacy': return <LegalView title="Privacy Policy" />;
      case 'terms': return <LegalView title="Terms and Agreement" />;
      case 'feedback-data': return <FeedbackDataView feedbacks={feedbacks} onAddFeedback={() => navigateTo('feedback')} appTheme={appTheme} />;
      case 'feedback': return <FeedbackForm restaurantId={activeSession?.restaurant_id} onSubmit={() => { navigateTo('feedback-data'); }} onCancel={() => navigateTo('menu')} appTheme={appTheme} />;
      case 'super-admin': return <SuperAdminView onBack={() => navigateTo('menu')} />;
      case 'test-supabase': return <TestSupabaseView />;
      case 'accept-invite': return <AcceptInviteView onComplete={() => navigateTo('admin')} onCancel={() => navigateTo('landing')} />;
      case 'ai-assistant': return <AIAssistantView menuItems={menuItems} onItemSelect={handleItemSelect} onGoBack={() => navigateTo('menu')} />;
      case 'admin-faq': return <MenuFAQ onBack={() => navigateTo('admin')} />;
      case 'careers': return <CareersView onBack={() => navigateTo('landing')} onAffiliateAuth={() => navigateTo('affiliate-auth')} />;
      case 'affiliate-auth': return <AffiliateAuth onBack={() => navigateTo('landing')} onLogin={() => navigateTo('affiliate-dashboard')} />;
      case 'affiliate-dashboard': return <AffiliateDashboard onLogout={() => navigateTo('landing')} />;
      case 'admin': return <AdminView menuItems={menuItems} setMenuItems={setMenuItems} categories={categories} setCategories={setCategories} feedbacks={feedbacks} setFeedbacks={setFeedbacks} salesHistory={[]} setSalesHistory={() => {}} adminCreds={{}} setAdminCreds={() => {}} onExit={() => navigateTo('landing')} onLogoUpdate={() => {}} onThemeUpdate={applyTheme} appTheme={appTheme} onOpenFAQ={() => navigateTo('admin-faq')} />;
      default: return null;
    }
  };

  if (isBooting) return <div className="flex flex-col items-center justify-center min-h-screen bg-white"><div className="w-16 h-16 border-4 border-slate-50 border-t-indigo-600 rounded-full animate-spin"></div></div>;

  return (
    <div className={`min-h-screen relative overflow-x-hidden ${currentView === 'landing' ? '' : ['admin', 'super-admin', 'test-supabase', 'create-menu', 'admin-faq', 'demo', 'articles', 'article', 'verification-barcode', 'careers', 'affiliate-auth', 'affiliate-dashboard'].includes(currentView) ? 'w-full bg-[#F2F2F7]' : 'max-w-xl mx-auto shadow-2xl bg-white'}`}>
      <style>{`.menu-theme-container { --brand-primary: ${appTheme.primary_color}; --brand-secondary: ${appTheme.secondary_color}; font-family: '${appTheme.font_family}', sans-serif !important; }`}</style>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={navigateTo} currentView={currentView} />
      <div className={!['admin', 'super-admin', 'test-supabase', 'create-menu', 'admin-faq', 'demo', 'articles', 'article', 'verification-barcode', 'careers', 'affiliate-auth', 'affiliate-dashboard'].includes(currentView) ? `menu-theme-container min-h-screen flex flex-col ${appTheme.template === 'premium' || appTheme.template === 'modern' ? 'bg-[#F8F8F8]' : 'bg-[#FBFBFD]'}` : 'min-h-screen flex flex-col'}>
        {appTheme.template === 'modern' ? (
           <ModernDetailPanel item={selectedItem} isOpen={!!selectedItem} isProcessing={isDispatching} onClose={() => setSelectedItem(null)} onAddToCart={(item) => setCart(p => [...p, item])} onSendToKitchen={(item) => activeSession ? finalizeOrder(activeSession, [item]) : (setPendingSingleItem(item), navigateTo('qr-verify'))} />
        ) : appTheme.template === 'premium' ? (
          <PremiumDetailPanel item={selectedItem} isOpen={!!selectedItem} isProcessing={isDispatching} onClose={() => setSelectedItem(null)} onAddToCart={(item) => setCart(p => [...p, item])} onSendToKitchen={(item) => activeSession ? finalizeOrder(activeSession, [item]) : (setPendingSingleItem(item), navigateTo('qr-verify'))} />
        ) : (
          <DetailPanel item={selectedItem} isOpen={!!selectedItem} isProcessing={isDispatching} onClose={() => setSelectedItem(null)} onAddToCart={(item) => setCart(p => [...p, item])} onSendToKitchen={(item) => activeSession ? finalizeOrder(activeSession, [item]) : (setPendingSingleItem(item), navigateTo('qr-verify'))} />
        )}
        <VariationDrawer item={activeVariantSource} variants={menuItems.filter(i => i.parent_id === activeVariantSource?.id)} isOpen={!!activeVariantSource} onClose={() => setActiveVariantSource(null)} onSelect={(v) => { setActiveVariantSource(null); setSelectedItem(v); }} />
        <SupportHub isOpen={isSupportHubOpen} onClose={() => setIsSupportHubOpen(false)} menuItems={menuItems} restaurantId={activeSession?.restaurant_id || ''} tableNumber={activeSession?.label || 'Walk-in'} sessionId={activeSession?.id} qrToken={activeSession?.qr_token} />
        {!['admin', 'landing', 'qr-verify', 'super-admin', 'test-supabase', 'accept-invite', 'ai-assistant', 'create-menu', 'admin-faq', 'demo', 'articles', 'article', 'verification-barcode', 'careers', 'affiliate-auth', 'affiliate-dashboard'].includes(currentView) && (
          <Navbar logo={null} onMenuClick={() => setIsSidebarOpen(true)} onCartClick={() => navigateTo('cart')} onLogoClick={() => navigateTo('menu')} onImport={() => {}} currentView={currentView} cartCount={cart.length} />
        )}
        <main className={`animate-fade-in flex-1 ${!['admin', 'landing', 'qr-verify', 'super-admin', 'test-supabase', 'accept-invite', 'ai-assistant', 'create-menu', 'admin-faq', 'demo', 'articles', 'article', 'verification-barcode', 'careers', 'affiliate-auth', 'affiliate-dashboard'].includes(currentView) ? 'pb-24' : ''}`}>
          {renderView()}
        </main>
        {!['admin', 'landing', 'qr-verify', 'super-admin', 'test-supabase', 'accept-invite', 'ai-assistant', 'create-menu', 'admin-faq', 'demo', 'articles', 'article', 'verification-barcode', 'careers', 'affiliate-auth', 'affiliate-dashboard'].includes(currentView) && (
          <BottomNav currentView={currentView} onNavigate={navigateTo} onSupportClick={() => setIsSupportHubOpen(true)} isSupportOpen={isSupportHubOpen} cartCount={cart.length} />
        )}
      </div>
      {lastError && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md font-jakarta">
          <div className="bg-white w-full max-sm rounded-[3rem] p-10 shadow-2xl space-y-8 animate-fade-in border border-rose-100 text-center">
             <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto text-3xl shadow-inner"><i className="fa-solid fa-triangle-exclamation"></i></div>
             <div className="space-y-4">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Dispatch Failure</h3>
                <p className="text-slate-500 text-xs font-bold leading-relaxed">{lastError.msg}</p>
             </div>
             <button onClick={() => setLastError(null)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}