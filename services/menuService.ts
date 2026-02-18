import { supabase } from '../lib/supabase';
export { supabase };

async function hashString(str: string): Promise<string> {
  if (!window.crypto || !crypto.subtle) {
    throw new Error("Secure context required for cryptography.");
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const SECRET_KEY = 'FOODIE_v3_SECURE';
function cryptMessage(text: string): string {
    return text.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
    ).join('');
}

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
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*, restaurants(*)')
    .eq('code', token)
    .limit(1);
    
  if (error || !data || data.length === 0) return null;
  const item = data[0];
  const restaurant = Array.isArray(item.restaurants) ? item.restaurants[0] : item.restaurants;
  
  return {
    id: item.id,
    restaurant_id: item.restaurant_id,
    label: item.label,
    code: item.code,
    restaurant_name: restaurant?.name,
    theme: restaurant?.theme
  };
}

export async function getActiveSessionByQR(qrId: string) {
    const { data } = await supabase.from('table_sessions')
        .select('*')
        .eq('qr_code_id', qrId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);
    return data && data.length > 0 ? data[0] : null;
}

export async function getMenuByRestaurantId(restaurantId: string) {
  if (!restaurantId || restaurantId === "undefined") {
    return { items: [], categories: [], menu_id: null, error: "Invalid Restaurant ID" };
  }

  try {
    // 1. Get or Create Menu Registry
    let { data: menus, error: menuErr } = await supabase
        .from('menus')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(1);
    
    if (menuErr) throw menuErr;

    let menu = menus && menus.length > 0 ? menus[0] : null;

    if (!menu) {
      const { data: newMenus, error: createErr } = await supabase
        .from('menus')
        .insert({ restaurant_id: restaurantId, name: 'Main Menu' })
        .select('id');
      if (createErr) throw createErr;
      menu = newMenus && newMenus[0];
    }

    if (!menu) throw new Error("Could not initialize menu registry.");

    // 2. Bulk Fetch Categories and Items
    const [catRes, itemRes] = await Promise.all([
      supabase.from('categories').select('*').eq('menu_id', menu.id).order('order_index'),
      supabase.from('items').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false })
    ]);

    if (catRes.error) throw catRes.error;
    if (itemRes.error) throw itemRes.error;

    const categories = catRes.data || [];
    const items = itemRes.data || [];
    const itemIds = items.map(i => i.id);

    // 3. Fetch Modifiers with explicit error capture
    // This is the specific part that might fail due to ambiguous relationships or schema issues
    const { data: allGroups, error: groupsErr } = await supabase
      .from('item_option_groups')
      .select('*, item_options(*)')
      .in('item_id', itemIds);

    if (groupsErr) {
      console.error("[DATABASE DIAGNOSTIC] Failed to fetch item_option_groups join:", groupsErr);
      // Store the error globally so the UI can retrieve it if needed for a "Log" view
      (window as any)._last_db_error = groupsErr;
    } else {
      (window as any)._last_db_error = null;
    }

    // Assemble the relational data in memory
    const itemsWithExtras = items.map((it: any) => {
      const category = categories.find(c => String(c.id) === String(it.category_id));
      
      const itemGroups = (allGroups || [])
        .filter(g => String(g.item_id) === String(it.id))
        .map(g => {
          // Supabase might return item_options as 'item_options' or just 'options' depending on foreign key names
          const optionsArray = g.item_options || g.options || [];
          
          return {
            ...g,
            options: optionsArray.sort((a: any, b: any) => {
               const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
               const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
               return timeA - timeB;
            })
          };
        });

      return { 
        ...it, 
        cat_name: category ? category.name : 'Uncategorized',
        option_groups: itemGroups
      };
    });

    return { 
      menu_id: menu.id,
      items: itemsWithExtras, 
      categories: categories,
      db_error: groupsErr 
    };
  } catch (err: any) {
    console.error("[CRITICAL ERROR] Menu service failed:", err.message);
    return { items: [], categories: [], menu_id: null, error: err.message };
  }
}

export async function authSignIn(email: string, pass: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const hashedPass = await hashString(pass);
  const { data: users, error: userErr } = await supabase.from('users')
    .select('*, restaurants(*)')
    .eq('email', normalizedEmail)
    .eq('password', hashedPass)
    .limit(1);
    
  if (userErr) throw userErr;
  if (!users || users.length === 0) throw new Error("Invalid credentials.");
  
  const user = users[0];
  if (user.status !== 'active') throw new Error("Account inactive.");
  
  const restaurant = Array.isArray(user.restaurants) ? user.restaurants[0] : user.restaurants;
  
  return { 
    user: { id: user.id, email: user.email, role: user.role }, 
    restaurant: restaurant 
  };
}

