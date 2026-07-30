require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("⚠️ Faltam as variáveis de ambiente do Supabase no .env do backend!");
}

// Inicializa a conexão
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;