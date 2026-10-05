// ============================================
// metaPixel.js — Pixel de Meta (Facebook/Instagram Ads)
// Solo se activa si VITE_META_PIXEL_ID está definido; sin ID, todo es no-op
// (no carga nada ni rompe la app).
// ============================================

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';

export function iniciarPixel() {
  if (!PIXEL_ID || typeof window === 'undefined' || window.fbq) return;

  // Snippet oficial de Meta, adaptado a módulo.
  const n = (window.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  });
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
}

// Evento estándar de Meta (CompleteRegistration, InitiateCheckout, etc.).
// Nunca lanza error: si el Pixel no está activo o está bloqueado, no pasa nada.
export function trackPixel(evento, datos) {
  try {
    if (PIXEL_ID && typeof window !== 'undefined' && window.fbq) window.fbq('track', evento, datos);
  } catch {
    // ignorar
  }
}
