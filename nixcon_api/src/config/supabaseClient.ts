import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Nota: A service_role key não deve ser exposta no lado do cliente ou em um SDK que o cliente possa acessar.
// Ela será usada em um cliente Supabase separado, instanciado apenas no backend quando privilégios elevados forem necessários.
// Por agora, este cliente é o cliente 'anon' que pode ser usado para operações que RLS permite para usuários anônimos ou autenticados.
