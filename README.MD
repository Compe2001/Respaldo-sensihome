Sensi Home es una plataforma web enfocada en la experiencia del usuario para la gestión de productos y pedidos. Combina diseño visual estratégico con desarrollo modular y seguro, orientado a administradores y clientes no técnicos.

 //Tecnologías utilizadas//
Frontend: HTML5, CSS3 modular, JavaScript vanilla
Backend: Node.js EXPRESS
APIs: Mercado Pago, SheetDB, Google Sheets
Herramientas: Git, Ilustrator, Photoshop

Recursos, jpgs, los psd se encuentran en la carpeta de recursos que está fuera de la caroeta principal de la pagina, se encuentra en la pagina del proyecto.


V2.3
Reporte técnico – Viernes 26 de septiembre
✅ Logros del día
🔧 Backend
Se creó el endpoint público /api/stock-json para servir el archivo stock.json desde Express
Se corrigió el path absoluto para evitar errores ENOENT
Se blindó el servidor con CORS para permitir peticiones desde el frontend
🧠 Frontend
Se eliminó el script thumbnail-imagechange.js y se migró toda la lógica visual a ThumbnailStockManager
Se integró la lógica de cambio de imagen según stock y precio_anterior directamente en actualizarThumbnails()
Se sincronizó el precio visual y el botón de “Agregar al carrito” con el JSON
Se confirmó que el registro de pedido funciona correctamente y no se ve afectado por la lógica visual
⚡ Optimización
Se propuso y estructuró un sistema de caché en el backend para evitar lecturas repetidas del archivo stock.json, con renovación cada 5 minutos

-Implementación de la semana- condicionante de  sumatoria en el menpu carrito, 



## Pasos para deploy

1. Conectarnos por ssh a VPS
2. Instalar nodejs, nginx
3. Clonar repositorio
4. Agregamos el archivo de configuración de nginx a esta ruta: /etc/nginx/conf.d/
5. Agregar certificados ssl a estas rutas:

```nginx
ssl_certificate /etc/letsencrypt/live/api.sensihome.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/api.sensihome.com/privkey.pem;
```

6. Encender el server
