import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Image as ImageIcon, Package, Wallet, ArrowLeft, LogOut, Shield } from 'lucide-react';
import { api } from './api';
import AnimatedBackground from './AnimatedBackground';
import { theme, GRADIENT, FONT_IMPORT } from './theme';

export default function AdminPanel({ onVolver, onCerrarSesion }) {
  const [tab, setTab] = useState('recargas');
  const [recargas, setRecargas] = useState([]);
  const [pendientes, setPendientes] = useState([]);
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
                  <span className="font-display font-bold text-sm" style={{ color: '#F5A623' }}>+{Number(r.creditos_a_acreditar).toLocaleString()} ♦</span>
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
      </div>
    </div>
  );
}
