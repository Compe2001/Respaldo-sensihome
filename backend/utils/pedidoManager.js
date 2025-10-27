// backend/utils/pedidoManager.js
const axios = require('axios');
const SHEETDB_URL = process.env.SHEETDB_ENDPOINT;
const envios = require('../config/envios.json');

async function savePedidoMP(order) {
  if (!SHEETDB_URL) {
    console.warn('❌ SHEETDB_ENDPOINT no definido en .env');
    return;
  }

  // 🧮 Cálculo de envío
  const zona = order.municipio?.trim();
  const costoEnvio = envios[zona] || 0;

  // 🧾 Construcción del resumen del carrito
  const resumenItems = Array.isArray(order.carrito)
    ? order.carrito.map(item => `${item.nombre} x${item.cantidad}`)
    : [];

  if (costoEnvio > 0) {
    resumenItems.push(`Costo de envío $${costoEnvio}`);
  }

  const resumen_carrito = resumenItems.join(', ');

  // 🧮 Cálculo total incluyendo envío
  const subtotal = Array.isArray(order.carrito)
    ? order.carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
    : 0;

  const total = subtotal + costoEnvio;

  const payload = {
    data: [{
      nombre: order.nombre || '',
      resumen_carrito,
      total,
      fecha: order.fecha || new Date().toISOString(),
      direccion: order.direccion || '',
      estado: order.estado || '',
      ciudad: order.municipio || '',
      codigo_postal: order.codigo_postal || '',
      correo: order.correo || '',
      telefono: order.telefono || '',
      status: 'pendiente',
      RFC: order.factura?.rfc || '',
      "RAZON SOCIAL": order.factura?.razon_social || '',
      CFDI: order.factura?.uso_cfdi || '',
      "REGIMEN FISCAL": order.factura?.regimen_fiscal || '',
      "METODO DE PAGO": 'mercadopago',
      "COSTO ENVÍO": costoEnvio
    }]
  };

  try {
    const response = await axios.post(SHEETDB_URL, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Pedido MP enviado a SheetDB:', response.data);
  } catch (error) {
    console.error('❌ Error al enviar pedido MP:', error.response?.data || error.message);
  }
}

module.exports = { savePedidoMP };
