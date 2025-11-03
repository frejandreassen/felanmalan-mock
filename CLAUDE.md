# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Felanmälan (fault reporting system) for Falkenbergs kommun - a Next.js 15 application integrated with FAST2 API for creating and managing facility work orders.

**Core Functionality:**
- Create felanmälan (fault reports) or beställning (orders)
- Select property → space → unit hierarchy
- Automatic contact person handling
- Confidential work order filtering
- Real-time work order list

## Essential Commands

```bash
npm run dev              # Start dev server with Turbopack
npm run build            # Build for production
```

## Architecture: BFF Pattern (Critical)

The application uses a **Backend for Frontend (BFF)** pattern where all API calls are routed through a single server-side entry point.

### Request Flow

```
Browser (apiClient)
    ↓
/api/bff/[...path]
    ↓
BFF Route Handler (app/api/bff/[...path]/route.ts)
    ├─ OAuth2 Authentication (WSO2 Gateway)
    ├─ API Token Authentication (FAST2 Login)
    └─ FAST2 API
```

### Why BFF?

1. **Security** - OAuth2 secrets and credentials never exposed to browser
2. **Token Management** - Automatic refresh for both OAuth2 and API tokens
3. **Auto-Retry** - Clears caches and re-authenticates on 401/403 errors
4. **Joomla-Ready** - BFF logic can be ported to Joomla component controller
5. **Simplified Client** - apiClient has no authentication logic

### Key Files

**BFF Layer (Server-Side):**
- `app/api/bff/[...path]/route.ts` - Single entry point, handles all HTTP methods
- `lib/bff/proxyToRealApi.ts` - Routes to FAST2 API with dual authentication
- `lib/bff/oauth2Client.ts` - OAuth2 client credentials flow (WSO2)
- `lib/bff/apiAuthClient.ts` - Username/password login (FAST2)

**Client Layer:**
- `lib/apiClient.ts` - Client-side API wrapper (no auth logic)
- `components/ReportForm.tsx` - Work order creation form
- `components/ReportStatus.tsx` - Work order list

## Authentication Flow (Two-Tier)

The application uses **two separate authentication layers**:

### Layer 1: OAuth2 (WSO2 Gateway)

```typescript
// lib/bff/oauth2Client.ts
- Client credentials flow (Consumer Key/Secret)
- Token cached in memory
- Auto-refreshed with 60 second buffer
- Used as: Authorization: Bearer <oauth2_token>
```

### Layer 2: API Token (FAST2)

```typescript
// lib/bff/apiAuthClient.ts
- Username/password login to /ao-produkt/v1/auth/login
- Requires OAuth2 token for gateway access
- Token cached in memory
- Auto-refreshed when expired
- Used as: X-Auth-Token: <api_token>
```

### Auto-Retry on Auth Failure

```typescript
// lib/bff/proxyToRealApi.ts
if (await isAuthError(response)) {
  clearOAuth2Cache();      // Clear OAuth2 token
  clearApiTokenCache();    // Clear API token
  // Retry request (automatically re-authenticates)
}
```

This handles cases where tokens are invalidated externally (e.g., login via Postman).

## Environment Configuration

```bash
# FAST2 API
FAST2_BASE_URL=https://klient-test.fabo.se:8243
CONSUMER_KEY=xxx
CONSUMER_SECRET=xxx
USERNAME=xxx
PASSWORD=xxx

# Customer
NEXT_PUBLIC_KUND_NR=SERVA10311

# Google Maps (optional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx
```

## Work Order Structure

### Minimal Payload (What We Send)

```json
{
  "arbetsordertypKod": "F",           // F = Felanmälan, G = Beställning
  "kundNr": "SERVA10311",              // Customer number
  "objektId": "9123501",               // Property ID (required)
  "ursprung": "1",                     // Always "1" (Web Portal)
  "information": {
    "beskrivning": "Kranen läcker"    // Description (required)
  },
  "anmalare": {                        // Reporter (always logged-in user)
    "namn": "Frej Andreassen",
    "telefon": "0346-88 60 00",
    "epostAdress": "frej.andreassen@falkenberg.se"
  }
}
```

### Optional Fields

**Added only when applicable:**
- `utrymmesId` (number) - Space/room ID
- `enhetsId` (number) - Unit/equipment ID
- `externtNr: "CONFIDENTIAL"` - Marks work order as confidential

