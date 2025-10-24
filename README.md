# Felanmälan - Falkenbergs kommun

En Next.js-applikation för felanmälan med **182 riktiga fastigheter**, Google Maps-integration och mock API. Projektet är under utveckling och innehåller en fungerande felanmälningsform.

## 🚀 Kom igång

Installera dependencies:

```bash
npm install
```

Starta utvecklingsservern:

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare.

## ✨ Funktioner

### 1. Dynamisk fastighetshämtning från API

Formuläret hämtar fastigheter dynamiskt från API:t vid laddning:
- **Just nu**: Mock API serverar 182 fastigheter från `properties.json`
- **I framtiden**: Samma anrop går till riktiga FAST2 API:t
- API endpoint: `GET /api/v1/fastastrukturen/objekt`
- Stödjer filtrering per kategori: `?kategori=skola`

Fastighetskategorier:
- Skolor (103xx)
- Förskolor (104xx)
- Idrottshallar (102xx)
- Äldreboenden/Gruppbostäder (105xx)
- Förvaltningsobjekt (101xx)
- Specialobjekt (106xx)
- Och många fler...

### 2. 📍 Kartfunktion med Google Maps

**Ny funktionalitet!** Klicka på "Hitta på karta"-knappen för att:
- Se alla fastigheter på en interaktiv karta
- Klicka på markörer för att se fastighetsinformation
- Välj fastighet direkt från kartan
- Automatisk geolokalisering baserad på verkliga adresser

Alla fastigheter är geocodade med exakta koordinater från Google Maps API.

### 3. Smart formulär med dynamiska fält från API

Formuläret hämtar och anpassar fält baserat på vald fastighet:
- **Utrymmen**: Hämtas från API baserat på vald fastighet och typ (inomhus/utomhus)
  - API endpoint: `GET /api/v1/fastastrukturen/utrymmen?objektId={id}&typ={typ}`
  - Skolor: Klassrum, Matsal, Storkök, WC, Skolgård
  - Förskolor: Avdelningar, Kök, Hall, Lekplats
  - Idrottshallar: Gymnastiksal, Omklädningsrum, Dusch
  - Äldreboenden: Boenderum, Matsal, Trädgård
  - Förvaltning: Kontor, Konferensrum, Reception

- **Enheter**: Hämtas från API baserat på valt utrymme
  - API endpoint: `GET /api/v1/fastastrukturen/enheter?utrymmesId={id}`
  - Belysning, Ventilation, Värme, El
  - Köksutrustning (i kök)
  - Sanitära enheter (i WC/dusch)
  - Lekutrustning (på lekplatser)

### 4. Deep Links (Smarta länkar)

Du kan förifylla formuläret med URL-parametrar för att skapa QR-koder eller direktlänkar:

**Exempel:**

```
http://localhost:3000/?objekt=10101 Stadshuset&rum=entre
http://localhost:3000/?objekt=10302 Vinbergsskolan inkl Gula villan&rum=klassrum
http://localhost:3000/?objekt=KLOCKAREGATAN 27
```

**Tips för QR-koder:**
1. Generera QR-kod för specifik fastighet + rum
2. Sätt upp QR-koden på plats (t.ex. i entrén, vid toaletter)
3. När användare scannar koden öppnas formuläret med förvalda värden
4. Användaren behöver bara beskriva felet och skicka in!

### 5. Combobox-fält med sökning

Alla dropdown-fält är implementerade som comboboxes:
- Klicka för att visa alla alternativ
- Skriv för att filtrera och söka
- Snabbt hitta rätt alternativ bland hundratals fastigheter

### 6. Statusvy med live-data

Visar pågående och nya ärenden med:
- **Live-uppdatering** från mock API
- Filtrering per status (Alla, Registrerad, Pågående)
- Information om rapportör och tidpunkt
- Visuell färgkodning per status
- Uppdateringsknapp för att hämta senaste data

### 7. 🔌 Fungerande Mock API

**Fullständigt mock-API** som simulerar FAST2 API:
- **POST /api/v1/auth/login** - Autentisering
- **GET /api/v1/fastastrukturen/objekt** - Hämta fastigheter
- **GET /api/v1/fastastrukturen/utrymmen** - Hämta utrymmen för fastighet
- **GET /api/v1/fastastrukturen/enheter** - Hämta enheter för utrymme
- **POST /api/v1/arbetsorder** - Skapa arbetsorder
- **GET /api/v1/arbetsorder** - Lista arbetsordrar (med filter)
- **GET /api/v1/arbetsorder/:id** - Hämta specifik arbetsorder

