import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjfqlutqsxhdraoraoyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZnFsdXRxc3hoZHJhb3Jhb3liIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE0ODk0MiwiZXhwIjoyMDgzNzI0OTQyfQ.Ch5IpM7iBV_JSvtMR8qoTnx1osx4Jx11wkKIwBYKCzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.storage.listBuckets();
  console.log(data, error);
}
check();
