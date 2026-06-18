const express = require('express');
const cors = require('cors');
const app = express();
const puerto = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 🔌 CONEXIÓN DIRECTA A TU BASE AZURE SQL
const { Connection, Request } = require('tedious'); // Mejor para Azure SQL

const config = {
  server: 'TU_SERVIDOR_AZURE.database.windows.net', // Ej: midbazar.database.windows.net
  authentication: {
    type: 'default',
    options: {
      userName: 'TU_USUARIO_AZURE',
      password: 'TU_CONTRASEÑA_AZURE'
    }
  },
  options: {
    database: 'TU_NOMBRE_BASE_EN_AZURE',
    encrypt: true, // Obligatorio en Azure
    trustServerCertificate: false,
    connectTimeout: 30000
  }
};

// Función auxiliar para consultas
function ejecutarConsulta(sql, parametros = []) {
  return new Promise((resolve, reject) => {
    const conexion = new Connection(config);
    conexion.on('connect', err => {
      if (err) return reject(err);
      const solicitud = new Request(sql, (err) => {
        if (err) return reject(err);
      });
      parametros.forEach(p => solicitud.addParameter(p.nombre, p.tipo, p.valor));
      const filas = [];
      solicitud.on('row', fila => filas.push(fila));
      solicitud.on('done', () => resolve(filas));
      conexion.execSql(solicitud);
    });
    conexion.connect();
  });
}

// 📡 API: Leer datos de TU tabla existente en Azure
app.get('/api/consultar-numeros', async (req, res) => {
  try {
    // ⚠️ AQUÍ pones el NOMBRE REAL DE TU TABLA y columnas que ya usas
    const sql = `
      SELECT TOP 150 Numero, Pais, Fecha, Hora 
      FROM TuTablaExistente 
      ORDER BY Fecha DESC, Hora DESC
    `;
    const resultado = await ejecutarConsulta(sql);
    res.json(resultado);
  } catch (error) {
    console.error('Error al consultar Azure:', error);
    res.status(500).json({ error: 'No se pudo conectar a la base' });
  }
});

// 💾 API: Guardar predicción en TU tabla o la que definas
app.post('/api/grabar-prediccion', async (req, res) => {
  try {
    const { fecha, idPais, idHora, tira, juego } = req.body;
    // ⚠️ AQUÍ usas tu tabla existente o la que ya tengas para guardar
    const sql = `
      INSERT INTO TuTablaPrediccionesExistente (Fecha, IdPais, IdHora, Tira, Juego)
      VALUES (@fecha, @pais, @hora, @tira, @juego)
    `;
    const parametros = [
      { nombre: 'fecha', tipo: 'DateTime', valor: fecha },
      { nombre: 'pais', tipo: 'Int', valor: idPais },
      { nombre: 'hora', tipo: 'Int', valor: idHora },
      { nombre: 'tira', tipo: 'VarChar', valor: tira },
      { nombre: 'juego', tipo: 'VarChar', valor: juego }
    ];
    await ejecutarConsulta(sql, parametros);
    res.json({ ok: true, mensaje: 'Guardado en Azure correctamente' });
  } catch (error) {
    console.error('Error al guardar en Azure:', error);
    res.status(500).json({ ok: false, mensaje: 'Error en base de datos' });
  }
});

app.listen(puerto, () => {
  console.log(`Servidor listo en http://localhost:${puerto} → conectado a Azure`);
});
