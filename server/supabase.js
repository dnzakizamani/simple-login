const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Inisialisasi Supabase client untuk storage
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL atau KEY tidak ditemukan. Pastikan SUPABASE_URL dan SUPABASE_ANON_KEY telah diatur di .env file.');
}
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

module.exports = { supabase };