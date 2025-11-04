// =============================================
// 🛒 MÓDULO PRINCIPAL DEL CARRITO DE COMPRAS
// =============================================
const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3000'
      : `https://api.${window.location.hostname}`;
/**
 * GESTOR PRINCIPAL DEL CARRITO
 * Inicializa y coordina todas las funcionalidades del carrito
 */
class CarritoManager {
  constructor() {
    this.stockData = [];
    this.init();
  }

  /**
   * Inicializa el carrito cuando el DOM está listo
   */
  init() {
    document.addEventListener("DOMContentLoaded", () => {
      this.cargarStock()
        .then(() => {
          this.iniciarCarrito();
        })
        .catch(error => {
          console.warn("⚠️ Ejecutando carrito sin datos de stock:", error);
          this.iniciarCarrito();
        });
    });
  }

  
  /**
   * Carga los datos de stock desde la API
   * @returns {Promise} Promesa con los datos del stock
   */
  cargarStock() {
    return fetch(`${host}/api/stock`)
      .then(res => {
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        return res.json();
      })
      .then(data => {
        this.stockData = data;
        return data;
      })
      .catch(err => {
        console.error("❌ Error al cargar stock:", err);
        throw err;
      });
  }

  // =============================================
  // 🧩 FUNCIONES DE GESTIÓN DE DATOS DEL CARRITO
  // =============================================

  /**
   * Obtiene el carrito desde localStorage
   * @returns {Array} Array con los items del carrito
   */
  obtenerCarrito() {
    try {
      return JSON.parse(localStorage.getItem("carrito")) || [];
    } catch (error) {
      console.error("❌ Error al obtener carrito:", error);
      return [];
    }
  }

  

  /**
   * Guarda el carrito en localStorage
   * @param {Array} carrito - Array con los items del carrito
   */
  guardarCarrito(carrito) {
    try {
      localStorage.setItem("carrito", JSON.stringify(carrito));
    } catch (error) {
      console.error("❌ Error al guardar carrito:", error);
    }
  }

  /**
   * Reconstruye el carrito con precios actualizados desde stockManager
   * @param {Array} carrito - Carrito original
   * @returns {Array} Carrito con precios actualizados
   */
  reconstruirCarritoConPrecios(carrito) {
    if (!window.thumbnailStockManager || !Array.isArray(carrito)) {
      return carrito;
    }
    
    return carrito.map(item => {
      const precioReal = window.thumbnailStockManager.getPrecioPorId(item.id);
      return {
        ...item,
        precio: precioReal
      };
    });
  }

  // =============================================
  // 🖼️ FUNCIONES DE RENDERIZADO
  // =============================================

  /**
   * Actualiza el contador de productos en el carrito
   */
  actualizarContadorCarrito() {
    const carrito = this.obtenerCarrito();
    const totalCantidad = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const contadorHeader = document.querySelector(".carrito-count");
    const thumbnailStockManager = window.thumbnailStockManager;
    if (thumbnailStockManager) {
      thumbnailStockManager.actualizarThumbnails(); // Actualiza thumbnails al cambiar carrito
    }
    if (contadorHeader) {
      contadorHeader.textContent = totalCantidad;
    }
  }
  

  /**
   * Renderiza la lista de productos en el carrito
   */
  renderCarrito() {
    const carritoOriginal = this.obtenerCarrito();
    const carrito = this.reconstruirCarritoConPrecios(carritoOriginal);
    const lista = document.getElementById("carrito_lista");
    const totalSpan = document.getElementById("carrito-total");
    
    if (!lista || !totalSpan) return;

    lista.innerHTML = "";
    let sumaTotal = 0;

    carrito.forEach(item => {
      const li = document.createElement("li");
      li.classList.add("carrito-item");
      li.innerHTML = `
        <div class="carrito-info">
          <img src="${item.imagen}" alt="${item.nombre}" class="carrito-img">
          <p><strong>${item.nombre}</strong></p>
          <p>Cantidad: ${item.cantidad}</p>
          <p>Total: $${(item.precio * item.cantidad).toFixed(2)} MXN</p>
          <p>Costo unitario: $${item.precio.toFixed(2)} MXN</p>
        </div>
        <div class="carrito-controles">
          <button class="btn-sumar" data-id="${item.id}">+</button>
          <button class="btn-restar" data-id="${item.id}">–</button>
          <button class="btn-eliminar" data-id="${item.id}">❌</button>
        </div>
      `;
      lista.appendChild(li);
      sumaTotal += item.precio * item.cantidad;
    });

    totalSpan.textContent = `$${sumaTotal.toFixed(2)} MXN`;
  }

  // =============================================
  // 🎯 FUNCIONES DE MANEJO DE EVENTOS
  // =============================================

