import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, CartItem, Category, Feedback, SalesRecord, ViewState } from './types';
import * as MenuService from './services/menuService';
import { menuItems as mockupItems, categories as mockupCategories } from './data';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DetailPanel from './components/DetailPanel';
import SupportHub from './components/SupportHub';
import BottomNav from './components/BottomNav';
import FeedbackForm from './components/FeedbackForm';

import MenuView from './views/MenuView';
import CartView from './views/CartView';
import OrdersView from './views/OrdersView';
import QRVerifyView from './views/QRVerifyView';
import AdminView from './views/AdminView';
import LandingView from './views/LandingView';
import GroupView from './views/GroupView';
import FeedbackDataView from './views/FeedbackDataView';
import SuperAdminView from './views/SuperAdminView';
import TestSupabaseView from './views/TestSupabaseView';
import AcceptInviteView from './views/AcceptInviteView';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSupportHubOpen, setIsSupportHubOpen] = useState(false);
  
  // Use mockup data as the base state
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockupItems);
  const [categories, setCategories] = useState<Category[]>(mockupCategories);
  const [isBooting, setIsBooting] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [pendingSingleItem, setPendingSingleItem] = useState<CartItem | null>(null);
  const [initialTokenFromUrl, setInitialTokenFromUrl] = useState<string | undefined>(undefined);

  const [appTheme, setAppTheme] = useState<any>({ primary_color: '#FF6B00', secondary_color: '#FFF3E0', font_family: 'Plus Jakarta Sans' });

  const applyTheme = (themeData: any) => {
    if (!themeData) return;
    const merged = { ...appTheme, ...themeData };
    setAppTheme(merged);
    document.documentElement.style.setProperty('--brand-primary', merged.primary_color);
    document.documentElement.style.setProperty('--brand-secondary', merged.secondary_color);
  };

  const handleVerificationSuccess = async (session: any) => {
    setActiveSession(session);
    localStorage.setItem('foodie_active_session', JSON.stringify(session));
    if (session.theme) applyTheme(session.theme);
    
    const menu = await MenuService.getMenuByRestaurantId(session.restaurant_id);
    if (menu.items && menu.items.length > 0) {
      setMenuItems(menu.items); 
      setCategories(menu.categories);
    }
    
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
        const menu = await MenuService.getMenuByRestaurantId(session.restaurant_id);
        if (menu.items && menu.items.length > 0) {
            setMenuItems(menu.items);
            setCategories(menu.categories);
        }
        return true;
    } catch (e) { return false; }
  };

  const syncStateWithURL = async () => {
    const path = window.location.pathname;
    if (path !== '/' && path.length > 1) {
      const token = path.substring(1); 
      const reserved = ['menu', 'cart', 'orders', 'admin', 'landing', 'group', 'feedback', 'feedback-data', 'super-admin', 'test-supabase'];
      if (!reserved.includes(token.toLowerCase())) {
        try {
            const details = await MenuService.getQRCodeByCode(token);
            if (details) {
                setInitialTokenFromUrl(token);
                const menu = await MenuService.getMenuByRestaurantId(details.restaurant_id);
                if (menu.items && menu.items.length > 0) {
                  setMenuItems(menu.items);
                  setCategories(menu.categories);
                }
                if (details.theme) applyTheme(details.theme);
                window.history.replaceState({}, '', '/');
                navigateTo('menu');
                return;
            }
        } catch (e) { console.error("Link processing error"); }
      }
    }
    const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    const route = (hash.split('/')[0] || 'landing') as ViewState;
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

  const navigateTo = (view: ViewState) => { 
    setCurrentView(view); 
    setSelectedItem(null); 
    setIsSupportHubOpen(false);
    window.location.hash = `/${view}`; 
  };

  const finalizeOrder = async (sessionOverride?: any, itemsOverride?: CartItem[]) => {
    const session = sessionOverride || activeSession;
    const items = itemsOverride || (pendingSingleItem ? [pendingSingleItem] : cart);
    
    if (!session) { navigateTo('qr-verify'); return; }
    if (items.length === 0) return;

    try {
      const dbOrders = items.map(item => ({
        restaurant_id: session.restaurant_id,
        session_id: session.id,
        item_id: String(item.id),
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        amount: item.price * item.quantity,
        table_number: session.label,
        customer_name: item.orderTo || 'Guest',
        order_status: 'Pending',
        payment_status: 'Unpaid',
        instructions: item.customInstructions || '',
        qr_code_token: session.session_token
      }));
      await MenuService.insertOrders(dbOrders);
      if (itemsOverride || !pendingSingleItem) setCart([]);
      if (pendingSingleItem) setPendingSingleItem(null);
      navigateTo('orders');
    } catch (e) { alert("Order dispatch failed. Please see staff."); }
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing': return <LandingView onStart={() => navigateTo('menu')} onCreateMenu={() => navigateTo('create-menu')} onImportMenu={() => {}} />;
      case 'menu': return <MenuView popularItems={menuItems.filter(i => i.is_popular)} categories={categories} filteredItems={menuItems.filter(i => activeCategory === 'all' || i.cat_name === activeCategory)} activeCategory={activeCategory} searchQuery={searchQuery} onSearchChange={setSearchQuery} onCategorySelect={setActiveCategory} onItemSelect={setSelectedItem} />;
      case 'cart': return <CartView cart={cart} onUpdateQuantity={(idx, d) => setCart(p => p.map((it, i) => i === idx ? {...it, quantity: Math.max(1, it.quantity + d)} : it))} onRemove={(idx) => setCart(p => p.filter((_, i) => i !== idx))} onCheckout={() => activeSession ? finalizeOrder() : navigateTo('qr-verify')} onGoBack={() => navigateTo('menu')} />;
      case 'qr-verify': return <QRVerifyView initialToken={initialTokenFromUrl} onVerify={handleVerificationSuccess} onCancel={() => navigateTo('menu')} />;
      case 'orders': return <OrdersView restaurantId={activeSession?.restaurant_id} tableNumber={activeSession?.label} onIdentifyTable={() => navigateTo('qr-verify')} onPayNow={() => {}} onGoToMenu={() => navigateTo('menu')} />;
      case 'group': return <GroupView />;
      case 'feedback': return <FeedbackForm onSubmit={() => navigateTo('feedback-data')} onCancel={() => navigateTo('menu')} />;
      case 'feedback-data': return <FeedbackDataView feedbacks={[]} onAddFeedback={() => navigateTo('feedback')} />;
      case 'super-admin': return <SuperAdminView onBack={() => navigateTo('menu')} />;
      case 'test-supabase': return <TestSupabaseView />;
      case 'accept-invite': return <AcceptInviteView onComplete={() => navigateTo('admin')} onCancel={() => navigateTo('landing')} />;
      case 'admin': return <AdminView menuItems={[]} setMenuItems={() => {}} categories={[]} setCategories={() => {}} feedbacks={[]} setFeedbacks={() => {}} salesHistory={[]} setSalesHistory={() => {}} adminCreds={{}} setAdminCreds={() => {}} onExit={() => navigateTo('landing')} onLogoUpdate={() => {}} />;
      default: return null;
    }
  };

  if (isBooting) return <div className="flex flex-col items-center justify-center min-h-screen bg-white"><div className="w-16 h-16 border-4 border-slate-50 border-t-brand-primary rounded-full animate-spin"></div></div>;

  const showNavComponents = !['admin', 'landing', 'qr-verify', 'feedback', 'super-admin', 'test-supabase', 'accept-invite'].includes(currentView);

  return (
    <div className={`min-h-screen bg-white relative overflow-x-hidden ${['landing', 'admin', 'menu', 'cart', 'orders', 'group', 'feedback-data', 'super-admin', 'test-supabase', 'accept-invite'].includes(currentView) ? 'w-full' : 'max-w-xl mx-auto shadow-2xl'}`}>
      <style>{`:root { --brand-primary: ${appTheme.primary_color}; --brand-secondary: ${appTheme.secondary_color}; }`}</style>
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={navigateTo} currentView={currentView} />
      
      <DetailPanel 
        item={selectedItem} 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)} 
        onAddToCart={(item) => setCart(p => [...p, item])} 
        onSendToKitchen={(item) => { 
          if(!activeSession) {
              setPendingSingleItem(item);
              navigateTo('qr-verify');
          } else {
              finalizeOrder(activeSession, [item]);
          }
        }} 
      />
      
      <SupportHub 
        isOpen={isSupportHubOpen} 
        onClose={() => setIsSupportHubOpen(false)} 
        menuItems={menuItems} 
        restaurantId={activeSession?.restaurant_id || ''} 
        tableNumber={activeSession?.label || 'Walk-in'} 
      />
      
      {showNavComponents && (
        <Navbar 
          logo={null} 
          onMenuClick={() => setIsSidebarOpen(true)} 
          onCartClick={() => navigateTo('cart')} 
          onLogoClick={() => navigateTo('menu')} 
          onImport={() => {}} 
          currentView={currentView} 
          cartCount={cart.length} 
        />
      )}

      <main className={`animate-fade-in ${showNavComponents ? 'pb-24' : ''}`}>
        {renderView()}
      </main>

      {showNavComponents && (
        <BottomNav 
          currentView={currentView} 
          onNavigate={navigateTo} 
          onSupportClick={() => setIsSupportHubOpen(true)} 
          isSupportOpen={isSupportHubOpen}
          cartCount={cart.length} 
        />
      )}
    </div>
  );
}