# Utvecklings-TODO

## Pågående arbete - Next.js felanmälningsapp

### Prioriterat

#### Datahantering
- [ ] Filtrera så endast serviceanmälningsbara objekt visas (ej privata hyresbostäder etc.)
  - Behöver metod för filtrering från API eller lokal filtrering
  - Identifiera vilka objekt som ska vara tillgängliga för felanmälan

#### Formulär och användarupplevelse
- [ ] Förbättra formulärvalidering (obligatoriska fält)
- [ ] Implementera bilduppladdning till mock API
- [ ] Förbättra felmeddelanden och användarfeedback
- [ ] Lägg till laddningsindikatorer under API-anrop

#### Design och tillgänglighet
- [ ] Responsiv design för mobil och surfplatta
- [ ] Tillgänglighetsgranskning (WCAG)
- [ ] Förbättra kontraster och läsbarhet

#### Testning
- [ ] Användartester med riktiga användare
- [ ] Testa QR-kod funktionalitet på plats
- [ ] Cross-browser testing

### Framtida (Fas 2-3)

#### Backend-integration
- [ ] Koppla till riktigt FAST2 API
- [ ] Implementera autentisering
- [ ] E-postnotifikationer

#### Joomla-integration
- [ ] Exportera som återanvändbara komponenter
- [ ] Deployment i produktionsmiljö

## Klart ✅

- ✅ Felanmälningsformulär med dynamiska fält
- ✅ Dynamisk hämtning av fastigheter från API
- ✅ Dynamisk hämtning av utrymmen baserat på vald fastighet
- ✅ Dynamisk hämtning av enheter baserat på valt utrymme
- ✅ Mock API (simulerar FAST2 API-struktur)
- ✅ 182 fastigheter från Ekofast (mock-data)
- ✅ Google Maps-integration
- ✅ Koordinattransformation (SWEREF99/RT90 → WGS84)
- ✅ Statusvy med live-data från API
- ✅ QR-kod generator
- ✅ Deep linking med URL-parametrar