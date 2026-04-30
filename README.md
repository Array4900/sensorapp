## SensorApp

SensorApp je webová aplikácia na monitorovanie hladiny v žumpe alebo podobnej nádrži pomocou fyzického senzora. Zariadenie odosiela merania cez MQTT, backend ich spracuje a uloží do MongoDB a frontend zobrazuje aktuálny stav, históriu meraní a notifikácie. Súčasťou riešenia je aj PWA vrstva so service workerom a web push notifikáciami.

## Z čoho sa projekt skladá

Projekt má štyri hlavné časti:

- `frontend/`: SvelteKit webová aplikácia a PWA klient.
- `backend/`: Node.js, Express a TypeScript API server.
- `db`: MongoDB databáza pre používateľov, senzory, merania a notifikácie.
- `mosquitto/`: MQTT broker pre komunikáciu so senzorovým zariadením.

V produkčnom režime sa navyše používa aj kontajner `tunnel`, ktorý cez Cloudflare Tunnel sprístupní backend na verejnej HTTPS adrese.

## Hlavné funkcie

- príjem meraní zo senzora cez MQTT,
- ukladanie meraní do MongoDB,
- REST API pre frontend,
- autentifikácia používateľov pomocou JWT,
- dashboard so stavom senzora a históriou meraní,
- push notifikácie pri dôležitých udalostiach,
- PWA režim so service workerom.

## Požiadavky

Pred spustením projektu je potrebné mať nainštalované:

- Docker,
- Docker Compose plugin, teda príkaz `docker compose`.

## Konfigurácia .env

V koreňovom adresári projektu `sensorapp/` je potrebné vytvoriť súbor `.env`. Tento súbor nie je súčasťou repozitára, pretože obsahuje tajné a inštančne špecifické údaje.

Príklad kompletnej konfigurácie:

```env
JWT_SECRET=<silny_tajny_kluc>
MONGO_URI=mongodb://db:27017/sensorapp
PORT=5000

VAPID_PUBLIC_KEY=<verejny_vapid_kluc>
VAPID_PRIVATE_KEY=<sukromny_vapid_kluc>
VAPID_EMAIL=mailto:you@example.com

MQTT_BROKER_URL=mqtt://mosquitto:1883
MQTT_TOPIC=sensor/+/meranie
MQTT_USER=<mqtt_pouzivatel>
MQTT_PASSWORD=<mqtt_heslo>

PUBLIC_API_URL=http://localhost:5000/api
INTERNAL_API_URL=http://sensor_api:5000/api

CLOUDFLARE_TUNNEL_TOKEN=<cloudflare_tunnel_token>

DB_BIND_ADDRESS=127.0.0.1
API_BIND_ADDRESS=127.0.0.1
WEB_BIND_ADDRESS=127.0.0.1
MQTT_BIND_ADDRESS=0.0.0.0
MQTT_WS_BIND_ADDRESS=127.0.0.1
```

### Význam jednotlivých premenných

- `JWT_SECRET`: tajný kľúč používaný backendom na podpisovanie a overovanie JWT tokenov. Musí byť dlhý, náhodný a nesmie byť verejný.
- `MONGO_URI`: connection string na MongoDB. V Docker Compose sieti má databáza názov služby `db`, preto lokálna hodnota býva `mongodb://db:27017/sensorapp`.
- `PORT`: port, na ktorom počúva backend vo vnútri kontajnera. V tomto projekte je to `5000`.
- `VAPID_PUBLIC_KEY`: verejný VAPID kľúč pre web push. Frontend ho používa pri vytváraní push subscription.
- `VAPID_PRIVATE_KEY`: súkromný VAPID kľúč. Backend ním podpisuje push správy odosielané do prehliadačov.
- `VAPID_EMAIL`: kontaktná e-mailová adresa vo formáte `mailto:...`, ktorá sa posiela ako súčasť VAPID identity.
- `MQTT_BROKER_URL`: adresa MQTT brokera, ku ktorému sa pripája backend. Pri bežnom Docker behu je to `mqtt://mosquitto:1883`.
- `MQTT_TOPIC`: topic filter, ktorý backend odoberá. Určuje, z ktorých MQTT topicov prichádzajú merania.
- `MQTT_USER`: používateľské meno pre autentifikáciu na Mosquitto brokeri.
- `MQTT_PASSWORD`: heslo k MQTT používateľovi.
- `PUBLIC_API_URL`: verejná URL backend API, ktorú používa prehliadač. V lokálnom režime to býva `http://localhost:5000/api`, v produkcii napríklad `https://tvoja-domena.example/api`.
- `INTERNAL_API_URL`: interná URL backend API, ktorú používa SvelteKit server-side časť vo vnútri Docker siete. Typicky `http://sensor_api:5000/api`.
- `CLOUDFLARE_TUNNEL_TOKEN`: token pre kontajner `cloudflared`. Je potrebný len v produkčnom profile, keď chceš sprístupniť backend cez Cloudflare Tunnel.
- `DB_BIND_ADDRESS`: adresa na hostiteľovi, na ktorú sa mapuje MongoDB port. Predvolená hodnota `127.0.0.1` sprístupní databázu len lokálne na tom istom počítači.
- `API_BIND_ADDRESS`: adresa na hostiteľovi pre backend port `5000`. Predvolená hodnota `127.0.0.1` znamená lokálny prístup.
- `WEB_BIND_ADDRESS`: adresa na hostiteľovi pre frontend port `3000`.
- `MQTT_BIND_ADDRESS`: adresa na hostiteľovi pre MQTT port `1883`. Predvolene je nastavená na `0.0.0.0`, aby sa ESP zariadenie v rovnakej LAN vedelo pripojiť na broker cez IP adresu hostiteľa.
- `MQTT_WS_BIND_ADDRESS`: adresa na hostiteľovi pre MQTT WebSocket port `9001`. Predvolene ostáva lokálna.

