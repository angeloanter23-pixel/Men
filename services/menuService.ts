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

export async function checkEmailExists(email: string) {
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
    
    if (error) return false;
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

/**
 * Local Fallback Logic (Legacy browser-only persistence)
 */
const getLocalSecurityKey = (email: string | null, ip: string) => `foodie_sec_v3_${btoa((email || 'device') + ip).slice(0, 16)}`;

function getLocalStatus(email: string | null, ip: string) {
  const key = getLocalSecurityKey(email, ip);
  const raw = localStorage.getItem(key);
  if (!raw) return { attempts: 0, locked_until: null };
  try {
    return JSON.parse(raw);
  } catch (e) {
    return { attempts: 0, locked_until: null };
  }
}

export async function getLoginStatus(email: string, ip: string) {
  if (!ip) return { attempts: 0, locked_until: null };
  const cleanEmail = email?.toLowerCase().trim();
  
  try {
    const { data: deviceData } = await supabase
      .from('login_attempts')
      .select('attempts, locked_until')
      .is('email', null)
      .eq('ip_address', ip)
      .maybeSingle();

    if (deviceData?.locked_until && new Date(deviceData.locked_until) > new Date()) {
        return { ...deviceData, type: 'device' };
    }

    if (cleanEmail && cleanEmail.includes('@')) {
        const { data: accountData } = await supabase
            .from('login_attempts')
            .select('attempts, locked_until')
            .eq('email', cleanEmail)
            .eq('ip_address', ip)
            .maybeSingle();
        
        return accountData || { attempts: 0, locked_until: null, type: 'account' };
    }
    
    return deviceData || { attempts: 0, locked_until: null, type: 'device' };
  } catch (err) {
    return getLocalStatus(cleanEmail, ip);
  }
}

export async function recordLoginFailure(email: string, ip: string) {
  const cleanEmail = email.toLowerCase().trim();
  
  const updateEntity = async (targetEmail: string | null, threshold: number, lockMins: number) => {
    try {
        const query = supabase.from('login_attempts').select('id, attempts').eq('ip_address', ip);
        if (targetEmail) query.eq('email', targetEmail);
        else query.is('email', null);
        
        const { data: existing } = await query.maybeSingle();
        
        const nextAttempts = (existing?.attempts || 0) + 1;
        let locked_until = null;

        if (nextAttempts >= threshold) {
          const blockDate = new Date();
          blockDate.setMinutes(blockDate.getMinutes() + lockMins);
          locked_until = blockDate.toISOString();
        }

        const payload: any = {
          email: targetEmail,
          ip_address: ip,
          attempts: nextAttempts,
          last_attempt: new Date().toISOString(),
          locked_until: locked_until
        };
        
        if (existing?.id) payload.id = existing.id;

        const { data, error } = await supabase
          .from('login_attempts')
          .upsert(payload, { onConflict: targetEmail ? 'email,ip_address' : 'ip_address' })
          .select('attempts, locked_until')
          .single();

        if (error) throw error;
        localStorage.setItem(getLocalSecurityKey(targetEmail, ip), JSON.stringify(data));
        return data;
    } catch (e) {
        const local = getLocalStatus(targetEmail, ip);
        const next = (local.attempts || 0) + 1;
        let lock = null;
        if (next >= threshold) {
            const d = new Date(); d.setMinutes(d.getMinutes() + lockMins);
            lock = d.toISOString();
        }
        const state = { attempts: next, locked_until: lock };
        localStorage.setItem(getLocalSecurityKey(targetEmail, ip), JSON.stringify(state));
        return state;
    }
  };

  const accountResult = await updateEntity(cleanEmail, 5, 10);
  await updateEntity(null, 10, 15);
  
  return accountResult;
}

export async function clearLoginAttempts(email: string, ip: string) {
  const cleanEmail = email.toLowerCase().trim();
  localStorage.removeItem(getLocalSecurityKey(cleanEmail, ip));
  localStorage.removeItem(getLocalSecurityKey(null, ip));
  try {
    await supabase
      .from('login_attempts')
      .delete()
      .eq('email', cleanEmail)
      .eq('ip_address', ip);
  } catch (e) {
  }
}

// --- Menu & Business Logic ---

export async function getQRCodeByCode(token: string) {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*, restaurants(*), branches(*)')
    .eq('code', token)
    .maybeSingle();
  
  if (error || !data) return null;
  
  return {
    id: data.id,
    restaurant_id: data.restaurant_id,
    label: data.label,
    code: data.code,
    restaurant_name: data.restaurants?.name,
    branch_name: data.branches?.name,
    theme: data.restaurants?.theme
  };
}

export async function getMenuByRestaurantId(restaurantId: string) {
  const { data: menu, error: menuErr } = await supabase
    .from('menus')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .maybeSingle();
  
  if (menuErr || !menu) return { items: [], categories: [] };
  
  const [itemsRes, catsRes] = await Promise.all([
    supabase.from('items').select('*, categories(name)').order('name'),
    supabase.from('categories').select('*').eq('menu_id', menu.id).order('order_index')
  ]);
  
  const items = (itemsRes.data || []).map((it: any) => ({
    ...it,
    cat_name: it.categories?.name || 'Uncategorized'
  }));
  
  return { items, categories: catsRes.data || [] };
}

export async function getMenuForBranch(subdomain: string) {
  const { data: branch, error: bErr } = await supabase
    .from('branches')
    .select('*, restaurants(*)')
    .eq('subdomain', subdomain)
    .maybeSingle();
  
  if (bErr || !branch) throw new Error("Branch not found");

  const menuData = await getMenuByRestaurantId(branch.restaurant_id);
  
  const { data: menu } = await supabase.from('menus').select('id').eq('restaurant_id', branch.restaurant_id).maybeSingle();

  return {
    ...branch,
    menu_id: menu?.id,
    items: menuData.items,
    categories: menuData.categories
  };
}

export async function getBranchesForRestaurant(restaurantId: string) {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name');
  if (error) throw error;
  return data;
}

export async function getQRCodes(restaurantId: string) {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*, branches(name)')
    .eq('restaurant_id', restaurantId)
    .order('label');
  if (error) throw error;
  return data;
}

export async function insertBranch(name: string, subdomain: string, restaurantId: string) {
  const { data, error } = await supabase
    .from('branches')
    .insert([{ name, subdomain, restaurant_id: restaurantId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBranch(id: string) {
    const { error } = await supabase.from('branches').delete().eq('id', id);
    if (error) throw error;
}

export async function upsertCategory(payload: any) {
  const { data, error } = await supabase
    .from('categories')
    .upsert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertMenuItem(payload: any) {
  const { data, error } = await supabase
    .from('items')
    .upsert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMenuItem(id: string) {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertQRCode(payload: any) {
  const { data, error } = await supabase
    .from('qr_codes')
    .upsert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteQRCode(id: string) {
  const { error } = await supabase.from('qr_codes').delete().eq('id', id);
  if (error) throw error;
}

// --- Order Management ---

export async function insertOrders(orders: any[]) {
  const { data, error } = await supabase
    .from('orders')
    .insert(orders)
    .select();
  if (error) throw error;
  return data;
}

export async function getOrdersByTable(restaurantId: string, tableNumber: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('table_number', tableNumber)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getMerchantOrders(restaurantId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateOrder(id: string, updates: any) {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteOrder(id: string) {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
}

// --- Restaurant Identity & Theme ---

export async function updateRestaurant(id: string, name: string) {
  const { data, error } = await supabase
    .from('restaurants')
    .update({ name })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRestaurantTheme(id: string, theme: any) {
  const { data, error } = await supabase
    .from('restaurants')
    .update({ theme })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRestaurant(id: string) {
    const { error } = await supabase.from('restaurants').delete().eq('id', id);
    if (error) throw error;
}

// --- Invitation Logic ---

export async function createStaffInvite(email: string, role: string, restaurantId: string) {
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Removed 'name' column from insertion
    const { data, error } = await supabase
        .from('users')
        .insert([{
            email: email.toLowerCase().trim(),
            role: role,
            status: 'pending',
            invite_token: token,
            invite_expires_at: expiresAt.toISOString(),
            restaurant_id: restaurantId
        }])
        .select()
        .single();
    
    if (error) throw new Error(error.message);
    return data;
}

export async function verifyStaffInvite(token: string, email: string) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('invite_token', token)
        .eq('email', email.toLowerCase().trim())
        .eq('status', 'pending')
        .maybeSingle();
    
    if (error) throw new Error(error.message);
    if (!data) return null;

    if (new Date(data.invite_expires_at) < new Date()) return null;
    return data;
}

export async function acceptStaffInvite(token: string, password: string) {
    // Removed 'name' column from update
    const { data, error } = await supabase
        .from('users')
        .update({
            password: password,
            status: 'active',
            invite_consumed_at: new Date().toISOString(),
            invite_token: null,
            invite_expires_at: null
        })
        .eq('invite_token', token)
        .select()
        .single();
    
    if (error) throw new Error(error.message);
    return data;
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
      restaurant_id: rest.id,
      role: 'super-admin',
      status: 'active'
    }])
    .select()
    .single();
  
  if (userErr) throw new Error(userErr.message || "Failed to create user account.");

  return { user, restaurant: rest, defaultMenuId: menu.id };
}

export async function authSignIn(email: string, pass: string) {
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('*, restaurants(*)')
    .eq('email', email.toLowerCase().trim())
    .eq('password', pass)
    .eq('status', 'active')
    .maybeSingle();

  if (userErr || !user) throw new Error("Invalid credentials or inactive account.");

  const { data: menu } = await supabase
    .from('menus')
    .select('id')
    .eq('restaurant_id', user.restaurant_id)
    .maybeSingle();

  return { 
    user: { id: user.id, email: user.email, role: user.role }, 
    restaurant: user.restaurants,
    defaultMenuId: menu?.id
  };
}
