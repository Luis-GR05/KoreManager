// src/supabaseClient.js
// ─────────────────────────────────────────────────────────────
// Cliente Supabase singleton. Se importa en toda la app.
// Configurado con persistencia explícita para que el token
// se guarde en localStorage y sobreviva recargas (F5).
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('[Supabase] Faltan las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Guarda el token en localStorage (ON por defecto, lo dejamos explícito)
    persistSession: true,
    // Renueva el JWT antes de que expire (evita sesiones caducadas sin avisar)
    autoRefreshToken: true,
    // Necesario para OAuth y magic-link: lee el token de la URL tras redirect
    detectSessionInUrl: true,
  },
});