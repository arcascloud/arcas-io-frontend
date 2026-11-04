--- ETAPA 1: Servir la aplicación con Nginx ---
FROM nginx:alpine

# Opcional: Eliminar la página de bienvenida por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar el archivo de configuración personalizado de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar la carpeta compilada de Angular al directorio que lee Nginx
COPY dist/arcas-software/browser /usr/share/nginx/html

# Exponer el puerto 80 para acceder via web
EXPOSE 80

# Iniciar Nginx en primer plano para que el contenedor no se cierre
CMD ["nginx", "-g", "daemon off;"]