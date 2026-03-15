#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Script de configuración del VPS para Agenda Allamey
# Ejecutar como root: bash setup-vps.sh
# ─────────────────────────────────────────────────────────────

set -e

APP_DIR="/var/www/agenda-allamey"
NGINX_CONF="/etc/nginx/sites-available/agenda-allamey"

echo "==> [1/7] Actualizando paquetes..."
apt update && apt upgrade -y

echo "==> [2/7] Instalando Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "==> [3/7] Instalando PM2 y Nginx..."
npm install -g pm2
apt install -y nginx

echo "==> [4/7] Preparando directorios..."
mkdir -p $APP_DIR
mkdir -p $APP_DIR/public/uploads/pacientes
mkdir -p $APP_DIR/public/sesiones
chown -R www-data:www-data $APP_DIR/public/uploads
chown -R www-data:www-data $APP_DIR/public/sesiones

echo "==> [5/7] Instalando dependencias del proyecto..."
cd $APP_DIR
npm install --production=false

echo "==> [6/7] Configurando base de datos..."
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

echo "==> [7/7] Compilando aplicación..."
npm run build

echo ""
echo "✅  Setup completado. Ahora:"
echo "    1. Configura /etc/nginx/sites-available/agenda-allamey"
echo "    2. Activa el sitio: ln -s /etc/nginx/sites-available/agenda-allamey /etc/nginx/sites-enabled/"
echo "    3. Reinicia nginx: systemctl restart nginx"
echo "    4. Inicia la app: pm2 start ecosystem.config.js --env production"
echo "    5. Guarda PM2: pm2 save && pm2 startup"
