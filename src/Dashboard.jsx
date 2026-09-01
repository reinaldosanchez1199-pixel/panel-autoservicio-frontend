import { useState, useMemo, useEffect, useCallback } from 'react';
import { Zap, Link2, ChevronRight, CheckCircle2, Clock, Sun, Moon, Star, Bookmark, Rocket, Home, Package, CreditCard, Activity, User, Menu, X, LogOut, Shield, Plus } from 'lucide-react';
import { api } from './api';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'impulsar', label: 'Impulsar', icon: Rocket },
  { id: 'pedidos', label: 'Pedidos', icon: Package },
  { id: 'recargas', label: 'Recargas', icon: CreditCard },
  { id: 'actividad', label: 'Actividad', icon: Activity },
  { id: 'cuenta', label: 'Cuenta', icon: User },
];

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

// Logo de moneda dorada — SVG propio, no un ícono genérico
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

export default function Dashboard({ esAdmin, onIrAdmin, onCerrarSesion }) {
  const [modoOscuro, setModoOscuro] = useState(true);
  const [seleccion, setSeleccion] = useState({});
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

  const cargarTodo = useCallback(async () => {
    try {
      const [w, s, b, p, a, pr] = await Promise.all([
        api.wallet(),
        api.services(),
        api.bundles(),
        api.perfiles(),
        api.activity(),
        api.paquetesRecarga(),
      ]);
      setWallet(w);
      setServicios(s);
      setBundles(b);
      setPerfiles(p);
      setHistorial(a);
      setPaquetesRecarga(pr);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const t = modoOscuro
    ? { bg: '#140F2E', surface: '#1C1640', sidebar: '#100C26', border: '#2E2560', text: '#F1EDFC', muted: '#8B7FB8', input: '#150F33', inputBorder: '#2A2352' }
    : { bg: '#F6F4FC', surface: '#FFFFFF', sidebar: '#FFFFFF', border: '#E6E0F5', text: '#211B3D', muted: '#79709E', input: '#F4F1FB', inputBorder: '#E6E0F5' };

  const pasoCantidad = (s) => Math.max(1, Math.round(s.cantidad_min / 2)) || 50;

  const toggleServicio = (s) => {
    setSeleccion((prev) => {
      const copia = { ...prev };
      if (copia[s.id]) delete copia[s.id];
      else copia[s.id] = s.cantidad_min;
      return copia;
    });
  };

  const ajustarCantidad = (s, delta) => {
    setSeleccion((prev) => ({
      ...prev,
      [s.id]: Math.min(s.cantidad_max, Math.max(s.cantidad_min, (prev[s.id] || s.cantidad_min) + delta)),
    }));
  };

  const costoBase = useMemo(
    () =>
      Object.entries(seleccion).reduce((sum, [id, cant]) => {
        const s = servicios.find((x) => x.id === Number(id));
        if (!s) return sum;
        return sum + (cant / 1000) * parseFloat(s.precio_creditos_por_1000);
      }, 0),
    [seleccion, servicios]
  );
  const costoConDescuento = Math.round(costoBase * (1 - (wallet.descuento_pct || 0) / 100));
  const hayItems = Object.keys(seleccion).length > 0;

  const serviciosPorPlataforma = useMemo(() => {
    const grupos = {};
    for (const s of servicios) {
      grupos[s.plataforma] = grupos[s.plataforma] || [];
      grupos[s.plataforma].push(s);
    }
    return grupos;
  }, [servicios]);

  const impulsar = async () => {
    setMensaje('');
    setEnviando(true);
    try {
      const items = Object.entries(seleccion).map(([serviceId, cantidad]) => ({ serviceId: Number(serviceId), cantidad }));
      await api.crearOrden(link, items);
      setMensaje('¡Pedido enviado! Se está procesando.');
      setSeleccion({});
      setLink('');
      await cargarTodo();
    } catch (err) {
      setMensaje(`Error: ${err.message}`);
    } finally {
      setEnviando(false);
    }
  };

  const pedirBundle = async (bundleId) => {
    if (!link) {
      setMensaje('Primero pega el link de tu perfil arriba.');
      return;
    }
    setMensaje('');
    setEnviando(true);
    try {
      await api.crearOrdenBundle(link, bundleId);
      setMensaje('¡Bundle enviado! Se está procesando.');
      setLink('');
      await cargarTodo();
    } catch (err) {
      setMensaje(`Error: ${err.message}`);
    } finally {
      setEnviando(false);
    }
  };

  const [comprobante, setComprobante] = useState(null);
  const [paqueteSeleccionado, setPaqueteSeleccionado] = useState(null);

  const enviarRecarga = async () => {
    if (!paqueteSeleccionado || !comprobante) {
      setMensaje('Elige un paquete y sube tu comprobante de pago.');
      return;
    }
    setMensaje('');
    setEnviando(true);
    try {
      await api.recargaManual(paqueteSeleccionado, comprobante);
      setMensaje('Recarga enviada, un admin la revisará pronto.');
      setPaqueteSeleccionado(null);
      setComprobante(null);
      setMostrarRecarga(false);
    } catch (err) {
      setMensaje(`Error: ${err.message}`);
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <div style={{ background: t.bg, minHeight: '100vh', color: t.text }} className="flex items-center justify-center">
        <p style={{ color: t.muted }}>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: t.text, transition: 'background 0.3s, color 0.3s' }} className="flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap');
        .font-display { font-family: 'Sora', sans-serif; }
        .glow-pulse { animation: glowPulse 2.4s ease-in-out infinite; }
        @keyframes glowPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
      `}</style>

      <aside
        className={`${sidebarAbierto ? 'flex' : 'hidden'} lg:flex fixed lg:sticky top-0 left-0 h-screen w-60 flex-col p-5 z-20 overflow-y-auto`}
        style={{ background: t.sidebar, borderRight: `1px solid ${t.border}` }}
      >
        <div className="flex items-center justify-between mb-8">
          <span className="font-display text-lg font-extrabold italic">Viralizame</span>
          <button className="lg:hidden" onClick={() => setSidebarAbierto(false)}><X size={18} style={{ color: t.muted }} /></button>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const activo = navActivo === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setNavActivo(item.id); setSidebarAbierto(false); }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left"
                style={{ background: activo ? 'rgba(232,67,122,0.12)' : 'transparent', color: activo ? '#E8437A' : t.muted }}
              >
                <Icon size={16} /> {item.label}
              </button>
            );
          })}
          {esAdmin && (
            <button
              onClick={onIrAdmin}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left mt-2"
              style={{ color: '#F5A623' }}
            >
              <Shield size={16} /> Admin
            </button>
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <div className="pt-2 rounded-2xl p-3.5" style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}>
            <p className="text-xs font-semibold mb-0.5">Nivel {wallet.nivel}</p>
            <p className="text-[11px]" style={{ color: t.muted }}>-{wallet.descuento_pct}% en cada pedido</p>
          </div>
          <button onClick={onCerrarSesion} className="flex items-center gap-2 text-xs font-medium" style={{ color: t.muted }}>
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 p-4 sm:p-8 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <button className="lg:hidden" onClick={() => setSidebarAbierto(true)}>
            <Menu size={20} style={{ color: t.text }} />
          </button>
          <span className="lg:hidden font-display font-extrabold italic">Viralizame</span>
          <button
            onClick={() => setModoOscuro(!modoOscuro)}
            className="w-9 h-9 rounded-full flex items-center justify-center ml-auto"
            style={{ background: t.surface, border: `1px solid ${t.border}` }}
          >
            {modoOscuro ? <Sun size={15} style={{ color: '#F5A623' }} /> : <Moon size={15} style={{ color: '#8B7FB8' }} />}
          </button>
        </div>

        {error && (
          <div className="rounded-2xl p-4 mb-4 text-sm" style={{ background: 'rgba(232,67,122,0.1)', border: '1px solid #E8437A', color: '#E8437A' }}>
            {error}
          </div>
        )}
        {mensaje && (
          <div className="rounded-2xl p-4 mb-4 text-sm" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid #4ADE80', color: '#4ADE80' }}>
            {mensaje}
          </div>
        )}

        <div className="rounded-3xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-3">
            <MonedaDorada size={44} />
            <div>
              <p className="text-xs font-medium" style={{ color: t.muted }}>Saldo disponible</p>
              <p className="font-display font-extrabold text-2xl">{Number(wallet.saldo).toLocaleString()} <span className="text-base" style={{ color: t.muted }}>Viral Credits</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(245,166,35,0.15)' }}>
              <Star size={13} style={{ color: '#F5A623' }} />
              <span className="text-xs font-bold" style={{ color: '#F5A623' }}>{wallet.nivel} · -{wallet.descuento_pct}%</span>
            </div>
            <button onClick={() => setMostrarRecarga(!mostrarRecarga)} className="text-xs font-bold px-4 py-2 rounded-full" style={{ background: 'linear-gradient(135deg, #E8437A, #F5A623)', color: '#140F2E' }}>
              Recargar
            </button>
          </div>
        </div>

        {mostrarRecarga && (
          <div className="rounded-2xl p-4 mb-6" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {paquetesRecarga.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPaqueteSeleccionado(p.id)}
                  className="rounded-xl p-3 text-left"
                  style={{
                    background: paqueteSeleccionado === p.id ? 'rgba(232,67,122,0.1)' : t.input,
                    border: paqueteSeleccionado === p.id ? '1px solid #E8437A' : `1px solid ${t.inputBorder}`,
                  }}
                >
                  <p className="text-xs" style={{ color: t.muted }}>${p.precio_usd} USD</p>
                  <p className="font-display font-bold text-sm">{Number(p.creditos_otorgados).toLocaleString()} ♦</p>
                </button>
              ))}
            </div>
            {paqueteSeleccionado && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setComprobante(e.target.files?.[0] || null)}
                  className="text-xs"
                  style={{ color: t.muted }}
                />
                <button
                  onClick={enviarRecarga}
                  disabled={enviando}
                  className="text-xs font-bold px-4 py-2 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #E8437A, #F5A623)', color: '#140F2E', opacity: enviando ? 0.6 : 1 }}
                >
                  Enviar comprobante
                </button>
              </div>
            )}
          </div>
        )}

        {bundles.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {bundles.map((b) => (
              <button key={b.id} onClick={() => pedirBundle(b.id)} className="shrink-0 rounded-2xl p-3.5 text-left min-w-[220px]" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Rocket size={13} style={{ color: '#F5A623' }} />
                  <span className="text-xs font-bold font-display">{b.nombre}</span>
                </div>
                <p className="text-[11px] mb-1.5" style={{ color: t.muted }}>
                  {b.items.map((it) => `${it.cantidad.toLocaleString()} ${it.tipo}`).join(' · ')}
                </p>
                <p className="text-xs font-bold" style={{ color: '#E8437A' }}>{Number(b.precio_creditos).toLocaleString()} ♦</p>
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 rounded-3xl p-6" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
            <h2 className="font-display font-bold text-lg mb-4 italic">Nuevo impulso</h2>

            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-2" style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}>
              <Link2 size={15} style={{ color: t.muted }} />
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://instagram.com/tu_usuario" className="bg-transparent outline-none text-sm flex-1" style={{ color: t.text }} />
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

            {servicios.length === 0 && (
              <p className="text-xs" style={{ color: t.muted }}>Todavía no hay servicios activos en el catálogo.</p>
            )}

            {Object.entries(serviciosPorPlataforma).map(([plataforma, lista]) => (
              <div key={plataforma} className="mb-5">
                <p className="text-xs font-medium mb-2" style={{ color: t.muted }}>{plataforma}</p>
                <div className="space-y-2">
                  {lista.map((s) => {
                    const activo = !!seleccion[s.id];
                    const paso = pasoCantidad(s);
                    return (
                      <div key={s.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer" style={{ background: activo ? 'rgba(232,67,122,0.08)' : t.input, border: activo ? '1px solid #E8437A' : `1px solid ${t.inputBorder}` }} onClick={() => !activo && toggleServicio(s)}>
                        <div className="flex items-center gap-2.5">
                          <div onClick={(e) => { e.stopPropagation(); toggleServicio(s); }} className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{ background: activo ? '#E8437A' : 'transparent', border: activo ? 'none' : `1.5px solid ${t.muted}` }}>
                            {activo && <CheckCircle2 size={12} color="#fff" />}
                          </div>
                          <span className="text-sm font-medium">{s.nombre_publico}</span>
                        </div>
                        {activo ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => ajustarCantidad(s, -paso)} className="w-6 h-6 rounded-md text-xs" style={{ background: t.surface, border: `1px solid ${t.inputBorder}` }}>−</button>
                            <span className="text-xs font-display font-bold w-16 text-center">{seleccion[s.id].toLocaleString()}</span>
                            <button onClick={() => ajustarCantidad(s, paso)} className="w-6 h-6 rounded-md text-xs" style={{ background: t.surface, border: `1px solid ${t.inputBorder}` }}>+</button>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: t.muted }}>{s.precio_creditos_por_1000} ♦/1000</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between mb-3 text-sm">
              <span style={{ color: t.muted }}>Total (nivel {wallet.nivel}, -{wallet.descuento_pct}% aplicado)</span>
              <span className="font-display font-bold" style={{ color: '#F5A623' }}>{costoConDescuento.toLocaleString()} ♦</span>
            </div>

            <button
              onClick={impulsar}
              disabled={!hayItems || !link || enviando}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-display font-bold text-sm"
              style={{ background: hayItems && link ? 'linear-gradient(135deg, #E8437A, #F5A623)' : t.input, color: hayItems && link ? '#140F2E' : t.muted, opacity: enviando ? 0.6 : 1 }}
            >
              <Zap size={16} /> {enviando ? 'Enviando...' : 'Impulsar ahora'} <ChevronRight size={16} />
            </button>
          </div>

          <div className="lg:col-span-2 rounded-3xl p-6" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full glow-pulse" style={{ background: '#4ADE80' }} />
              <h2 className="font-display font-bold text-sm">Actividad</h2>
            </div>
            <div className="space-y-3">
              {historial.length === 0 && <p className="text-xs" style={{ color: t.muted }}>Todavía no tienes actividad.</p>}
              {historial.map((h) => (
                <div key={h.id} className="pb-3" style={{ borderBottom: `1px solid ${t.inputBorder}` }}>
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-xs font-medium pr-2">{h.nota || h.tipo}</p>
                    <span className="text-xs font-display font-bold whitespace-nowrap" style={{ color: Number(h.monto) > 0 ? '#4ADE80' : t.text }}>
                      {Number(h.monto) > 0 ? '+' : ''}{Number(h.monto).toLocaleString()} ♦
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} style={{ color: '#F5A623' }} />
                    <span className="text-[10px]" style={{ color: t.muted }}>{formatoRelativo(h.creado_en)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
