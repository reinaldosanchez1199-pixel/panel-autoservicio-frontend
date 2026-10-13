// ============================================
// Recargar.jsx — recarga de Viral Credits dentro de la plataforma:
// monto + método -> instrucciones de pago (con botones de copiar) -> subir
// comprobante -> confirmación. WhatsApp queda solo como soporte opcional.
//
// Importante: subir un comprobante NO acredita nada. El admin aprueba a mano
// y recién ahí se acreditan los créditos (lo valida el backend).
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Flame, Gem, Crown, Trophy, CheckCircle2, Clock, XCircle, Copy, Check, Upload, FileText, X as XIcon,
  Landmark, Smartphone, Send, Wallet, Coins, Bitcoin, CreditCard, Link2, MessageCircle, ArrowLeft, AlertTriangle, Loader2, Info,
} from 'lucide-react';
import { api } from './api';
import { trackPixel, trackEvento } from './metaPixel';
import { GRADIENT, GRADIENT_SOFT, GOLD_GRADIENT } from './theme';

const TIER_ICONOS = [Zap, Flame, Gem, Crown, Trophy];
const GOLD = '#F5A623';
const TEXTO_SOBRE_DORADO = '#3D2A08';

// Métodos con enlace de pago (los envía el equipo por chat): sin datos de
// transferencia ni comprobante en la plataforma.
const METODOS_ENLACE = ['Tarjeta', 'Apple Pay', 'Google Pay', 'Amazon Pay', 'Cash App', 'Cuotas'];
const METODOS_MANUALES = [
  'Zelle', 'PayPal', 'Binance', 'Criptomonedas', 'Banesco Panamá', 'Towerbank', 'Yappy', 'Bancolombia', 'Nequi', 'BancoEstado',
];
const ICONO_METODO = {
  Zelle: Send, PayPal: Wallet, Binance: Coins, Criptomonedas: Bitcoin,
  'Banesco Panamá': Landmark, Towerbank: Landmark, Bancolombia: Landmark, BancoEstado: Landmark,
  Yappy: Smartphone, Nequi: Smartphone,
  Tarjeta: CreditCard, 'Apple Pay': Smartphone, 'Google Pay': Smartphone, 'Amazon Pay': Link2, 'Cash App': Link2, Cuotas: CreditCard,
};

// Equivalente en moneda local (informativo): la tasa la define el dueño en el backend.
const MONEDA_POR_MEDIO = { Bancolombia: 'COP', Nequi: 'COP', BancoEstado: 'CLP' };
const MONEDA_POR_PAIS = { CO: 'COP', CL: 'CLP' };
const LOCALE_MONEDA = { COP: 'es-CO', CLP: 'es-CL' };
const REDONDEO_MONEDA = { COP: 100, CLP: 10 };
function montoLocal(usd, moneda, tasas) {
  const tasa = Number(tasas?.[moneda]);
  if (!moneda || !tasa || !Number(usd)) return null;
  const paso = REDONDEO_MONEDA[moneda] || 1;
  const valor = Math.round((Number(usd) * tasa) / paso) * paso;
  return `$${valor.toLocaleString(LOCALE_MONEDA[moneda])} ${moneda}`;
}

const TIPOS_ARCHIVO = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_BYTES = 5 * 1024 * 1024;

const ESTADOS = {
  pendiente: { label: 'Pendiente de pago', color: GOLD, icon: Clock },
  pendiente_pago: { label: 'Pendiente de pago', color: GOLD, icon: Clock },
  en_verificacion: { label: 'En verificación', color: '#A78BFA', icon: Clock },
  aprobado: { label: 'Aprobada', color: '#10B981', icon: CheckCircle2 },
  rechazado: { label: 'Rechazada', color: '#EC4899', icon: XCircle },
};

