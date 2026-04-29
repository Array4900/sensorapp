FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run prepare && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev --ignore-scripts

# Zmena na 3000
EXPOSE 3000
ENV PORT=3000
# SvelteKit vyžaduje 0.0.0.0, aby prijímal spojenia z tunela
ENV HOST=0.0.0.0 

CMD ["node", "build"]