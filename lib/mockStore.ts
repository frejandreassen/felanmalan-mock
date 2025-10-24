// Mock in-memory store for work orders
// In production, this would be a real database

export interface WorkOrder {
  id: string;
  externtId?: string;
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
  kund?: {
    namn: string;
    telefon?: string;
    epostAdress?: string;
  };
  annanAnmalare?: {
    namn: string;
    telefon?: string;
    epostAdress?: string;
  };
  status: {
    statusKod: 'REG' | 'GODK' | 'PAGAR' | 'UTFÖRD' | 'MAK';
    statusBesk: string;
  };
  arbetsorderTyp: {
    arbetsordertypKod: 'F' | 'U' | 'G';
    arbetsordertypBesk: string;
  };
  prio: {
    prioKod: '10' | '30';
    prioBesk: string;
  };
  tilltrade?: {
    tilltradeKod: 'J' | 'N';
    tilltradeBesk: string;
  };
  registrerad: {
    datumRegistrerad: string;
    registreradAv: string;
  };
  modifierad: {
    datumModifierad: string;
    modifieradAv: string;
  };
  ursprung?: number; // 1 = Web Portal, 99 = Confidential/Hidden
  bilder?: string[];
}

// In-memory store (resets on server restart)
const workOrders = new Map<string, WorkOrder>();
let nextId = 1000;

export const mockStore = {
  // Create work order
  createWorkOrder: (data: Omit<WorkOrder, 'id' | 'registrerad' | 'modifierad' | 'status'>): WorkOrder => {
    const id = (nextId++).toString();
    const now = new Date().toISOString();

    const workOrder: WorkOrder = {
      id,
      ...data,
      status: {
        statusKod: 'REG',
        statusBesk: 'Registrerad'
      },
      registrerad: {
        datumRegistrerad: now,
        registreradAv: 'API'
      },
      modifierad: {
        datumModifierad: now,
        modifieradAv: 'API'
      }
    };

    workOrders.set(id, workOrder);
    return workOrder;
  },

  // Get work order by ID
  getWorkOrder: (id: string): WorkOrder | undefined => {
    return workOrders.get(id);
  },

  // List all work orders
  listWorkOrders: (filter?: {
    objektId?: string;
    statusKod?: string;
    limit?: number;
    includeConfidential?: boolean;
  }): WorkOrder[] => {
    let orders = Array.from(workOrders.values());

    // Filter out confidential work orders by default (ursprung: 99)
    if (!filter?.includeConfidential) {
      orders = orders.filter(wo => wo.ursprung !== 99);
    }

    if (filter?.objektId) {
      orders = orders.filter(wo => wo.objekt.id === filter.objektId);
    }

    if (filter?.statusKod) {
      orders = orders.filter(wo => wo.status.statusKod === filter.statusKod);
    }

    if (filter?.limit) {
      orders = orders.slice(0, filter.limit);
    }

    // Sort by date, newest first
    return orders.sort((a, b) =>
      new Date(b.registrerad.datumRegistrerad).getTime() -
      new Date(a.registrerad.datumRegistrerad).getTime()
    );
  },

  // Update work order status
  updateStatus: (id: string, statusKod: WorkOrder['status']['statusKod']): WorkOrder | undefined => {
    const workOrder = workOrders.get(id);
    if (!workOrder) return undefined;

    const statusMap = {
      'REG': 'Registrerad',
      'GODK': 'Beställd',
      'PAGAR': 'Accepterad',
      'UTFÖRD': 'Utförd',
      'MAK': 'Makulerad'
    };

    workOrder.status = {
      statusKod,
      statusBesk: statusMap[statusKod]
    };

    workOrder.modifierad = {
      datumModifierad: new Date().toISOString(),
      modifieradAv: 'API'
    };

    workOrders.set(id, workOrder);
    return workOrder;
  },

  // Get all work orders (for admin/debugging)
  getAllWorkOrders: (): WorkOrder[] => {
    return Array.from(workOrders.values());
  }
};
