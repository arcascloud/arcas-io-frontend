#--- ETAPA 1: Compilación de la aplicación con Node.js 22 ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias y la carpeta de scripts para que postinstall encuentre patch-primeng.js
COPY package*.json ./
COPY scripts/ ./scripts/

# Instalar dependencias (el script postinstall correrá scripts/patch-primeng.js correctamente)
RUN npm install --legacy-peer-deps

# Copiar el resto del código fuente
COPY . .

# Generar environment y compilar para producción
RUN npm run build

#--- ETAPA 2: Servir la aplicación con Nginx ---
FROM nginx:alpine

# Eliminar la página por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar configuración de Nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados desde la etapa de compilación
COPY --from=builder /app/dist/arcas-software/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
