// registropedidostripe.js

/* Configuración del host de la API */
(function () {
  if (typeof window.__API_HOST === 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    window.__API_HOST = isLocal ? 'http://localhost:3000' : `https://api.${window.location.hostname}`;
  }
})();
const apiHost = window.__API_HOST; // usar apiHost en todo el archivo

/* Utilitarios y selectores */
function getCarritoLocal() {
  try {
    const raw = localStorage.getItem("carrito");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Error parseando carrito en localStorage:", e);
    return [];
  }
}

const resumenDiv = document.getElementById("resumen-pedido");

/* Helpers envíos */
async function fetchEnvios() {
  try {
    const res = await fetch(`${apiHost}/api/envios`, { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo obtener envios');
    return await res.json();
  } catch (e) {
    console.warn('fetchEnvios falló, fallback a {}', e);
    return {};
  }
}

async function calcularCostoEnvio(municipio) {
  if (!municipio) return 0;
  const zonas = await fetchEnvios();
  const key = municipio.trim();
  return Number(zonas[key] || 0);
}

/* Formateo y render */
function formatearMXN(num) {
  return Number(num).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

async function renderResumen() {
  const carritoLocal = getCarritoLocal();
  if (!resumenDiv) return;

  if (!carritoLocal || carritoLocal.length === 0) {
    resumenDiv.innerHTML = `<p>No hay productos en el carrito.</p>`;
    return;
  }

  const municipioEl = document.getElementById('municipio');
  const municipio = municipioEl?.value || '';
  const costoEnvio = await calcularCostoEnvio(municipio);

  const subtotal = carritoLocal.reduce((acc, item) => acc + (Number(item.precio) || 0) * (Number(item.cantidad) || 0), 0);
  const total = subtotal + Number(costoEnvio || 0);

  let resumenHTML = `<h3>🧾 Resumen del carrito</h3><ul style="list-style:none; padding: 0;">`;
  carritoLocal.forEach(item => {
    const itemSubtotal = (Number(item.precio) || 0) * (Number(item.cantidad) || 0);
    resumenHTML += `
      <li style="margin-bottom: 10px;">
        <strong>${item.nombre}</strong> x${item.cantidad} - $${formatearMXN(itemSubtotal)} MXN
      </li>`;
  });

  resumenHTML += `</ul>
    <p><strong>Subtotal: $${formatearMXN(subtotal)} MXN</strong></p>
    <p><strong>Costo de envío: $${formatearMXN(costoEnvio)} MXN</strong></p>
    <p><strong>Total: $${formatearMXN(total)} MXN</strong></p>`;

  resumenDiv.innerHTML = resumenHTML;
}

/* Inicializar render y listener municipio */
renderResumen().catch(err => console.error('renderResumen inicial error:', err));
document.getElementById('municipio')?.addEventListener('change', () => {
  renderResumen().catch(err => console.error('renderResumen on change error:', err));
});

/* Mostrar/ocultar campos fiscales */
const facturaSelector = document.getElementById("requiere-factura");
const facturaCampos = document.getElementById("factura-campos");

if (facturaSelector && facturaCampos) {
  facturaSelector.addEventListener("change", () => {
    const requiereFactura = facturaSelector.value === "si";
    facturaCampos.style.display = requiereFactura ? "block" : "none";
    facturaCampos.querySelectorAll("input, select").forEach(el => {
      el.required = requiereFactura;
    });
  });
}

/* Validación RFC */
function validarRFC(rfc) {
  const regex = /^([A-ZÑ&]{3,4})\d{6}[A-Z0-9]{3}$/;
  return regex.test((rfc || '').toUpperCase());
}

/* Stripe setup (mantengo tus variables y funciones; solo cambié host -> apiHost en fetches) */
const stripe = Stripe("pk_test_51SFbvMQlXC3tONsWcBjgQdgwtdEZXWCA6rqTqBxBkq7zpRZ47i5vhE6c58AxY3DKnaaOtpfcy1jfcUCV9SbVPo8000H2sLxGB7"); // reemplaza si aplica
let elements;
let clientSecret;

async function crearIntentoPago(carritoToSend, datosCliente, total,) {
  const response = await fetch(`${apiHost}/api/crear-intento-pago`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ carrito: carritoToSend, datosCliente, total })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`crearIntentoPago fallo ${response.status} ${text}`);
  }

  const result = await response.json();
  if (!result.clientSecret) throw new Error("No se recibió clientSecret");
  return result.clientSecret;
}

async function montarStripeElements(stripeInstance, clientSecretArg) {
  const stripeContainer = document.getElementById("stripe-container");
  const btnConfirmar = document.getElementById("btnConfirmarPago");
  const btnSubmit = document.getElementById("btnSubmit");

  elements = stripeInstance.elements({ clientSecret: clientSecretArg });

  const paymentElement = elements.create("payment", {
    fields: {
      billingDetails: {
        name: "never",
        email: "never",
        phone: "never",
        address: "auto"
      }
    }
  });

  if (typeof pedidoForm !== 'undefined' && pedidoForm) {
  bloquearCamposFormulario(pedidoForm);
}

  paymentElement.on("ready", () => {
    if (stripeContainer) stripeContainer.style.display = "block";
    if (btnConfirmar) {
      btnConfirmar.style.display = "inline-block";
      btnConfirmar.disabled = false;
    }
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.style.opacity = "0.5";
      btnSubmit.style.display = "none";
    }
  });

  paymentElement.mount("#card-element");
}

