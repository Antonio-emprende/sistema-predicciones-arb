import os
from flask import Flask, render_template, request, redirect, url_for, flash
import pyodbc

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET", "clave_segura_arb_2026")

# Variables de entorno
DB_SERVER = os.getenv("DB_SERVER")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
PORT = int(os.getenv("PORT", 3000))

# Conexión a Azure SQL
def get_db():
    conn_str = (
        "DRIVER={ODBC Driver 18 for SQL Server};"
        f"SERVER={DB_SERVER};"
        f"DATABASE={DB_NAME};"
        f"UID={DB_USER};"
        f"PWD={DB_PASSWORD};"
        "Encrypt=yes;"
        "TrustServerCertificate=no;"
        "Connection Timeout=15;"
    )
    return pyodbc.connect(conn_str)

# Ruta de inicio
@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        usuario = request.form.get("usuario", "").strip()
        contraseña = request.form.get("contraseña", "").strip()
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM usuarios WHERE usuario = ? AND contraseña = ?", usuario, contraseña)
            existe = cursor.fetchone()
            conn.close()
            if existe:
                return redirect(url_for("dashboard"))
            else:
                flash("Usuario o contraseña incorrectos")
        except Exception as e:
            print("Error:", e)
            flash("Error de conexión con la base de datos")
    return render_template("login.html")

@app.route("/dashboard")
def dashboard():
    return render_template("principal.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