  /**
   * Maneja el evento de agregar producto al carrito
   * @param {Event} event - Evento de click
   */
  manejarAgregarProducto(event) {
    const boton = event.currentTarget;
    const productoEl = boton.closest(".thumbnail3") || boton.closest(".thumbnail2");
    
    if (!productoEl) return;

    const id = productoEl.dataset.id;
    const nombre = productoEl.dataset.nombre || 'Producto';
    const precioNum = window.thumbnailStockManager?.getPrecioPorId(id) || 0;

    let imagenSrc = "/frontend/images/default.png";
    if (productoEl.classList.contains("thumbnail3")) {
      const imagenActiva = productoEl.querySelector("img.carrusel-producto-item.active");
      if (imagenActiva?.src) imagenSrc = imagenActiva.src;
    } else {
      const imagen = productoEl.querySelector("img");
      if (imagen?.src) imagenSrc = imagen.src;
    }
   

    let carrito = this.obtenerCarrito();
    const existe = carrito.find(item => item.id === id);

    if (existe) {
      existe.cantidad += 1;
      existe.imagen = imagenSrc;
    } else {
      carrito.push({ 
        id, 
        nombre, 
        precio: precioNum, 
        imagen: imagenSrc, 
        cantidad: 1 
      });
    }

    this.guardarCarrito(carrito);
    this.actualizarContadorCarrito();
    this.mostrarNotificacion(`Agregado al carrito: ${nombre}`, "success");
    thumbnailStockManager?.actualizarThumbnails(); // Actualiza thumbnails al cambiar carrito
  }
  

  /**
   * Maneja los eventos en la lista del carrito (sumar, restar, eliminar)
   * @param {Event} event - Evento de click
   */
  manejarEventosCarrito(event) {
    const id = event.target.dataset.id;
    if (!id) return;

    let carrito = this.obtenerCarrito();
    const index = carrito.findIndex(item => item.id === id);
    if (index === -1) return;

    const producto = this.stockData.find(p => p.id === id);
    const stockMaximo = producto?.stock || 0;

    if (event.target.classList.contains("btn-sumar")) {
      if (carrito[index].cantidad < stockMaximo) {
        carrito[index].cantidad += 1;
      } else {
        this.limiteStockAlcanzado(`🚫 Solo hay ${stockMaximo} unidades disponibles de "${producto.nombre}"`);
      }
    }

    if (event.target.classList.contains("btn-restar")) {
      carrito[index].cantidad -= 1;
      if (carrito[index].cantidad <= 0) carrito.splice(index, 1);
    }

    if (event.target.classList.contains("btn-eliminar")) {
      carrito.splice(index, 1);
    }

    this.guardarCarrito(carrito);
    this.renderCarrito();
    this.actualizarContadorCarrito();
  }

  /**
   * Maneja el evento de vaciar el carrito
   */
  manejarVaciarCarrito() {
    if (confirm("¿Vaciar el carrito? Esta acción no se puede deshacer.")) {
      localStorage.removeItem("carrito");
      this.renderCarrito();
      this.actualizarContadorCarrito();
      this.mostrarNotificacion("Carrito vaciado correctamente", "success");
    }
  }

  // =============================================
  // 🔔 FUNCIONES DE NOTIFICACIÓN
  // =============================================

  /**
   * Muestra una notificación al usuario
   * @param {string} mensaje - Mensaje a mostrar
   * @param {string} tipo - Tipo de notificación (success, error, warning)
   */
  mostrarNotificacion(mensaje, tipo = "info") {
    // Aquí puedes implementar tu sistema de notificaciones preferido
    // Por ahora usamos alert para mantener la funcionalidad original
    alert(mensaje);
  }

  /**
   * Maneja la notificación de límite de stock alcanzado
   * @param {string} mensaje - Mensaje de advertencia
   */
  limiteStockAlcanzado(mensaje) {
    this.mostrarNotificacion(mensaje, "warning");
  }

  // =============================================
  // 🚀 FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
  // =============================================

  /**
   * Inicializa todas las funcionalidades del carrito
   */
  iniciarCarrito() {
    // Renderizar carrito inicial
    this.renderCarrito();
    this.actualizarContadorCarrito();

    // Configurar eventos para botones "Agregar al carrito"
  const botones = document.querySelectorAll(".agregar-carrito");
botones.forEach(boton => {
  boton.addEventListener("click", event => {
    // ❌ Cancela compra directa si está activa
    if (window.carritoSingleItemManager?.cancelarCompra) {
      window.carritoSingleItemManager.cancelarCompra();
    }

    // ✅ Ejecuta la lógica normal de agregar al carrito
    this.manejarAgregarProducto(event);
  });
});


    // Configurar eventos para la lista del carrito
    const lista = document.getElementById("carrito_lista");
    if (lista) {
      lista.addEventListener("click", this.manejarEventosCarrito.bind(this));
    }

    // Configurar evento para vaciar carrito
    const btnVaciar = document.getElementById("vaciarCarrito");
    if (btnVaciar) {
      btnVaciar.addEventListener("click", this.manejarVaciarCarrito.bind(this));
    }
  }
  




  
}

async function sincronizarCarritoConStock() {
  try {
    const res = await fetch(`${host}/api/stock`);
    const stockActual = await res.json();

    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    const carritoFiltrado = carrito.filter(item => {
      const productoStock = stockActual.find(p => p.id === item.id);
      return productoStock && productoStock.stock > 0;
    });

    if (carritoFiltrado.length < carrito.length) {
      localStorage.setItem("carrito", JSON.stringify(carritoFiltrado));
      alert("⚠️ Algunos productos fueron eliminados del carrito por falta de stock.");
    }
  } catch (error) {
    console.error("❌ Error al sincronizar carrito con stock:", error);
  }
}


// =============================================
// ▶️ INICIALIZACIÓN DEL CARRITO
// =============================================

// Crear instancia global del gestor del carrito
window.carritoManager = new CarritoManager();
window.addEventListener("DOMContentLoaded", sincronizarCarritoConStock);

