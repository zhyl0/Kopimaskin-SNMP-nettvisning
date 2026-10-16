# Kopimaskin-SNMP-nettvisning

Webgrensesnitt for overvåking av Ricoh-kopimaskiner via SNMP.

Prosjektet består av en Python-backend som henter status direkte fra kopimaskinene, en nettbasert frontend, samt et valgfritt PHP/MariaDB-oppsett for historikk, statistikk og service-markering.

## Funksjoner

- Henter modell, tonernivå, papirmengde og aktive status-/feilmeldinger via SNMP.
- Viser kritiske feil og warnings visuelt i nettleseren.
- Skiller tekniske feil fra toner og papir.
- Tom toner kan behandles som kritisk, mens lav toner behandles som forbruksmateriell.
- Energisparing og vanlige driftsstatuser kan ignoreres.
- Skrivebordsvarsler for nye kritiske feil.
- Historikk over når feil oppstår og når de blir løst.
- Statistikk for dag, uke, måned, år og hele perioden.
- Tonerbytter og papirpåfyllinger logges separat fra tekniske feil.
- Egen admin-side der en aktiv feil kan merkes som **meldt til service**.
- Service-status vises offentlig som gult SERVICE-sperrebånd på printerkortet.
- Dark mode, PWA/installasjon som app og egne URL-flagg.

---

## Arkitektur

```text
Ricoh-kopimaskiner
        │
        │ SNMP
        ▼
Python / RicohReader.py
        │
        ├── printer_data.json ──SFTP──► Webhotel
        │
        └── samme snapshot ──HTTPS──► process-printers.php
                                      │
                                      ▼
                                  MariaDB
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
                Frontend                            /admin/
          status + statistikk                  service-markering
```

Frontend leser den ferske `printer_data.json` direkte for livevisningen. Historikk og service-status ligger i MariaDB.

Dette betyr at flere nettlesere kan ha siden åpen samtidig uten at samme feil blir logget flere ganger.

---

# Du trenger

- En maskin som kan kjøre Python og nå skriverne over nettverket, f.eks. Raspberry Pi.
- Python 3.
- SNMP aktivert på Ricoh-maskinene.
- SFTP-tilgang til webhotellet.
- Et webhotell med:
  - PHP 8.1 eller nyere
  - PDO MySQL
  - MariaDB/MySQL
  - HTTPS
- En databasebruker med tilgang til databasen.
- Kopimaskinene bør helst bruke norsk visningsspråk. Mange engelske feilmeldinger støttes også.

---

# Mapper

Repoet er i hovedsak delt i:

```text
Backend/
    RicohReader.py
    requirements.txt
    Printers.pkl
    credentials.json        <- skal ikke på GitHub

Frontend/
    index.html
    script.js
    stats.js
    style.css
    stylemob.css
    error_rules.json
    images/
    api/
    admin/
```

Avhengig av release kan SQL- og hjelpefiler ligge i egne `sql/` og `tools/`-mapper.

---

# Ny installasjon fra bunnen av

## 1. Last ned repoet

```bash
git clone https://github.com/zhyl0/Kopimaskin-SNMP-nettvisning.git
cd Kopimaskin-SNMP-nettvisning
```

Du kan også laste ned ZIP fra GitHub.

---

## 2. Installer Python-avhengigheter

Gå til backend-mappen:

```bash
cd Backend
```

Installer kravene:

```bash
python3 -m pip install -r requirements.txt
```

Det anbefales å bruke et virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Backend bruker blant annet SNMP og Paramiko/SFTP.

---

## 3. Konfigurer skriverlisten

`RicohReader.py` bruker `Printers.pkl`.

Når programmet kjøres får du kontrollpanelet:

```text
Control Panel:
1. Change run interval
2. Edit .pkl file
3. Exit
```

Velg `2` for å redigere skriverlisten.

En printer trenger normalt disse feltene:

- `IP`
- `Name`
- `Serial`
- `EID`
- `Default`

`Serial` anbefales sterkt, fordi historikkloggeren bruker serienummer som stabil identifikator når det finnes.

Eksempel:

```json
{
  "IP": "192.0.2.20",
  "Name": "Kontor 1",
  "Serial": "EKSEMPEL123",
  "EID": "",
  "Default": true
}
```

Ikke legg en produksjons-`Printers.pkl` med interne adresser/serienumre offentlig på GitHub.

---

# 4. Opprett MariaDB-databasen

Opprett en MariaDB/MySQL-database hos webhotellet.

For en helt ny installasjon kan følgende skjema brukes.

> Har du allerede historikkdatabasen fra en eldre versjon, **ikke kjør dette CREATE-oppsettet over den**. Se `UPGRADE-ADMIN.md`.

