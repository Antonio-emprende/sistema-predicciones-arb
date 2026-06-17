// Librerías necesarias
const express = require('express');
const sql = require('mssql');
const path = require('path');
const app = express();

// ⚙️ Configuración segura para Azure SQL
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate: false,
    connectTimeout: 15000
  },
  port: 1433
};

// 📦 Procesar datos del formulario
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 📂 Rutas de páginas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/principal.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'principal.html'));
});

// 🔌 Conectar a la base
async function conectarBase() {
  try {
    await sql.connect(config);
    console.log('✅ Conectado correctamente a Azure SQL');
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    setTimeout(conectarBase, 10000);
  }
}
conectarBase();

// 🔐 Verificar usuario y contraseña (CORREGIDO)
app.post('/verificar', async (req, res) => {
  const { usuario, clave } = req.body;

  if (!usuario || !clave) {
    return res.json({ ok: false, mensaje: 'Complete ambos campos' });
  }

  try {
    const pool = await sql.connect(config);
    const resultado = await pool.request()
      .input('usuario', sql.VarChar(100), usuario)
      .input('clave', sql.VarChar(100), clave)
      .query(`
        SELECT * 
        FROM Usuarios 
        WHERE usuario = @usuario 
          AND clave = @clave
      `);

    console.log('🔍 Filas encontradas:', resultado.recordset.length);

    if (resultado.recordset.length > 0) {
      res.json({ ok: true, mensaje: 'Acceso correcto' });
    } else {
      res.json({ ok: false, mensaje: 'Usuario o clave incorrectos' });
    }

  } catch (err) {
    console.error('❌ Error en consulta:', err.message);
    res.json({ ok: false, mensaje: 'Error al consultar la base' });
  }
});

// 🚀 Levantar servidor
const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
  console.log(`🚀 Servidor activo en puerto ${PUERTO}`);
});
