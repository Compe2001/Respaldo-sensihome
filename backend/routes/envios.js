const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Ruta POST o GET para consultar costo
router.post('/', (req, res) => {
  res.status(400).json({ error: 'Municipio no reconocido' });
});

module.exports = router;
