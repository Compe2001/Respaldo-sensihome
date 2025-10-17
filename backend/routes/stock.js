const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

router.get('/', (req, res) => {
  const filePath = path.join(__dirname, '..', 'data', 'stock.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ Error al leer stock.json:', err);
      return res.status(500).json({ error: 'Error interno al leer stock' });
    }

    try {
      const stock = JSON.parse(data);
      console.log('✅ Enviando stock desde archivo local');
      res.json(stock);
    } catch (parseError) {
      console.error('❌ Error al parsear stock.json:', parseError);
      res.status(500).json({ error: 'Error al parsear stock' });
    }
  });
});

module.exports = router;
