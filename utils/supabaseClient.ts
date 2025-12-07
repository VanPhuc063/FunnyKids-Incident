import { createClient } from '@supabase/supabase-js';

// NOTE: In a real project, these should be in a .env file
// For this environment, we assume they are injected via process.env
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);