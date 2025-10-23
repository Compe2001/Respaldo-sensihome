// routes/mercadopago.js
const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Preference } = require('mercadopago');

// 🛡️ Validación defensiva del token
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error('❌ MP_ACCESS_TOKEN no definido en .env');
  throw new Error('Token de Mercado Pago no configurado');
}

// ✅ Inicialización moderna del cliente
const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });

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

  try {
    const preference = await new Preference(client).create({
      body: {
        items,
        back_urls: {
          success: "https://tusitio.com/success.html",
          failure: "https://tusitio.com/error.html",
          pending: "https://tusitio.com/pendiente.html"
        },
        auto_return: "approved",
        metadata: {
          correo: cliente.correo,
          fecha: cliente.fecha,
          carrito: JSON.stringify(carrito)
        }
      }
    });

    res.json({
      success: true,
      init_point: preference.init_point,
      preferenceId: preference.id
    });
  } catch (err) {
    const errorData = err.response?.data || err.message || err;
    console.error("❌ Error al crear preferencia:", errorData);
    res.status(500).json({ error: "Error al generar preferencia de pago", detalle: errorData });
  }
});

module.exports = router;
