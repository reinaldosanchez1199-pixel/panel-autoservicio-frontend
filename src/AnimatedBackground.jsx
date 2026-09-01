// Fondo con blobs de gradiente en movimiento lento + grano sutil.
// Puramente decorativo — position: fixed, no interactivo (pointer-events: none).
export default function AnimatedBackground({ modoOscuro }) {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      <style>{`
        @keyframes driftA { 0%,100% { transform: translate(-5%, -8%) scale(1); } 50% { transform: translate(8%, 5%) scale(1.15); } }
        @keyframes driftB { 0%,100% { transform: translate(10%, 10%) scale(1.1); } 50% { transform: translate(-8%, -6%) scale(0.95); } }
        @keyframes driftC { 0%,100% { transform: translate(0%, 5%) scale(1); } 50% { transform: translate(-10%, -10%) scale(1.2); } }
      `}</style>
      <div
        style={{
          position: 'absolute', width: '55vw', height: '55vw', top: '-15%', left: '-10%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.35), transparent 70%)',
          filter: 'blur(60px)', animation: 'driftA 22s ease-in-out infinite',
          opacity: modoOscuro ? 1 : 0.5,
        }}
      />
      <div
        style={{
          position: 'absolute', width: '50vw', height: '50vw', top: '20%', right: '-15%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.3), transparent 70%)',
          filter: 'blur(60px)', animation: 'driftB 26s ease-in-out infinite',
          opacity: modoOscuro ? 1 : 0.45,
        }}
      />
      <div
        style={{
          position: 'absolute', width: '45vw', height: '45vw', bottom: '-15%', left: '20%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.28), transparent 70%)',
          filter: 'blur(60px)', animation: 'driftC 30s ease-in-out infinite',
          opacity: modoOscuro ? 1 : 0.4,
        }}
      />
    </div>
  );
}
