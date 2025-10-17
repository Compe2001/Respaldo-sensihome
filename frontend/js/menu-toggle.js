document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.querySelector('.menu-toggle');
  const menuContent = document.querySelector('.menu-content');
  const menuWrapper = document.querySelector('.menu-wrapper');

  // Mostrar/ocultar menú al hacer clic en el botón
  toggleButton.addEventListener('click', () => {
    menuContent.classList.toggle('show');
  });

  // Cerrar menú si el usuario hace clic fuera
  document.addEventListener('click', (event) => {
    if (!menuWrapper.contains(event.target)) {
      menuContent.classList.remove('show');
    }
  });
});