
/**
 * Foodie Premium SPA - Core Logic (Vanilla JS Port)
 */

// Initial State
const appState = {
    view: 'landing',
    isSidebarOpen: false,
    selectedItem: null,
    activeCategory: 'all',
    searchQuery: '',
    menuItems: JSON.parse(localStorage.getItem('foodie_menu_items')) || window.foodieData.menuItems,
    categories: JSON.parse(localStorage.getItem('foodie_categories')) || window.foodieData.categories,
    cart: [],
    orders: [],
    isAdminAuthenticated: false
};

// --- View Helpers ---

function setView(viewName) {
    appState.view = viewName;
    appState.isSidebarOpen = false;
    render();
}

function toggleSidebar(open) {
    appState.isSidebarOpen = open;
    render();
}

function selectItem(item) {
    appState.selectedItem = item;
    render();
}

function addToCart() {
    if (!appState.selectedItem) return;
    const item = { ...appState.selectedItem, quantity: 1, orderTo: 'Me' };
    appState.cart.push(item);
    appState.selectedItem = null;
    render();
}

// --- Render Engine ---

function render() {
    const root = document.getElementById('app-root');
    if (!root) return;

    root.innerHTML = '';
    
    // Components based on view
    if (appState.view === 'landing') {
        root.innerHTML = renderLanding();
    } else if (appState.view === 'menu') {
        root.innerHTML = renderNavbar() + renderMenu();
    } else if (appState.view === 'cart') {
        root.innerHTML = renderNavbar() + renderCart();
    } else if (appState.view === 'orders') {
        root.innerHTML = renderNavbar() + renderOrders();
    } else if (appState.view === 'admin') {
        root.innerHTML = renderAdmin();
    }

    // Sidebar & Modal Overlay
    root.innerHTML += renderSidebar();
    root.innerHTML += renderDetailPanel();
    root.innerHTML += renderBottomNav();

    // Attach persistence
    localStorage.setItem('foodie_menu_items', JSON.stringify(appState.menuItems));
}

// --- Components (Template Strings) ---

function renderLanding() {
    return `
    <div class="min-h-screen bg-[#0f172a] text-center p-8 flex flex-col justify-center items-center">
        <h1 class="text-6xl font-black text-white italic uppercase tracking-tighter mb-4">SHARP<span class="text-orange-500">QR</span></h1>
        <p class="text-slate-400 mb-12">The ultimate digital menu ecosystem. Offline-ready.</p>
        <div class="flex flex-col gap-4 w-full">
            <button onclick="setView('menu')" class="w-full bg-orange-500 text-white py-6 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all">Explore Menu</button>
            <button onclick="setView('admin')" class="w-full bg-slate-800 text-white py-6 rounded-3xl font-black uppercase tracking-widest active:scale-95 transition-all">Merchant Access</button>
        </div>
    </div>
    `;
}

function renderNavbar() {
    return `
    <nav class="sticky top-0 z-50 bg-white/90 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-gray-50">
      <button onclick="toggleSidebar(true)" class="p-2 hover:bg-gray-100 rounded-xl transition">
        <i class="fa-solid fa-align-left text-xl text-slate-700"></i>
      </button>
      <h1 class="font-black text-2xl tracking-tighter text-orange-600" onclick="setView('menu')">FOODIE.</h1>
      <button onclick="setView('cart')" class="relative p-2 text-slate-700">
        <i class="fa-solid fa-cart-shopping text-xl"></i>
        ${appState.cart.length > 0 ? `<span class="absolute top-0 right-0 bg-orange-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white font-bold">${appState.cart.length}</span>` : ''}
      </button>
    </nav>
    `;
}

