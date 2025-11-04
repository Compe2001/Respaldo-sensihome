document.addEventListener('DOMContentLoaded', () => {
  const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : `https://api.${window.location.hostname}`;

  const carritoRaw = JSON.parse(localStorage.getItem("carrito")) || [];
  const carritoSanitizado = carritoRaw.map(item => ({
    nombre: item.nombre,
    precio: Number(item.precio),
    cantidad: Number(item.cantidad)
  }));

  const resumenDiv = document.getElementById("resumen-pedido");
  const municipioInput = document.getElementById("municipio");

  let costoEnvio = 0;

  async function obtenerCostoEnvio(municipio) {
    try {
      const res = await fetch(`${host}/api/envios`);
      const zonas = await res.json();
      return zonas[municipio?.trim()] || 0;
    } catch (err) {
      console.warn("⚠️ No se pudo obtener costo de envío:", err);
      return 0;
    }
  }

  async function renderResumen() {
    const municipio = municipioInput?.value?.trim();
    costoEnvio = await obtenerCostoEnvio(municipio);

    const total = carritoSanitizado.reduce((acc, item) => acc + item.precio * item.cantidad, 0) + costoEnvio;

    let resumenHTML = `<h3>🧾 Resumen del carrito</h3><ul style="list-style:none; padding: 0;">`;
    carritoSanitizado.forEach(item => {
      const subtotal = item.precio * item.cantidad;
      resumenHTML += `<li style="margin-bottom: 10px;"><strong>${item.nombre}</strong> x${item.cantidad} - $${subtotal.toLocaleString()} MXN</li>`;
    });

    if (costoEnvio > 0) {
      resumenHTML += `<li style="margin-bottom: 10px;"><strong>Costo de envío</strong> - $${costoEnvio.toLocaleString()} MXN</li>`;
    }

    resumenHTML += `</ul><p><strong>Total: $${total.toLocaleString()} MXN</strong></p>`;
    resumenDiv.innerHTML = resumenHTML;
  }

  if (resumenDiv && carritoSanitizado.length > 0) {
    renderResumen();
    municipioInput?.addEventListener("change", renderResumen);
  }

  const facturaSelector = document.getElementById("requiere-factura");
  const facturaCampos = document.getElementById("factura-campos");
  if (facturaSelector && facturaCampos) {
    facturaSelector.addEventListener("change", () => {
      const requiereFactura = facturaSelector.value === "si";
      facturaCampos.style.display = requiereFactura ? "block" : "none";
      facturaCampos.querySelectorAll("input, select").forEach(el => el.required = requiereFactura);
    });
  }

  const pedidoForm = document.getElementById("pedido-form");
  if (!pedidoForm) return;

  pedidoForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(pedidoForm);

    const carritoToSend = carritoSanitizado.map(i => ({ ...i }));

    const data = {
      fecha: formData.get("fecha"),
      nombre: formData.get("nombre"),
      correo: formData.get("correo"),
      telefono: formData.get("telefono"),
      direccion: formData.get("direccion"),
      municipio: formData.get("municipio"),
      estado: formData.get("estado"),
      codigo_postal: formData.get("codigo_postal"),
      carrito: carritoToSend,
      costo_envio: costoEnvio
    };

    if (formData.get("requiere_factura") === "si") {
      const rfc = formData.get("rfc")?.trim();
      if (!validarRFC(rfc)) {
        alert("❌ RFC inválido.");
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

    console.log("🚀 Enviando datos al backend...", data);

    try {
      const response = await fetch(`${host}/api/crear-preferencia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Error en la respuesta del servidor');

      console.log("✅ Preferencia creada:", body);
      window.location.href = body.init_point;
    } catch (err) {
      console.error("❌ Error en el envío:", err);
      alert("Hubo un error al enviar el pedido: " + (err.message || err));
    }
  });
});