**For Beställning (orders):**
- Reference code is appended to description: `"beskrivning\n\nReferenskod: REF-123"`

### Contact Person Logic

- `anmalare` is always the logged-in user (mock: "Frej Andreassen")
- If user changes contact fields, it's appended to description:
  ```
  Original description...

  OBS! Kontaktperson i ärendet är:
  Namn: Anna Svensson
  Telefon: 070-123 45 67
  E-post: anna@example.com
  ```

### Confidential Filtering

BFF automatically filters confidential work orders from GET requests:

```typescript
// app/api/bff/[...path]/route.ts
if (method === 'GET' && fullPath.includes('/arbetsorder') && Array.isArray(data)) {
  return data.filter((workOrder: any) => workOrder.externtNr !== 'CONFIDENTIAL');
}
```

## FAST2 API Integration

### Endpoints Used

**Authentication:**
- `POST /ao-produkt/v1/auth/login` - Login with username/password

**Work Orders:**
- `POST /ao-produkt/v1/arbetsorder` - Create work order
- `GET /ao-produkt/v1/arbetsorder?objektId=X&status=PAGAR,REG,GODK&feltyp=F,U,T` - List work orders

**Property Hierarchy:**
- `POST /ao-produkt/v1/fastastrukturen/objekt/felanmalningsbara/uthyrningsbara` - List properties
- `GET /ao-produkt/v1/fastastrukturen/utrymmen?objektId=X` - List spaces
- `GET /ao-produkt/v1/fastastrukturen/enheter?utrymmesId=X` - List units

**File Transfer (in progress):**
- `POST /ao-produkt/v1/filetransfer/tempfile` - Upload temp file → returns `fileName`
- Attach `fileName` to work order (field name TBD)

### API Response Formats

**Create Work Order Response:**
```json
{ "arbetsorderId": 2453 }
```

**List Work Orders Response:**
```json
[
  {
    "arbetsorderId": 2453,
    "objektId": "9123501",
    "beskrivning": "...",
    "externtNr": "CONFIDENTIAL",  // Filtered by BFF if present
    ...
  }
]
```

## Data Transformation

### Real API → Our Format

**Objects (Properties):**
```typescript
// Real API: GraphQL-style with edges/nodes
{ edges: [{ node: { id, adress, typ, ... } }] }
// →
{ objekt: [{ id, objektNr, namn, adress, kategori, ... }] }
```

**Utrymmen (Spaces):**
```typescript
// Real API: Array with beskrivning
[{ id, beskrivning, rumsnummer, utrymmesTypKod }]
// →
{ utrymmen: [{ id, namn, objektId, typ }] }
```

**Enheter (Units):**
```typescript
// Real API: Array with beskrivning
[{ id, beskrivning, enhetstypBesk }]
// →
{ enheter: [{ id, namn, utrymmesId }] }
```

## File Upload Flow (In Progress)

1. Upload file to `/v1/filetransfer/tempfile` (multipart/form-data)
2. Get back `{ fileName: "..." }`
3. Attach fileName to work order payload
4. File gets permanently linked to work order

**Current Status:** Upload endpoint implemented, waiting for field name from API team.

## Important Notes

- **Never create documentation files** unless explicitly requested
- **All API calls go through BFF** - Never call FAST2 API directly from client
- **OAuth2 is server-side only** - Client never handles OAuth2 tokens
- **Token caching is in-memory** - Cleared on server restart (by design)
- **Confidential filtering is automatic** - BFF filters before returning to client

## Testing

**Test creating work orders:**
1. Select property (objekt)
2. Optionally select space (utrymme) and unit (enhet)
3. Enter description
4. Submit

**Test confidential filtering:**
1. Check "Sekretessmarkera" checkbox
2. Submit work order
3. Verify it doesn't appear in work order list

**Test beställning:**
1. Select "Beställning" radio button
2. Enter reference code (required)
3. Submit
4. Verify reference code is in description

## Future Joomla Integration

The BFF pattern is designed for Joomla:
- BFF logic → Joomla component controller
- OAuth2Client/ApiAuthClient → Joomla library classes
- Token caching → Joomla session storage
- apiClient → Can be used as-is in React components embedded in Joomla

## Development Workflow

1. All changes should maintain the BFF pattern
2. Never expose credentials to the browser
3. Keep client-side code simple (no auth logic)
4. Let BFF handle all security, caching, and retries
5. Test both normal and confidential work orders
6. Test with both felanmälan and beställning types
