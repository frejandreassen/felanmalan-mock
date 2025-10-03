This document outlines the API for work orders (`API arbetsorder`) version 1.8, developed by David A-Stattin for SWG Nordic Housing AB. The API is REST-based and uses methods like GET, POST, PUT, and DEL.

---

## 1. API Overview & Authentication

### 1.1 Purpose
To allow third-party systems to create, retrieve, and update work orders, primarily of the type **Fault Report** (`Felanmälan`) and **Maintenance** (`Underhåll`), with FAST2 as the core system.

### 1.2 Technology
REST-API (GET, POST, PUT, DEL). Supports `swagger.json` download (OpenAPI standard) for testing and implementation.

### 1.3 Authentication
| FAST2 Version | Method | Description |
| :--- | :--- | :--- |
| **Classic (<= 12)** | Two-Step OAuth2 | **Step 1: API Client Login** to WSO2 API Gateway (POST `/oauth2/token` with `client_credentials`). **Step 2: Resource Login** to Fast2 Auth-API (POST `{api-url}/ao-produkt/v1/auth/login` using WSO2 token in `Authorization: Bearer`). Returns Fast2 token for use in `X-Auht-Token`. |
| **Version >= 13** | Direct Auth-API | WSO2 is *removed*. Authentication is **direct** with the FAST2 resource via the Auth-API. Access can be restricted by whitelisting IP addresses/networks (CIDR-notation). |

---

## 2. Work Order Concept (`Arbetsorder`)

### 2.1 Work Order Status (`Arbetsorderstatus`)
A work order follows a lifecycle. Status can revert to a previous step as long as it is not `Utförd`.

| Status Code | Description (Swedish) | Description (English) | Transition |
| :--- | :--- | :--- | :--- |
| **REG** | Registrerad | Registered | Initial status upon creation. |
| **GODK** | Beställd | Ordered | Set when required information is complete and sent to the executor. |
| **PAGAR** | Accepterad | Accepted | Executor has received and started the work. |
| **UTFÖRD** | Utförd | Executed/Finished | Work is completed. |
| **MAK** | Makulerad | Cancelled | Can be set anytime before `Utförd` if no longer relevant. |
| **ÖVERF** | Fakturerad | Invoiced | Set when an external party has invoiced for the completed work. |

### 2.2 Executor (`Utförare`)
A link to a "RESURS" (Resource), which can be an individual, a group (team), or an external company. *Retrieval of available resources is not available in API v1.4.*

### 2.4 Fault Description (`Felbeskrivning`)
Work orders are linked to an `Objekt` (Object), and ideally also to an `Utrymme` (Space) and an `Enhet` (Unit).

| Field | Purpose | Visibility (Typical) |
| :--- | :--- | :--- |
| **Beskrivning** | Description of the required action/fault. | All involved parties. |
| **Kommentar** | Information for the executor (e.g., "pets in object"). | All involved parties. |
| **Anmärkning** | Company-specific remark. | Internal staff only. |
| **Åtgärd** | Description of the action taken upon execution. | N/A |

### 2.5 Customer and Contact Info
The work order is linked to a `Kund` (Customer), usually the reporter. Separate text fields handle information about a non-customer reporter (`annan anmälare`).

### 2.6 Contact Persons (`Kontaktpersoner`)
Additional contact persons (e.g., foreman, guardian) can be created, updated, or deleted on the work order.

### 2.7 Events (`Händelser`)
Used to log additional information or lifecycle events. Files can also be linked to events.

### 2.8 Priority (`Prio`)
Work orders have a priority code. System provides a default if none is sent during creation. *No endpoint to retrieve possible codes.*

| Code | Description |
| :--- | :--- |
| **10** | Normal |
| **30** | Akut (Acute) |

### 2.9 Access Information (`Tillträdesinformation`)
Indicates if the executor has access to the object. System provides a default if none is sent during creation. *No endpoint to retrieve possible codes.*

| Code | Description |
| :--- | :--- |
| **N** | Nej (No), executor is NOT allowed to enter. |
| **J** | Ja (Yes), executor IS allowed to enter. |

### 2.10 Fault Report becomes Maintenance
Handled by changing the work order type from `Felanmälan` to `Underhåll`.

