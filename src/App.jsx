import { useEffect, useState } from 'react';
import Login from './Login.jsx';
import Dashboard from './Dashboard.jsx';
import AdminPanel from './AdminPanel.jsx';
import { getToken, decodeToken, clearToken } from './api';

export default function App() {
  const [auth, setAuth] = useState(null); // null = no autenticado, { esAdmin } = autenticado
  const [vista, setVista] = useState('dashboard'); // 'dashboard' | 'admin'

  const cargarAuth = () => {
    const token = getToken();
    if (!token) {
      setAuth(null);
      return;
    }
    const payload = decodeToken(token);
    if (!payload || payload.exp * 1000 < Date.now()) {
      clearToken();
      setAuth(null);
      return;
    }
    setAuth({ esAdmin: payload.esAdmin });
  };

  useEffect(() => {
    cargarAuth();
  }, []);

  const cerrarSesion = () => {
    clearToken();
    setAuth(null);
  };

  if (!auth) return <Login onAuth={cargarAuth} />;

  if (vista === 'admin' && auth.esAdmin) {
    return <AdminPanel onVolver={() => setVista('dashboard')} onCerrarSesion={cerrarSesion} />;
  }

  return (
    <Dashboard
      esAdmin={auth.esAdmin}
      onIrAdmin={() => setVista('admin')}
      onCerrarSesion={cerrarSesion}
    />
  );
}
