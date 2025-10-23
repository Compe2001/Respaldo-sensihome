//sheetddbClient.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const PENDING_DIR = path.join(__dirname, '..', 'data', 'pending-orders');
const SHEETDB_URL = process.env.SHEETDB_ENDPOINT;

function ensurePendingDir() {
  if (!fs.existsSync(PENDING_DIR)) fs.mkdirSync(PENDING_DIR, { recursive: true });
}

async function saveOrderToSheetDB(order) {
  try {
    const res = await axios.post(SHEETDB_URL, order);
    return res.data;
  } catch (err) {
    console.warn('⚠️ Error al enviar a SheetDB, guardando en cola:', err.message);
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
      console.warn(`❌ Falló reintento: ${file}`, err.message);
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
