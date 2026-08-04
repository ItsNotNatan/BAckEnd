import { createClient } from '@supabase/supabase-js';

// No Vite, é assim que puxamos as variáveis do arquivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Inicializa e exporta a conexão
export const supabase = createClient(supabaseUrl, supabaseAnonKey);