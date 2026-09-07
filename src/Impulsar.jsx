import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Plus, Trash2, Rocket, Link2, Users, Heart, Sparkles } from 'lucide-react';
import { GRADIENT, GRADIENT_SOFT } from './theme';
import { PLATAFORMA_COLOR, etiquetaPlataforma } from './plataformas';

const PLATAFORMAS_IMPULSAR = ['Instagram', 'TikTok', 'Facebook', 'YouTube'];
const MAX_PUBLICACIONES = 10;
const MAX_CUENTAS = 5;

// Mismas bandas de descuento por volumen que el resto de la app (Dashboard.jsx
// / wallet.js) — se duplica aquí solo para el estimado en vivo; el backend es
// quien de verdad cobra el pedido.
const BANDAS_DESCUENTO_CANTIDAD = {
  Seguidores: [{ hasta: 2000, tramo: 500, pct: 3 }, { hasta: 5000, tramo: 2000, pct: 5 }, { hasta: Infinity, tramo: 5000, pct: 7 }],
  Likes: [{ hasta: 2000, tramo: 500, pct: 3 }, { hasta: 5000, tramo: 2000, pct: 5 }, { hasta: Infinity, tramo: 5000, pct: 7 }],
  Reproducciones: [{ hasta: 20000, tramo: 4000, pct: 3 }, { hasta: 50000, tramo: 20000, pct: 5 }, { hasta: Infinity, tramo: 50000, pct: 7 }],
};
const TOPE_DESCUENTO_CANTIDAD = 35;
function descuentoPorCantidad(tipo, cantidad) {
  const bandas = BANDAS_DESCUENTO_CANTIDAD[tipo];
  if (!bandas) return 0;
  let descuento = 0, desde = 0;
  for (const banda of bandas) {
    const tramoCubierto = Math.min(cantidad, banda.hasta) - desde;
    if (tramoCubierto > 0) descuento += Math.floor(tramoCubierto / banda.tramo) * banda.pct;
    if (cantidad <= banda.hasta) break;
    desde = banda.hasta;
  }
  return Math.min(TOPE_DESCUENTO_CANTIDAD, descuento);
}

function celebrar() {
  confetti({ particleCount: 90, spread: 75, origin: { y: 0.7 }, colors: ['#7C3AED', '#EC4899', '#06B6D4', '#F5C542'] });
}

let contadorId = 0;
const nuevoId = () => `f${Date.now()}-${contadorId++}`;

// Métricas que se pueden pedir por publicación. "combo" marca las 4 que,
// juntas, activan el 20% de descuento (ver TIPOS_COMBO_PUBLICACION y la
// misma regla espejo en wallet.js/crearPedido — el backend es quien de
// verdad aplica el descuento, esto es solo el estimado en vivo).
const METRICAS_PUBLICACION = [
  { key: 'likes', tipo: 'Likes', label: 'Likes', combo: true },
  { key: 'guardados', tipo: 'Guardados', label: 'Guardados', combo: true },
  { key: 'compartidos', tipo: 'Compartidos', label: 'Compartidos', combo: true },
  { key: 'repost', tipo: 'Reposts', label: 'Repost', combo: true },
  { key: 'reproducciones', tipo: 'Reproducciones', label: 'Reproducciones', combo: false },
];
const TIPOS_COMBO_PUBLICACION = METRICAS_PUBLICACION.filter((m) => m.combo).map((m) => m.tipo);

function filaPublicacionVacia() {
  return { id: nuevoId(), link: '', plataforma: 'Instagram', likes: '', reproducciones: '', guardados: '', compartidos: '', repost: '' };
}
function filaCuentaVacia() {
  return { id: nuevoId(), link: '', plataforma: 'Instagram', cantidad: '' };
}

// Elige un servicio "por defecto" razonable para plataforma+tipo cuando hay
// varias variantes (ej. Instagram tiene Likes Universales/Latinos/F/M) —
// prioriza el "Universal" para no forzar al cliente a elegir audiencia aquí.
function servicioPorDefecto(servicios, plataforma, tipo) {
  const candidatos = servicios.filter((s) => s.plataforma === plataforma && s.tipo === tipo);
  if (candidatos.length === 0) return null;
  return candidatos.find((s) => /universal/i.test(s.nombre_publico)) || candidatos[0];
}