/* Enviar pedido y montar Stripe */
const pedidoForm = document.getElementById("pedido-form");

if (pedidoForm) {
  pedidoForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const carritoLocal = getCarritoLocal();
    const formData = new FormData(pedidoForm);

    if (!Array.isArray(carritoLocal) || carritoLocal.length === 0) {
      alert("El carrito está vacío");
      return;
    }

    if (formData.get("requiere_factura") === "si") {
      const rfc = formData.get("rfc")?.trim();
      if (!validarRFC(rfc)) {
        alert("❌ RFC inválido. Verifica el formato.");
        return;
      }
    }

    const municipio = formData.get("municipio") || '';
    const costo_envio = await calcularCostoEnvio(municipio);
    const subtotal = carritoLocal.reduce((acc, item) => acc + (Number(item.precio) || 0) * (Number(item.cantidad) || 0), 0);
    const total = subtotal + Number(costo_envio || 0);

    const data = {
      fecha: formData.get("fecha"),
      nombre: formData.get("nombre"),
      correo: formData.get("correo"),
      telefono: formData.get("telefono"),
      direccion: formData.get("direccion"),
      municipio,
      estado: formData.get("estado"),
      codigo_postal: formData.get("codigo_postal"),
      carrito: carritoLocal,
      costo_envio: Number(costo_envio || 0),
      total
    };

    if (formData.get("requiere_factura") === "si") {
      data.factura = {
        rfc: formData.get("rfc")?.trim(),
        razon_social: formData.get("razon_social")?.trim(),
        domicilio_fiscal: formData.get("domicilio-fiscal")?.trim(),
        uso_cfdi: formData.get("uso_cfdi"),
        regimen_fiscal: formData.get("regimen_fiscal"),
      };
    }

//LOOOOOOOOOL


    console.log("🚀 Enviando datos al backend...", data);

    try {
      const response = await fetch(`${apiHost}/api/process-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Error en el servidor ${response.status} ${text}`);
      }

      const result = await response.json();
      console.log("PROCESANDO PEDIDO✨:", result);
      alert("Pedido enviado correctamente");

      const serverTotal = Number(result.total ?? total);
      clientSecret = await crearIntentoPago(carritoLocal, {
        nombre: data.nombre,
        correo: data.correo,
        telefono: data.telefono,
        costo_envio: data.costo_envio
      }, serverTotal);

      await montarStripeElements(stripe, clientSecret);

    } catch (err) {
      console.error("❌ Error en el envío:", err);
      alert("Hubo un error al enviar el pedido");
    }
  });
}

/* Confirmar pago con Stripe */
const btnConfirmar = document.getElementById("btnConfirmarPago");
if (btnConfirmar) {
  btnConfirmar.addEventListener("click", async () => {
    if (!elements) {
      alert("Formulario de pago no listo");
      return;
    }

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${location.protocol}//${location.hostname}${location.port ? ':'+location.port : ''}/success.html`,
          payment_method_data: {
            billing_details: {
              name: pedidoForm.querySelector("[name='nombre']").value.trim(),
              email: pedidoForm.querySelector("[name='correo']").value.trim(),
              phone: pedidoForm.querySelector("[name='telefono']").value.trim()
            }
          }
        }
      });

      if (error) {
        console.error("❌ Error en el pago:", error.message);
        alert("Hubo un error al procesar el pago");
      }
    } catch (e) {
      console.error("❌ Excepción confirmPayment:", e);
    }
  });
}


// Bloquea inputs del formulario para evitar edición una vez que se muestra Stripe Elements
function bloquearCamposFormulario(formEl) {
  if (!formEl) return;
  formEl.querySelectorAll('input, select, textarea, button[type="submit"]').forEach(el => {

    if (el.id === 'btnConfirmarPago') return;
  
    if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'email' || el.type === 'tel' || el.type === 'number' || el.type === 'date')) {
      el.readOnly = true;
    } else {
      el.disabled = true;
    }

    el.setAttribute('data-locked', '1');
   
    el.classList.add('campo-bloqueado');
  });
}
// Opcional: función para desbloquear (si la necesitas)
function desbloquearCamposFormulario(formEl) {
  if (!formEl) return;
  formEl.querySelectorAll('[data-locked="1"]').forEach(el => {
    if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'email' || el.type === 'tel' || el.type === 'number' || el.type === 'date')) {
      el.readOnly = false;
    } else {
      el.disabled = false;
    }
    el.removeAttribute('data-locked');
    el.classList.remove('campo-bloqueado');
  });
}

/* Fecha por defecto */
const hoyEl = document.getElementById("fecha");
if (hoyEl) {
  hoyEl.value = new Date().toISOString().split("T")[0];
}
