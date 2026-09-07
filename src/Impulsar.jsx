import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Plus, Trash2, Rocket, Link2, Users, Heart, Sparkles } from 'lucide-react';
import { GRADIENT, GRADIENT_SOFT } from './theme';
import { PLATAFORMA_COLOR, etiquetaPlataforma } from './plataformas';

// YouTube queda fuera de Impulsar en lote: sus servicios son mucho más caros
// que el resto y no encajan bien en el modelo de combo/lote de esta sección.
const PLATAFORMAS_IMPULSAR = ['Instagram', 'TikTok', 'Facebook'];
const MAX_PUBLICACIONES = 10;
const MAX_CUENTAS = 5;
const MINIMO_CUENTAS_LOTE = 3;
const DESCUENTO_LOTE_PCT = 15;

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

// Métricas que se pueden pedir por publicación.
const METRICAS_PUBLICACION = [
  { key: 'likes', tipo: 'Likes', label: 'Likes' },
  { key: 'guardados', tipo: 'Guardados', label: 'Guardados' },
  { key: 'compartidos', tipo: 'Compartidos', label: 'Compartidos' },
  { key: 'repost', tipo: 'Reposts', label: 'Repost' },
  { key: 'reproducciones', tipo: 'Reproducciones', label: 'Reproducciones' },
];
const LABEL_POR_TIPO = Object.fromEntries(METRICAS_PUBLICACION.map((m) => [m.tipo, m.label]));

// Qué tipos hay que comprar juntos, en la misma publicación, para activar el
// 20% de descuento — varía por plataforma porque el catálogo real de
// servicios varía (ej. TikTok no tiene Repost, Facebook no tiene Guardados
// ni Compartidos). Misma regla espejo en wallet.js/crearPedido — el backend
// es quien de verdad aplica el descuento, esto es solo el estimado en vivo.
const REGLAS_COMBO_PUBLICACION = {
  Instagram: ['Likes', 'Guardados', 'Compartidos', 'Reposts'],
  TikTok: ['Likes', 'Guardados', 'Compartidos', 'Reproducciones'],
  Facebook: ['Likes', 'Reproducciones'],
};

function filaPublicacionVacia() {
  return { id: nuevoId(), link: '', plataforma: 'Instagram', likes: '', reproducciones: '', guardados: '', compartidos: '', repost: '', varianteLikes: 'universal' };
}
function filaCuentaVacia() {
  return { id: nuevoId(), link: '', plataforma: 'Instagram', cantidad: '', variante: 'universal' };
}

// Elige un servicio "por defecto" razonable para plataforma+tipo cuando hay
// varias variantes (ej. Instagram tiene Likes Universales/Latinos/F/M) —
// prioriza el "Universal" para no forzar al cliente a elegir audiencia aquí.
function servicioPorDefecto(servicios, plataforma, tipo) {
  const candidatos = servicios.filter((s) => s.plataforma === plataforma && s.tipo === tipo);
  if (candidatos.length === 0) return null;
  return candidatos.find((s) => /universal/i.test(s.nombre_publico)) || candidatos[0];
}

// Para Likes y Seguidores, Instagram tiene tanto la variante "Universal"
// (más barata) como "Latinos" (genérica, sin género) — se deja elegir cuál
// usar porque cambia el precio final. El resto de tipos/plataformas no
// tienen esta dualidad, así que ahí no se muestra ningún selector.
function variantesDisponibles(servicios, plataforma, tipo) {
  const candidatos = servicios.filter((s) => s.plataforma === plataforma && s.tipo === tipo);
  const universal = candidatos.find((s) => /universal/i.test(s.nombre_publico));
  const latino = candidatos.find((s) => /^(Likes|Seguidores) Latinos$/.test(s.nombre_publico));
  return { universal, latino };
}
function servicioPorVariante(servicios, plataforma, tipo, variante) {
  const { universal, latino } = variantesDisponibles(servicios, plataforma, tipo);
  if (variante === 'latino' && latino) return latino;
  return universal || latino || servicioPorDefecto(servicios, plataforma, tipo);
}

