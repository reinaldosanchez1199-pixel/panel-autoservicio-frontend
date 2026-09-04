import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Sparkles, Link2, ChevronRight, ChevronDown, CheckCircle2, Clock, Sun, Moon, Star, Bookmark, Rocket,
  Home, Package, CreditCard, Activity, User, Menu, X, LogOut, Shield, Cpu, Upload, Zap, Flame, Gem, Crown,
} from 'lucide-react';
import { api } from './api';
import AnimatedBackground from './AnimatedBackground';
import AnimatedNumber from './AnimatedNumber';
import AIChat from './AIChat';
import LevelProgress from './LevelProgress';
import Pedidos from './Pedidos';
import { theme, GRADIENT, GRADIENT_SOFT, GOLD_GRADIENT, FONT_IMPORT } from './theme';

const TIER_ICONOS = [Zap, Flame, Gem, Crown];
function celebrar() {
  confetti({ particleCount: 90, spread: 75, origin: { y: 0.7 }, colors: ['#7C3AED', '#EC4899', '#06B6D4', '#F5C542'] });
}

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'impulsar', label: 'Impulsar', icon: Rocket },
  { id: 'pedidos', label: 'Pedidos', icon: Package },
  { id: 'recargas', label: 'Recargas', icon: CreditCard },
  { id: 'actividad', label: 'Actividad', icon: Activity },
  { id: 'cuenta', label: 'Cuenta', icon: User },
];

const PLATAFORMA_COLOR = {
  Instagram: '#EC4899',
  TikTok: '#06B6D4',
  Facebook: '#7C3AED',
  Twitter: '#38BDF8',
  YouTube: '#F5A623',
};

