const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Preference } = require('mercadopago');
const { saveOrderToSheetDB } = require('../utils/orderManager'); // Asegúrate que esta ruta sea correcta

// 🛡️ Validación defensiva del token
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error('❌ MP_ACCESS_TOKEN no definido en .env');
  throw new Error('Token de Mercado Pago no configurado');
}

// ✅ Inicialización moderna del cliente
const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });

//CREAR PREFERENCIA DE PAGO
router.post('/crear-preferencia', async (req, res) => {
  const { carrito, ...cliente } = req.body;

  if (!Array.isArray(carrito) || carrito.length === 0) {
    return res.status(400).json({ error: 'Carrito vacío o malformado' });
  }

  const items = carrito.map(item => ({
    title: item.nombre,
    quantity: item.cantidad,
    unit_price: item.precio,
    currency_id: "MXN"
  }));

  const total = items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);

  // 🧪 Validación defensiva de FRONTEND_URL
  const FRONTEND_URL = process.env.FRONTEND_URL;
  if (!FRONTEND_URL || !/^https?:\/\/.+/.test(FRONTEND_URL)) {
    console.error("❌ FRONTEND_URL mal definido:", FRONTEND_URL);
    return res.status(500).json({ error: "FRONTEND_URL no está definido o es inválido" });
  }

  const backUrls = {
    success: 'https://www.google.com',
    failure: `${FRONTEND_URL}/error.html`,
    pending: `${FRONTEND_URL}/pendiente.html`
  };

  console.log("🔗 back_urls:", backUrls);

  try {
    const preference = await new Preference(client).create({
      body: {
        items,
        back_urls: backUrls,
        auto_return: "approved",
        metadata: {
          correo: cliente.correo,
          referencia: cliente.nombre,
          carrito: JSON.stringify(carrito)
        }
      }
    });

    await saveOrderToSheetDB({
      ...cliente,
      carrito,
      total,
      fecha: new Date().toISOString(),
      metodo_de_pago: 'mercadopago'
    });

    res.json({ success: true, init_point: preference.init_point });
  } catch (err) {
    console.error("❌ Error al crear preferencia o registrar pedido:", err);
    res.status(500).json({ error: err.message || "Error al generar preferencia de pago" });
  }
});

module.exports = router;
