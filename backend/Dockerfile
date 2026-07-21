FROM node:20-alpine
# Prisma necesita openssl para detectar la versión correcta del motor de consultas;
# sin esto, el build cae al binario de OpenSSL 1.1 (no presente en Alpine 3.19+) y el
# backend falla al arrancar con "Error loading shared library libssl.so.1.1".
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "start:dev"]
