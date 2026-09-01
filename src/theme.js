// ============================================
// theme.js — sistema visual compartido
// Estética: plataforma de crecimiento con IA (2026), no un panel SMM.
// ============================================

export const GRADIENT = 'linear-gradient(135deg, #7C3AED 0%, #EC4899 55%, #06B6D4 100%)';
export const GRADIENT_SOFT = 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(236,72,153,0.18), rgba(6,182,212,0.18))';
export const GOLD_GRADIENT = 'linear-gradient(135deg, #FFE9A8, #F5C542, #C98A1F)';

export const theme = {
  dark: {
    bg: '#0A0918',
    surface: 'rgba(255,255,255,0.045)',
    surfaceSolid: '#141229',
    sidebar: 'rgba(10,9,24,0.7)',
    border: 'rgba(255,255,255,0.09)',
    borderStrong: 'rgba(255,255,255,0.16)',
    text: '#F3F1FC',
    muted: '#9B93C4',
    input: 'rgba(255,255,255,0.035)',
    inputBorder: 'rgba(255,255,255,0.1)',
  },
  light: {
    bg: '#F7F6FD',
    surface: 'rgba(255,255,255,0.75)',
    surfaceSolid: '#FFFFFF',
    sidebar: 'rgba(255,255,255,0.8)',
    border: 'rgba(30,20,80,0.08)',
    borderStrong: 'rgba(30,20,80,0.14)',
    text: '#1B1533',
    muted: '#6E6690',
    input: 'rgba(30,20,80,0.035)',
    inputBorder: 'rgba(30,20,80,0.1)',
  },
};

export const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap');";
