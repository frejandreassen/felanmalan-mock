// Mock data store for Fasta Strukturen (Fixed Structure)
// Represents the hierarchical structure: Företag → Fastighet → Byggnad → Objekt → Utrymme → Enhet

import propertiesData from './properties.json';

// Type definitions matching FAST2 API structure
export interface Objekt {
  id: string;
  objektNr: string;
  namn: string;
  adress: string;
  lat: number;
  lng: number;
  kategori?: string;
  fastighet?: {
    fastighetId: string;
    fastighetNamn: string;
  };
}

export interface Utrymme {
  id: string;
  objektId: string;
  namn: string;
  typ: 'inomhus' | 'utomhus';
  beskrivning?: string;
}

export interface Enhet {
  id: string;
  utrymmesId: string;
  enhetsTyp: string;
  namn: string;
  beskrivning?: string;
}

// Transform properties.json into Objekt format
export const objekt: Objekt[] = propertiesData.map(prop => {
  // Determine category based on property code
  let kategori = 'ovrig';
  const code = prop.code || '';

  if (code.startsWith('103')) kategori = 'skola';
  else if (code.startsWith('104')) kategori = 'forskola';
  else if (code.startsWith('102')) kategori = 'idrottshall';
  else if (code.startsWith('105')) kategori = 'aldreboende';
  else if (code.startsWith('108')) kategori = 'sanering';
  else if (code.startsWith('106')) kategori = 'special';
  else if (code.startsWith('101')) kategori = 'forvaltning';
  else if (code.startsWith('12')) kategori = 'inhyrd';
  else if (code.startsWith('109')) kategori = 'paviljong';

  return {
    id: prop.id,
    objektNr: prop.code || prop.id,
    namn: prop.name,
    adress: prop.address,
    lat: prop.lat,
    lng: prop.lng,
    kategori,
    fastighet: {
      fastighetId: `F-${code.substring(0, 3)}`,
      fastighetNamn: `Fastighet ${code.substring(0, 3)}`
    }
  };
});

