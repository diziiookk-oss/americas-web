import Link from 'next/link';
import { getConfig } from '@/lib/datos';

export const metadata = { title: 'Términos del Programa de Revendedores', robots: { index: true } };
import { VERSION_TERMINOS } from '@/lib/legal';

export default async function Terminos() {
  let c = { negocio: 'Américas Drugstore', direccion: 'Av. de las Américas 2410, Paraná, Entre Ríos', comisionPct: 30, whatsappWA: '' };
  try { c = await getConfig(); } catch {}
  const pct = Number(c.comisionPct) || 30;
  return (<article className="legal">
    <nav className="migas"><Link href="/">Inicio</Link>/<Link href="/vendedor">Revendedores</Link>/<span>Términos</span></nav>
    <h1>Términos y Condiciones del Programa de Revendedores</h1>
    <p className="muted">Versión del {VERSION_TERMINOS.split('-').reverse().join('/')}. Al crear tu cuenta de revendedor aceptás estos términos.</p>

    <h2>1. Quiénes somos</h2>
    <p>El programa lo ofrece <b>{c.negocio}</b>, con domicilio en {c.direccion} (en adelante, «el Negocio»). Vos, la persona que se anota, sos «el Revendedor».</p>

    <h2>2. Qué es el programa</h2>
    <p>El Revendedor recomienda la tienda online del Negocio a otras personas usando un <b>link personal</b>. Cuando alguien compra entrando por ese link, el Revendedor gana una comisión. El Revendedor <b>no compra mercadería, no tiene stock, no cobra a los clientes y no entrega productos</b>: de todo eso se encarga el Negocio.</p>

    <h2>3. Alta y aprobación</h2>
    <ul>
      <li>Para participar hay que ser mayor de 18 años y crear una cuenta con datos reales (nombre y WhatsApp propio).</li>
      <li>El Negocio puede aprobar o rechazar solicitudes a su criterio, sin necesidad de explicar el motivo.</li>
      <li>La cuenta es personal: no se presta, no se vende y la contraseña es responsabilidad del Revendedor.</li>
    </ul>

    <h2>4. Cómo se calcula la comisión</h2>
    <ul>
      <li>La comisión es el <b>{pct}% de la ganancia</b> de cada pedido: el precio que pagó el cliente, menos el costo de los productos, menos los descuentos que se le hicieron (por ejemplo, por medio de pago, ruleta o Club). El costo de envío no se incluye.</li>
      <li>Se cuenta un pedido cuando el cliente entró por el link del Revendedor dentro de los <b>30 días</b> anteriores a la compra.</li>
      <li>Solo generan comisión los pedidos <b>entregados y cobrados</b>. Los pedidos cancelados, devueltos o no cobrados no generan comisión; si ya se hubiera pagado, se descuenta de pagos futuros.</li>
      <li>No generan comisión las compras del propio Revendedor ni las que se hagan para generar comisiones de forma artificial.</li>
      <li>El Negocio puede cambiar el porcentaje con aviso previo en el panel del Revendedor. El cambio no afecta pedidos ya hechos.</li>
    </ul>

    <h2>5. Pagos</h2>
    <ul>
      <li>Las comisiones se pagan <b>una vez por semana</b> por transferencia al alias o CBU que el Revendedor cargue en su panel. Si el alias no está cargado o es incorrecto, el pago queda pendiente hasta que se corrija.</li>
      <li>En el panel el Revendedor ve en todo momento sus ventas, lo que tiene para cobrar, lo que está en curso y lo que ya cobró.</li>
    </ul>

    <h2>6. Qué está permitido y qué no</h2>
    <p><b>Permitido:</b> compartir tu link por WhatsApp, estados, redes sociales, grupos donde esté permitido y de boca en boca; usar las fotos y precios que muestra la tienda.</p>
    <p><b>No permitido</b> (puede llevar a la baja de la cuenta y a la pérdida de comisiones pendientes):</p>
    <ul>
      <li>Hacerse pasar por el Negocio o por su dueño, o decir que es empleado.</li>
      <li>Prometer precios, descuentos, regalos o plazos de entrega que la tienda no ofrece.</li>
      <li>Hacer afirmaciones falsas sobre los productos (por ejemplo, sobre salud o efectos que no tienen).</li>
      <li>Mandar mensajes masivos no deseados (spam) o usar listas de contactos compradas.</li>
      <li>Promocionar a menores de edad productos con alcohol o tabaco.</li>
      <li>Hacer publicidad paga usando el nombre o el logo del Negocio sin autorización escrita.</li>
    </ul>

    <h2>7. Relación entre las partes</h2>
    <p>El Revendedor actúa de forma <b>independiente</b>. Este programa <b>no crea relación laboral, sociedad, mandato ni representación</b> entre el Revendedor y el Negocio. El Revendedor decide cuándo y cómo comparte su link, no tiene horarios ni metas obligatorias.</p>

    <h2>8. Impuestos</h2>
    <p>Cada Revendedor es responsable de cumplir con sus propias obligaciones fiscales por las comisiones que cobra (por ejemplo, inscribirse como monotributista si corresponde). El Negocio puede pedir una factura o comprobante para realizar los pagos.</p>

    <h2>9. Datos personales y confidencialidad</h2>
    <ul>
      <li>El Revendedor <b>no recibe datos de los clientes</b> más allá del nombre de pila y el estado de cada pedido. No puede pedirle al Negocio datos de contacto de los clientes.</li>
      <li>Los datos del Revendedor se tratan según nuestra <Link href="/privacidad">Política de Privacidad</Link>.</li>
      <li>La información del programa que no sea pública (costos, márgenes, acuerdos) es confidencial.</li>
    </ul>

    <h2>10. Baja</h2>
    <p>El Revendedor puede darse de baja cuando quiera, avisando por WhatsApp. El Negocio puede pausar o dar de baja una cuenta si se incumplen estos términos, o terminar el programa avisando con 15 días de anticipación. En cualquier caso, se pagan las comisiones ya generadas por pedidos entregados, salvo en caso de fraude.</p>

    <h2>11. Cambios en estos términos</h2>
    <p>El Negocio puede modificar estos términos. Los cambios se publican en esta página con la nueva fecha y se avisan en el panel. Seguir participando después del aviso implica aceptarlos.</p>

    <h2>12. Ley aplicable</h2>
    <p>Estos términos se rigen por las leyes de la República Argentina. Ante cualquier diferencia, las partes intentarán resolverla de buena fe; si no es posible, serán competentes los tribunales ordinarios de la ciudad de Paraná, Entre Ríos.</p>

    <p className="muted" style={{ marginTop: 24 }}>¿Dudas? Escribinos {c.whatsappWA ? <a href={'https://wa.me/' + c.whatsappWA} target="_blank" rel="noopener" style={{ textDecoration: 'underline' }}>por WhatsApp</a> : 'por WhatsApp'}.</p>
  </article>);
}
