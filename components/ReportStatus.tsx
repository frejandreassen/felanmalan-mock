'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { WorkOrder } from '@/lib/mockStore';

export default function ReportStatus() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'REG' | 'PAGAR'>('all');

  useEffect(() => {
    loadWorkOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter]);

  const loadWorkOrders = async () => {
    try {
      setIsLoading(true);
      await apiClient.login();

      const filter = selectedFilter === 'all' ? {} : { statusKod: selectedFilter };
      const response = await apiClient.listWorkOrders({ ...filter, limit: 10 });

      setWorkOrders(response.workOrders);
    } catch (err) {
      console.error('Error loading work orders:', err);
      setError('Kunde inte ladda arbetsordrar');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (statusKod: string) => {
    switch (statusKod) {
      case 'REG':
        return 'border-l-pink-400 bg-pink-50';
      case 'GODK':
        return 'border-l-blue-400 bg-blue-50';
      case 'PAGAR':
        return 'border-l-orange-400 bg-orange-50';
      case 'UTFÖRD':
        return 'border-l-green-400 bg-green-50';
      default:
        return 'border-l-gray-400 bg-gray-50';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Ärenden & status</h2>
        <button
          onClick={loadWorkOrders}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <span>🔄</span>
          <span>Uppdatera</span>
        </button>
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
          Alla ({workOrders.length})
        </button>
        <button
          onClick={() => setSelectedFilter('REG')}
          className={`px-4 py-2 rounded-md font-semibold transition-colors ${
            selectedFilter === 'REG'
              ? 'bg-pink-400 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Registrerad
        </button>
        <button
          onClick={() => setSelectedFilter('PAGAR')}
          className={`px-4 py-2 rounded-md font-semibold transition-colors ${
            selectedFilter === 'PAGAR'
              ? 'bg-pink-400 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pågående
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
          <p>Inga arbetsordrar hittades</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workOrders.map((order) => (
            <div
              key={order.id}
              className={`border-l-4 ${getStatusColor(order.status.statusKod)} border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow cursor-pointer`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">
                      #{order.id} - {order.information.beskrivning.substring(0, 50)}
                      {order.information.beskrivning.length > 50 ? '...' : ''}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    📍 {order.objekt.namn}
                    {order.utrymme && ` • ${order.utrymme.namn}`}
                    {order.enhet && ` • ${order.enhet.namn}`}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getStatusBadgeColor(order.status.statusKod)}`}>
                      {order.status.statusBesk}
                    </span>
                    <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      order.prio.prioKod === '30' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {order.prio.prioBesk}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  {order.annanAnmalare && (
                    <div className="flex items-center gap-1 justify-end mb-1">
                      <span>👤</span>
                      <span>{order.annanAnmalare.namn}</span>
                    </div>
                  )}
                  <div className="mt-1">{formatDate(order.registrerad.datumRegistrerad)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-600 mt-6">
        Visar {selectedFilter === 'all' ? 'alla' : selectedFilter === 'REG' ? 'registrerade' : 'pågående'} arbetsordrar.
      </p>
    </div>
  );
}