```sql
CREATE TABLE printer_incidents (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    printer_id VARCHAR(160) NOT NULL,
    printer_name VARCHAR(160) NOT NULL,
    printer_ip VARCHAR(64) NULL,
    printer_model VARCHAR(160) NULL,

    severity ENUM(
        'critical',
        'warning',
        'toner',
        'paper',
        'other'
    ) NOT NULL,

    service_status ENUM(
        'none',
        'reported'
    ) NOT NULL DEFAULT 'none',

    service_reported_at DATETIME NULL,
    service_note VARCHAR(500) NULL,
    service_reported_by VARCHAR(100) NULL,

    error_code VARCHAR(64) NULL,
    error_message VARCHAR(500) NOT NULL,
    fingerprint CHAR(64) NOT NULL,

    opened_at DATETIME NOT NULL,
    resolved_at DATETIME NULL,

    consumable_color VARCHAR(16) NULL,
    paper_tray VARCHAR(32) NULL,

    toner_level_opened TINYINT UNSIGNED NULL,
    toner_level_last TINYINT UNSIGNED NULL,
    toner_level_resolved TINYINT UNSIGNED NULL,

    resolution_type ENUM(
        'resolved',
        'replaced',
        'refilled'
    ) NULL,

    replacement_confirmed_by_level TINYINT(1) NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    INDEX idx_printer_id (printer_id),
    INDEX idx_opened_at (opened_at),
    INDEX idx_resolved_at (resolved_at),
    INDEX idx_severity (severity),
    INDEX idx_service_active (service_status, resolved_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE printer_active_errors (
    printer_id VARCHAR(160) NOT NULL,
    fingerprint CHAR(64) NOT NULL,
    incident_id BIGINT UNSIGNED NOT NULL,
    last_seen_at DATETIME NOT NULL,
    missing_since DATETIME NULL,

    PRIMARY KEY (printer_id, fingerprint),
    UNIQUE KEY uq_active_incident (incident_id),

    CONSTRAINT fk_active_incident
        FOREIGN KEY (incident_id)
        REFERENCES printer_incidents(id)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE admin_login_attempts (
    ip_hash CHAR(64) NOT NULL PRIMARY KEY,
    failure_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    first_failed_at DATETIME NULL,
    last_failed_at DATETIME NULL,
    blocked_until DATETIME NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
```

---

# 5. Last opp frontend til webhotellet

Last innholdet i `Frontend/` til ønsket webmappe, for eksempel:

```text
/www/printstatus/
```

Da bør du få noe tilsvarende:

```text
/www/printstatus/
    index.html
    script.js
    stats.js
    style.css
    stylemob.css
    error_rules.json
    images/
    api/
    admin/
```

`printer_data.json` blir senere oppdatert automatisk fra Python-backend.

---

# 6. Konfigurer API-et

Lag:

```text
api/config.php
```

Eksempel:

```php
<?php

return [
    'db' => [
        'host' => 'DATABASENAVN.mysql.example.no',
        'name' => 'DATABASENAVN',
        'user' => 'DATABASEBRUKER',
        'pass' => 'DATABASEPASSORD',
        'charset' => 'utf8mb4',
    ],

    'logger_key' => 'DIN_LANGE_TILFELDIGE_HEMMELIGE_NOKKEL',
];
```

Generer gjerne logger-nøkkelen slik:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

Samme nøkkel skal brukes i backendens `credentials.json`.

**`api/config.php` skal ikke legges på GitHub.**

---

# 7. Konfigurer backendens credentials.json

Lag `Backend/credentials.json`:

```json
{
  "host": "sftp.example.com",
  "port": 22,
  "user": "SFTP-BRUKER",
  "pass": "SFTP-PASSORD",
  "path": "/www/printstatus/",
  "logger_url": "https://example.com/printstatus/api/process-printers.php",
  "logger_key": "SAMME_HEMMELIGE_NOKKEL_SOM_I_API_CONFIG"
}
```

Feltene betyr:

- `host`: SFTP-server.
- `port`: normalt `22`.
- `user` / `pass`: SFTP-innlogging.
- `path`: mappen som inneholder frontend.
- `logger_url`: full HTTPS-adresse til `process-printers.php`.
- `logger_key`: samme hemmelige nøkkel som i `api/config.php`.

**`credentials.json` skal ikke legges på GitHub.**

---

# 8. Test API og database

Åpne:

```text
https://example.com/printstatus/api/health.php
```

En fungerende installasjon skal returnere JSON med omtrent:

```json
{
  "ok": true,
  "logger_version": 3,
  "service_version": 1,
  "database": "connected",
  "rules": "loaded",
  "service_tracking": true,
  "admin_rate_limit": true
}
```

Hvis `health.php` gir HTTP 500:

