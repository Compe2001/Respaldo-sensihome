(async () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

  if (!sessionId) {
    document.getElementById("detalles-pago").innerHTML = "❌ No se recibió el ID de sesión.";
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/api/confirmar-pago?session_id=${sessionId}`);
    const data = await res.json();

    if (data.success) {
      document.getElementById("detalles-pago").innerHTML = `
        <p>💳 Pago confirmado para <strong>${data.cliente.nombre}</strong></p>
        <p>Total pagado: <strong>$${data.monto / 100} MXN</strong></p>
      `;

      // Aquí podrías enviar el pedido al backend con estatus pagado
      await fetch("http://localhost:3000/api/process-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data.cliente,
          carrito: data.carrito,
          status: "pagado"
        })
      });

      localStorage.removeItem("carrito"); // 🧹 limpiar carrito
    } else {
      document.getElementById("detalles-pago").innerHTML = "❌ No se pudo confirmar el pago.";
    }
  } catch (err) {
    console.error("❌ Error al confirmar pago:", err);
    document.getElementById("detalles-pago").innerHTML = "❌ Error al conectar con el servidor.";
  }
})();
