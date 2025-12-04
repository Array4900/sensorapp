# Použijeme oficiálny Node.js image
FROM node:18

LABEL authors="cifra"

# Nastavíme pracovný adresár v kontajneri
WORKDIR /app

# Skopíruj package.json a package-lock.json
COPY package*.json ./

# Nainštaluj závislosti
RUN npm install

# Skopíruj zvyšok projektu
COPY .. .

# Port na ktorom beží backend
EXPOSE 5000

# ENTRYPOINT ["top", "-b"]

# Štart aplikácie
CMD ["npm", "run", "start"]