function InputCantidad({ value, onChange, placeholder, min, t }) {
  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-xl text-xs outline-none"
      style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }}
      title={min ? `Mínimo ${min.toLocaleString()}` : undefined}
    />
  );
}

export default function Impulsar({ servicios, wallet, t, onCrear }) {
  const [tab, setTab] = useState('publicaciones');
  const [filasPub, setFilasPub] = useState([filaPublicacionVacia(), filaPublicacionVacia(), filaPublicacionVacia()]);
  const [filasCta, setFilasCta] = useState([filaCuentaVacia(), filaCuentaVacia()]);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const descuentoNivel = parseFloat(wallet?.descuento_pct || 0);

  const costoItem = (tipo, cantidad, precio) => {
    if (!cantidad || cantidad <= 0) return 0;
    const descuentoTotal = Math.min(45, descuentoNivel + descuentoPorCantidad(tipo, cantidad));
    const base = (cantidad / 1000) * parseFloat(precio);
    return Math.max(1, Math.round(base * (1 - descuentoTotal / 100)));
  };

  // ---- Publicaciones ----
  // Por fila: qué servicio real corresponde a cada métrica en la plataforma
  // elegida, y qué cantidades tiene cargadas cada una (ya parseadas a número).
  const filasPubConServicios = useMemo(
    () =>
      filasPub.map((f) => {
        const metricas = METRICAS_PUBLICACION.map((m) => ({
          ...m,
          servicio: servicioPorDefecto(servicios, f.plataforma, m.tipo),
          cantidad: parseInt(f[m.key]) || 0,
        }));
        const comboListo = metricas
          .filter((m) => m.combo)
          .every((m) => m.servicio && m.cantidad >= (m.servicio.cantidad_min || 1));
        return { ...f, metricas, comboListo };
      }),
    [filasPub, servicios]
  );

  const totalPub = useMemo(() => {
    let total = 0;
    for (const f of filasPubConServicios) {
      if (!f.link.trim()) continue;
      let subtotal = 0;
      for (const m of f.metricas) {
        if (m.servicio && m.cantidad > 0) subtotal += costoItem(m.tipo, m.cantidad, m.servicio.precio_creditos_por_1000);
      }
      total += f.comboListo ? Math.round(subtotal * 0.80) : subtotal;
    }
    return total;
  }, [filasPubConServicios, descuentoNivel]);

  const actualizarFilaPub = (id, campo, valor) =>
    setFilasPub((prev) => prev.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)));
  const agregarFilaPub = () => setFilasPub((prev) => (prev.length >= MAX_PUBLICACIONES ? prev : [...prev, filaPublicacionVacia()]));
  const quitarFilaPub = (id) => setFilasPub((prev) => (prev.length <= 1 ? prev : prev.filter((f) => f.id !== id)));

  const lanzarPublicaciones = async () => {
    const filas = [];
    for (const f of filasPubConServicios) {
      if (!f.link.trim()) continue;
      const items = f.metricas
        .filter((m) => m.servicio && m.cantidad >= (m.servicio.cantidad_min || 1))
        .map((m) => ({ serviceId: m.servicio.id, cantidad: m.cantidad }));
      if (items.length > 0) filas.push({ link: f.link.trim(), items });
    }
    if (filas.length === 0) {
      setResultado({ error: 'Agrega al menos un link con alguna cantidad válida.' });
      return;
    }
    setEnviando(true);
    setResultado(null);
    try {
      const r = await onCrear(filas);
      setResultado(r);
      if (r.ok > 0) {
        celebrar();
        setFilasPub([filaPublicacionVacia(), filaPublicacionVacia(), filaPublicacionVacia()]);
      }
    } finally {
      setEnviando(false);
    }
  };

  // ---- Cuentas ----
  const filasCtaConServicio = useMemo(
    () => filasCta.map((f) => ({ ...f, servicio: servicioPorDefecto(servicios, f.plataforma, 'Seguidores') })),
    [filasCta, servicios]
  );

  const totalCta = useMemo(() => {
    let total = 0;
    for (const f of filasCtaConServicio) {
      if (!f.link.trim() || !f.servicio) continue;
      const cantidad = parseInt(f.cantidad) || 0;
      if (cantidad > 0) total += costoItem('Seguidores', cantidad, f.servicio.precio_creditos_por_1000);
    }
    return total;
  }, [filasCtaConServicio, descuentoNivel]);

  const actualizarFilaCta = (id, campo, valor) =>
    setFilasCta((prev) => prev.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)));
  const agregarFilaCta = () => setFilasCta((prev) => (prev.length >= MAX_CUENTAS ? prev : [...prev, filaCuentaVacia()]));
  const quitarFilaCta = (id) => setFilasCta((prev) => (prev.length <= 1 ? prev : prev.filter((f) => f.id !== id)));

  const lanzarCuentas = async () => {
    const filas = [];
    for (const f of filasCtaConServicio) {
      if (!f.link.trim() || !f.servicio) continue;
      const cantidad = parseInt(f.cantidad) || 0;
      if (cantidad >= (f.servicio.cantidad_min || 1)) filas.push({ link: f.link.trim(), items: [{ serviceId: f.servicio.id, cantidad }] });
    }
    if (filas.length === 0) {
      setResultado({ error: 'Agrega al menos una cuenta con una cantidad de seguidores válida.' });
      return;
    }
    setEnviando(true);
    setResultado(null);
    try {
      const r = await onCrear(filas);
      setResultado(r);
      if (r.ok > 0) {
        celebrar();
        setFilasCta([filaCuentaVacia(), filaCuentaVacia()]);
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6 mb-6">
      <div className="rounded-3xl p-6" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Rocket size={16} style={{ color: '#EC4899' }} />
          <h2 className="font-display font-bold text-lg">Impulsar en lote</h2>
        </div>
        <p className="text-xs mb-4" style={{ color: t.muted }}>
          Impulsa varias publicaciones o cuentas a la vez. Solo llena las filas que necesites, el resto se ignoran.
        </p>

        <div className="flex gap-2 mb-5">
          {[
            { id: 'publicaciones', label: 'Publicaciones', icon: Heart },
            { id: 'cuentas', label: 'Cuentas', icon: Users },
          ].map((opt) => {
            const activa = tab === opt.id;
            const Icono = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => { setTab(opt.id); setResultado(null); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold"
                style={{ background: activa ? GRADIENT : t.input, color: activa ? '#fff' : t.muted, border: activa ? 'none' : `1px solid ${t.inputBorder}` }}
              >
                <Icono size={13} /> {opt.label}
              </button>
            );
          })}
        </div>

        {tab === 'publicaciones' ? (
          <>
            <div className="space-y-3">
              {filasPubConServicios.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-3.5"
                  style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PLATAFORMA_COLOR[f.plataforma] }} />
                    <p className="text-[11px] font-semibold" style={{ color: t.muted }}>Publicación {i + 1}</p>
                    {f.comboListo && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: GRADIENT_SOFT, color: '#F5A623' }}>
                        <Sparkles size={10} /> Combo -20%
                      </span>
                    )}
                    {filasPub.length > 1 && (
                      <button type="button" onClick={() => quitarFilaPub(f.id)} className="ml-auto p-1 rounded-md" style={{ color: t.muted }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-[1fr_auto] gap-2 mb-2">
                    <div className="relative">
                      <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.muted }} />
                      <input
                        value={f.link}
                        onChange={(e) => actualizarFilaPub(f.id, 'link', e.target.value)}
                        placeholder="https://instagram.com/p/tu_publicacion"
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl text-xs outline-none"
                        style={{ background: t.surfaceSolid, border: `1px solid ${t.inputBorder}`, color: t.text }}
                      />
                    </div>
                    <select
                      value={f.plataforma}
                      onChange={(e) => actualizarFilaPub(f.id, 'plataforma', e.target.value)}
                      className="px-3 py-2.5 rounded-xl text-xs outline-none"
                      style={{ background: t.surfaceSolid, border: `1px solid ${t.inputBorder}`, color: t.text }}
                    >
                      {PLATAFORMAS_IMPULSAR.map((p) => <option key={p} value={p}>{etiquetaPlataforma(p)}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {f.metricas.map((m) => (
                      <InputCantidad
                        key={m.key}
                        value={f[m.key]}
                        onChange={(v) => actualizarFilaPub(f.id, m.key, v)}
                        placeholder={m.servicio ? `${m.label} (min ${m.servicio.cantidad_min})` : `Sin ${m.label.toLowerCase()} aquí`}
                        min={m.servicio?.cantidad_min}
                        t={t}
                      />
                    ))}
                  </div>
                  {!f.comboListo && (
                    <p className="text-[10px] mt-2" style={{ color: t.muted }}>
                      💡 Agrega Likes + Guardados + Compartidos + Repost juntos y se activa el 20% de descuento.
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            {filasPub.length < MAX_PUBLICACIONES && (
              <button type="button" onClick={agregarFilaPub} className="flex items-center gap-1.5 text-xs font-semibold mt-3" style={{ color: '#C4B5FD' }}>
                <Plus size={14} /> Agregar otra publicación ({filasPub.length}/{MAX_PUBLICACIONES})
              </button>
            )}

            <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: `1px solid ${t.inputBorder}` }}>
              <div>
                <p className="text-[10px]" style={{ color: t.muted }}>Total estimado</p>
                <p className="text-lg font-display font-bold" style={{ color: '#F5A623' }}>{totalPub.toLocaleString()} ♦</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={lanzarPublicaciones}
                disabled={enviando || totalPub === 0}
                className="flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-full"
                style={{ background: GRADIENT, color: '#fff', opacity: enviando || totalPub === 0 ? 0.6 : 1 }}
              >
                <Rocket size={15} /> {enviando ? 'Enviando...' : 'Impulsar publicaciones'}
              </motion.button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              {filasCtaConServicio.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-3.5"
                  style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PLATAFORMA_COLOR[f.plataforma] }} />
                    <p className="text-[11px] font-semibold" style={{ color: t.muted }}>Cuenta {i + 1}</p>
                    {filasCta.length > 1 && (
                      <button type="button" onClick={() => quitarFilaCta(f.id)} className="ml-auto p-1 rounded-md" style={{ color: t.muted }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2">
                    <div className="relative">
                      <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.muted }} />
                      <input
                        value={f.link}
                        onChange={(e) => actualizarFilaCta(f.id, 'link', e.target.value)}
                        placeholder="https://instagram.com/tu_usuario"
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl text-xs outline-none"
                        style={{ background: t.surfaceSolid, border: `1px solid ${t.inputBorder}`, color: t.text }}
                      />
                    </div>
                    <select
                      value={f.plataforma}
                      onChange={(e) => actualizarFilaCta(f.id, 'plataforma', e.target.value)}
                      className="px-3 py-2.5 rounded-xl text-xs outline-none"
                      style={{ background: t.surfaceSolid, border: `1px solid ${t.inputBorder}`, color: t.text }}
                    >
                      {PLATAFORMAS_IMPULSAR.map((p) => <option key={p} value={p}>{etiquetaPlataforma(p)}</option>)}
                    </select>
                    <InputCantidad
                      value={f.cantidad}
                      onChange={(v) => actualizarFilaCta(f.id, 'cantidad', v)}
                      placeholder={f.servicio ? `Seguidores (min ${f.servicio.cantidad_min})` : 'No disponible aquí'}
                      min={f.servicio?.cantidad_min}
                      t={t}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {filasCta.length < MAX_CUENTAS && (
              <button type="button" onClick={agregarFilaCta} className="flex items-center gap-1.5 text-xs font-semibold mt-3" style={{ color: '#C4B5FD' }}>
                <Plus size={14} /> Agregar otra cuenta ({filasCta.length}/{MAX_CUENTAS})
              </button>
            )}

            <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: `1px solid ${t.inputBorder}` }}>
              <div>
                <p className="text-[10px]" style={{ color: t.muted }}>Total estimado</p>
                <p className="text-lg font-display font-bold" style={{ color: '#F5A623' }}>{totalCta.toLocaleString()} ♦</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={lanzarCuentas}
                disabled={enviando || totalCta === 0}
                className="flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-full"
                style={{ background: GRADIENT, color: '#fff', opacity: enviando || totalCta === 0 ? 0.6 : 1 }}
              >
                <Rocket size={15} /> {enviando ? 'Enviando...' : 'Impulsar cuentas'}
              </motion.button>
            </div>
          </>
        )}

        <AnimatePresence>
          {resultado && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-4"
            >
              <div
                className="rounded-xl px-3.5 py-3 text-xs"
                style={{ background: GRADIENT_SOFT, border: '1px solid #EC489944', color: t.text }}
              >
                {resultado.error
                  ? resultado.error
                  : `${resultado.ok} campaña${resultado.ok === 1 ? '' : 's'} enviada${resultado.ok === 1 ? '' : 's'} correctamente${resultado.fallidas?.length ? ` · ${resultado.fallidas.length} con error: ${resultado.fallidas.join(', ')}` : ''}.`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
