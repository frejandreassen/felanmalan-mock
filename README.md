# Felanmälan - Fault Reporting System

A Next.js application for reporting and managing facility faults for Falkenbergs kommun, integrated with FAST2 API.

## Features

- **Create Work Orders**: Report faults (felanmälan) or place orders (beställning)
- **Object Hierarchy**: Select property → space → unit
- **Contact Management**: Specify different contact person for follow-up
- **Confidential Cases**: Mark sensitive work orders as confidential (automatically filtered from lists)
- **Work Order List**: View active work orders for selected property
- **File Upload**: Attach images to work orders (in progress)

## Architecture

### BFF Pattern (Backend for Frontend)

All API calls go through a BFF layer that handles authentication:

```
Browser (apiClient)
    ↓
/api/bff/[...path]
    ↓
BFF Route Handler
    ├─ OAuth2 Authentication (WSO2 Gateway)
    ├─ API Token Management (FAST2 Login)
    └─ FAST2 API
```

**Why BFF?**
- OAuth2 secrets never exposed to browser
- Automatic token refresh on expiration
- Easy to port to Joomla (BFF → Joomla component controller)
- Centralized security and error handling

### Key Files

**Frontend:**
- `app/page.tsx` - Main page with form and work order list
- `components/ReportForm.tsx` - Work order creation form
- `components/ReportStatus.tsx` - Work order list display
- `lib/apiClient.ts` - Client-side API wrapper

**Backend (BFF):**
- `app/api/bff/[...path]/route.ts` - Single API entry point
- `lib/bff/proxyToRealApi.ts` - Routes to FAST2 with OAuth2
- `lib/bff/oauth2Client.ts` - OAuth2 token management (WSO2)
- `lib/bff/apiAuthClient.ts` - API username/password authentication

## Setup

### Prerequisites

- Node.js 18+
- FAST2 API credentials (Consumer Key/Secret, Username/Password)
- Customer number (kundNr)
- Google Maps API key (optional, for map features)

### Installation

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

4. Configure environment variables in `.env.local`:
   ```env
   # App Password Protection (optional - leave empty to disable)
   APP_PASSWORD=your_password_here

   # FAST2 API
   FAST2_BASE_URL=https://klient-test.fabo.se:8243
   CONSUMER_KEY=your_consumer_key
   CONSUMER_SECRET=your_consumer_secret
   USERNAME=your_username
   PASSWORD=your_password

   # Customer
   NEXT_PUBLIC_KUND_NR=SERVA10311

   # Google Maps (optional)
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
   ```

   **Note:** If `APP_PASSWORD` is set, users will be required to enter this password to access the application. Leave it empty to disable password protection.

5. Start development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Password Protection

The application includes optional password protection to restrict access.

### Enable Password Protection

Add `APP_PASSWORD` to your `.env.local`:
```env
APP_PASSWORD=my_secret_password
```

When enabled:
- Users will be redirected to `/login` on first visit
- Must enter the correct password to access the application
- Password is stored in an httpOnly cookie for 24 hours
- "Logga ut" button appears in the header to clear the session

### Disable Password Protection

Remove or leave `APP_PASSWORD` empty in `.env.local`:
```env
APP_PASSWORD=
```

Or simply omit the variable entirely.

## Usage

### Creating a Felanmälan (Fault Report)

1. Select **Felanmälan** radio button
2. Choose property (objekt) from dropdown
3. Optionally select space (utrymme) and unit (enhet)
4. Enter description of the fault
5. Update contact information if needed
6. Optionally check "Sekretessmarkera" for confidential cases
7. Click **Skicka felanmälan**

### Creating a Beställning (Order)

1. Select **Beställning** radio button
2. Enter reference code (required for orders)
3. Choose property and optional space/unit
4. Enter description
5. Update contact information if needed
6. Click **Skicka beställning**

### Contact Person Logic

- Form is pre-populated with the logged-in user (currently mock data: "Frej Andreassen")
- This user is always sent as `anmalare` (reporter)
- If you change the contact information, it will be appended to the description field:
  ```
  Original description...

  OBS! Kontaktperson i ärendet är:
  Namn: Anna Svensson
  Telefon: 070-123 45 67
  E-post: anna@example.com
  ```

### Confidential Work Orders

Check "Sekretessmarkera arbetsorder" to mark a work order as confidential. Confidential work orders:
- Are marked with `externtNr: "CONFIDENTIAL"` in the API
- Are automatically filtered from work order lists by the BFF
- Are only visible to authorized personnel in FAST2

## API Integration

### Two-Tier Authentication

The application uses two layers of authentication:

1. **OAuth2 (WSO2 Gateway)**
   - Client credentials flow (Consumer Key/Secret)
   - Token cached and auto-refreshed (60 sec buffer)
   - Used as Bearer token for API Gateway access

2. **API Token (FAST2)**
   - Username/password login to `/ao-produkt/v1/auth/login`
   - Returns API token used in `X-Auth-Token` header
   - Token cached and auto-refreshed when expired
   - Automatic re-login on 401/403 errors

### Endpoints Used

- `POST /ao-produkt/v1/auth/login` - User authentication
- `POST /ao-produkt/v1/arbetsorder` - Create work order
- `GET /ao-produkt/v1/arbetsorder` - List work orders
- `POST /ao-produkt/v1/fastastrukturen/objekt/felanmalningsbara/uthyrningsbara` - List properties
- `GET /ao-produkt/v1/fastastrukturen/utrymmen` - List spaces
- `GET /ao-produkt/v1/fastastrukturen/enheter` - List units
- `POST /ao-produkt/v1/filetransfer/tempfile` - Upload file (in progress)

### Work Order Payload

**Minimal felanmälan:**
```json
{
  "arbetsordertypKod": "F",
  "kundNr": "SERVA10311",
  "objektId": "9123501",
  "ursprung": "1",
  "information": {
    "beskrivning": "Kranen läcker"
  },
  "anmalare": {
    "namn": "Frej Andreassen",
    "telefon": "0346-88 60 00",
    "epostAdress": "frej.andreassen@falkenberg.se"
  }
}
```

**Optional fields (added when selected):**
- `utrymmesId` - Space/room ID
- `enhetsId` - Unit/equipment ID
- `externtNr: "CONFIDENTIAL"` - Marks as confidential

**Beställning (adds reference code to description):**
```json
{
  "arbetsordertypKod": "G",
  "information": {
    "beskrivning": "Install equipment\n\nReferenskod: REF-123"
  },
  ...
}
```

## Build & Deploy

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Deployment

This application is designed to run on Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

For Joomla integration, the BFF logic can be ported to a Joomla component controller.

## Project Structure

```
felanmalan-mock/
├── app/
│   ├── api/bff/[...path]/         # BFF API entry point
│   ├── page.tsx                   # Main page
│   └── globals.css                # Global styles
├── components/
│   ├── ReportForm.tsx             # Work order form
│   ├── ReportStatus.tsx           # Work order list
│   ├── Combobox.tsx               # Reusable combobox
│   ├── MapDialog.tsx              # Map dialog
│   └── Header.tsx                 # Header
├── lib/
│   ├── apiClient.ts               # Client-side API wrapper
│   ├── bff/
│   │   ├── proxyToRealApi.ts      # FAST2 proxy with auth
│   │   ├── oauth2Client.ts        # OAuth2 token management
│   │   └── apiAuthClient.ts       # API login management
│   ├── fastaStrukturenStore.ts    # Types and helpers
│   └── properties.json            # Property data (for reference)
└── ...
```

## License

Proprietary - Falkenbergs kommun
