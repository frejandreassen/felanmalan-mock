'use client';

import { useEffect, useRef } from 'react';
import type { Objekt } from '@/lib/fastaStrukturenStore';
import { getAddressString } from '@/lib/fastaStrukturenStore';

interface MapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Objekt[];
  selectedProperty?: Objekt;
  onSelectProperty: (property: Objekt) => void;
}

export default function MapDialog({
  isOpen,
  onClose,
  properties,
  selectedProperty,
  onSelectProperty
}: MapDialogProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    // Initialize map
    if (!googleMapRef.current) {
      const center = selectedProperty
        ? { lat: selectedProperty.lat, lng: selectedProperty.lng }
        : { lat: 56.90273, lng: 12.4888 }; // Falkenberg center

      googleMapRef.current = new google.maps.Map(mapRef.current, {
        center,
        zoom: selectedProperty ? 15 : 11,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add markers for all properties
    properties.forEach(property => {
      const marker = new google.maps.Marker({
        position: { lat: property.lat, lng: property.lng },
        map: googleMapRef.current,
        title: property.namn,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: selectedProperty?.id === property.id ? 10 : 7,
          fillColor: selectedProperty?.id === property.id ? '#ec4899' : '#3b82f6',
          fillOpacity: selectedProperty?.id === property.id ? 1 : 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${property.namn}</h3>
            ${property.objektNr ? `<p style="margin: 0 0 4px 0; color: #666; font-size: 12px;">${property.objektNr}</p>` : ''}
            <p style="margin: 0; font-size: 12px; color: #666;">${getAddressString(property.adress)}</p>
            <button
              onclick="window.selectPropertyFromMap('${property.id}')"
              style="margin-top: 8px; padding: 6px 12px; background: #ec4899; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;"
            >
              Välj denna fastighet
            </button>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Pan to selected property if exists
    if (selectedProperty && googleMapRef.current) {
      googleMapRef.current.panTo({ lat: selectedProperty.lat, lng: selectedProperty.lng });
      googleMapRef.current.setZoom(15);
    }
  }, [isOpen, properties, selectedProperty]);

  useEffect(() => {
    // Global function to handle selection from info window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).selectPropertyFromMap = (propertyId: string) => {
      const property = properties.find(p => p.id === propertyId);
      if (property) {
        onSelectProperty(property);
        onClose();
      }
    };

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).selectPropertyFromMap;
    };
  }, [properties, onSelectProperty, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Välj fastighet från karta</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />
        </div>

        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            Klicka på en markör för att se mer information och välja fastighet
          </p>
        </div>
      </div>
    </div>
  );
}
