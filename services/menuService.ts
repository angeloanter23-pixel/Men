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

// --- Auth Logic (Custom Table Flow) ---

/**
 * Simple Signup: Email and Password only.
 * Automatically provisions a default restaurant entity to maintain multi-tenant integrity.
 */
export async function authSignUp(email: string, pass: string) {
  // 1. Create a default Restaurant for the new user
  const defaultName = `${email.split('@')[0]}'s Kitchen`;
  const { data: rest, error: restErr } = await supabase
    .from('restaurants')
    .insert([{ name: defaultName }])
    .select()
    .single();
  
  if (restErr) throw restErr;

  // 2. Create the User linked to that Restaurant
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
    // Cleanup if user creation fails
    await supabase.from('restaurants').delete().eq('id', rest.id);
    throw userErr;
  }

  return { user, restaurant: rest };
}

export async function authSignIn(email: string, pass: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, email, restaurant_id,
      restaurants ( id, name )
    `)
    .eq('email', email.toLowerCase().trim())
    .eq('password', pass)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Invalid credentials or user not found.");

  return {
    user: { id: data.id, email: data.email, restaurant_id: data.restaurant_id },
    restaurant: data.restaurants
  };
}

// --- Enterprise Logic ---

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

// --- Fetching Logic ---

export async function getBranchesForRestaurant(restaurantId: string) {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function getMenuForBranch(overrideSubdomain?: string) {
  const subdomain = overrideSubdomain || getSubdomain();
  if (!subdomain) return null;

  const { data: branch, error: branchErr } = await supabase
    .from('branches')
    .select('*')
    .eq('subdomain', subdomain)
    .maybeSingle();

  if (branchErr) throw branchErr;
  if (!branch) return { error: 'Branch not found', detectedSubdomain: subdomain };

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

export async function deleteRestaurant(id: string) {
  const { error } = await supabase.from('restaurants').delete().eq('id', id);
  if (error) throw error;
}

export async function insertBranch(name: string, subdomain: string, restaurant_id: string) {
  const { data: menu, error: menuErr } = await supabase
    .from('menus')
    .insert([{ name: `${name} Menu`, restaurant_id }])
    .select()
    .single();

  if (menuErr) throw menuErr;

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

  if (branchErr) throw branchErr;
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
