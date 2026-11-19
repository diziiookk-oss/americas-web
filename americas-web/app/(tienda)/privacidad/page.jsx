import Link from 'next/link';
import { getConfig } from '@/lib/datos';

export const metadata = { title: 'Política de Privacidad' };

export default async function Privacidad() {
  let c = { negocio: 'Américas Drugstore', direccion: 'Av. de las Américas 2410, Paraná, Entre Ríos', whatsappWA: '' };
  try { c = await getConfig(); } catch {}
  return (<article className="legal">
    <nav className="migas"><Link href="/">Inicio</Link>/<span>Privacidad</span></nav>
    <h1>Política de Privacidad</h1>
    <p className="muted">Última actualización: 19/11/2026.</p>
    <p>En <b>{c.negocio}</b> ({c.direccion}) cuidamos tus datos. Acá te contamos, en simple, qué datos guardamos, para qué y qué derechos tenés, según la Ley 25.326 de Protección de Datos Personales de Argentina.</p>

    <h2>1. Qué datos guardamos</h2>
    <ul>
      <li><b>Cuando hacés un pedido:</b> tu nombre, tu WhatsApp, la dirección de entrega (si pedís envío), lo que compraste, el medio de pago elegido y las notas que agregues.</li>
      <li><b>Si te sumás al Club Américas</b> (opcional): tu nombre, tu WhatsApp, tu cumpleaños (si lo cargás) y si aceptás recibir ofertas.</li>
      <li><b>Si sos revendedor:</b> tu nombre, tu WhatsApp, tu contraseña (guardada cifrada: nadie puede leerla, ni siquiera nosotros), tu alias o CBU para pagarte y tus ventas.</li>
      <li><b>Navegación:</b> estadísticas anónimas de uso de la tienda (qué páginas se visitan, qué se busca). No usamos tu nombre para esto.</li>
    </ul>
    <p>No pedimos ni guardamos datos de tarjetas: los pagos se hacen en el local, por transferencia o con Mercado Pago.</p>

    <h2>2. Para qué los usamos</h2>
    <ul>
      <li>Preparar, entregar y cobrar tus pedidos, y avisarte por WhatsApp cómo vienen.</li>
      <li>Llevar la cuenta de tus compras para los beneficios del Club.</li>
      <li>Calcular y pagar las comisiones de los revendedores.</li>
      <li>Mandarte ofertas, <b>solo si lo aceptaste</b>. Podés pedir que no te escribamos más en cualquier momento.</li>
      <li>Mejorar la tienda con estadísticas anónimas.</li>
    </ul>

    <h2>3. Con quién los compartimos</h2>
    <p><b>No vendemos ni alquilamos tus datos.</b> Solo los usan el Negocio y los servicios técnicos necesarios para que la tienda funcione (alojamiento de la página y base de datos). Los revendedores <b>no ven tus datos de contacto</b>: solo tu nombre de pila y el estado del pedido que se hizo por su link. Podemos compartir datos si una ley o una autoridad competente lo exige.</p>

    <h2>4. Cuánto tiempo los guardamos</h2>
    <p>Mientras seas cliente, miembro del Club o revendedor, y después el tiempo que exijan las normas contables e impositivas. Si pedís que los borremos, los eliminamos salvo lo que la ley nos obligue a conservar.</p>

    <h2>5. Tus derechos</h2>
    <p>Podés <b>pedir ver, corregir, actualizar o borrar</b> tus datos cuando quieras, en forma gratuita, escribiéndonos por WhatsApp{c.whatsappWA ? <> (<a href={'https://wa.me/' + c.whatsappWA} target="_blank" rel="noopener" style={{ textDecoration: 'underline' }}>tocá acá</a>)</> : ''} o acercándote al local. Te respondemos dentro de los plazos de la ley (10 días hábiles para el acceso y 5 para corrección o supresión).</p>
    <p className="muted">La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.</p>

    <h2>6. Seguridad</h2>
    <p>Usamos conexión segura (https), las contraseñas se guardan cifradas y el acceso al panel del Negocio está protegido. Igual, ningún sistema es 100% infalible: si detectamos un problema que afecte tus datos, te vamos a avisar.</p>

    <h2>7. Cambios</h2>
    <p>Si cambiamos esta política, publicamos la nueva versión en esta página con su fecha.</p>
    <p className="muted" style={{ marginTop: 24 }}>Ver también: <Link href="/revendedores/terminos" style={{ textDecoration: 'underline' }}>Términos del Programa de Revendedores</Link>.</p>
  </article>);
}
