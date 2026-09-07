// ============================================
// plataformas.js — constantes de plataforma compartidas entre Dashboard e
// Impulsar (evita un import circular entre ambos).
// ============================================

// El valor interno sigue siendo "Twitter" (coincide con la columna plataforma
// en la base de datos y con SERVICIOS_SEGUIDOS) — solo cambia lo que se le
// muestra al cliente, ya que hoy la plataforma se llama X.
export const ETIQUETA_PLATAFORMA = { Twitter: 'Twitter (X)' };
export const etiquetaPlataforma = (p) => ETIQUETA_PLATAFORMA[p] || p;

export const PLATAFORMA_COLOR = {
  Instagram: '#EC4899',
  TikTok: '#06B6D4',
  Facebook: '#7C3AED',
  Twitter: '#38BDF8',
  YouTube: '#F5A623',
};
