// Contraseñas (scrypt con sal: nunca se guardan en texto) y sesiones firmadas en cookie.
import crypto from 'crypto';
export function hashClave(clave, sal) { sal = sal || crypto.randomBytes(16).toString('hex'); return sal + ':' + crypto.scryptSync(String(clave), sal, 32).toString('hex'); }
export function claveVale(clave, guardado) {
  const [sal, h] = String(guardado || '').split(':'); if (!sal || !h) return false;
  const a = Buffer.from(crypto.scryptSync(String(clave), sal, 32).toString('hex')), b = Buffer.from(h);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function firma(tipo, v) { return crypto.createHmac('sha256', String(process.env.ADMIN_PASSWORD || '') + '|' + tipo).update(v).digest('hex'); }
export function token(tipo, v) { return v + '.' + firma(tipo, v); }
export function leerToken(tipo, t) {
  t = String(t || ''); const i = t.lastIndexOf('.'); if (i < 1) return '';
  const v = t.slice(0, i), ok = token(tipo, v);
  return t.length === ok.length && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(ok)) ? v : '';
}