// Generate realistic Utrymmen (spaces) for each objekt based on category
const generateUtrymmesForObjekt = (objektId: string, kategori?: string): Utrymme[] => {
  const utrymmen: Utrymme[] = [];

  // Always include generic "Allmänt" for inomhus and utomhus
  utrymmen.push({
    id: `${objektId}-allmant-inomhus`,
    objektId,
    namn: 'Allmänt',
    typ: 'inomhus',
    beskrivning: 'Allmänt utrymme inomhus'
  });

  utrymmen.push({
    id: `${objektId}-allmant-utomhus`,
    objektId,
    namn: 'Allmänt',
    typ: 'utomhus',
    beskrivning: 'Allmänt utrymme utomhus'
  });

  // Category-specific spaces
  switch (kategori) {
    case 'skola':
      utrymmen.push(
        { id: `${objektId}-klassrum-1`, objektId, namn: 'Klassrum 1', typ: 'inomhus' },
        { id: `${objektId}-klassrum-2`, objektId, namn: 'Klassrum 2', typ: 'inomhus' },
        { id: `${objektId}-klassrum-3`, objektId, namn: 'Klassrum 3', typ: 'inomhus' },
        { id: `${objektId}-matsal`, objektId, namn: 'Matsal', typ: 'inomhus' },
        { id: `${objektId}-storkok`, objektId, namn: 'Storkök', typ: 'inomhus' },
        { id: `${objektId}-wc-elever`, objektId, namn: 'WC Elever', typ: 'inomhus' },
        { id: `${objektId}-wc-personal`, objektId, namn: 'WC Personal', typ: 'inomhus' },
        { id: `${objektId}-korridor`, objektId, namn: 'Korridor', typ: 'inomhus' },
        { id: `${objektId}-skolyard`, objektId, namn: 'Skolgård', typ: 'utomhus' },
        { id: `${objektId}-lekplats`, objektId, namn: 'Lekplats', typ: 'utomhus' }
      );
      break;

    case 'forskola':
      utrymmen.push(
        { id: `${objektId}-avdelning-1`, objektId, namn: 'Avdelning 1', typ: 'inomhus' },
        { id: `${objektId}-avdelning-2`, objektId, namn: 'Avdelning 2', typ: 'inomhus' },
        { id: `${objektId}-kok`, objektId, namn: 'Kök', typ: 'inomhus' },
        { id: `${objektId}-wc-barn`, objektId, namn: 'WC Barn', typ: 'inomhus' },
        { id: `${objektId}-wc-personal`, objektId, namn: 'WC Personal', typ: 'inomhus' },
        { id: `${objektId}-hall`, objektId, namn: 'Hall', typ: 'inomhus' },
        { id: `${objektId}-lekplats`, objektId, namn: 'Lekplats', typ: 'utomhus' },
        { id: `${objektId}-utegard`, objektId, namn: 'Utegård', typ: 'utomhus' }
      );
      break;

    case 'idrottshall':
      utrymmen.push(
        { id: `${objektId}-gymnastiksal`, objektId, namn: 'Gymnastiksal', typ: 'inomhus' },
        { id: `${objektId}-omklrum-hem`, objektId, namn: 'Omklädningsrum Hemmalag', typ: 'inomhus' },
        { id: `${objektId}-omklrum-bort`, objektId, namn: 'Omklädningsrum Bortalag', typ: 'inomhus' },
        { id: `${objektId}-duschrum`, objektId, namn: 'Duschrum', typ: 'inomhus' },
        { id: `${objektId}-wc`, objektId, namn: 'WC', typ: 'inomhus' },
        { id: `${objektId}-foaje`, objektId, namn: 'Foajé', typ: 'inomhus' },
        { id: `${objektId}-laktare`, objektId, namn: 'Läktare', typ: 'inomhus' },
        { id: `${objektId}-parkeringsplats`, objektId, namn: 'Parkering', typ: 'utomhus' }
      );
      break;

    case 'aldreboende':
      utrymmen.push(
        { id: `${objektId}-boenderum-1`, objektId, namn: 'Boenderum 1', typ: 'inomhus' },
        { id: `${objektId}-boenderum-2`, objektId, namn: 'Boenderum 2', typ: 'inomhus' },
        { id: `${objektId}-boenderum-3`, objektId, namn: 'Boenderum 3', typ: 'inomhus' },
        { id: `${objektId}-matsal`, objektId, namn: 'Matsal', typ: 'inomhus' },
        { id: `${objektId}-kok`, objektId, namn: 'Kök', typ: 'inomhus' },
        { id: `${objektId}-wc`, objektId, namn: 'WC', typ: 'inomhus' },
        { id: `${objektId}-allrum`, objektId, namn: 'Allrum', typ: 'inomhus' },
        { id: `${objektId}-tradgard`, objektId, namn: 'Trädgård', typ: 'utomhus' }
      );
      break;

    case 'forvaltning':
      utrymmen.push(
        { id: `${objektId}-kontor-1`, objektId, namn: 'Kontor 1', typ: 'inomhus' },
        { id: `${objektId}-kontor-2`, objektId, namn: 'Kontor 2', typ: 'inomhus' },
        { id: `${objektId}-konferensrum`, objektId, namn: 'Konferensrum', typ: 'inomhus' },
        { id: `${objektId}-reception`, objektId, namn: 'Reception', typ: 'inomhus' },
        { id: `${objektId}-wc`, objektId, namn: 'WC', typ: 'inomhus' },
        { id: `${objektId}-korridor`, objektId, namn: 'Korridor', typ: 'inomhus' },
        { id: `${objektId}-parkering`, objektId, namn: 'Parkering', typ: 'utomhus' }
      );
      break;

    default:
      // For generic properties, just keep the basic "Allmänt" spaces
      break;
  }

  return utrymmen;
};

// Generate all Utrymmen for all Objekt
export const utrymmen: Utrymme[] = objekt.flatMap(obj =>
  generateUtrymmesForObjekt(obj.id, obj.kategori)
);

