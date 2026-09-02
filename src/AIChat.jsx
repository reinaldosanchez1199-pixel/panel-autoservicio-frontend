import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Cpu } from 'lucide-react';
import { chatIAStream } from './api';
import { theme, GRADIENT } from './theme';

const SALUDO = '¡Hola! Soy Viralizame IA 👋 Cuéntame sobre tu perfil o publicación y te ayudo a potenciarla.';

export default function AIChat() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([{ role: 'assistant', content: SALUDO }]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const t = theme.dark;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [mensajes]);

  const enviar = async (e) => {
    e.preventDefault();
    const texto = input.trim();
    if (!texto || enviando) return;
    setError('');
    setInput('');

    const historial = mensajes.map(({ role, content }) => ({ role, content }));
    setMensajes((m) => [...m, { role: 'user', content: texto }, { role: 'assistant', content: '' }]);
    setEnviando(true);

    try {
      await chatIAStream(texto, historial, (delta) => {
        setMensajes((m) => {
          const copia = [...m];
          copia[copia.length - 1] = { role: 'assistant', content: copia[copia.length - 1].content + delta };
          return copia;
        });
      });
    } catch (err) {
      setError(err.message);
      setMensajes((m) => m.slice(0, -1)); // quita la burbuja vacía del asistente
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 50 }}>
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-3 w-[92vw] max-w-[360px] rounded-3xl overflow-hidden flex flex-col"
            style={{ height: 480, background: t.surfaceSolid, border: `1px solid ${t.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
          >
            <div className="flex items-center gap-2 px-4 py-3.5" style={{ background: GRADIENT }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <Cpu size={14} color="#fff" />
              </div>
              <div className="flex-1">
                <p className="font-display font-bold text-sm text-white">Viralizame IA</p>
                <p className="text-[10px] text-white opacity-80">Siempre disponible</p>
              </div>
              <button onClick={() => setAbierto(false)}><X size={16} color="#fff" /></button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {mensajes.map((m, i) => (
                <div key={i} className="flex" style={{ justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div
                    className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed"
                    style={
                      m.role === 'user'
                        ? { background: GRADIENT, color: '#fff' }
                        : { background: t.input, color: t.text, border: `1px solid ${t.inputBorder}` }
                    }
                  >
                    {m.content || <span style={{ color: t.muted }}>...</span>}
                  </div>
                </div>
              ))}
              {error && <p className="text-[11px] text-center" style={{ color: '#FCA5C7' }}>{error}</p>}
            </div>

            <form onSubmit={enviar} className="flex items-center gap-2 p-3" style={{ borderTop: `1px solid ${t.border}` }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-3 py-2.5 rounded-xl text-xs outline-none"
                style={{ background: t.input, border: `1px solid ${t.inputBorder}`, color: t.text }}
              />
              <button type="submit" disabled={enviando || !input.trim()} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: GRADIENT, opacity: enviando || !input.trim() ? 0.5 : 1 }}>
                <Send size={14} color="#fff" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setAbierto(!abierto)}
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: GRADIENT, boxShadow: '0 8px 30px rgba(124,58,237,0.45)' }}
      >
        {abierto ? <X size={20} color="#fff" /> : <Sparkles size={20} color="#fff" />}
      </motion.button>
    </div>
  );
}