Mock-data genereras från `properties.json` och lagras i minnet under serverns livstid.
**Formuläret använder samma API-anrop som kommer användas mot riktiga API:t.**

## 📊 Datastruktur

### Fastighetskategorier (baserat på fastighetskod)

- **101xx**: Förvaltningsobjekt (Stadshuset, Rådhuset, etc.)
- **102xx**: Idrottshallar
- **103xx**: Skolor
- **104xx**: Förskolor
- **105xx**: Äldreboenden och gruppbostäder
- **106xx**: Specialobjekt (Museum, bibliotek, etc.)
- **108xx**: Saneringsfastigheter
- **109xx**: Paviljonger

### Geocoded Data

Alla fastigheter har:
- Exakt latitud och longitud
- Fullständig adress från Google Maps
- Automatisk kategorisering baserat på fastighetskod

## 🗂️ Projektstruktur

```
felanmalan-mock/
├── app/
│   ├── api/v1/                    # Mock API endpoints (simulerar FAST2 API)
│   │   ├── auth/login/            # Autentisering
│   │   ├── fastastrukturen/       # Fastighetsstruktur-endpoints
│   │   │   ├── objekt/            # GET fastigheter
│   │   │   ├── utrymmen/          # GET utrymmen
│   │   │   └── enheter/           # GET enheter
│   │   └── arbetsorder/           # Arbetsorder endpoints (POST/GET)
│   ├── layout.tsx                 # Root layout med Google Maps script
│   ├── page.tsx                   # Huvudsida med deep linking
│   └── globals.css                # Globala styles
├── components/
│   ├── Header.tsx                 # Header
│   ├── ReportForm.tsx             # Formulär (hämtar data från API)
│   ├── ReportStatus.tsx           # Ärendestatus (hämtar från API)
│   ├── Combobox.tsx               # Återanvändbar combobox
│   └── MapDialog.tsx              # Kartdialog med Google Maps
├── lib/
│   ├── properties.json            # 182 fastigheter (källa för mock API)
│   ├── fastaStrukturenStore.ts    # Mock data store (används av API)
│   ├── apiClient.ts               # API-klient (används av formulär)
│   ├── mockStore.ts               # In-memory lagring för arbetsordrar
│   └── coordinateTransform.ts     # SWEREF99/RT90 → WGS84 transformation
└── ...
```

**Dataflöde:**
```
ReportForm (komponent)
  → apiClient.listObjekt()
    → GET /api/v1/fastastrukturen/objekt
      → fastaStrukturenStore.getAllObjekt()
        → properties.json
```

## 🛠️ Geocoding-script

För att uppdatera geocoding-data (om du lägger till nya fastigheter):

```bash
cd /Users/frej/Utvecklingsavd/felanmalan
GOOGLE_MAPS_API_KEY=your_key node geocode-properties.js
```

Detta skapar `fastigheter_ekofast_geocoded.csv` med lat/lng för alla fastigheter.

## 🔧 Hur mock-data fungerar

### Från statisk CSV till dynamiskt API

1. **properties.json** innehåller 182 geocodade fastigheter
2. **fastaStrukturenStore.ts** läser JSON och genererar:
   - Objekt (fastigheter)
   - Utrymmen (rum/lokaler) baserat på kategori
   - Enheter (system) baserat på utrymmestyp
3. **API routes** exponerar denna data via REST endpoints
4. **Formuläret** hämtar data dynamiskt via API-anrop

### När ska properties.json uppdateras?

**Inte ofta!** I produktion kommer data från riktiga API:t.
Mock-data används bara för utveckling och tester.

Om du behöver uppdatera mock-data:
1. Lägg till/redigera i `properties.json`
2. Starta om dev-servern (`npm run dev`)
3. Mock API:t serverar nya data automatiskt

## 📱 Användning för användartester

### Scenario 1: QR-koder på plats
1. Generera QR-kod: `http://localhost:3000/?objekt=10311 Tångaskolan&rum=klassrum`
2. Sätt upp QR-koden i klassrummet
3. Användare scannar → formuläret är förifyllt → skriver bara beskrivning → skickar

