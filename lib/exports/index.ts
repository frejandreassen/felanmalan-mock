/**
 * Felanmälan Widgets - React components for fault reporting
 *
 * This library provides two main React components that can be imported
 * into any React application, including Joomla React apps.
 *
 * @example
 * ```tsx
 * import { FelanmalanWidget, QRGeneratorWidget } from 'felanmalan-widgets';
 *
 * function MyApp() {
 *   return (
 *     <div>
 *       <FelanmalanWidget
 *         apiBaseUrl="/api/felanmalan"
 *         googleMapsApiKey="YOUR_KEY"
 *       />
 *       <QRGeneratorWidget
 *         baseUrl="https://intranet.example.com"
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

// Main widget components
export { default as FelanmalanWidget } from './FelanmalanWidget';
export type { FelanmalanWidgetProps } from './FelanmalanWidget';

export { default as QRGeneratorWidget } from './QRGeneratorWidget';
export type { QRGeneratorWidgetProps } from './QRGeneratorWidget';

// Re-export core types that consumers might need
export type {
  Objekt,
  ObjektAdress,
  Utrymme,
  Enhet
} from '@/lib/fastaStrukturenStore';

// Re-export API client for advanced usage
export { apiClient } from '@/lib/apiClient';

// Version info
export const VERSION = '1.0.0';