### 2.11 Work Order Types (`Arbetsordertyper`)
Categorizes work orders, affecting phrases, economics, and system behavior. *No endpoint to retrieve possible types in API v1.4.*

| Code | Type (Swedish) | Description | Create via API? |
| :--- | :--- | :--- | :--- |
| **F** | Felanmälan | Pure fault report. No impact on linked unit upon execution. | Yes |
| **U** | Underhåll | Maintenance. Updates unit maintenance info or performs unit replacement. | Yes |
| **T** | Tillval | Option order. System-created only. | No |
| **G** | Eget | Own (internal staff) work order. | Yes |
| **Myndighet** | Authority | System-created only. | No |

### 2.13 Accounting (`Kontering`)
Fields for accounting/posting, primarily for vendor invoice proposals. Values can be updated via API v1.4.

### 2.15 Time Booking (`Tidsbokning`)
Can be manual or via the booking module, which supports:
*   Resource proposal (`Resursförslag`).
*   Fetching available times from the resource calendar.
*   Booking (`Boka på`) and unbooking (`Avboka`).

---

## 3. Fixed Structure (`Fasta strukturen`)
The hierarchical model used in FAST2:

| Component | Description |
| :--- | :--- |
| **Företag** | Managed company (juridical entity). |
| **Fastighet** | Juridical property (Land Registry). |
| **Byggnad** | Building/Hull. |
| **Objekt** | Apartment, commercial space, or separate structure (e.g., laundry room). Holds address, size, and links to all higher levels. |
| **Utrymme** | Parts of an object (e.g., "Kitchen," "Room"). |
| **Enhet** | Details/items linked to a space (e.g., "Stove," "Floor"). Holds maintenance and installation dates. |
| **Område** | Organizational/geographical division (Admin, Fault, Maintenance areas, search areas 1-3). |

---

## 4.0 API Endpoint Index (Condensed)

| Resource | Endpoint Pattern | HTTP Method(s) | Key Functionality |
| :--- | :--- | :--- | :--- |
| **Auth** | `/oauth2/token` | POST | Login API client (<= v12 WSO2). |
| | `/v1/auth/login` | POST | Login resource (>= v13 Auth-API). |
| **Objekt** | `/v1/fastastrukturen/objekt/{id}` | GET | Get object info. |
| | `/v1/fastastrukturen/objekt/felanmalningsbara/...` | POST | Get reportable objects (rentable/non-rentable). |
| **Utrymme (Space)** | `/v1/fastastrukturen/utrymmen/{id}` | GET | Get space info by ID. |
| | `/v1/fastastrukturen/utrymmen` | GET [query] | List spaces for an object. |
| **Enhet (Unit)** | `/v1/fastastrukturen/enheter/{id}` | GET, PUT | Get/Update unit info (PUT for maintenance fields). |
| | `/v1/fastastrukturen/enheter` | GET [query] | List units for a space. |
| | `/v1/fastastrukturen/fraser` | GET [query] | Get valid phrases for a unit. |
| **Kund (Customer)** | `/v1/kund/{id}` | GET | Get customer by internal ID. |
| | `/v1/kund/kundnummer/{nummer}` | GET | Get customer by customer number. |
| | `/v1/kund/{id}/kontaktuppgifter` | PUT | Update customer contact info. |
| **Arbetsorder (WO)** | `/v1/arbetsorder` | GET [query], POST | Search/Create work order. |
| | `/v1/arbetsorder/{id}` | GET, PUT | Get/Update specific work order. |
| | `/v1/arbetsorder/{id}/status` | GET, PUT | Get/Update status. |
| | `/v1/arbetsorder/{id}/status/vardelista` | GET | Get possible status changes. |
| **Time (`Tider`)** | `/v1/arbetsorder/tider` | GET [query], POST | Handle time registrations (Get/Create). |
| | `/v1/arbetsorder/tider/{id}` | GET, PUT, DEL | Handle specific time registration (Get/Update/Delete). |
| | `/v1/arbetsorder/tider/starta`, `/stoppa` | POST [query] | Start/Stop time registration. |
| | `/v1/arbetsorder/tider/aktiviteter/vardelista` | GET | Get valid time activities. |
| **Contact Persons**| `/v1/arbetsorder/kontaktpersoner` | GET [query], POST | Get/Create contact persons. |
| | `/v1/arbetsorder/kontaktpersoner/{id}` | PUT, DEL | Update/Delete specific contact person. |
| **Events (`Händelser`)** | `/v1/arbetsorder/handelser` | GET [query], POST | Get/Create events. |
| | `/v1/arbetsorder/handelser/{id}` | PUT, DEL | Update/Delete specific event. |
| | `/v1/arbetsorder/handelser/vardelista` | GET | Get valid event types. |
| **SLA** | `/v1/arbetsorder/{id}/sla` | GET | Get SLA information. |
| | `/v1/arbetsorder/{id}/sla/avslutad` | POST | Complete SLA. |
| **Booking (`Bokning`)** | `/v1/arbetsorder/resurs/forslag` | GET [query] | Get resource proposal. |
| | `/v1/system/resurskalender` | POST | Get resource calendar/available time slots. |
| | `/v1/arbetsorder/{id}/bokning` | GET | Get booking info. |
| | `/v1/arbetsorder/{id}/boka` | POST | Book work order. |
| | `/v1/arbetsorder/{id}/avboka` | POST | Unbook work order. |
| **Access (`Tillträde`)** | `/v1/arbetsorder/tilltrade/vardelista` | GET | Get valid access codes. |
| **Filetransfer** | `/v1/filetransfer/tempfile` | POST | Store temporary file (returns `fileName`). |
| | `/v1/filetransfer/tempfile/:name` | DEL | Delete temporary file. |
| | `/v1/filetransfer/file/:id` | GET, DEL | Get/Delete uploaded file (linked to WO). |

