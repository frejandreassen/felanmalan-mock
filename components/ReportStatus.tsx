'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';

// Work order type from FAST2 API
interface WorkOrder {
  arbetsorderId?: number;
  id?: number;
  objektId?: string;
  objekt?: {
    id?: string;
  };
  status?: {
    statusKod?: string;
    statusBesk?: string;
  };
  information?: {
    beskrivning?: string;
  };
  arbetsorderTyp?: {
    arbetsordertypKod?: string;
    arbetsordertypBesk?: string;
  };
  prio?: {
    prioKod?: string;
    prioBesk?: string;
  };
  annanAnmalare?: {
    namn?: string;
  };
  registrerad?: {
    datumRegistrerad?: string;
  };
  externtNr?: string;
}

interface ReportStatusProps {
  workOrders?: any[];
  selectedObjekt?: { id: string; namn: string } | null;
}

export default function ReportStatus({ workOrders: externalWorkOrders, selectedObjekt }: ReportStatusProps) {
  const [allWorkOrders, setAllWorkOrders] = useState<WorkOrder[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'REG' | 'GODK' | 'PAGAR'>('all');

  // Update work orders when external prop changes
  useEffect(() => {
    if (externalWorkOrders) {
      console.log('[ReportStatus] Received work orders:', externalWorkOrders);
      setAllWorkOrders(externalWorkOrders as WorkOrder[]);
    } else {
      setAllWorkOrders([]);
    }
  }, [externalWorkOrders]);

  // Filter work orders based on selected tab
  useEffect(() => {
    if (selectedFilter === 'all') {
      setWorkOrders(allWorkOrders);
    } else {
      const filtered = allWorkOrders.filter(order => order.status?.statusKod === selectedFilter);
      setWorkOrders(filtered);
    }
  }, [allWorkOrders, selectedFilter]);

  const loadWorkOrders = async () => {
    if (!selectedObjekt) {
      console.warn('[ReportStatus] No object selected, cannot load work orders');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Fetch work orders for the selected object
      const response = await apiClient.listWorkOrdersForObject(selectedObjekt.id);

      // Update parent component with new data
      console.log('[ReportStatus] Loaded work orders:', response);
      setAllWorkOrders(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Error loading work orders:', err);
      setError('Kunde inte ladda arbetsordrar');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusName = (statusKod: string) => {
    switch (statusKod) {
      case 'REG':
        return 'Registrerad';
      case 'GODK':
        return 'Beställd';
      case 'PAGAR':
        return 'Accepterad';
      case 'UTFÖRD':
        return 'Utförd';
      default:
        return statusKod || 'Okänd status';
    }
  };

  const getStatusBadgeColor = (statusKod: string) => {
    switch (statusKod) {
      case 'REG':
        return 'bg-pink-100 text-pink-700';
      case 'GODK':
        return 'bg-blue-100 text-blue-700';
      case 'PAGAR':
        return 'bg-orange-100 text-orange-700';
      case 'UTFÖRD':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Ärenden & status</h2>
          {selectedObjekt && (
            <p className="text-sm text-gray-600 mt-1">
              📍 {selectedObjekt.namn}
            </p>
          )}
        </div>
        {selectedObjekt && (
          <button
            onClick={loadWorkOrders}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>🔄</span>
            <span>Uppdatera</span>
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-4 py-2 rounded-md font-semibold transition-colors ${
            selectedFilter === 'all'
              ? 'bg-pink-400 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Alla ({allWorkOrders.length})
        </button>
        <button
          onClick={() => setSelectedFilter('REG')}
          className={`px-4 py-2 rounded-md font-semibold transition-colors ${
            selectedFilter === 'REG'
              ? 'bg-pink-400 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Registrerad ({allWorkOrders.filter(o => o.status?.statusKod === 'REG').length})
        </button>
        <button
          onClick={() => setSelectedFilter('GODK')}
          className={`px-4 py-2 rounded-md font-semibold transition-colors ${
            selectedFilter === 'GODK'
              ? 'bg-pink-400 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Beställd ({allWorkOrders.filter(o => o.status?.statusKod === 'GODK').length})
        </button>
        <button
          onClick={() => setSelectedFilter('PAGAR')}
          className={`px-4 py-2 rounded-md font-semibold transition-colors ${
            selectedFilter === 'PAGAR'
              ? 'bg-pink-400 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Accepterad ({allWorkOrders.filter(o => o.status?.statusKod === 'PAGAR').length})
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">
          <span className="animate-spin text-2xl">⏳</span>
          <p className="mt-2">Laddar...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          <p>{error}</p>
        </div>
      ) : workOrders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>{selectedObjekt ? 'Inga arbetsordrar hittades' : 'Välj en fastighet för att se arbetsordrar'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workOrders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 rounded-md p-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base mb-1">
                    #{order.id} - {order.information?.beskrivning || 'Ingen beskrivning'}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(order.status?.statusKod || '')}`}>
                      {getStatusName(order.status?.statusKod || '')}
                    </span>
                    {order.prio && (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        order.prio.prioKod === '30' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {order.prio.prioBesk}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-600 flex-shrink-0">
                  {order.annanAnmalare?.namn && (
                    <div className="flex items-center gap-1 justify-end mb-1">
                      <span>👤</span>
                      <span>{order.annanAnmalare.namn}</span>
                    </div>
                  )}
                  {order.registrerad?.datumRegistrerad && (
                    <div>{order.registrerad.datumRegistrerad}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-600 mt-6">
        Visar {
          selectedFilter === 'all' ? 'alla' :
          selectedFilter === 'REG' ? 'registrerade' :
          selectedFilter === 'GODK' ? 'beställda' :
          'accepterade'
        } arbetsordrar.
      </p>
    </div>
  );
}
