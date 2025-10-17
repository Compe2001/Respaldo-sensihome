const express = require('express');
const router = express.Router();
const mercadopago = require('mercadopago');

console.log("✅ mercadopago.js montado");

// Configura el token
mercadopago.access_token = process.env.MP_ACCESS_TOKEN;

// 🔍 Verificación de token
router.get('/_mp_check_token', async (req, res) => {
  try {
    const r = await mercadopago.get('/v1/users/me');
    res.json({ ok: true, result: r });
  } catch (err) {
    const upstream = err?.response?.body || err;
    res.status(400).json({ ok: false, upstream });
  }
});

// 💰 Crear preferencia
router.post('/crear-preferencia', async (req, res) => {
  try {
    console.log("📨 POST /crear-preferencia recibido");
    const { carrito = [], nombre, correo } = req.body;

    if (!Array.isArray(carrito) || carrito.length === 0) {
      return res.status(400).json({ error: 'Carrito vacío o malformado' });
    }

    const items = carrito.map(item => ({
      title: item.nombre,
      quantity: Number(item.cantidad),
      unit_price: Number(item.precio),
      currency_id: 'MXN'
    }));

    if (items.some(i => isNaN(i.unit_price) || isNaN(i.quantity))) {
      return res.status(400).json({ error: 'Precio o cantidad inválidos en algún item' });
    }

    if (!correo || !correo.includes('@')) {
      return res.status(400).json({ error: 'Correo inválido' });
    }

    const preference = {
      items,
      payer: { name: nombre, email: correo },
      back_urls: {
        success: 'https://sensihome.com.mx/success.html',
        failure: 'https://sensihome.com.mx/failure.html',
        pending: 'https://sensihome.com.mx/pending.html'
      },
      auto_return: 'approved'
    };

    console.log("🧾 Preferencia enviada a Mercado Pago:", JSON.stringify(preference, null, 2));

    if (!mercadopago.access_token) {
      console.error('❌ mercadopago.access_token no configurado. Revisa .env y orden de require.');
      return res.status(500).json({ error: 'MP token no configurado' });
    }

    const response = await mercadopago.preferences.create(preference);
    console.log("✅ Preferencia creada:", response.body);
    res.json({ preferenceId: response.body.id });

  } catch (error) {
    console.error("❌ Error inesperado en /crear-preferencia:");
    try {
      console.log("typeof error:", typeof error);
      console.log("error instanceof Error:", error instanceof Error);
      console.log("error keys:", Object.keys(error || {}));
      console.dir(error, { depth: null });
      if (error.response) {
        console.log("error.response.keys:", Object.keys(error.response || {}));
        console.log("error.response.body:", JSON.stringify(error.response.body || error.response, null, 2));
      }
    } catch (logErr) {
      console.error("⚠️ Falló el log del error:", logErr);
    }
    const upstream = error?.response?.body || error;
    res.status(500).json({ error: 'Error al generar preferencia de pago', upstream });
  }
});

module.exports = router;
