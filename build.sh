#!/usr/bin/env bash
set -e

# Instalar controlador ODBC para conectar con Azure SQL
curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add -
curl https://packages.microsoft.com/config/ubuntu/22.04/prod.list > /etc/apt/sources.list.d/mssql-release.list
apt-get update
ACCEPT_EULA=Y apt-get install -y msodbcsql18 unixodbc-dev

# Instalar las librerías de Python
pip install --upgrade pip
pip install -r requirements.txt