### Scenario 2: Kartbaserad sökning
1. Användare vet inte fastighetskoden
2. Klickar "Hitta på karta"
3. Hittar fastigheten visuellt
4. Väljer från kartan

### Scenario 3: Fritextsökning
1. Användare börjar skriva "Tånga..."
2. Comboboxen filtrerar automatiskt
3. Väljer "Tångaskolan (10311 Tångaskolan)"

### Scenario 4: Deep link från situationsplan
1. Digital situationsplan med klickbara områden
2. Varje område länkar till: `?objekt=X&rum=Y`
3. Snabb rapportering direkt från planen

## 🌐 API-nycklar

### Google Maps API
Nuvarande nyckel finns i:
- `app/layout.tsx` (för kartvisning)
- `/Users/frej/Utvecklingsavd/felanmalan/geocode-properties.js` (för geocoding)

**OBS**: I produktion bör du:
1. Sätta nyckel som environment variable
2. Begränsa nyckel till din domän
3. Aktivera endast nödvändiga API:er (Maps JavaScript API, Geocoding API)

## 🚀 Teknisk stack

- **Next.js 15** - React-ramverk med App Router & API Routes
- **TypeScript** - Typsäkerhet
- **Tailwind CSS** - Styling
- **Google Maps JavaScript API** - Kartfunktionalitet
- **Mock Arbetsorder API** - Baserat på FAST2 API v1.8
- **182 geocodade fastigheter** - Verklig data från Ekofast

## 🔌 API Användning

### Testa API:et manuellt

```bash
# 1. Autentisera
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Svar: {"token":"mock_token_...","expires_in":43200}

# 2. Skapa arbetsorder
curl -X POST http://localhost:3000/api/v1/arbetsorder \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: mock_token_..." \
  -d '{
    "objekt": {
      "id": "10101 Stadshuset",
      "namn": "Stadshuset",
      "adress": "Rådhustorget 3c, 311 31 Falkenberg"
    },
    "information": {
      "beskrivning": "Kranen läcker i köket"
    }
  }'

# 3. Hämta arbetsordrar
curl -X GET http://localhost:3000/api/v1/arbetsorder \
  -H "X-Auth-Token: mock_token_..."
```

### Datamodell (Arbetsorder)

```typescript
{
  id: string;                    // Ärendenummer (auto-genererat)
  objekt: {
    id: string;                  // Fastighets-ID
    namn: string;                // Fastighetsnamn
    adress?: string;             // Adress
  };
  utrymme?: {                    // Valfritt
    id: string;
    namn: string;
  };
  enhet?: {                      // Valfritt
    id: string;
    namn: string;
  };
  information: {
    beskrivning: string;         // Beskrivning av felet (required)
    kommentar?: string;          // Extra kommentar
  };
  status: {
    statusKod: 'REG' | 'GODK' | 'PAGAR' | 'UTFÖRD' | 'MAK';
    statusBesk: string;
  };
  arbetsorderTyp: {
    arbetsordertypKod: 'F' | 'U' | 'G';
    arbetsordertypBesk: string;
  };
  prio: {
    prioKod: '10' | '30';       // 10=Normal, 30=Akut
    prioBesk: string;
  };
  // ... och mer
}
```

## 📝 Utvecklingsplan

### Fas 1: Grundläggande Next.js app (Pågående)
- ✅ Felanmälningsformulär
- ✅ 182 fastigheter med geocoding
- ✅ Google Maps-integration
- ✅ Mock API för utveckling
- ✅ Statusvy
- ⏳ Bilduppladdning
- ⏳ Formulärvalidering och förbättringar
- ⏳ Responsiv design och tillgänglighet

### Fas 2: Backend-integration (Framtida)
- Integration med FAST2 Arbetsorder API
- Autentisering
- Databaslagring
- E-postnotifikationer

### Fas 3: Joomla-integration (Framtida)
- Exportera som React-komponenter
- Joomla-modul
- Deployment i befintlig infrastruktur

## 🎯 Aktuell status

Detta projekt är under aktiv utveckling. Fokus är att bygga en fullständig och fungerande felanmälningsapplikation i Next.js med mock-data.

**Nästa steg:**
1. Förbättra formulärvalidering
2. Implementera bilduppladdning
3. Förbättra responsiv design
4. Användartester

## 📄 Licens

Utvecklingsprojekt för Falkenbergs kommun.
