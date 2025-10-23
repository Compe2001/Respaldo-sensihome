//pago.js
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
if (!process.env.STRIPE_SECRET_KEY) {
console.error('❌ STRIPE_SECRET_KEY no definida en env!');}
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/crear-intento-pago', async (req, res) => {
  console.log('🎯 /crear-intento-pago recibido, body:', req.body);
  const { carrito, datosCliente } = req.body;
  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const montoFinal = total * 100; // Stripe usa centavos

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: montoFinal,
      currency: 'mxn',
      automatic_payment_methods: { enabled: true },
      metadata: {
        cliente: JSON.stringify(datosCliente),
        carrito: JSON.stringify(carrito)
      }
    });

    console.log('✅ PaymentIntent creado, id:', paymentIntent.id);
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('❌ Error creando PaymentIntent:', error);
    res.status(500).json({ error: 'No se pudo crear el intento de pago' });
  }
});



router.get('/confirmar-pago', async (req, res) => {
  const { session_id } = req.query;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const cliente = JSON.parse(session.metadata.cliente || '{}');

    res.json({
      success: true,
      cliente,
      monto: session.amount_total,
      carrito: [] // opcional: puedes guardar el carrito en metadata si lo necesitas
    });
  } catch (error) {
    console.error("❌ Error al confirmar sesión:", error);
    res.status(500).json({ success: false });
  }
});



module.exports = router;
