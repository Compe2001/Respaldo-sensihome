document.addEventListener('DOMContentLoaded', () => {
  const botones = document.querySelectorAll('.agregar-carrito');

  botones.forEach(boton => {
    boton.addEventListener('click', () => {
      const producto = boton.closest('.thumbnail2, .thumbnail3')
      const nombre = producto.getAttribute('data-nombre');
      agregarAlCarrito(nombre);
    });
  });
});


function agregarAlCarrito(nombreProducto) {
 console.log('Agregando producto:', nombreProducto);
  mostrarNotificacionExito(`🛒 "${nombreProducto}" fue agregado al carrito`);
}


function mostrarNotificacionExito(mensaje, tipo = 'exito', duracion = 1500) {
  const contenedor = document.getElementById('notificaciones');
  if (!contenedor) return;

  const noti = document.createElement('div');
  noti.className = `notificacion ${tipo}`;
  noti.textContent = mensaje;

  contenedor.appendChild(noti);

  setTimeout(() => {
    noti.remove();
  }, duracion);
}

function mostrarNotificacionWarning(mensaje, tipo = 'warning', duracion = 3000) {
  const contenedor = document.getElementById('notificaciones');
  if (!contenedor) return;

  const noti = document.createElement('div');
  noti.className = `notificacion ${tipo}`;
  noti.textContent = mensaje;

  contenedor.appendChild(noti);

  setTimeout(() => {
    noti.remove();
  }, duracion);
}

function mostrarNotificacionInfo(mensaje, tipo = 'info', duracion = 2000) {
  const contenedor = document.getElementById('notificaciones');
  if (!contenedor) return;

  const noti = document.createElement('div');
  noti.className = `notificacion ${tipo}`;
  noti.textContent = mensaje;

  contenedor.appendChild(noti);

  setTimeout(() => {
    noti.remove();
  }, duracion);
}


function limiteStockAlcanzado(nombreProducto) {
 console.log('limite de pedido por stock:', nombreProducto);
  mostrarNotificacionWarning(`🛒 "${nombreProducto}" no se puede agregar más productos,`); 
}