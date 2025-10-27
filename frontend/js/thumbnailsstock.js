// =============================================
// ⏱️ EVENTO DE CARGA INICIAL
// =============================================
document.addEventListener("DOMContentLoaded", () => {
  window.thumbnailStockManager = new ThumbnailStockManager();
});


// =============================================
// 🧮 CONTADOR VISUAL DE CARRITO EN THUMBNAILS
// =============================================
function thumbnailContadorCarrito(thumbnail, precioElement, cantidadEnCarrito) {
  let contadorElement = thumbnail.querySelector('.contador-carrito');

  if (!contadorElement) {
    contadorElement = document.createElement('a');
    contadorElement.className = 'contador-carrito';
    thumbnail.insertBefore(contadorElement, precioElement.nextSibling);
  }

  if (cantidadEnCarrito > 0) {
    contadorElement.textContent = `🛒 ${cantidadEnCarrito}`;
    contadorElement.href = '/frontend/carrito.html';
  } else {
    contadorElement.textContent = '🛒';
    contadorElement.removeAttribute('href');
    contadorElement.style.cursor = 'default';
  }

  contadorElement.classList.add('actualizado');
  setTimeout(() => contadorElement.classList.remove('actualizado'), 300);
}


// =============================================
// 🖼️ GESTOR DE STOCK EN THUMBNAILS
// =============================================
class ThumbnailStockManager {
  constructor() {
    this.API_URL = this.detectarEntorno();
    this.stockData = [];
    this.init();
  }

  // 🌐 Detecta entorno (dev o prod)
  detectarEntorno() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : `https://api.${window.location.hostname}`;
  }

  // 🚀 Inicialización principal
  init() {
    this.thumbnails = document.querySelectorAll('.thumbnail2, .thumbnail3');
    if (this.thumbnails.length === 0) {
      console.log('🚫 No hay thumbnails en esta página');
      return;
    }

    console.log(`🎯 Inicializando ${this.thumbnails.length} thumbnails`);
    this.inicializarElementosStock();
    this.obtenerStock();
  }

  // 🧱 Crea elementos visuales de stock
  inicializarElementosStock() {
    this.thumbnails.forEach(thumbnail => {
      let stockElement = thumbnail.querySelector('.stock-info');
      if (!stockElement) {
        stockElement = document.createElement('p');
        stockElement.className = 'stock-info';
        thumbnail.insertBefore(stockElement, thumbnail.querySelector('.agregar-carrito') || thumbnail.lastChild);
      }
      stockElement.textContent = 'Stock: Cargando...';
      stockElement.classList.add('stock-cargando');
    });
  }

  // 🔄 Obtiene stock desde API
  async obtenerStock() {
    try {
      const res = await fetch(`${this.API_URL}/api/stock`);
      const data = await res.json();
      this.stockData = data;
      this.actualizarThumbnails();
    } catch (err) {
      console.error('❌ Error al obtener stock:', err);
      this.thumbnails.forEach(thumbnail => {
        const stockElement = thumbnail.querySelector('.stock-info');
        stockElement.textContent = 'Error al cargar stock';
        stockElement.style.color = 'gray';
      });
    }
  }

  // 💰 Obtiene precio por ID
  getPrecioPorId(id) {
    const producto = this.stockData.find(p => p.id === id);
    return producto?.precio || 0;
  }
// 📦 Obtiene stock por ID
getStockPorId(id) {
  const producto = this.stockData.find(p => p.id === id);
  return producto?.stock || 0;
}