export async function insertOrders(orders: any[]) {
  const { data, error } = await supabase.from('orders').insert(orders).select();
  if (error) throw error;
  return data;
}

export async function getMerchantOrders(restaurantId: string) {
    const { data, error } = await supabase.from('orders').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function updateOrder(id: string, updates: any) {
  const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select();
  if (error) throw error;
  return data && data[0];
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
    const { data, error } = await supabase.from('table_sessions').select('*').in('qr_code_id', qrIds).eq('status', 'active');
    if (error) throw error;
    return data;
}

export async function sendLiveMessage(payload: any) {
    const encrypted = 'v3:' + btoa(encodeURIComponent(cryptMessage(payload.text)));
    const { data, error } = await supabase.from('messages').insert([{ ...payload, text: encrypted }]).select();
    if (error) throw error;
    return data && data[0];
}

export async function getLiveMessages(restaurantId: string) {
    const { data, error } = await supabase.from('messages').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(m => ({ ...m, text: decodeMessage(m.text) }));
}

export async function deleteConversation(sessionId: string) {
    const { error } = await supabase.from('messages').delete().eq('session_id', sessionId);
    if (error) throw error;
}

export async function updateRestaurant(id: string, name: string) {
    const { data, error } = await supabase.from('restaurants').update({ name }).eq('id', id).select();
    if (error) throw error;
    return data && data[0];
}

export async function getOrdersByTable(restaurantId: string, tableNumber: string) {
    const { data, error } = await supabase.from('orders').select('*').eq('restaurant_id', restaurantId).eq('table_number', tableNumber).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function getClientIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch (e) { return '127.0.0.1'; }
}

export async function getLoginStatus(email: string, ip: string) {
  const { data } = await supabase.from('login_attempts')
    .select('*')
    .or(`email.eq.${email},ip_address.eq.${ip}`)
    .order('created_at', { ascending: false })
    .limit(1);
  return (data && data.length > 0) ? data[0] : { attempts: 0 };
}

export async function clearLoginAttempts(email: string, ip: string) {
  await supabase.from('login_attempts').delete().or(`email.eq.${email},ip_address.eq.${ip}`);
}

export async function recordLoginFailure(email: string, ip: string) {
  const { data } = await supabase.from('login_attempts')
    .select('*')
    .or(`email.eq.${email},ip_address.eq.${ip}`)
    .limit(1);
  
  const existing = data && data[0];
  const attempts = (existing?.attempts || 0) + 1;
  const locked_until = attempts >= 5 ? new Date(Date.now() + 15 * 60000).toISOString() : null;
  await supabase.from('login_attempts').upsert({ email, ip_address: ip, attempts, locked_until });
}

export async function upsertMenuItem(item: any) {
  const { data, error } = await supabase.from('items').upsert(item).select();
  if (error) throw error;
  return data && data[0];
}

export async function bulkUpdateItemPayment(restaurantId: string, payFirst: boolean) {
    const { error } = await supabase
        .from('items')
        .update({ pay_as_you_order: payFirst })
        .eq('restaurant_id', restaurantId);
    if (error) throw error;
}

export async function deleteMenuItem(id: string | number) {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertCategory(cat: any, restaurantId?: string) {
  let target_menu_id = cat.menu_id;

  if (!target_menu_id && restaurantId) {
    const { data: menus } = await supabase.from('menus').select('id').eq('restaurant_id', restaurantId).limit(1);
    if (menus && menus.length > 0) {
      target_menu_id = menus[0].id;
    } else {
      const { data: newMenus } = await supabase.from('menus').insert({ 
        restaurant_id: restaurantId,
        name: 'Main Menu' 
      }).select('id');
      target_menu_id = newMenus && newMenus[0]?.id;
    }
  }

  if (!target_menu_id) throw new Error("Missing Menu Registry Link");

  const { data, error } = await supabase.from('categories').upsert({ ...cat, menu_id: target_menu_id }).select();
  if (error) throw error;
  return data && data[0];
}

export async function deleteCategory(id: string | number) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertQRCode(qr: any) {
  const { data, error } = await supabase.from('qr_codes').upsert(qr).select();
  if (error) throw error;
  return data && data[0];
}

export async function bulkUpsertQRCodes(qrArray: any[]) {
    const { data, error } = await supabase.from('qr_codes').insert(qrArray).select();
    if (error) throw error;
    return data;
}

export async function deleteQRCode(id: string | number) {
  const { error } = await supabase.from('qr_codes').delete().eq('id', id);
  if (error) throw error;
}

export async function getFeedbacks(restaurantId: string) {
  const { data, error } = await supabase.from('feedbacks').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertFeedback(feedback: any) {
  const { data, error } = await supabase.from('feedbacks').upsert(feedback).select();
  if (error) return { error }; 
  return { data: data?.[0] };
}

export async function updateRestaurantTheme(id: string, theme: any) {
  const { data, error } = await supabase.from('restaurants').update({ theme }).eq('id', id).select();
  if (error) throw error;
  return data && data[0];
}

export async function checkBusinessNameExists(name: string) {
  const { data } = await supabase.from('restaurants').select('id').eq('name', name).limit(1);
  return data && data.length > 0;
}

export async function getBranchesForRestaurant(restaurantId: string) {
  const { data, error } = await supabase.from('branches').select('*').eq('restaurant_id', restaurantId);
  if (error) throw error;
  return data || [];
}

export async function getMenuForBranch(subdomain: string) {
  const { data: branches, error: bErr } = await supabase.from('branches').select('*').eq('subdomain', subdomain).limit(1);
  if (bErr || !branches || branches.length === 0) throw new Error("Branch not found");
  const branch = branches[0];
  
  const { data: menus } = await supabase.from('menus').select('id').eq('restaurant_id', branch.restaurant_id).limit(1);
  if (!menus || menus.length === 0) return { ...branch, categories: [] };
  const menu = menus[0];

  const { data: categories } = await supabase.from('categories').select('*').eq('menu_id', menu.id).order('order_index');
  const catIds = categories?.map(c => c.id) || [];
  const { data: items } = await supabase.from('items').select('*').in('category_id', catIds);
  const categoriesWithItems = categories?.map(cat => ({ ...cat, items: items?.filter(i => i.category_id === cat.id) || [] })) || [];
  return { ...branch, menu_id: menu.id, categories: categoriesWithItems };
}

export async function insertBranch(name: string, subdomain: string, restaurantId: string) {
  const { data, error } = await supabase.from('branches').insert([{ name, subdomain, restaurant_id: restaurantId }]).select();
  if (error) throw error;
  return data && data[0];
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
  const { data } = await supabase.from('users').select('id').eq('email', email.toLowerCase().trim()).limit(1);
  return data && data.length > 0;
}

export async function createStaffInvite(email: string, role: string, restaurantId: string) {
  const token = crypto.randomUUID();
  const { data, error } = await supabase.from('staff_invites').insert([{ email: email.toLowerCase().trim(), role, restaurant_id: restaurantId, invite_token: token, status: 'pending' }]).select();
  if (error) throw error;
  return data && data[0];
}

export async function deleteStaffMember(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
}

export async function verifyStaffInvite(token: string) {
  const { data, error } = await supabase.from('staff_invites').select('*').eq('invite_token', token).eq('status', 'pending').limit(1);
  if (error || !data || data.length === 0) return null;
  return data[0];
}

export async function acceptStaffInvite(token: string, pass: string) {
  const hashedPass = await hashString(pass);
  const { data: invites, error: inviteErr } = await supabase.from('staff_invites').select('*').eq('invite_token', token).eq('status', 'pending').limit(1);
  if (inviteErr || !invites || invites.length === 0) throw new Error("Invite invalid or expired");
  const invite = invites[0];
  
  const { data: users, error: userErr } = await supabase.from('users').insert([{ email: invite.email, password: hashedPass, restaurant_id: invite.restaurant_id, role: invite.role, status: 'active' }]).select();
  if (userErr) throw userErr;
  await supabase.from('staff_invites').update({ status: 'accepted' }).eq('id', invite.id);
  return users && users[0];
}

export async function getSessionStatus(sessionId: string) {
    const { data } = await supabase.from('table_sessions').select('*').eq('id', sessionId).limit(1);
    return data && data.length > 0 ? data[0] : null;
}

export async function verifySessionPin(qrId: string, pin: string) {
  const { data, error } = await supabase.from('table_sessions')
    .select('*')
    .eq('qr_code_id', qrId)
    .eq('verification_code', pin)
    .eq('status', 'active')
    .limit(1);
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

export async function saveItemOptions(itemId: string | number, optionGroups: any[]) {
  await supabase.from('item_option_groups').delete().eq('item_id', itemId);

  for (const group of optionGroups) {
    const { data, error: gErr } = await supabase.from('item_option_groups').insert([{
      item_id: itemId,
      name: group.name,
      required: group.required,
      min_choices: group.min_choices,
      max_choices: group.max_choices
    }]).select();

    if (gErr) throw gErr;
    const gData = data && data[0];

    if (gData && group.options && group.options.length > 0) {
      const optionsToInsert = group.options.map((opt: any) => ({
        option_group_id: gData.id,
        name: opt.name,
        price: opt.price
      }));
      const { error: oErr } = await supabase.from('item_options').insert(optionsToInsert);
      if (oErr) throw oErr;
    }
  }
}

export async function authSignUp(email: string, pass: string) {
  const hashedPass = await hashString(pass);
  const { data, error: restErr } = await supabase.from('restaurants').insert([{ name: 'New Restaurant', theme: { primary_color: '#FF6B00', secondary_color: '#FFF3E0', font_family: 'Plus Jakarta Sans', template: 'classic', feedback_metrics: ["Cleanliness", "Food Quality", "Speed", "Service", "Value", "Experience"] } }]).select();
  if (restErr) throw restErr;
  const restaurant = data && data[0];

  const { data: users, error: userErr } = await supabase.from('users').insert([{ email: email.toLowerCase().trim(), password: hashedPass, restaurant_id: restaurant.id, role: 'super-admin', status: 'active' }]).select();
  if (userErr) { await supabase.from('restaurants').delete().eq('id', restaurant.id); throw userErr; }
  const user = users && users[0];

  await supabase.from('menus').insert([{ restaurant_id: restaurant.id, name: 'Main Menu' }]);
  return { user: { id: user.id, email: user.email, role: user.role }, restaurant };
}

export async function endTableSession(sessionId: string) {
  const { error } = await supabase.from('table_sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', sessionId);
  if (error) throw error;
}

export async function updateTableSession(sessionId: string, updates: any) {
  const { error } = await supabase.from('table_sessions').update(updates).eq('id', sessionId);
  if (error) throw error;
}

export async function createManualSession(qrId: string) {
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const { data, error } = await supabase.from('table_sessions').insert([{ qr_code_id: qrId, verification_code: pin, status: 'active', pin_required: true }]).select();
  if (error) throw error;
  return data && data[0];
}

export async function updateUserPassword(userId: string, newPass: string) {
  const hashed = await hashString(newPass);
  const { error } = await supabase.from('users').update({ password: hashed }).eq('id', userId);
  if (error) throw error;
}

export async function terminateAccount(userId: string, restaurantId: string) {
  await supabase.from('users').delete().eq('id', userId);
  await supabase.from('restaurants').delete().eq('id', restaurantId);
}

export async function getRawTableData(tableName: string, restaurantId: string, bypassFilter: boolean = false) {
    const directTables = ['items', 'orders', 'qr_codes', 'messages', 'branches', 'menus', 'users', 'feedbacks'];
    
    if (directTables.includes(tableName)) {
        let query = supabase.from(tableName).select('*');
        if (!bypassFilter) {
            query = query.eq('restaurant_id', restaurantId);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }
    
    if (tableName === 'item_option_groups') {
        let query = supabase.from('item_option_groups').select('*, items!inner(restaurant_id)');
        if (!bypassFilter) {
            query = query.eq('items.restaurant_id', restaurantId);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    if (tableName === 'item_options') {
        let query = supabase.from('item_options').select('*, item_option_groups!inner(items!inner(restaurant_id))');
        if (!bypassFilter) {
            query = query.eq('item_option_groups.items.restaurant_id', restaurantId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    if (tableName === 'categories') {
        let query = supabase.from('categories').select('*, menus!inner(restaurant_id)');
        if (!bypassFilter) {
            query = query.eq('menus.restaurant_id', restaurantId);
        }
        const { data, error } = await query.order('order_index', { ascending: true });
        if (error) throw error;
        return data;
    }

    if (tableName === 'table_sessions') {
        let query = supabase.from('table_sessions').select('*, qr_codes!inner(restaurant_id)');
        if (!bypassFilter) {
            query = query.eq('qr_codes.restaurant_id', restaurantId);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    const { data, error } = await supabase.from(tableName).select('*').limit(100);
    if (error) throw error;
    return data;
}