FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install

# Copiar el resto del código del servidor
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]