# Utgave av web-grensesnittet for Ricoh resource monitor på Norsk bokmål.

## Du trenger
- **FTP eller SFTP**
- **Et webhotel**
- **En server som kan kjøre python (f.eks RaspberryPi)**
- Alle maskinene bør være konfigurert med Norsk visningspråk, selv om den tar de fleste feilkoder også på engelsk

---

##Ting du selv må forsyne:
1. **`credentials.json`**  
   Du trenger å lage en fil kalt `credentials.json`, som må plasseres i samme mappe som Python-backend `RicohReader.py`. Filen må ha følgende innhold:
   ```json
   {
     "host": "sftp.example.com",
     "port": "22",
     "user": "USERNAME",
     "pass": "PASSWORD",
     "path": "/Path/in/server"
   }

Dette trengs for å laste JSON opp via SFTP eller FTP til webhotellet ditt.

## Kontrollpanel-funksjoner:
Når du kjører `RicohReader.py`, har du tilgang til følgende kontrollpanel-funksjoner:

- **Trykk 1**: Endre intervallet for hvor ofte data oppdateres.
- **Trykk 2**: Generer en JSON-fil som lar deg legge til nye kopimaskiner manuelt.
  - Rediger JSON-filen for å legge til maskinene dine, lagre den, og start Python-skriptet på nytt for å aktivere endringene.
- **Trykk 3**: Avslutt skriptet.

---

## Viktige påminnelser:
- Pass på at `credentials.json`-filen er riktig formatert og plassert i samme katalog som `RicohReader.py`.
- Maskinnavnene i JSON og PNG-bildefilene må samsvare nøyaktig for at alt skal fungere korrekt.
- Husk å kjøre:
  ```bash
  pip install -r requirements.txt