### Ktoré premenné sú povinné

Pre funkčný lokálny beh treba nastaviť minimálne:

- `JWT_SECRET`
- `MONGO_URI`
- `PORT`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_EMAIL`
- `MQTT_BROKER_URL`
- `MQTT_TOPIC`
- `MQTT_USER`
- `MQTT_PASSWORD`
- `PUBLIC_API_URL`
- `INTERNAL_API_URL`

Pre produkčný beh cez Cloudflare Tunnel je navyše potrebné nastaviť aj:

- `CLOUDFLARE_TUNNEL_TOKEN`

Premenné `DB_BIND_ADDRESS`, `API_BIND_ADDRESS`, `WEB_BIND_ADDRESS`, `MQTT_BIND_ADDRESS` a `MQTT_WS_BIND_ADDRESS` sú voliteľné, pretože majú predvolené hodnoty priamo v `docker-compose.yml`.

## Lokálne spustenie projektu

V koreňovom adresári projektu spusti:

```bash
docker compose up --build
```

Tým sa spustia tieto kontajnery:

- MongoDB,
- backend API,
- frontend,
- Mosquitto broker.

Po štarte budú služby dostupné typicky takto:

- frontend: `http://localhost:3000`
- backend API: `http://localhost:5000`
- MongoDB z hosta: `mongodb://localhost:27018`
- MQTT broker pre ESP v rovnakej sieti: `tcp://<IP_adresa_tvojho_PC>:1883`

Ak sa má ESP zariadenie pripájať na broker, musí použiť IP adresu počítača, na ktorom beží Docker, nie `localhost`.

## Produkčné spustenie projektu

Produkčný režim používa rovnaké kontajnery ako lokálny režim, ale navyše zapína Cloudflare Tunnel cez Compose profile `prod`.

Spustenie:

```bash
docker compose --profile prod up --build -d
```

Tým sa spustí aj služba `tunnel`, ktorá zoberie `CLOUDFLARE_TUNNEL_TOKEN` z `.env` a vytvorí odchádzajúce spojenie do Cloudflare siete. Nie je potrebné otvárať porty smerom z internetu do domácej siete, pretože tunel vytvára spojenie zvnútra smerom von.

Pre produkciu treba nastaviť najmä:

- `PUBLIC_API_URL` na verejnú HTTPS adresu dostupnú cez Cloudflare Tunnel,
- `CLOUDFLARE_TUNNEL_TOKEN` na platný token vytvorený v Cloudflare,
- bezpečné tajné hodnoty pre `JWT_SECRET`, `VAPID_PRIVATE_KEY` a `MQTT_PASSWORD`.

## Prečo je pre PWA dôležité nasadenie na internet

PWA funkcionalita je úzko spojená so secure contextom, teda s `HTTPS` alebo s vývojovým `localhost` režimom. Lokálne vieš veľkú časť aplikácie otestovať, ale na reálnych zariadeniach mimo vývojového počítača je potrebné, aby bola aplikácia dostupná cez verejnú a dôveryhodnú HTTPS adresu.

Platí to najmä pre:

- inštaláciu aplikácie ako PWA na mobilnom zariadení,
- registráciu service workera mimo lokálneho development prostredia,
- push notifikácie na skutočných zariadeniach,
- prístup k aplikácii z internetu bez priameho otvárania domácich portov.

V tomto projekte je to riešené cez Cloudflare Tunnel.

## Ako funguje nasadenie cez Cloudflare Tunnel

Proces je v princípe takýto:

1. V Cloudflare sa vytvorí tunel a vygeneruje sa `CLOUDFLARE_TUNNEL_TOKEN`.
2. Token sa uloží do `.env` súboru projektu.
3. Po spustení `docker compose --profile prod up --build -d` sa spustí kontajner `cloudflared-tunnel`.
4. Tento kontajner sa autentifikuje voči Cloudflare a otvorí odchádzajúce spojenie do Cloudflare infraštruktúry.
5. Cloudflare následne smeruje požiadavky z tvojej verejnej domény do backendu bežiaceho v Docker sieti.
6. Frontend potom komunikuje s backendom cez verejnú `PUBLIC_API_URL`, zatiaľ čo interné server-side volania ostávajú smerované cez `INTERNAL_API_URL` v rámci Docker siete.

Výhodou tohto riešenia je, že:

- netreba otvárať inbound porty na routeri,
- aplikácia je dostupná cez HTTPS,
- PWA a push notifikácie fungujú v realistickom produkčnom režime,
- backend môže zostať fyzicky bežať doma alebo na vlastnom serveri.

## Poznámky k bezpečnosti

- `.env` nikdy neukladaj do repozitára a nikomu nezverejňuj.
- `JWT_SECRET`, `VAPID_PRIVATE_KEY`, `MQTT_PASSWORD` a `CLOUDFLARE_TUNNEL_TOKEN` považuj za tajné údaje.
- Ak by mal byť MQTT broker dostupný z verejného internetu, nestačí len zmeniť bind adresu. Je potrebné doplniť TLS, ACL pravidlá a ďalšie obmedzenia prístupu. V tomto projekte je však MQTT broker určený primárne pre ESP zariadenia v rovnakej LAN, takže nie je potrebné ho vystavovať von.

## Užitočné príkazy

Lokálny beh v popredí:

```bash
docker compose up --build
```

Lokálny beh na pozadí:

```bash
docker compose up --build -d
```

Produkčný beh s Cloudflare Tunnelom:

```bash
docker compose --profile prod up --build -d
```

Zastavenie projektu:

```bash
docker compose down
```

