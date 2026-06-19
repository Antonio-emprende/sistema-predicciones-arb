from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pytds
import os

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

# 🔌 Conexión a Azure SQL con pytds (funciona en Render gratis)
def get_connection():
    server = os.environ.get("AZURE_SQL_SERVER").split(".")[0]  # Solo el nombre inicial
    full_server = os.environ.get("AZURE_SQL_SERVER")
    database = os.environ.get("AZURE_SQL_DB")
    username = os.environ.get("AZURE_SQL_USER")
    password = os.environ.get("AZURE_SQL_PASS")

    return pytds.connect(
        server=full_server,
        port=1433,
        user=username,
        password=password,
        database=database,
        tds_version="7.4",
        login_timeout=30
    )

# 📄 Rutas de navegación
@app.route("/")
def ir_a_login():
    return send_from_directory(".", "index.html")

@app.route("/principal")
def ir_a_principal():
    return send_from_directory(".", "principal.html")

@app.route("/cruz-de-la-suerte")
def ir_a_cruz():
    return send_from_directory("public", "cruz-de-la-suerte.html")

# 🔐 Verificar inicio de sesión
@app.route("/api/login", methods=["POST"])
def login():
    try:
        datos = request.get_json()
        usuario = datos.get("usuario")
        clave = datos.get("clave")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT Id FROM Usuarios WHERE Usuario = %s AND Clave = %s", (usuario, clave))
        valido = cursor.fetchone() is not None
        conn.close()

        return jsonify({"ok": valido})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

# 📊 Consultar números históricos
@app.route("/api/consultar-numeros", methods=["GET"])
def consultar():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT TOP 150 Numero, Pais, Fecha, Hora 
            FROM Numeros 
            ORDER BY Fecha DESC, Hora DESC
        """)
        columnas = [desc[0] for desc in cursor.description]
        filas = [dict(zip(columnas, fila)) for fila in cursor.fetchall()]
        conn.close()
        return jsonify(filas)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 💾 Guardar predicción
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
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
