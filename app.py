import os
from flask import Flask, render_template, request, redirect, url_for, flash
import pymssql

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET", "clave_segura_2026")

# Leer variables de entorno
DB_SERVER = os.getenv("DB_SERVER")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
PORT = int(os.getenv("PORT", 3000))

# Conexión a Azure SQL
def get_db():
    return pymssql.connect(
        server=DB_SERVER,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=1433,
        tds_version="7.3",
        encrypt=True,
        timeout=15
    )

# Ruta de inicio de sesión
@app.route("/", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        usuario = request.form.get("usuario", "").strip()
        contraseña = request.form.get("contraseña", "").strip()
        try:
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM usuarios WHERE usuario = %s AND contraseña = %s", (usuario, contraseña))
            existe = cursor.fetchone()
            conn.close()
            if existe:
                return redirect(url_for("dashboard"))
            else:
                flash("Usuario o contraseña incorrectos")
        except Exception as e:
            print("Error de conexión:", e)
            flash("No se pudo conectar a la base de datos")
    return render_template("login.html")

# Ruta del panel principal
@app.route("/dashboard")
def dashboard():
    return render_template("principal.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