function renderMenu() {
    const filtered = appState.menuItems.filter(i => appState.activeCategory === 'all' || i.cat_name === appState.activeCategory);
    
    return `
    <div class="p-6">
        <h2 class="text-3xl font-black mb-6">What's <span class="text-orange-500">Fresh?</span></h2>
        
        <div class="flex overflow-x-auto gap-2 no-scrollbar mb-8">
            <button onclick="appState.activeCategory='all'; render();" class="px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${appState.activeCategory==='all'?'bg-orange-500 text-white':'bg-slate-100 text-slate-400'}">All</button>
            ${appState.categories.map(c => `<button onclick="appState.activeCategory='${c.name}'; render();" class="px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${appState.activeCategory===c.name?'bg-orange-500 text-white':'bg-slate-100 text-slate-400'}">${c.name}</button>`).join('')}
        </div>

        <div class="space-y-4">
            ${filtered.map(item => `
                <div onclick='selectItem(${JSON.stringify(item)})' class="bg-white p-4 rounded-[2.5rem] border border-slate-100 flex gap-4 shadow-sm hover:shadow-lg transition-all cursor-pointer">
                    <img src="${item.image_url}" class="w-20 h-20 rounded-2xl object-cover" />
                    <div>
                        <h4 class="font-bold text-slate-800">${item.name}</h4>
                        <p class="text-orange-600 font-black">₱${item.price}</p>
                        <p class="text-[10px] text-slate-400 mt-1">${item.serving_time}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    `;
}

function renderSidebar() {
    return `
    <div onclick="toggleSidebar(false)" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${appState.isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}"></div>
    <aside class="fixed top-0 left-0 h-full w-72 bg-white z-[110] shadow-2xl transition-transform duration-300 transform ${appState.isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}">
        <div class="p-8 h-full flex flex-col">
            <h2 class="font-black text-2xl text-orange-600 italic mb-10">FOODIE.</h2>
            <nav class="space-y-2">
                <button onclick="setView('menu')" class="w-full text-left p-4 rounded-xl font-bold hover:bg-slate-50">Menu</button>
                <button onclick="setView('orders')" class="w-full text-left p-4 rounded-xl font-bold hover:bg-slate-50">Orders</button>
                <button onclick="setView('admin')" class="w-full text-left p-4 rounded-xl font-bold hover:bg-slate-50">Admin</button>
            </nav>
        </div>
    </aside>
    `;
}

function renderDetailPanel() {
    if (!appState.selectedItem) return '';
    const item = appState.selectedItem;
    return `
    <div onclick="selectItem(null)" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120]"></div>
    <aside class="fixed bottom-0 left-0 right-0 bg-white z-[130] rounded-t-[3rem] p-8 transition-transform duration-500">
        <div class="max-w-md mx-auto">
            <img src="${item.image_url}" class="w-full aspect-square object-cover rounded-[2rem] mb-6 shadow-xl" />
            <h2 class="text-3xl font-black italic uppercase mb-2">${item.name}</h2>
            <p class="text-slate-500 text-sm mb-8">${item.description}</p>
            <button onclick="addToCart()" class="w-full bg-orange-500 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95">Add to Cart • ₱${item.price}</button>
        </div>
    </aside>
    `;
}

function renderBottomNav() {
    if (appState.view === 'landing' || appState.view === 'admin') return '';
    return `
    <div class="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex justify-around py-4 max-w-xl mx-auto z-40">
        <button onclick="setView('menu')" class="flex flex-col items-center gap-1 ${appState.view==='menu'?'text-orange-500':'text-slate-300'}">
            <i class="fa-solid fa-house text-xl"></i>
            <span class="text-[10px] font-black">Menu</span>
        </button>
        <button onclick="setView('cart')" class="flex flex-col items-center gap-1 ${appState.view==='cart'?'text-orange-500':'text-slate-300'}">
            <i class="fa-solid fa-cart-shopping text-xl"></i>
            <span class="text-[10px] font-black">Cart</span>
        </button>
        <button onclick="setView('orders')" class="flex flex-col items-center gap-1 ${appState.view==='orders'?'text-orange-500':'text-slate-300'}">
            <i class="fa-solid fa-receipt text-xl"></i>
            <span class="text-[10px] font-black">Orders</span>
        </button>
    </div>
    `;
}

function renderCart() {
    const total = appState.cart.reduce((s, i) => s + i.price, 0);
    return `
    <div class="p-6">
        <h2 class="text-3xl font-black mb-6">Basket</h2>
        ${appState.cart.length === 0 ? '<p class="text-slate-400">Empty...</p>' : `
            <div class="space-y-4">
                ${appState.cart.map(i => `
                    <div class="bg-white p-4 rounded-3xl border border-slate-100 flex justify-between items-center">
                        <span class="font-bold">${i.name}</span>
                        <span class="font-black text-orange-600">₱${i.price}</span>
                    </div>
                `).join('')}
                <div class="pt-8 border-t border-dashed">
                    <div class="flex justify-between font-black text-xl">
                        <span>Total</span>
                        <span class="text-orange-600">₱${total}</span>
                    </div>
                    <button onclick="appState.orders = [...appState.cart]; appState.cart=[]; setView('orders');" class="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest mt-6">Checkout</button>
                </div>
            </div>
        `}
    </div>
    `;
}

function renderOrders() {
    return `
    <div class="p-6">
        <h2 class="text-3xl font-black mb-6">Live Orders</h2>
        <div class="space-y-4">
            ${appState.orders.map(o => `
                <div class="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl flex gap-4">
                    <div class="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black">COOKING</div>
                    <div class="flex-1">
                        <h4 class="font-black text-sm uppercase">${o.name}</h4>
                        <p class="text-[10px] text-slate-400">Arriving in ${o.serving_time}</p>
                    </div>
                </div>
            `).join('')}
            ${appState.orders.length === 0 ? '<p class="text-slate-300">No active orders.</p>' : ''}
        </div>
    </div>
    `;
}

function renderAdmin() {
    return `
    <div class="min-h-screen bg-slate-50 p-8">
        <button onclick="setView('landing')" class="mb-8 text-slate-400 font-bold"><i class="fa-solid fa-arrow-left"></i> Exit Admin</button>
        <h1 class="text-3xl font-black italic uppercase mb-10">SHARP<span class="text-indigo-600">ADMIN</span></h1>
        
        <div class="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-xl space-y-6">
            <h3 class="text-xs font-black uppercase text-slate-400 tracking-widest">Dashboard Metrics</h3>
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-slate-50 p-6 rounded-3xl text-center">
                    <p class="text-[9px] font-black text-slate-400 uppercase">Sales Today</p>
                    <p class="text-xl font-black">₱12.4k</p>
                </div>
                <div class="bg-slate-50 p-6 rounded-3xl text-center">
                    <p class="text-[9px] font-black text-slate-400 uppercase">Active Tables</p>
                    <p class="text-xl font-black">04</p>
                </div>
            </div>
            <button onclick="alert('Demo feature: Menu editing is locked in preview.')" class="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest">Manage Menu Database</button>
        </div>
    </div>
    `;
}

// Initial Boot
window.onload = render;
window.setView = setView;
window.toggleSidebar = toggleSidebar;
window.selectItem = selectItem;
window.addToCart = addToCart;
