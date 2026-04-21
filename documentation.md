# Dokumentácia projektu SensorApp

## 1. Čo je SensorApp

SensorApp je webová aplikácia na monitorovanie hladiny v žumpe alebo podobnej nádrži pomocou fyzických senzorov, ktoré odosielajú merania cez MQTT do backendu. Backend údaje spracuje, uloží do MongoDB, sprístupní ich frontendovej časti cez REST API a podľa pravidiel odosiela push notifikácie používateľovi.

Projekt je postavený ako viacvrstvový systém pozostávajúci z:

- frontendovej webovej aplikácie v SvelteKit,
- backendového API servera v Node.js, Express a TypeScript,
- databázy MongoDB,
- MQTT brokera Mosquitto,
- service workera pre offline režim a push notifikácie,
- Docker infraštruktúry pre lokálne aj produkčné nasadenie.

## 2. Architektúra systému

Architektúra je rozdelená do viacerých logických vrstiev.

### 2.1 Prezentačná vrstva

Prezentačnú vrstvu tvorí frontend v adresári frontend. Ide o SvelteKit aplikáciu, ktorá:

- zobrazuje dashboard, zoznam senzorov, profil a administráciu,
- komunikuje s backendom cez HTTP API,
- registruje service worker,
- pracuje offline s cache mechanizmom,
- umožňuje prihlásenému používateľovi prihlásiť sa na odber push notifikácií.

### 2.2 Aplikačná vrstva

Aplikačnú logiku tvorí backend v adresári backend. Táto vrstva:

- zabezpečuje autentifikáciu používateľov pomocou JWT,
- poskytuje CRUD operácie nad senzormi, meraniami a administráciou,
- prijíma MQTT správy zo senzorov,
- validuje prijaté merania,
- ukladá dáta do MongoDB,
- rozhoduje o odosielaní prahových a denných notifikácií,
- spravuje odbery push notifikácií a históriu odoslaných notifikácií.

### 2.3 Dátová vrstva

Dátovú vrstvu tvorí MongoDB. V databáze sa ukladajú:

- používatelia,
- senzory,
- merania,
- blacklistnuté tokeny,
- push odbery pre konkrétnych používateľov,
- história odoslaných notifikácií.

### 2.4 Komunikačná vrstva

Komunikačnú vrstvu tvoria dva hlavné kanály:

- REST API medzi frontendom a backendom,
- MQTT medzi fyzickým senzorom a backendom.

REST API slúži na používateľské operácie, správu senzorov, načítanie dát a správu push odberov. MQTT slúži na príjem meraní zo zariadenia v takmer reálnom čase.

## 3. Hlavné moduly projektu

## 3.1 Frontend modul

Frontend sa nachádza v adresári frontend/src.

### Hlavné časti frontend modulu

- routes: jednotlivé stránky aplikácie,
- lib/api.ts: centralizovaná komunikácia s backend API,
- lib/stores/auth.ts: správa autentifikácie, tokenu a používateľského stavu,
- lib/push.ts: registrácia service workera a správa push odberov,
- static/service-worker.js: offline cache a obsluha push udalostí.

### Dôležité stránky frontend modulu

- dashboard: zobrazenie grafov, meraní a histórie upozornení,
- sensors: správa senzorov používateľa,
- admin: administrátorské rozhranie,
- profile: správa profilu a zapnutie alebo vypnutie push notifikácií,
- login/register: autentifikačné stránky.

## 3.2 Backend modul

Backend sa nachádza v adresári backend/src.

### Konfiguračné časti

- config/db.ts: pripojenie k MongoDB,
- server.ts: štart servera, registrácia rout, MQTT pripojenie a plánovače.

### Controllers

Controllers predstavujú aplikačnú logiku jednotlivých oblastí.

- authController.ts: registrácia, login, overenie tokenu, logout,
- sensorController.ts: CRUD nad senzormi a načítanie meraní,
- adminController.ts: administrátorské operácie,
- pushController.ts: správa push subscription a história notifikácií,
- measurementController.ts a locationController.ts: doplnkové časti systému.

### Routes

Routes mapujú HTTP endpointy na controllery.

- authRoute.ts,
- sensorRoutes.ts,
- measurementRoutes.ts,
- adminRoutes.ts,
- pushRoutes.ts,
- locationRoutes.ts.

### Middleware

- authMiddleware.ts: overenie JWT tokenu,
- adminMiddleWare.ts: overenie administrátorských oprávnení.

### Models

Modely definujú MongoDB schémy.

