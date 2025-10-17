// carritoSingleItem.js

document.querySelectorAll('.comprar-ahora').forEach(btn => {
  btn.addEventListener('click', () => {
    const thumbnail = btn.closest('.thumbnail2, .thumbnail3');
    if (!thumbnail) {
      console.warn('❌ No se encontró el contenedor del thumbnail');
      return;
    }

const id = thumbnail.dataset.id;
const nombre = thumbnail.dataset.nombre || thumbnail.querySelector('.nombre-producto')?.textContent || 'Producto';
const precio = window.thumbnailStockManager.getPrecioPorId(id);
const stock = window.thumbnailStockManager.getStockPorId(id);
const imagen = thumbnail.querySelector('img')?.getAttribute('src') || '';

    if (stock < 1) {
      alert('🚫 Producto sin stock disponible');
      return;
    }

    const producto = { id, nombre, cantidad: 1, precio, imagen };
    mostrarMenuPagoIndividual(producto);
  });
});

function mostrarMenuPagoIndividual(producto) {
  const overlay = document.createElement('div');
  overlay.id = 'overlay-pago';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.4); z-index: 9998;
  `;
  overlay.addEventListener('click', cerrarMenuPago);
  document.body.appendChild(overlay);

  const menu = document.createElement('div');
  menu.id = 'menu-pago-individual';
  menu.className = 'menu-pago';
  menu.innerHTML = `
    <h3>🛒 Comprar: ${producto.nombre}</h3>
    <p>Total: $${producto.precio}</p>
    <p>Selecciona método de pago:</p>
    <button class="btn-pago" data-metodo="tarjeta">💳 Tarjeta</button>
    <button class="btn-pago" data-metodo="mercado">🧾 Mercado Pago</button>
    <button class="btn-pago" data-metodo="whatsapp">📞 Atención personalizada</button>
    <button class="btn-pago" data-metodo="tienda">🏪 Recoger en tienda (GDL)</button>
    <button onclick="cerrarMenuPago()">❌ Cancelar</button>
  `;
  document.body.appendChild(menu);

  document.querySelectorAll('.btn-pago').forEach(btn => {
    btn.addEventListener('click', () => {
      const metodo = btn.dataset.metodo;
      procesarPagoIndividual(metodo, producto);
      cerrarMenuPago();
    });
  });
}

function procesarPagoIndividual(metodo, producto) {
  const pedido = {
    productos: [producto],
    tipo: 'compra-directa',
    metodoPago: metodo,
    timestamp: Date.now()
  };

  localStorage.setItem("carrito", JSON.stringify([producto]));
  localStorage.setItem("metodoPago", metodo);

  if (window.registroPedidoManager?.registrarPedido) {
    window.registroPedidoManager.registrarPedido(pedido);
  }

  switch (metodo) {
    case 'tarjeta':
      window.location.href = '/frontend/registroPedidoStripe.html';
      break;
    case 'mercado':
      window.location.href = '/frontend/formulariopedido.html';
      break;
    case 'whatsapp':
      window.location.href = `https://wa.me/523331408373?text=Hola, quiero comprar ${encodeURIComponent(producto.nombre)}`;
      break; 
    case 'tienda':
      window.location.href = '/frontend/formulario-tienda.html';
      break;
    default:
      alert('❌ Método de pago no reconocido');
  }
}

function cerrarMenuPago() {
  document.getElementById('menu-pago-individual')?.remove();
  document.getElementById('overlay-pago')?.remove();
}
