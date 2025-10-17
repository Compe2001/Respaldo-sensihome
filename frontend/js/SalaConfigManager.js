class SalaConfigManager {
  constructor(thumbnail, producto) {
    this.thumbnail = thumbnail;
    this.producto = producto;
    this.selected = {};
    this.total = 0;
  }

 render() {
  const container = document.createElement('div');
  container.className = 'configurador';

  const select = document.createElement('select');
  select.className = 'config-select';

  Object.entries(this.producto.configuraciones).forEach(([key, config]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = `${key} - $${config.precio}`;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    const config = this.producto.configuraciones[select.value];
    this.selectedConfig = config;
    totalEl.textContent = `Total: $${config.precio}`;
  });

  const totalEl = document.createElement('p');
  totalEl.className = 'precio-configurado';
  totalEl.textContent = 'Total: $0';

  const btn = this.thumbnail.querySelector('.agregar-carrito');
  btn.addEventListener('click', () => {
    if (!this.selectedConfig) return;
    const payload = {
      id: this.producto.id,
      nombre: this.producto.nombre,
      piezas: this.selectedConfig.piezas,
      precio: this.selectedConfig.precio
    };
    window.carritoManager.agregarProducto(payload);
  });

  container.appendChild(select);
  container.appendChild(totalEl);
  this.thumbnail.appendChild(container);
}


  calcularTotal() {
    const piezasSeleccionadas = Object.keys(this.selected).filter(p => this.selected[p]);

    if (piezasSeleccionadas.length === Object.keys(this.producto.piezas).length) {
      this.total = this.producto.precio_fullconfigdesc;
    } else {
      this.total = piezasSeleccionadas.reduce((sum, pieza) => {
        return sum + this.producto.piezas[pieza].precio;
      }, 0);
    }

    this.totalEl.textContent = `Total: $${this.total}`;
  }
}
