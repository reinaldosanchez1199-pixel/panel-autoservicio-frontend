import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Cpu, ShieldCheck, RefreshCw, Zap, MessageCircleQuestion, ChevronDown,
  Instagram, Youtube, Facebook, Twitter, ArrowRight, Star, Wallet, LayoutDashboard,
} from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import AIChat from './AIChat';
import { theme, GRADIENT, GRADIENT_SOFT, FONT_IMPORT } from './theme';

const ESTADISTICAS = [
  { valor: '2.8M+', label: 'Impulsos entregados' },
  { valor: '50K+', label: 'Creadores activos' },
  { valor: '4.9/5', label: 'Calificación promedio' },
  { valor: '24/7', label: 'Motor de IA activo' },
];

const PASOS = [
  { icon: LayoutDashboard, titulo: 'Elige tu campaña', texto: 'Selecciona la red social, el servicio y la cantidad. Todo desde tu panel, sin escribirle a nadie.' },
  { icon: Wallet, titulo: 'Paga con Viral Credits', texto: 'Recarga con Zelle, PayPal, Binance y más. Tu saldo se acredita en minutos.' },
  { icon: Cpu, titulo: 'La IA distribuye la entrega', texto: 'Nuestro motor calcula el ritmo ideal para que el crecimiento se vea natural y tu cuenta quede protegida.' },
  { icon: RefreshCw, titulo: 'Reposición cuando la necesites', texto: 'Si tus números bajan, solicita la reposición con un clic desde tu panel — sin escribirle a nadie.' },
];

const FEATURES = [
  { icon: ShieldCheck, titulo: 'Nunca pedimos tu contraseña', texto: 'Solo necesitamos tu usuario público. Tu cuenta sigue 100% bajo tu control.' },
  { icon: Zap, titulo: 'Entrega inmediata', texto: 'Tu campaña empieza a procesarse al instante. El tiempo total de entrega depende del servicio y la cantidad — lo verás detallado en cada pedido.' },
  { icon: RefreshCw, titulo: 'Reposición con un clic', texto: 'Si tus números bajan, pide la reposición tú mismo desde tu panel. Sin trámites, sin esperar respuesta.' },
  { icon: Cpu, titulo: 'Autoservicio total', texto: 'Pedidos, saldo, historial y recargas — todo se gestiona solo, sin depender de un agente humano.' },
];

const TESTIMONIOS = [
  { nombre: 'Leonardo Carrillo', rol: 'Barbero · Miami, FL', texto: 'Se ve mucho más profesional. La gente lo nota de inmediato.' },
  { nombre: 'Luisana Páez', rol: 'Blogger · New York, NY', texto: 'El proceso fue rapidísimo y el resultado superó lo que esperaba.' },
  { nombre: 'Martín Mendoza', rol: 'Abogado · Houston, TX', texto: 'La diferencia visual es notable. Mi cuenta transmite otra cosa ahora.' },
  { nombre: 'Alejo Jaramillo', rol: 'Fotógrafo · Los Angeles, CA', texto: 'Nunca pensé que un cambio así haría tanta diferencia. Lo recomiendo sin dudar.' },
];

const FAQS = [
  {
    q: '¿Es seguro para mi cuenta?',
    a: 'Sí. Nunca solicitamos tu contraseña, solo tu usuario público. Nuestro motor de entrega distribuye cada campaña de forma gradual y natural para proteger tu cuenta en todo momento.',
  },
  {
    q: '¿Cuánto tarda en llegar mi pedido?',
    a: 'Tu campaña empieza a procesarse de inmediato tras confirmarse el pago. El tiempo total varía según el servicio y la cantidad elegida — cada pedido muestra su propio tiempo estimado de entrega.',
  },
  {
    q: '¿Qué pasa si mis números bajan después?',
    a: 'Puedes solicitar la reposición tú mismo desde tu panel con un clic — la solicitud va directo a nuestro proveedor, sin escribirle a nadie ni esperar respuesta.',
  },
  {
    q: '¿Cómo recargo mi saldo de Viral Credits?',
    a: 'Desde tu panel, eliges un paquete y subes tu comprobante de pago (Zelle, PayPal, Binance y más). Tu saldo se acredita apenas se confirma, normalmente en minutos.',
  },
  {
    q: '¿Necesito escribirle a alguien para procesar mi pedido?',
    a: 'No. Todo el proceso —elegir el servicio, pagar, ver el estado del pedido— lo haces tú mismo desde el panel, 100% self-service, disponible 24/7.',
  },
  {
    q: '¿Qué plataformas soportan?',
    a: 'Instagram, TikTok, YouTube, Facebook y Twitter (X) de forma directa. Otras plataformas (Spotify, Twitch, LinkedIn, Telegram) están disponibles bajo pedido.',
  },
];

function FaqItem({ item, abierto, onClick }) {
  const t = theme.dark;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}>
      <button onClick={onClick} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="text-sm font-semibold">{item.q}</span>
        <motion.div animate={{ rotate: abierto ? 180 : 0 }}>
          <ChevronDown size={16} style={{ color: t.muted }} />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: abierto ? 'auto' : 0, opacity: abierto ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        style={{ overflow: 'hidden' }}
      >
        <p className="px-5 pb-4 text-xs leading-relaxed" style={{ color: t.muted }}>{item.a}</p>
      </motion.div>
    </div>
  );
}

