FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

# Arrancamos Vite permitiendo conexiones externas en la red de Docker
CMD ["npm", "run", "dev", "--", "--host"]