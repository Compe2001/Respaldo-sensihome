document.addEventListener("DOMContentLoaded", () => {
  const thumbnail = document.querySelector(".thumbnail5");
  if (!thumbnail) return;

  const API_URL = window.location.hostname.includes("localhost")
    ? "http://localhost:3000"
    : `https://api.${window.location.hostname}`;

  const checkboxes = thumbnail.querySelectorAll("input[type='checkbox']");
  const totalDisplay = thumbnail.querySelector(".precio-total");
  const addButton = thumbnail.querySelector(".agregar-configuracion");

  let stockData = [];

  // 🔄 Cargar stock desde el backend
  fetch(`${API_URL}/api/stock`)
    .then(res => res.json())
    .then(data => {
      stockData = data;
      inicializarModulos();
    })
    .catch(err => {
      console.error("❌ Error al cargar stock para thumbnail5:", err);
    });

  // 🧱 Inicializa visualmente cada módulo
  function inicializarModulos() {
    checkboxes.forEach(cb => {
      const id = cb.dataset.id;
      const label = cb.parentElement;
      const producto = stockData.find(p => p.id === id);

      if (!producto) {
        label.textContent += " (No encontrado)";
        cb.disabled = true;
        return;
      }

      // 💰 Mostrar precio
      const precioSpan = document.createElement("span");
      precioSpan.className = "precio-modulo";
      precioSpan.textContent = ` $${producto.precio}`;
      label.appendChild(precioSpan);

      if (!c.dataset.precio) {
  console.warn(`⚠️ Módulo sin precio: ${c.dataset.id}`);
}


      // 🔥 Mostrar descuento si aplica
      if (producto.precio_anterior && producto.precio_anterior > producto.precio) {
        const porcentaje = Math.round(100 - (producto.precio * 100) / producto.precio_anterior);
        const descuentoSpan = document.createElement("span");
        descuentoSpan.className = "descuento-modulo";
        descuentoSpan.textContent = ` 🔥 ${porcentaje}% OFF`;
        label.appendChild(descuentoSpan);
      }

      // 🚫 Deshabilitar si no está activo
      if (!producto.activo) {
        cb.disabled = true;
        label.classList.add("modulo-no-disponible");
        label.textContent += " (No disponible)";
      }

      // 💾 Guardar precio en el checkbox para cálculo posterior
      cb.dataset.precio = producto.precio;
    });
  }

  // 🧮 Escuchar cambios y recalcular total
  checkboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      const seleccionados = Array.from(checkboxes).filter(c => c.checked);
      const total = seleccionados.reduce((sum, c) => sum + Number(c.dataset.precio), 0);

      totalDisplay.textContent = `Total: $${total.toLocaleString()} MXN`;
      addButton.disabled = seleccionados.length === 0;
    });
  });

  // 🛒 Agregar configuración al carrito
  addButton.addEventListener("click", () => {
    const seleccionados = Array.from(checkboxes).filter(c => c.checked);
    const modulos = seleccionados.map(c => {
      const producto = stockData.find(p => p.id === c.dataset.id);
      return {
        id: c.dataset.id,
        nombre: producto?.nombre || c.parentElement.textContent.trim(),
        precio: Number(c.dataset.precio)
      };
    });

    const total = modulos.reduce((sum, m) => sum + m.precio, 0);

    const item = {
      tipo: "sala_modular",
      nombre: thumbnail.dataset.nombre || "SALA MODULAR",
      modulos,
      total,
      cantidad: 1
    };

    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    carrito.push(item);
    localStorage.setItem("carrito", JSON.stringify(carrito));

    alert("Configuración agregada al carrito 🛋️");
  });
});
