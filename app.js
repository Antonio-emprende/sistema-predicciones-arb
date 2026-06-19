const express = require('express');
const sql = require('mssql');
const app = express();

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: 1433,
  options: { encrypt: true, trustServerCertificate: false }
};

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.get('/', (req, res) => res.render('login.html'));

app.post('/', async (req, res) => {
  const { usuario, contraseña } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    const resultado = await pool.request()
      .input('usuario', sql.VarChar, usuario)
      .input('contraseña', sql.VarChar, contraseña)
      .query('SELECT 1 FROM usuarios WHERE usuario = @usuario AND contraseña = @contraseña');
    resultado.recordset.length ? res.redirect('/dashboard') : res.render('login.html', { error: 'Datos incorrectos' });
  } catch (err) {
    res.render('login.html', { error: 'Error de conexión a la base' });
  }
});

app.get('/dashboard', (req, res) => res.render('principal.html'));
app.listen(process.env.PORT || 3000);
