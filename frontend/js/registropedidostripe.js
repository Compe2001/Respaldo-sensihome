const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
const resumenDiv = document.getElementById("resumen-pedido");
const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : `https://api.${window.location.hostname}`;

function renderResumen() {
  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  let resumenHTML = `<h3>🧾 Resumen del carrito</h3><ul style="list-style:none; padding: 0;">`;
  carrito.forEach(item => {
    const subtotal = item.precio * item.cantidad;
    resumenHTML += `
      <li style="margin-bottom: 10px;">
        <strong>${item.nombre}</strong> x${item.cantidad} - $${subtotal.toLocaleString()} MXN
      </li>`;
  });
  resumenHTML += `</ul>
    <p><strong>Total: $${total.toLocaleString()} MXN</strong></p>`;
  resumenDiv.innerHTML = resumenHTML;
}

if (resumenDiv && carrito.length > 0) {
  renderResumen();
}

// Mostrar/ocultar campos fiscales
const facturaSelector = document.getElementById("requiere-factura");
const facturaCampos = document.getElementById("factura-campos");

facturaSelector.addEventListener("change", () => {
  const requiereFactura = facturaSelector.value === "si";
  facturaCampos.style.display = requiereFactura ? "block" : "none";
  facturaCampos.querySelectorAll("input, select").forEach(el => {
    el.required = requiereFactura;
  });
});

// Validación de RFC
function validarRFC(rfc) {
  const regex = /^([A-ZÑ&]{3,4})\d{6}[A-Z0-9]{3}$/;
  return regex.test(rfc.toUpperCase());
}

// 🔐 Stripe setup
const stripe = Stripe("pk_test_51SFbvMQlXC3tONsWcBjgQdgwtdEZXWCA6rqTqBxBkq7zpRZ47i5vhE6c58AxY3DKnaaOtpfcy1jfcUCV9SbVPo8000H2sLxGB7"); // ← reemplaza con tu publishable key real
let elements;
let clientSecret;

async function crearIntentoPago(carrito, datosCliente) {
  const response = await fetch(`${host}/api/crear-intento-pago`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ carrito, datosCliente })
  });

  const result = await response.json();
  if (!result.clientSecret) throw new Error("No se recibió clientSecret");
  return result.clientSecret;
}

async function montarStripeElements(stripe, clientSecret) {
  const stripeContainer = document.getElementById("stripe-container");
  const btnConfirmar = document.getElementById("btnConfirmarPago");
  const btnSubmit = document.getElementById("btnSubmit");

  elements = stripe.elements({ clientSecret });

  const paymentElement = elements.create("payment", {
  fields: {
    billingDetails: {
      name: "never",       // ya lo capturas tú
      email: "never",      // ya lo capturas tú
      phone: "never",      // evita duplicar
      address: "auto"      // opcional, Stripe lo muestra si lo necesita
    }
  }
});

  paymentElement.on("ready", () => {
    stripeContainer.style.display = "block";
    btnConfirmar.style.display = "inline-block";
    btnConfirmar.disabled = false;
  
     if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.style.opacity = "0.5";
      btnSubmit.style.display = "none";

    }
  
  });

  paymentElement.mount("#card-element");

}

// 🧾 Enviar pedido y montar Stripe
const pedidoForm = document.getElementById("pedido-form");

if (pedidoForm) {
  pedidoForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const formData = new FormData(pedidoForm);

    const data = {
      fecha: formData.get("fecha"),
      nombre: formData.get("nombre"),
      correo: formData.get("correo"),
      telefono: formData.get("telefono"),
      direccion: formData.get("direccion"),
      municipio: formData.get("municipio"),
      estado: formData.get("estado"),
      codigo_postal: formData.get("codigo_postal"),
      carrito: carrito
    };

  // Si requiere factura, agregar datos fiscales
    if (formData.get("requiere_factura") === "si") {
      const rfc = formData.get("rfc")?.trim();
      if (!validarRFC(rfc)) {
        alert("❌ RFC inválido. Verifica el formato.");
        return;
      }

      data.factura = {
        rfc,
        razon_social: formData.get("razon_social")?.trim(),
        domicilio_fiscal: formData.get("domicilio-fiscal")?.trim(),
        uso_cfdi: formData.get("uso_cfdi"),
        regimen_fiscal: formData.get("regimen_fiscal"),
      };
    }


  //VALIDACIÓN ENVIO AL BACKEND🔥
    console.log("🚀 Enviando datos al backend...", data);

    try {
      const response = await fetch(`${host}/api/process-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error("Error en la respuesta del servidor");

      const result = await response.json();
      console.log("PROCESANDO PEDIDO✨:", result);
      alert("Pedido enviado correctamente");

      // 🔐 Crear intento de pago y montar Stripe
      clientSecret = await crearIntentoPago(carrito, data);
      await montarStripeElements(stripe, clientSecret);

    } catch (err) {
      console.error("❌ Error en el envío:", err);
      alert("Hubo un error al enviar el pedido");
    }
  });
}

// 💳 Confirmar pago con Stripe
const btnConfirmar = document.getElementById("btnConfirmarPago");
if (btnConfirmar) {
  btnConfirmar.addEventListener("click", async () => {
    if (!elements) {
      alert("Formulario de pago no listo");
      return;
      console.log ("formulario no listo")
    }

    try {
     const { error } = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: "http://localhost:3000/success.html",
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


