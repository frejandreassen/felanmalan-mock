'use client';

import React from 'react';
import ReportForm from '@/components/ReportForm';
import ReportStatus from '@/components/ReportStatus';
import ApiLog from '@/components/ApiLog';

export interface FelanmalanWidgetProps {
  /** Base URL for the API endpoints (e.g., '/api/felanmalan' or 'https://api.example.com/v1') */
  apiBaseUrl?: string;

  /** Google Maps API key for map functionality */
  googleMapsApiKey?: string;

  /** Pre-select a property by ID */
  initialProperty?: string;

  /** Pre-select a utrymme by ID */
  initialUtrymme?: string;

  /** Pre-select an enhet by ID */
  initialEnhet?: string;

  /** Callback when work order is successfully created */
  onSubmitSuccess?: (workOrder: { id: string }) => void;

  /** Callback when work order submission fails */
  onSubmitError?: (error: Error) => void;

  /** Custom CSS class name for the container */
  className?: string;

  /** Show the API log component (default: false) */
  showApiLog?: boolean;

  /** Show the report status component (default: true) */
  showReportStatus?: boolean;
}

/**
 * FelanmalanWidget - Standalone fault reporting form component
 *
 * This component can be imported into any React application (including Joomla React apps)
 * to provide a complete fault reporting interface with property selection, map integration,
 * and work order creation.
 *
 * @example
 * ```tsx
 * import { FelanmalanWidget } from 'felanmalan-widgets';
 *
 * function MyPage() {
 *   return (
 *     <FelanmalanWidget
 *       apiBaseUrl="/api/felanmalan"
 *       googleMapsApiKey="YOUR_KEY"
 *       onSubmitSuccess={(wo) => console.log('Created:', wo.id)}
 *     />
 *   );
 * }
 * ```
 */
export default function FelanmalanWidget({
  apiBaseUrl,
  googleMapsApiKey,
  initialProperty = '',
  initialUtrymme = '',
  initialEnhet = '',
  onSubmitSuccess,
  onSubmitError,
  className = '',
  showApiLog = false,
  showReportStatus = true
}: FelanmalanWidgetProps) {
  // TODO: Use apiBaseUrl and googleMapsApiKey from props
  // This would require updating the apiClient to accept configuration

  return (
    <div className={`felanmalan-widget ${className}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ReportForm
            initialProperty={initialProperty}
            initialUtrymme={initialUtrymme}
            initialEnhet={initialEnhet}
          />
          {showReportStatus && <ReportStatus />}
        </div>
      </div>
      {showApiLog && <ApiLog />}
    </div>
  );
}
