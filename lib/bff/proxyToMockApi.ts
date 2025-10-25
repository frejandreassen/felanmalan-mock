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
  body?: unknown
): Promise<{ status: number; data: unknown }> {

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
      // Type assertion for body
      const requestBody = body as {
        arbetsordertypKod?: string;
        kundNr?: string;
        objektId?: string;
        ursprung?: number;
        externtId?: string;
        utrymmesId?: number;
        enhetsId?: number;
        information?: { beskrivning?: string; kommentar?: string };
        anmalare?: { namn?: string; telefon?: string; epostAdress?: string };
        prioKod?: string;
        tilltradeKod?: string;
      };

      // Validate required fields
      if (!requestBody.arbetsordertypKod || !requestBody.kundNr || !requestBody.objektId || requestBody.ursprung === undefined) {
        return {
          status: 400,
          data: {
            error: 'Validation failed',
            details: ['arbetsordertypKod, kundNr, objektId, and ursprung are required']
          }
        };
      }

      // Transform API request format to internal WorkOrder format
      const workOrder = mockStore.createWorkOrder({
        objekt: {
          id: requestBody.objektId,
          namn: `Objekt ${requestBody.objektId}`,
        },
        externtId: requestBody.externtId,
        utrymme: requestBody.utrymmesId ? {
          id: requestBody.utrymmesId.toString(),
          namn: `Utrymme ${requestBody.utrymmesId}`
        } : undefined,
        enhet: requestBody.enhetsId ? {
          id: requestBody.enhetsId.toString(),
          namn: `Enhet ${requestBody.enhetsId}`
        } : undefined,
        information: {
          beskrivning: requestBody.information?.beskrivning || '',
          kommentar: requestBody.information?.kommentar
        },
        annanAnmalare: requestBody.anmalare && requestBody.anmalare.namn ? {
          namn: requestBody.anmalare.namn,
          telefon: requestBody.anmalare.telefon,
          epostAdress: requestBody.anmalare.epostAdress
        } : undefined,
        arbetsorderTyp: {
          arbetsordertypKod: requestBody.arbetsordertypKod as 'F' | 'U' | 'G',
          arbetsordertypBesk: requestBody.arbetsordertypKod === 'F' ? 'Felanmälan' :
                             requestBody.arbetsordertypKod === 'U' ? 'Underhåll' : 'Garanti'
        },
        prio: {
          prioKod: (requestBody.prioKod || '30') as '10' | '30',
          prioBesk: requestBody.prioKod === '10' ? 'Akut' : 'Normal'
        },
        tilltrade: requestBody.tilltradeKod ? {
          tilltradeKod: requestBody.tilltradeKod as 'J' | 'N',
          tilltradeBesk: requestBody.tilltradeKod === 'J' ? 'Ja' : 'Nej'
        } : undefined,
        ursprung: requestBody.ursprung,
      });

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
