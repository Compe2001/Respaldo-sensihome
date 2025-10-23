// utils/orderManager.js (reemplazar mapOrderToSheetDB y saveOrderToSheetDB)
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const PENDING_DIR = path.join(__dirname, '..', 'data', 'pending-orders');
const SHEETDB_URL = process.env.SHEETDB_ENDPOINT;
const SHEETDB_AUTH = process.env.SHEETDB_AUTH || '';

function ensurePendingDir() {
  if (!fs.existsSync(PENDING_DIR)) fs.mkdirSync(PENDING_DIR, { recursive: true });
}

function mapOrderToSheetDB(order) {
  const total = (order.carrito || []).reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const resumen_carrito = (order.carrito || []).map(p => `${p.nombre} x${p.cantidad}`).join(', ');

  return {
    nombre: order.cliente?.nombre || '',
    resumen_carrito,
    total,
    fecha: order.creado || '',
    direccion: order.cliente?.direccion || '',
    estado: order.cliente?.estado || '',
    ciudad: order.cliente?.municipio || '',
    codigo_postal: order.cliente?.codigo_postal || '',
    correo: order.cliente?.correo || '',
    telefono: order.cliente?.telefono || '',
    link_pago: order.link_pago || '',
    status: order.estado || '',
    RFC: order.factura?.rfc || '',
    "RAZON SOCIAL": order.factura?.razon_social || '',
    CFDI: order.factura?.uso_cfdi || '',
    "REGIMEN FISCAL": order.factura?.regimen_fiscal || '',
    "METODO DE PAGO": order.metodo_pago || ''
  };
}

async function saveOrderToSheetDB(order) {
  if (!SHEETDB_URL) throw new Error('SHEETDB_ENDPOINT no definido');

  const payload = mapOrderToSheetDB(order);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (SHEETDB_AUTH) headers['Authorization'] = SHEETDB_AUTH;

    const res = await axios.post(SHEETDB_URL, { data: [payload] }, { headers, timeout: 10000 });
    return res.data;
  } catch (err) {
    console.warn('⚠️ Error al enviar a SheetDB, guardando en cola:', err.message || err);
    ensurePendingDir();
    const file = path.join(PENDING_DIR, `${order.orderId}.json`);
    fs.writeFileSync(file, JSON.stringify(order, null, 2));
    return null;
  }
}

function retryPendingOrdersWorker() {
  ensurePendingDir();
  const files = fs.readdirSync(PENDING_DIR).filter(f => f.endsWith('.json'));

  files.forEach(async file => {
    const fullPath = path.join(PENDING_DIR, file);
    const order = JSON.parse(fs.readFileSync(fullPath));
    try {
      await saveOrderToSheetDB(order);
      fs.unlinkSync(fullPath);
      console.log(`✅ Reintento exitoso: ${file}`);
    } catch (err) {
      console.warn(`❌ Falló reintento: ${file}`, err.message || err);
    }
  });
}

function startWorker(intervalMs = 60000) {
  setInterval(retryPendingOrdersWorker, intervalMs);
}

module.exports = {
  saveOrderToSheetDB,
  retryPendingOrdersWorker,
  startWorker
};
