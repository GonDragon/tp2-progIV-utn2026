# Etapa 1: Construcción
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Producción
FROM node:24-alpine
WORKDIR /app
# Copiamos solo lo necesario para correr en producción
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Exponemos el puerto interno (NestJS usa 3000 por defecto)
EXPOSE 3000

CMD ["node", "dist/main"]