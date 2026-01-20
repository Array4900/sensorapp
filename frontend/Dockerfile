FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Druhá fáza (Production stage) - zmenší výsledný obraz
FROM node:20-alpine
WORKDIR /app
# Skopírujeme len to, čo potrebujeme na beh
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
# Nainštalujeme len produkčné závislosti
RUN npm install --omit=dev

EXPOSE 5173
# Nastaví port, na ktorom bude node aplikácia počúvať
ENV PORT=5173
CMD ["node", "build"]