function formatoRelativo(fechaISO) {
  const diffMs = Date.now() - new Date(fechaISO).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min}min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `hace ${horas}h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'ayer';
  return `hace ${dias}d`;
}

function MonedaDorada({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id="coinGrad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#FFE9A8" />
          <stop offset="45%" stopColor="#F5C542" />
          <stop offset="100%" stopColor="#C98A1F" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#coinGrad)" stroke="#A8701A" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="14.5" fill="none" stroke="#A8701A" strokeWidth="1" opacity="0.5" />
      <text x="20" y="27" textAnchor="middle" fontFamily="Sora, sans-serif" fontWeight="800" fontSize="18" fill="#8A5A12">V</text>
      <ellipse cx="14" cy="12" rx="6" ry="3.5" fill="#FFF6DD" opacity="0.55" transform="rotate(-25 14 12)" />
    </svg>
  );
}

function Loader({ texto }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3" style={{ minHeight: '60vh' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
        style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.12)', borderTopColor: '#EC4899' }}
      />
      <p style={{ color: '#9B93C4' }} className="text-xs">{texto}</p>
    </div>
  );
}

export default function Dashboard({ esAdmin, onIrAdmin, onCerrarSesion }) {
  const [modoOscuro, setModoOscuro] = useState(true);
  const [plataformaSel, setPlataformaSel] = useState('');
  const [servicioSelId, setServicioSelId] = useState(null);
  const [cantidadSel, setCantidadSel] = useState(0);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [link, setLink] = useState('');
  const [mostrarRecarga, setMostrarRecarga] = useState(false);
  const [navActivo, setNavActivo] = useState('inicio');
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const [wallet, setWallet] = useState({ saldo: 0, nivel: '', descuento_pct: 0 });
  const [servicios, setServicios] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [paquetesRecarga, setPaquetesRecarga] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [comprobante, setComprobante] = useState(null);
  const [paqueteSeleccionado, setPaqueteSeleccionado] = useState(null);
  const [ordenes, setOrdenes] = useState(null); // null = aún no cargadas
  const [cargandoOrdenes, setCargandoOrdenes] = useState(false);

  const cargarTodo = useCallback(async () => {
    try {
      const [w, s, b, p, a, pr, nv] = await Promise.all([
        api.wallet(), api.services(), api.bundles(), api.perfiles(), api.activity(), api.paquetesRecarga(), api.niveles(),
      ]);
      setWallet(w); setServicios(s); setBundles(b); setPerfiles(p); setHistorial(a); setPaquetesRecarga(pr); setNiveles(nv);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarTodo(); }, [cargarTodo]);

  useEffect(() => {
    if (navActivo !== 'pedidos' || ordenes !== null) return;
    setCargandoOrdenes(true);
    api.ordenes()
      .then(setOrdenes)
      .catch((err) => setError(err.message))
      .finally(() => setCargandoOrdenes(false));
  }, [navActivo, ordenes]);

  const solicitarRefillItem = async (itemId) => {
    try {
      await api.solicitarRefill(itemId);
      celebrar();
      setMensaje('Reposición solicitada — ya va en camino.');
      setOrdenes((prev) =>
        prev.map((o) => ({
          ...o,
          items: o.items.map((it) => (it.id === itemId ? { ...it, refill_solicitado_en: new Date().toISOString() } : it)),
        }))
      );
    } catch (err) {
      setMensaje(`Error: ${err.message}`);
    }
  };

  const t = theme[modoOscuro ? 'dark' : 'light'];

  // Incrementos redondos: de 1000 en 1000 para servicios que ya arrancan en el
  // millar (vistas, alcance), de 50 en 50 para el resto — más fácil de ajustar
  // que saltos irregulares, y sin pasarse nunca del máximo del servicio.
  const pasoCantidad = (s) => (s && s.cantidad_min >= 1000 ? 1000 : 50);

  const serviciosPorPlataforma = useMemo(() => {
    const grupos = {};
    for (const s of servicios) {
      grupos[s.plataforma] = grupos[s.plataforma] || [];
      grupos[s.plataforma].push(s);
    }
    return grupos;
  }, [servicios]);

  const plataformas = useMemo(() => Object.keys(serviciosPorPlataforma), [serviciosPorPlataforma]);
  const serviciosDePlataforma = serviciosPorPlataforma[plataformaSel] || [];
  const servicioSel = servicios.find((s) => s.id === servicioSelId) || null;

  // Al cargar el catálogo, arranca con la primera plataforma/servicio disponible.
  useEffect(() => {
    if (plataformas.length === 0 || plataformaSel) return;
    setPlataformaSel(plataformas[0]);
  }, [plataformas, plataformaSel]);

  // Al cambiar de plataforma, selecciona el primer servicio de esa plataforma.
  useEffect(() => {
    if (serviciosDePlataforma.length === 0) return;
    if (!serviciosDePlataforma.some((s) => s.id === servicioSelId)) {
      setServicioSelId(serviciosDePlataforma[0].id);
      setCantidadSel(serviciosDePlataforma[0].cantidad_min);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plataformaSel, servicios]);

  const ajustarCantidadSel = (delta) => {
    if (!servicioSel) return;
    setCantidadSel((prev) => Math.min(servicioSel.cantidad_max, Math.max(servicioSel.cantidad_min, prev + delta)));
  };

  const costoConDescuento = useMemo(() => {
    if (!servicioSel) return 0;
    const base = (cantidadSel / 1000) * parseFloat(servicioSel.precio_creditos_por_1000);
    return Math.max(1, Math.round(base * (1 - (wallet.descuento_pct || 0) / 100)));
  }, [servicioSel, cantidadSel, wallet.descuento_pct]);

  const hayItems = !!servicioSel;
  const campanasLanzadas = useMemo(() => historial.filter((h) => h.tipo === 'consumo').length, [historial]);

  // Seguidores impulsan la CUENTA (necesitan el link del perfil); likes/views/etc
  // impulsan una PUBLICACIÓN puntual (necesitan el link del post). El botón y el
  // placeholder se adaptan para que quede claro qué link va ahí.
  const modoImpulso = servicioSel ? (/segui/i.test(servicioSel.tipo) ? 'cuenta' : 'publicacion') : null;
  const textoBotonImpulso = modoImpulso === 'cuenta' ? 'Impulsar cuenta' : modoImpulso === 'publicacion' ? 'Impulsar publicación' : 'Lanzar campaña';
  const placeholderLink = modoImpulso === 'cuenta' ? 'https://instagram.com/tu_usuario' : 'https://instagram.com/p/tu_publicacion';

  const impulsar = async () => {
    if (!servicioSel) return;
    setMensaje(''); setEnviando(true);
    try {
      await api.crearOrden(link, [{ serviceId: servicioSel.id, cantidad: cantidadSel }]);
      setMensaje('Campaña enviada — la IA ya está distribuyendo la entrega.');
      celebrar();
      setLink('');
      await cargarTodo();
    } catch (err) {
      setMensaje(`Error: ${err.message}`);
    } finally {
      setEnviando(false);
    }
  };

  const pedirBundle = async (bundleId) => {
    if (!link) { setMensaje('Primero pega el link de tu perfil arriba.'); return; }
    setMensaje(''); setEnviando(true);
    try {
      await api.crearOrdenBundle(link, bundleId);
      setMensaje('Combo enviado — en proceso.');
      celebrar();
      setLink('');
      await cargarTodo();
    } catch (err) {
      setMensaje(`Error: ${err.message}`);
    } finally {
      setEnviando(false);
    }
  };

  const enviarRecarga = async () => {
    if (!paqueteSeleccionado || !comprobante) { setMensaje('Elige un paquete y sube tu comprobante de pago.'); return; }
    setMensaje(''); setEnviando(true);
    try {
      await api.recargaManual(paqueteSeleccionado, comprobante);
      setMensaje('Recarga enviada, un admin la revisará pronto.');
      celebrar();
      setPaqueteSeleccionado(null); setComprobante(null); setMostrarRecarga(false);
    } catch (err) {
      setMensaje(`Error: ${err.message}`);
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <div style={{ background: t.bg, minHeight: '100vh', color: t.text, position: 'relative' }}>
        <style>{FONT_IMPORT}</style>
        <AnimatedBackground modoOscuro={modoOscuro} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Loader texto="Sincronizando tu cuenta..." />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: t.text, transition: 'background 0.3s, color 0.3s', position: 'relative' }} className="flex">
      <style>{`
        ${FONT_IMPORT}
        .font-display { font-family: 'Sora', sans-serif; }
        .glow-pulse { animation: glowPulse 2.4s ease-in-out infinite; }
        @keyframes glowPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .grad-text { background: ${GRADIENT}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        input::placeholder { color: ${t.muted}; }
        .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      <AnimatedBackground modoOscuro={modoOscuro} />

      <aside
        className={`${sidebarAbierto ? 'flex' : 'hidden'} lg:flex fixed lg:sticky top-0 left-0 h-screen w-64 flex-col p-5 z-20 overflow-y-auto`}
        style={{ background: t.sidebar, backdropFilter: 'blur(20px)', borderRight: `1px solid ${t.border}` }}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: GRADIENT }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <div>
              <span className="font-display text-base font-extrabold block leading-none">Viralizame</span>
              <span className="text-[9px] uppercase tracking-widest" style={{ color: t.muted }}>AI Growth Engine</span>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarAbierto(false)}><X size={18} style={{ color: t.muted }} /></button>
        </div>
        <nav className="flex flex-col gap-1 relative">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const activo = navActivo === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setNavActivo(item.id); setSidebarAbierto(false); }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left relative"
                style={{ color: activo ? '#fff' : t.muted }}
              >
                {activo && (
                  <motion.div
                    layoutId="navActivo"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: GRADIENT, zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon size={16} /> {item.label}
              </button>
            );
          })}
          {esAdmin && (
            <button
              onClick={onIrAdmin}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left mt-2"
              style={{ color: '#F5A623', border: `1px dashed rgba(245,166,35,0.4)` }}
            >
              <Shield size={16} /> Panel admin
            </button>
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <LevelProgress consumido={Number(wallet.consumido)} nivelActual={wallet.nivel} niveles={niveles} modoOscuro={modoOscuro} />
          <button onClick={onCerrarSesion} className="flex items-center gap-2 text-xs font-medium px-1" style={{ color: t.muted }}>
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 p-4 sm:p-8 max-w-5xl relative" style={{ zIndex: 1 }}>
        <div className="flex items-center justify-between mb-6">
          <button className="lg:hidden" onClick={() => setSidebarAbierto(true)}>
            <Menu size={20} style={{ color: t.text }} />
          </button>
          <span className="lg:hidden font-display font-extrabold">Viralizame</span>
          <button
            onClick={() => setModoOscuro(!modoOscuro)}
            className="w-9 h-9 rounded-full flex items-center justify-center ml-auto"
            style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(10px)' }}
          >
            {modoOscuro ? <Sun size={15} style={{ color: '#F5A623' }} /> : <Moon size={15} style={{ color: '#8B7FB8' }} />}
          </button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl p-4 mb-4 text-sm" style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.4)', color: '#FCA5C7' }}>
              {error}
            </motion.div>
          )}
          {mensaje && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl p-4 mb-4 text-sm" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', color: '#6EE7B7' }}>
              {mensaje}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
          style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}
        >
          <div style={{ position: 'absolute', inset: 0, background: GRADIENT_SOFT, opacity: 0.5 }} />
          <div className="flex items-center gap-3 relative">
            <MonedaDorada size={46} />
            <div>
              <p className="text-xs font-medium" style={{ color: t.muted }}>Saldo disponible</p>
              <p className="font-display font-extrabold text-3xl">
                <AnimatedNumber value={Number(wallet.saldo)} /> <span className="text-base font-semibold" style={{ color: t.muted }}>Viral Credits</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
            {campanasLanzadas > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}>
                <Rocket size={12} style={{ color: '#EC4899' }} />
                <span className="text-xs font-bold">{campanasLanzadas}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(245,166,35,0.15)' }}>
              <Star size={13} style={{ color: '#F5A623' }} />
              <span className="text-xs font-bold" style={{ color: '#F5A623' }}>{wallet.nivel} · -{wallet.descuento_pct}%</span>
            </div>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setMostrarRecarga(!mostrarRecarga)} className="text-xs font-bold px-5 py-2.5 rounded-full" style={{ background: GRADIENT, color: '#fff', boxShadow: '0 6px 20px rgba(124,58,237,0.35)' }}>
              Recargar
            </motion.button>
          </div>
        </motion.div>

        {navActivo === 'pedidos' ? (
          <Pedidos ordenes={ordenes} cargandoOrdenes={cargandoOrdenes} onRefill={solicitarRefillItem} t={t} />
        ) : (
        <>
        <AnimatePresence>
          {mostrarRecarga && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rounded-2xl p-4 mb-6 overflow-hidden" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {paquetesRecarga.map((p, i) => {
                  const Icono = TIER_ICONOS[Math.min(i, TIER_ICONOS.length - 1)];
                  const esMejorValor = i === paquetesRecarga.length - 1;
                  const activo = paqueteSeleccionado === p.id;
                  return (
                    <motion.button
                      key={p.id} whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setPaqueteSeleccionado(p.id)}
                      className="rounded-xl p-3 text-left relative overflow-hidden"
                      style={{
                        background: activo ? GRADIENT_SOFT : t.input,
                        border: activo ? '1px solid #EC4899' : esMejorValor ? '1px solid rgba(245,166,35,0.5)' : `1px solid ${t.inputBorder}`,
                      }}
                    >
                      {esMejorValor && (
                        <span className="absolute top-0 right-0 text-[8px] font-bold px-2 py-0.5 rounded-bl-lg" style={{ background: GOLD_GRADIENT, color: '#3D2A08' }}>
                          MEJOR VALOR
                        </span>
                      )}
                      <Icono size={14} style={{ color: esMejorValor ? '#F5A623' : '#C4B5FD' }} className="mb-1.5" />
                      <p className="text-xs" style={{ color: t.muted }}>${p.precio_usd} USD</p>
                      <p className="font-display font-bold text-sm">{Number(p.creditos_otorgados).toLocaleString()} ♦</p>
                    </motion.button>
                  );
                })}
              </div>
              {paqueteSeleccionado && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <label className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg cursor-pointer" style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.muted }}>
                    <Upload size={13} />
                    {comprobante ? comprobante.name : 'Subir comprobante de pago'}
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setComprobante(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                  <motion.button whileHover={{ scale: 1.03 }} onClick={enviarRecarga} disabled={enviando} className="text-xs font-bold px-4 py-2 rounded-full" style={{ background: GRADIENT, color: '#fff', opacity: enviando ? 0.6 : 1 }}>
                    Enviar comprobante
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {bundles.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={12} style={{ color: '#EC4899' }} />
              <p className="text-xs font-semibold" style={{ color: t.muted }}>Combos recomendados por IA</p>
            </div>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
              {bundles.map((b) => (
                <motion.button key={b.id} whileHover={{ y: -3 }} onClick={() => pedirBundle(b.id)} className="shrink-0 rounded-2xl p-3.5 text-left min-w-[220px]" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(10px)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Rocket size={13} style={{ color: '#EC4899' }} />
                    <span className="text-xs font-bold font-display">{b.nombre}</span>
                  </div>
                  <p className="text-[11px] mb-1.5" style={{ color: t.muted }}>
                    {b.items.map((it) => `${it.cantidad.toLocaleString()} ${it.tipo}`).join(' · ')}
                  </p>
                  <p className="text-xs font-bold grad-text">{Number(b.precio_creditos).toLocaleString()} ♦</p>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} className="lg:col-span-3 rounded-3xl p-6" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Cpu size={15} style={{ color: '#EC4899' }} />
              <h2 className="font-display font-bold text-lg">Crear campaña</h2>
            </div>
            <p className="text-xs mb-4" style={{ color: t.muted }}>Elige plataforma y servicio — la IA calcula el ritmo de entrega ideal según tu perfil y nivel.</p>

            {servicios.length === 0 ? (
              <p className="text-xs py-6 text-center" style={{ color: t.muted }}>Todavía no hay servicios activos en el catálogo.</p>
            ) : (
              <>
                {/* Paso 1: plataforma */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
                  {plataformas.map((p) => {
                    const activa = plataformaSel === p;
                    return (
                      <motion.button
                        key={p} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => { setPlataformaSel(p); setDropdownAbierto(false); }}
                        className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold"
                        style={{ background: activa ? GRADIENT : t.input, color: activa ? '#fff' : t.muted, border: activa ? 'none' : `1px solid ${t.inputBorder}` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: activa ? '#fff' : PLATAFORMA_COLOR[p] || '#8B7FB8' }} />
                        {p}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Paso 2: servicio (dropdown propio — el <select> nativo usa colores del SO y no se lee) */}
                <div className="relative mb-3">
                  <button
                    type="button"
                    onClick={() => setDropdownAbierto((v) => !v)}
                    className="w-full flex items-center justify-between text-sm font-medium px-3.5 py-3 rounded-xl outline-none cursor-pointer"
                    style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }}
                  >
                    <span>{servicioSel ? `${servicioSel.tipo} · ${servicioSel.nombre_publico}` : 'Elige un servicio'}</span>
                    <ChevronDown size={16} style={{ color: t.muted, transform: dropdownAbierto ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                  </button>
                  <AnimatePresence>
                    {dropdownAbierto && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="absolute left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-20 max-h-64 overflow-y-auto"
                        style={{ background: t.surfaceSolid, border: `1px solid ${t.inputBorder}`, boxShadow: '0 12px 30px rgba(0,0,0,0.4)' }}
                      >
                        {serviciosDePlataforma.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setServicioSelId(s.id);
                              setCantidadSel(s.cantidad_min);
                              setDropdownAbierto(false);
                            }}
                            className="w-full text-left px-3.5 py-2.5 text-sm"
                            style={{
                              background: s.id === servicioSelId ? GRADIENT_SOFT : 'transparent',
                              color: t.text,
                              borderBottom: `1px solid ${t.inputBorder}`,
                            }}
                          >
                            <span style={{ color: t.muted }}>{s.tipo} · </span>{s.nombre_publico}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <ChevronDown size={16} style={{ color: t.muted, position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>

                {/* Paso 3: cantidad + precio en vivo */}
                {servicioSel && (
                  <div className="rounded-xl px-3.5 py-3 mb-3 flex items-center justify-between" style={{ background: GRADIENT_SOFT, border: '1px solid #EC489944' }}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => ajustarCantidadSel(-pasoCantidad(servicioSel))} className="w-7 h-7 rounded-md text-sm" style={{ background: t.surfaceSolid, border: `1px solid ${t.inputBorder}` }}>−</button>
                      <span className="text-sm font-display font-bold w-20 text-center">{cantidadSel.toLocaleString()}</span>
                      <button onClick={() => ajustarCantidadSel(pasoCantidad(servicioSel))} className="w-7 h-7 rounded-md text-sm" style={{ background: t.surfaceSolid, border: `1px solid ${t.inputBorder}` }}>+</button>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px]" style={{ color: t.muted }}>min {servicioSel.cantidad_min.toLocaleString()} · max {servicioSel.cantidad_max.toLocaleString()}</p>
                      <p className="text-sm font-display font-bold" style={{ color: '#F5A623' }}>{costoConDescuento.toLocaleString()} ♦</p>
                    </div>
                  </div>
                )}

                {/* Paso 4: link (según si el servicio impulsa cuenta o publicación) */}
                <p className="text-[11px] font-medium mb-1.5" style={{ color: t.muted }}>
                  {modoImpulso === 'cuenta' ? 'Link de tu perfil' : 'Link de tu publicación'}
                </p>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-2" style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}>
                  <Link2 size={15} style={{ color: t.muted }} />
                  <input value={link} onChange={(e) => setLink(e.target.value)} placeholder={placeholderLink} className="bg-transparent outline-none text-sm flex-1" style={{ color: t.text }} />
                </div>
                {perfiles.length > 0 && (
                  <div className="flex gap-2 mb-5 flex-wrap">
                    {perfiles.map((p) => (
                      <button key={p.id} onClick={() => setLink(p.url)} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full" style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.muted }}>
                        <Bookmark size={10} /> {p.nombre_usuario || p.url}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between mb-3 text-sm">
              <span style={{ color: t.muted }}>Total (nivel {wallet.nivel}, -{wallet.descuento_pct}% aplicado)</span>
              <span className="font-display font-bold grad-text">{costoConDescuento.toLocaleString()} ♦</span>
            </div>

            <motion.button
              whileHover={hayItems && link ? { scale: 1.015 } : {}}
              whileTap={hayItems && link ? { scale: 0.985 } : {}}
              onClick={impulsar}
              disabled={!hayItems || !link || enviando}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-display font-bold text-sm"
              style={{ background: hayItems && link ? GRADIENT : t.input, color: hayItems && link ? '#fff' : t.muted, opacity: enviando ? 0.6 : 1, boxShadow: hayItems && link ? '0 8px 30px rgba(124,58,237,0.35)' : 'none' }}
            >
              <Rocket size={16} /> {enviando ? 'Enviando...' : textoBotonImpulso} <ChevronRight size={16} />
            </motion.button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="lg:col-span-2 rounded-3xl p-6" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full glow-pulse" style={{ background: '#10B981' }} />
              <h2 className="font-display font-bold text-sm">Actividad en tiempo real</h2>
            </div>
            <div className="space-y-3">
              {historial.length === 0 && <p className="text-xs" style={{ color: t.muted }}>Todavía no tienes actividad.</p>}
              {historial.map((h, i) => (
                <motion.div key={h.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="pb-3" style={{ borderBottom: `1px solid ${t.inputBorder}` }}>
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-xs font-medium pr-2">{h.nota || h.tipo}</p>
                    <span className="text-xs font-display font-bold whitespace-nowrap" style={{ color: Number(h.monto) > 0 ? '#10B981' : t.text }}>
                      {Number(h.monto) > 0 ? '+' : ''}{Number(h.monto).toLocaleString()} ♦
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} style={{ color: '#F5A623' }} />
                    <span className="text-[10px]" style={{ color: t.muted }}>{formatoRelativo(h.creado_en)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        </>
        )}
      </div>
      <AIChat />
    </div>
  );
}
