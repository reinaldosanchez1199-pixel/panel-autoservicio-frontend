// Devuelve el país del visitante según su IP (Vercel lo agrega en este header).
// Solo se usa para mostrar el equivalente en moneda local; no guarda nada.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json({ pais: req.headers['x-vercel-ip-country'] || null });
}
