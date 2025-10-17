// backend/routes/stripe.js
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// 💳 Endpoint para crear intento de pago con Stripe
router.post('/crear-intento-pago', async (req, res) => {
  try {
    const { carrito = [], datosCliente = {} } = req.body;

    if (!Array.isArray(carrito) || carrito.length === 0) {
      return res.status(400).json({ error: 'Carrito vacío o malformado' });
    }

    const total = carrito.reduce((sum, item) => {
      const precio = Number(item.precio);
      const cantidad = Number(item.cantidad);
      if (!Number.isFinite(precio) || !Number.isFinite(cantidad)) throw new Error("Item inválido");
      return sum + precio * cantidad;
    }, 0);
    const amount = Math.round(total * 100);

    const producto = carrito[0]?.nombre || "Pedido Sensi";

    const metadata = {
      producto,
      fecha: new Date().toISOString().split("T")[0],
      nombre: String(datosCliente.nombre || "").slice(0, 480),
      correo: String(datosCliente.correo || "").slice(0, 480)
    };

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'mxn',
      automatic_payment_methods: { enabled: true },
      metadata
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (err) {
    console.error("❌ Error creando PaymentIntent:", err);
    res.status(500).json({ error: 'Error interno al crear intento de pago' });
  }
});

module.exports = router;