const fmtNum = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const fmtUsd = (n) => `$${Number(n || 0).toFixed(2)} USD`;
const codigoCorto = (id) => String(id || '').slice(0, 8).toUpperCase();
const fmtFecha = (f) => (f ? new Date(f).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

// "*Zelle:* correo@x.com" -> campos con botón de copiar; el resto son avisos.
function parsearInstrucciones(texto) {
  const campos = [];
  const avisos = [];
  for (const crudo of String(texto || '').split('\n')) {
    const linea = crudo.trim();
    if (!linea) continue;
    const m = linea.match(/^\*(.+?):\*\s*(.*)$/);
    if (m) {
      campos.push({ label: m[1], value: m[2] });
    } else if (campos.length && !campos[campos.length - 1].value) {
      campos[campos.length - 1].value = linea; // valor en la línea siguiente (ej. dirección USDT)
    } else {
      avisos.push(linea.replace(/^IMPORTANTE:\s*/i, ''));
    }
  }
  return { campos, avisos };
}

function BotonCopiar({ valor, t }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor);
    } catch {
      const el = document.createElement('textarea');
      el.value = valor; document.body.appendChild(el); el.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(el);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  };
  return (
    <button onClick={copiar} className="shrink-0 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg"
      style={{ background: copiado ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.18)', color: copiado ? '#10B981' : '#C4B5FD', border: `1px solid ${t.border}` }}
      aria-label="Copiar">
      {copiado ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
    </button>
  );
}

function ChipEstado({ estado }) {
  const e = ESTADOS[estado] || ESTADOS.pendiente_pago;
  const Icono = e.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: `${e.color}22`, color: e.color }}>
      <Icono size={11} /> {e.label}
    </span>
  );
}