function ToggleVariante({ valor, onChange, t }) {
  return (
    <div className="flex items-center gap-1 rounded-full p-0.5 w-fit" style={{ background: t.surfaceSolid, border: `1px solid ${t.inputBorder}` }}>
      {[{ id: 'universal', label: 'Universal · más barato' }, { id: 'latino', label: 'Latinos' }].map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
          style={{ background: valor === opt.id ? GRADIENT : 'transparent', color: valor === opt.id ? '#fff' : t.muted }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
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

export default function Impulsar({ servicios, wallet, t, onCrear, onCrearLote }) {
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
          servicio: m.key === 'likes'
            ? servicioPorVariante(servicios, f.plataforma, m.tipo, f.varianteLikes)
            : servicioPorDefecto(servicios, f.plataforma, m.tipo),
          cantidad: parseInt(f[m.key]) || 0,
        }));
        const varsLikes = variantesDisponibles(servicios, f.plataforma, 'Likes');
        const tieneVarianteLikes = !!varsLikes.universal && !!varsLikes.latino;
        const requeridosCombo = REGLAS_COMBO_PUBLICACION[f.plataforma] || null;
        const comboListo = !!requeridosCombo && requeridosCombo.every((tipo) => {
          const m = metricas.find((x) => x.tipo === tipo);
          return m?.servicio && m.cantidad >= (m.servicio.cantidad_min || 1);
        });
        return { ...f, metricas, requeridosCombo, comboListo, tieneVarianteLikes };
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
    () =>
      filasCta.map((f) => {
        const vars = variantesDisponibles(servicios, f.plataforma, 'Seguidores');
        return {
          ...f,
          servicio: servicioPorVariante(servicios, f.plataforma, 'Seguidores', f.variante),
          tieneVariante: !!vars.universal && !!vars.latino,
        };
      }),
    [filasCta, servicios]
  );

  const cuentasValidas = useMemo(
    () =>
      filasCtaConServicio.filter((f) => {
        const cantidad = parseInt(f.cantidad) || 0;
        return f.link.trim() && f.servicio && cantidad >= (f.servicio.cantidad_min || 1);
      }),
    [filasCtaConServicio]
  );
  const loteListo = cuentasValidas.length >= MINIMO_CUENTAS_LOTE;

  const totalCta = useMemo(() => {
    let total = 0;
    for (const f of filasCtaConServicio) {
      if (!f.link.trim() || !f.servicio) continue;
      const cantidad = parseInt(f.cantidad) || 0;
      if (cantidad > 0) total += costoItem('Seguidores', cantidad, f.servicio.precio_creditos_por_1000);
    }
    return loteListo ? Math.round(total * (1 - DESCUENTO_LOTE_PCT / 100)) : total;
  }, [filasCtaConServicio, descuentoNivel, loteListo]);

  const actualizarFilaCta = (id, campo, valor) =>
    setFilasCta((prev) => prev.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)));
  const agregarFilaCta = () => setFilasCta((prev) => (prev.length >= MAX_CUENTAS ? prev : [...prev, filaCuentaVacia()]));
  const quitarFilaCta = (id) => setFilasCta((prev) => (prev.length <= 1 ? prev : prev.filter((f) => f.id !== id)));

  const lanzarCuentas = async () => {
    const filas = cuentasValidas.map((f) => ({
      link: f.link.trim(),
      items: [{ serviceId: f.servicio.id, cantidad: parseInt(f.cantidad) || 0 }],
    }));
    if (filas.length === 0) {
      setResultado({ error: 'Agrega al menos una cuenta con una cantidad de seguidores válida.' });
      return;
    }
    setEnviando(true);
    setResultado(null);
    try {
      const r = await onCrearLote(filas);
      setResultado(r);
      celebrar();
      setFilasCta([filaCuentaVacia(), filaCuentaVacia()]);
    } catch (err) {
      setResultado({ error: err.message });
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
                  {f.tieneVarianteLikes && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px]" style={{ color: t.muted }}>Likes:</span>
                      <ToggleVariante valor={f.varianteLikes} onChange={(v) => actualizarFilaPub(f.id, 'varianteLikes', v)} t={t} />
                    </div>
                  )}
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
                  {!f.comboListo && f.requeridosCombo && (
                    <p className="text-[10px] mt-2" style={{ color: t.muted }}>
                      💡 Agrega {f.requeridosCombo.map((tipo) => LABEL_POR_TIPO[tipo]).join(' + ')} juntos y se activa el 20% de descuento.
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
            <div
              className="flex items-center gap-2.5 rounded-2xl px-4 py-3 mb-4"
              style={{ background: GRADIENT_SOFT, border: '1px solid #7C3AED44' }}
            >
              <Sparkles size={16} style={{ color: '#F5A623' }} className="shrink-0" />
              <p className="text-xs font-medium" style={{ color: t.text }}>
                Impulsa <strong>3 cuentas o más</strong> al mismo tiempo y obtén <strong style={{ color: '#F5A623' }}>15% de descuento</strong> en el total.
              </p>
            </div>
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
                  {f.tieneVariante && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px]" style={{ color: t.muted }}>Seguidores:</span>
                      <ToggleVariante valor={f.variante} onChange={(v) => actualizarFilaCta(f.id, 'variante', v)} t={t} />
                    </div>
                  )}
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
                {loteListo ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold mt-0.5" style={{ color: '#F5A623' }}>
                    <Sparkles size={10} /> Descuento de lote -{DESCUENTO_LOTE_PCT}% aplicado
                  </span>
                ) : cuentasValidas.length > 0 ? (
                  <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>
                    Agrega {MINIMO_CUENTAS_LOTE - cuentasValidas.length} cuenta{MINIMO_CUENTAS_LOTE - cuentasValidas.length === 1 ? '' : 's'} más para el {DESCUENTO_LOTE_PCT}%
                  </p>
                ) : null}
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
