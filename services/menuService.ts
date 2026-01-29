import { supabase } from '../lib/supabase';
export { supabase };

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

export async function getMenuByRestaurantId(restaurantId: string) {
  const { data: menu, error: menuErr } = await supabase.from('menus').select('id').eq('restaurant_id', restaurantId).maybeSingle();
  if (menuErr || !menu) return { items: [], categories: [] };
  const { data: categories } = await supabase.from('categories').select('*').eq('menu_id', menu.id).order('order_index');
  const { data: items } = await supabase.from('items').select('*, categories(name)').in('category_id', categories?.map(c => c.id) || []).order('name');
  return { items: (items || []).map((it: any) => ({ ...it, cat_name: it.categories?.name || 'Uncategorized' })), categories: categories || [] };
}

// --- Session Logic ---

export async function ensureActiveSession(qrId: string) {
  const { data: existing } = await supabase.from('table_sessions')
    .select('*')
    .eq('qr_id', qrId)
    .eq('status', 'active')
    .maybeSingle();

  if (existing) {
    const expires = new Date(existing.verification_expires_at);
    if (new Date() > expires) {
        await endTableSession(existing.id);
    } else {
        return existing;
    }
  }

  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  const { data, error } = await supabase.from('table_sessions')
    .insert([{ 
      qr_id: qrId, 
      session_token: crypto.randomUUID(), 
      status: 'active',
      session_started_at: new Date().toISOString(),
      verification_code: pin,
      verification_expires_at: expiresAt.toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function verifySessionPin(qrId: string, pin: string) {
    const { data } = await supabase.from('table_sessions')
        .select('*')
        .eq('qr_id', qrId)
        .eq('status', 'active')
        .eq('verification_code', pin)
        .maybeSingle();
    return data;
}

export async function getSessionStatus(sessionId: string) {
    const { data } = await supabase.from('table_sessions').select('*').eq('id', sessionId).maybeSingle();
    return data;
}

export async function endTableSession(sessionId: string) {
    const { error } = await supabase.from('table_sessions')
        .update({ status: 'ended', session_ended_at: new Date().toISOString() })
        .eq('id', sessionId);
    if (error) throw error;
}

export async function resetTablePin(qrId: string) {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    const { data, error } = await supabase.from('table_sessions')
        .update({ verification_code: pin, verification_expires_at: expiresAt.toISOString() })
        .eq('qr_id', qrId)
        .eq('status', 'active')
        .select()
        .single();
    if (error) throw error;
    return data;
}

// --- Order Logic ---

export async function insertOrders(orders: any[]) {
  const { data, error } = await supabase.from('orders').insert(orders).select();
  if (error) throw error;
  return data;
}

export async function getMerchantOrders(restaurantId: string) {
    try {
        // Step 1: Get all QR codes for this restaurant
        const { data: qrCodes } = await supabase.from('qr_codes').select('id').eq('restaurant_id', restaurantId);
        if (!qrCodes || qrCodes.length === 0) return [];
        const qrIds = qrCodes.map(q => q.id);

        // Step 2: Get active sessions for those QR codes
        const { data: sessions } = await supabase.from('table_sessions').select('id').in('qr_id', qrIds).eq('status', 'active');
        if (!sessions || sessions.length === 0) return [];
        const sessionIds = sessions.map(s => s.id);

        // Step 3: Get orders for those sessions
        const { data, error } = await supabase.from('orders')
            .select('*')
            .in('session_id', sessionIds)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("Order Fetch Failure:", e);
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
        .select('*, qr_codes(label)')
        .in('qr_id', qrIds)
        .eq('status', 'active');
    if (error) throw error;
    return data;
}

export async function sendLiveMessage(payload: any) {
    const { data, error } = await supabase.from('messages').insert([payload]).select().single();
    if (error) throw error;
    return data;
}

export async function getLiveMessages(restaurantId: string) {
    const { data, error } = await supabase.from('messages').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: true });
    if (error) throw error;
    return data;
}

export async function authSignIn(email: string, pass: string) {
  const { data: user, error: userErr } = await supabase.from('users').select('*, restaurants(*)').eq('email', email.toLowerCase().trim()).eq('password', pass).eq('status', 'active').maybeSingle();
  if (userErr || !user) throw new Error("Invalid credentials.");
  return { user: { id: user.id, email: user.email, role: user.role }, restaurant: user.restaurants };
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
  const { data } = await supabase.from('login_attempts').select('*').or(`email.eq.${email},ip_address.eq.${ip}`).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!data) return { attempts: 0 };
  return data;
}

export async function clearLoginAttempts(email: string, ip: string) {
  await supabase.from('login_attempts').delete().or(`email.eq.${email},ip_address.eq.${ip}`);
}

export async function recordLoginFailure(email: string, ip: string) {
  const { data: existing } = await supabase.from('login_attempts').select('*').or(`email.eq.${email},ip_address.eq.${ip}`).maybeSingle();
  const attempts = (existing?.attempts || 0) + 1;
  const locked_until = attempts >= 5 ? new Date(Date.now() + 15 * 60000).toISOString() : null;
  
  const { data, error } = await supabase.from('login_attempts').upsert({
    email,
    ip_address: ip,
    attempts,
    locked_until,
    type: attempts >= 10 ? 'device' : (attempts >= 5 ? 'account' : null)
  }).select().single();
  return data;
}

export async function authSignUp(email: string, pass: string, businessName: string = 'New Restaurant') {
  const { data: rest, error: restErr } = await supabase.from('restaurants').insert([{ name: businessName }]).select().single();
  if (restErr) throw restErr;

  const { data: user, error: userErr } = await supabase.from('users').insert([{ 
    email: email.toLowerCase().trim(), 
    password: pass, 
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
  const { data } = await supabase.from('users').select('id').eq('email', email.toLowerCase().trim()).maybeSingle();
  return !!data;
}

export async function createStaffInvite(email: string, role: string, restaurantId: string) {
  const token = crypto.randomUUID();
  const { data, error } = await supabase.from('staff_invites').insert([{ 
    email: email.toLowerCase().trim(), 
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
  const { data: invite, error: inviteErr } = await supabase.from('staff_invites').select('*').eq('invite_token', token).eq('status', 'pending').maybeSingle();
  if (inviteErr || !invite) throw new Error("Invite invalid or expired");

  const { data: user, error: userErr } = await supabase.from('users').insert([{
    email: invite.email,
    password: pass,
    restaurant_id: invite.restaurant_id,
    role: invite.role,
    status: 'active'
  }]).select().single();
  if (userErr) throw userErr;

  await supabase.from('staff_invites').update({ status: 'accepted' }).eq('id', invite.id);
  return user;
}