const express = require('express');
const sql = require('mssql');
const app = express();

// Leer configuración desde variables de entorno
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate: false
  },
  port: 1433
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cargar página principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Prueba de conexión
async function conectarBase() {
  try {
    await sql.connect(config);
    console.log('✅ Conectado correctamente a Azure SQL');
  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
  }
}
conectarBase();

// Ruta para verificar login
app.post('/verificar', async (req, res) => {
  const { usuario, clave } = req.body;
  try {
    const pool = await sql.connect(config);
    const resultado = await pool.request()
      .input('usuario', sql.VarChar, usuario)
      .input('clave', sql.VarChar, clave)
      .query('SELECT * FROM Usuarios WHERE usuario = @usuario AND clave = @clave');
    
    if (resultado.recordset.length > 0) {
      res.json({ ok: true, mensaje: 'Acceso correcto' });
    } else {
      res.json({ ok: false, mensaje: 'Usuario o contraseña incorrectos' });
    }
  } catch (err) {
    console.error(err);
    res.json({ ok: false, mensaje: 'Error en la conexión' });
  }
});

// Levantar servidor
const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PUERTO}`);
});
