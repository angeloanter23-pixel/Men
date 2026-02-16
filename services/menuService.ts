
import { supabase } from '../lib/supabase';
export { supabase };

/**
 * DATABASE SCHEMA REFERENCE (SQL)
 * 
 * -- Update categories table to support FontAwesome icons
 * ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;
 * 
 * -- Example update for existing data:
 * UPDATE categories SET icon = 'fa-bowl-food' WHERE name ILIKE '%main%';
 * UPDATE categories SET icon = 'fa-mug-saucer' WHERE name ILIKE '%breakfast%';
 * UPDATE categories SET icon = 'fa-glass-water' WHERE name ILIKE '%beverage%';
 * UPDATE categories SET icon = 'fa-ice-cream' WHERE name ILIKE '%dessert%';
 * UPDATE categories SET icon = 'fa-hamburger' WHERE name ILIKE '%snack%';
 */

/**
 * Generates a SHA-256 hash of a string.
 * Used for PASSWORDS ONLY (One-way).
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Reversible encryption for messages.
 */
const SECRET_KEY = 'FOODIE_v3_SECURE';
function cryptMessage(text: string): string {
    return text.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
    ).join('');
}

/**
 * Decodes a message if it contains the v3 encryption prefix.
 */
export function decodeMessage(text: string): string {
    if (text && text.startsWith('v3:')) {
        try {
            const base64 = text.substring(3);
            const raw = decodeURIComponent(atob(base64));
            return cryptMessage(raw);
        } catch (e) { return text; }
    }
    return text;
}

export async function getQRCodeByCode(token: string) {
  const { data, error } = await supabase.from('qr_codes').select('*, restaurants(*)').eq('code', token).maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    restaurant_id: data.restaurant_id,
    label: data.label,
    code: data.code,
    restaurant_name: data.restaurants?.name,
    theme: data.restaurants?.theme
  };
}

