import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, CartItem, Category, ViewState, Feedback } from './types';
import * as MenuService from './services/menuService';
import { DemoOrderModal } from './components/DemoOrderModal';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DetailPanel from './components/DetailPanel';
import PremiumDetailPanel from './components/PremiumDetailPanel';
import ModernDetailPanel from './components/ModernDetailPanel';
import SupportHub from './components/SupportHub';
import BottomNav from './components/BottomNav';
import VariationDrawer from './components/VariationDrawer';
import FeedbackForm from './components/FeedbackForm';
import WelcomeModal from './components/WelcomeModal';

import MenuView from './views/MenuView';
import PremiumMenuView from './views/PremiumMenuView';
import ModernMenuView from './views/ModernMenuView';
import CartView from './views/CartView';
import OrdersView from './views/orders/OrdersView';
import QRVerifyView from './views/QRVerifyView';
import AdminView from './views/AdminView';
import LandingView from './views/LandingView';
import AboutView from './views/AboutView';
import FeedbackDataView from './views/FeedbackDataView';
import SuperAdminView from './views/SuperAdminView';
import TestSupabaseView from './views/TestSupabaseView';
import { DebugAccountView } from './views/DebugAccountView';
import AcceptInviteView from './views/AcceptInviteView';
import AIAssistantView from './views/AIAssistantView';
import DemoHubView from './views/DemoHubView';
import MenuFAQ from './views/admin/menu/MenuFAQ';
import LegalView from './views/LegalView';
import ArticlesView from './views/ArticlesView';
import ArticleViewer from './views/ArticleViewer';
import CareersView from './views/CareersView';
import AffiliateAuth from './views/AffiliateAuth';
import AffiliateDashboard from './views/AffiliateDashboard';

