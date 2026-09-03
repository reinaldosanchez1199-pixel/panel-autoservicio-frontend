import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { theme, GRADIENT } from './theme';

// Barra de XP tipo videojuego hacia el siguiente nivel de descuento.
export default function LevelProgress({ consumido, nivelActual, niveles, modoOscuro = true }) {
  const t = theme[modoOscuro ? 'dark' : 'light'];
  if (!niveles || niveles.length === 0) return null;

  const ordenados = [...niveles].sort((a, b) => a.minimo_consumido - b.minimo_consumido);
  const idxActual = ordenados.findIndex((n) => n.nombre === nivelActual);
  const actual = ordenados[idxActual] ?? ordenados[0];
  const siguiente = ordenados[idxActual + 1];

  const base = parseFloat(actual.minimo_consumido);
  const tope = siguiente ? parseFloat(siguiente.minimo_consumido) : base;
  const progreso = siguiente ? Math.min(100, Math.max(0, ((consumido - base) / (tope - base)) * 100)) : 100;
  const faltan = siguiente ? Math.max(0, tope - consumido) : 0;

  return (
    <div className="rounded-2xl p-4" style={{ border: `1px solid ${t.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Trophy size={13} style={{ color: '#F5A623' }} />
          <span className="text-xs font-bold">Nivel {actual.nombre}</span>
        </div>
        <span className="text-[10px] font-semibold" style={{ color: '#F5A623' }}>-{actual.descuento_pct}%</span>
      </div>

      <div className="w-full h-2.5 rounded-full overflow-hidden mb-1.5" style={{ background: t.input }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progreso}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full relative"
          style={{ background: GRADIENT }}
        >
          <div className="absolute right-0 top-0 h-full w-2 rounded-full glow-pulse" style={{ background: '#fff', opacity: 0.6 }} />
        </motion.div>
      </div>

      <p className="text-[10px]" style={{ color: t.muted }}>
        {siguiente ? (
          <>Te faltan <b style={{ color: t.text }}>{Math.round(faltan).toLocaleString()}</b> créditos usados para <b style={{ color: t.text }}>{siguiente.nombre}</b> (-{siguiente.descuento_pct}%)</>
        ) : (
          '🏆 ¡Nivel máximo alcanzado!'
        )}
      </p>
    </div>
  );
}
