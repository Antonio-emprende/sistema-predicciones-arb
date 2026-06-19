from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pyodbc
import os

app = Flask(__name__, static_folder=".", static_url_path="") # Sirve todos los archivos
CORS(app)

# Conexión a Azure SQL
def get_connection():
    server = os.environ.get("AZURE_SQL_SERVER")
    database = os.environ.get("AZURE_SQL_DB")
    username = os.environ.get("AZURE_SQL_USER")
    password = os.environ.get("AZURE_SQL_PASS")
    conn_str = (
        "DRIVER={ODBC Driver 18 for SQL Server};"
        f"SERVER={server};"
        f"DATABASE={database};"
        f"UID={username};"
        f"PWD={password};"
        "Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"
    )
    return pyodbc.connect(conn_str)

# 🔐 RUTA: Login
@app.route("/api/login", methods=["POST"])
def login():
    try:
        datos = request.get_json()
        usuario = datos.get("usuario")
        clave = datos.get("clave")

        conn = get_connection()
        cursor = conn.cursor()
        # ⚠️ Pon aquí tu tabla de usuarios real
        cursor.execute("SELECT Id FROM Usuarios WHERE Usuario = ? AND Clave = ?", usuario, clave)
        usuario_valido = cursor.fetchone()
        conn.close()

        if usuario_valido:
            return jsonify({"ok": True, "mensaje": "Acceso correcto"})
        else:
            return jsonify({"ok": False, "mensaje": "Usuario o contraseña incorrectos"})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

# 📄 RUTAS PARA LAS PANTALLAS
@app.route("/")
def ir_a_login():
    return send_from_directory(".", "index.html") # Entra directo al login

@app.route("/principal")
def ir_a_principal():
    return send_from_directory(".", "principal.html") # Pantalla principal con menús

@app.route("/cruz-de-la-suerte")
def ir_a_cruz():
    return send_from_directory("public", "cruz-de-la-suerte.html") # Desde aquí se abre

# 📊 RUTAS DE DATOS
@app.route("/api/consultar-numeros", methods=["GET"])
def consultar():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        # ⚠️ Tu tabla de números real
        cursor.execute("SELECT TOP 150 Numero, Pais, Fecha, Hora FROM Numeros ORDER BY Fecha DESC, Hora DESC")
        columnas = [c[0] for c in cursor.description]
        datos = [dict(zip(columnas, fila)) for fila in cursor.fetchall()]
        conn.close()
        return jsonify(datos)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/grabar-prediccion", methods=["POST"])
def grabar():
    try:
        d = request.get_json()
        conn = get_connection()
        cursor = conn.cursor()
        # ⚠️ Tu tabla de predicciones real
        cursor.execute("""
            INSERT INTO Predicciones (Fecha, IdPais, IdHora, TiraRankeada, Juego)
            VALUES (?, ?, ?, ?, ?)
        """, d["fecha"], d["idPais"], d["idHora"], d["tira"], d["juego"])
        conn.commit()
        conn.close()
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