export default function Recargar({ paquetes, t, whatsappNumero, email, onCerrar, vistaInicial = 'nueva' }) {
  const [vista, setVista] = useState(vistaInicial); // 'nueva' | 'historial'
  const [paso, setPaso] = useState('elegir'); // 'elegir' | 'pagar' | 'confirmado'
  const [paqueteId, setPaqueteId] = useState(null);
  const [recarga, setRecarga] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [datosPago, setDatosPago] = useState({});
  const [tasas, setTasas] = useState({});
  const [monedaLocal, setMonedaLocal] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    api.datosPago().then(setDatosPago).catch(() => {});
    api.tasasMoneda().then(setTasas).catch(() => {});
    fetch('/api/geo').then((r) => r.json()).then((g) => setMonedaLocal(MONEDA_POR_PAIS[g?.pais] || null)).catch(() => {});
    trackEvento('recharge_started', undefined, `panel-${Date.now()}`);
  }, []);

  const cargarHistorial = useCallback(async () => {
    try { setHistorial(await api.misRecargas()); } catch (err) { setError(err.message); }
  }, []);
  useEffect(() => { if (vista === 'historial') cargarHistorial(); }, [vista, cargarHistorial]);

  // Libera la URL de la vista previa cuando cambia o se desmonta.
  useEffect(() => () => { if (vistaPrevia) URL.revokeObjectURL(vistaPrevia); }, [vistaPrevia]);

  const limpiarArchivo = () => { setArchivo(null); setVistaPrevia(null); setError(''); if (inputRef.current) inputRef.current.value = ''; };

  const elegirArchivo = (f) => {
    setError('');
    if (!f) return;
    if (!TIPOS_ARCHIVO.includes(f.type)) { setError('Formato no permitido. Usa JPG, PNG, WEBP o PDF.'); return; }
    if (f.size > MAX_BYTES) { setError('El archivo supera los 5 MB. Sube una captura más liviana.'); return; }
    setArchivo(f);
    setVistaPrevia(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
  };

  const elegirMetodo = async (metodo) => {
    if (!paqueteId || cargando) return;
    setCargando(true); setError('');
    try {
      const r = await api.recargaIniciar(paqueteId, metodo);
      setRecarga(r);
      limpiarArchivo();
      setPaso('pagar');
      trackPixel('InitiateCheckout', { value: Number(r.monto_declarado) || 0, currency: 'USD' });
      trackEvento('payment_method_selected', { metodo }, r.id);
      trackEvento('payment_instructions_viewed', { metodo }, r.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const retomar = (r) => {
    setRecarga(r); limpiarArchivo(); setError(''); setPaso('pagar'); setVista('nueva');
    trackEvento('payment_instructions_viewed', { metodo: r.metodo }, r.id);
  };

  const enviarComprobante = async () => {
    if (!archivo || subiendo) return;
    setSubiendo(true); setProgreso(0); setError('');
    try {
      const r = await api.recargaSubirComprobante(recarga.id, archivo, setProgreso);
      setRecarga({ ...recarga, ...r });
      trackEvento('payment_proof_uploaded', { metodo: recarga.metodo }, recarga.id);
      trackEvento('recharge_submitted', { metodo: recarga.metodo }, recarga.id);
      setPaso('confirmado');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const confirmarPagoConEnlace = async () => {
    setSubiendo(true); setError('');
    try {
      const r = await api.recargaEnviar(recarga.id);
      setRecarga({ ...recarga, ...r });
      trackEvento('recharge_submitted', { metodo: recarga.metodo }, recarga.id);
      setPaso('confirmado');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const verComprobante = async (id) => {
    try {
      const blob = await api.comprobanteBlob(id);
      window.open(URL.createObjectURL(blob), '_blank', 'noopener');
    } catch (err) { setError(err.message); }
  };

  const enlaceSoporte = (r) => {
    if (!whatsappNumero) return null;
    const texto = r
      ? `Hola, necesito ayuda con mi recarga en Viralizame.com.\nSolicitud: ${codigoCorto(r.id)}\nMétodo: ${r.metodo}\nCorreo: ${email || '—'}`
      : `Hola, necesito ayuda con una recarga en Viralizame.com.\nCorreo: ${email || '—'}`;
    return `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(texto)}`;
  };

  const tarjeta = { background: t.input, border: `1px solid ${t.inputBorder}` };
  const botonDorado = { background: GOLD_GRADIENT, color: TEXTO_SOBRE_DORADO, boxShadow: '0 6px 20px rgba(245,166,35,0.3)' };

  // ---------- Encabezado + pestañas ----------
  const Cabecera = (
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="flex items-center gap-2 min-w-0">
        {paso === 'pagar' && vista === 'nueva' && (
          <button onClick={() => { setPaso('elegir'); setRecarga(null); setError(''); }} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={tarjeta} aria-label="Volver">
            <ArrowLeft size={15} />
          </button>
        )}
        <h2 className="font-display font-bold text-base truncate">Recargar Viral Credits</h2>
      </div>
      <button onClick={onCerrar} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={tarjeta} aria-label="Cerrar">
        <XIcon size={15} />
      </button>
    </div>
  );

  const Pestanas = (
    <div className="flex gap-1.5 mb-4">
      {[['nueva', 'Nueva recarga'], ['historial', 'Mis recargas']].map(([id, label]) => (
        <button key={id} onClick={() => { setVista(id); setError(''); }}
          className="text-xs font-bold px-3.5 py-2 rounded-full"
          style={{ background: vista === id ? GRADIENT : t.input, color: vista === id ? '#fff' : t.muted, border: `1px solid ${t.inputBorder}` }}>
          {label}
        </button>
      ))}
    </div>
  );

  const BloqueError = error && (
    <div className="flex items-start gap-2 text-xs rounded-xl px-3 py-2.5 mb-3" style={{ background: 'rgba(236,72,153,0.12)', color: '#F9A8D4', border: '1px solid rgba(236,72,153,0.3)' }}>
      <AlertTriangle size={14} className="shrink-0 mt-0.5" /> <span>{error}</span>
    </div>
  );

  // ---------- Pantalla: elegir monto y método ----------
  const paqueteElegido = paquetes.find((p) => p.id === paqueteId);
  const PantallaElegir = (
    <div>
      <p className="text-xs font-semibold mb-2" style={{ color: t.muted }}>1. Elige cuántos Viral Credits quieres</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {paquetes.map((p, i) => {
          const Icono = TIER_ICONOS[Math.min(i, TIER_ICONOS.length - 1)];
          const esMejorValor = i === paquetes.length - 1;
          const activo = paqueteId === p.id;
          const local = monedaLocal ? montoLocal(p.precio_usd, monedaLocal, tasas) : null;
          return (
            <motion.button key={p.id} whileTap={{ scale: 0.97 }} onClick={() => setPaqueteId(p.id)}
              className="rounded-xl p-3 text-left relative overflow-hidden"
              style={{
                background: activo ? GRADIENT_SOFT : t.input,
                border: activo ? '2px solid #EC4899' : esMejorValor ? '1px solid rgba(245,166,35,0.5)' : `1px solid ${t.inputBorder}`,
              }}>
              {esMejorValor && (
                <span className="absolute top-0 right-0 text-[8px] font-bold px-2 py-0.5 rounded-bl-lg" style={{ background: GOLD_GRADIENT, color: TEXTO_SOBRE_DORADO }}>MEJOR VALOR</span>
              )}
              <Icono size={14} style={{ color: esMejorValor ? GOLD : '#C4B5FD' }} className="mb-1.5" />
              <p className="font-display font-bold text-sm" style={{ color: GOLD }}>{fmtNum(p.creditos_otorgados)} ♦</p>
              <p className="text-xs" style={{ color: t.muted }}>${Number(p.precio_usd).toFixed(2)} USD</p>
              {local && <p className="text-[10px]" style={{ color: t.muted }}>≈ {local}</p>}
            </motion.button>
          );
        })}
      </div>

      {paqueteElegido && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: t.muted }}>2. ¿Cómo vas a pagar?</p>
          {[
            ['Transferencia y billeteras', METODOS_MANUALES],
            ['Tarjeta y billeteras digitales (te enviamos un enlace de pago)', METODOS_ENLACE],
          ].map(([titulo, lista]) => {
            const ordenados = [...lista].sort((a, b) => (MONEDA_POR_MEDIO[b] === monedaLocal && monedaLocal ? 1 : 0) - (MONEDA_POR_MEDIO[a] === monedaLocal && monedaLocal ? 1 : 0));
            return (
              <div key={titulo} className="mb-3">
                <p className="text-[10px] uppercase tracking-wide mb-1.5" style={{ color: t.muted }}>{titulo}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ordenados.map((m) => {
                    const Icono = ICONO_METODO[m] || CreditCard;
                    return (
                      <button key={m} disabled={cargando} onClick={() => elegirMetodo(m)}
                        className="flex items-center gap-2 text-xs font-semibold px-3 py-3 rounded-xl text-left"
                        style={{ ...tarjeta, opacity: cargando ? 0.6 : 1 }}>
                        <Icono size={15} style={{ color: '#C4B5FD' }} className="shrink-0" />
                        <span className="truncate">{m}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {cargando && <p className="text-xs flex items-center gap-1.5" style={{ color: t.muted }}><Loader2 size={13} className="animate-spin" /> Preparando tu recarga...</p>}
        </div>
      )}
    </div>
  );

  // ---------- Pantalla: instrucciones + comprobante ----------
  const esEnlace = recarga && METODOS_ENLACE.includes(recarga.metodo);
  const PantallaPagar = recarga && (() => {
    const IconoMetodo = ICONO_METODO[recarga.metodo] || CreditCard;
    const { campos, avisos } = parsearInstrucciones(datosPago[recarga.metodo]);
    const conComision = Number(recarga.monto_a_pagar) > Number(recarga.monto_declarado);
    const local = montoLocal(recarga.monto_a_pagar, MONEDA_POR_MEDIO[recarga.metodo], tasas);
    const soporte = enlaceSoporte(recarga);
    return (
      <div className="space-y-3">
        {/* Resumen */}
        <div className="rounded-2xl p-4" style={{ background: GRADIENT_SOFT, border: '1px solid rgba(124,58,237,0.3)' }}>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px]" style={{ color: t.muted }}>Vas a recibir</p>
              <p className="font-display font-extrabold text-xl sm:text-2xl whitespace-nowrap" style={{ color: GOLD }}>{fmtNum(recarga.creditos_a_acreditar)} <span className="text-xs font-bold">Viral Credits</span></p>
            </div>
            <div className="text-right">
              <p className="text-[11px]" style={{ color: t.muted }}>Total a pagar</p>
              <p className="font-display font-extrabold text-lg sm:text-xl whitespace-nowrap">{fmtUsd(recarga.monto_a_pagar)}</p>
              {local && <p className="text-[11px]" style={{ color: t.muted }}>≈ {local}</p>}
            </div>
          </div>
          {conComision && (
            <p className="text-[11px] mt-2" style={{ color: t.muted }}>
              Incluye la comisión de {recarga.metodo} ({fmtUsd(recarga.monto_declarado)} + {fmtUsd(Number(recarga.monto_a_pagar) - Number(recarga.monto_declarado))}). Envía exactamente el total.
            </p>
          )}
        </div>

        {/* Método + datos */}
        <div className="rounded-2xl p-4" style={tarjeta}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: GRADIENT }}><IconoMetodo size={16} color="#fff" /></span>
            <div>
              <p className="text-[11px]" style={{ color: t.muted }}>Método de pago</p>
              <p className="text-sm font-bold">{recarga.metodo}</p>
            </div>
          </div>

          {esEnlace ? (
            <div className="space-y-2.5">
              <div className="flex items-start gap-2 text-xs rounded-xl px-3 py-2.5" style={{ background: 'rgba(124,58,237,0.12)', border: `1px solid ${t.border}` }}>
                <Link2 size={14} className="shrink-0 mt-0.5" style={{ color: '#C4B5FD' }} />
                <span>Para pagar con {recarga.metodo} te enviamos un <strong>enlace de pago seguro</strong> con asistencia de nuestro equipo. Pídelo por WhatsApp y, cuando completes el pago, vuelve aquí y confírmalo.</span>
              </div>
              {soporte && (
                <a href={soporte} target="_blank" rel="noopener noreferrer"
                  onClick={() => trackEvento('payment_support_clicked', { metodo: recarga.metodo }, recarga.id)}
                  className="flex items-center justify-center gap-2 text-xs font-bold px-4 py-3 rounded-xl" style={{ background: '#25D366', color: '#08331C' }}>
                  <MessageCircle size={15} /> Solicitar mi enlace de pago por WhatsApp
                </a>
              )}
              <button onClick={confirmarPagoConEnlace} disabled={subiendo}
                className="w-full text-sm font-bold px-4 py-3 rounded-xl" style={{ ...botonDorado, opacity: subiendo ? 0.6 : 1 }}>
                {subiendo ? 'Enviando...' : 'Ya realicé el pago con el enlace'}
              </button>
            </div>
          ) : campos.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold" style={{ color: t.muted }}>Datos para realizar el pago</p>
              {campos.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5" style={{ background: 'rgba(124,58,237,0.1)', border: `1px solid ${t.border}` }}>
                  <div className="min-w-0">
                    <p className="text-[10px]" style={{ color: t.muted }}>{c.label}</p>
                    <p className="text-sm font-semibold break-all">{c.value || '—'}</p>
                  </div>
                  {c.value && <BotonCopiar valor={c.value} t={t} />}
                </div>
              ))}
              {avisos.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-xs rounded-xl px-3 py-2.5" style={{ background: 'rgba(245,166,35,0.1)', color: '#FCD34D', border: '1px solid rgba(245,166,35,0.25)' }}>
                  <Info size={14} className="shrink-0 mt-0.5" /> <span>{a}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-start gap-2 text-xs rounded-xl px-3 py-2.5" style={{ background: 'rgba(245,166,35,0.1)', color: '#FCD34D', border: '1px solid rgba(245,166,35,0.25)' }}>
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>Los datos de este método no están disponibles aquí todavía. Escríbenos por WhatsApp y te los enviamos enseguida.</span>
            </div>
          )}
        </div>

        {/* Comprobante (solo métodos de transferencia) */}
        {!esEnlace && (
          <div className="rounded-2xl p-4" style={tarjeta}>
            <p className="text-sm font-bold mb-0.5">¿Ya realizaste tu pago?</p>
            <p className="text-xs mb-3" style={{ color: t.muted }}>
              Adjunta tu comprobante para que nuestro equipo pueda verificar tu pago y acreditar tus Viral Credits.
            </p>

            {!archivo ? (
              <label
                onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={(e) => { e.preventDefault(); setArrastrando(false); elegirArchivo(e.dataTransfer.files?.[0]); }}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl py-6 px-3 text-center cursor-pointer"
                style={{ border: `2px dashed ${arrastrando ? '#EC4899' : t.borderStrong}`, background: arrastrando ? GRADIENT_SOFT : 'transparent' }}>
                <Upload size={20} style={{ color: '#C4B5FD' }} />
                <span className="text-xs font-semibold">Toca para seleccionar o arrastra tu comprobante</span>
                <span className="text-[10px]" style={{ color: t.muted }}>JPG, PNG, WEBP o PDF · máximo 5 MB</span>
                <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden" onChange={(e) => elegirArchivo(e.target.files?.[0])} />
              </label>
            ) : (
              <div className="rounded-xl p-3 flex items-center gap-3" style={{ border: `1px solid ${t.border}`, background: 'rgba(124,58,237,0.08)' }}>
                {vistaPrevia ? (
                  <img src={vistaPrevia} alt="Vista previa del comprobante" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                ) : (
                  <span className="w-16 h-16 rounded-lg flex items-center justify-center shrink-0" style={tarjeta}><FileText size={22} style={{ color: '#C4B5FD' }} /></span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{archivo.name}</p>
                  <p className="text-[10px]" style={{ color: t.muted }}>{(archivo.size / 1024 / 1024).toFixed(2)} MB</p>
                  {!subiendo && (
                    <div className="flex gap-3 mt-1.5">
                      <button onClick={() => inputRef.current?.click()} className="text-[11px] font-bold" style={{ color: '#C4B5FD' }}>Reemplazar</button>
                      <button onClick={limpiarArchivo} className="text-[11px] font-bold" style={{ color: '#F9A8D4' }}>Eliminar</button>
                      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden" onChange={(e) => elegirArchivo(e.target.files?.[0])} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {subiendo && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: t.input }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${progreso}%`, background: GRADIENT }} />
                </div>
                <p className="text-[11px] mt-1" style={{ color: t.muted }}>Subiendo comprobante... {progreso}%</p>
              </div>
            )}

            <button onClick={enviarComprobante} disabled={!archivo || subiendo}
              className="w-full mt-3 text-sm font-bold px-4 py-3 rounded-xl"
              style={{ ...botonDorado, opacity: !archivo || subiendo ? 0.5 : 1, cursor: !archivo || subiendo ? 'not-allowed' : 'pointer' }}>
              {subiendo ? 'Enviando...' : 'Enviar comprobante'}
            </button>
            {!archivo && <p className="text-[10px] text-center mt-1.5" style={{ color: t.muted }}>Adjunta tu comprobante para poder enviarlo.</p>}
          </div>
        )}

        {/* Soporte opcional */}
        {soporte && (
          <p className="text-xs text-center pt-1" style={{ color: t.muted }}>
            ¿Necesitas ayuda?{' '}
            <a href={soporte} target="_blank" rel="noopener noreferrer" className="font-bold underline"
              onClick={() => trackEvento('payment_support_clicked', { metodo: recarga.metodo }, recarga.id)}>
              Contactar soporte
            </a>
          </p>
        )}
      </div>
    );
  })();

  // ---------- Pantalla: confirmación ----------
  const PantallaConfirmada = recarga && (
    <div className="text-center">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
        <CheckCircle2 size={30} style={{ color: '#10B981' }} />
      </motion.div>
      <h3 className="font-display font-bold text-lg mb-1">¡Comprobante recibido!</h3>
      <p className="text-xs mb-4" style={{ color: t.muted }}>
        Hemos recibido tu comprobante de pago. Nuestro equipo verificará la información y acreditará tus Viral Credits una vez confirmado el pago.
      </p>
      <div className="rounded-2xl p-4 text-left space-y-2 mb-4" style={tarjeta}>
        {[
          ['Número de solicitud', codigoCorto(recarga.id)],
          ['Viral Credits', `${fmtNum(recarga.creditos_a_acreditar)} ♦`],
          ['Método', recarga.metodo],
          ['Fecha de solicitud', fmtFecha(recarga.enviado_en || recarga.creado_en)],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 text-xs">
            <span style={{ color: t.muted }}>{k}</span>
            <span className="font-semibold text-right" style={k === 'Viral Credits' ? { color: GOLD } : undefined}>{v}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 text-xs">
          <span style={{ color: t.muted }}>Estado</span>
          <ChipEstado estado="en_verificacion" />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <button onClick={() => { setVista('historial'); setPaso('elegir'); setRecarga(null); }}
          className="flex-1 text-sm font-bold px-4 py-3 rounded-xl" style={botonDorado}>Ver mis recargas</button>
        <button onClick={onCerrar} className="flex-1 text-sm font-semibold px-4 py-3 rounded-xl" style={tarjeta}>Volver al Dashboard</button>
      </div>
    </div>
  );

  // ---------- Historial ----------
  const Historial = (
    <div className="space-y-2.5">
      {historial === null && <p className="text-xs py-6 text-center" style={{ color: t.muted }}>Cargando tus recargas...</p>}
      {historial?.length === 0 && (
        <p className="text-xs py-6 text-center" style={{ color: t.muted }}>Aún no tienes solicitudes de recarga.</p>
      )}
      {historial?.map((r) => {
        const abierta = r.estado === 'pendiente_pago' || r.estado === 'pendiente';
        const soporte = enlaceSoporte(r);
        return (
          <div key={r.id} className="rounded-2xl p-3.5" style={tarjeta}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display font-bold text-sm" style={{ color: GOLD }}>{fmtNum(r.creditos_a_acreditar)} ♦</p>
                <p className="text-xs" style={{ color: t.muted }}>{fmtUsd(r.monto_a_pagar)} · {r.metodo || '—'}</p>
                <p className="text-[10px]" style={{ color: t.muted }}>{fmtFecha(r.creado_en)} · #{codigoCorto(r.id)}</p>
              </div>
              <ChipEstado estado={r.estado} />
            </div>
            {r.estado === 'rechazado' && (
              <div className="mt-2.5 text-xs rounded-xl px-3 py-2" style={{ background: 'rgba(236,72,153,0.1)', color: '#F9A8D4', border: '1px solid rgba(236,72,153,0.25)' }}>
                <p><strong>Motivo:</strong> {r.motivo_rechazo || 'No se pudo verificar el pago.'}</p>
                <p className="mt-1" style={{ color: t.muted }}>Puedes crear una nueva recarga{soporte ? ' o contactar a soporte' : ''}.</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {abierta && <button onClick={() => retomar(r)} className="text-xs font-bold px-3 py-2 rounded-lg" style={botonDorado}>Continuar pago</button>}
              {r.tiene_comprobante && <button onClick={() => verComprobante(r.id)} className="text-xs font-semibold px-3 py-2 rounded-lg" style={tarjeta}>Ver comprobante</button>}
              {r.estado === 'rechazado' && (
                <button onClick={() => { setVista('nueva'); setPaso('elegir'); setRecarga(null); }} className="text-xs font-bold px-3 py-2 rounded-lg" style={botonDorado}>Nueva recarga</button>
              )}
              {soporte && (r.estado === 'rechazado' || r.estado === 'en_verificacion') && (
                <a href={soporte} target="_blank" rel="noopener noreferrer" onClick={() => trackEvento('payment_support_clicked', { metodo: r.metodo }, r.id)}
                  className="text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5" style={tarjeta}>
                  <MessageCircle size={12} /> Soporte
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      {Cabecera}
      {paso !== 'confirmado' && Pestanas}
      {BloqueError}
      <AnimatePresence mode="wait">
        <motion.div key={vista + paso} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {vista === 'historial' ? Historial
            : paso === 'elegir' ? PantallaElegir
            : paso === 'pagar' ? PantallaPagar
            : PantallaConfirmada}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
