const express = require('express');
const router = express.Router();
const envios = require('../config/envios.json');

// 📦 GET: devuelve todas las zonas y costos
router.get('/', (req, res) => {
  res.json(envios);
});

// 📮 POST: recibe municipio y devuelve costo
router.post('/', (req, res) => {
  const { municipio } = req.body;

  if (!municipio || typeof municipio !== 'string') {
    return res.status(400).json({ error: 'Municipio no proporcionado o inválido' });
  }

  const clave = municipio.trim();
  const costo = envios[clave];

  if (typeof costo === 'number') {
    return res.json({ municipio: clave, costo });
  } else {
    return res.status(404).json({ error: 'Municipio no reconocido', municipio: clave });
  }
});

module.exports = router;
