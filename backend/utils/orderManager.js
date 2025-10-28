// backend/utils/orderManager.js
const axios = require('axios');
const SHEETDB_URL = process.env.SHEETDB_ENDPOINT;
const envios = require('../config/envios.json');

/**
 * Guarda un pedido en SheetDB.
 * Acepta un objeto `order` y envía a SheetDB un row con campos explícitos.
 */
async function saveOrderToSheetDB(order) {
  if (!SHEETDB_URL) {
    console.warn('❌ SHEETDB_ENDPOINT no definido en .env');
    return { ok: false, reason: 'no_sheetdb_url' };
  }

  // Normalizar y calcular
  const carrito = Array.isArray(order.carrito) ? order.carrito : [];
  const subtotal = carrito.reduce((s, it) => s + (Number(it.precio) || 0) * (Number(it.cantidad) || 0), 0);
  const zona = (order.municipio || '').toString().trim();
  const costoEnvio = Number(order.costo_envio ?? envios[zona] ?? 0);
  const total = Number(order.total ?? (subtotal + costoEnvio));

  // Construir resumen de carrito y representaciones adicionales
  const resumen_carrito = carrito.map(i => `${i.nombre} x${i.cantidad}`).join(', ');
  const items_list = carrito.map(i => `${i.nombre} x${i.cantidad} ($${Number(i.precio)})`).join('; ');
  const carrito_json = JSON.stringify(carrito);

  // Construir payload con campos explícitos (asegúrate que los nombres coincidan con tus headers en la hoja)
  const payload = {
    data: [{
      // Campos básicos del formulario
      fecha: order.fecha || new Date().toISOString().split('T')[0],
      nombre: order.nombre || '',
      correo: order.correo || '',
      telefono: order.telefono || '',
      direccion: order.direccion || '',
      municipio: order.municipio || '',
      estado: order.estado || '',
      codigo_postal: order.codigo_postal || '',

      // Carrito / productos
      resumen_carrito,
      items_list,
      carrito_json,

      // Montos
      subtotal,
      costo_envio: costoEnvio,
      total,

      // Facturación / extra
      factura: order.factura ? JSON.stringify(order.factura) : '',
      METODO_DE_PAGO: order.metodo_pago || 'stripe',
      status: 'pendiente'
    }]
  };

  // Logs de depuración (temporal)
  console.log('📤 Payload a SheetDB:', JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(SHEETDB_URL, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Pedido enviado a SheetDB:', response.data);
    return { ok: true, data: response.data };
  } catch (error) {
    console.error('❌ Error al enviar a SheetDB:', error.response?.data || error.message);
    return { ok: false, error: error.response?.data || error.message };
  }
}

module.exports = { saveOrderToSheetDB };
