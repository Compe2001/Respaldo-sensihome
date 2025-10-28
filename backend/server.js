// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ 🔧 Inicialización y configuración base    ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ 🛡️ Seguridad: Helmet + CSP para Stripe     ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://*.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      objectSrc: ["'none'"]
    }
  }
}));

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ 🌐 Servir frontend estático                ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
app.use(express.static(path.join(__dirname, "../frontend")));

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ 🧩 Middlewares globales                   ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

let origin = ['http://127.0.0.1:5500','http://localhost:5500','http://localhost:3000', process.env.FRONTEND_URL];

if (process.env.NODE_ENV === 'production') {
  origin = process.env.FRONTEND_URL;
}

app.use(cors({
  origin,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ 💳 Stripe: intento de pago (módulo externo)┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
const stripeRoutes = require('./routes/stripe');
app.use('/api', stripeRoutes);

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ 💰 Mercado Pago: preferencia (módulo externo)┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
const mercadoPagoRoutes = require('./routes/mercadopago');
app.use('/api', mercadoPagoRoutes);

console.log("🧪 Tipo de mercadoPagoRoutes:", typeof mercadoPagoRoutes);
console.log("🧪 Contenido:", mercadoPagoRoutes);

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ costo envios┃✨
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
const enviosRoutes = require('./routes/envios');
app.use('/api/envios', enviosRoutes);

//log de rutas
console.log("🧭 Rutas activas en el backend:");
app._router?.stack?.forEach(r => {
  if (r.route && r.route.path) {
    console.log("→", r.route.path);
  }
});

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ 🧪 Ruta de salud                           ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Backend limpio y funcional',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ 📦 Consulta de stock local                ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
app.get("/api/stock", (req, res) => {
  const filePath = path.join(__dirname, "data", "stock.json");
  try {
    const rawData = fs.readFileSync(filePath, "utf-8");
    const stockData = JSON.parse(rawData);
    res.json(stockData);
  } catch (err) {
    console.error("❌ Error al leer stock.json:", err);
    res.status(500).json({ error: "No se pudo cargar el stock" });
  }
});

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ 🧾 Procesamiento de pedidos               ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
app.post('/api/process-order', async (req, res) => {
  const { saveOrderToSheetDB } = require('./utils/orderManager');
  const body = req.body;
  console.log('📨 Body recibido:', body);

  if (!body || Object.keys(body).length === 0) {
    return res.status(400).json({ error: 'Body vacío o malformado' });
  }

  const {
    fecha = "",
    nombre = "",
    correo = "",
    telefono = "",
    direccion = "",
    municipio = "",
    estado = "",
    codigo_postal = "",
    carrito = [],
    costo_envio: costoEnvioFromClient = 0,
    total: totalFromClient
  } = body;

  if (!Array.isArray(carrito) || carrito.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío o malformado' });
  }

  if (carrito.some(item => typeof item.precio !== 'number' || typeof item.cantidad !== 'number')) {
    return res.status(400).json({ error: 'Cada item debe tener precio y cantidad numéricos' });
  }

  // Recalcular subtotal en backend (fuente de la verdad)
  const subtotal = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const costo_envio = Number(costoEnvioFromClient || 0);
  const total = Number(totalFromClient ?? (subtotal + costo_envio));

  const resumen_carrito = carrito.map(item => `${item.nombre} x${item.cantidad}`).join(', ');

  console.log('Pedido recibido (server):', { nombre, resumen_carrito, subtotal, costo_envio, total, status: 'pendiente' });

  // Construir row explícito para SheetDB (ajusta los nombres de campos si tu hoja usa otros encabezados)
  const row = {
    fecha: fecha || new Date().toISOString().split('T')[0],
    nombre: nombre || '',
    correo: correo || '',
    telefono: telefono || '',
    direccion: direccion || '',
    municipio: municipio || '',
    estado: estado || '',
    codigo_postal: codigo_postal || '',
    resumen_carrito,
    subtotal,
    costo_envio,
    total,
    status: 'pendiente',
    factura: body.factura ? JSON.stringify(body.factura) : null
  };

  try {
    // Log payload que enviaremos (temporal para depuración)
    console.log('📤 Payload a SheetDB:', JSON.stringify(row));

    // saveOrderToSheetDB debe aceptar el objeto row; si espera { data: row } o diferente, adapta aquí.
    const sheetResult = await saveOrderToSheetDB(row);

    // Log respuesta de SheetDB (útil para ver si SheetDB está ignorando campos)
    console.log('✅ Pedido enviado a SheetDB:', sheetResult);

    // Responder al frontend; puedes incluir sheetResult si lo necesitas
    return res.json({ success: true, sheetResult, total });
  } catch (err) {
    console.error('❌ Error al guardar en SheetDB:', err);
    return res.status(500).json({ error: 'No se pudo guardar el pedido en SheetDB' });
  }
});

// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ 🚀 Inicio del servidor                    ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
app.listen(PORT, () => {
  console.log(`🚀 Servidor SH corriendo en http://localhost:${PORT}`);
});



