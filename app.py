from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pymssql
import os

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

# Conexión a Azure SQL con pymssql
def get_connection():
    server = os.environ.get("AZURE_SQL_SERVER")
    database = os.environ.get("AZURE_SQL_DB")
    username = os.environ.get("AZURE_SQL_USER")
    password = os.environ.get("AZURE_SQL_PASS")

    return pymssql.connect(
        server=server,
        user=username,
        password=password,
        database=database,
        port=1433,
        tds_version="7.0",
        login_timeout=30
    )

# Ruta de inicio → Login
@app.route("/")
def ir_a_login():
    return send_from_directory(".", "index.html")

# Ruta pantalla principal
@app.route("/principal")
def ir_a_principal():
    return send_from_directory(".", "principal.html")

# Ruta Cruz de la Suerte
@app.route("/cruz-de-la-suerte")
def ir_a_cruz():
    return send_from_directory("public", "cruz-de-la-suerte.html")

# Verificar usuario
@app.route("/api/login", methods=["POST"])
def login():
    try:
        datos = request.get_json()
        usuario = datos.get("usuario")
        clave = datos.get("clave")

        conn = get_connection()
        cursor = conn.cursor(as_dict=True)
        cursor.execute("SELECT Id FROM Usuarios WHERE Usuario = %s AND Clave = %s", (usuario, clave))
        valido = cursor.fetchone()
        conn.close()

        return jsonify({"ok": bool(valido)})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

# Consultar números históricos
@app.route("/api/consultar-numeros", methods=["GET"])
def consultar():
    try:
        conn = get_connection()
        cursor = conn.cursor(as_dict=True)
        cursor.execute("""
            SELECT TOP 150 Numero, Pais, Fecha, Hora 
            FROM Numeros 
            ORDER BY Fecha DESC, Hora DESC
        """)
        filas = cursor.fetchall()
        conn.close()
        return jsonify(filas)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Guardar predicción
@app.route("/api/grabar-prediccion", methods=["POST"])
def grabar():
    try:
        datos = request.get_json()
        fecha = datos.get("fecha")
        id_pais = datos.get("idPais")
        id_hora = datos.get("idHora")
        tira = datos.get("tira")
        juego = datos.get("juego")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Predicciones (Fecha, IdPais, IdHora, TiraRankeada, JuegoSeleccionado)
            VALUES (%s, %s, %s, %s, %s)
        """, (fecha, id_pais, id_hora, tira, juego))
        conn.commit()
        conn.close()
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
