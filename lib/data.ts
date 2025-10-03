import propertiesData from './properties.json';

export interface Property {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  category?: string;
}

export interface Room {
  id: string;
  propertyId: string;
  name: string;
  type: 'inomhus' | 'utomhus';
  subtype?: string;
}

export interface Category {
  id: string;
  name: string;
  propertyCategory?: string;
}

// Import all properties from the geocoded data
export const properties: Property[] = propertiesData.map(prop => {
  // Determine category based on property code
  let category = 'ovrig';
  const code = prop.code || '';

  if (code.startsWith('103')) category = 'skolor';
  else if (code.startsWith('104')) category = 'forskolor';
  else if (code.startsWith('102')) category = 'idrottshallar';
  else if (code.startsWith('105')) category = 'aldreboende';
  else if (code.startsWith('108')) category = 'sanering';
  else if (code.startsWith('106')) category = 'special';
  else if (code.startsWith('101')) category = 'forvaltning';
  else if (code.startsWith('12')) category = 'inhyrda';
  else if (code.startsWith('109')) category = 'paviljong';

  return {
    ...prop,
    category
  };
});

// Sample rooms for different property types
export const rooms: Room[] = [
  // Generic rooms - Allmänt for all inomhus and utomhus
  { id: 'allmant-inne', propertyId: 'all', name: 'Allmänt', type: 'inomhus' },
  { id: 'allmant-ute', propertyId: 'all', name: 'Allmänt', type: 'utomhus' },

  // School-specific (103xx) - Inomhus
  { id: 'skola-klassrum', propertyId: 'skolor', name: 'Klassrum', type: 'inomhus' },
  { id: 'skola-wc', propertyId: 'skolor', name: 'WC', type: 'inomhus' },
  { id: 'skola-storkok', propertyId: 'skolor', name: 'Storkök', type: 'inomhus' },

  // Preschool-specific (104xx) - Inomhus
  { id: 'forskola-storkok', propertyId: 'forskolor', name: 'Storkök', type: 'inomhus' },
  { id: 'forskola-wc', propertyId: 'forskolor', name: 'WC', type: 'inomhus' },

  // Sports hall-specific (102xx) - Inomhus
  { id: 'idrottshall-omklrum', propertyId: 'idrottshallar', name: 'Omkl.rum', type: 'inomhus' },
  { id: 'idrottshall-gymnastiksal', propertyId: 'idrottshallar', name: 'Gymnastiksal', type: 'inomhus' },
  { id: 'idrottshall-wc', propertyId: 'idrottshallar', name: 'WC', type: 'inomhus' },

  // Care home-specific (105xx) - Inomhus
  { id: 'aldreboende-boenderum', propertyId: 'aldreboende', name: 'Boenderum', type: 'inomhus' },
  { id: 'aldreboende-forskola', propertyId: 'aldreboende', name: 'Förskolan (Bara Bokens äldreboende)', type: 'inomhus' },
  { id: 'aldreboende-storkok', propertyId: 'aldreboende', name: 'Storkök', type: 'inomhus' },

  // Administration buildings (101xx) - Inomhus
  { id: 'forvaltning-kontor', propertyId: 'forvaltning', name: 'Kontor', type: 'inomhus' },
  { id: 'forvaltning-storkok', propertyId: 'forvaltning', name: 'Storkök', type: 'inomhus' },
  { id: 'forvaltning-wc', propertyId: 'forvaltning', name: 'WC', type: 'inomhus' },
];

// Units/systems - context-aware based on property type and utrymme
export const units: Category[] = [
  // Inomhus units - common for most property types
  { id: 'belysning-inomhus', name: 'Belysning', propertyCategory: 'inomhus' },
  { id: 'ventilation', name: 'Ventilation', propertyCategory: 'inomhus' },
  { id: 'varme', name: 'Värme', propertyCategory: 'inomhus' },
  { id: 'dusch', name: 'Dusch', propertyCategory: 'idrottshallar-inomhus' },
  { id: 'ovrig-inomhus', name: 'Övrigt', propertyCategory: 'inomhus' },

  // Utomhus units
  { id: 'belysning-utomhus', name: 'Belysning', propertyCategory: 'utomhus' },
  { id: 'lekutrustning', name: 'Lekutrustning', propertyCategory: 'utomhus-skolor-forskolor' },
  { id: 'ovrig-utomhus', name: 'Övrigt', propertyCategory: 'utomhus' },
];

// Issue categories
export const categories: Category[] = [
  { id: 'inomhus', name: 'Inomhus' },
  { id: 'utomhus', name: 'Utomhus' },
  { id: 'skadegorelse', name: 'Skadegörelse' },
];

// Helper function to get rooms for a specific property
export function getRoomsForProperty(propertyId: string, propertyCategory?: string): Room[] {
  return rooms.filter(room =>
    room.propertyId === 'all' ||
    room.propertyId === propertyId ||
    room.propertyId === propertyCategory
  );
}

// Helper function to get units based on utrymme (location) and property category
export function getUnitsForLocation(location: string, propertyCategory?: string): Category[] {
  return units.filter(unit => {
    if (!unit.propertyCategory) return true;

    // Check if unit matches the location (inomhus/utomhus)
    if (unit.propertyCategory === location) return true;

    // Special case for Dusch - only for idrottshallar inomhus
    if (unit.id === 'dusch' && propertyCategory === 'idrottshallar' && location === 'inomhus') return true;

    // Special case for Lekutrustning - only for skolor and forskolor utomhus
    if (unit.id === 'lekutrustning' &&
        (propertyCategory === 'skolor' || propertyCategory === 'forskolor') &&
        location === 'utomhus') return true;

    return false;
  });
}

// Helper function to get property by ID
export function getPropertyById(id: string): Property | undefined {
  return properties.find(p => p.id === id);
}

// Helper function to get properties by category
export function getPropertiesByCategory(category: string): Property[] {
  return properties.filter(p => p.category === category);
}