export async function getActiveSessionByQR(qrId: string) {
    const { data } = await supabase.from('table_sessions')
        .select('*')
        .eq('qr_code_id', qrId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    return data;
}

export async function getMenuByRestaurantId(restaurantId: string) {
  const { data: menu, error: menuErr } = await supabase.from('menus').select('id').eq('restaurant_id', restaurantId).maybeSingle();
  if (menuErr || !menu) return { items: [], categories: [], menu_id: null };
  
  const { data: categories } = await supabase.from('categories').select('*').eq('menu_id', menu.id).order('order_index');
  
  const { data: items, error: itemsErr } = await supabase.from('items')
    .select('*, categories(name)')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  if (itemsErr) throw itemsErr;

  const itemsWithExtras = await Promise.all((items || []).map(async (it: any) => {
    let option_groups = [];
    if (it.has_options) {
      const { data: groups } = await supabase
        .from('item_option_groups')
        .select('*, item_options(*)')
        .eq('item_id', it.id);
      
      option_groups = (groups || []).map(g => ({
        ...g,
        options: g.item_options || []
      }));
    }

    return { 
      ...it, 
      cat_name: it.categories?.name || 'Uncategorized',
      option_groups
    };
  }));

  return { 
    menu_id: menu.id,
    items: itemsWithExtras, 
    categories: categories || [] 
  };
}

export async function saveItemOptions(itemId: string, groups: any[]) {
  await supabase.from('item_option_groups').delete().eq('item_id', itemId);
  if (groups.length === 0) return;

  for (const group of groups) {
    const { data: groupData, error: groupErr } = await supabase
      .from('item_option_groups')
      .insert([{
        item_id: itemId,
        name: group.name,
        required: group.required,
        min_choices: group.min_choices,
        max_choices: group.max_choices
      }])
      .select()
      .single();

    if (groupErr) throw groupErr;

    if (group.options && group.options.length > 0) {
      const optionsPayload = group.options.map((opt: any) => ({
        option_group_id: groupData.id,
        name: opt.name,
        price: opt.price || 0
      }));
      await supabase.from('item_options').insert(optionsPayload);
    }
  }
}

export async function createManualSession(qrId: string) {
  const pin = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const { data, error } = await supabase.from('table_sessions')
    .insert([{ 
      qr_code_id: qrId, 
      session_token: crypto.randomUUID(), 
      status: 'active',
      verification_code: pin,
      pin_required: true
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function verifySessionPin(qrId: string, pin: string) {
    const { data } = await supabase.from('table_sessions')
        .select('*')
        .eq('qr_code_id', qrId)
        .eq('status', 'active')
        .eq('verification_code', pin)
        .maybeSingle();
    return data;
}

export async function getSessionStatus(sessionId: string) {
    const { data } = await supabase.from('table_sessions').select('*').eq('id', sessionId).maybeSingle();
    return data;
}

export async function updateTableSession(sessionId: string, updates: any) {
    const { data, error } = await supabase.from('table_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function endTableSession(sessionId: string) {
    const resetPin = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const resetToken = crypto.randomUUID();
    const { error } = await supabase.from('table_sessions')
        .update({ 
            status: 'ended',
            session_token: resetToken,
            verification_code: resetPin
        })
        .eq('id', sessionId);
    if (error) throw error;
}

export async function insertOrders(orders: any[]) {
  const { data, error } = await supabase.from('orders').insert(orders).select();
  if (error) throw error;
  return data;
}

export async function getMerchantOrders(restaurantId: string) {
    try {
        const { data, error } = await supabase.from('orders')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) {
        return [];
    }
}

export async function updateOrder(id: string, updates: any) {
  const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteOrder(id: string) {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
}

export async function getQRCodes(restaurantId: string) {
  const { data, error } = await supabase.from('qr_codes').select('*').eq('restaurant_id', restaurantId).order('label');
  if (error) throw error;
  return data;
}

export async function getActiveSessionsForRestaurant(restaurantId: string) {
    const { data: qrCodes } = await supabase.from('qr_codes').select('id').eq('restaurant_id', restaurantId);
    if (!qrCodes || qrCodes.length === 0) return [];
    const qrIds = qrCodes.map(q => q.id);
    const { data, error } = await supabase.from('table_sessions')
        .select('*')
        .in('qr_code_id', qrIds)
        .eq('status', 'active');
    if (error) throw error;
    return data;
}

export async function getAllTableSessionsLog() {
    const { data, error } = await supabase.from('table_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
    if (error) throw error;
    return data;
}

export async function sendLiveMessage(payload: any) {
    // Encrypt the text content before insertion
    // Use encodeURIComponent to make the string btoa-safe (ASCII only) for XOR results
    const encrypted = 'v3:' + btoa(encodeURIComponent(cryptMessage(payload.text)));
    
    const { data, error } = await supabase.from('messages').insert([{
        ...payload,
        text: encrypted
    }]).select().single();
    if (error) throw error;
    return data;
}

export async function getLiveMessages(restaurantId: string) {
    const { data, error } = await supabase.from('messages').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: true });
    if (error) throw error;
    
    // Transparently decrypt messages for the UI
    const decrypted = (data || []).map(m => ({
        ...m,
        text: decodeMessage(m.text)
    }));

    return decrypted;
}

export async function deleteConversation(sessionId: string) {
    const { error } = await supabase.from('messages').delete().eq('session_id', sessionId);
    if (error) throw error;
}

export async function authSignIn(email: string, pass: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const hashedPass = await hashString(pass);

  const { data: user, error: userErr } = await supabase.from('users')
    .select('*, restaurants(*)')
    .eq('email', normalizedEmail)
    .eq('password', hashedPass)
    .eq('status', 'active')
    .maybeSingle();

  if (userErr || !user) {
    throw new Error("Invalid credentials.");
  }
  
  return { 
    user: { id: user.id, email: user.email, role: user.role }, 
    restaurant: user.restaurants 
  };
}

export async function updateOrderTableNumber(id: string, tableNumber: string) {
    const { error } = await supabase.from('orders').update({ table_number: tableNumber }).eq('id', id);
    if (error) throw error;
}

export async function updateRestaurant(id: string, name: string) {
    const { data, error } = await supabase.from('restaurants').update({ name }).eq('id', id).select().single();
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

export async function getClientIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch (e) {
    return '127.0.0.1';
  }
}

export async function getLoginStatus(email: string, ip: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const { data } = await supabase.from('login_attempts').select('*').or(`email.eq.${normalizedEmail},ip_address.eq.${ip}`).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!data) return { attempts: 0 };
  return data;
}

export async function clearLoginAttempts(email: string, ip: string) {
  const normalizedEmail = email.toLowerCase().trim();
  await supabase.from('login_attempts').delete().or(`email.eq.${normalizedEmail},ip_address.eq.${ip}`);
}

export async function recordLoginFailure(email: string, ip: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const { data: existing } = await supabase.from('login_attempts').select('*').or(`email.eq.${normalizedEmail},ip_address.eq.${ip}`).maybeSingle();
  const attempts = (existing?.attempts || 0) + 1;
  const locked_until = attempts >= 5 ? new Date(Date.now() + 15 * 60000).toISOString() : null;
  const { data } = await supabase.from('login_attempts').upsert({
    email: normalizedEmail,
    ip_address: ip,
    attempts,
    locked_until,
    type: attempts >= 10 ? 'device' : (attempts >= 5 ? 'account' : null)
  }).select().single();
  return data;
}

export async function authSignUp(email: string, pass: string, businessName: string = 'New Restaurant') {
  const normalizedEmail = email.toLowerCase().trim();
  const hashedPass = await hashString(pass);

  const { data: rest, error: restErr } = await supabase.from('restaurants').insert([{ name: businessName }]).select().single();
  if (restErr) throw restErr;

  const { data: user, error: userErr } = await supabase.from('users').insert([{ 
    email: normalizedEmail, 
    password: hashedPass, 
    restaurant_id: rest.id,
    role: 'super-admin',
    status: 'active'
  }]).select().single();

  if (userErr) throw userErr;
  await supabase.from('menus').insert([{ restaurant_id: rest.id, name: 'Main Menu' }]);
  return { user, restaurant: rest };
}

export async function upsertMenuItem(item: any) {
  const { data, error } = await supabase.from('items').upsert(item).select().single();
  if (error) throw error;
  return data;
}

export async function updateMenuItem(id: string | number, updates: any) {
  const { data, error } = await supabase.from('items').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMenuItem(id: string | number) {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertCategory(cat: any) {
  const { data, error } = await supabase.from('categories').upsert(cat).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string | number) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertQRCode(qr: any) {
  const { data, error } = await supabase.from('qr_codes').upsert(qr).select().single();
  if (error) throw error;
  return data;
}

export async function deleteQRCode(id: string | number) {
  const { error } = await supabase.from('qr_codes').delete().eq('id', id);
  if (error) throw error;
}

export async function getFeedbacks(restaurantId: string) {
  const { data, error } = await supabase
    .from('feedbacks')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertFeedback(feedback: any) {
  const { data, error } = await supabase.from('feedbacks').upsert(feedback).select();
  if (error) return { error }; 
  return { data: data?.[0] };
}

export async function updateRestaurantTheme(id: string, theme: any) {
  const { data, error } = await supabase.from('restaurants').update({ theme }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function checkBusinessNameExists(name: string) {
  const { data } = await supabase.from('restaurants').select('id').eq('name', name).maybeSingle();
  return !!data;
}

export async function getBranchesForRestaurant(restaurantId: string) {
  const { data, error } = await supabase.from('branches').select('*').eq('restaurant_id', restaurantId);
  if (error) throw error;
  return data || [];
}

export async function getMenuForBranch(subdomain: string) {
  const { data: branch, error: bErr } = await supabase.from('branches').select('*').eq('subdomain', subdomain).maybeSingle();
  if (bErr || !branch) throw new Error("Branch not found");
  const { data: menu } = await supabase.from('menus').select('id').eq('restaurant_id', branch.restaurant_id).maybeSingle();
  if (!menu) return { ...branch, categories: [] };
  const { data: categories } = await supabase.from('categories').select('*').eq('menu_id', menu.id).order('order_index');
  const catIds = categories?.map(c => c.id) || [];
  const { data: items } = await supabase.from('items').select('*').in('category_id', catIds);
  const categoriesWithItems = categories?.map(cat => ({
    ...cat,
    items: items?.filter(i => i.category_id === cat.id) || []
  })) || [];
  return { ...branch, menu_id: menu.id, categories: categoriesWithItems };
}

export async function insertBranch(name: string, subdomain: string, restaurantId: string) {
  const { data, error } = await supabase.from('branches').insert([{ name, subdomain, restaurant_id: restaurantId }]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRestaurant(id: string) {
  const { error } = await supabase.from('restaurants').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteBranch(id: string) {
  const { error } = await supabase.from('branches').delete().eq('id', id);
  if (error) throw error;
}

export async function getStaffByRestaurantId(restaurantId: string) {
  const { data, error } = await supabase.from('users').select('*').eq('restaurant_id', restaurantId);
  if (error) throw error;
  return data || [];
}

export async function checkEmailExists(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const { data } = await supabase.from('users').select('id').eq('email', normalizedEmail).maybeSingle();
  return !!data;
}

export async function createStaffInvite(email: string, role: string, restaurantId: string) {
  const token = crypto.randomUUID();
  const normalizedEmail = email.toLowerCase().trim();
  const { data, error } = await supabase.from('staff_invites').insert([{ 
    email: normalizedEmail, 
    role, 
    restaurant_id: restaurantId, 
    invite_token: token,
    status: 'pending'
  }]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteStaffMember(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
}

export async function verifyStaffInvite(token: string) {
  const { data, error } = await supabase.from('staff_invites').select('*').eq('invite_token', token).eq('status', 'pending').maybeSingle();
  if (error) return null;
  return data;
}

export async function acceptStaffInvite(token: string, pass: string) {
  const hashedPass = await hashString(pass);
  const { data: invite, error: inviteErr } = await supabase.from('staff_invites').select('*').eq('invite_token', token).eq('status', 'pending').maybeSingle();
  if (inviteErr || !invite) throw new Error("Invite invalid or expired");
  
  const { data: user, error: userErr } = await supabase.from('users').insert([{
    email: invite.email, 
    password: hashedPass,
    restaurant_id: invite.restaurant_id,
    role: invite.role,
    status: 'active'
  }]).select().single();
  
  if (userErr) throw userErr;
  await supabase.from('staff_invites').update({ status: 'accepted' }).eq('id', invite.id);
  return user;
}
