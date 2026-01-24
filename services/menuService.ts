
import { supabase } from '../lib/supabase';

// --- Global Utilities ---
export function getSubdomain() {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('webcontainer')) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('branch') || 'main';
  }
  const hostParts = hostname.split('.');
  return hostParts.length > 2 ? hostParts[0] : 'main'; 
}

// --- Security Helpers ---

export async function checkBusinessNameExists(name: string) {
  const cleanName = name.trim();
  if (!cleanName) return false;
  
  const { data, error } = await supabase
    .from('restaurants')
    .select('id')
    .ilike('name', cleanName)
    .maybeSingle();
    
  if (error) {
    console.error("Database check error:", error.message);
    return false;
  }
  return !!data;
}

export async function getClientIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return '0.0.0.0';
    const data = await res.json();
    return data.ip || '0.0.0.0';
  } catch (e) {
    return '0.0.0.0';
  }
}

export async function getLoginStatus(email: string, ip: string) {
  if (!email) return { attempts: 0, blocked_until: null };
  try {
    const { data, error } = await supabase
      .from('login_attempts')
      .select('attempts, blocked_until')
      .eq('email', email.toLowerCase().trim())
      .eq('ip_address', ip)
      .maybeSingle();
    
    // If table doesn't exist, we just return a default safe state
    if (error && error.code === 'PGRST116') return { attempts: 0, blocked_until: null };
    if (error) {
      console.warn("Security table missing or inaccessible. Brute-force protection is offline.");
      return { attempts: 0, blocked_until: null };
    }
    
    return {
      attempts: data?.attempts || 0,
      blocked_until: data?.blocked_until || null
    };
  } catch (err) {
    return { attempts: 0, blocked_until: null };
  }
}

export async function recordLoginFailure(email: string, ip: string) {
  const cleanEmail = email.toLowerCase().trim();
  
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('login_attempts')
      .select('id, attempts')
      .eq('email', cleanEmail)
      .eq('ip_address', ip)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    const newAttempts = (existing?.attempts || 0) + 1;
    let blocked_until = null;

    if (newAttempts >= 5) {
      const blockDate = new Date();
      blockDate.setMinutes(blockDate.getMinutes() + 10);
      blocked_until = blockDate.toISOString();
    }

    const payload: any = {
      email: cleanEmail,
      ip_address: ip,
      attempts: newAttempts,
      last_attempt: new Date().toISOString(),
      blocked_until
    };
    
    if (existing?.id) payload.id = existing.id;

    const { data, error } = await supabase
      .from('login_attempts')
      .upsert(payload)
      .select('attempts, blocked_until')
      .single();

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error("Security recording failed. Table might be missing.", err.message);
    // Return dummy data so the UI can still show a local cooldown
    return { attempts: 1, blocked_until: null };
  }
}

export async function clearLoginAttempts(email: string, ip: string) {
  try {
    await supabase
      .from('login_attempts')
      .delete()
      .eq('email', email.toLowerCase().trim())
      .eq('ip_address', ip);
  } catch (e) {
    // Ignore errors for cleaning up non-existent tables
  }
}

// --- Auth Logic ---

export async function authSignUp(email: string, pass: string, businessName?: string) {
  const finalName = (businessName || email.split('@')[0]).trim();
  
  const { data: rest, error: restErr } = await supabase
    .from('restaurants')
    .insert([{ name: finalName }])
    .select()
    .single();
  
  if (restErr) throw new Error(restErr.message || "Failed to create restaurant profile.");

  const { data: menu, error: menuErr } = await supabase
    .from('menus')
    .insert([{ name: 'Main Menu', restaurant_id: rest.id }])
    .select()
    .single();

  if (menuErr) throw new Error(menuErr.message || "Failed to initialize primary menu.");

  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert([{ 
      email: email.toLowerCase().trim(), 
      password: pass, 
      restaurant_id: rest.id 
    }])
    .select()
    .single();

  if (userErr) {
    await supabase.from('restaurants').delete().eq('id', rest.id);
    throw new Error(userErr.message || "User enrollment failed.");
  }

  return { user, restaurant: rest, defaultMenuId: menu.id };
}

