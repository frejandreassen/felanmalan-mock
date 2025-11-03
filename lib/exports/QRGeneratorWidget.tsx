'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { apiClient } from '@/lib/apiClient';
import type { Objekt, Utrymme, Enhet } from '@/lib/fastaStrukturenStore';
import { getAddressString } from '@/lib/fastaStrukturenStore';
import Combobox from '@/components/Combobox';

export interface QRGeneratorWidgetProps {
  /** Base URL for the API endpoints */
  apiBaseUrl?: string;

  /** Base URL for generated QR codes (e.g., 'https://your-intranet.com') */
  baseUrl?: string;

  /** Custom CSS class name for the container */
  className?: string;
}

/**
 * QRGeneratorWidget - QR code generator for fault reporting
 *
 * This component generates QR codes that link to the fault reporting form
 * with pre-filled property and room information. Users can print or download
 * the QR codes to place at specific locations.
 *
 * @example
 * ```tsx
 * import { QRGeneratorWidget } from 'felanmalan-widgets';
 *
 * function QRPage() {
 *   return (
 *     <QRGeneratorWidget
 *       apiBaseUrl="/api/felanmalan"
 *       baseUrl="https://intranet.example.com"
 *     />
 *   );
 * }
 * ```
 */
export default function QRGeneratorWidget({
  apiBaseUrl,
  baseUrl,
  className = ''
}: QRGeneratorWidgetProps) {
  // Objekt state
  const [objektList, setObjektList] = useState<Objekt[]>([]);
  const [selectedObjektId, setSelectedObjektId] = useState('');
  const [selectedObjekt, setSelectedObjekt] = useState<Objekt | undefined>(undefined);
  const [isLoadingObjekt, setIsLoadingObjekt] = useState(false);

  // Utrymme state
  const [utrymmesOptions, setUtrymmesOptions] = useState<Utrymme[]>([]);
  const [selectedUtrymmesId, setSelectedUtrymmesId] = useState('');
  const [selectedUtrymme, setSelectedUtrymme] = useState<Utrymme | undefined>(undefined);
  const [isLoadingUtrymmen, setIsLoadingUtrymmen] = useState(false);

  // Enhet state
  const [enheterOptions, setEnheterOptions] = useState<Enhet[]>([]);
  const [selectedEnhetId, setSelectedEnhetId] = useState('');
  const [selectedEnhet, setSelectedEnhet] = useState<Enhet | undefined>(undefined);
  const [isLoadingEnheter, setIsLoadingEnheter] = useState(false);

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Load objekt list on mount
  useEffect(() => {
    loadObjektList();
  }, []);

  // Load utrymmen when objekt changes
  useEffect(() => {
    if (selectedObjektId) {
      loadUtrymmen(selectedObjektId);
    } else {
      setUtrymmesOptions([]);
      setSelectedUtrymmesId('');
      setSelectedUtrymme(undefined);
    }
  }, [selectedObjektId]);

  // Load enheter when utrymme changes
  useEffect(() => {
    if (selectedUtrymmesId) {
      loadEnheter(selectedUtrymmesId);
    } else {
      setEnheterOptions([]);
      setSelectedEnhetId('');
      setSelectedEnhet(undefined);
    }
  }, [selectedUtrymmesId]);

  const loadObjektList = async () => {
    setIsLoadingObjekt(true);
    try {
      const response = await apiClient.listObjekt();
      setObjektList(response.objekt || []);
    } catch (error) {
      console.error('Error loading objekt:', error);
    } finally {
      setIsLoadingObjekt(false);
    }
  };

  const loadUtrymmen = async (objektId: string) => {
    setIsLoadingUtrymmen(true);
    try {
      const response = await apiClient.listUtrymmen(objektId);
      setUtrymmesOptions(response.utrymmen || []);

      // Reset selected utrymme if it doesn't exist in new list
      if (selectedUtrymmesId && !response.utrymmen?.find((u: Utrymme) => u.id === selectedUtrymmesId)) {
        setSelectedUtrymmesId('');
        setSelectedUtrymme(undefined);
      }
    } catch (error) {
      console.error('Error loading utrymmen:', error);
      setUtrymmesOptions([]);
    } finally {
      setIsLoadingUtrymmen(false);
    }
  };

  const loadEnheter = async (utrymmesId: string) => {
    setIsLoadingEnheter(true);
    try {
      const response = await apiClient.listEnheter(utrymmesId);
      setEnheterOptions(response.enheter || []);
    } catch (error) {
      console.error('Error loading enheter:', error);
      setEnheterOptions([]);
    } finally {
      setIsLoadingEnheter(false);
    }
  };

  const objektOptions = objektList.map(o => ({
    value: o.id,
    label: `${o.namn}${o.objektNr ? ` (${o.objektNr})` : ''}`
  }));

  const utrymmesComboboxOptions = utrymmesOptions.map(u => ({
    value: u.id,
    label: u.namn
  }));

  const enhetComboboxOptions = enheterOptions.map(e => ({
    value: e.id,
    label: e.namn
  }));

  const generateQRCode = async () => {
    if (!selectedObjekt) {
      alert('Vänligen välj ett objekt');
      return;
    }

    try {
      // Build URL with query parameters
      const effectiveBaseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
      const params = new URLSearchParams();
      params.append('objekt', selectedObjekt.id);

      if (selectedUtrymme) {
        params.append('utrymme', selectedUtrymme.id);
      }

      if (selectedEnhet) {
        params.append('enhet', selectedEnhet.id);
      }

      const url = `${effectiveBaseUrl}/?${params.toString()}`;
      setGeneratedUrl(url);

      // Generate QR code data URL
      const dataUrl = await QRCode.toDataURL(url, {
        width: 600,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

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
      const filename = `QR-${selectedObjekt?.objektNr || selectedObjekt?.id}${selectedUtrymme ? `-${selectedUtrymme.id}` : ''}${selectedEnhet ? `-${selectedEnhet.id}` : ''}.png`;
      link.download = filename;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  const handleObjektChange = (value: string) => {
    setSelectedObjektId(value);
    const objekt = objektList.find(o => o.id === value);
    setSelectedObjekt(objekt);
    setSelectedUtrymmesId(''); // Reset utrymme when objekt changes
    setSelectedUtrymme(undefined);
    setSelectedEnhetId(''); // Reset enhet
    setSelectedEnhet(undefined);
  };

  const handleUtrymmesChange = (value: string) => {
    setSelectedUtrymmesId(value);
    const utrymme = utrymmesOptions.find(u => u.id === value);
    setSelectedUtrymme(utrymme);
    setSelectedEnhetId(''); // Reset enhet when utrymme changes
    setSelectedEnhet(undefined);
  };

  const handleEnhetChange = (value: string) => {
    setSelectedEnhetId(value);
    const enhet = enheterOptions.find(e => e.id === value);
    setSelectedEnhet(enhet);
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

      <div className={`qr-generator-widget ${className}`}>
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
                  <Combobox
                    label="Objekt"
                    options={objektOptions}
                    value={selectedObjektId}
                    onChange={handleObjektChange}
                    placeholder={isLoadingObjekt ? "Laddar objekt..." : "Sök objekt..."}
                    disabled={isLoadingObjekt}
                  />
                  {selectedObjekt && (
                    <p className="text-sm text-gray-600 mt-2">
                      📍 {getAddressString(selectedObjekt.adress)}
                    </p>
                  )}
                </div>

                <div>
                  <Combobox
                    label="Utrymme (valfritt)"
                    options={utrymmesComboboxOptions}
                    value={selectedUtrymmesId}
                    onChange={handleUtrymmesChange}
                    placeholder={
                      !selectedObjektId ? "Välj objekt först..." :
                      isLoadingUtrymmen ? "Laddar utrymmen..." :
                      "Välj utrymme..."
                    }
                    disabled={!selectedObjektId || isLoadingUtrymmen}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Om du inte väljer utrymme kommer användaren att kunna välja själv
                  </p>
                </div>

                <div>
                  <Combobox
                    label="Enhet (valfritt)"
                    options={enhetComboboxOptions}
                    value={selectedEnhetId}
                    onChange={handleEnhetChange}
                    placeholder={
                      !selectedUtrymmesId ? "Välj utrymme först..." :
                      isLoadingEnheter ? "Laddar enheter..." :
                      "Välj enhet..."
                    }
                    disabled={!selectedUtrymmesId || isLoadingEnheter}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Om du inte väljer enhet kommer användaren att kunna välja själv
                  </p>
                </div>

                <button
                  onClick={generateQRCode}
                  disabled={!selectedObjekt}
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
                        {selectedObjekt?.namn}
                      </p>
                      {selectedObjekt?.objektNr && (
                        <p className="text-sm text-gray-600 mb-1">
                          {selectedObjekt.objektNr}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mb-2">
                        {selectedObjekt && getAddressString(selectedObjekt.adress)}
                      </p>
                      {(selectedUtrymme || selectedEnhet) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          {selectedUtrymme && (
                            <p className="text-sm font-semibold text-gray-700">
                              Utrymme: {selectedUtrymme.namn}
                            </p>
                          )}
                          {selectedEnhet && (
                            <p className="text-sm font-semibold text-gray-700">
                              Enhet: {selectedEnhet.namn}
                            </p>
                          )}
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
                    <p className="text-lg mb-2">Välj objekt och generera QR-kod</p>
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
                <p>Välj objekt och eventuellt specifikt utrymme/enhet. Klicka på &quot;Generera QR-kod&quot;.</p>
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
      </div>
    </>
  );
}
