document.addEventListener('DOMContentLoaded', () => {
  const wrapperProd = document.querySelector('.carrusel-producto-wrapper');
  const itemsProd = document.querySelectorAll('.carrusel-producto-item');
  const prevProd = document.querySelector('.carrusel-producto-btn.prev');
  const nextProd = document.querySelector('.carrusel-producto-btn.next');
  let indexProd = 0;

  function actualizarCarruselProducto() {
    wrapperProd.style.transform = `translateX(-${indexProd * 100}%)`;
  }

  prevProd.addEventListener('click', () => {
    indexProd = (indexProd - 1 + itemsProd.length) % itemsProd.length;
    actualizarCarruselProducto();
  });

  nextProd.addEventListener('click', () => {
    indexProd = (indexProd + 1) % itemsProd.length;
    actualizarCarruselProducto();
  });
});