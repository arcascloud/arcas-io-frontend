#--- ETAPA 1: Compilación de la aplicación con Node.js ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (incluyendo el postinstall de PrimeNG)
RUN npm install

# Copiar el código fuente
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
