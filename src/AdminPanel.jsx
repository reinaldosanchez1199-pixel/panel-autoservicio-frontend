import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Image as ImageIcon, Package, Wallet, ArrowLeft, LogOut, Shield, Search, Link2, CheckCircle2, Clock, XCircle, Undo2, Gift, KeyRound } from 'lucide-react';
import { api } from './api';
import AnimatedBackground from './AnimatedBackground';
import { theme, GRADIENT, GRADIENT_SOFT, FONT_IMPORT } from './theme';

const ESTADO_INFO = {
  completado: { icon: CheckCircle2, color: '#10B981', label: 'Completado' },
  procesando: { icon: Clock, color: '#F5A623', label: 'Procesando' },
  pendiente: { icon: Clock, color: '#F5A623', label: 'Pendiente' },
  error: { icon: XCircle, color: '#EC4899', label: 'Error' },
  reembolsado: { icon: Undo2, color: '#8B7FB8', label: 'Reembolsado' },
};

export default function AdminPanel({ onVolver, onCerrarSesion }) {
  const [tab, setTab] = useState('recargas');
  const [recargas, setRecargas] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [ordenesAdmin, setOrdenesAdmin] = useState([]);
  const [cargandoOrdenes, setCargandoOrdenes] = useState(false);
  const [busquedaEmail, setBusquedaEmail] = useState('');
  const [referidosSospechosos, setReferidosSospechosos] = useState([]);
  const [solicitudesReset, setSolicitudesReset] = useState([]);
  const [passwordsGeneradas, setPasswordsGeneradas] = useState({});
  const [clientes, setClientes] = useState([]);
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [busquedaClienteEmail, setBusquedaClienteEmail] = useState('');
  const [ajustesDraft, setAjustesDraft] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [borradores, setBorradores] = useState({});
  const t = theme.dark;

  const cargar = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([api.adminRecargasPendientes(), api.adminServiciosPendientes()]);
      setRecargas(r);
      setPendientes(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const buscarOrdenes = useCallback(async (email) => {
    setCargandoOrdenes(true);
    try {
      setOrdenesAdmin(await api.adminOrdenes(email));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargandoOrdenes(false);
    }
  }, []);

  useEffect(() => { if (tab === 'pedidos') buscarOrdenes(busquedaEmail); }, [tab]);

  const cancelarItem = async (itemId) => {
    if (!window.confirm('¿Cancelar este item y devolver los créditos al cliente?')) return;
    try {
      await api.adminCancelarItem(itemId, 'Cancelado manualmente desde el Admin Panel');
      setOrdenesAdmin((os) =>
        os.map((o) => ({ ...o, items: o.items.map((i) => (i.id === itemId ? { ...i, estado: 'reembolsado' } : i)) }))
      );
    } catch (err) { setError(err.message); }
  };

  const cargarReferidos = useCallback(async () => {
    try {
      setReferidosSospechosos(await api.adminReferidosSospechosos());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { if (tab === 'referidos') cargarReferidos(); }, [tab, cargarReferidos]);

  const cargarSolicitudesReset = useCallback(async () => {
    try {
      setSolicitudesReset(await api.adminSolicitudesReset());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { if (tab === 'accesos') cargarSolicitudesReset(); }, [tab, cargarSolicitudesReset]);

  const resolverAcceso = async (id) => {
    try {
      const r = await api.adminResolverReset(id);
      setPasswordsGeneradas((p) => ({ ...p, [id]: r.passwordTemporal }));
      setSolicitudesReset((s) => s.map((x) => (x.id === id ? { ...x, resuelto: true } : x)));
    } catch (err) { setError(err.message); }
  };

  const buscarClientes = useCallback(async (email) => {
    setCargandoClientes(true);
    try {
      setClientes(await api.adminClientes(email));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargandoClientes(false);
    }
  }, []);

  useEffect(() => { if (tab === 'clientes') buscarClientes(busquedaClienteEmail); }, [tab]);

  const suspenderCliente = async (id) => {
    try {
      await api.adminSuspenderCliente(id);
      setClientes((cs) => cs.map((c) => (c.id === id ? { ...c, activo: false } : c)));
    } catch (err) { setError(err.message); }
  };

  const reactivarCliente = async (id) => {
    try {
      await api.adminReactivarCliente(id);
      setClientes((cs) => cs.map((c) => (c.id === id ? { ...c, activo: true } : c)));
    } catch (err) { setError(err.message); }
  };

  const ajustarDraft = (id, campo, valor) =>
    setAjustesDraft((d) => ({ ...d, [id]: { ...d[id], [campo]: valor } }));

  const enviarAjuste = async (id) => {
    const draft = ajustesDraft[id] || {};
    const monto = parseFloat(draft.monto);
    if (!monto) return;
    try {
      const r = await api.adminAjustarCreditos(id, monto, draft.motivo);
      setClientes((cs) => cs.map((c) => (c.id === id ? { ...c, saldo_creditos: r.nuevoSaldo } : c)));
      setAjustesDraft((d) => ({ ...d, [id]: { monto: '', motivo: '' } }));
    } catch (err) { setError(err.message); }
  };

  const aprobarReferido = async (id) => {
    try {
      await api.adminAprobarReferido(id);
      setReferidosSospechosos((r) => r.filter((x) => x.id !== id));
    } catch (err) { setError(err.message); }
  };

  const rechazarReferido = async (id) => {
    try {
      await api.adminRechazarReferido(id);
      setReferidosSospechosos((r) => r.filter((x) => x.id !== id));
    } catch (err) { setError(err.message); }
  };

  const aprobar = async (id) => {
    try {
      await api.adminAprobarRecarga(id);
      setRecargas((r) => r.filter((x) => x.id !== id));
    } catch (err) { setError(err.message); }
  };

  const rechazar = async (id) => {
    try {
      await api.adminRechazarRecarga(id);
      setRecargas((r) => r.filter((x) => x.id !== id));
    } catch (err) { setError(err.message); }
  };

  const actualizarBorrador = (id, campo, valor) => {
    setBorradores((b) => ({ ...b, [id]: { ...b[id], [campo]: valor } }));
  };

  const activarServicio = async (s) => {
    const borrador = borradores[s.id] || {};
    const margen = parseFloat(borrador.margen ?? '3.0');
    if (!borrador.plataforma || !borrador.nombrePublico) {
      setError('Elige la plataforma y escribe un nombre público antes de activar.');
      return;
    }
    try {
      await api.adminActualizarServicio(s.id, {
        plataforma: borrador.plataforma,
        tipo: borrador.tipo || borrador.plataforma,
        nombrePublico: borrador.nombrePublico,
        margenMultiplicador: margen,
        activo: true,
      });
      setPendientes((p) => p.filter((x) => x.id !== s.id));
    } catch (err) { setError(err.message); }
  };

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: t.text, position: 'relative' }} className="p-4 sm:p-8">
      <style>{`${FONT_IMPORT} .font-display{font-family:'Sora',sans-serif;}`}</style>
      <AnimatedBackground modoOscuro />

      <div className="max-w-4xl mx-auto relative" style={{ zIndex: 1 }}>
        <div className="flex items-center justify-between mb-1">
          <button onClick={onVolver} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: t.muted }}>
            <ArrowLeft size={14} /> Volver al panel
          </button>
          <button onClick={onCerrarSesion} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: t.muted }}>
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>

        <div className="flex items-center gap-2 mt-5 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: GRADIENT }}>
            <Shield size={14} color="#fff" />
          </div>
          <p className="text-xs uppercase tracking-widest" style={{ color: t.muted }}>Panel interno</p>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-6">Administración</h1>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl p-4 mb-4 text-sm" style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.4)', color: '#FCA5C7' }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('recargas')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: tab === 'recargas' ? GRADIENT : t.surface, color: tab === 'recargas' ? '#fff' : t.muted, border: `1px solid ${t.border}` }}
          >
            <Wallet size={15} /> Recargas ({recargas.length})
          </button>
          <button
            onClick={() => setTab('servicios')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: tab === 'servicios' ? GRADIENT : t.surface, color: tab === 'servicios' ? '#fff' : t.muted, border: `1px solid ${t.border}` }}
          >
            <Package size={15} /> Servicios nuevos ({pendientes.length})
          </button>
          <button
            onClick={() => setTab('pedidos')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: tab === 'pedidos' ? GRADIENT : t.surface, color: tab === 'pedidos' ? '#fff' : t.muted, border: `1px solid ${t.border}` }}
          >
            <Search size={15} /> Pedidos
          </button>
          <button
            onClick={() => setTab('referidos')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: tab === 'referidos' ? GRADIENT : t.surface, color: tab === 'referidos' ? '#fff' : t.muted, border: `1px solid ${t.border}` }}
          >
            <Gift size={15} /> Referidos {referidosSospechosos.length > 0 ? `(${referidosSospechosos.length})` : ''}
          </button>
          <button
            onClick={() => setTab('clientes')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: tab === 'clientes' ? GRADIENT : t.surface, color: tab === 'clientes' ? '#fff' : t.muted, border: `1px solid ${t.border}` }}
          >
            <Wallet size={15} /> Clientes
          </button>
          <button
            onClick={() => setTab('accesos')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: tab === 'accesos' ? GRADIENT : t.surface, color: tab === 'accesos' ? '#fff' : t.muted, border: `1px solid ${t.border}` }}
          >
            <KeyRound size={15} /> Accesos {solicitudesReset.filter((s) => !s.resuelto).length > 0 ? `(${solicitudesReset.filter((s) => !s.resuelto).length})` : ''}
          </button>
        </div>

        {cargando && <p className="text-sm" style={{ color: t.muted }}>Cargando...</p>}

        {!cargando && tab === 'recargas' && (
          <div className="space-y-3">
            {recargas.length === 0 && (
              <p className="text-sm text-center py-10" style={{ color: t.muted }}>No hay recargas pendientes.</p>
            )}
            {recargas.map((r) => (
              <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl p-4 flex items-center justify-between gap-4" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  {r.comprobante_url ? (
                    <a href={r.comprobante_url} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}>
                      <ImageIcon size={16} style={{ color: t.muted }} />
                    </a>
                  ) : (
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.input, border: `1px solid ${t.inputBorder}` }} title="Sin archivo adjunto — revisa el comprobante en WhatsApp">
                      <ImageIcon size={16} style={{ color: t.muted, opacity: 0.4 }} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{r.email}</p>
                    <p className="text-xs" style={{ color: t.muted }}>
                      ${r.monto_declarado}{r.metodo ? ` · ${r.metodo}` : ''} · {new Date(r.creado_en).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-display font-bold text-sm" style={{ color: '#F5A623' }}>+{Math.round(Number(r.creditos_a_acreditar)).toLocaleString()} ♦</span>
                  <button onClick={() => aprobar(r.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <Check size={15} style={{ color: '#10B981' }} />
                  </button>
                  <button onClick={() => rechazar(r.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(236,72,153,0.15)' }}>
                    <X size={15} style={{ color: '#EC4899' }} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!cargando && tab === 'servicios' && (
          <div className="space-y-3">
            {pendientes.length === 0 && (
              <p className="text-sm text-center py-10" style={{ color: t.muted }}>No hay servicios nuevos por revisar.</p>
            )}
            {pendientes.map((s) => {
              const borrador = borradores[s.id] || {};
              const margen = parseFloat(borrador.margen ?? '3.0');
              const costo = parseFloat(s.costo_provider_por_1000);
              return (
                <div key={s.id} className="rounded-2xl p-4" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">{s.nombre_publico}</p>
                    <span className="text-xs" style={{ color: t.muted }}>Costo: ${costo}/1000</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <select
                      value={borrador.plataforma || ''}
                      onChange={(e) => actualizarBorrador(s.id, 'plataforma', e.target.value)}
                      className="text-xs px-3 py-2 rounded-lg outline-none"
                      style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }}
                    >
                      <option value="">Elegir plataforma...</option>
                      <option value="Instagram">Instagram</option><option value="TikTok">TikTok</option><option value="YouTube">YouTube</option><option value="Facebook">Facebook</option><option value="Twitter">Twitter (X)</option>
                    </select>
                    <input
                      value={borrador.nombrePublico || ''}
                      onChange={(e) => actualizarBorrador(s.id, 'nombrePublico', e.target.value)}
                      placeholder="Nombre público (ej. Seguidores Premium)"
                      className="text-xs px-3 py-2 rounded-lg outline-none"
                      style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-1 px-3 py-2 rounded-lg" style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}>
                      <span className="text-xs" style={{ color: t.muted }}>Margen</span>
                      <input value={borrador.margen ?? '3.0'} onChange={(e) => actualizarBorrador(s.id, 'margen', e.target.value)} className="bg-transparent outline-none text-xs w-10" style={{ color: t.text }} />
                      <span className="text-xs" style={{ color: t.muted }}>x → {Math.round(costo * 100 * (isNaN(margen) ? 3 : margen))} ♦/1000</span>
                    </div>
                    <button onClick={() => activarServicio(s)} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: GRADIENT, color: '#fff' }}>
                      Activar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'pedidos' && (
          <div>
            <form
              onSubmit={(e) => { e.preventDefault(); buscarOrdenes(busquedaEmail); }}
              className="flex items-center gap-2 mb-4"
            >
              <input
                value={busquedaEmail}
                onChange={(e) => setBusquedaEmail(e.target.value)}
                placeholder="Buscar por correo del cliente..."
                className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none"
                style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }}
              />
              <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: GRADIENT, color: '#fff' }}>
                Buscar
              </button>
            </form>

            {cargandoOrdenes && <p className="text-sm" style={{ color: t.muted }}>Buscando...</p>}
            {!cargandoOrdenes && ordenesAdmin.length === 0 && (
              <p className="text-sm text-center py-10" style={{ color: t.muted }}>No hay pedidos que coincidan.</p>
            )}
            <div className="space-y-3">
              {ordenesAdmin.map((o) => {
                const info = ESTADO_INFO[o.estado] || ESTADO_INFO.pendiente;
                const Icon = info.icon;
                return (
                  <div key={o.id} className="rounded-2xl p-4" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon size={13} style={{ color: info.color }} className="shrink-0" />
                        <span className="text-xs font-bold shrink-0" style={{ color: info.color }}>{info.label}</span>
                        <span className="text-xs font-semibold truncate">· {o.email}</span>
                      </div>
                      <span className="font-display font-bold text-sm shrink-0">{Math.round(Number(o.costo_total_creditos)).toLocaleString()} ♦</span>
                    </div>
                    <p className="text-[10px] mb-2" style={{ color: t.muted }}>{new Date(o.creado_en).toLocaleString()}</p>
                    {o.link_cliente && (
                      <a href={o.link_cliente} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] mb-2 truncate" style={{ color: t.muted }}>
                        <Link2 size={10} className="shrink-0" /> <span className="truncate">{o.link_cliente}</span>
                      </a>
                    )}
                    <div className="space-y-1.5">
                      {o.items.map((item) => {
                        const itemInfo = ESTADO_INFO[item.estado] || ESTADO_INFO.pendiente;
                        return (
                          <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-xl text-xs" style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}>
                            <span>{item.nombre_publico} · {item.plataforma}</span>
                            <div className="flex items-center gap-2">
                              <span style={{ color: itemInfo.color }}>{item.cantidad.toLocaleString()} · {itemInfo.label}</span>
                              {(item.estado === 'pendiente' || item.estado === 'procesando') && (
                                <button onClick={() => cancelarItem(item.id)} className="text-[10px] font-bold px-2 py-1 rounded" style={{ background: 'rgba(236,72,153,0.15)', color: '#EC4899' }}>
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'referidos' && (
          <div className="space-y-3">
            <p className="text-xs mb-2" style={{ color: t.muted }}>
              Bonos de 500 créditos marcados como sospechosos (misma IP de registro que otro referido ya premiado, o más de 5 en 24h para el mismo referente). Revisa y decide.
            </p>
            {referidosSospechosos.length === 0 && (
              <p className="text-sm text-center py-10" style={{ color: t.muted }}>No hay bonos de referido pendientes de revisión.</p>
            )}
            {referidosSospechosos.map((b) => (
              <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl p-4" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{b.referente_email} → {b.referido_email}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#F5A623' }}>{b.motivo_sospecha}</p>
                    <p className="text-[10px] mt-1" style={{ color: t.muted }}>IP del referido: {b.ip_registro || '—'} · {new Date(b.creado_en).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => aprobarReferido(b.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }} title="Aprobar — acreditar 500 a cada uno">
                      <Check size={15} style={{ color: '#10B981' }} />
                    </button>
                    <button onClick={() => rechazarReferido(b.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(236,72,153,0.15)' }} title="Rechazar — no acreditar nada">
                      <X size={15} style={{ color: '#EC4899' }} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {tab === 'clientes' && (
          <div>
            <form
              onSubmit={(e) => { e.preventDefault(); buscarClientes(busquedaClienteEmail); }}
              className="flex items-center gap-2 mb-4"
            >
              <input
                value={busquedaClienteEmail}
                onChange={(e) => setBusquedaClienteEmail(e.target.value)}
                placeholder="Buscar por correo del cliente..."
                className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none"
                style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }}
              />
              <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: GRADIENT, color: '#fff' }}>
                Buscar
              </button>
            </form>

            {!cargandoClientes && clientes.length > 0 && !busquedaClienteEmail && (() => {
              const totalPendiente = clientes.reduce((s, c) => s + parseFloat(c.saldo_creditos), 0);
              // Peor caso: todo el saldo se gasta en Seguidores (el margen más
              // bajo del catálogo, ~6x) — reserva sugerida = créditos/300
              // (créditos/600 de costo real, ×2 de colchón de seguridad).
              const reservaSugerida = Math.round(totalPendiente / 300);
              return (
                <div className="rounded-2xl px-4 py-3 mb-4 flex items-center justify-between gap-4" style={{ background: GRADIENT_SOFT, border: '1px solid rgba(124,58,237,0.3)' }}>
                  <div>
                    <p className="text-[10px]" style={{ color: t.muted }}>Saldo pendiente en toda la plataforma</p>
                    <p className="font-display font-bold text-sm">{Math.round(totalPendiente).toLocaleString()} ♦</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px]" style={{ color: t.muted }}>Reserva sugerida por proveedor</p>
                    <p className="font-display font-bold text-sm" style={{ color: '#F5A623' }}>${reservaSugerida.toLocaleString()}</p>
                  </div>
                </div>
              );
            })()}

            {cargandoClientes && <p className="text-sm" style={{ color: t.muted }}>Cargando...</p>}
            {!cargandoClientes && clientes.length === 0 && (
              <p className="text-sm text-center py-10" style={{ color: t.muted }}>No hay clientes que coincidan.</p>
            )}
            <div className="space-y-3">
              {clientes.map((c) => (
                <div key={c.id} className="rounded-2xl p-4" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)', opacity: c.activo === false ? 0.6 : 1 }}>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {c.email} {c.activo === false && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(236,72,153,0.15)', color: '#EC4899' }}>SUSPENDIDA</span>}
                      </p>
                      <p className="text-[10px]" style={{ color: t.muted }}>
                        {c.nombre || 'Sin nombre'} · cliente desde {new Date(c.creado_en).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px]" style={{ color: t.muted }}>Saldo actual</p>
                      <p className="font-display font-bold text-sm" style={{ color: '#F5A623' }}>{Math.round(Number(c.saldo_creditos)).toLocaleString()} ♦</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="px-3 py-2 rounded-xl text-center" style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}>
                      <p className="text-[10px]" style={{ color: t.muted }}>Total recargado</p>
                      <p className="text-xs font-bold">${Number(c.total_recargado_usd).toLocaleString()}</p>
                    </div>
                    <div className="px-3 py-2 rounded-xl text-center" style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}>
                      <p className="text-[10px]" style={{ color: t.muted }}>Recargas</p>
                      <p className="text-xs font-bold">{c.cantidad_recargas}</p>
                    </div>
                    <div className="px-3 py-2 rounded-xl text-center" style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}>
                      <p className="text-[10px]" style={{ color: t.muted }}>Créditos consumidos</p>
                      <p className="text-xs font-bold">{Number(c.creditos_consumidos_total).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${t.inputBorder}` }}>
                    {c.activo === false ? (
                      <button onClick={() => reactivarCliente(c.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                        Reactivar cuenta
                      </button>
                    ) : (
                      <button onClick={() => suspenderCliente(c.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(236,72,153,0.15)', color: '#EC4899' }}>
                        Suspender cuenta
                      </button>
                    )}
                    <input
                      value={ajustesDraft[c.id]?.monto || ''}
                      onChange={(e) => ajustarDraft(c.id, 'monto', e.target.value)}
                      placeholder="± créditos"
                      type="number"
                      className="w-24 text-xs px-2.5 py-1.5 rounded-lg outline-none"
                      style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }}
                    />
                    <input
                      value={ajustesDraft[c.id]?.motivo || ''}
                      onChange={(e) => ajustarDraft(c.id, 'motivo', e.target.value)}
                      placeholder="Motivo del ajuste"
                      className="flex-1 min-w-[140px] text-xs px-2.5 py-1.5 rounded-lg outline-none"
                      style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }}
                    />
                    <button onClick={() => enviarAjuste(c.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: GRADIENT, color: '#fff' }}>
                      Ajustar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'accesos' && (
          <div className="space-y-3">
            <p className="text-xs mb-2" style={{ color: t.muted }}>
              Solicitudes de recuperación de contraseña. Verifica al cliente por WhatsApp antes de generar su clave temporal — solo se muestra una vez, cópiala y envíasela directo.
            </p>
            {solicitudesReset.length === 0 && (
              <p className="text-sm text-center py-10" style={{ color: t.muted }}>No hay solicitudes pendientes.</p>
            )}
            {solicitudesReset.map((s) => (
              <div key={s.id} className="rounded-2xl p-4" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{s.email}</p>
                    <p className="text-[10px]" style={{ color: t.muted }}>{new Date(s.creado_en).toLocaleString()}</p>
                  </div>
                  {!passwordsGeneradas[s.id] && (
                    <button onClick={() => resolverAcceso(s.id)} className="text-xs font-semibold px-3.5 py-2 rounded-lg shrink-0" style={{ background: GRADIENT, color: '#fff' }}>
                      Generar contraseña temporal
                    </button>
                  )}
                </div>
                {passwordsGeneradas[s.id] && (
                  <div className="mt-3 pt-3 flex items-center justify-between gap-3" style={{ borderTop: `1px solid ${t.inputBorder}` }}>
                    <div>
                      <p className="text-[10px]" style={{ color: t.muted }}>Contraseña temporal — envíasela por WhatsApp ahora</p>
                      <p className="font-display font-bold text-sm" style={{ color: '#F5A623' }}>{passwordsGeneradas[s.id]}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