import { defaultMenu } from './src/data/defaultMenu';

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
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>(defaultMenu.items as MenuItem[]);
  const [categories, setCategories] = useState<Category[]>(defaultMenu.categories as Category[]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isBooting, setIsBooting] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [lastError, setLastError] = useState<{msg: string, log: string} | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [pendingSingleItem, setPendingSingleItem] = useState<CartItem | null>(null);
  const [initialTokenFromUrl, setInitialTokenFromUrl] = useState<string | undefined>(undefined);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

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
    // Mark as verified if it was required
    const verifiedSession = { ...session, is_verified: true };
    setActiveSession(verifiedSession);
    localStorage.setItem('foodie_active_session', JSON.stringify(verifiedSession));
    if (session.theme) applyTheme(session.theme);
    
    await syncDatabaseData(session.restaurant_id);
    
    if (pendingSingleItem) {
        finalizeOrder(verifiedSession, [pendingSingleItem]);
        setPendingSingleItem(null);
    } else if (cart.length > 0) {
        finalizeOrder(verifiedSession, cart);
        setCart([]);
    } else {
        navigateTo('menu');
    }
  };

  const checkSessionValid = async () => {
    const saved = localStorage.getItem('foodie_active_session');
    const merchantSaved = localStorage.getItem('foodie_supabase_session');
    
    if (saved) {
      try {
          const session = JSON.parse(saved);
          const status = await MenuService.getSessionStatus(session.id);
          if (status && status.status !== 'ended') {
              setActiveSession(session);
              if (session.theme) applyTheme(session.theme);
              await syncDatabaseData(session.restaurant_id);
              return true;
          } else {
              localStorage.removeItem('foodie_active_session');
          }
      } catch (e) {}
    }

    if (merchantSaved) {
      try {
        const session = JSON.parse(merchantSaved);
        if (session.restaurant) {
          if (session.restaurant.theme) applyTheme(session.restaurant.theme);
          await syncDatabaseData(session.restaurant.id);
          return true;
        }
      } catch (e) {}
    }

    return false;
  };

  const syncStateWithURL = async () => {
    const path = window.location.pathname.replace(/^\//, '');
    const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle Supabase Auth Redirect
    if (hash.startsWith('access_token') || hash.includes('access_token=') || urlParams.get('code')) {
        setCurrentView('admin');
        return;
    }

    const hashParts = hash.split('/');
    const route = (hashParts[0] || 'landing') as ViewState;
    if (route === 'article' && hashParts[1]) setSelectedArticleId(hashParts[1]);
    
    // Check for token in URL parameters or path
    const token = urlParams.get('token') || (path.length === 6 ? path : null);
    const restaurantId = urlParams.get('restaurant');
    
    const hasSession = !!localStorage.getItem('foodie_active_session');
    const storedSession = hasSession ? JSON.parse(localStorage.getItem('foodie_active_session') || '{}') : null;
    
    // If there is a token in the URL, and it doesn't match the current session, we should clear the session and start fresh.
    if (token && storedSession && storedSession.qr_token !== token) {
        localStorage.removeItem('foodie_active_session');
        setActiveSession(null);
        setCart([]);
    }

    if (token && (!hasSession || (storedSession && storedSession.qr_token !== token))) {
        try {
            const details = await MenuService.getQRCodeByCode(token);
            if (details) {
                const existingSession = await MenuService.getActiveSessionByQR(details.id);
                // If session exists and requires PIN, we don't force it immediately on load.
                // We let them browse the menu. We only enforce PIN when they try to order.
                // However, we need to store the context so we know which table they are at.
                
                const session = {
                    ...(existingSession || { id: `scan-${Date.now()}`, session_token: `scan-${Date.now()}` }),
                    restaurant_id: details.restaurant_id,
                    label: details.label,
                    restaurantName: details.restaurant_name,
                    status: 'active',
                    qr_token: details.code,
                    theme: details.theme,
                    pin_required: existingSession?.pin_required // Store this flag
                };

                // If PIN is required, we mark the session as 'pending_verification' locally?
                // Or we just set it active but know that 'pin_required' means we need to verify before checkout.
                // The prompt says "Show the pin required modal only when ordering".
                
                // So we set the session as active, but maybe add a flag 'is_verified: false' if pin is required?
                // But existing logic in finalizeOrder checks for session validity.
                
                // Let's set it as active session, but if pin_required is true, we might need to handle it later.
                // Actually, if we set it as active session, the UI assumes they are logged in.
                // We need to ensure that when they click "Add to Order" or "Checkout", we check if verification is needed.
                
                // For now, let's just allow them to enter.
                setActiveSession(session);
                localStorage.setItem('foodie_active_session', JSON.stringify(session));
                if (session.theme) applyTheme(session.theme);
                await syncDatabaseData(session.restaurant_id);
                setShowWelcomeModal(true);
                setCurrentView('menu');
                
                // PRESERVE TOKEN IN URL: Do not replace state with '/'
                // We want the URL to remain https://mymenu.asia/TOKEN
                // But our routing uses hash based routing for views (e.g. #/menu).
                // The token is in the path or query param.
                // If the user provided a path like /FC9568, we should keep it?
                // The browser URL will be https://mymenu.asia/FC9568#/menu
                
                // If we use window.history.replaceState(null, '', '/'); it clears it.
                // So we should REMOVE that line.
                
                return;
            }
        } catch (e) {
            console.error("QR Auto-resolve failed", e);
        }
        
        // If resolution fails, we might still want to keep the token in URL for retry?
        // Or redirect to verify view.
        setInitialTokenFromUrl(token);
        setCurrentView('qr-verify');
        // window.history.replaceState(null, '', '/'); // Don't clear URL
        return;
    }

    const knownRoutes = ['landing', 'menu', 'cart', 'qr-verify', 'orders', 'about', 'privacy', 'terms', 'feedback-data', 'feedback', 'super-admin', 'test-supabase', 'accept-invite', 'ai-assistant', 'admin-faq', 'careers', 'affiliate-auth', 'affiliate-dashboard', 'admin', 'demo', 'articles', 'article'];
    
    if (path && !knownRoutes.includes(path) && path.length > 0 && !token && !restaurantId && (!hasSession || (storedSession && storedSession.label !== 'Walk-in'))) {
        if (storedSession && storedSession.label !== 'Walk-in') {
            localStorage.removeItem('foodie_active_session');
            setActiveSession(null);
            setCart([]);
        }
        try {
             const restaurant = await MenuService.getRestaurantBySlug(path);
             if (restaurant) {
                 const dummySession = {
                    id: `walkin-${Date.now()}`,
                    restaurant_id: restaurant.id,
                    label: 'Walk-in',
                    restaurantName: restaurant.name,
                    status: 'active',
                    qr_token: '',
                    session_token: `walkin-${Date.now()}`
                };
                setActiveSession(dummySession);
                localStorage.setItem('foodie_active_session', JSON.stringify(dummySession));
                if (restaurant.theme) applyTheme(restaurant.theme);
                await syncDatabaseData(restaurant.id);
                setShowWelcomeModal(true);
                setCurrentView('menu');
                window.history.replaceState(null, '', '/');
                return;
             }
        } catch (e) {
            console.error("Slug resolution failed", e);
        }
    }

    if (restaurantId && (!hasSession || (storedSession && storedSession.restaurant_id !== restaurantId))) {
        if (storedSession && storedSession.restaurant_id !== restaurantId) {
            localStorage.removeItem('foodie_active_session');
            setActiveSession(null);
            setCart([]);
        }
        const dummySession = {
            id: `walkin-${Date.now()}`,
            restaurant_id: restaurantId,
            label: 'Walk-in',
            restaurantName: 'Our Restaurant',
            status: 'active',
            qr_token: '',
            session_token: `walkin-${Date.now()}`
        };
        setActiveSession(dummySession);
        localStorage.setItem('foodie_active_session', JSON.stringify(dummySession));
        await syncDatabaseData(restaurantId);
        setShowWelcomeModal(true);
        setCurrentView('menu');
        window.history.replaceState(null, '', '/');
        return;
    }

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
    
    // Clear demo session if exiting to landing
    if (view === 'landing' && activeSession?.id?.startsWith('demo-')) {
      setActiveSession(null);
      localStorage.removeItem('foodie_supabase_session');
    }

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
    
    // Check for demo session
    if (session.id?.startsWith('demo-')) {
        setShowDemoModal(true);
        return;
    }

    // Check if PIN verification is required but not yet completed
    // We assume if 'pin_required' is true in session, we need to verify.
    // But how do we know if it's already verified?
    // The session object from localStorage might have 'pin_required: true'.
    // If we successfully verified, we should have updated the session object to remove that flag or add 'verified: true'.
    
    // Let's assume if 'pin_required' is true, we need to re-verify or check.
    // But wait, if they scanned and entered, we set 'pin_required' from the DB.
    // If they haven't entered the PIN yet, we should prompt.
    
    if (session.pin_required && !session.is_verified) {
        // Redirect to QR Verify (which handles PIN entry)
        // We need to pass the current cart/item context so we can return here.
        // setPendingSingleItem might already be set if it's a single item.
        // If it's a cart checkout, we just navigate.
        setInitialTokenFromUrl(session.qr_token); // Ensure the token is passed
        navigateTo('qr-verify');
        return;
    }

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
        navigateTo('orders');
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

  const handleDemoSelect = async (demoId: string) => {
    const details = await MenuService.getQRCodeByCode(demoId);
    const name = details?.restaurant_name || 'Demo Restaurant';
    const table = details?.label || 'Demo Table';
    const restaurantId = details?.restaurant_id || demoId;

    const dummySession = {
        id: `demo-${demoId}`,
        restaurant_id: restaurantId,
        label: table,
        restaurantName: name,
        status: 'active',
        qr_token: demoId,
        session_token: 'demo-session'
    };
    setActiveSession(dummySession);
    
    // Set admin demo session
    localStorage.setItem('foodie_supabase_session', JSON.stringify({
      user: { email: 'demo1@mymenu', id: 'demo-user' },
      restaurant: { id: restaurantId, name: name }
    }));
    
    // Non-blocking sync for instant demo load
    syncDatabaseData(restaurantId).catch(console.error);
    
    setShowWelcomeModal(true);
    navigateTo('menu');
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing': return <LandingView onStart={() => navigateTo('demo')} onCreateMenu={() => navigateTo('admin')} onImportMenu={() => {}} onMenuClick={() => setIsSidebarOpen(true)} onAffiliateAuth={() => navigateTo('affiliate-auth')} onAdminAuth={() => navigateTo('admin')} />;
      case 'demo': return <DemoHubView onBack={() => navigateTo('landing')} onSelectDemo={handleDemoSelect} />;
      case 'articles': return <ArticlesView onBack={() => navigateTo('landing')} />;
      case 'article': return <ArticleViewer id={selectedArticleId} onBack={() => navigateTo('articles')} />;
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
      case 'test-supabase': return <TestSupabaseView onLoginSuccess={() => navigateTo('debug-account')} />;
      case 'debug-account': return <DebugAccountView onContinue={() => navigateTo('admin')} />;
      case 'accept-invite': return <AcceptInviteView onComplete={() => navigateTo('admin')} onCancel={() => navigateTo('landing')} />;
      case 'ai-assistant': return <AIAssistantView menuItems={menuItems} onItemSelect={handleItemSelect} onGoBack={() => navigateTo('menu')} />;
      case 'admin-faq': return <MenuFAQ onBack={() => navigateTo('admin')} />;
      case 'careers': return <CareersView onBack={() => navigateTo('landing')} onAffiliateAuth={() => navigateTo('affiliate-auth')} />;
      case 'affiliate-auth': return <AffiliateAuth onBack={() => navigateTo('landing')} onLogin={() => navigateTo('affiliate-dashboard')} />;
      case 'affiliate-dashboard': return <AffiliateDashboard onLogout={() => navigateTo('landing')} />;
      case 'admin': return <AdminView menuItems={menuItems} setMenuItems={setMenuItems} categories={categories} setCategories={setCategories} feedbacks={feedbacks} setFeedbacks={setFeedbacks} salesHistory={[]} setSalesHistory={() => {}} adminCreds={{}} setAdminCreds={() => {}} onExit={() => navigateTo('landing')} onLogoUpdate={() => {}} onThemeUpdate={applyTheme} appTheme={appTheme} onOpenFAQ={() => navigateTo('admin-faq')} onBackToMenu={() => navigateTo('landing')} onNavigateToCreateMenu={() => { setActiveSession(null); navigateTo('admin'); }} isDemo={activeSession?.id?.startsWith('demo-')} />;
      default: return null;
    }
  };

  if (isBooting) return <div className="flex flex-col items-center justify-center min-h-screen bg-white"><div className="w-16 h-16 border-4 border-slate-50 border-t-indigo-600 rounded-full animate-spin"></div></div>;

  return (
    <div className={`min-h-screen relative overflow-x-hidden ${currentView === 'landing' ? '' : ['admin', 'super-admin', 'test-supabase', 'admin-faq', 'demo', 'articles', 'article', 'verification-barcode', 'careers', 'affiliate-auth', 'affiliate-dashboard'].includes(currentView) ? 'w-full bg-[#F2F2F7]' : 'md:max-w-none md:mx-0 md:shadow-none max-w-xl mx-auto shadow-2xl bg-white'}`}>
      <style>{`.menu-theme-container { --brand-primary: ${appTheme.primary_color}; --brand-secondary: ${appTheme.secondary_color}; font-family: '${appTheme.font_family}', sans-serif !important; }`}</style>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={navigateTo} currentView={currentView} isDemo={activeSession?.id?.startsWith('demo-')} />
      <div className={!['admin', 'super-admin', 'test-supabase', 'admin-faq', 'demo', 'articles', 'article', 'verification-barcode', 'careers', 'affiliate-auth', 'affiliate-dashboard'].includes(currentView) ? `menu-theme-container min-h-screen flex flex-col bg-[#F8FAFC] relative overflow-hidden` : 'min-h-screen flex flex-col'}>
        {!['admin', 'super-admin', 'test-supabase', 'admin-faq', 'demo', 'articles', 'article', 'verification-barcode', 'careers', 'affiliate-auth', 'affiliate-dashboard'].includes(currentView) && (
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            
            {/* Top Middle - Right - Blue - Hidden on mobile */}
            <div className="hidden md:block absolute top-[25%] right-[-10%] w-[300px] h-[300px] bg-blue-200/20 rounded-full blur-2xl"></div>
            
            {/* Middle - Left - Orange - Hidden on mobile */}
            <div className="hidden md:block absolute top-[50%] left-[-5%] w-[300px] h-[300px] bg-orange-200/20 rounded-full blur-2xl"></div>
            
            {/* Middle Bottom - Right - Blue - Hidden on mobile */}
            <div className="hidden md:block absolute top-[75%] right-[-5%] w-[300px] h-[300px] bg-blue-200/20 rounded-full blur-2xl"></div>
            
            {/* Bottom - Right - Blue */}
            <div className="absolute bottom-[-10%] right-[-20%] w-[500px] h-[500px] md:w-[700px] md:h-[700px] bg-blue-200/20 rounded-full blur-2xl"></div>
          </div>
        )}
        {appTheme.template === 'modern' ? (
           <ModernDetailPanel item={selectedItem} isOpen={!!selectedItem} isProcessing={isDispatching} onClose={() => setSelectedItem(null)} onAddToCart={(item) => setCart(p => [...p, item])} onSendToKitchen={(item) => activeSession ? finalizeOrder(activeSession, [item]) : (setPendingSingleItem(item), navigateTo('qr-verify'))} />
        ) : appTheme.template === 'premium' ? (
          <PremiumDetailPanel item={selectedItem} isOpen={!!selectedItem} isProcessing={isDispatching} onClose={() => setSelectedItem(null)} onAddToCart={(item) => setCart(p => [...p, item])} onSendToKitchen={(item) => activeSession ? finalizeOrder(activeSession, [item]) : (setPendingSingleItem(item), navigateTo('qr-verify'))} />
        ) : (
          <DetailPanel item={selectedItem} isOpen={!!selectedItem} isProcessing={isDispatching} onClose={() => setSelectedItem(null)} onAddToCart={(item) => setCart(p => [...p, item])} onSendToKitchen={(item) => activeSession ? finalizeOrder(activeSession, [item]) : (setPendingSingleItem(item), navigateTo('qr-verify'))} />
        )}
        <VariationDrawer item={activeVariantSource} variants={menuItems.filter(i => i.parent_id === activeVariantSource?.id)} isOpen={!!activeVariantSource} onClose={() => setActiveVariantSource(null)} onSelect={(v) => { setActiveVariantSource(null); setSelectedItem(v); }} />
        <SupportHub isOpen={isSupportHubOpen} onClose={() => setIsSupportHubOpen(false)} menuItems={menuItems} restaurantId={activeSession?.restaurant_id || ''} tableNumber={activeSession?.label || 'Walk-in'} sessionId={activeSession?.id} qrToken={activeSession?.qr_token} onScanQR={() => { setIsSupportHubOpen(false); navigateTo('qr-verify'); }} onCreateMenu={() => { setIsSupportHubOpen(false); setActiveSession(null); navigateTo('admin'); }} />
        {!['admin', 'landing', 'qr-verify', 'super-admin', 'test-supabase', 'accept-invite', 'ai-assistant', 'admin-faq', 'demo', 'articles', 'article', 'careers', 'affiliate-auth', 'affiliate-dashboard'].includes(currentView) && (
          <Navbar logo={appTheme.logo_url || null} onMenuClick={() => setIsSidebarOpen(true)} onCartClick={() => navigateTo('cart')} onLogoClick={() => navigateTo('menu')} onImport={() => {}} currentView={currentView} cartCount={cart.length} />
        )}
        <main className={`animate-fade-in flex-1 ${!['admin', 'landing', 'qr-verify', 'super-admin', 'test-supabase', 'accept-invite', 'ai-assistant', 'admin-faq', 'demo', 'articles', 'article', 'careers', 'affiliate-auth', 'affiliate-dashboard'].includes(currentView) ? 'pb-24' : ''}`}>
          {renderView()}
        </main>
        {!['admin', 'landing', 'qr-verify', 'super-admin', 'test-supabase', 'accept-invite', 'ai-assistant', 'admin-faq', 'demo', 'articles', 'article', 'careers', 'affiliate-auth', 'affiliate-dashboard'].includes(currentView) && (
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
      
      {showDemoModal && (
        <DemoOrderModal 
          title="Demo Ordering"
          message="This is a demo environment. Orders are not sent to a real kitchen. To start accepting real orders, please create your restaurant account."
          onClose={() => setShowDemoModal(false)}
          onUnderstand={() => setShowDemoModal(false)}
          onCreateMenu={() => { setShowDemoModal(false); setActiveSession(null); navigateTo('admin'); }}
        />
      )}
      
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={() => setShowWelcomeModal(false)} 
        restaurantName={activeSession?.restaurantName || 'Our Restaurant'} 
        tableName={activeSession?.label || 'Table'} 
      />
    </div>
  );
}