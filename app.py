from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pyodbc
import os

app = Flask(__name__, static_folder="public", static_url_path="")
CORS(app)

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

@app.route("/api/consultar-numeros", methods=["GET"])
def consultar():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT TOP 150 Numero, Pais, Fecha, Hora FROM TU_TABLA ORDER BY Fecha DESC, Hora DESC")
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
        cursor.execute("""
            INSERT INTO Predicciones (Fecha, IdPais, IdHora, TiraRankeada, Juego)
            VALUES (?, ?, ?, ?, ?)
        """, d["fecha"], d["idPais"], d["idHora"], d["tira"], d["juego"])
        conn.commit()
        conn.close()
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@app.route("/")
def inicio():
    return send_from_directory("public", "cruz-de-la-suerte.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
