'use client';

import { useEffect, useState } from 'react';

export interface ApiLogEntry {
  id: string;
  timestamp: Date;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  status: number;
  requestBody?: unknown;
  responseBody?: unknown;
}

let logEntries: ApiLogEntry[] = [];
let listeners: Array<(entries: ApiLogEntry[]) => void> = [];

export const apiLogger = {
  log: (entry: Omit<ApiLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: ApiLogEntry = {
      ...entry,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
    };
    logEntries = [newEntry, ...logEntries].slice(0, 50); // Keep last 50 entries
    listeners.forEach(listener => listener(logEntries));
  },
  subscribe: (listener: (entries: ApiLogEntry[]) => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
  getEntries: () => logEntries,
  clear: () => {
    logEntries = [];
    listeners.forEach(listener => listener(logEntries));
  }
};

export default function ApiLog() {
  const [entries, setEntries] = useState<ApiLogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ApiLogEntry | null>(null);

  useEffect(() => {
    setEntries(apiLogger.getEntries());
    return apiLogger.subscribe(setEntries);
  }, []);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-700';
      case 'POST': return 'bg-green-100 text-green-700';
      case 'PUT': return 'bg-yellow-100 text-yellow-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <span>📡</span>
          <span>API Log ({entries.length})</span>
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-[600px] max-h-[600px] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-xl">📡</span>
              <h3 className="font-semibold">API Request Log</h3>
              <span className="text-sm text-gray-600">({entries.length})</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => apiLogger.clear()}
                className="text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
              >
                Rensa
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-600 hover:text-gray-800 px-2"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-2 min-h-0">
            {entries.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Inga API-anrop ännu</p>
                <p className="text-sm mt-2">Anrop loggas automatiskt när du använder formuläret</p>
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getMethodColor(entry.method)}`}>
                        {entry.method}
                      </span>
                      <span className="text-sm font-mono text-gray-700">{entry.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                      <span className="text-xs text-gray-500">{formatTime(entry.timestamp)}</span>
                    </div>
                  </div>

                  {selectedEntry?.id === entry.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                      {entry.requestBody !== undefined && (
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-1">Request Body:</div>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(entry.requestBody, null, 2)}
                          </pre>
                        </div>
                      )}
                      {entry.responseBody !== undefined && (
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-1">Response Body:</div>
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-[200px] overflow-y-auto">
                            {JSON.stringify(entry.responseBody, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
