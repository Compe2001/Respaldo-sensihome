// backend/utils/stripeManager.js
/*const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function crearPagoIntento(monto, moneda = 'mxn') {
  try {
    const pagoIntento = await stripe.paymentIntents.create({
      amount: monto,
      currency: moneda,
      automatic_payment_methods: { enabled: true },
    });
    return pagoIntento;
  } catch (error) {
    console.error('Error al crear intento de pago:', error);
    throw error;
  }
}

module.exports = { crearPagoIntento }; */
