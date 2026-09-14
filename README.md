# Utgave av web-grensesnittet for Ricoh resource monitor på Norsk bokmål.

Webbasert status- og historikksystem for Ricoh-kopimaskiner basert på SNMP.

Systemet består av:

* en Python-backend som leser data fra kopimaskinene via SNMP
* opplasting av aktuell status til webserver via SFTP
* en webfrontend som viser toner, papirskuffer og feilstatus
* server-side historikklogger med PHP + MySQL/MariaDB
* statistikk for feil, tonerbytter og papirpåfyllinger
* PWA-støtte slik at statusvisningen kan installeres som en app
* varsling i nettleseren ved nye kritiske feil

Løsningen er opprinnelig basert på `Resource-Monitor-Web-UI`, men er kraftig tilpasset for Ricoh-kopimaskiner, norsk språk og sentral overvåking.

---
[Hopp til oppsett-veiledning](#Kort-installasjonsoppsummering)
---

# Funksjoner

## Live status

Frontend viser blant annet:

* modell
* tonernivå
* papirnivå i magasiner
* aktive feil og varsler
* offline-status
* kritiske feil
* dark mode
* automatisk oppdatering

`printer_data.json` genereres av Python-backend og lastes opp til webserveren omtrent hvert 40. sekund.

Frontend leser filen omtrent hvert 8. sekund.

---

## Hendelseshistorikk

Systemet kan lagre hendelser i MySQL/MariaDB.

Historikken registrerer:

* når en feil oppstår
* når feilen blir løst
* hvilken kopimaskin det gjelder
* feilkode
* feilmelding
* alvorlighetsgrad
* varighet

Samme feil opprettes ikke på nytt ved hver polling.

En feil lagres som én hendelse fra den oppstår til den blir løst.

---

# Hendelseskategorier

Hendelser klassifiseres gjennom:

```text
Frontend/error_rules.json
```

Systemet bruker følgende hovedkategorier.

## Critical

Faktiske driftsfeil som normalt krever handling.

Eksempler:

* papirstopp
* deksel åpent
* servicefeil
* enkelte utskiftingsmeldinger
* andre kritiske Ricoh-feilkoder

---

## Warning

Tekniske varsler som er relevante, men som ikke nødvendigvis stopper maskinen.

Disse inngår i vanlig feilstatistikk.

---

## Toner

Toner behandles separat fra vanlige feil.

Eksempler:

```text
Lite: svart toner
Lite: cyan toner
Lite: magenta toner
Lite: gul toner
Tom: cyan toner
```

Tonerhendelser påvirker derfor ikke vanlig feilstatistikk eller MTTR.

Systemet kan i stedet registrere tonerbytter.

---

## Paper

Manglende papir behandles også separat.

Eksempel:

```text
Tomt for papir: magasin 3
```

Når meldingen forsvinner igjen registreres hendelsen som at magasinet er fylt på.

Dette teller ikke som en teknisk feil.

---

## Ignored

Rutinemessige tilstander lagres ikke som hendelser.

Eksempler:

```text
Energisparemodus
Utskrift pågår
Printing
Klar
Ready
Venter
Oppvarming
```

---

# Tonerbytte

Systemet forsøker å skille mellom:

```text
tonervarsel forsvant midlertidig
```

og:

```text
tonerkassetten ble faktisk byttet
```

Dette er nødvendig fordi et tonervarsel kan forsvinne midlertidig dersom en kassett tas ut og settes inn igjen.

Når et tonervarsel forsvinner blir det derfor ikke registrert som tonerbytte med en gang.

Standardlogikken er:

* dersom tonernivået samtidig øker tydelig, må varslet være borte i minst ca. 10 minutter
* dersom tonernivået ikke kan bekrefte byttet, må varslet være borte i ca. 30 minutter
* dersom varslet kommer tilbake før dette, fortsetter samme tonerhendelse

Eksempel:

```text
01.09 – Lite: magenta toner
14.09 – tonervarsel forsvinner
14.09 – nivå går fra 10 % til 100 %
14.09 – varslet er fortsatt borte etter bekreftelsestiden

→ Magenta toner byttet
```

Dette gjør det mulig å bygge statistikk over faktisk tonerforbruk.

---

# Statistikk

Statistikksiden åpnes med:

```text
?stats=1
```

Eksempel:

```text
https://example.com/?stats=1
```

Tilgjengelige perioder:

* i dag
* denne uka
* denne måneden
* dette året
* all historikk

Statistikken kan blant annet vise:

* nye tekniske feil
* løste feil
* kritiske feil
* warnings
* aktive feil
* gjennomsnittlig løsningstid
* maskiner med flest hendelser
* vanligste feil
* lengste hendelser
* tonerbytter
* aktive tonervarsler
* papirpåfyllinger
* aktive tomme magasiner

---

# Systemarkitektur

En normal installasjon ser slik ut:

```text
Ricoh-kopimaskiner
        │
        │ SNMP
        ▼
Python-backend
RicohReader.py
        │
        ├───────────────► printer_data.json
        │                     │
        │                     │ SFTP
        │                     ▼
        │                Webserver
        │                     │
        │                     ▼
        │                 Frontend
        │
        └───────────────► PHP logger API
                              │
                              ▼
                        MySQL/MariaDB
                              │
                              ▼
                       Historikk/statistikk
```

---

# Krav

Du trenger:

* en maskin som kan kjøre Python kontinuerlig
* nettverkstilgang til Ricoh-kopimaskinene
* SNMP aktivert på kopimaskinene
* Python 3
* webserver/webhotell
* SFTP-tilgang
* PHP 8.1 eller nyere
* MySQL eller MariaDB
* HTTPS anbefales

En Raspberry Pi fungerer fint som backend.

---

# Python-avhengigheter

Installer nødvendige pakker fra Backend-mappen:

```bash
pip install -r requirements.txt
```

Backend bruker blant annet:

```text
puresnmp
paramiko
tkinter
```

På Debian/DietPi/Raspberry Pi OS kan Tkinter eventuelt installeres med:

```bash
sudo apt install python3-tk
```

---

# Backend

Backend ligger i:

```text
Backend/
```

Hovedfilen er:

```text
RicohReader.py
```

Backend leser følgende informasjon via SNMP:

| Data          | OID                          |
| ------------- | ---------------------------- |
| Modell        | `.1.3.6.1.2.1.43.5.1.1.16.1` |
| Tonernivå     | `.1.3.6.1.2.1.43.11.1.1.9.1` |
| Papirnivå     | `.1.3.6.1.2.1.43.8.2.1.10.1` |
| Feilmeldinger | `.1.3.6.1.2.1.43.18.1.1.8.1` |

Ricoh kan returnere enkelte norske SNMP-strenger som Latin-1 i stedet for UTF-8.

Backend prøver derfor UTF-8 først og faller tilbake til Latin-1.

Dette gjør at eksempelvis:

```text
Deksel åpent: høyre deksel
```

ikke blir lagret som:

```text
Deksel �pent: h�yre deksel
```

---

# Printers.pkl

Printerlisten lagres i:

```text
Backend/Printers.pkl
```

Hver kopimaskin inneholder blant annet:

```text
IP
Name
Serial
EID
Default
```

Serienummer brukes som stabil ID i historikksystemet når det er tilgjengelig.

---

# Kontrollpanel

Når `RicohReader.py` startes får du:

```text
Control Panel:
1. Change run interval
2. Edit .pkl file
3. Exit
```

## 1 – Change run interval

Endrer hvor ofte kopimaskinene leses.

Standard:

```text
40 sekunder
```

---

## 2 – Edit .pkl file

Åpner printerlisten slik at maskiner kan legges til eller endres.

---

## 3 – Exit

Stopper backend.

---

# credentials.json

Opprett:

```text
Backend/credentials.json
```

Denne filen skal ikke legges på GitHub.

Eksempel:

```json
{
  "host": "sftp.example.com",
  "port": 22,
  "user": "USERNAME",
  "pass": "PASSWORD",
  "path": "/www/printstatus/",
  "logger_url": "https://example.com/api/process-printers.php",
  "logger_key": "DIN_LANGE_HEMMELIGE_NOKKEL"
}
```

## Felter

### host

SFTP-server.

### port

Normalt:

```text
22
```

### user

SFTP-brukernavn.

### pass

SFTP-passord.

### path

Mappe hvor `printer_data.json` skal lastes opp.

Eksempel:

```text
/www/printstatus/
```

### logger_url

Full URL til historikkloggeren.

Eksempel:

```text
https://example.com/api/process-printers.php
```

### logger_key

Hemmelig nøkkel som brukes mellom Python-backend og PHP-loggeren.

---

# SFTP-opplasting

`printer_data.json` lastes opp atomisk.

Backend laster først opp:

```text
printer_data.json.uploading
```

Deretter blir filen renamet til:

```text
printer_data.json
```

Dette reduserer risikoen for at frontend leser en halvferdig JSON-fil mens den lastes opp.

---

# Frontend

Frontend ligger i:

```text
Frontend/
```

Typiske filer:

```text
index.html
script.js
stats.js
style.css
stylemob.css
error_rules.json
site.webmanifest
printer_data.json
api/
images/
```

Last innholdet i denne mappen opp til webserveren.

---

# error_rules.json

`error_rules.json` styrer hvordan feilmeldinger blir klassifisert.

Eksempelstruktur:

```json
{
  "ignore": {
    "codes": [
      "10033"
    ],
    "exact": [
      "Energisparemodus",
      "Energy saver mode",
      "Utskrift pågår",
      "Printing",
      "Skriver ut",
      "Kopiering pågår",
      "Copying",
      "Klar",
      "Ready",
      "Venter",
      "Waiting",
      "Oppvarming",
      "Warming up"
    ]
  },

  "toner": {
    "contains": [
      "toner",
      "skriverkassett",
      "print cartridge"
    ],
    "codes": [
      "10072",
      "10073",
      "10074",
      "10075"
    ]
  },

  "paper": {
    "contains": [
      "Tomt for papir",
      "Out of paper",
      "Fyll på papir",
      "Load paper"
    ],
    "codes": [
      "13400"
    ]
  },

  "critical": {
    "contains": [
      "Error fetching errors",
      "Papirstopp",
      "Deksel åpent",
      "Cover open",
      "Replace",
      "Trenger flere stifter"
    ],
    "codes": [
      "40440",
      "40132",
      "40133",
      "40134",
      "40135",
      "40010",
      "40011",
      "40012",
      "40013",
      "40014",
      "40015",
      "40200",
      "40201",
      "40300",
      "40341",
      "40490",
      "40800",
      "40540",
      "40100",
      "40241",
      "340101"
    ]
  },

  "warning": {
    "contains": [
      "Forbred",
      "Finner ikke:",
      "Preparing",
      "Not found:",
      "Lavt niv"
    ],
    "codes": [
      "10032",
      "30609",
      "30427",
      "30722",
      "30743",
      "42000",
      "42001",
      "42009"
    ]
  }
}
```

Ricoh-modeller og firmwareversjoner kan rapportere forskjellige koder.

Legg derfor nye kjente koder inn i `error_rules.json` etter hvert som de oppdages.

---

# Database

Historikksystemet bruker MySQL/MariaDB.

Databasen inneholder blant annet tabellene:

```text
printer_incidents
printer_active_errors
```

`printer_incidents` lagrer permanente hendelser.

`printer_active_errors` holder styr på hvilke hendelser som fortsatt er aktive.

---

# PHP API

API-filene ligger i:

```text
Frontend/api/
```

Eksempel:

```text
bootstrap.php
config.php
health.php
process-printers.php
stats.php
events.php
```

---

# config.php

Opprett:

```text
Frontend/api/config.php
```

Eksempel:

```php
<?php

return [
    'db' => [
        'host' => 'database.example.com',
        'name' => 'DATABASENAVN',
        'user' => 'DATABASEBRUKER',
        'pass' => 'DATABASEPASSORD',
        'charset' => 'utf8mb4',
    ],

    'logger_key' => 'DIN_LANGE_HEMMELIGE_NOKKEL',
];
```

`logger_key` må være identisk med verdien i:

```text
Backend/credentials.json
```

---

# Generere logger-nøkkel

En tilfeldig nøkkel kan genereres med:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

Eksempel:

```text
xQ4...lang tilfeldig nøkkel...9Yw
```

Bruk samme nøkkel i:

```text
Backend/credentials.json
```

og:

```text
Frontend/api/config.php
```

---

# Databaseoppsett

Importer database-SQL-filen i MySQL/MariaDB.

Ved oppgradering fra tidligere historikkversjon brukes migreringsfilen for aktuell versjon i stedet for å slette databasen.

Historikken bør normalt beholdes.

---

# Kontrollere API

Åpne:

```text
https://example.com/api/health.php
```

Et fungerende system gir omtrent:

```json
{
  "ok": true,
  "logger_version": 3,
  "database": "connected",
  "rules": "loaded",
  "server_time": "2026-09-14T15:00:00+02:00",
  "timezone": "Europe/Oslo"
}
```

Hvis du får HTTP 500, kontroller:

* at `bootstrap.php` finnes
* at `config.php` finnes
* databasebruker/passord
* databasehost
* PHP-versjon
* `pdo_mysql`
* at databasetabellene er opprettet

---

# Test logger manuelt

Loggeren kan testes med:

```bash
curl -X POST \
  -H 'X-Logger-Key: DIN_HEMMELIGE_NOKKEL' \
  https://example.com/api/process-printers.php
```

Når body mangler kan loggeren lese eksisterende `printer_data.json` fra webserveren.

Et vellykket kall gir eksempelvis:

```json
{
  "ok": true,
  "logger_version": 3,
  "printers_processed": 7,
  "raw_error_entries_seen": 11,
  "ignored_status_entries": 5,
  "incidents_opened": 0,
  "incidents_resolved": 0
}
```

---

# Deduplisering

Loggeren oppretter ikke samme feil hvert 40. sekund.

Eksempel:

```text
15:00 Papirstopp oppstår
15:00 hendelse opprettes

15:01 samme papirstopp
→ ingen ny hendelse

15:02 samme papirstopp
→ ingen ny hendelse

15:05 papirstopp borte
→ eksisterende hendelse markeres løst
```

---

# Beskyttelse mot falske løsninger

Dersom Python ikke klarer å lese feilmeldinger fra en maskin og får:

```text
Error fetching errors
```

vil loggeren ikke automatisk markere alle tidligere feil på maskinen som løst.

Dette beskytter historikken mot falske løsninger ved midlertidige SNMP-problemer.

---

# PWA

Frontend kan installeres som en Progressive Web App.

`site.webmanifest` brukes til dette.

Eksempel:

```json
{
  "name": "Kopimaskin status",
  "short_name": "Kopistatus",
  "start_url": "/",
  "scope": "/",
  "display": "standalone"
}
```

Installasjonsknappen vises bare dersom nettleseren tilbyr PWA-installasjon.

Det brukes normalt ikke service worker for live-statusen, fordi `printer_data.json` alltid bør hentes fersk og ikke caches offline.

---

# Nettleservarslinger

Frontend kan sende desktop-varslinger ved nye kritiske feil.

Varslinger er:

* av som standard
* lagret lokalt i nettleseren
* bare sendt ved nye kritiske hendelser
* ikke gjentatt hvert 8. sekund for samme feil

Når en feil forsvinner fjernes den fra kjent-listen.

Dersom samme feil senere kommer tilbake kan den varsles på nytt.

Varsellyden består av tre toner.

Trykk:

```text
T
```

for å teste lyden når markøren ikke står i et tekstfelt.

---

# Dark mode

Dark mode kan slås av/på manuelt.

Den kan også tvinges med:

```text
?darkmode=1
```

Sesongmodus:

```text
?darkseason=1
```

kan brukes til automatisk dark mode i vintermånedene.

Parametere kan kombineres:

```text
?darkseason=1&stats=1
```

---

# Statistikkside

Åpne:

```text
?stats=1
```

for å vise historikk og statistikk i stedet for normal infoskjerm.

Eksempel:

```text
https://example.com/?stats=1
```

---

# Filstruktur

Et typisk ferdig oppsett:

```text
Kopimaskin-SNMP-nettvisning/
│
├── Backend/
│   ├── RicohReader.py
│   ├── Printers.pkl
│   ├── credentials.json
│   └── requirements.txt
│
└── Frontend/
    ├── index.html
    ├── script.js
    ├── stats.js
    ├── style.css
    ├── stylemob.css
    ├── site.webmanifest
    ├── error_rules.json
    ├── printer_data.json
    │
    ├── images/
    │
    └── api/
        ├── bootstrap.php
        ├── config.php
        ├── health.php
        ├── process-printers.php
        ├── stats.php
        └── events.php
```

---

# Oppstart

En enkel oppstartsrekkefølge er:

```bash
cd Backend
python3 RicohReader.py
```

Når backend fungerer bør du se noe tilsvarende:

```text
Data exported to printer_data.json successfully.
Uploaded printer_data.json to SFTP server at /www/printstatus/
Event logger HTTP 200: {...}
```

---

# Feilsøking

## `Error fetching errors`

Dette betyr at SNMP-spørringen for feilstatus ikke kunne fullføres.

Backend skriver den faktiske exception-feilen i terminalen.

Feilen skal ikke normalt registreres som at tidligere hendelser er løst.

---

## Norske tegn vises som `�`

Ricoh kan returnere SNMP-tekst som Latin-1.

Backend skal bruke:

```python
try:
    return value.decode('utf-8')
except UnicodeDecodeError:
    return value.decode('latin-1')
```

---

## HTTP 500 fra API

Kontroller:

```text
bootstrap.php
config.php
PHP-versjon
PDO
pdo_mysql
databaseinnstillinger
databasetabeller
```

Test:

```text
/api/health.php
```

---

## Logger returnerer HTTP 200, men ingen nye incidents

Dette er normalt dersom de samme hendelsene allerede er aktive.

Eksempel:

```json
{
  "incidents_opened": 0,
  "incidents_resolved": 0
}
```

betyr at dedupliseringen fungerer.

---

## Papirnivå oppdateres ikke

Noen Ricoh-maskiner rapporterer ikke alltid nye nivåer mens de står i energisparemodus.

Maskinen kan måtte vekkes før enkelte SNMP-verdier oppdateres.

---

# Anbefalt produksjonsoppsett

Backend bør kjøre kontinuerlig på en maskin som:

* er på samme nettverk som kopimaskinene
* har stabil nettverkstilkobling
* kan nå webserveren via SFTP og HTTPS
* kan kjøre Python kontinuerlig

Typisk:

```text
Raspberry Pi
Linux-server
VM
mini-PC
```

---

# Sikkerhet

Anbefalt:

* HTTPS
* lang tilfeldig `logger_key`
* `config.php` ikke tilgjengelig som ren tekst
* databasebruker med begrensede rettigheter
* ingen credentials i GitHub
* ingen sensitiv `printer_data.json` i offentlig repo

API-et for innskriving krever `X-Logger-Key`.

Statistikkendepunktene kan være lesbare fra frontend, så ikke lagre sensitive data der som ikke skal vises offentlig.

---

# Kort installasjonsoppsummering

1. Klon repoet.
2. Installer Python-avhengigheter.
3. Konfigurer `Printers.pkl`.
4. Opprett `credentials.json`.
5. Last `Frontend/` opp til webserver.
6. Opprett MySQL/MariaDB-database.
7. Importer database-SQL.
8. Opprett `api/config.php`.
9. Bruk samme `logger_key` i Python og PHP.
10. Kontroller `/api/health.php`.
11. Start `RicohReader.py`.
12. Kontroller at SFTP gir vellykket opplasting.
13. Kontroller at loggeren returnerer HTTP 200.
14. Åpne normal dashboardvisning.
15. Åpne `?stats=1` og kontroller historikk/statistikk.

---

# Lisens / opphav

Dette prosjektet er en videreutviklet variant av det opprinnelige Ricoh Resource Monitor / Resource-Monitor-Web-UI-prosjektet.

Se repositoryets lisensfiler for gjeldende lisensvilkår.