- User.ts: používateľ,
- Sensor.ts: senzor a jeho stav,
- Measurement.ts: jednotlivé merania,
- PushSubscription.ts: push odbery zariadení používateľov,
- SentNotification.ts: história úspešne odoslaných notifikácií,
- BlacklistedToken.ts: blacklist tokenov,
- Location.ts: lokácie.

### Utils

- tokenBlacklist.ts: plánované čistenie blacklistu tokenov,
- pushNotifications.ts: nízkoúrovňové odosielanie push správ a ich persistencia,
- sensorNotifications.ts: doménová logika pre prahové a denné upozornenia,
- roleEnum.ts: definícia používateľských rolí.

## 3.3 MQTT modul

MQTT modul je súčasťou backendu, ale architektonicky ide o samostatnú integračnú vrstvu.

Jeho úlohy sú:

- pripojiť sa k brokeru,
- odoberať správy zo zvoleného topicu,
- validovať payload,
- nájsť senzor podľa API kľúča,
- odmietnuť merania mimo povoleného rozsahu,
- uložiť validné merania,
- spustiť notifikačnú logiku,
- odoslať ACK alebo zamietnutie späť zariadeniu.

## 3.4 Notifikačný modul

Notifikačný modul je rozdelený medzi frontend, backend a service worker.

### Frontendová časť

- registrácia service workera,
- získanie povolenia na notifikácie,
- vytvorenie browser push subscription,
- odoslanie subscription na backend.

### Backendová časť

- uloženie push subscription do MongoDB,
- odoslanie notifikácie cez VAPID a web-push,
- uloženie záznamu do sent_notifications,
- sprístupnenie histórie notifikácií cez API.

### Doménové pravidlá notifikácií

- prahové notifikácie pri napĺňaní žumpy,
- denná notifikácia o aktuálnom stave po 9:00 v časovej zóne Europe/Bratislava,
- manuálne odoslanie notifikácie administrátorom.

## 4. Tok dát v systéme

## 4.1 Tok merania zo senzora

1. Fyzický senzor odošle MQTT správu obsahujúcu apiKey a distance.
2. Backend prijme správu cez MQTT klienta.
3. Backend overí existenciu senzora podľa apiKey.
4. Backend overí, či je vzdialenosť v povolenom rozsahu 21 až 580 cm.
5. Validné meranie sa uloží do kolekcie measurements.
6. Backend vyhodnotí, či treba odoslať prahové upozornenie.
7. Backend odošle ACK späť na zariadenie.

## 4.2 Tok push notifikácie

1. Používateľ vo fronte povolí notifikácie.
2. Prehliadač vytvorí push subscription.
3. Frontend pošle subscription na backend.
4. Backend uloží subscription do MongoDB.
5. Pri notifikačnej udalosti backend cez web-push odošle správu na subscription.
6. Service worker v prehliadači zachytí push event a zobrazí notifikáciu.
7. Úspešne odoslaná logická notifikácia sa uloží do sent_notifications.

## 4.3 Tok dát do dashboardu

1. Frontend si načíta zoznam senzorov používateľa.
2. Frontend si načíta merania vybraného senzora.
3. Frontend si načíta históriu odoslaných notifikácií používateľa.
4. Dashboard vykreslí grafy, štatistiky a upozornenia.

## 5. Bezpečnostné prvky

Projekt obsahuje viacero bezpečnostných mechanizmov.

- JWT autentifikácia chráni API endpointy,
- blacklist tokenov zabraňuje opätovnému použitiu logoutnutého tokenu,
- administrátorské routy sú oddelené middleware vrstvou,
- API kľúč senzora chráni MQTT vstup proti neoprávnenému zápisu,
- VAPID kľúče chránia push infraštruktúru,
- service worker pracuje len v rámci povoleného scope aplikácie.

## 6. Nasadenie a infraštruktúra

Projekt je určený na spúšťanie cez Docker Compose.

Služby v docker-compose.yml:

- db: MongoDB databáza,
- api: backend server,
- web: frontend server,
- mosquitto: MQTT broker,
- tunnel: Cloudflare tunnel pre publikovanie služby navonok.

Takéto rozdelenie umožňuje jednoduché lokálne testovanie aj budúce rozšírenie systému.

## 7. Zhrnutie

SensorApp je modulárny monitorovací systém so zameraním na zber meraní zo senzorov, ich vizualizáciu, správu používateľov a inteligentné upozorňovanie. Architektúra je postavená tak, aby bolo možné systém ďalej rozširovať napríklad o detekciu porúch, ďalšie typy senzorov, pokročilé analytické pravidlá alebo detailnejšie reporty.