export default function Landing({ onEntrar }) {
  const [faqAbierto, setFaqAbierto] = useState(0);
  const t = theme.dark;

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: t.text, position: 'relative' }}>
      <style>{`${FONT_IMPORT} .font-display{font-family:'Sora',sans-serif;} .grad-text{background:${GRADIENT};-webkit-background-clip:text;-webkit-text-fill-color:transparent;}`}</style>
      <AnimatedBackground modoOscuro />

      <div className="relative" style={{ zIndex: 1 }}>
        {/* Nav */}
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: GRADIENT }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <span className="font-display text-lg font-extrabold">Viralizame</span>
          </div>
          <motion.button whileHover={{ scale: 1.04 }} onClick={onEntrar} className="text-xs font-bold px-4 py-2 rounded-full" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
            Iniciar sesión
          </motion.button>
        </nav>

        {/* Hero */}
        <section className="max-w-4xl mx-auto text-center px-6 pt-10 pb-16">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-6" style={{ background: GRADIENT_SOFT, border: `1px solid ${t.border}` }}>
            <Cpu size={12} style={{ color: '#C4B5FD' }} />
            <span className="text-xs font-semibold" style={{ color: '#E9D5FF' }}>Viralizame IA · Growth Engine</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
            Impulsa tu presencia con <span className="grad-text">inteligencia artificial</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-base sm:text-lg mb-8" style={{ color: t.muted }}>
            Convierte Viral Credits en alcance real para Instagram, TikTok, YouTube, Facebook y Twitter (X).
            Nuestro motor de IA calcula el ritmo de entrega ideal — sin contraseñas, sin depender de nadie más que de ti.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={onEntrar} className="flex items-center gap-2 px-6 py-3.5 rounded-full font-display font-bold text-sm" style={{ background: GRADIENT, color: '#fff', boxShadow: '0 8px 30px rgba(124,58,237,0.35)' }}>
              Crear cuenta gratis <ArrowRight size={16} />
            </motion.button>
            <button onClick={onEntrar} className="px-6 py-3.5 rounded-full font-semibold text-sm" style={{ color: t.muted, border: `1px solid ${t.border}` }}>
              Ya tengo cuenta
            </button>
          </motion.div>

          <div className="flex items-center justify-center gap-4 mt-8" style={{ color: t.muted }}>
            {[Instagram, Youtube, Facebook, Twitter].map((Icon, i) => (
              <Icon key={i} size={18} />
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 mb-20">
          {ESTADISTICAS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="rounded-2xl p-4 text-center" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}>
              <p className="font-display font-extrabold text-2xl grad-text">{s.valor}</p>
              <p className="text-[11px] mt-1" style={{ color: t.muted }}>{s.label}</p>
            </motion.div>
          ))}
        </section>

        {/* Cómo funciona */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <p className="text-xs uppercase tracking-widest text-center mb-2" style={{ color: t.muted }}>Cómo funciona</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-10">De la campaña al resultado, sin fricción</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PASOS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="rounded-2xl p-5" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: GRADIENT }}>
                    <Icon size={16} color="#fff" />
                  </div>
                  <p className="text-xs font-bold mb-1" style={{ color: t.muted }}>Paso {i + 1}</p>
                  <p className="font-display font-bold text-sm mb-1.5">{p.titulo}</p>
                  <p className="text-xs leading-relaxed" style={{ color: t.muted }}>{p.texto}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -12 : 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex items-start gap-4 rounded-2xl p-5" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: GRADIENT_SOFT, border: `1px solid ${t.border}` }}>
                    <Icon size={18} style={{ color: '#C4B5FD' }} />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm mb-1">{f.titulo}</p>
                    <p className="text-xs leading-relaxed" style={{ color: t.muted }}>{f.texto}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Testimonios */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <p className="text-xs uppercase tracking-widest text-center mb-2" style={{ color: t.muted }}>Lo que dicen</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-10">Creadores y negocios reales</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTIMONIOS.map((tst, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="rounded-2xl p-4" style={{ background: t.surface, border: `1px solid ${t.border}`, backdropFilter: 'blur(20px)' }}>
                <div className="flex gap-0.5 mb-2">
                  {[...Array(5)].map((_, j) => <Star key={j} size={11} fill="#F5A623" style={{ color: '#F5A623' }} />)}
                </div>
                <p className="text-xs mb-3 leading-relaxed">"{tst.texto}"</p>
                <p className="text-xs font-semibold">{tst.nombre}</p>
                <p className="text-[10px]" style={{ color: t.muted }}>{tst.rol}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-2xl mx-auto px-6 mb-20">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <MessageCircleQuestion size={14} style={{ color: '#EC4899' }} />
            <p className="text-xs uppercase tracking-widest" style={{ color: t.muted }}>Preguntas frecuentes</p>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-10">Todo lo que necesitas saber</h2>
          <div className="space-y-3">
            {FAQS.map((item, i) => (
              <FaqItem key={i} item={item} abierto={faqAbierto === i} onClick={() => setFaqAbierto(faqAbierto === i ? -1 : i)} />
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="max-w-3xl mx-auto px-6 mb-16 text-center rounded-3xl py-12" style={{ background: GRADIENT_SOFT, border: `1px solid ${t.border}` }}>
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">Gestiona tus campañas tú mismo, hoy</h2>
          <p className="text-sm mb-6" style={{ color: t.muted }}>Sin escribirle a nadie. Sin esperar respuesta. Solo tú, tu panel, y una IA trabajando por ti.</p>
          <motion.button whileHover={{ scale: 1.03 }} onClick={onEntrar} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-display font-bold text-sm" style={{ background: GRADIENT, color: '#fff', boxShadow: '0 8px 30px rgba(124,58,237,0.35)' }}>
            Empezar ahora <ArrowRight size={16} />
          </motion.button>
        </section>

        {/* Footer */}
        <footer className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ color: t.muted, borderTop: `1px solid ${t.border}` }}>
          <p>© {new Date().getFullYear()} Viralizame · Worldklox Agency</p>
          <p>worldklox@gmail.com</p>
        </footer>
      </div>
      <AIChat />
    </div>
  );
}
