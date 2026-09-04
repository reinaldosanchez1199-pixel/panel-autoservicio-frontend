import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, RefreshCw, CheckCircle2, Clock, XCircle, Undo2, Repeat, Link2 } from 'lucide-react';
import { GRADIENT } from './theme';
import ProgressMessages from './ProgressMessages';

const ESTADO_INFO = {
  completado: { icon: CheckCircle2, color: '#10B981', label: 'Completado' },
  procesando: { icon: Clock, color: '#F5A623', label: 'Procesando' },
  pendiente: { icon: Clock, color: '#F5A623', label: 'Pendiente' },
  error: { icon: XCircle, color: '#EC4899', label: 'Error' },
  reembolsado: { icon: Undo2, color: '#8B7FB8', label: 'Reembolsado' },
};

// Calcula el % real de entrega usando lo que reporta el proveedor (restantes_proveedor)
// contra la cantidad realmente pedida al proveedor (incluye el +10% de seguidores) —
// nunca contra la cantidad que ve el cliente, porque el % arrancaría en negativo.
function calcularProgreso(item) {
  if (item.restantes_proveedor == null) return 0;
  const base = item.cantidad_enviada_proveedor || item.cantidad;
  if (!base) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - item.restantes_proveedor / base) * 100)));
}

function ItemRefillButton({ item, onRefill, t }) {
  const [enviando, setEnviando] = useState(false);
  if (!item.soporta_refill || item.estado !== 'completado') return null;

  if (item.refill_solicitado_en) {
    return <span className="text-[10px] font-semibold" style={{ color: '#8B7FB8' }}>Reposición solicitada</span>;
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={enviando}
      onClick={async () => {
        setEnviando(true);
        await onRefill(item.id);
        setEnviando(false);
      }}
      className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: GRADIENT, color: '#fff', opacity: enviando ? 0.6 : 1 }}
    >
      <RefreshCw size={10} /> {enviando ? 'Enviando...' : 'Solicitar reposición'}
    </motion.button>
  );
}

// No existe "cancelar" un pedido — esta es la única acción disponible después
// de un envío ya completado: repetirlo tal cual (mismo servicio, link y
// cantidad), con un toque de confirmación antes de descontar créditos de nuevo.
function RepetirEnvioButton({ item, onRepetir, t }) {
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  if (item.estado !== 'completado') return null;

  if (confirmando) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px]" style={{ color: t.muted }}>
          ¿Repetir? Se descontarán ~{Number(item.costo_creditos).toLocaleString()} ♦
        </span>
        <button
          disabled={enviando}
          onClick={async () => {
            setEnviando(true);
            setError('');
            try {
              await onRepetir(item.id);
              setConfirmando(false);
            } catch (err) {
              setError(err.message);
            } finally {
              setEnviando(false);
            }
          }}
          className="text-[10px] font-bold px-2 py-1 rounded-full"
          style={{ background: GRADIENT, color: '#fff', opacity: enviando ? 0.6 : 1 }}
        >
          {enviando ? '...' : 'Sí'}
        </button>
        <button onClick={() => { setConfirmando(false); setError(''); }} className="text-[10px] font-medium" style={{ color: t.muted }}>
          No
        </button>
        {error && (
          <span className="text-[10px] font-semibold" style={{ color: '#EC4899' }}>
            {error.toLowerCase().includes('saldo') ? 'Sin créditos suficientes — recarga para repetir' : error}
          </span>
        )}
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setConfirmando(true)}
      className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }}
    >
      <Repeat size={10} /> Repetir envío
    </motion.button>
  );
}

export default function Pedidos({ ordenes, cargandoOrdenes, onRefill, onRepetir, t }) {
  if (cargandoOrdenes || ordenes === null) {
    return <p className="text-xs py-10 text-center" style={{ color: t.muted }}>Cargando tus pedidos...</p>;
  }

  if (ordenes.length === 0) {
    return (
      <div className="rounded-3xl p-10 text-center" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}>
        <Package size={28} style={{ color: t.muted, margin: '0 auto 10px' }} />
        <p className="text-sm" style={{ color: t.muted }}>Todavía no has lanzado ninguna campaña.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-6">
      {ordenes.map((o, i) => {
        const info = ESTADO_INFO[o.estado] || ESTADO_INFO.pendiente;
        const Icon = info.icon;
        return (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.3) }}
            className="rounded-2xl p-4"
            style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Icon size={13} style={{ color: info.color }} />
                <span className="text-xs font-bold" style={{ color: info.color }}>{info.label}</span>
                <span className="text-[10px]" style={{ color: t.muted }}>· {new Date(o.creado_en).toLocaleDateString()}</span>
              </div>
              <span className="font-display font-bold text-sm">{Number(o.costo_total_creditos).toLocaleString()} ♦</span>
            </div>
            {o.link_cliente && (
              <a
                href={o.link_cliente} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-[10px] mb-3 truncate"
                style={{ color: t.muted }}
              >
                <Link2 size={10} className="shrink-0" /> <span className="truncate">{o.link_cliente}</span>
              </a>
            )}
            <div className="space-y-2">
              {o.items.map((item) => {
                const itemInfo = ESTADO_INFO[item.estado] || ESTADO_INFO.pendiente;
                const esSeguidores = /segui/i.test(item.tipo);
                return (
                  <div key={item.id} className="px-3 py-2.5 rounded-xl" style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="text-xs font-medium">{item.nombre_publico}</p>
                        {item.estado !== 'procesando' && (
                          <p className="text-[10px]" style={{ color: itemInfo.color }}>{item.cantidad.toLocaleString()} · {itemInfo.label}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ItemRefillButton item={item} onRefill={onRefill} t={t} />
                        <RepetirEnvioButton item={item} onRepetir={onRepetir} t={t} />
                      </div>
                    </div>
                    {item.estado === 'procesando' && (
                      <ProgressMessages
                        progress={calcularProgreso(item)}
                        mode={esSeguidores ? 'followers' : 'interactions'}
                        dripFeed={esSeguidores}
                        t={t}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
