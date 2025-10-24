/**
 * BFF Proxy to Mock FAST2 API
 *
 * Routes requests to local mock implementation
 */

import { fastaStrukturenStore } from '../fastaStrukturenStore';
import { mockStore } from '../mockStore';

/**
 * Proxy a request to the mock FAST2 API
 *
 * Instead of making HTTP requests, directly call mock store functions
 */
export async function proxyToMockApi(
  path: string,
  method: string,
  body?: any
): Promise<{ status: number; data: any }> {

  // Parse path to determine which endpoint
  if (path.startsWith('/v1/fastastrukturen/objekt')) {
    if (method === 'GET') {
      const objekt = fastaStrukturenStore.getAllObjekt();
      return {
        status: 200,
        data: {
          total: objekt.length,
          objekt
        }
      };
    }
  }

  if (path.startsWith('/v1/fastastrukturen/utrymmen')) {
    if (method === 'GET') {
      const url = new URL(path, 'http://localhost');
      const objektId = url.searchParams.get('objektId');
      const typ = url.searchParams.get('typ') as 'inomhus' | 'utomhus' | undefined;

      if (!objektId) {
        return {
          status: 400,
          data: { error: 'objektId is required' }
        };
      }

      const utrymmen = fastaStrukturenStore.getUtrymmesForObjekt(objektId, typ);
      return {
        status: 200,
        data: {
          total: utrymmen.length,
          utrymmen
        }
      };
    }
  }

  if (path.startsWith('/v1/fastastrukturen/enheter')) {
    if (method === 'GET') {
      const url = new URL(path, 'http://localhost');
      const utrymmesId = url.searchParams.get('utrymmesId');

      if (!utrymmesId) {
        return {
          status: 400,
          data: { error: 'utrymmesId is required' }
        };
      }

      const enheter = fastaStrukturenStore.getEnheterForUtrymme(utrymmesId);
      return {
        status: 200,
        data: {
          total: enheter.length,
          enheter
        }
      };
    }
  }

  if (path === '/v1/arbetsorder') {
    if (method === 'POST') {
      // Validate required fields
      if (!body.arbetsordertypKod || !body.kundNr || !body.objektId || body.ursprung === undefined) {
        return {
          status: 400,
          data: {
            error: 'Validation failed',
            details: ['arbetsordertypKod, kundNr, objektId, and ursprung are required']
          }
        };
      }

      const workOrder = mockStore.createWorkOrder(body);
      return {
        status: 201,
        data: { id: workOrder.id }
      };
    }

    if (method === 'GET') {
      const url = new URL(path, 'http://localhost');
      const objektId = url.searchParams.get('objektId') || undefined;
      const statusKod = url.searchParams.get('statusKod') || undefined;
      const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined;

      const workOrders = mockStore.listWorkOrders({ objektId, statusKod, limit });
      return {
        status: 200,
        data: {
          total: workOrders.length,
          workOrders
        }
      };
    }
  }

  if (path.match(/^\/v1\/arbetsorder\/\d+$/)) {
    if (method === 'GET') {
      const id = path.split('/').pop()!;
      const workOrder = mockStore.getWorkOrder(id);

      if (!workOrder) {
        return {
          status: 404,
          data: { error: 'Work order not found' }
        };
      }

      return {
        status: 200,
        data: workOrder
      };
    }
  }

  // Endpoint not found
  return {
    status: 404,
    data: { error: `Endpoint not found: ${method} ${path}` }
  };
}
