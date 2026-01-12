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

// --- Fetching Logic ---

export async function getAllRestaurants() {
  const { data, error } = await supabase.from('restaurants').select('*').order('name');
  if (error) {
    console.error("Fetch Restaurants Error:", error);
    throw error;
  }
  return data || [];
}

export async function getBranchesForRestaurant(restaurantId: string) {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name');
  if (error) {
    console.error("Fetch Branches Error:", error);
    throw error;
  }
  return data || [];
}

export async function getMenuForBranch(overrideSubdomain?: string) {
  const subdomain = overrideSubdomain || getSubdomain();
  if (!subdomain) return null;

  // 1. Get the branch info
  const { data: branch, error: branchErr } = await supabase
    .from('branches')
    .select('*')
    .eq('subdomain', subdomain)
    .maybeSingle();

  if (branchErr) throw branchErr;
  if (!branch) return { error: 'Branch not found', detectedSubdomain: subdomain };

  // 2. Get categories and items for this branch's menu
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select(`
      id, name, order_index,
      items (
        id, category_id, name, description, price, image_url, pax, serving_time, is_popular, created_at
      )
    `)
    .eq('menu_id', branch.menu_id)
    .order('order_index');

  if (catErr) throw catErr;

  return { 
    ...branch, 
    categories: categories || [] 
  };
}

// --- CRUD Operations ---

export async function insertRestaurant(name: string) {
  const { data, error } = await supabase
    .from('restaurants')
    .insert([{ name }])
    .select()
    .single();
  
  if (error) {
    console.error("Insert Restaurant Error:", error);
    const errObj = { ...error, message: error.message };
    throw errObj;
  }
  return data;
}

export async function deleteRestaurant(id: string) {
  const { error } = await supabase.from('restaurants').delete().eq('id', id);
  if (error) throw error;
}

export async function insertBranch(name: string, subdomain: string, restaurant_id: string) {
  if (!restaurant_id) throw new Error("Missing Restaurant ID context.");

  // 1. Create the Menu record first
  const { data: menu, error: menuErr } = await supabase
    .from('menus')
    .insert([{ 
      name: `${name} Menu`,
      restaurant_id: restaurant_id
    }])
    .select()
    .single();

  if (menuErr) {
    console.error("Menu Creation Error:", menuErr);
    throw { 
      message: `Menu creation failed: ${menuErr.message}`,
      details: menuErr.details,
      hint: menuErr.hint,
      code: menuErr.code 
    };
  }

  // 2. Create the Branch record linked to that Menu
  const { data: branch, error: branchErr } = await supabase
    .from('branches')
    .insert([{ 
      name, 
      subdomain: subdomain.toLowerCase().trim(), 
      restaurant_id, 
      menu_id: menu.id 
    }])
    .select()
    .single();

  if (branchErr) {
    console.error("Branch Insertion Error:", branchErr);
    throw { 
      message: `Branch link failed: ${branchErr.message}`,
      details: branchErr.details,
      hint: branchErr.hint,
      code: branchErr.code 
    };
  }
  
  return branch;
}

export async function deleteBranch(id: string) {
  const { error } = await supabase.from('branches').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertCategory(category: any) {
  const { data, error } = await supabase.from('categories').upsert(category).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertMenuItem(item: any) {
  const { data, error } = await supabase.from('items').upsert(item).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMenuItem(id: string) {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
}
