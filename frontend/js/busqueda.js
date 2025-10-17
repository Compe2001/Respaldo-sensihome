document.addEventListener('DOMContentLoaded', function () {
  fetch('/frontend/data/search.json')
    .then(res => res.json())
    .then(productos => {
      const formulario = document.getElementById('searchForm');

      formulario.addEventListener('submit', function(e) {
        e.preventDefault();
        const query = formulario.querySelector('input[name="q"]').value.toLowerCase().trim();

        const resultado = productos.find(p =>
          p.nombre.toLowerCase().includes(query)
        );

        if (resultado) {
          window.location.href = resultado.url;
        } else {
          alert(`No se encontró ningún producto que coincida con "${query}".`);
        }
      });
    })
    .catch(err => console.error('Error al cargar productos.json', err));
});