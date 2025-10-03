'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { properties, getRoomsForProperty, categories, type Property } from '@/lib/data';
import Combobox from '@/components/Combobox';
import MapDialog from '@/components/MapDialog';
import Header from '@/components/Header';

export default function QRGeneratorPage() {
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | undefined>(undefined);
  const [selectedLocation, setSelectedLocation] = useState('inomhus');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedPropertyId) {
      const prop = properties.find(p => p.id === selectedPropertyId);
      setSelectedProperty(prop);
    }
  }, [selectedPropertyId]);

  const propertyOptions = properties.map(p => ({
    value: p.id,
    label: `${p.name}${p.code ? ` (${p.code})` : ''}`
  }));

  const locationOptions = categories.map(c => ({
    value: c.id,
    label: c.name
  }));

  const roomOptions = selectedProperty
    ? getRoomsForProperty(selectedProperty.id, selectedProperty.category)
        .filter(r => r.type === selectedLocation)
        .map(r => ({ value: r.id, label: r.name }))
    : [];

  const generateQRCode = async () => {
    if (!selectedProperty) {
      alert('Vänligen välj en fastighet');
      return;
    }

    try {
      // Build URL with query parameters
      const baseUrl = window.location.origin;
      const params = new URLSearchParams();
      params.append('objekt', selectedProperty.id);
      if (selectedRoom) {
        const room = getRoomsForProperty(selectedProperty.id, selectedProperty.category).find(r => r.id === selectedRoom);
        if (room) params.append('rum', room.id);
      }

      const url = `${baseUrl}/?${params.toString()}`;
      setGeneratedUrl(url);

      console.log('Generating QR code for URL:', url);

      // Generate QR code data URL
      const dataUrl = await QRCode.toDataURL(url, {
        width: 600,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      console.log('QR code generated successfully');
      setQrCodeUrl(dataUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
      alert('Fel vid generering av QR-kod: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      const filename = `QR-${selectedProperty?.code || selectedProperty?.id}-${selectedRoom || 'alla'}.png`;
      link.download = filename;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  const getRoomName = () => {
    if (!selectedRoom || !selectedProperty) return '';
    const room = getRoomsForProperty(selectedProperty.id, selectedProperty.category).find(r => r.id === selectedRoom);
    return room?.name || '';
  };

  const getLocationName = () => {
    const location = categories.find(c => c.id === selectedLocation);
    return location?.name || '';
  };

  const handleMapSelect = (property: Property) => {
    setSelectedPropertyId(property.id);
    setSelectedProperty(property);
    setSelectedRoom(''); // Reset room when property changes
    setIsMapOpen(false);
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area,
          #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="no-print">
        <Header />
      </div>

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="no-print mb-8">
            <h1 className="text-3xl font-bold mb-2">QR-kod Generator</h1>
            <p className="text-gray-600">Skapa QR-koder för snabb felanmälan på specifika platser</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Configuration Form */}
            <div className="bg-white rounded-lg shadow-md p-6 no-print h-fit">
              <h2 className="text-xl font-bold mb-6">Välj plats för QR-kod</h2>

              <div className="space-y-6">
                <div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Combobox
                        label="Fastighet / objekt"
                        options={propertyOptions}
                        value={selectedPropertyId}
                        onChange={(value) => {
                          setSelectedPropertyId(value);
                          setSelectedRoom(''); // Reset room when property changes
                        }}
                        placeholder="Sök fastighet..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMapOpen(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors h-[42px] flex items-center gap-2"
                    >
                      <span>📍</span>
                      <span>Hitta på karta</span>
                    </button>
                  </div>
                  {selectedProperty && (
                    <p className="text-sm text-gray-600 mt-2">
                      📍 {selectedProperty.address}
                    </p>
                  )}
                </div>

                <div>
                  <Combobox
                    label="Utrymme"
                    options={locationOptions}
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    placeholder="Välj utrymme..."
                  />
                </div>

                <div>
                  <Combobox
                    label="Lokal / rum (valfritt)"
                    options={roomOptions}
                    value={selectedRoom}
                    onChange={setSelectedRoom}
                    placeholder="Välj lokal..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Om du inte väljer lokal kommer användaren att kunna välja själv
                  </p>
                </div>

                <button
                  onClick={generateQRCode}
                  disabled={!selectedProperty}
                  className="w-full bg-pink-400 text-white py-3 px-6 rounded-md font-semibold hover:bg-pink-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Generera QR-kod
                </button>

                {generatedUrl && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Genererad URL:</p>
                    <p className="text-xs font-mono text-gray-800 break-all">{generatedUrl}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview & Print Area */}
            <div>
              <div ref={printAreaRef} id="print-area" className="bg-white rounded-lg shadow-md p-8">
                {qrCodeUrl ? (
                  <div className="text-center">
                    <div className="mb-6">
                      <div className="flex items-center gap-3 justify-center mb-2">
                        <div className="bg-[#0d47a1] text-white p-2 rounded">
                          <div className="font-bold text-lg">FK</div>
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-lg">Falkenbergs</div>
                          <div className="font-bold text-lg -mt-1">kommun</div>
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">Felanmälan</h2>
                    </div>

                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-semibold text-gray-900 mb-1">
                        {selectedProperty?.name}
                      </p>
                      {selectedProperty?.code && (
                        <p className="text-sm text-gray-600 mb-1">
                          {selectedProperty.code}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mb-2">
                        {selectedProperty?.address}
                      </p>
                      {selectedRoom && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm font-semibold text-gray-700">
                            {getLocationName()} • {getRoomName()}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center mb-6">
                      {qrCodeUrl && (
                        <Image src={qrCodeUrl} alt="QR Code" width={600} height={600} className="border-4 border-gray-200 rounded-lg" />
                      )}
                      <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-700 mb-2">
                        Scanna QR-koden för att rapportera fel
                      </p>
                      <p className="text-xs text-gray-500 break-all">
                        {generatedUrl}
                      </p>
                    </div>

                    <div className="no-print flex gap-3 justify-center mt-8">
                      <button
                        onClick={handlePrint}
                        className="px-6 py-2 bg-blue-500 text-white rounded-md font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <span>🖨️</span>
                        <span>Skriv ut</span>
                      </button>
                      <button
                        onClick={downloadQRCode}
                        className="px-6 py-2 bg-green-500 text-white rounded-md font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        <span>💾</span>
                        <span>Ladda ner</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">Välj fastighet och generera QR-kod</p>
                    <p className="text-sm">QR-koden kommer att visas här</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 no-print">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Så här använder du QR-koder</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-800">
              <div>
                <h4 className="font-semibold mb-2">1. Generera QR-kod</h4>
                <p>Välj fastighet och eventuellt specifik lokal/rum. Klicka på &quot;Generera QR-kod&quot;.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Skriv ut eller ladda ner</h4>
                <p>Använd &quot;Skriv ut&quot; för fysisk skyltning eller &quot;Ladda ner&quot; för digital användning.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Placera QR-koden</h4>
                <p>Sätt upp QR-koden på den plats där felanmälan ska göras (t.ex. vid entré, i klassrum, vid toaletter).</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">4. Scanna och rapportera</h4>
                <p>När någon scannar QR-koden öppnas formuläret med förifylld information - användaren behöver bara beskriva felet!</p>
              </div>
            </div>
          </div>
        </div>

        <MapDialog
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          properties={properties}
          selectedProperty={selectedProperty}
          onSelectProperty={handleMapSelect}
        />
      </div>
    </>
  );
}
