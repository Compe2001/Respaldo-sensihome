// authorize.js
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// 🔐 Alcance mínimo necesario para leer hojas
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// 📁 Ruta donde se guardará el token
const TOKEN_PATH = 'config/token.json';

// 📥 Cargar credenciales desde config/credentials.json
fs.readFile('config/credentials.json', (err, content) => {
  if (err) return console.error('❌ Error al cargar credentials.json:', err);
  authorize(JSON.parse(content));
});

function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  // 🔧 Crear cliente OAuth2
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // 🔗 Generar URL para autorizar acceso
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\n🔗 Autoriza esta app visitando esta URL:\n', authUrl);

  // 🧾 Leer el código de autorización desde consola
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('\n📥 Pega aquí el código de autorización: ', (code) => {
    rl.close();

    // 🔄 Intercambiar el código por un token
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('❌ Error al obtener el token:', err);
      oAuth2Client.setCredentials(token);

      // 💾 Guardar token en config/token.json
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error('❌ Error al guardar token.json:', err);
        console.log('\n✅ Token guardado en', TOKEN_PATH);
      });
    });
  });
}
