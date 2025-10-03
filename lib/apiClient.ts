// API Client for arbetsorder API

const API_BASE_URL = '/api/v1';

// Dynamic import to avoid server-side issues
let apiLogger: typeof import('../components/ApiLog').apiLogger | null = null;

if (typeof window !== 'undefined') {
  import('../components/ApiLog').then(module => {
    apiLogger = module.apiLogger;
  });
}

class ApiClient {
  private token: string | null = null;

  // Authenticate and get token
  async login(username: string = 'mock', password: string = 'mock'): Promise<string> {
    const requestBody = { username, password };
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    apiLogger?.log({
      method: 'POST',
      endpoint: '/api/v1/auth/login',
      status: response.status,
      requestBody,
      responseBody: data,
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    this.token = data.token;
    return data.token;
  }

  // Get auth headers
  private getHeaders(): HeadersInit {
    if (!this.token) {
      throw new Error('Not authenticated. Call login() first.');
    }

    return {
      'Content-Type': 'application/json',
      'X-Auth-Token': this.token,
    };
  }

  // Create work order
  async createWorkOrder(workOrder: {
    objekt: {
      id: string;
      namn: string;
      adress?: string;
    };
    utrymme?: {
      id: string;
      namn: string;
    };
    enhet?: {
      id: string;
      namn: string;
    };
    information: {
      beskrivning: string;
      kommentar?: string;
    };
    annanAnmalare?: {
      namn: string;
      telefon?: string;
      epostAdress?: string;
    };
    prio?: {
      prioKod: '10' | '30';
      prioBesk: string;
    };
    tilltrade?: {
      tilltradeKod: 'J' | 'N';
      tilltradeBesk: string;
    };
    bilder?: string[];
  }) {
    const response = await fetch(`${API_BASE_URL}/arbetsorder`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(workOrder),
    });

    const data = await response.json();

    apiLogger?.log({
      method: 'POST',
      endpoint: '/api/v1/arbetsorder',
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
    const response = await fetch(`${API_BASE_URL}/arbetsorder/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await response.json();

    apiLogger?.log({
      method: 'GET',
      endpoint: `/api/v1/arbetsorder/${id}`,
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
    const endpoint = `/api/v1/arbetsorder${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(
      `${API_BASE_URL}/arbetsorder?${queryString}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

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
}

// Export singleton instance
export const apiClient = new ApiClient();