- kontroller `api/config.php`
- kontroller databasehost/bruker/passord
- kontroller at SQL-tabellene finnes
- kontroller at PHP har PDO MySQL

---

# 9. Test historikkloggeren

Du kan teste logger-endepunktet fra en maskin med `curl`:

```bash
curl -X POST \
  -H 'X-Logger-Key: DIN_HEMMELIGE_NOKKEL' \
  https://example.com/printstatus/api/process-printers.php
```

Når kall uten body støttes, leser loggeren den eksisterende `printer_data.json` fra webhotellet.

Et vellykket svar vil ligne:

```json
{
  "ok": true,
  "logger_version": 3,
  "printers_processed": 7,
  "incidents_opened": 0,
  "incidents_resolved": 0
}
```

---

# 10. Start Python-backend

Fra `Backend/`:

```bash
python3 RicohReader.py
```

Standard polling-intervall er normalt 40 sekunder.

En vellykket runde skal omtrent vise:

```text
Data exported to printer_data.json successfully.
Uploaded printer_data.json to SFTP server at /www/printstatus/
Event logger HTTP 200: {...}
```

Python-backend:

1. leser alle printere via SNMP
2. bygger `printer_data.json`
3. laster filen opp via SFTP
4. sender samme snapshot til PHP-loggeren

SFTP/livevisning og historikklogger er uavhengige; en midlertidig loggerfeil skal ikke stoppe selve livevisningen.

---

# Feilklassifisering

Reglene ligger i:

```text
error_rules.json
```

Hovedgruppene er:

- `ignore`
- `critical`
- `warning`
- `toner`
- `paper`

Typisk oppsett:

```text
Energisparemodus         -> ignore
Papirstopp               -> critical
Deksel åpent             -> critical
Tom vanlig toner         -> critical
Full waste toner         -> critical
Lav / nesten tom toner   -> toner
Tomt papirmagasin        -> paper
```

Frontend og historikklogger bør bruke samme `error_rules.json`.

`critical` må ha prioritet foran den generelle tonerregelen slik at for eksempel:

```text
Tom: gul toner
```

ikke blir fanget som vanlig lav-toner-status.

---

# Historikk og statistikk

Åpne:

```text
https://example.com/printstatus/?stats=1
```

Her vises blant annet:

- nye og løste tekniske feil
- aktive kritiske feil
- warnings
- gjennomsnittlig løsningstid
- high-score per printer
- vanligste feil
- aktive tonerhendelser
- tonerbytter
- papirpåfyllinger
- hendelseslogg

Lav toner og tomme papirmagasiner behandles separat slik at de ikke ødelegger MTTR/statistikk for faktiske tekniske feil.

---

# Tonerbytte

En lav-toner-hendelse markeres ikke som byttet bare fordi SNMP-varselet mangler i ett snapshot.

Loggeren bruker en bekreftelsesperiode slik at reseating eller midlertidige SNMP-endringer ikke blir registrert som nytt tonerbytte.

Når et tonerbytte bekreftes lagres det som:

```text
resolution_type = replaced
```

Papirpåfylling lagres tilsvarende som:

```text
resolution_type = refilled
```

---

# Admin og service-markering

Admin ligger på:

```text
https://example.com/printstatus/admin/
```

Admin brukes til å merke en **aktiv teknisk hendelse** som:

```text
🔧 Meldt til service – avventer service
```

Den opprinnelige feilen beholder severity:

```text
critical + service_status=reported
```

En kritisk feil blir altså fortsatt regnet som kritisk selv om den er meldt til service.

Når feilen forsvinner via SNMP blir incidenten løst på vanlig måte, mens serviceinformasjonen beholdes i historikken.

---

## Opprett admin/config.php

Bruk `tools/password-generator.html` fra service/admin-pakken eller releasen.

Generatoren lager et oppsett med:

- PBKDF2-HMAC-SHA256
- tilfeldig salt
- 600 000 iterasjoner

Eksempelstruktur:

```php
<?php
declare(strict_types=1);

return [
    'username' => 'admin',

    'password' => [
        'iterations' => 600000,
        'salt' => 'BASE64_SALT',
        'hash' => 'BASE64_HASH',
    ],

    'session_name' => 'kopistatus_admin',
    'session_timeout_minutes' => 480,

    'max_failures' => 5,
    'failure_window_minutes' => 15,
    'block_minutes' => 15,
];
```

`admin/config.php` må ikke committes.

Admin-siden har blant annet:

- CSRF-beskyttelse
- HttpOnly-cookie
- SameSite=Strict
- Secure-cookie over HTTPS
- regenerering av session-ID ved innlogging
- rate limiting på feil innlogging

Den offentlige frontend-en har kun **read-only** tilgang til service-status.

---

# SERVICE-markering på nettsiden

