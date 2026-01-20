FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Skompiluje TypeScript do produkčnej verzie js
RUN npm run build
EXPOSE 5000
# Spustí aplikáciu (predpokladá, že "start" je definovaný v package.json)
CMD ["npm", "run", "start"]