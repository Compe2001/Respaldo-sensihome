// utils/sheetSyncManager.js
// ⚙️ Sincronización Stock ↔ Google Sheets
// Estructura modular, diagnósticos y fallback de rango

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

/* ───────────────────────── CONFIG ───────────────────────── */
// 📁 Rutas de configuración
const CREDENTIALS_PATH = path.join(__dirname, '../config/credentials.json');
const TOKEN_PATH = path.join(__dirname, '../config/token.json');

// 🧾 ID de la hoja (desde la URL)
const SPREADSHEET_ID = '1Ib2TP3BoD53QwSKkUuaHhTsywO9nn-YSWGTO7tajRtE';

// 🏷 Nombre esperado de la pestaña (puedes dejar vacío para autodetección)
const EXPECTED_SHEET_NAME = 'Stock y Precios Sensi';

// 📏 Generadores de rango
const BASE_RANGE = (sheetName) => `'${sheetName}'!A2:G`;       // filas de datos sin encabezado
const WIDE_RANGE = (sheetName) => `'${sheetName}'!A1:G1000`;  // fallback amplio

/* ───────────────────────── UTILIDADES ───────────────────────── */
// 🧰 Helpers mínimos y defensivos
function fileExists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}
function safeParseJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (err) { throw new Error(`Failed to read/parse ${p}: ${err.message}`); }
}
function parseBooleanCell(val) {
  if (val === undefined || val === null) return false;
  const s = String(val).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'si' || s === 'sí' || s === 'y' || s === 'yes';
}
function parseNumberCell(val, fallback = 0) {
  if (val === undefined || val === null || String(val).trim() === '') return fallback;
  const n = Number(String(val).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

/* ───────────────────────── AUTH / METADATA ───────────────────────── */
// 🔐 Construye cliente OAuth2 usando config local
function getAuthClient() {
  if (!fileExists(CREDENTIALS_PATH)) throw new Error(`Missing credentials file at ${CREDENTIALS_PATH}`);
  if (!fileExists(TOKEN_PATH)) throw new Error(`Missing token file at ${TOKEN_PATH}`);
  const credentials = safeParseJSON(CREDENTIALS_PATH);
  const token = safeParseJSON(TOKEN_PATH);
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

// 📋 Lista nombres de pestañas disponibles (diagnóstico)
async function listSheetNames(auth) {
  const sheetsApi = google.sheets({ version: 'v4', auth });
  const res = await sheetsApi.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  return res.data.sheets.map(s => s.properties.title);
}

/* ───────────────────────── LECTURA Y PARSING ───────────────────────── */
// 🔁 Cargar datos desde Sheets con autodetección y fallbacks
async function loadSheetData() {
  try {
    const auth = getAuthClient();
    const availableSheets = await listSheetNames(auth);

    console.log('📋 Hojas detectadas:', availableSheets);

    // Selección de hoja (expected → fallback)
    let sheetName = EXPECTED_SHEET_NAME;
    if (!sheetName || !availableSheets.includes(sheetName)) {
      console.warn(`⚠️ Hoja esperada "${sheetName}" no encontrada. Usando primera hoja disponible.`);
      if (availableSheets.length === 0) throw new Error('No hay hojas en el documento.');
      sheetName = availableSheets[0];
    }

    const sheets = google.sheets({ version: 'v4', auth });

    // Intento 1: rango normal (A2:G)
    let range = BASE_RANGE(sheetName);
    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
      const rows = res.data.values || [];

      if (rows.length === 0) {
        console.log('ℹ️ Rango sin filas, intentando rango amplio...');
        range = WIDE_RANGE(sheetName);
      } else {
        return rowsToProducts(rows);
      }
    } catch (err1) {
      console.warn('⚠️ Error leyendo rango inicial:', err1.message || err1);
      range = WIDE_RANGE(sheetName);
    }

    // Intento 2: rango amplio (A1:G1000)
    const res2 = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
    const rows2 = res2.data.values || [];
    if (!rows2 || rows2.length === 0) {
      console.log('📭 La hoja está vacía o sin datos en el rango amplio.');
      return [];
    }
    return rowsToProducts(rows2);
  } catch (err) {
    console.error('❌ Error en loadSheetData:', err.message || err);
    throw err;
  }
}

// 🔬 Convertir filas crudas a objetos producto con parsing defensivo
function rowsToProducts(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    console.log('📭 rowsToProducts: sin filas.');
    return [];
  }

  // Detectar y remover encabezado si está presente
  const firstRow = rows[0].map ? rows[0] : [];
  const headers = firstRow.map(h => String(h || '').toLowerCase());
  const expectedHeaders = ['id','nombre','precio','precioanterior','stock','thumbnail','activo'];
  let dataRows = rows;
  const headerMatch = expectedHeaders.every((h, i) => headers[i] && headers[i].includes(h));
  if (headerMatch) dataRows = rows.slice(1);

  const productos = dataRows.map((row, index) => {
    return {
      id: row[0] ? String(row[0]).trim() : `sin-id-${index}`,
      nombre: row[1] ? String(row[1]).trim() : '',
      precio: parseNumberCell(row[2], 0),
      precioAnterior: parseNumberCell(row[3], 0),
      stock: Math.max(0, Math.floor(parseNumberCell(row[4], 0))),
      thumbnail: row[5] ? String(row[5]).trim() : '',
      activo: parseBooleanCell(row[6]),
    };
  });

  console.log('✅ Productos cargados desde Sheets:', productos);
  return productos;
}

/* ───────────────────────── EXPORT / EJECUCIÓN ───────────────────────── */
if (require.main === module) {
  // 🧪 Ejecución directa para diagnóstico
  loadSheetData()
    .then(products => {
      console.log('🎯 Resultado final:', products.length, 'productos');
    })
    .catch(err => {
      console.error('Fatal:', err.message || err);
      process.exitCode = 1;
    });
} else {
  // 📦 Export para usar desde otros módulos (p. ej. compare/update)
  module.exports = { loadSheetData, rowsToProducts, listSheetNames, getAuthClient };
}
