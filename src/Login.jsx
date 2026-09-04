import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, TrendingUp, Cpu } from 'lucide-react';
import { api, setToken } from './api';
import AnimatedBackground from './AnimatedBackground';
import { theme, GRADIENT, FONT_IMPORT } from './theme';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const PILARES = [
  { icon: Cpu, texto: 'Motor de distribución con IA que decide el mejor ritmo de entrega' },
  { icon: TrendingUp, texto: 'Créditos virales: un solo saldo para impulsar cualquier plataforma' },
  { icon: Zap, texto: 'Resultados visibles en minutos, no en días' },
];

export default function Login({ onAuth }) {
  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const t = theme.dark;
  const googleBtnRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const data = modo === 'login' ? await api.login(email, password) : await api.registro(email, password, nombre);
      setToken(data.token);
      onAuth();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Botón de Google (Google Identity Services) — un mismo flujo sirve para
  // login y registro: el backend crea la cuenta sola si el email es nuevo.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const iniciar = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setError('');
          setCargando(true);
          try {
            const data = await api.loginGoogle(credential);
            setToken(data.token);
            onAuth();
          } catch (err) {
            setError(err.message);
          } finally {
            setCargando(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black', size: 'large', width: 320, text: 'continue_with', locale: 'es',
      });
    };

    if (window.google?.accounts?.id) iniciar();
    else {
      const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      script?.addEventListener('load', iniciar);
      return () => script?.removeEventListener('load', iniciar);
    }
  }, []);

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: t.text, position: 'relative' }}>
      <style>{`${FONT_IMPORT} .font-display{font-family:'Sora',sans-serif;}`}</style>
      <AnimatedBackground modoOscuro />

      <div className="relative min-h-screen flex items-center justify-center p-4" style={{ zIndex: 1 }}>
        <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-0 rounded-[28px] overflow-hidden" style={{ border: `1px solid ${t.border}`, background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)' }}>
          {/* Panel izquierdo — branding */}
          <div className="hidden lg:flex flex-col justify-between p-10" style={{ background: 'rgba(124,58,237,0.06)' }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: GRADIENT }}>
                  <Sparkles size={18} color="#fff" />
                </div>
                <span className="font-display text-xl font-extrabold">Viralizame</span>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] mt-1" style={{ color: t.muted }}>AI Growth Engine</p>

              <h1 className="font-display text-3xl font-extrabold leading-tight mt-8">
                Crecimiento impulsado por{' '}
                <span style={{ background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  inteligencia artificial
                </span>
              </h1>
              <p className="text-sm mt-3" style={{ color: t.muted }}>
                Convierte créditos en alcance real: la plataforma analiza, distribuye y optimiza cada campaña por ti.
              </p>
            </div>

            <div className="space-y-4 mt-10">
              {PILARES.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 * i, duration: 0.5 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${t.border}` }}>
                      <Icon size={14} style={{ color: '#C4B5FD' }} />
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: t.muted }}>{p.texto}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Panel derecho — formulario */}
          <div className="p-8 sm:p-10 flex flex-col justify-center" style={{ background: 'rgba(10,9,24,0.55)' }}>
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: GRADIENT }}>
                <Sparkles size={16} color="#fff" />
              </div>
              <span className="font-display text-lg font-extrabold">Viralizame</span>
            </div>

            <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: t.input, border: `1px solid ${t.inputBorder}` }}>
              <button
                type="button"
                onClick={() => setModo('login')}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: modo === 'login' ? GRADIENT : 'transparent', color: modo === 'login' ? '#fff' : t.muted }}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => setModo('registro')}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: modo === 'registro' ? GRADIENT : 'transparent', color: modo === 'registro' ? '#fff' : t.muted }}
              >
                Crear cuenta
              </button>
            </div>

            {GOOGLE_CLIENT_ID && (
              <>
                <div className="flex justify-center mb-4" ref={googleBtnRef} />
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 h-px" style={{ background: t.inputBorder }} />
                  <span className="text-[10px]" style={{ color: t.muted }}>o con tu email</span>
                  <div className="flex-1 h-px" style={{ background: t.inputBorder }} />
                </div>
              </>
            )}

            <form onSubmit={submit}>
              <AnimatePresence mode="wait">
                {modo === 'registro' && (
                  <motion.input
                    key="nombre"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre (opcional)"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }}
                  />
                )}
              </AnimatePresence>

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="Email"
                className="w-full mb-3 px-4 py-3 rounded-xl text-sm outline-none transition-shadow"
                style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }}
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                minLength={8}
                placeholder="Contraseña (mínimo 8 caracteres)"
                className="w-full mb-5 px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }}
              />

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ color: '#FCA5C7', background: 'rgba(236,72,153,0.1)' }}>
                  {error}
                </motion.p>
              )}

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={cargando}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-display font-bold text-sm"
                style={{ background: GRADIENT, color: '#fff', opacity: cargando ? 0.7 : 1, boxShadow: '0 8px 30px rgba(124,58,237,0.35)' }}
              >
                {cargando ? 'Procesando...' : modo === 'login' ? 'Entrar a mi cuenta' : 'Crear cuenta gratis'}
                {!cargando && <ArrowRight size={16} />}
              </motion.button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
