// =============================================================================
// CONFIGURACIÓN DE SUPABASE — AULALAB
// =============================================================================
// 1. URL de tu proyecto de Supabase (preconfigurada)
const SUPABASE_URL = "https://lkxqgxhxyoclssovfsne.supabase.co";

// 2. Clave pública anónima (anon public key) de Supabase
// >>> PEGA AQUÍ TU CLAVE PÚBLICA DE SUPABASE <<<
// La encuentras en: Supabase Dashboard > Project Settings > API > Project API keys > anon public
const SUPABASE_ANON_KEY = "sb_publishable_CBh8narlwIKDT9PRixLezA_pglymJn1";

// Exponer en el objeto global para acceso directo desde app.js
if (typeof window !== "undefined") {
  window.SUPABASE_URL = SUPABASE_URL;
  window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SUPABASE_URL, SUPABASE_ANON_KEY };
}

