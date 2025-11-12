/**
 * API Client for FAST2 API
 *
 * Uses BFF (Backend for Frontend) pattern:
 * - All requests go through /api/bff/[...path]
 * - BFF routes to mock or real API based on MOCK_API flag
 * - BFF handles OAuth2 authentication when using real API
 * - Client never sees OAuth2 tokens or secrets
 *
 * In Joomla, BFF would be a Joomla component controller doing the same routing.
 */

const BFF_BASE_URL = '/api/bff';

// Dynamic import to avoid server-side issues
let apiLogger: typeof import('../components/ApiLog').apiLogger | null = null;

if (typeof window !== 'undefined') {
  import('../components/ApiLog').then(module => {
    apiLogger = module.apiLogger;
  });
}

class ApiClient {
  /**
   * No authentication needed in client!
   * BFF handles all auth (mock login or OAuth2)
   */

  /**
   * Get headers for BFF requests
   * No auth tokens needed - BFF handles that
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  // Upload temporary file (returns fileName to attach to work order)
  async uploadTempFile(file: File): Promise<{ fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BFF_BASE_URL}/ao-produkt/v1/filetransfer/tempfile`, {
      method: 'POST',
      // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
      body: formData,
    });

    const data = await response.json();

    apiLogger?.log({
      method: 'POST',
      endpoint: '/api/bff/ao-produkt/v1/filetransfer/tempfile',
      status: response.status,
      requestBody: { fileName: file.name, fileSize: file.size, fileType: file.type },
      responseBody: data,
    });

    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload file');
    }

    return data;
  }

  // Attach files to work order
  async attachFilesToWorkOrder(arbetsorderId: string, filePayload: {
    fil: Array<{
      filnamn: string;
      beskrivning?: string;
      typ: string;
    }>;
  }) {
    const response = await fetch(`${BFF_BASE_URL}/ao-produkt/v1/arbetsorder/${arbetsorderId}/filer`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(filePayload),
    });

    const data = await response.json();

    apiLogger?.log({
      method: 'POST',
      endpoint: `/api/bff/ao-produkt/v1/arbetsorder/${arbetsorderId}/filer`,
      status: response.status,
      requestBody: filePayload,
      responseBody: data,
    });

    if (!response.ok) {
      throw new Error(data.error || 'Failed to attach files to work order');
    }

    return data;
  }

  // Create work order (felanmälan or beställning)
  async createWorkOrder(workOrder: {
    arbetsordertypKod: string; // 'F' = Felanmälan, 'G' = Beställning/Eget
    kundNr: string; // Customer number
    objektId: string; // Required
    ursprung: number; // 1 = Web Portal, 99 = Confidential
    externtId?: string; // Reference code for beställning
    information?: {
      beskrivning?: string; // Description - visible to all
      kommentar?: string; // Comment - for utförare
      anmarkning?: string; // Internal note - only for company
    };
    registreradAv?: { // Logged-in user (who created the work order)
      id?: string;
      namn?: string;
      kommunikation?: {
        epostAdress?: string;
        telefon?: Array<{
          typ?: string;
          telefonNr?: string;
        }>;
      };
    };
    referens?: { // Contact person (who should be contacted)
      id?: string;
      namn?: string;
      kommunikation?: {
        epostAdress?: string;
        telefon?: Array<{
          typ?: string;
          telefonNr?: string;
        }>;
      };
    };
    utrymmesId?: number; // Space ID
    enhetsId?: number; // Unit ID
    tilltradeKod?: string; // Access code: 'N' = No, 'J' = Yes
    prioKod?: string; // Priority: '10' = Normal, '30' = Acute
  }) {
    const response = await fetch(`${BFF_BASE_URL}/ao-produkt/v1/arbetsorder`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(workOrder),
    });

    const data = await response.json();

    apiLogger?.log({
      method: 'POST',
      endpoint: '/api/bff/ao-produkt/v1/arbetsorder',
      status: response.status,
      requestBody: workOrder,
      responseBody: data,
    });

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create work order');
    }

    return data;
  }

  // Get work order by ID
  async getWorkOrder(id: string) {
    const response = await fetch(`${BFF_BASE_URL}/v1/arbetsorder/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await response.json();

    apiLogger?.log({
      method: 'GET',
      endpoint: `/api/bff/v1/arbetsorder/${id}`,
      status: response.status,
      responseBody: data,
    });

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get work order');
    }

    return data;
  }

  // List work orders
  async listWorkOrders(filter?: {
    objektId?: string;
    statusKod?: string;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filter?.objektId) params.append('objektId', filter.objektId);
    if (filter?.statusKod) params.append('statusKod', filter.statusKod);
    if (filter?.limit) params.append('limit', filter.limit.toString());

    const queryString = params.toString();
    const endpoint = `/api/bff/v1/arbetsorder${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await response.json();

    apiLogger?.log({
      method: 'GET',
      endpoint,
      status: response.status,
      responseBody: data,
    });

    if (!response.ok) {
      throw new Error(data.error || 'Failed to list work orders');
    }

    return data;
  }

  // List work orders for a specific object (real API format)
  async listWorkOrdersForObject(objektId: string, offset = 0) {
    const params = new URLSearchParams();
    params.append('objektId', objektId);
    params.append('status', 'PAGAR,REG,GODK');
    params.append('feltyp', 'F,U,T');

    if (offset > 0) {
      params.append('offset', offset.toString());
    }

    const queryString = params.toString();
    const endpoint = `/api/bff/ao-produkt/v1/arbetsorder?${queryString}`;

    console.log('[ApiClient] Fetching work orders for objektId:', objektId, 'endpoint:', endpoint);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await response.json();

    apiLogger?.log({
      method: 'GET',
      endpoint,
      status: response.status,
      responseBody: data,
    });

    if (!response.ok) {
      throw new Error(data.error || 'Failed to list work orders for object');
    }

    return data;
  }

  // ===== Fasta Strukturen API Methods =====

  // List all objekt (properties/buildings)
  async listObjekt(filter?: { kategori?: string; kundId?: string }) {
    // For real API, use the felanmalningsbara endpoint
    // For mock API, fall back to old endpoint
    const endpoint = `/api/bff/ao-produkt/v1/fastastrukturen/objekt/felanmalningsbara/uthyrningsbara`;

    // Get kundId from environment or filter
    const kundId = filter?.kundId || process.env.NEXT_PUBLIC_KUND_ID || '287436';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        filter: {
          kundId: kundId
        }
      }),
    });

    const data = await response.json();

    apiLogger?.log({
      method: 'POST',
      endpoint,
      status: response.status,
      requestBody: { filter: { kundId } },
      responseBody: data,
    });

    if (!response.ok) {
      throw new Error(data.error || 'Failed to list objekt');
    }

    // Transform GraphQL-style response to our format
    if (data.edges && Array.isArray(data.edges)) {
      return {
        objekt: data.edges.map((edge: any) => {
          const node = edge.node;

          // Transform real API format to match our Objekt interface
          return {
            id: node.id,
            objektNr: node.id, // Use ID as objektNr
            namn: node.adress?.adress || 'Okänd fastighet', // Use street address as name
            adress: node.adress,
            lat: 0, // Coordinates not provided by real API for this endpoint
            lng: 0,
            kategori: node.typ?.objektsTyp?.toLowerCase() || 'ovrig',
            fastighet: {
              fastighetId: node.relationer?.fastighetNr || '',
              fastighetNamn: `Fastighet ${node.relationer?.fastighetNr || ''}`
            },
            xkoord: node.adress?.xkoord,
            ykoord: node.adress?.ykoord
          };
        }),
        pageInfo: data.pageInfo
      };
    }

    return data;
  }

  // Get specific objekt by ID
  async getObjekt(id: string) {
    const response = await fetch(`${BFF_BASE_URL}/v1/fastastrukturen/objekt/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await response.json();

    apiLogger?.log({
      method: 'GET',
      endpoint: `/api/bff/v1/fastastrukturen/objekt/${id}`,
      status: response.status,
      responseBody: data,
    });

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get objekt');
    }

    return data;
  }

  // List utrymmen (spaces/rooms) for an objekt
  async listUtrymmen(objektId: string) {
    const params = new URLSearchParams();
    params.append('objektId', objektId);

    const queryString = params.toString();
    const endpoint = `/api/bff/ao-produkt/v1/fastastrukturen/utrymmen?${queryString}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await response.json();

    apiLogger?.log({
      method: 'GET',
      endpoint,
      status: response.status,
      responseBody: data,
    });

    if (!response.ok) {
      throw new Error(data.error || 'Failed to list utrymmen');
    }

    // Transform real API response format to our format
    // Real API returns: [{ id, beskrivning, rumsnummer, utrymmesTypKod }]
    // We need: { utrymmen: [{ id, namn, objektId, typ }] }
    if (Array.isArray(data)) {
      return {
        utrymmen: data.map((item: any) => ({
          id: item.id.toString(),
          namn: item.beskrivning || 'Okänt utrymme',
          objektId: objektId,
          typ: 'inomhus' // Default since real API doesn't distinguish
        }))
      };
    }

    return data;
  }

  // List enheter (units/components) for a utrymme
  async listEnheter(utrymmesId: string) {
    const params = new URLSearchParams();
    params.append('utrymmesId', utrymmesId);

    const queryString = params.toString();
    const endpoint = `/api/bff/ao-produkt/v1/fastastrukturen/enheter?${queryString}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await response.json();

    apiLogger?.log({
      method: 'GET',
      endpoint,
      status: response.status,
      responseBody: data,
    });

    if (!response.ok) {
      throw new Error(data.error || 'Failed to list enheter');
    }

    // Transform real API response format to our format
    // Real API returns: [{ id, beskrivning, enhetstypBesk, ... }]
    // We need: { enheter: [{ id, namn, utrymmesId }] }
    if (Array.isArray(data)) {
      return {
        enheter: data.map((item: any) => ({
          id: item.id.toString(),
          namn: item.beskrivning || item.enhetstypBesk || 'Okänd enhet',
          utrymmesId: utrymmesId
        }))
      };
    }

    return data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
