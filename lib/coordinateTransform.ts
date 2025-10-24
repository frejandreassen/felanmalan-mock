/**
 * Coordinate Transformation Utility
 *
 * Transforms between Swedish coordinate systems (SWEREF99 TM, RT90) and WGS84 (lat/lng)
 * for use with Google Maps and other international mapping services.
 *
 * Common Swedish Coordinate Systems:
 * - SWEREF99 TM (EPSG:3006) - Modern Swedish standard
 * - RT90 2.5 gon V (EPSG:3021) - Legacy system
 */

import proj4 from 'proj4';

// Define SWEREF99 TM projection (EPSG:3006)
// This is the modern Swedish national coordinate system
proj4.defs('EPSG:3006', '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs');

// Define RT90 2.5 gon V projection (EPSG:3021)
// Legacy Swedish coordinate system, still in use in some systems
proj4.defs('EPSG:3021', '+proj=tmerc +lat_0=0 +lon_0=15.80827777777778 +k=1 +x_0=1500000 +y_0=0 +ellps=bessel +towgs84=414.1,41.3,603.1,-0.855,2.141,-7.023,0 +units=m +no_defs +type=crs');

// WGS84 (EPSG:4326) is already defined in proj4 as standard

/**
 * Coordinate system types supported
 */
export type CoordinateSystem = 'SWEREF99' | 'RT90' | 'WGS84';

/**
 * Coordinate pair in any system
 */
export interface Coordinate {
  x: number;
  y: number;
}

/**
 * WGS84 coordinate (latitude, longitude)
 */
export interface WGS84Coordinate {
  lat: number;
  lng: number;
}

/**
 * Detects which Swedish coordinate system is likely being used based on coordinate values
 *
 * SWEREF99 TM typical ranges:
 * - X (easting): 250,000 - 900,000 m
 * - Y (northing): 6,100,000 - 7,700,000 m
 *
 * RT90 2.5 gon V typical ranges:
 * - X (easting): 1,200,000 - 1,900,000 m
 * - Y (northing): 6,100,000 - 7,700,000 m
 */
export function detectCoordinateSystem(x: number, y: number): 'SWEREF99' | 'RT90' | 'UNKNOWN' {
  // RT90 typically has X values starting around 1,200,000 or higher
  if (x >= 1200000 && x <= 1900000 && y >= 6000000 && y <= 7800000) {
    return 'RT90';
  }

  // SWEREF99 TM has smaller X values
  if (x >= 250000 && x <= 900000 && y >= 6000000 && y <= 7800000) {
    return 'SWEREF99';
  }

  return 'UNKNOWN';
}

/**
 * Transform Swedish coordinates to WGS84 (lat/lng)
 *
 * @param xkoord - X coordinate (easting) in Swedish system
 * @param ykoord - Y coordinate (northing) in Swedish system
 * @param sourceSystem - Source coordinate system ('SWEREF99' or 'RT90'). If not provided, will auto-detect.
 * @returns WGS84 coordinates (latitude, longitude) or null if transformation fails
 */
export function swedishToWGS84(
  xkoord: string | number,
  ykoord: string | number,
  sourceSystem?: CoordinateSystem
): WGS84Coordinate | null {
  try {
    // Convert to numbers if strings
    const x = typeof xkoord === 'string' ? parseFloat(xkoord) : xkoord;
    const y = typeof ykoord === 'string' ? parseFloat(ykoord) : ykoord;

    // Validate inputs
    if (isNaN(x) || isNaN(y)) {
      console.error('Invalid coordinate values:', xkoord, ykoord);
      return null;
    }

    // Auto-detect coordinate system if not provided
    let system = sourceSystem;
    if (!system || system === 'WGS84') {
      const detected = detectCoordinateSystem(x, y);
      if (detected === 'UNKNOWN') {
        console.warn('Could not detect coordinate system for:', x, y);
        // Default to SWEREF99 as it's more common in modern systems
        system = 'SWEREF99';
      } else {
        system = detected;
      }
    }

    // Select appropriate EPSG code
    const sourceEPSG = system === 'RT90' ? 'EPSG:3021' : 'EPSG:3006';

    // Transform coordinates
    // Note: proj4 expects [x, y] (easting, northing) and returns [lng, lat]
    const [lng, lat] = proj4(sourceEPSG, 'EPSG:4326', [x, y]);

    // Validate output
    if (isNaN(lat) || isNaN(lng)) {
      console.error('Transformation resulted in invalid coordinates');
      return null;
    }

    // Sanity check: Sweden is roughly between lat 55-70, lng 11-24
    if (lat < 54 || lat > 71 || lng < 10 || lng > 25) {
      console.warn('Transformed coordinates are outside Sweden bounds:', { lat, lng });
      // Don't return null, as some properties might be at borders or islands
    }

    return { lat, lng };
  } catch (error) {
    console.error('Error transforming coordinates:', error);
    return null;
  }
}

/**
 * Transform WGS84 coordinates to Swedish coordinate system
 *
 * @param lat - Latitude (WGS84)
 * @param lng - Longitude (WGS84)
 * @param targetSystem - Target coordinate system ('SWEREF99' or 'RT90'), default SWEREF99
 * @returns Swedish coordinates (x, y) or null if transformation fails
 */
export function wgs84ToSwedish(
  lat: number,
  lng: number,
  targetSystem: 'SWEREF99' | 'RT90' = 'SWEREF99'
): Coordinate | null {
  try {
    // Validate inputs
    if (isNaN(lat) || isNaN(lng)) {
      console.error('Invalid WGS84 coordinates:', lat, lng);
      return null;
    }

    // Select appropriate EPSG code
    const targetEPSG = targetSystem === 'RT90' ? 'EPSG:3021' : 'EPSG:3006';

    // Transform coordinates
    // Note: proj4 expects [lng, lat] and returns [x, y]
    const [x, y] = proj4('EPSG:4326', targetEPSG, [lng, lat]);

    // Validate output
    if (isNaN(x) || isNaN(y)) {
      console.error('Transformation resulted in invalid coordinates');
      return null;
    }

    return { x, y };
  } catch (error) {
    console.error('Error transforming coordinates:', error);
    return null;
  }
}

/**
 * Batch transform multiple Swedish coordinates to WGS84
 * Useful for transforming lists of properties
 */
export function batchSwedishToWGS84(
  coordinates: Array<{ xkoord: string | number; ykoord: string | number }>,
  sourceSystem?: CoordinateSystem
): Array<WGS84Coordinate | null> {
  return coordinates.map(coord =>
    swedishToWGS84(coord.xkoord, coord.ykoord, sourceSystem)
  );
}
