// backend/utils/orderManager.js
const axios = require('axios');
const SHEETDB_URL = process.env.SHEETDB_ENDPOINT;
const envios = require('../config/envios.json'); // ajusta la ruta si es diferente


async function saveOrderToSheetDB(order) {
  if (!SHEETDB_URL) {
    console.warn('❌ SHEETDB_ENDPOINT no definido en .env');
    return;
  }


//OBTENER COSTO DE ENVIO CONSTANTES
const zona = order.municipio?.trim();
const costoEnvio = envios[zona] || 0;



  const payload = {
    data: [{
      nombre: order.nombre || '',
      resumen_carrito: order.resumen_carrito || '',
      total: Number(order.total || 0),
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
      "METODO DE PAGO": 'stripe' // fijo por ahora
    }]
  };

  try {
    const response = await axios.post(SHEETDB_URL, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Pedido enviado a SheetDB:', response.data);
  } catch (error) {
    console.error('❌ Error al enviar a SheetDB:', error.response?.data || error.message);
  }
}

module.exports = { saveOrderToSheetDB };
