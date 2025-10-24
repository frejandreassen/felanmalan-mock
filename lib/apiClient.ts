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

  // Create work order
  async createWorkOrder(workOrder: {
    arbetsordertypKod: string;
    kundNr: string;
    objektId: string;
    ursprung: number;
    externtId?: string;
    externtNr?: string;
    information?: {
      beskrivning?: string;
      kommentar?: string;
    };
    anmalare?: {
      namn?: string;
      telefon?: string;
      epostAdress?: string;
    };
    utrymmesId?: number;
    enhetsId?: number;
    tilltradeKod?: string;
    prioKod?: string;
  }) {
    const response = await fetch(`${BFF_BASE_URL}/v1/arbetsorder`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(workOrder),
    });

    const data = await response.json();

    apiLogger?.log({
      method: 'POST',
      endpoint: '/api/bff/v1/arbetsorder',
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

  // ===== Fasta Strukturen API Methods =====

  // List all objekt (properties/buildings)
  async listObjekt(filter?: { kategori?: string }) {
    const params = new URLSearchParams();
    if (filter?.kategori) params.append('kategori', filter.kategori);

    const queryString = params.toString();
    const endpoint = `/api/bff/v1/fastastrukturen/objekt${queryString ? `?${queryString}` : ''}`;

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
      throw new Error(data.error || 'Failed to list objekt');
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
  async listUtrymmen(objektId: string, typ?: 'inomhus' | 'utomhus') {
    const params = new URLSearchParams();
    params.append('objektId', objektId);
    if (typ) params.append('typ', typ);

    const queryString = params.toString();
    const endpoint = `/api/bff/v1/fastastrukturen/utrymmen?${queryString}`;

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

    return data;
  }

  // List enheter (units/components) for a utrymme
  async listEnheter(utrymmesId: string) {
    const params = new URLSearchParams();
    params.append('utrymmesId', utrymmesId);

    const queryString = params.toString();
    const endpoint = `/api/bff/v1/fastastrukturen/enheter?${queryString}`;

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

    return data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