// Generate realistic Enheter (units) for each utrymme
const generateEnheterForUtrymme = (utrymme: Utrymme): Enhet[] => {
  const enheter: Enhet[] = [];

  if (utrymme.typ === 'inomhus') {
    // Common indoor units
    enheter.push(
      {
        id: `${utrymme.id}-belysning`,
        utrymmesId: utrymme.id,
        enhetsTyp: 'Belysning',
        namn: 'Belysning',
        beskrivning: 'Belysningsarmaturer och lysrör'
      },
      {
        id: `${utrymme.id}-ventilation`,
        utrymmesId: utrymme.id,
        enhetsTyp: 'Ventilation',
        namn: 'Ventilation',
        beskrivning: 'Ventilationssystem och fläktar'
      },
      {
        id: `${utrymme.id}-varme`,
        utrymmesId: utrymme.id,
        enhetsTyp: 'Värme',
        namn: 'Värmesystem',
        beskrivning: 'Radiatorer och värmesystem'
      },
      {
        id: `${utrymme.id}-el`,
        utrymmesId: utrymme.id,
        enhetsTyp: 'El',
        namn: 'Eluttag och elinstallationer',
        beskrivning: 'Eluttag, strömbrytare och elinstallationer'
      }
    );

    // Specific units based on room type
    if (utrymme.namn.toLowerCase().includes('kök') || utrymme.namn.toLowerCase().includes('kok')) {
      enheter.push(
        {
          id: `${utrymme.id}-spis`,
          utrymmesId: utrymme.id,
          enhetsTyp: 'Spis',
          namn: 'Spis/Kokplatta',
          beskrivning: 'Spis eller kokplatta'
        },
        {
          id: `${utrymme.id}-diskmaskin`,
          utrymmesId: utrymme.id,
          enhetsTyp: 'Diskmaskin',
          namn: 'Diskmaskin',
          beskrivning: 'Diskmaskin'
        }
      );
    }

    if (utrymme.namn.toLowerCase().includes('wc') || utrymme.namn.toLowerCase().includes('dusch')) {
      enheter.push(
        {
          id: `${utrymme.id}-toalett`,
          utrymmesId: utrymme.id,
          enhetsTyp: 'Toalett',
          namn: 'Toalett',
          beskrivning: 'WC-stol'
        },
        {
          id: `${utrymme.id}-handfat`,
          utrymmesId: utrymme.id,
          enhetsTyp: 'Handfat',
          namn: 'Handfat',
          beskrivning: 'Handfat och kranar'
        }
      );
    }

    if (utrymme.namn.toLowerCase().includes('dusch')) {
      enheter.push({
        id: `${utrymme.id}-dusch`,
        utrymmesId: utrymme.id,
        enhetsTyp: 'Dusch',
        namn: 'Dusch',
        beskrivning: 'Duschkabin och blandare'
      });
    }

  } else {
    // Outdoor units
    enheter.push(
      {
        id: `${utrymme.id}-belysning-ute`,
        utrymmesId: utrymme.id,
        enhetsTyp: 'Belysning',
        namn: 'Utomhusbelysning',
        beskrivning: 'Utomhusarmaturer och gatubelysning'
      },
      {
        id: `${utrymme.id}-mark`,
        utrymmesId: utrymme.id,
        enhetsTyp: 'Mark',
        namn: 'Mark och gräsytor',
        beskrivning: 'Gräsmattor och markarbeten'
      }
    );

    if (utrymme.namn.toLowerCase().includes('lekplats')) {
      enheter.push({
        id: `${utrymme.id}-lekutrustning`,
        utrymmesId: utrymme.id,
        enhetsTyp: 'Lekutrustning',
        namn: 'Lekutrustning',
        beskrivning: 'Gungor, rutschkanor och klätterställningar'
      });
    }
  }

  // Always add "Övrigt" as catch-all
  enheter.push({
    id: `${utrymme.id}-ovrigt`,
    utrymmesId: utrymme.id,
    enhetsTyp: 'Övrigt',
    namn: 'Övrigt',
    beskrivning: 'Övrigt som inte passar övriga kategorier'
  });

  return enheter;
};

// Generate all Enheter for all Utrymmen
export const enheter: Enhet[] = utrymmen.flatMap(utrymme =>
  generateEnheterForUtrymme(utrymme)
);

// Export helper functions for the API
export const fastaStrukturenStore = {
  // Get all objekt (optionally filtered)
  getAllObjekt: (filter?: { kategori?: string }): Objekt[] => {
    let result = objekt;
    if (filter?.kategori) {
      result = result.filter(o => o.kategori === filter.kategori);
    }
    return result;
  },

  // Get specific objekt by ID
  getObjektById: (id: string): Objekt | undefined => {
    return objekt.find(o => o.id === id);
  },

  // Get utrymmen for a specific objekt
  getUtrymmesForObjekt: (objektId: string, typ?: 'inomhus' | 'utomhus'): Utrymme[] => {
    let result = utrymmen.filter(u => u.objektId === objektId);
    if (typ) {
      result = result.filter(u => u.typ === typ);
    }
    return result;
  },

  // Get specific utrymme by ID
  getUtrymmesById: (id: string): Utrymme | undefined => {
    return utrymmen.find(u => u.id === id);
  },

  // Get enheter for a specific utrymme
  getEnheterForUtrymme: (utrymmesId: string): Enhet[] => {
    return enheter.filter(e => e.utrymmesId === utrymmesId);
  },

  // Get specific enhet by ID
  getEnhetById: (id: string): Enhet | undefined => {
    return enheter.find(e => e.id === id);
  }
};
