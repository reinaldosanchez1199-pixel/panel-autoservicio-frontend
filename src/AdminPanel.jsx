import { useState, useEffect, useCallback } from 'react';
import { Check, X, Image as ImageIcon, Package, Wallet, ArrowLeft, LogOut } from 'lucide-react';
import { api } from './api';

export default function AdminPanel({ onVolver, onCerrarSesion }) {
  const [tab, setTab] = useState('recargas');
  const [recargas, setRecargas] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [borradores, setBorradores] = useState({}); // { [serviceId]: { plataforma, nombrePublico, margen } }

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

  useEffect(() => {
    cargar();
  }, [cargar]);

  const aprobar = async (id) => {
    try {
      await api.adminAprobarRecarga(id);
      setRecargas((r) => r.filter((x) => x.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const rechazar = async (id) => {
    try {
      await api.adminRechazarRecarga(id);
      setRecargas((r) => r.filter((x) => x.id !== id));
    } catch (err) {
      setError(err.message);
    }
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
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ background: '#140F2E', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#F1EDFC' }} className="p-4 sm:p-8">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap'); .font-display{font-family:'Sora',sans-serif;}`}</style>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <button onClick={onVolver} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#8B7FB8' }}>
            <ArrowLeft size={14} /> Volver al panel
          </button>
          <button onClick={onCerrarSesion} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#8B7FB8' }}>
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
        <p className="text-xs uppercase tracking-widest mb-1 mt-4" style={{ color: '#8B7FB8' }}>Panel interno</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold italic mb-6">Administración</h1>

        {error && (
          <div className="rounded-2xl p-4 mb-4 text-sm" style={{ background: 'rgba(232,67,122,0.1)', border: '1px solid #E8437A', color: '#E8437A' }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('recargas')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: tab === 'recargas' ? 'linear-gradient(135deg, #E8437A, #F5A623)' : '#1C1640',
              color: tab === 'recargas' ? '#140F2E' : '#8B7FB8',
              border: '1px solid #2E2560',
            }}
          >
            <Wallet size={15} /> Recargas ({recargas.length})
          </button>
          <button
            onClick={() => setTab('servicios')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: tab === 'servicios' ? 'linear-gradient(135deg, #E8437A, #F5A623)' : '#1C1640',
              color: tab === 'servicios' ? '#140F2E' : '#8B7FB8',
              border: '1px solid #2E2560',
            }}
          >
            <Package size={15} /> Servicios nuevos ({pendientes.length})
          </button>
        </div>

        {cargando && <p className="text-sm" style={{ color: '#8B7FB8' }}>Cargando...</p>}

        {/* Tab: Recargas */}
        {!cargando && tab === 'recargas' && (
          <div className="space-y-3">
            {recargas.length === 0 && (
              <p className="text-sm text-center py-10" style={{ color: '#8B7FB8' }}>No hay recargas pendientes.</p>
            )}
            {recargas.map((r) => (
              <div key={r.id} className="rounded-2xl p-4 flex items-center justify-between gap-4" style={{ background: '#1C1640', border: '1px solid #2E2560' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <a href={r.comprobante_url} target="_blank" rel="noreferrer" className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#150F33', border: '1px solid #2A2352' }}>
                    <ImageIcon size={16} style={{ color: '#8B7FB8' }} />
                  </a>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{r.email}</p>
                    <p className="text-xs" style={{ color: '#8B7FB8' }}>${r.monto_declarado} · {new Date(r.creado_en).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-display font-bold text-sm" style={{ color: '#F5A623' }}>+{Number(r.creditos_a_acreditar).toLocaleString()} ♦</span>
                  <button onClick={() => aprobar(r.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.15)' }}>
                    <Check size={15} style={{ color: '#4ADE80' }} />
                  </button>
                  <button onClick={() => rechazar(r.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(232,67,122,0.15)' }}>
                    <X size={15} style={{ color: '#E8437A' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Servicios pendientes de curar */}
        {!cargando && tab === 'servicios' && (
          <div className="space-y-3">
            {pendientes.length === 0 && (
              <p className="text-sm text-center py-10" style={{ color: '#8B7FB8' }}>No hay servicios nuevos por revisar.</p>
            )}
            {pendientes.map((s) => {
              const borrador = borradores[s.id] || {};
              const margen = parseFloat(borrador.margen ?? '3.0');
              const costo = parseFloat(s.costo_provider_por_1000);
              return (
                <div key={s.id} className="rounded-2xl p-4" style={{ background: '#1C1640', border: '1px solid #2E2560' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium">{s.nombre_publico}</p>
                    </div>
                    <span className="text-xs" style={{ color: '#8B7FB8' }}>Costo: ${costo}/1000</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <select
                      value={borrador.plataforma || ''}
                      onChange={(e) => actualizarBorrador(s.id, 'plataforma', e.target.value)}
                      className="text-xs px-3 py-2 rounded-lg outline-none"
                      style={{ background: '#150F33', border: '1px solid #2A2352', color: '#F1EDFC' }}
                    >
                      <option value="">Elegir plataforma...</option>
                      <option>Instagram</option>
                      <option>TikTok</option>
                      <option>YouTube</option>
                      <option>Facebook</option>
                      <option>Twitter</option>
                    </select>
                    <input
                      value={borrador.nombrePublico || ''}
                      onChange={(e) => actualizarBorrador(s.id, 'nombrePublico', e.target.value)}
                      placeholder="Nombre público (ej. Seguidores Premium)"
                      className="text-xs px-3 py-2 rounded-lg outline-none"
                      style={{ background: '#150F33', border: '1px solid #2A2352', color: '#F1EDFC' }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-1 px-3 py-2 rounded-lg" style={{ background: '#150F33', border: '1px solid #2A2352' }}>
                      <span className="text-xs" style={{ color: '#8B7FB8' }}>Margen</span>
                      <input
                        value={borrador.margen ?? '3.0'}
                        onChange={(e) => actualizarBorrador(s.id, 'margen', e.target.value)}
                        className="bg-transparent outline-none text-xs w-10"
                        style={{ color: '#F1EDFC' }}
                      />
                      <span className="text-xs" style={{ color: '#8B7FB8' }}>x → {Math.round(costo * (isNaN(margen) ? 3 : margen))} ♦/1000</span>
                    </div>
                    <button onClick={() => activarServicio(s)} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: 'linear-gradient(135deg, #E8437A, #F5A623)', color: '#140F2E' }}>
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