export async function authSignIn(email: string, pass: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, email, restaurant_id,
      restaurants ( id, name, theme )
    `)
    .eq('email', email.toLowerCase().trim())
    .eq('password', pass)
    .maybeSingle();

  if (error) throw new Error(error.message || "Authentication error.");
  if (!data) throw new Error("Incorrect email or password.");

  const { data: menus } = await supabase
    .from('menus')
    .select('id')
    .eq('restaurant_id', data.restaurant_id)
    .order('created_at', { ascending: true });

  return {
    user: { id: data.id, email: data.email, restaurant_id: data.restaurant_id },
    restaurant: data.restaurants,
    defaultMenuId: menus && menus.length > 0 ? menus[0].id : null
  };
}

export async function updateRestaurant(id: string, name: string) {
  const { data, error } = await supabase
    .from('restaurants')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message || "Update failed.");
  return data;
}

export async function updateRestaurantTheme(id: string, theme: any) {
  const { data, error } = await supabase
    .from('restaurants')
    .update({ theme })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message || "Theme update failed.");
  return data;
}

export async function getBranchesForRestaurant(restaurantId: string) {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name');
  if (error) throw new Error(error.message || "Fetch failed.");
  return data || [];
}

export async function getMenuByRestaurantId(restaurantId: string) {
  if (!restaurantId || restaurantId === "undefined") return { categories: [], items: [] };

  const { data: menus, error: menuErr } = await supabase
    .from('menus')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: true });

  if (menuErr) throw new Error(menuErr.message);
  if (!menus || menus.length === 0) return { categories: [], items: [] };

  const menuId = menus[0].id;

  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select(`id, name, order_index`)
    .eq('menu_id', menuId)
    .order('order_index');

  if (catErr) throw new Error(catErr.message || "Catalog fetch failed.");

  const { data: items, error: itemErr } = await supabase
    .from('items')
    .select('*');

  if (itemErr) throw new Error(itemErr.message || "Items fetch failed.");

  const catMap = new Map((categories || []).map(c => [c.id, c.name]));
  
  const allItems = (items || []).filter(item => {
    return item.category_id === null || catMap.has(item.category_id);
  }).map(item => ({
    ...item,
    cat_name: item.category_id ? (catMap.get(item.category_id) || 'Uncategorized') : 'Uncategorized'
  }));

  const processedCats = (categories || []).map(cat => ({
    ...cat,
    items: allItems.filter(i => i.category_id === cat.id)
  }));

  return { categories: processedCats, items: allItems };
}

export async function getMenuForBranch(overrideSubdomain?: string) {
  const subdomain = overrideSubdomain || getSubdomain();
  if (!subdomain) return null;

  const { data: branch, error: branchErr } = await supabase
    .from('branches')
    .select('*')
    .eq('subdomain', subdomain)
    .maybeSingle();

  if (branchErr) throw new Error(branchErr.message || "Branch lookup failed.");
  if (!branch) return { error: 'Branch not found', detectedSubdomain: subdomain };

  const { categories, items } = await getMenuByRestaurantId(branch.restaurant_id);

  return { 
    ...branch, 
    categories,
    items 
  };
}

export async function deleteRestaurant(id: string) {
  const { error } = await supabase.from('restaurants').delete().eq('id', id);
  if (error) throw new Error(error.message || "Purge failed.");
}

export async function insertBranch(name: string, subdomain: string, restaurant_id: string) {
  const { data: menu, error: menuErr } = await supabase
    .from('menus')
    .insert([{ name: `${name.trim()} Menu`, restaurant_id }])
    .select()
    .single();

  if (menuErr) throw new Error(menuErr.message || "Branch menu creation failed.");

  const { data: branch, error: branchErr } = await supabase
    .from('branches')
    .insert([{ 
      name: name.trim(), 
      subdomain: subdomain.toLowerCase().trim(), 
      restaurant_id, 
      menu_id: menu.id 
    }])
    .select()
    .single();

  if (branchErr) throw new Error(branchErr.message || "Branch deployment failed.");
  return branch;
}

export async function deleteBranch(id: string) {
  const { error } = await supabase.from('branches').delete().eq('id', id);
  if (error) throw new Error(error.message || "Branch deletion failed.");
}

export async function upsertCategory(category: any) {
  const { data, error } = await supabase.from('categories').upsert(category).select().single();
  if (error) throw new Error(error.message || "Category sync failed.");
  return data;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message || "Category deletion failed.");
}

export async function upsertMenuItem(item: any) {
  const { data, error } = await supabase.from('items').upsert(item).select().single();
  if (error) throw new Error(error.message || "Dish sync failed.");
  return data;
}

export async function deleteMenuItem(id: string) {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw new Error(error.message || "Dish deletion failed.");
}

export async function getQRCodes(restaurantId: string) {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*, branches(id, name)')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message || "QR fetch failed.");
  return data || [];
}

export async function upsertQRCode(qr: any) {
  const { data, error } = await supabase
    .from('qr_codes')
    .upsert(qr)
    .select()
    .single();
  if (error) throw new Error(error.message || "QR sync failed.");
  return data;
}

export async function deleteQRCode(id: string) {
  const { error } = await supabase.from('qr_codes').delete().eq('id', id);
  if (error) throw new Error(error.message || "QR deletion failed.");
}

export async function getQRCodeByCode(code: string) {
  const { data, error } = await supabase
    .from('qr_codes')
    .select(`
      *,
      restaurants ( id, name, theme ),
      branches ( name )
    `)
    .eq('code', code)
    .maybeSingle();

  if (error) throw new Error(error.message || "Access code lookup failed.");
  if (!data) return null;

  return {
    ...data,
    restaurant_name: data.restaurants?.name,
    branch_name: data.branches?.name,
    theme: data.restaurants?.theme
  };
}

export async function insertOrders(orders: any[]) {
  const { data, error } = await supabase
    .from('orders')
    .insert(orders)
    .select();
  if (error) throw new Error(error.message || "Order placement failed.");
  return data;
}

export async function getOrdersByTable(restaurantId: string, tableLabel: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('table_number', tableLabel)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message || "Table order fetch failed.");
  return data || [];
}

export async function getMerchantOrders(restaurantId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message || "Merchant order fetch failed.");
  return data || [];
}

export async function updateOrder(id: string, updates: any) {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message || "Order update failed.");
  return data;
}

export async function deleteOrder(id: string) {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw new Error(error.message || "Order deletion failed.");
}
