import os
from flask import Flask, render_template, request, redirect, url_for, flash
import pyodbc

app = Flask(__name__)
app.secret_key = "clave_segura_arb"

# Leemos solo las variables que ya tienes configuradas
DB_SERVER = os.getenv("DB_SERVER")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
PORT = int(os.getenv("PORT", 3000))

# Función para conectar a la base de datos
def get_db():
    conn_str = (
        "DRIVER={ODBC Driver 18 for SQL Server};"
        f"SERVER={DB_SERVER};"
        f"DATABASE={DB_NAME};"
        f"UID={DB_USER};"
        f"PWD={DB_PASSWORD};"
        "Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"
    )
    return pyodbc.connect(conn_str)

# Ruta de inicio de sesión: AHORA SÍ BUSCA EN LA TABLA
@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        usuario = request.form.get("usuario", "").strip()
        contraseña = request.form.get("contraseña", "").strip()

        try:
            conn = get_db()
            cursor = conn.cursor()

            # 👇 AQUÍ ES DONDE CONSULTA TU TABLA DE USUARIOS
            # Cambia "usuarios" por el nombre REAL de tu tabla si es diferente
            cursor.execute("SELECT * FROM usuarios WHERE usuario = ? AND contraseña = ?", usuario, contraseña)
            registro = cursor.fetchone()

            if registro:
                # Si encuentra el registro, entra
                return redirect(url_for("dashboard"))
            else:
                # Si no lo encuentra, sale el error
                flash("Usuario o clave incorrectos")

            conn.close()

        except Exception as e:
            flash(f"Error en la conexión: {str(e)}")

    return render_template("login.html")

@app.route("/dashboard")
def dashboard():
    return "✅ Acceso correcto. Sistema conectado a tu base de datos."

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
