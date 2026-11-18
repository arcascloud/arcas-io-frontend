import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
} from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { EmpresaBrandService } from '../../core/services/empresa-brand.service';

@Component({
  selector: 'app-terminos-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule],
  templateUrl: './terminos-dialog.html',
  styleUrl: './terminos-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminosDialog {
  private empresaBrand = inject(EmpresaBrandService);

  visible = model(false);

  cerrar() {
    this.visible.set(false);
  }

  get secciones() {

    const emp = this.empresaBrand.nombre() || 'empresa';
    const email = `sac@${emp.toLowerCase()}.com`;

    return [
      {
        titulo: '1.- ACEPTACIÓN DE TÉRMINOS Y CONDICIONES',
        contenido: `Los presentes Términos y Condiciones regulan el uso que haga la persona natural o jurídica que visite el sitio web de ${emp} (en adelante “el SITIO WEB”), y adquiere los productos que se ofrecen en el mismo.\n\nAl accesar al SITIO WEB y adquirir los productos ofrecidos en el mismo (“los Productos”) usted entiende y acepta la aplicación de los presentes Términos y Condiciones, así como las modificaciones a los mismos que puedan darse en el futuro. En caso de no estar de acuerdo con estos términos y condiciones, no deberá adquirir los Productos puesto que el realizar compras en línea en el SITIO WEB se entenderá como una aceptación plena de los mismos.\n\n${emp} se reserva el derecho de modificar los presentes Términos y Condiciones cuando lo estime conveniente, en cuyo caso se le notificará de ello mediante avisos en el SITIO WEB o por otros medios que ${emp} tenga disponible. El acceso y uso que usted haga del SITIO WEB posterior a cualquier notificación de modificación de los presentes Términos y Condiciones será considerada como una aceptación de las mismas.`
      },
      {
        titulo: '2.- USO DEL SITIO WEB Y COMPRAS EN LÍNEA',
        contenido: `Al hacer uso y realizar compras por medio del SITIO WEB, Usted declara y garantiza a ${emp}, que: i) la información provista para realizar el pago es correcta, veraz y válida: y ii) los fondos procedentes de los pagos a ser llevados a cabo por medio del SITIO WEB son de origen lícito y Usted tiene conocimiento de la procedencia lícita y legal de éstos.\n\nAl procesar la transacción de pago, se llevará a cabo el proceso de validación de la misma, por lo que en el caso de que hubiera algún motivo de rechazo de dicha transacción, se estará notificando de ello para que pueda realizar otro intento o bien cambiar la forma de pago. Si el pago fue exitoso, se enviará un correo de confirmación con los detalles de la compra realizada.\n\nSe aceptarán tarjetas de débito y crédito Visa y Mastercard, pudiendo asimismo, realizar pagos por medio de transferencia bancaria proporcionada por ${emp} en el SITIO WEB, por medio de la billetera electrónica de TENGO para los clientes que no cuentan con una tarjeta de débito o crédito. Usted reconoce y acepta que el procesamiento de sus pagos podrá estar sujeto a términos y condiciones adicionales de los proveedores de servicios de pago o plataformas de pagos, de los cuales ${emp} no es parte ni tiene obligación alguna, aceptando Usted los mismos al hacer uso de dichos Servicios y liberando a ${emp} de cualquier responsabilidad derivada de los mismos.`
      },
      {
        titulo: '3.- DATOS PERSONALES',
        contenido: `Al realizar una compra en el SITIO WEB y registrar sus datos personales para realizar el pago correspondiente, Usted expresamente autoriza a ${emp} para tener acceso a su información y para procesar y compartir la misma con terceros necesarios para prestar los servicios de compras en línea, incluyendo pero no limitado a proveedores de procesamiento de pagos o plataformas de pago, bajo medidas de seguridad que procuren su confidencialidad y su manejo sensitivo. ${emp} se compromete a contar con mecanismos técnicos y administrativos necesarios para procurar salvaguardar el almacenamiento, tratamiento, transferencia, cancelación y destrucción de los datos personales que, por virtud de estos Términos y Condiciones, se reciban.\n\n${emp} ha implementado medidas técnicas y organizacionales diseñadas para asegurar su información de datos personales y procurar prevenir cualquier acceso no autorizado, pérdida accidental, uso, alteración o divulgación de la misma. Sin perjuicio de esto, Usted entiende y acepta que ${emp} no puede garantizar que terceros no autorizados nunca vayan a quebrantar dichas medidas y/o utilcen su información para propósitos indebidos y que a su vez el internet no es un ambiente 100% seguro, por lo que Usted provee en este sentido su información bajo su propio riesgo. Almacenamos su información en servidores propios como en servidores de terceros que son proveedores de servicios nuestros.\n\n${emp} utilizará su información para proveer, mejorar y desarrollar nuestros servicios y su información podría ser compartida con: i) nuestras empresas afiliadas; ii) con procesadores de pagos, bancos y marcas de tarjetas de crédito que requieran de la información para el procesamiento de los pagos; iii) con terceros que coadyuvan a proveer, mantener o mejorar nuestros productos y servicios, incluyendo proveedores y otras entidades conectadas a la prestación de los servicios en el SITIO WEB; iv) con otros que puedan llevar a cabo campañas publicitarias, concursos u ofertas a nombre nuestro o en conexión con los servicios y productos de ${emp}; y v) a cesionarios.\n\nSu información se mantendrá confidencial de acuerdo con el proceso común y mejores prácticas para el manejo de información de dicha naturaleza. No obstante, ${emp}, podrá compartir y transferir la misma: i) cuando así le sea requerido por autoridad judicial, administrativa, supervisora o de cualquier manera exigida con base en estatutos, reglas, regulaciones, leyes, reglamentos o un proceso judicial; ii) a los fiscalizadores y supervisores de ${emp}, a solicitud y requerimiento de cualquier otro órgano fiscalizador o regulador, supervisor o autoridad competente; (iii) cuando la información haya sido hecha pública por medios diferentes a cualquier prohibición hecha a ${emp}; (iv) en conexión con cualquier investigación, litigio o procedimiento legal en el que ${emp} o sus afiliadas sean parte, o en relación con cualquier remedio o recurso relacionado; y (v) representantes, agentes o asesores de ${emp} en la medida que sea necesario para la operatividad de ${emp} y/o proteger/defender los intereses de la misma.\n\nUsted entiende y acepta que es posible que ${emp} utilice tecnología para recolectar información cuando Usted accese o haga uso del SITIO WEB, referida comúnmente como “cookie” o tecnología similar en su dispositvo.`
      },
      {
        titulo: '4.- COMUNICACIONES ELECTRÓNICAS',
        contenido: `Usted acepta que podrá recibir de tiempo en tiempo comunicaciones de ${emp} electrónicamente en una variedad de formas, incluyendo pero no limitanándose a los siguientes tipos de mensajes de datos: correo electrónico, mensajes de texto, notificaciones automáticas de app o mediante avisos y mensajes colocados en el SITIO WEB. Usted acepta que todos los contratos, avisos, mensajes, y otras notificaciones y comunicaciones que se envíen por medios electrónicos satisfacen cualquier requisito legal de forma escrita y cuentan con plenos efectos legales y validez.`
      },
      {
        titulo: '5.- PROPIEDAD INTELECTUAL',
        contenido: `El SITIO WEB y todo el contenido del mismo es propiedad de ${emp}, por lo que Usted se obliga a lo siguiente: i) no copiar, no descompilar, no alterar y no analizar cualquier componente del SITIO WEB; y ii) no realizar ingeniería inversa, compilación o desensamble de la información o de cualquier parte del SITIO WEB. Únicamente el personal autorizado por ${emp} tendrá acceso a realizar cualquier modificación, desarrollo, cambio o adecuación externa e interna de cualquier componente del SITIO WEB.`
      },
      {
        titulo: '6.- MÉTODOS DE ENTREGA Y RIESGO DE PÉRDIDA',
        contenido: `Al adquirir productos en el SITIO WEB Usted podrá elegir el método de entrega de los mismos, el cual puede ser: i) Recoger en Tienda; o ii) Envío para entrega a domicilio (“Delivery”). Al optar por la opción de Recoger en Tienda, Usted podrá recoger su pedido en una de las tiendas estipuladas por el SITIO WEB, debiendo indicar al momento de la compra la tienda de escogencia. La opción de Delivery está disponible para entregas a domicilio dentro de Tegucigalpa y San Pedro Sula (donde se cuenta con tiendas físicas) al igual que al resto del país, pudiendo aplicar costos adicionales por el envío.\n\nAl escoger la opción de Delivery, Usted acepta y reconoce que los productos son enviados a través de un contrato de embarque con terceros proveedores de servicio de transporte, por lo que acepta que la propiedad y el riesgo de pérdida de los productos le será transferida a Usted en el momento en que entreguemos los productos al proveedor de servicio de transporte.\n\n${emp}, se reserva el derecho, a nuestra discreción, de reembolsar el importe del producto sin exigir su devolución. En tal caso, la propiedad del producto cuyo precio hubiera sido reembolsado no pasará a ${emp}.`
      },
      {
        titulo: '7.- DESCRIPCIONES DE PRODUCTO Y PRECIOS',
        contenido: `Toda la información acerca de los productos contenida en el SITIO WEB se proporciona únicamente con fines informativos y en algunos casos será la descripción provista de los productos para ellos por los fabricantes de dichos productos, por lo que ${emp} se limita a compartir dicha información con Usted y en dichos casos no asegura la exactitud de dicha descripción. Antes de usar los productos siempre lea las etiquetas, advertencias e instrucciones de uso de los productos.\n\nExcepto que se indiquen de manera separada, todos los precios mostrados a través de SITIO WEB incluyen impuestos. La factura original de la compra del producto le será enviada junto con el producto adquirido.`
      },
      {
        titulo: '8.- DISPONIBILIDAD',
        contenido: `Toda la información y detalles respecto de la disponibilidad, envío o entrega de un producto se brinda únicamente como estimaciones. Cuando Usted realice su pedido, se le enviará un mensaje confirmando la recepción de su orden. En caso de que por cualquier razón, durante el procesamiento de su orden, el producto ordenado por Usted ya no se encontrara disponible, no se realizara cargo alguno respecto de aquellos productos. Si el producto que ordenó no está disponible, le permitiremos pedir un producto alterno sujeto a la confirmación de inventario. Si Usted no desea escoger un product alterno, se eliminará el producto no disponible de la orden y se le facturará y enviará los demas productos disponibles.`
      },
      {
        titulo: '9.- GARANTÍA DE LOS PRODUCTOS',
        contenido: `Varios productos disponibles para compra se encuentran cubiertos por una garantía. Si desea más información respecto a las garantías ofrecidas por favor visite nuestra Política de Garantía haciendo clic aquí.`
      },
      {
        titulo: '10.- POLÍTICA DE REEMBOLSO Y DEVOLUCIONES',
        contenido: `Usted tiene derecho a solicitar el reembolso y devolución de su compra durante el plazo de cinco (5) días hábiles contados a partir de la fecha que se reciba el producto de acuerdo a la Política de Reembolso y Devoluciones la cual puede accesar aquí “Política de Reembolso y Devoluciones”.`
      },
      {
        titulo: '11.- INDEMNIZACIÓN Y LIMITACIÓN DE RESPONSABILIDAD',
        contenido: `Usted acepta y reconoce que ${emp}, no garantiza que el SITIO WEB funcionará el 100% del tiempo sin errores y en la forma que satisfaga sus necesidades, ni que no habrá interrupciones en el mismo. ${emp} no garantiza que el SITIO WEB, su información, su contenido, materiales, productos (incluyendo software) y demás servicios, incluidos en o de otra forma disponibles para usted a través del SITIO WEB, servidores de la ${emp} o comunicaciones electrónicas enviadas por ${emp} se encuentren libres de viruses u otros componentes dañinos. ${emp} no será responsable de cualesquiera daños de ninguna naturaleza que resulten del uso del SITIO WEB, o de información alguna, contenido, materiales, productos (incluyendo software) o demás servicios incluidos en o de otra forma disponibles para usted a través del SITIO WEB, incluyendo sin limitación daños directos o indirectos a menos que se especifique de otra forma por escrito.\n\n${emp} ni, sus funcionarios, empleados, asesores externos y afiliadas o subsidiarias no será responsable de cualquier daño directo o indirecto que surgiera por el Uso del SITIO WEB, incluso cuando haya sido advertido Usted de la posibilidad de dichos daños. ${emp} no será responsable de cualquier daño o pérdida que se derive de su incapacidad para acceder o utilizar el SITIO WEB.\n\n${emp} asimismo, no será responsable de cualquier retraso o incumplimiento de sus obligaciones, que resulten de causas de fuerza mayor o de caso fortuito probado, que de manera enunciativa y no limitativa se refieran a terremotos, incendios, inundaciones, huelgas, disturbios motines, guerra, terrorismos, actos gubernamentales, entre otros.\n\nUsted deberá indemnizar, defender y guardar a salvo a ${emp}, y a sus empresas afiliadas, de cualquier reclamo, acción civil, demanda, daños, multas, y costos (incluidos honorarios de abogados razonables y costos legales) iniciados por un Tercero en conexión con cualquier incumplimiento de su parte de los presentes Términos y Condiciones.`
      },
      {
        titulo: '12.- PROCEDIMIENTO PARA REALIZAR RECLAMOS',
        contenido: `En caso que Usted cuente con algún reclamo deberá realizar su reclamo en persona si se encuentra en el casco urbano del Distrito Central o San Pedro Sula, de lo contrario deberá enviar un correo a: sac@${emp.toLowerCase()}.com dentro de los primeros 5 días de recibido el producto, si el reclamo es acerca del estado del producto recibido o si hay algún faltante entre lo pedido y lo recibido físicamente. No se aceptarán reclamos relacionados al mal estado del producto o faltante, si los mismos se realizan posterior al plazo indicado previamente\n\nSi Usted cuenta con algún reclamo sobre discrepancias entre lo pedido y lo recibido físicamente (por ejemplo el envío del producto equivocado), o debido a que ya no necesita o no quiere el producto, puede realizar el reclamo dentro de los primeros 3 días hábiles a la fecha de emisión de la factura original para reembolsar el precio total del producto y el impuesto sobre la venta, o dentro de los días 31-60 días calendario, sin perjuicio que en este caso, se reembolsará el precio total del producto pero no el impuesto sobre la venta del mismo. Usted acepta que adicionalmente, aplicarán las condiciones de la Política de Devoluciones.`
      },
      {
        titulo: '13.- LEGISLACIÓN APLICABLE Y SOLUCIÓN DE CONTROVERSIAS',
        contenido: `Usted acuerda que todo lo previsto y no previsto en estos Términos y Condiciones se regirá por las leyes de Honduras y que cualquier controversia, discrepancia, disputa o reclamo que se produzca o esté relacionado con la ejecución, interpretación, incumplimiento y/o aplicación de las mismas, será sujeta a la jurisdicción de los tribunales competentes de la República de Honduras.`
      },
      {
        titulo: '14.- DISPOSICIONES VARIAS',
        contenido: `Usted se compromete a cumplir con todas las leyes que sean aplicables al SITIO WEB y acepta que los derechos derivados del mismo no podrán ser cedidos.`
      }
    ];
  }
}
