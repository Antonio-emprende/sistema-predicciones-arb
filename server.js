// Cargar variables de entorno (usuario, contraseña, servidor, etc.)
require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const path = require("path");

// Iniciar servidor web
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de conexión a Azure SQL, IGUAL que en tu VB.NET
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true, // Obligatorio para Azure
    trustServerCertificate: false,
    enableArithAbort: true,
  },
};

// Servir tu página principal (index.html)
app.use(express.static(__dirname));

// Probar conexión a la base al arrancar
async function conectarBaseDatos() {
  try {
    await sql.connect(config);
    console.log("✅ CONECTADO CORRECTAMENTE a Azure SQL: BDNumGanadores");
  } catch (error) {
    console.error("❌ NO SE PUDO CONECTAR:", error.message);
  }
}

conectarBaseDatos();

// Levantar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en el puerto ${PORT}`);
});
