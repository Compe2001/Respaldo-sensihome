document.addEventListener("DOMContentLoaded", () => {
  const botonesCompra = document.querySelectorAll(".comprar");

  botonesCompra.forEach(boton => {
    boton.addEventListener("click", () => {
      const producto = boton.closest(".thumbnail3").querySelector("h2")?.textContent.trim();
      const mensaje = `Hola Sensi Home, Me interesa comprar *${producto}*`;
      const numeroWhatsApp = "523331408373"; // ← Cambia esto por tu número en formato internacional
      const url = `https://wa.me/${3331408373}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, "_blank");
    });
  });
});
