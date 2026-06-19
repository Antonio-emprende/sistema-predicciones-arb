from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pytds
import os

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

# 🔌 Conexión
def get_connection():
    server = os.environ.get("DB_SERVER")
    database = os.environ.get("DB_NAME")
    username = os.environ.get("DB_USER")
    password = os.environ.get("DB_PASSWORD")

    return pytds.connect(
        server=server,
        port=1433,
        user=username,
        password=password,
        database=database,
        tds_version="7.4",
        timeout=30
    )

# 📄 Rutas
@app.route("/")
def ir_a_login():
    return send_from_directory(".", "index.html")

@app.route("/principal")
def ir_a_principal():
    return send_from_directory(".", "principal.html")

@app.route("/cruz-de-la-suerte")
def ir_a_cruz():
    return send_from_directory("public", "cruz-de-la-suerte.html")

# 🔐 Login adaptado a tipos de datos
@app.route("/api/login", methods=["POST"])
def login():
    try:
        datos = request.get_json()
        usuario = datos.get("usuario", "").strip()
        # Convertimos la contraseña a número para coincidir con la base
        try:
            clave = int(datos.get("clave", "").strip())
        except ValueError:
            return jsonify({"ok": False, "error": "La contraseña debe ser numérica"})

        conn = get_connection()
        cursor = conn.cursor()

        # Nombres exactos: tabla "usuarios", columnas "usuario" y "clave"
        cursor.execute("SELECT 1 FROM usuarios WHERE usuario = %s AND clave = %s", (usuario, clave))
        existe = cursor.fetchone()
        conn.close()

        return jsonify({"ok": existe is not None})

    except Exception as e:
        print("❌ Error en login:", str(e))
        return jsonify({"ok": False, "error": str(e)}), 500

# 📊 Consultar números
@app.route("/api/consultar-numeros", methods=["GET"])
def consultar():
    try:
        conn = get_connection()
        cursor = conn.cursor(as_dict=True)
        cursor.execute("SELECT TOP 150 Numero, Pais, Fecha, Hora FROM Numeros ORDER BY Fecha DESC, Hora DESC")
        filas = cursor.fetchall()
        conn.close()
        return jsonify(filas)
    except Exception as e:
        print("❌ Error consulta:", str(e))
        return jsonify({"error": str(e)}), 500

# 💾 Guardar predicción
@app.route("/api/grabar-prediccion", methods=["POST"])
def grabar():
    try:
        datos = request.get_json()
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Predicciones (Fecha, IdPais, IdHora, TiraRankeada, JuegoSeleccionado)
            VALUES (%s, %s, %s, %s, %s)
        """, (datos["fecha"], datos["idPais"], datos["idHora"], datos["tira"], datos["juego"]))
        conn.commit()
        conn.close()
        return jsonify({"ok": True})
    except Exception as e:
        print("❌ Error guardar:", str(e))
        return jsonify({"ok": False, "error": str(e)})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