## 5. Key Fields (Work Order Object)

The main Work Order object contains grouped information:

| Group Name | Purpose | Key Fields/Sub-Groups |
| :--- | :--- | :--- |
| **id** | Work Order Number. | |
| **externtId**, **externtNr** | External IDs (text fields). | |
| **objekt** | Object information. | `id` (Object number). |
| **kund** | Customer information. | `id` (Internal customer number). |
| **bunt** | Batch information. | `buntId`, `bunttext`. |
| **utforare** | Executor/Resource information. | `id`, `namn`, `kommunikation` (contact info). |
| **status** | Status information. | `statusKod` (Status for work order). |
| **utrymme**, **enhet** | Space/Unit information. | `id`, `enhetsNotering`. |
| **nyEnhet** | New Unit information (for unit replacement). | `enhetsTyp`. |
| **fras** | Phrase information. | `frasKod`, `frasBesk` (for fault descriptions). |
| **information** | Descriptive texts. | `beskrivning`, `kommentar`, `anmarkning`, `atgard`. |
| **arbetsorderTyp** | Work order type information. | `arbetsordertypKod`, `arbetsordertypBesk`. |
| **Tilltrade** | Access information. | `tilltradeKod`, `tilltradeBesk`. |
| **prio** | Priority information. | `prioKod`, `prioBesk`, `prioSla`. |
| **[status groups]** | Registration, Order, Acceptance, Execution. | `datumregistrerad`, `registreradAv`, `datumAccepterad`, `datumUtford`, `utfordAv`, etc. |
| **modifierad** | Last modification info. | `datumModifierad`, `modifieradAv`. |
| **referens** | Reference information. | |
| **pamin1**, **pamin2** | Reminder dates. | `Datum för första/andra påminnelse`. |
| **planering** | Planning/Booking info. | `bokadDatum`, `bokadFromTid`, `bokadTomTid`, `bokadMedModul`. |
| **ekonomi** | Accounting/Posting info. | `konteringKonto`, `konteringRefKst`, `kostnad`, etc. |
| **faktura** | Invoicing to customer. | `faktureras`, `fakturaBelopp`. |
| **ursprung** | System that created the work order. | |
| **annanAnmalare** | Information about another reporter. | `namn`, `telefon`, `epostAdress`. |
| **nyckelinformation** | Key information. | |
| **kundPrimarKontaktsatt** | Customer's primary contact method for the work order. | |