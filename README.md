Dôležité: na to, aby backend fungoval treba vytvoriť .env súbor v backende, kde sa pridá sekcia:
```
JWT_SECRET=<moj_tajny_kluc>
MONGODB_URI=<moj_mongodb_uri>
PORT=5000
```

.env súbor nie je súčasťou repozitára z dôvodu bezpečnosti.


Projekt je rozdelený na dve časti: frontend a backend, obidve bežia v jednom docker kontajneri
spolu s mongodb databázou.
Pre spustenie projektu je potrebné mať nainštalovaný Docker a Docker Compose.
Pre spustenie projektu použite príkaz v koreňovom adresári projektu /sensorapp:
```
docker-compose up --build
```

Frontend bude dostupný na adrese: http://192.168.137.1:5173, alebo podla nastavení docker-compose.yml súboru.
Databáza MongoDB bude pre compass dostupná na rovnakom zariadení na adrese mongodb://localhost:27018 .

