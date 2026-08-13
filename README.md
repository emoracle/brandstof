# Brandstofkosten-app

Een eenvoudige webapp om de elektriciteits- en benzinekosten van een rit met een hybride auto te berekenen.

## Mogelijkheden

- Berekent automatisch welk deel van een rit elektrisch en op benzine wordt afgelegd.
- Toont verbruik, accubereik en totale ritkosten.
- Vergelijkt de kosten per kilometer voor elektrisch rijden en rijden op benzine.
- Laat de volledige kostenopbouw en tussenberekeningen zien.
- Bewaart instellingen lokaal in een JSON-bestand.
- Werkt zonder database of externe Node.js-pakketten.

## Vereisten

- Node.js 18 of nieuwer.
- npm, standaard meegeleverd met Node.js.

## Starten

Clone de repository en start de server:

```bash
git clone <repository-url>
cd brandstof
npm start
```

Open daarna `http://localhost:3000` in een browser. Gebruik het volgende commando wanneer de browser niet automatisch geopend moet worden:

```bash
OPEN_BROWSER=0 npm start
```

Een andere poort kan via `PORT` worden ingesteld:

```bash
PORT=8080 OPEN_BROWSER=0 npm start
```

## Gebruik

1. Vul de elektriciteitsprijs, benzineprijs en verbruikswaarden in.
2. Vul de gewenste ritafstand en accucapaciteit in.
3. Bekijk de resultaten en transparante kostenopbouw; deze worden direct bijgewerkt.
4. Klik op `Opslaan` om de waarden lokaal te bewaren.
5. Klik op `Terug` om niet-opgeslagen wijzigingen te verwijderen en de laatst opgeslagen waarden te herstellen.

De server maakt `data/settings.json` automatisch aan. Dit bestand bevat lokale gebruikersinstellingen en wordt niet in Git opgenomen.

## Tests

Voer de unit tests uit met:

```bash
npm test
```

De GitHub Actions-workflow voert de tests en JavaScript-syntaxcontroles automatisch uit bij pull requests en pushes naar `main`.

## Techniek

De applicatie gebruikt uitsluitend ingebouwde browser- en Node.js-functionaliteit:

- een Node.js HTTP-server;
- HTML, CSS en JavaScript voor de frontend;
- JSON voor lokale persistentie;
- `node:test` voor unit tests.
