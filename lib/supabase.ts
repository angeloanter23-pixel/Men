
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjfqlutqsxhdraoraoyb.supabase.co';

/**
 * SECURITY NOTE: The key provided is a 'service_role' key. 
 * While this bypasses Row Level Security (RLS) for testing purposes, 
 * in a production environment you should use the 'anon' key for frontend applications.
 */
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZnFsdXRxc3hoZHJhb3Jhb3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE0ODk0MiwiZXhwIjoyMDgzNzI0OTQyfQ.Ch5IpM7iBV_JSvtMR8qoTnx1osx4Jx11wkKIwBYKCzM';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-application-name': 'foodie-premium-spa' }
  }
});
