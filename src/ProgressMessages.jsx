import { useState, useEffect, useRef } from 'react';
import { GRADIENT } from './theme';

// Mensajes persuasivos que transmiten calma mientras un pedido se procesa.
// Adaptado del componente original al theme/stack de Viralizame (Tailwind +
// tokens de theme.js en vez de estilos inline propios).
const MESSAGES = {
  followers: {
    t0: [
      '¡Arrancamos! Estamos preparando todo para hacerte crecer. Relájate y disfruta.',
      'Ya pusimos tu pedido en marcha. Lo mejor está por venir.',
      'Iniciando tu campaña… prepárate para ver resultados reales.',
    ],
    t25: [
      'Todo va sobre ruedas, tu comunidad ya empezó a crecer.',
      'Vamos a buen ritmo. Cada segundo cuenta a tu favor.',
      'En plena marcha. Confía, esto apenas se pone bueno.',
    ],
    t50: [
      '¡Más de la mitad listo! Se nota que vas en serio.',
      'Avanzando con fuerza, ya casi puedes ver el resultado.',
      'Tu crecimiento está tomando forma, un poquito más de calma.',
    ],
    t75: [
      'Estamos cerrando con broche de oro. Quédate tranquilo, ya casi.',
      'Los últimos detalles siempre son los que brillan. Ya mero.',
      'Recta final. Prepárate para verlo todo listo en segundos.',
    ],
  },
  interactions: [
    'Trabajando duro para hacerte viral.',
    'Esa exposición que esperas ya va en camino.',
    'Poniéndote frente a más gente ahora mismo.',
    'Dándole el empujón que tu perfil merecía.',
  ],
  done: [
    '¡Listo! Tu crecimiento ya está en marcha.',
    '¡Hecho! Prepárate para ver la diferencia.',
    '¡Todo salió perfecto! Disfruta lo que viene.',
  ],
  doneDrip: [
    '¡Pedido confirmado! Los resultados irán llegando poco a poco.',
    '¡Todo en orden! Ya está en camino, verás cómo sube en las próximas horas.',
  ],
};

function pickIndex(len, prevIndex) {
  if (len <= 1) return 0;
  let i = Math.floor(Math.random() * len);
  if (i === prevIndex) i = (i + 1) % len;
  return i;
}

function tierOf(progress) {
  if (progress < 25) return 't0';
  if (progress < 50) return 't25';
  if (progress < 75) return 't50';
  return 't75';
}

/**
 * progress: 0–100 · mode: "followers" | "interactions" · done: entrega terminada
 * dripFeed: true si la entrega de seguidores llega poco a poco (mensaje final honesto)
 */
export default function ProgressMessages({ progress = 0, mode = 'followers', done = false, dripFeed = false, t }) {
  const [msg, setMsg] = useState('');
  const [fade, setFade] = useState(true);
  const lastKey = useRef(null);
  const lastIdx = useRef(-1);

  useEffect(() => {
    let pool;
    let key;
    if (done) {
      pool = dripFeed ? MESSAGES.doneDrip : MESSAGES.done;
      key = dripFeed ? 'doneDrip' : 'done';
    } else if (mode === 'interactions') {
      pool = MESSAGES.interactions;
      key = 'interactions';
    } else {
      const tier = tierOf(progress);
      pool = MESSAGES.followers[tier];
      key = 'followers:' + tier;
    }

    // El mensaje solo cambia al cruzar de tramo, no en cada tick del %, para
    // que no parpadee.
    if (key !== lastKey.current) {
      const idx = pickIndex(pool.length, lastIdx.current);
      lastKey.current = key;
      lastIdx.current = idx;
      setFade(false);
      const timer = setTimeout(() => {
        setMsg(pool[idx]);
        setFade(true);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [progress, mode, done, dripFeed]);

  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className="w-full">
      <div className="w-full h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: t.input }}>
        <div
          style={{
            width: (done ? 100 : pct) + '%',
            height: '100%',
            borderRadius: 999,
            background: done ? '#10B981' : GRADIENT,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-[10px] italic font-medium"
          style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.25s ease', color: done ? '#10B981' : t.muted }}
        >
          {msg}
        </span>
        <span className="text-[10px] font-bold shrink-0" style={{ color: '#F5A623' }}>{done ? '✓' : pct + '%'}</span>
      </div>
    </div>
  );
}
