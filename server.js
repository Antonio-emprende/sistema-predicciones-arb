// Cargar librerías necesarias
const express = require('express');
const sql = require('mssql');
const path = require('path'); // 🔧 Agregado para evitar errores de rutas
const app = express();

// ⚙️ Configuración de conexión a Azure SQL
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,                // Obligatorio para Azure
    enableArithAbort: true,       // Evita errores de cálculo
    trustServerCertificate: false, // Mayor seguridad
    connectTimeout: 15000         // ⏱️ Tiempo de espera aumentado
  },
  port: 1433
};

// 📦 Procesar datos enviados desde el formulario
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 📂 Rutas para mostrar las páginas
// Página de inicio de sesión
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ✅ NUEVA RUTA: Página principal después de ingresar
app.get('/principal.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'principal.html'));
});

// 🔌 Función para conectar a la base de datos
async function conectarBase() {
  try {
    await sql.connect(config);
    console.log('✅ CONEXIÓN EXITOSA con Azure SQL');
  } catch (err) {
    console.error('❌ ERROR DE CONEXIÓN:', err.message);
    // Reintento automático si falla
    setTimeout(conectarBase, 10000);
  }
}
conectarBase();

// 🔐 Verificar usuario y contraseña
app.post('/verificar', async (req, res) => {
  const { usuario, clave } = req.body;

  // Validar que no estén vacíos
  if (!usuario || !clave) {
    return res.json({ ok: false, mensaje: 'Ingrese usuario y contraseña' });
  }

  try {
    const pool = await sql.connect(config);
    const resultado = await pool.request()
      .input('usuario', sql.VarChar(50), usuario)
      .input('clave', sql.VarChar(100), clave)
      .query(`SELECT id, usuario FROM Usuarios 
              WHERE usuario = @usuario AND clave = @clave`);

    if (resultado.recordset.length > 0) {
      res.json({ ok: true, mensaje: 'Acceso permitido' });
    } else {
      res.json({ ok: false, mensaje: 'Datos incorrectos' });
    }

  } catch (err) {
    console.error('❌ Error al consultar:', err.message);
    res.json({ ok: false, mensaje: 'No se pudo conectar con la base de datos' });
  }
});

// 🚀 Levantar el servidor
const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
  console.log(`✅ SISTEMA ACTIVO - Escuchando en el puerto ${PUERTO}`);
  console.log(`🌐 Dirección: https://sistema-predicciones-arb.onrender.com`);
});
