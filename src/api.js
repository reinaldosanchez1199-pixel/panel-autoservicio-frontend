// ============================================
// api.js — cliente HTTP hacia el backend (Railway)
// ============================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'viralizame_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Decodifica el payload del JWT en el navegador (sin librería) — solo para
// leer datos no sensibles como esAdmin; la validación real la hace el backend.
export function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const resp = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await resp.json();
  } catch {
    // respuesta sin body (ej. 204)
  }

  if (!resp.ok) {
    throw new Error(data?.error || `Error ${resp.status}`);
  }
  return data;
}

export const api = {
  // Auth (rutas públicas, sin /api)
  registro: (email, password, nombre) => request('/auth/registro', { method: 'POST', body: { email, password, nombre } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),

  // Cliente
  wallet: () => request('/api/wallet'),
  services: () => request('/api/services'),
  bundles: () => request('/api/bundles'),
  paquetesRecarga: () => request('/api/paquetes-recarga'),
  niveles: () => request('/api/niveles'),
  perfiles: () => request('/api/perfiles'),
  crearPerfil: (plataforma, nombreUsuario, url) => request('/api/perfiles', { method: 'POST', body: { plataforma, nombreUsuario, url } }),
  borrarPerfil: (id) => request(`/api/perfiles/${id}`, { method: 'DELETE' }),
  activity: () => request('/api/activity'),
  crearOrden: (linkCliente, items) => request('/api/orders', { method: 'POST', body: { linkCliente, items } }),
  crearOrdenBundle: (linkCliente, bundleId) => request('/api/orders/bundle', { method: 'POST', body: { linkCliente, bundleId } }),
  orden: (id) => request(`/api/orders/${id}`),
  recargaManual: (paqueteId, comprobanteFile) => {
    const form = new FormData();
    form.append('paqueteId', paqueteId);
    form.append('comprobante', comprobanteFile);
    return request('/api/recargas/manual', { method: 'POST', body: form, isForm: true });
  },

  // Admin
  adminRecargasPendientes: () => request('/api/admin/recargas'),
  adminAprobarRecarga: (id) => request(`/api/admin/recargas/${id}/aprobar`, { method: 'POST' }),
  adminRechazarRecarga: (id) => request(`/api/admin/recargas/${id}/rechazar`, { method: 'POST' }),
  adminServiciosPendientes: () => request('/api/admin/services/pendientes'),
  adminActualizarServicio: (id, payload) => request(`/api/admin/services/${id}`, { method: 'PATCH', body: payload }),
  adminCrearBundle: (payload) => request('/api/admin/bundles', { method: 'POST', body: payload }),
};
