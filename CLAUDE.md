# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js fault reporting system (felanmälan) for Falkenbergs kommun with 182 real properties. The application uses a **BFF (Backend for Frontend) architecture** to support both mock development and real FAST2 API integration.

## Essential Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack

# Build
npm run build            # Build for production
```

## BFF Architecture (Critical)

The application uses a **BFF pattern** that routes all API calls through a single entry point. This architecture is designed to be compatible with future Joomla integration.

### Request Flow

```
Browser (apiClient)
    ↓
    /api/bff/v1/[...endpoint]
    ↓
BFF Route Handler (app/api/bff/[...path]/route.ts)
    ├─ MOCK_API=true  → proxyToMockApi (lib/bff/proxyToMockApi.ts)
    │                   → fastaStrukturenStore + mockStore
    │
    └─ MOCK_API=false → proxyToRealApi (lib/bff/proxyToRealApi.ts)
                        → OAuth2 (lib/bff/oauth2Client.ts)
                        → FAST2 API
```

### Key Files

- **`app/api/bff/[...path]/route.ts`** - Single BFF entry point, routes based on MOCK_API flag
- **`lib/bff/proxyToMockApi.ts`** - Routes to mock stores (no HTTP)
- **`lib/bff/proxyToRealApi.ts`** - Routes to real FAST2 API with OAuth2
- **`lib/bff/oauth2Client.ts`** - OAuth2 client credentials flow for WSO2
- **`lib/apiClient.ts`** - Client-side API wrapper (no auth logic, BFF handles that)

### Why BFF?

1. **OAuth2 handled server-side** - Consumer secrets never exposed to browser
2. **Single switch** - Change `MOCK_API` flag to toggle between mock/real API
3. **Joomla-ready** - BFF logic can be ported to Joomla component controller
4. **Simplified client** - apiClient has no authentication logic

## Mock API Structure

Mock endpoints in `app/api/v1/` are **exact copies** of FAST2 API structure:
- All endpoints use `X-Auth-Token` header (never `Authorization: Bearer`)
- Request/response formats match FAST2 API spec (see `arbetsorderAPI.md`)
- Validation follows `ArbetsorderPostIn` schema (required: arbetsordertypKod, kundNr, objektId, ursprung)

**Important**: Mock API endpoints (`/api/v1/*`) are NOT used directly by the application. All requests go through BFF (`/api/bff/v1/*`).

## Environment Configuration

Copy `.env.example` to `.env.local`:

```bash
# Mock mode (development)
MOCK_API=true

# Real API mode (when API port opens)
MOCK_API=false
FAST2_BASE_URL=https://klient-test.fabo.se:8243
CONSUMER_KEY=your_key
CONSUMER_SECRET=your_secret
```

## Data Flow

### Properties (Fastigheter)
```
properties.json (182 geocoded properties)
  → fastaStrukturenStore.ts (generates spaces/units based on category)
  → BFF → apiClient.listObjekt()
  → ReportForm.tsx
```

### Work Orders (Arbetsordrar)
```
ReportForm.tsx
  → apiClient.createWorkOrder()
  → BFF → mockStore.createWorkOrder() or FAST2 API
  → Response
```

## FAST2 API Integration

The real FAST2 API uses two-step authentication:
1. **OAuth2 to WSO2** - BFF obtains OAuth2 token using consumer key/secret
2. **FAST2 API calls** - BFF uses OAuth2 token in `X-Auth-Token` header

This is all handled in `lib/bff/proxyToRealApi.ts` - the client never sees these tokens.

## Property Categories

Properties are categorized by their ID prefix:
- **101xx** - Administration buildings (Stadshuset, Rådhuset)
- **102xx** - Sports halls
- **103xx** - Schools
- **104xx** - Preschools
- **105xx** - Elderly care/group homes
- **106xx** - Special objects (museums, libraries)

`fastaStrukturenStore.ts` generates appropriate spaces (utrymmen) and units (enheter) based on category.

## Deep Linking

The application supports pre-filling forms via URL parameters:
```
/?objekt=10101 Stadshuset&rum=entre
```

This is used for QR codes placed at physical locations.

## Google Maps Integration

- Properties are geocoded with exact lat/lng coordinates
- `MapDialog.tsx` displays all properties on an interactive map
- Uses `@vis.gl/react-google-maps` library
- API key configured in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## Coordinate Transformation

Swedish properties use SWEREF99/RT90 coordinates. `lib/coordinateTransform.ts` converts these to WGS84 (lat/lng) for Google Maps using proj4.

## Future Joomla Integration

The BFF pattern is designed for Joomla:
- BFF logic → Joomla component controller
- OAuth2Client → Joomla library/helper class
- Token caching → Joomla session storage
- apiClient → Can be used as-is in React components embedded in Joomla

## Important Notes

- **Never write documentation files** - Focus on working code only
- **Mock API must be exact copy** of real FAST2 API structure
- **All client requests** go through BFF, never directly to `/api/v1/*`
- **OAuth2 is server-side only** - Client never handles OAuth2 tokens
