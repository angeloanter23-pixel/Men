
import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, CartItem, Category, Feedback, SalesRecord, ViewState } from './types';
import * as MenuService from './services/menuService';
import { menuItems as mockupItems, categories as mockupCategories } from './data';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DetailPanel from './components/DetailPanel';
import FeedbackForm from './components/FeedbackForm';
import SupportHub from './components/SupportHub';

import MenuView from './views/MenuView';
import CartView from './views/CartView';
import OrdersView from './views/OrdersView';
import QRVerifyView from './views/QRVerifyView';
import GroupView from './views/GroupView';
import AdminView from './views/AdminView';
import FeedbackDataView from './views/FeedbackDataView';
import LandingView from './views/LandingView';
import PaymentView from './views/PaymentView';
import CreateMenuView from './views/CreateMenuView';
import SuperAdminView from './views/SuperAdminView';
import AcceptInviteView from './views/AcceptInviteView';

export interface OrderInstance extends CartItem {
  orderId: string;
  status: 'Pending' | 'Cooking' | 'Ready' | 'Served';
  timestamp: Date;
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSupportHubOpen, setIsSupportHubOpen] = useState(false);
  
  const hasMerchantSession = !!localStorage.getItem('foodie_supabase_session');

  const [menuItems, setMenuItems] = useState<MenuItem[]>(hasMerchantSession ? [] : mockupItems);
  const [categories, setCategories] = useState<Category[]>(hasMerchantSession ? [] : mockupCategories);
  
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [salesHistory, setSalesHistory] = useState<SalesRecord[]>([]);
  const [adminCreds, setAdminCreds] = useState({ email: 'admin@foodie.com', password: 'password123' });
  const [logo, setLogo] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<OrderInstance[]>([]);
  const [pendingSingleItem, setPendingSingleItem] = useState<CartItem | null>(null);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [qrDetails, setQrDetails] = useState<{id: string, restaurant_id: string, label: string, token: string, restaurantName: string, theme?: any} | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const [appTheme, setAppTheme] = useState<any>({
    primary_color: '#FF6B00',
    secondary_color: '#FFF3E0',
    font_family: 'Plus Jakarta Sans',
    logo_url: ''
  });

  const applyTheme = (themeData: any) => {
    if (!themeData || typeof themeData !== 'object') return;
    const merged = { ...appTheme, ...themeData };
    setAppTheme(merged);
    if (merged.logo_url) setLogo(merged.logo_url);
    document.documentElement.style.setProperty('--brand-primary', merged.primary_color);
    document.documentElement.style.setProperty('--brand-secondary', merged.secondary_color);
    document.documentElement.style.setProperty('--brand-font', merged.font_family);
  };

  const handleQRDetected = async (token: string) => {
    try {
        const details = await MenuService.getQRCodeByCode(token);
        if (details) {
          setActiveTable(details.label);
          const qrSession = {
            id: details.id,
            restaurant_id: details.restaurant_id,
            label: details.label,
            token: details.code,
            restaurantName: details.restaurant_name || 'Merchant',
            theme: details.theme
          };
          setQrDetails(qrSession);
          localStorage.setItem('foodie_active_qr', JSON.stringify(qrSession));
          if (details.theme) applyTheme(details.theme);
          
          const cloudMenu = await MenuService.getMenuByRestaurantId(details.restaurant_id);
          setMenuItems(cloudMenu.items || []);
          setCategories(cloudMenu.categories || []);
          
          // Ensure active session in DB
          await MenuService.ensureActiveSession(details.id);
          
          return true;
        }
    } catch (err) {
        console.error("Token verification error:", err);
    }
    return false;
  };

  const syncStateWithURL = async () => {
    const path = window.location.pathname;
    if (path !== '/' && path.length > 1) {
      const token = path.substring(1); 
      const reserved = ['menu', 'cart', 'orders', 'favorites', 'feedback', 'admin', 'super-admin', 'landing', 'create-menu', 'test-supabase', 'accept-invite'];
      if (!reserved.includes(token.toLowerCase())) {
        const success = await handleQRDetected(token);
        if (success) {
            setShowWelcomeModal(true);
            setCurrentView('menu');
            window.history.replaceState({}, '', '/#/menu');
            return;
        }
      }
    }
    
    const hashPart = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    const parts = hashPart.split('/').filter(p => p !== '');
    if (parts.length === 0 || parts[0] === 'menu') {
      setCurrentView('menu');
      setSelectedItem(null);
      return;
    }
    const route = parts[0].toLowerCase();
    const viewMap: Record<string, ViewState> = {
      'landing': 'landing', 'menu': 'menu', 'cart': 'cart', 'orders': 'orders',
      'favorites': 'favorites', 'feedback': 'feedback', 'feedback-data': 'feedback-data',
      'privacy': 'privacy', 'terms': 'terms', 'admin': 'admin', 'create-menu': 'create-menu',
      'payment': 'payment', 'qr-verify': 'qr-verify', 'group': 'group',
      'super-admin': 'super-admin', 'accept-invite': 'accept-invite'
    };
    if (viewMap[route]) setCurrentView(viewMap[route]);
    else setCurrentView(activeTable ? 'menu' : 'landing');
  };

  useEffect(() => {
    window.addEventListener('hashchange', syncStateWithURL);
    const initializeData = async () => {
      setIsBooting(true);
      try {
        const savedQR = localStorage.getItem('foodie_active_qr');
        const sessionRaw = localStorage.getItem('foodie_supabase_session');
        const session = sessionRaw ? JSON.parse(sessionRaw) : null;
        const merchantRid = session?.restaurant?.id;
        
        if (savedQR) {
          const parsed = JSON.parse(savedQR);
          if (parsed.restaurant_id && parsed.restaurant_id !== "undefined") {
            setQrDetails(parsed);
            setActiveTable(parsed.label);
            if (parsed.theme) applyTheme(parsed.theme);
            const res = await MenuService.getMenuByRestaurantId(parsed.restaurant_id);
            setMenuItems(res.items || []); 
            setCategories(res.categories || []); 
          }
        } else if (merchantRid && merchantRid !== "undefined") {
          const res = await MenuService.getMenuByRestaurantId(merchantRid);
          setMenuItems(res.items || []); 
          setCategories(res.categories || []); 
          if (session?.restaurant?.theme) applyTheme(session.restaurant.theme);
        }
      } catch (err) {
        console.error("Sync failed:", err);
      } finally {
        setIsBooting(false);
      }
    };
    initializeData();
    syncStateWithURL();
    return () => window.removeEventListener('hashchange', syncStateWithURL);
  }, []);

  const navigateTo = (view: ViewState) => {
    setCurrentView(view);
    setSelectedItem(null);
    window.location.hash = `/${view}`;
  };

  const handleItemSelect = (item: MenuItem | null) => {
    setSelectedItem(item);
  };

  const finalizeOrder = async (detectedToken?: string) => {
    // If a token was provided during verify, sync state first
    if (detectedToken) {
        await handleQRDetected(detectedToken);
    }

    const itemsToProcess = pendingSingleItem ? [pendingSingleItem] : cart;
    if (itemsToProcess.length === 0) { navigateTo('menu'); return; }
    
    // We get rid/token after potentially updating state above
    const sessionRaw = localStorage.getItem('foodie_supabase_session');
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    const currentRID = qrDetails?.restaurant_id || session?.restaurant?.id;
    const currentToken = qrDetails?.token || 'Demo';
    
    if (!currentRID) {
      if (pendingSingleItem) setPendingSingleItem(null);
      else setCart([]);
      navigateTo('orders');
      setSelectedItem(null);
      return;
    }

    try {
      // Ensure active table session is persistent
      if (qrDetails?.id) {
        await MenuService.ensureActiveSession(qrDetails.id);
      }

      const dbOrders = itemsToProcess.map(item => ({
        restaurant_id: currentRID,
        item_id: String(item.id),
        item_name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        amount: Number(item.price * item.quantity),
        table_number: activeTable || 'Walk-in',
        customer_name: item.orderTo || 'Guest',
        order_status: 'Pending',
        payment_status: 'Unpaid',
        instructions: item.customInstructions || '',
        qr_code_token: currentToken
      }));

      await MenuService.insertOrders(dbOrders);
      if (pendingSingleItem) setPendingSingleItem(null);
      else setCart([]);
      navigateTo('orders');
      setSelectedItem(null);
    } catch (err: any) {
      console.error("Order Failure:", err);
      alert(`Order Failed: ${err.message}`);
    }
  };

  const handleSendToKitchenDirect = (item: CartItem) => {
    setPendingSingleItem({ ...item });
    navigateTo('qr-verify');
  };

  const handleFeedbackSubmit = (feedback: Feedback) => {
    setFeedbacks(prev => [feedback, ...prev]);
    navigateTo('feedback-data');
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing': 
        return (
          <LandingView 
            onStart={() => navigateTo('menu')} 
            onCreateMenu={() => navigateTo('create-menu')} 
            onImportMenu={(c) => { 
              if (c.menu?.items) setMenuItems(c.menu.items);
              if (c.menu?.categories) setCategories(c.menu.categories);
              if (c.business?.logo) setLogo(c.business.logo);
              navigateTo('menu'); 
            }} 
          />
        );
      case 'create-menu': return <CreateMenuView onCancel={() => navigateTo('landing')} onComplete={(config) => { navigateTo('admin'); }} />;
      case 'menu': return <MenuView popularItems={menuItems.filter(i => i.is_popular)} categories={categories} filteredItems={menuItems.filter(i => activeCategory === 'all' || i.cat_name === activeCategory)} activeCategory={activeCategory} searchQuery={searchQuery} onSearchChange={setSearchQuery} onCategorySelect={setActiveCategory} onItemSelect={handleItemSelect} />;
      case 'cart': return <CartView cart={cart} onUpdateQuantity={(idx, d) => setCart(p => p.map((it, i) => i === idx ? {...it, quantity: Math.max(1, it.quantity + d)} : it))} onRemove={(idx) => setCart(p => p.filter((_, i) => i !== idx))} onCheckout={() => navigateTo('qr-verify')} onGoBack={() => navigateTo('menu')} />;
      case 'payment': return <PaymentView total={0} onClose={() => navigateTo('orders')} onSuccess={() => { alert("Payment Successful!"); navigateTo('feedback'); }} />;
      case 'qr-verify': return <QRVerifyView onVerify={finalizeOrder} onCancel={() => { setPendingSingleItem(null); navigateTo(cart.length > 0 ? 'cart' : 'menu'); }} />;
      case 'orders': return <OrdersView restaurantId={qrDetails?.restaurant_id} tableNumber={activeTable} onIdentifyTable={() => navigateTo('qr-verify')} onPayNow={() => navigateTo('payment')} onGoToMenu={() => navigateTo('menu')} />;
      case 'feedback': return <FeedbackForm onSubmit={handleFeedbackSubmit} onCancel={() => navigateTo('menu')} />;
      case 'feedback-data': return <FeedbackDataView feedbacks={feedbacks} onAddFeedback={() => navigateTo('feedback')} />;
      case 'group': return <GroupView />;
      case 'admin': return <AdminView menuItems={menuItems} setMenuItems={setMenuItems} categories={categories} setCategories={setCategories} feedbacks={feedbacks} setFeedbacks={setFeedbacks} salesHistory={salesHistory} setSalesHistory={setSalesHistory} adminCreds={adminCreds} setAdminCreds={setAdminCreds} onExit={() => navigateTo('menu')} onLogoUpdate={setLogo} />;
      case 'super-admin': return <SuperAdminView onBack={() => navigateTo('menu')} />;
      case 'accept-invite': return <AcceptInviteView onComplete={() => navigateTo('admin')} onCancel={() => navigateTo('landing')} />;
      default: return null;
    }
  };

  if (isBooting) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-white animate-fade-in">
      <div className="w-16 h-16 border-4 border-slate-50 border-t-brand-primary rounded-full animate-spin"></div>
      <p className="font-black text-slate-400 uppercase tracking-[0.5em] text-[10px] leading-none">Starting up...</p>
    </div>
  );

  const isDesktopFullWidthView = ['landing', 'admin', 'create-menu', 'super-admin', 'menu', 'cart', 'orders', 'group', 'accept-invite'].includes(currentView);
  const showNavbar = !['admin', 'payment', 'landing', 'create-menu', 'super-admin', 'accept-invite'].includes(currentView);
  const showBottomNav = !['landing', 'admin', 'payment', 'create-menu', 'super-admin', 'accept-invite'].includes(currentView);

  return (
    <div className={`min-h-screen bg-white relative overflow-x-hidden ${isDesktopFullWidthView ? 'w-full' : 'max-w-xl mx-auto shadow-2xl pb-24'}`}>
      <style>{`
        :root {
          --brand-primary: ${appTheme.primary_color};
          --brand-secondary: ${appTheme.secondary_color};
          --brand-font: ${appTheme.font_family};
        }
        .text-brand-primary { color: var(--brand-primary); }
        .bg-brand-primary { background-color: var(--brand-primary); }
        .text-brand-secondary { color: var(--brand-secondary); }
        .bg-brand-secondary { background-color: var(--brand-secondary); }
      `}</style>

      {showWelcomeModal && qrDetails && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-3xl flex items-center justify-center p-8 animate-fade-in">
          <div className="bg-white rounded-[4rem] p-12 w-full max-sm:p-8 max-w-sm text-center shadow-2xl space-y-10">
            <div className="w-24 h-24 bg-brand-secondary text-brand-primary rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm"><i className="fa-solid fa-utensils text-4xl"></i></div>
            <div className="space-y-8">
              <div>
                <p className="text-[12px] font-black uppercase text-slate-400 tracking-[0.5em] mb-3 leading-none">Welcome</p>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Welcome to <span className="text-brand-primary">{qrDetails.restaurantName}</span></h2>
              </div>
              <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 space-y-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Table</p>
                  <p className="text-3xl font-black text-slate-800 uppercase leading-none">{qrDetails.label}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setShowWelcomeModal(false)} className="w-full bg-slate-900 text-white h-20 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-xl active:scale-95 transition-all">Start Ordering</button>
          </div>
        </div>
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={navigateTo} currentView={currentView} />
      <DetailPanel item={selectedItem} isOpen={!!selectedItem} onClose={() => handleItemSelect(null)} onAddToCart={(item) => setCart(p => [...p, item])} onSendToKitchen={handleSendToKitchenDirect} />
      
      {/* Support Hub - captures table context */}
      <SupportHub 
        isOpen={isSupportHubOpen} 
        onClose={() => setIsSupportHubOpen(false)} 
        menuItems={menuItems}
        restaurantId={qrDetails?.restaurant_id || ''}
        tableNumber={activeTable || 'Walk-in'}
      />

      {showNavbar && <Navbar logo={logo} onMenuClick={() => setIsSidebarOpen(true)} onCartClick={() => navigateTo('cart')} onLogoClick={() => navigateTo('menu')} onImport={() => {}} currentView={currentView} cartCount={cart.reduce((s, i) => s + i.quantity, 0)} />}
      
      <main className={showNavbar ? "min-h-[85vh] animate-fade-in" : ""}>{renderView()}</main>
      
      {showBottomNav && (
        <div className={`fixed bottom-0 ${isDesktopFullWidthView ? 'left-0 right-0' : 'left-1/2 -translate-x-1/2 w-full max-w-xl'} bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-around px-4 h-14 z-40 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.03)]`}>
          {[
            { v: 'menu', i: 'fa-house', l: 'Menu' }, 
            { v: 'group', i: 'fa-users', l: 'Group' }, 
            { v: 'messages', i: 'fa-comment-dots', l: 'Messages' }, 
            { v: 'orders', i: 'fa-receipt', l: 'Orders' }
          ].map(btn => {
            const isActive = currentView === btn.v;
            // Favorites is now messages view logic
            const handleClick = () => {
                if (btn.v === 'messages') {
                    setIsSupportHubOpen(true);
                } else {
                    navigateTo(btn.v as ViewState);
                }
            };
            return (
              <button 
                key={btn.v} 
                onClick={handleClick} 
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-200 ease-out transform
                  ${isActive ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-110' : 'text-slate-400 hover:text-slate-600'}
                `}
              >
                <i className={`fa-solid ${btn.i} ${isActive ? 'text-base' : 'text-sm'}`}></i>
                {isActive && (
                  <span className="text-[9px] font-black uppercase tracking-wider whitespace-nowrap">
                    {btn.l}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
