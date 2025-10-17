// utils/stockSync.js
// IMPORTANTE!! ⏱️Producción⏱️: sincroniza data/stock.json con Google Sheets (lectura vía sheetSyncManager)
// Uso: require('./utils/stockSync').syncStock() desde un endpoint o ejecutar node utils/stockSync.js
// Comportamiento: crea backup, escribe atomically, guarda sheetCache y appends sync-log

const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadSheetData } = require('./sheetSyncManager'); // ajusta ruta si tu archivo está en otro lugar

const DATA_DIR = path.join(__dirname, '..', 'data');
const STOCK_FILE = path.join(DATA_DIR, 'stock.json');
const SHEET_CACHE = path.join(DATA_DIR, 'sheetCache.json');
const SYNC_LOG = path.join(DATA_DIR, 'sync-log.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to read/parse ${filePath}: ${err.message}`);
  }
}

function writeJsonAtomic(filePath, obj) {
  const tmp = path.join(os.tmpdir(), `${path.basename(filePath)}.${Date.now()}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
  fs.renameSync(tmp, filePath);
}

function normalizeProduct(p) {
  return {
    id: String(p.id ?? p.ID ?? '').trim(),
    nombre: p.nombre ?? p.name ?? '',
    precio: Number(p.precio ?? p.price ?? 0) || 0,
    precio_anterior: Number(p.precioAnterior ?? p.precio_anterior ?? 0) || 0,
    stock: Math.max(0, Math.floor(Number(p.stock ?? 0) || 0)),
    thumbnail: p.thumbnail == null ? null : String(p.thumbnail),
    activo: !!(p.activo === true || String(p.activo).toLowerCase() === 'true' || Number(p.activo) === 1)
  };
}

function buildMapById(arr) {
  const m = new Map();
  (arr || []).forEach(item => {
    if (item?.id) m.set(String(item.id), item);
  });
  return m;
}

function diffProducts(oldList, newList) {
  const oldMap = buildMapById(oldList);
  const newMap = buildMapById(newList);

  const added = [];
  const removed = [];
  const updated = [];

  for (const [id, newP] of newMap.entries()) {
    if (!oldMap.has(id)) {
      added.push(newP);
    } else {
      const oldP = oldMap.get(id);
      const changes = {};
      ['nombre','precio','precio_anterior','stock','thumbnail','activo'].forEach(k => {
        const a = oldP[k] ?? null;
        const b = newP[k] ?? null;
        if ((a === null && b !== null) || (a !== null && b === null) || a !== b) {
          changes[k] = { from: a, to: b };
        }
      });
      if (Object.keys(changes).length > 0) updated.push({ id, changes });
    }
  }

  for (const [id, oldP] of oldMap.entries()) {
    if (!newMap.has(id)) removed.push(oldP);
  }

  return { added, removed, updated };
}

async function compareAndUpdateStock({ dryRun = true } = {}) {
  ensureDataDir();

  const currentStock = readJsonSafe(STOCK_FILE) || [];
  const sheetProductsRaw = await loadSheetData(); // espera array de objetos
  const sheetProducts = (sheetProductsRaw || []).map(normalizeProduct);

  const { added, removed, updated } = diffProducts(currentStock, sheetProducts);
  const totalChanges = added.length + removed.length + updated.length;

  const timestamp = new Date().toISOString();
  const result = {
    timestamp,
    dryRun: !!dryRun,
    summary: { added: added.length, removed: removed.length, updated: updated.length },
    details: { added, removed, updated }
  };

  if (dryRun || totalChanges === 0) {
    return result;
  }

  const backupFile = path.join(DATA_DIR, `stock_backup_${Date.now()}.json`);

  try {
    writeJsonAtomic(backupFile, currentStock);
    writeJsonAtomic(STOCK_FILE, sheetProducts);
    writeJsonAtomic(SHEET_CACHE, { timestamp, raw: sheetProductsRaw });

    const existingLog = readJsonSafe(SYNC_LOG) || [];
    existingLog.push({
      timestamp,
      summary: result.summary,
      changes: result.details,
      backup: path.basename(backupFile),
      source: 'google-sheets'
    });
    writeJsonAtomic(SYNC_LOG, existingLog);

    result.applied = true;
    result.backup = path.basename(backupFile);
    return result;
  } catch (err) {
    // attempt restore from backup if possible
    if (fs.existsSync(backupFile)) {
      try {
        const backupData = readJsonSafe(backupFile);
        if (backupData) writeJsonAtomic(STOCK_FILE, backupData);
      } catch (_) {}
    }
    throw new Error(`Failed to apply sync: ${err.message}`);
  }
}

async function syncStock() {
  return compareAndUpdateStock({ dryRun: false });
}

if (require.main === module) {
  // ejecución directa: aplica cambios
  syncStock()
    .then(r => {
      if (r.applied) {
        console.log(`✅ Sincronización aplicada: +${r.summary.added} -${r.summary.removed} ~${r.summary.updated}`);
        console.log(`🗂 Backup: ${r.backup}`);
      } else {
        console.log('ℹ️ Dry-run o sin cambios:', r.summary);
      }
    })
    .catch(err => {
      console.error('❌ Error en syncStock:', err.message || err);
      process.exitCode = 1;
    });
} else {
  module.exports = { compareAndUpdateStock, syncStock };
}
