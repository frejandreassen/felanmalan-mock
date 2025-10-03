# Felanmälan - Falkenbergs kommun (Mock)

Ett mockup-projekt för att testa felanmälningssystemet för Falkenbergs kommun. Byggt med Next.js, TypeScript och Tailwind CSS med **182 riktiga fastigheter**, Google Maps-integration och **Mock Arbetsorder API**.

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

### 1. Alla 182 fastigheter från Ekofast

Alla fastigheter från `fastigheter_ekofast.csv` finns med:
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

### 3. Smart formulär med dynamiska fält

Formuläret anpassar sig baserat på fastighetskategori:
- **Utrymme**: Inomhus, Utomhus, Skadegörelse
- **Lokal/rum**: Filteras baserat på vald fastighet och utrymme
  - Skolor: Klassrum, Storkök, WC
  - Förskolor: Lekrum, Sovrum
  - Idrottshallar: Gymnastiksal, Omklädningsrum, Dusch
  - Äldreboenden: Boenderum, Gemensamt utrymme
  - Förvaltning: Kontor, Mötesrum
- **Enhet/System**: Belysning, Ventilation, Värme, Lekutrustning, etc.

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

### 7. 🔌 Mock Arbetsorder API

**Helt fungerande mock-API** baserat på FAST2 Arbetsorder API v1.8:
- **POST /api/v1/auth/login** - Autentisering
- **POST /api/v1/arbetsorder** - Skapa arbetsorder
- **GET /api/v1/arbetsorder** - Lista arbetsordrar (med filter)
- **GET /api/v1/arbetsorder/:id** - Hämta specifik arbetsorder

Arbetsordrar lagras i minnet (in-memory store) och persisterar under serverns livstid.

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
│   ├── api/v1/             # Mock API endpoints
│   │   ├── auth/login/     # Autentisering
│   │   └── arbetsorder/    # Arbetsorder endpoints
│   ├── layout.tsx          # Root layout med Google Maps script
│   ├── page.tsx            # Huvudsida med deep linking och Suspense
│   └── globals.css         # Globala styles
├── components/
│   ├── Header.tsx          # Header med navigation
│   ├── ReportForm.tsx      # Felanmälningsformulär med API-integration
│   ├── ReportStatus.tsx    # Ärendestatus med live-data från API
│   ├── Combobox.tsx        # Återanvändbar combobox-komponent
│   └── MapDialog.tsx       # Kartdialog med Google Maps
├── lib/
│   ├── data.ts             # Data och hjälpfunktioner
│   ├── properties.json     # Alla 182 fastigheter med geocoding
│   ├── apiClient.ts        # API-klient för arbetsorder API
│   └── mockStore.ts        # In-memory datalagring för arbetsordrar
└── ...
```

## 🛠️ Geocoding-script

För att uppdatera geocoding-data (om du lägger till nya fastigheter):

```bash
cd /Users/frej/Utvecklingsavd/felanmalan
GOOGLE_MAPS_API_KEY=your_key node geocode-properties.js
```

Detta skapar `fastigheter_ekofast_geocoded.csv` med lat/lng för alla fastigheter.

## 🔧 Anpassa data

### Lägga till nya fastigheter

1. Redigera `/Users/frej/Utvecklingsavd/felanmalan/fastigheter_ekofast.csv`
2. Kör geocoding-scriptet (se ovan)
3. Konvertera till JSON (scriptet gör detta automatiskt)
4. Rebuilda appen

### Lägga till nya rum/utrymmen

Redigera `lib/data.ts`:

```typescript
export const rooms: Room[] = [
  { id: 'nytt-rum', propertyId: 'skolor', name: 'Nytt rum', type: 'inomhus' },
  // ...
];
```

### Lägga till nya enheter/system

Redigera `lib/data.ts`:

```typescript
export const units: Category[] = [
  { id: 'ny-enhet', name: 'Ny enhet' },
  // ...
];
```

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

## 📝 Nästa steg

Möjliga förbättringar:
1. ✅ Geocoding av alla fastigheter - **KLART**
2. ✅ Kartintegration - **KLART**
3. ✅ Mock Arbetsorder API - **KLART**
4. ✅ Formulär kommunicerar med API - **KLART**
5. ✅ Statusvy visar live-data - **KLART**
6. Ersätt mock API med riktigt FAST2 API
7. Bilduppladdning till server
8. E-postnotifikationer
9. Statusuppdateringar i realtid med WebSockets
10. Autentisering för internanvändare
11. Dashboard för att hantera inkomna ärenden
12. Filtrera fastigheter efter kategori på kartan
13. Exportera QR-koder för alla fastigheter automatiskt

## 📄 Licens

Detta är ett mockup-projekt för testning och utveckling.
