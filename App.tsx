
import React, { useState, useMemo, useEffect } from 'react';
import { MenuItem, CartItem, Category, Feedback, SalesRecord, ViewState } from './types';
import { menuItems as defaultMenuItems, categories as defaultCategories } from './data';
import * as MenuService from './services/menuService';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DetailPanel from './components/DetailPanel';
import FeedbackForm from './components/FeedbackForm';

// Views
import MenuView from './views/MenuView';
import CartView from './views/CartView';
import OrdersView from './views/OrdersView';
import QRVerifyView from './views/QRVerifyView';
import GroupView from './views/GroupView';
import LegalView from './views/LegalView';
import AdminView from './views/AdminView';
import FeedbackDataView from './views/FeedbackDataView';
import LandingView from './views/LandingView';
import PaymentView from './views/PaymentView';
import CreateMenuView from './views/CreateMenuView';
import TestSupabaseView from './views/TestSupabaseView';
import SuperAdminView from './views/SuperAdminView';

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
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [salesHistory, setSalesHistory] = useState<SalesRecord[]>([]);
  const [adminCreds, setAdminCreds] = useState({ email: 'admin@foodie.com', password: 'password123' });
  const [logo, setLogo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<OrderInstance[]>([]);
  const [pendingSingleItem, setPendingSingleItem] = useState<CartItem | null>(null);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [qrDetails, setQrDetails] = useState<{label: string, restaurantName: string, branches: string[]} | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const slugify = (text: string) => text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

  const syncStateWithURL = async () => {
    const hashPart = window.location.hash.split('?')[0];
    const hash = hashPart.replace(/^#\/?/, '');
    const parts = hash.split('/').filter(p => p !== '');
    const path = window.location.pathname;

    // Detection for new URL pattern: https://men-m53q.vercel.app/[token]
    if (path !== '/' && path.length > 1) {
      const token = path.substring(1); // Remove leading slash
      
      // Standard view routes to exclude from token detection
      const reserved = ['menu', 'cart', 'orders', 'favorites', 'feedback', 'admin', 'super-admin', 'landing', 'create-menu'];
      if (!reserved.includes(token.toLowerCase())) {
        try {
          const details = await MenuService.getQRCodeByCode(token);
          if (details) {
            setActiveTable(details.label);
            setQrDetails({
              label: details.label,
              restaurantName: details.restaurant_name || 'Premium Merchant',
              branches: details.branches.map((b: any) => b.name)
            });
            setShowWelcomeModal(true);
            setCurrentView('menu');
            // Clean up the URL to hash routing for SPA stability
            window.history.replaceState({}, '', '/#/menu');
            return;
          }
        } catch (err) {
          console.error("Token resolution failure:", err);
        }
      }
    }

    if (parts.length === 0 || parts[0] === 'menu') {
      setCurrentView('menu');
      setSelectedItem(null);
      return;
    }

    const route = parts[0].toLowerCase();
    const viewMap: Record<string, ViewState> = {
      'landing': 'landing',
      'menu': 'menu',
      'cart': 'cart',
      'orders': 'orders',
      'favorites': 'favorites',
      'feedback': 'feedback',
      'feedback-data': 'feedback-data',
      'privacy': 'privacy',
      'terms': 'terms',
      'admin': 'admin',
      'create-menu': 'create-menu',
      'payment': 'payment',
      'qr-verify': 'qr-verify',
      'group': 'group',
      'test-supabase': 'test-supabase',
      'super-admin': 'super-admin'
    };

    if (viewMap[route]) {
      setCurrentView(viewMap[route]);
      setSelectedItem(null);
    } else {
      setCurrentView(activeTable ? 'menu' : 'landing');
      setSelectedItem(null);
    }
  };

  useEffect(() => {
    window.addEventListener('hashchange', syncStateWithURL);
    syncStateWithURL(); // Initial sync
    return () => window.removeEventListener('hashchange', syncStateWithURL);
  }, [menuItems, activeTable]);

  const navigateTo = (view: ViewState) => {
    window.location.hash = `/${view}`;
  };

  const handleItemSelect = (item: MenuItem | null) => {
    setSelectedItem(item);
  };

  useEffect(() => {
    const savedMenu = localStorage.getItem('foodie_menu_items');
    const savedCats = localStorage.getItem('foodie_categories');
    const savedFeedbacks = localStorage.getItem('foodie_feedbacks');
    const savedSales = localStorage.getItem('foodie_sales_history');
    const savedAdmin = localStorage.getItem('foodie_admin_creds');
    const savedLogo = localStorage.getItem('foodie_business_logo');

    if (savedMenu && savedCats) {
      setMenuItems(JSON.parse(savedMenu));
      setCategories(JSON.parse(savedCats));
    } else {
      setMenuItems(defaultMenuItems);
      setCategories(defaultCategories);
    }

    if (savedFeedbacks) setFeedbacks(JSON.parse(savedFeedbacks));
    if (savedSales) setSalesHistory(JSON.parse(savedSales));
    if (savedAdmin) setAdminCreds(JSON.parse(savedAdmin));
    if (savedLogo) setLogo(savedLogo);
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('foodie_menu_items', JSON.stringify(menuItems));
      localStorage.setItem('foodie_categories', JSON.stringify(categories));
      localStorage.setItem('foodie_feedbacks', JSON.stringify(feedbacks));
      localStorage.setItem('foodie_sales_history', JSON.stringify(salesHistory));
      localStorage.setItem('foodie_admin_creds', JSON.stringify(adminCreds));
      if (logo) localStorage.setItem('foodie_business_logo', logo);
    }
  }, [menuItems, categories, feedbacks, salesHistory, adminCreds, logo, isLoading]);

  useEffect(() => {
    if (orders.length === 0) return;
    const interval = setInterval(() => {
      setOrders(prev => prev.map(o => {
        if (o.status === 'Pending') return { ...o, status: 'Cooking' };
        if (o.status === 'Cooking') return { ...o, status: 'Ready' };
        if (o.status === 'Ready') return { ...o, status: 'Served' };
        return o;
      }));
    }, 12000);
    return () => clearInterval(interval);
  }, [orders.length]);

  const popularItems = useMemo(() => menuItems.filter(item => item.is_popular), [menuItems]);
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.cat_name === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, menuItems]);

  const finalizeOrder = () => {
    const itemsToProcess = pendingSingleItem ? [pendingSingleItem] : cart;
    if (itemsToProcess.length === 0) { navigateTo('menu'); return; }

    const timestamp = new Date();
    const newOrders: OrderInstance[] = itemsToProcess.map((item, idx) => ({
      ...item,
      orderId: `ORD-${timestamp.getTime()}-${idx}`,
      status: 'Pending',
      timestamp
    }));
    
    const newSales: SalesRecord[] = itemsToProcess.map(item => ({
      timestamp: timestamp.toISOString(),
      amount: item.price * item.quantity,
      itemId: item.id,
      itemName: item.name,
      categoryName: item.cat_name,
      quantity: item.quantity,
      branch: 'Main',
      tableNumber: activeTable?.replace(/-/g, ' ') || item.orderTo,
      paymentStatus: 'Unpaid',
      orderStatus: 'Preparing'
    }));
    
    setOrders(prev => [...prev, ...newOrders]);
    setSalesHistory(prev => [...prev, ...newSales]);
    
    if (pendingSingleItem) setPendingSingleItem(null); else setCart([]);
    navigateTo('orders');
    setSelectedItem(null);
  };

  const handleSendToKitchenDirect = (item: CartItem) => {
    setPendingSingleItem({ ...item });
    navigateTo('qr-verify');
  };

  const handleFeedbackSubmit = (feedback: Feedback) => {
    setFeedbacks(prev => [feedback, ...prev]);
    setOrders([]);
    navigateTo('feedback-data');
    alert('Thank you for your feedback!');
  };

  const handleImportConfig = (config: any) => {
    if (config.menu?.categories) setCategories(config.menu.categories);
    if (config.menu?.items) setMenuItems(config.menu.items);
    if (config.business?.name) localStorage.setItem('foodie_business_name', config.business.name);
    if (config.business?.logo) {
      setLogo(config.business.logo);
      localStorage.setItem('foodie_business_logo', config.business.logo);
    }
    alert('Configuration Imported Successfully!');
    navigateTo('menu');
  };

  const renderView = () => {
    if (isLoading) return <div className="flex items-center justify-center min-h-[80vh] font-black text-orange-600 animate-pulse uppercase tracking-widest text-xs">Initialising...</div>;

    switch (currentView) {
      case 'landing': return (
        <LandingView 
          onStart={() => navigateTo('menu')} 
          onCreateMenu={() => navigateTo('create-menu')} 
          onImportMenu={handleImportConfig}
        />
      );
      case 'create-menu': return (
        <CreateMenuView 
          onCancel={() => navigateTo('landing')} 
          onComplete={(config) => {
            handleImportConfig(config);
            navigateTo('admin');
          }}
        />
      );
      case 'menu': return (
        <MenuView 
          popularItems={popularItems} categories={categories} filteredItems={filteredItems} 
          activeCategory={activeCategory} searchQuery={searchQuery}
          onSearchChange={setSearchQuery} onCategorySelect={setActiveCategory} onItemSelect={handleItemSelect}
        />
      );
      case 'cart': return (
        <CartView 
          cart={cart} onUpdateQuantity={(idx, d) => setCart(p => p.map((it, i) => i === idx ? {...it, quantity: Math.max(1, it.quantity + d)} : it))}
          onRemove={(idx) => setCart(p => p.filter((_, i) => i !== idx))} onCheckout={() => navigateTo('qr-verify')}
          onGoBack={() => navigateTo('menu')}
        />
      );
      case 'payment': return (
        <PaymentView 
          total={orders.reduce((sum, o) => sum + (o.price * o.quantity), 0)}
          onClose={() => navigateTo('orders')}
          onSuccess={() => {
            alert("Payment Successful! Your digital receipt has been sent.");
            navigateTo('feedback');
          }}
        />
      );
      case 'qr-verify': return <QRVerifyView onVerify={finalizeOrder} onCancel={() => { setPendingSingleItem(null); navigateTo(cart.length > 0 ? 'cart' : 'menu'); }} />;
      case 'orders': return <OrdersView orders={orders} onPayNow={() => navigateTo('payment')} onGoToMenu={() => navigateTo('menu')} />;
      case 'feedback': return <FeedbackForm onSubmit={handleFeedbackSubmit} onCancel={() => navigateTo('menu')} />;
      case 'feedback-data': return <FeedbackDataView feedbacks={feedbacks} onAddFeedback={() => navigateTo('feedback')} />;
      case 'test-supabase': return <TestSupabaseView />;
      case 'super-admin': return <SuperAdminView onBack={() => navigateTo('menu')} />;
      case 'admin': return (
        <AdminView 
          menuItems={menuItems} setMenuItems={setMenuItems} 
          categories={categories} setCategories={setCategories} 
          feedbacks={feedbacks} setFeedbacks={setFeedbacks}
          salesHistory={salesHistory} setSalesHistory={setSalesHistory}
          adminCreds={adminCreds} setAdminCreds={setAdminCreds}
          onExit={() => navigateTo('menu')}
          onLogoUpdate={setLogo}
        />
      );
      case 'privacy': return <LegalView title="Privacy Policy" />;
      case 'terms': return <LegalView title="Terms & Agreement" />;
      default: return null;
    }
  };

  const showNavbar = !['admin', 'payment', 'landing', 'create-menu', 'super-admin'].includes(currentView);

  return (
    <div className="min-h-screen pb-24 max-w-xl mx-auto bg-white shadow-2xl relative overflow-x-hidden">
      {/* Welcome Discovery Modal */}
      {showWelcomeModal && qrDetails && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm text-center shadow-2xl space-y-6">
            <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <i className="fa-solid fa-utensils text-3xl"></i>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-1">Authenticated Session</p>
                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
                  Welcome to <span className="text-orange-600">{qrDetails.restaurantName}</span>
                </h2>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">Location Context</p>
                <p className="text-lg font-black text-slate-800 uppercase italic">{qrDetails.label}</p>
                {qrDetails.branches.length > 0 && (
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 opacity-60">Branch: {qrDetails.branches.join(', ')}</p>
                )}
              </div>
            </div>
            <button 
              onClick={() => setShowWelcomeModal(false)}
              className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Start Ordering
            </button>
          </div>
        </div>
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={navigateTo} currentView={currentView} />
      <DetailPanel item={selectedItem} isOpen={!!selectedItem} onClose={() => handleItemSelect(null)} onAddToCart={(item) => setCart(p => [...p, item])} onSendToKitchen={handleSendToKitchenDirect} />
      {showNavbar && <Navbar logo={logo} onMenuClick={() => setIsSidebarOpen(true)} onCartClick={() => navigateTo('cart')} onLogoClick={() => navigateTo('menu')} onImport={handleImportConfig} currentView={currentView} cartCount={cart.reduce((s, i) => s + i.quantity, 0)} />}
      <main className={showNavbar ? "min-h-[80vh]" : ""}>{renderView()}</main>
      
      {!['landing', 'admin', 'payment', 'create-menu', 'super-admin'].includes(currentView) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex justify-around py-4 max-w-xl mx-auto z-40">
          {[
            { v: 'menu', i: 'fa-house', l: 'Menu' },
            { v: 'group', i: 'fa-users', l: 'Group' },
            { v: 'favorites', i: 'fa-heart', l: 'Favorites' },
            { v: 'orders', i: 'fa-receipt', l: 'Orders' }
          ].map(btn => (
            <button 
              key={btn.v} 
              onClick={() => navigateTo(btn.v as ViewState)}
              className={`flex flex-col items-center gap-1 transition ${currentView === btn.v ? 'text-orange-500' : 'text-slate-300 hover:text-orange-300'}`}
            >
              <i className={`fa-solid ${btn.i} text-xl`}></i>
              <span className="text-[10px] font-black uppercase tracking-widest">{btn.l}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
