/**
 * Test file to verify exports work correctly
 * This file is not included in the package - just for verification
 */

// Test default exports
import FelanmalanWidget from './FelanmalanWidget';
import QRGeneratorWidget from './QRGeneratorWidget';

// Test named exports from index
import {
  FelanmalanWidget as FelanmalanWidgetNamed,
  QRGeneratorWidget as QRGeneratorWidgetNamed,
  apiClient,
  VERSION
} from './index';

// Test type exports
import type {
  FelanmalanWidgetProps,
  QRGeneratorWidgetProps,
  Objekt,
  Utrymme,
  Enhet
} from './index';

// Verify exports exist
console.log('FelanmalanWidget:', typeof FelanmalanWidget);
console.log('QRGeneratorWidget:', typeof QRGeneratorWidget);
console.log('FelanmalanWidgetNamed:', typeof FelanmalanWidgetNamed);
console.log('QRGeneratorWidgetNamed:', typeof QRGeneratorWidgetNamed);
console.log('apiClient:', typeof apiClient);
console.log('VERSION:', VERSION);

// Type checks
const testProps: FelanmalanWidgetProps = {
  apiBaseUrl: '/api/test',
  googleMapsApiKey: 'test-key',
  initialProperty: '123',
  onSubmitSuccess: (wo) => console.log(wo.id),
};

const testQRProps: QRGeneratorWidgetProps = {
  apiBaseUrl: '/api/test',
  baseUrl: 'https://example.com',
};

console.log('✓ All exports verified successfully!');
