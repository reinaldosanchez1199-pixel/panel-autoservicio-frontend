import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, Trash2, Plus, Mail, Calendar, Shield } from 'lucide-react';
import { GRADIENT } from './theme';

function formatoFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' });
}

function FormularioPerfil({ plataformas, onAgregar, t }) {
  const [plataforma, setPlataforma] = useState(plataformas[0] || '');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [url, setUrl] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setEnviando(true);
    setError('');
    try {
      await onAgregar(plataforma, nombreUsuario.trim(), url.trim());
      setNombreUsuario('');
      setUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid sm:grid-cols-[auto_1fr_1fr_auto] gap-2 items-start">
      <select
        value={plataforma}
        onChange={(e) => setPlataforma(e.target.value)}
        className="px-3 py-2.5 rounded-xl text-xs outline-none"
        style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }}
      >
        {plataformas.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <input
        value={nombreUsuario}
        onChange={(e) => setNombreUsuario(e.target.value)}
        placeholder="Usuario (opcional)"
        className="px-3 py-2.5 rounded-xl text-xs outline-none"
        style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }}
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://instagram.com/tu_usuario"
        required
        className="px-3 py-2.5 rounded-xl text-xs outline-none"
        style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }}
      />
      <button
        type="submit"
        disabled={enviando}
        className="flex items-center justify-center gap-1 px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0"
        style={{ background: GRADIENT, color: '#fff', opacity: enviando ? 0.6 : 1 }}
      >
        <Plus size={14} /> Guardar
      </button>
      {error && <p className="sm:col-span-4 text-[11px]" style={{ color: '#EC4899' }}>{error}</p>}
    </form>
  );
}

export default function Cuenta({ me, wallet, plataformas, perfiles, onAgregarPerfil, onBorrarPerfil, t }) {
  return (
    <div className="space-y-6 mb-6">
      <div className="rounded-3xl p-6" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}>
        <h2 className="font-display font-bold text-lg mb-4">Tu cuenta</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2.5">
            <Mail size={15} style={{ color: '#C4B5FD' }} />
            <div>
              <p className="text-[10px]" style={{ color: t.muted }}>Email</p>
              <p className="text-xs font-medium break-all">{me?.email || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar size={15} style={{ color: '#C4B5FD' }} />
            <div>
              <p className="text-[10px]" style={{ color: t.muted }}>Miembro desde</p>
              <p className="text-xs font-medium">{formatoFecha(me?.creado_en)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Shield size={15} style={{ color: '#C4B5FD' }} />
            <div>
              <p className="text-[10px]" style={{ color: t.muted }}>Nivel</p>
              <p className="text-xs font-medium">{wallet.nivel} · -{wallet.descuento_pct}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Bookmark size={15} style={{ color: '#EC4899' }} />
          <h2 className="font-display font-bold text-lg">Perfiles guardados</h2>
        </div>
        <p className="text-xs mb-4" style={{ color: t.muted }}>Guarda tus perfiles y publicaciones frecuentes para llenarlos con un clic al crear una campaña.</p>

        {perfiles.length > 0 && (
          <div className="space-y-2 mb-4">
            {perfiles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl"
                style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{p.plataforma} {p.nombre_usuario ? `· ${p.nombre_usuario}` : ''}</p>
                  <p className="text-[11px] truncate" style={{ color: t.muted }}>{p.url}</p>
                </div>
                <button onClick={() => onBorrarPerfil(p.id)} className="shrink-0 p-1.5 rounded-lg" style={{ color: t.muted }}>
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {plataformas.length > 0 && (
          <FormularioPerfil plataformas={plataformas} onAgregar={onAgregarPerfil} t={t} />
        )}
      </div>
    </div>
  );
}
