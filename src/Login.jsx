import { useState } from 'react';
import { Zap } from 'lucide-react';
import { api, setToken } from './api';

export default function Login({ onAuth }) {
  const [modo, setModo] = useState('login'); // 'login' | 'registro'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

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

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#140F2E', fontFamily: "'Inter', sans-serif", color: '#F1EDFC' }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap'); .font-display{font-family:'Sora',sans-serif;}`}</style>

      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ background: '#1C1640', border: '1px solid #2E2560' }}
      >
        <div className="flex items-center gap-2 mb-6">
          <Zap size={22} style={{ color: '#F5A623' }} />
          <span className="font-display text-xl font-extrabold italic">Viralizame</span>
        </div>

        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => setModo('login')}
            className="flex-1 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: modo === 'login' ? 'linear-gradient(135deg, #E8437A, #F5A623)' : '#150F33',
              color: modo === 'login' ? '#140F2E' : '#8B7FB8',
            }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => setModo('registro')}
            className="flex-1 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: modo === 'registro' ? 'linear-gradient(135deg, #E8437A, #F5A623)' : '#150F33',
              color: modo === 'registro' ? '#140F2E' : '#8B7FB8',
            }}
          >
            Registrarme
          </button>
        </div>

        {modo === 'registro' && (
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre (opcional)"
            className="w-full mb-3 px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#150F33', border: '1px solid #2A2352', color: '#F1EDFC' }}
          />
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          placeholder="Email"
          className="w-full mb-3 px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: '#150F33', border: '1px solid #2A2352', color: '#F1EDFC' }}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          minLength={8}
          placeholder="Contraseña (mínimo 8 caracteres)"
          className="w-full mb-4 px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: '#150F33', border: '1px solid #2A2352', color: '#F1EDFC' }}
        />

        {error && <p className="text-xs mb-3" style={{ color: '#E8437A' }}>{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full py-3 rounded-xl font-display font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, #E8437A, #F5A623)', color: '#140F2E', opacity: cargando ? 0.6 : 1 }}
        >
          {cargando ? 'Cargando...' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  );
}