getDescuentoPorcentaje(id) {
  const producto = this.stockData.find(p => p.id === id);
  if (!producto || !producto.precio_anterior || producto.precio_anterior <= producto.precio) return 0;
  const descuento = ((producto.precio_anterior - producto.precio) / producto.precio_anterior) * 100;
  return Math.round(descuento);
}
  


  // 🔁 Actualiza visualmente todos los thumbnails
  actualizarThumbnails() {
    const carrito = window.carritoManager?.obtenerCarrito() || [];

    this.thumbnails.forEach(thumbnail => {
      const id = thumbnail.dataset.id;
      const producto = this.stockData.find(p => p.id === id);
      const stockElement = thumbnail.querySelector('.stock-info');
      const btn = thumbnail.querySelector('.agregar-carrito');

      // 🔍 Validación de existencia
      if (!producto) {
        stockElement.textContent = 'Producto no encontrado';
        stockElement.style.color = 'gray';
        if (btn) btn.disabled = true;
        return;
      }

      // 🖼️ Imagen dinámica
      const imagenEl = thumbnail.querySelector("img");
      if (imagenEl) {
        const basePath = imagenEl.src.split("/").slice(0, -1).join("/");
        imagenEl.src =
          producto.stock === 0
            ? `${basePath}/${id}_agotado.jpg`
            : producto.precio_anterior !== null && producto.precio_anterior !== producto.precio
            ? `${basePath}/${id}_promocion.jpg`
            : `${basePath}/${id}_portada.jpg`;
      }

      // 💰 Precio en dataset
      if (btn && producto.precio) {
        btn.dataset.precio = producto.precio;
      }

      // 🛒 Estado en carrito
      const itemEnCarrito = carrito.find(p => p.id === id);
      const cantidadEnCarrito = itemEnCarrito?.cantidad || 0;

      // 📦 Validación de stock
      if (producto.stock === 0) {
        stockElement.textContent = 'Sin stock';
        stockElement.style.color = 'red';

        // 🎯 Control de visibilidad de elementos visuales
      const precioInfo = thumbnail.querySelector('.precio-info');
      const descuentoInfo = thumbnail.querySelector('.descuento-porcentaje');
      const btnComprar = thumbnail.querySelector('.comprar-ahora');

      const ocultarVisuales = producto.stock === 0 || cantidadEnCarrito >= producto.stock;

      if (precioInfo) precioInfo.style.display = ocultarVisuales ? 'none' : '';
      if (descuentoInfo) descuentoInfo.style.display = ocultarVisuales ? 'none' : '';
    if (btnComprar) btnComprar.style.display = ocultarVisuales ? 'none' : '';






        
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Agotado';
          btn.classList.add('agotado', 'gris');
        }
        thumbnail.classList.add('limite-alcanzado');
      } else if (cantidadEnCarrito >= producto.stock) {
        stockElement.textContent = `Stock disponible: ${producto.stock}`;
        stockElement.style.color = 'orange';
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'Límite alcanzado';
          btn.classList.add('agotado', 'amarillo');
        }
        thumbnail.classList.add('producto-agotado');
      } else {
        stockElement.textContent = `Stock disponible: ${producto.stock}`;
        stockElement.style.color = 'green';
        if (btn) {
          btn.disabled = false;
          btn.textContent = '🛒 Agregar al carrito';
          btn.classList.remove('agotado', 'limite-alcanzado', 'limite');
        }
        thumbnail.classList.remove('producto-agotado');
      }
      

     //display off
     
      

      // 💸 Precio visual
      let precioElement = thumbnail.querySelector('.precio-info');
      if (!precioElement) {
        precioElement = document.createElement('p');
        precioElement.className = 'precio-info';
        thumbnail.insertBefore(precioElement, stockElement.nextSibling);
      }

      precioElement.innerHTML =
        producto.precio_anterior && producto.precio_anterior !== producto.precio
          ? `<span class="precio-anterior">$${producto.precio_anterior}</span> <span class="precio-actual">$${producto.precio}</span>`
          : `<span class="precio-actual">$${producto.precio}</span>`;


      let descuentoElement = thumbnail.querySelector('.descuento-porcentaje');
if (!descuentoElement) {
  descuentoElement = document.createElement('p');
  descuentoElement.className = 'descuento-porcentaje';
  thumbnail.insertBefore(descuentoElement, precioElement.nextSibling);
}

const porcentaje = this.getDescuentoPorcentaje(id);
if (porcentaje > 0) {
  descuentoElement.textContent = `🔥 ${porcentaje}% DE DESCUENTO`;
  descuentoElement.className = 'descuento-porcentaje';
} else {
  descuentoElement.textContent = '';
}





        // 🧮 Contador visual modular
      thumbnailContadorCarrito(thumbnail, precioElement, cantidadEnCarrito);

     //comprar ahora//
     const btnComprar = thumbnail.querySelector('.comprar-ahora');

if (producto.stock === 0) {
  if (btnComprar) {
    btnComprar.disabled = true;
    btnComprar.textContent = 'Agotado';
    btnComprar.classList.add('a', 'grey');
  }
} else if (cantidadEnCarrito >= producto.stock) {
  if (btnComprar) {
    btnComprar.disabled = true;
    btnComprar.textContent = 'Límite alcanzado';
    btnComprar.classList.add('agotado', 'amarillo');
  }
} else {
  if (btnComprar) {
    btnComprar.disabled = false;
    btnComprar.textContent = '★ Comprar Ahora ★';
    btnComprar.classList.remove('agotado', 'gris', 'amarillo');
  }
}

     



      
    });
    
    


  }
}