Når en hendelse er merket som meldt til service vises den på printerkortet med:

```text
SERVICE
🔧 Meldt til service – avventer service
```

Det brukes gult sperrebånd både på vanlig/stort kort og kompakt visning.

Eventuelle service-notater bør regnes som offentlige, fordi de vises på statusnettsiden.

Ikke skriv personnavn, telefonnumre eller annen sensitiv informasjon i notatet.

---

# URL-flagg

Flere visningsvalg kan styres direkte fra URL-en.

## Statistikk

```text
?stats=1
```

## Tving dark mode

```text
?darkmode=1
```

## Automatisk dark season

```text
?darkseason=1
```

## Skjul lav toner og tomt papir

```text
?ignoreconsumables=1
```

Dette siste flagget påvirker kun frontendvisningen.

Det skjuler:

- lav/nesten tom toner
- tomt papirmagasin

men **ikke**:

- tom toner
- papirstopp
- deksel åpent
- tekniske kritiske feil

Backend og historikklogger fortsetter å logge hendelsene.

Flagg kan kombineres:

```text
?darkseason=1&ignoreconsumables=1
```

---

# Skrivebordsvarsler

Varsling er avslått som standard og lagres lokalt i nettleseren.

Når varsling er aktivert blir det sendt varsel ved **nye kritiske feil**.

Samme aktive feil varsles ikke på nytt hvert polling-intervall. Hvis feilen løses og senere kommer tilbake, kan den varsles på nytt.

`T` kan brukes som test av varslingslyden når fokus ikke står i et tekstfelt.

---

# PWA

Nettsiden kan installeres som app i nettlesere som støtter PWA/installasjon av nettsider.

Prosjektet trenger ikke Service Worker for selve livevisningen. Dette er bevisst for å unngå at `printer_data.json` blir liggende stale i cache.

---

# Kjente SNMP-begrensninger

Ricoh-maskiner kan oppføre seg forskjellig mellom modeller og firmware.

Blant annet:

- Papirnivå kan være utdatert mens maskinen er i energisparing.
- Enkelte papirmagasiner kan rapporteres samlet.
- Tekststrenger kan bruke ulik encoding.
- Feilkoder er ofte sikrere enn ren tekstmatching.

Hvis du finner nye koder eller formuleringer bør `error_rules.json` oppdateres.

---

# Sikkerhet / hva som ikke skal på GitHub

Ikke commit produksjonsversjoner av:

```text
Backend/credentials.json
Backend/Printers.pkl
Frontend/api/config.php
Frontend/admin/config.php
Frontend/printer_data.json
```

Disse kan inneholde:

- passord
- logger-nøkler
- databaseinformasjon
- IP-adresser
- serienumre
- interne printer-/lokasjonsnavn

Bruk eksempel-/templatefiler i repoet i stedet.

Det anbefales også å bruke HTTPS på hele frontend og admin.

---

# Backup

Før større oppgraderinger bør du ta backup av:

- MariaDB-databasen
- `api/config.php`
- `admin/config.php`
- `credentials.json`
- `Printers.pkl`
- eksisterende frontendmappe

Historikken ligger permanent i `printer_incidents`.

---

# Feilsøking

## `health.php` gir HTTP 500

Kontroller:

1. `api/bootstrap.php` finnes.
2. `api/config.php` finnes og har gyldig PHP-syntaks.
3. databasen kan nås.
4. PDO MySQL er aktivert.
5. SQL-migreringer er kjørt.

---

## Backend sier `Event logger HTTP 500`

Test først:

```text
/api/health.php
```

Hvis den feiler er problemet på PHP/database-siden, ikke i SFTP-opplastingen.

---

## Samme feil blir opprettet flere ganger

`printer_active_errors` skal holde styr på hvilke incidents som allerede er aktive.

To like snapshots etter hverandre skal normalt gi:

```json
"incidents_opened": 0,
"incidents_resolved": 0
```

på andre kjøring.

---

## En kritisk feil vises på live-siden, men ikke i admin

Admin bruker databasen, mens livevisningen bruker `printer_data.json`.

Sjekk aktive incidents:

```sql
SELECT
    id,
    printer_name,
    severity,
    error_code,
    error_message,
    opened_at,
    service_status
FROM printer_incidents
WHERE resolved_at IS NULL
ORDER BY opened_at DESC;
```

En hendelse som ble opprettet før en klassifiseringsregel ble korrigert kan fortsatt ha gammel `severity` i databasen.

---

# Opphav

Dette repoet er en videreutviklet/forket utgave av Ricoh Resource Monitor / Resource-Monitor-Web-UI, tilpasset norsk webvisning og videre utvidet med blant annet historikk, statistikk, PWA, varsling og serviceadministrasjon.
