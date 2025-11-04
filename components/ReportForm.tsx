'use client';

import { useState, useEffect } from 'react';
import Combobox from './Combobox';
import { apiClient } from '@/lib/apiClient';
import type { Objekt, Utrymme, Enhet } from '@/lib/fastaStrukturenStore';
import { getAddressString } from '@/lib/fastaStrukturenStore';

interface ReportFormProps {
  initialProperty?: string;
  initialUtrymme?: string;
  initialEnhet?: string;
  onWorkOrdersLoaded?: (workOrders: any[]) => void;
  onObjektSelected?: (objekt: { id: string; namn: string } | null) => void;
}

export default function ReportForm({ initialProperty = '', initialUtrymme = '', initialEnhet = '', onWorkOrdersLoaded, onObjektSelected }: ReportFormProps) {
  // Objekt state
  const [objektList, setObjektList] = useState<Objekt[]>([]);
  const [selectedObjektId, setSelectedObjektId] = useState(initialProperty);
  const [selectedObjekt, setSelectedObjekt] = useState<Objekt | undefined>(undefined);
  const [isLoadingObjekt, setIsLoadingObjekt] = useState(false);

  // Utrymme state
  const [utrymmesOptions, setUtrymmesOptions] = useState<Utrymme[]>([]);
  const [selectedUtrymmesId, setSelectedUtrymmesId] = useState(initialUtrymme);
  const [selectedUtrymme, setSelectedUtrymme] = useState<Utrymme | undefined>(undefined);
  const [isLoadingUtrymmen, setIsLoadingUtrymmen] = useState(false);

  // Enhet state
  const [enheterOptions, setEnheterOptions] = useState<Enhet[]>([]);
  const [selectedEnhetId, setSelectedEnhetId] = useState(initialEnhet);
  const [selectedEnhet, setSelectedEnhet] = useState<Enhet | undefined>(undefined);
  const [isLoadingEnheter, setIsLoadingEnheter] = useState(false);

  // Mock customer (logged-in user / reporter) - Later from AD
  const mockCustomer = {
    namn: 'Frej Andreassen',
    telefon: '0346-88 60 00',
    epostAdress: 'frej.andreassen@falkenberg.se'
  };

  // Form state
  const [orderType, setOrderType] = useState<'felanmalan' | 'bestallning'>('felanmalan');
  const [refCode, setRefCode] = useState('');
  const [description, setDescription] = useState('');
  const [contactPerson, setContactPerson] = useState(mockCustomer.namn);
  const [phone, setPhone] = useState(mockCustomer.telefon);
  const [email, setEmail] = useState(mockCustomer.epostAdress);
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [workOrderNumber, setWorkOrderNumber] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);

  // Load objekt list on mount
  useEffect(() => {
    loadObjektList();
  }, []);

  // Handle initial property from URL
  useEffect(() => {
    if (initialProperty && objektList.length > 0) {
      const obj = objektList.find(o => o.id === initialProperty);
      if (obj) {
        setSelectedObjekt(obj);
        setSelectedObjektId(obj.id);
      }
    }
  }, [initialProperty, objektList]);

  // Handle initial utrymme from URL
  useEffect(() => {
    if (initialUtrymme && utrymmesOptions.length > 0) {
      const utrymme = utrymmesOptions.find(u => u.id === initialUtrymme);
      if (utrymme) {
        setSelectedUtrymmesId(initialUtrymme);
        setSelectedUtrymme(utrymme);
      }
    }
  }, [initialUtrymme, utrymmesOptions]);

  // Handle initial enhet from URL
  useEffect(() => {
    if (initialEnhet && enheterOptions.length > 0) {
      const enhet = enheterOptions.find(e => e.id === initialEnhet);
      if (enhet) {
        setSelectedEnhetId(initialEnhet);
        setSelectedEnhet(enhet);
      }
    }
  }, [initialEnhet, enheterOptions]);

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

  // Load work orders when object is selected
  useEffect(() => {
    if (selectedObjektId) {
      loadWorkOrdersForObject(selectedObjektId);
    }
  }, [selectedObjektId]);

  const loadObjektList = async () => {
    setIsLoadingObjekt(true);
    try {
      // BFF handles authentication - no need to login manually
      const response = await apiClient.listObjekt();
      setObjektList(response.objekt || []);
    } catch (error) {
      console.error('Error loading objekt:', error);
      setSubmitError('Kunde inte ladda fastigheter. Vänligen ladda om sidan.');
    } finally {
      setIsLoadingObjekt(false);
    }
  };

  const loadUtrymmen = async (objektId: string) => {
    setIsLoadingUtrymmen(true);
    try {
      const response = await apiClient.listUtrymmen(objektId);
      console.log('[ReportForm] Loaded utrymmen:', response);
      setUtrymmesOptions(response.utrymmen || []);

      // Reset selected utrymme if it doesn't exist in new list
      if (selectedUtrymmesId && !response.utrymmen?.find((u: Utrymme) => u.id === selectedUtrymmesId)) {
        setSelectedUtrymmesId('');
        setSelectedUtrymme(undefined);
      }
    } catch (error) {
      console.error('[ReportForm] Error loading utrymmen:', error);
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

  const loadWorkOrdersForObject = async (objektId: string) => {
    try {
      console.log('[ReportForm] Loading work orders for object:', objektId);
      const response = await apiClient.listWorkOrdersForObject(objektId);
      console.log('[ReportForm] Work orders loaded:', response);

      // Pass work orders to parent component for display
      if (onWorkOrdersLoaded && Array.isArray(response)) {
        onWorkOrdersLoaded(response);
      } else if (onWorkOrdersLoaded) {
        onWorkOrdersLoaded([]);
      }
    } catch (error) {
      console.error('Error loading work orders:', error);
      if (onWorkOrdersLoaded) {
        onWorkOrdersLoaded([]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedObjekt) {
      setSubmitError('Vänligen välj en fastighet');
      return;
    }

    if (orderType === 'bestallning' && !refCode.trim()) {
      setSubmitError('Vänligen ange referenskod för beställning');
      return;
    }

    if (!description.trim()) {
      setSubmitError('Vänligen beskriv felet');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      // BFF handles authentication - no need to login manually

      // Step 1: Upload file if present
      let uploadedFileName: string | undefined;
      if (image) {
        try {
          const uploadResult = await apiClient.uploadTempFile(image);
          uploadedFileName = uploadResult.fileName;
          console.log('[ReportForm] File uploaded:', uploadedFileName);
        } catch (error) {
          console.error('[ReportForm] File upload failed:', error);
          setSubmitError('Kunde inte ladda upp bild. Försök igen.');
          setIsSubmitting(false);
          return;
        }
      }

      // Step 2: Build work order payload
      // Minimal payload based on API team feedback
      // Strip phone numbers to only digits
      const cleanPhone = (phoneStr: string) => phoneStr.replace(/[^\d]/g, '');

      // Check if contact person is different from anmalare (logged-in user)
      const contactIsDifferent =
        contactPerson !== mockCustomer.namn ||
        phone !== mockCustomer.telefon ||
        email !== mockCustomer.epostAdress;

      // Build description - append reference code and contact info if needed
      let finalDescription = description;

      // Add reference code to description for beställning
      if (orderType === 'bestallning' && refCode.trim()) {
        finalDescription += `\n\nReferenskod: ${refCode}`;
      }

      // Append contact info if different from anmalare
      if (contactIsDifferent) {
        finalDescription += '\n\nOBS! Kontaktperson i ärendet är:\n';
        if (contactPerson && contactPerson !== mockCustomer.namn) {
          finalDescription += `Namn: ${contactPerson}\n`;
        }
        if (phone && phone !== mockCustomer.telefon) {
          finalDescription += `Telefon: ${cleanPhone(phone)}\n`;
        }
        if (email && email !== mockCustomer.epostAdress) {
          finalDescription += `E-post: ${email}`;
        }
      }

      const workOrderPayload: any = {
        arbetsordertypKod: orderType === 'felanmalan' ? 'F' : 'G', // F = Felanmälan, G = Beställning
        kundNr: process.env.NEXT_PUBLIC_KUND_NR || 'SERVA10311',
        objektId: selectedObjekt.id,
        ursprung: '1', // Always 1 for Web Portal
        information: {
          beskrivning: finalDescription,
        },
        anmalare: {
          namn: mockCustomer.namn, // Always use logged-in user as anmalare
          telefon: cleanPhone(mockCustomer.telefon),
          epostAdress: mockCustomer.epostAdress
        }
      };

      // Add fakturera property for beställningar (type G)
      if (orderType === 'bestallning') {
        workOrderPayload.fakturera = {
          faktureras: 'true'
        };
      }

      // Add optional fields only if they have values
      if (isConfidential) {
        workOrderPayload.externtNr = 'CONFIDENTIAL'; // Mark as confidential using externtNr
      }

      if (selectedUtrymme && selectedUtrymme.id) {
        workOrderPayload.utrymmesId = parseInt(selectedUtrymme.id);
      }

      if (selectedEnhet && selectedEnhet.id) {
        workOrderPayload.enhetsId = parseInt(selectedEnhet.id);
      }

      // Create work order
      const workOrder = await apiClient.createWorkOrder(workOrderPayload);

      setWorkOrderNumber(workOrder.arbetsorderId || workOrder.id);
      setSubmitSuccess(true);

      // Reset form after successful submission
      setTimeout(() => {
        handleReset();
        setSubmitSuccess(false);
        setWorkOrderNumber('');
      }, 5000);

    } catch (error) {
      console.error('Error submitting work order:', error);
      setSubmitError(error instanceof Error ? error.message : 'Något gick fel vid inskickning');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setOrderType('felanmalan');
    setRefCode('');
    setSelectedObjektId('');
    setSelectedObjekt(undefined);
    setSelectedUtrymmesId('');
    setSelectedUtrymme(undefined);
    setSelectedEnhetId('');
    setSelectedEnhet(undefined);
    setDescription('');
    setContactPerson(mockCustomer.namn);
    setPhone(mockCustomer.telefon);
    setEmail(mockCustomer.epostAdress);
    setImage(null);
    setIsConfidential(false);

    // Notify parent that object was cleared
    if (onObjektSelected) {
      onObjektSelected(null);
    }
    if (onWorkOrdersLoaded) {
      onWorkOrdersLoaded([]);
    }
  };

  const handleObjektChange = (value: string) => {
    setSelectedObjektId(value);
    const objekt = objektList.find(o => o.id === value);
    setSelectedObjekt(objekt);
    setSelectedUtrymmesId(''); // Reset room when property changes
    setSelectedUtrymme(undefined);

    // Notify parent component of selected object
    if (onObjektSelected && objekt) {
      onObjektSelected({ id: objekt.id, namn: objekt.namn });
    } else if (onObjektSelected && !objekt) {
      onObjektSelected(null);
    }
  };

  const handleUtrymmesChange = (value: string) => {
    setSelectedUtrymmesId(value);
    const utrymme = utrymmesOptions.find(u => u.id === value);
    setSelectedUtrymme(utrymme);
  };

  const handleEnhetChange = (value: string) => {
    setSelectedEnhetId(value);
    const enhet = enheterOptions.find(e => e.id === value);
    setSelectedEnhet(enhet);
  };

  // Prepare options for comboboxes
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

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">
          {orderType === 'felanmalan' ? 'Skapa felanmälan' : 'Skapa beställning'}
        </h2>

        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <h3 className="font-semibold text-green-800">
                  {orderType === 'felanmalan' ? 'Felanmälan skickad!' : 'Beställning skickad!'}
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  {orderType === 'felanmalan' ? 'Din felanmälan' : 'Din beställning'} har registrerats med ärendenummer: <strong>{workOrderNumber}</strong>
                </p>
                <p className="text-sm text-green-600 mt-2">
                  Formuläret rensas automatiskt om 5 sekunder...
                </p>
              </div>
            </div>
          </div>
        )}

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <span className="text-2xl mr-3">❌</span>
              <div>
                <h3 className="font-semibold text-red-800">Fel vid inskickning</h3>
                <p className="text-sm text-red-700 mt-1">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
              label="Utrymme"
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
          </div>

          <div>
            <Combobox
              label="Enhet"
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
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Beskrivning</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                orderType === 'felanmalan'
                  ? "Beskriv felet eller servicebehovet..."
                  : "Beskriv beställningen..."
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Order Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">Typ av ärende</label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="orderType"
                  value="felanmalan"
                  checked={orderType === 'felanmalan'}
                  onChange={(e) => setOrderType(e.target.value as 'felanmalan' | 'bestallning')}
                  className="w-4 h-4 text-pink-400 focus:ring-pink-400 focus:ring-2"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Felanmälan</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="orderType"
                  value="bestallning"
                  checked={orderType === 'bestallning'}
                  onChange={(e) => setOrderType(e.target.value as 'felanmalan' | 'bestallning')}
                  className="w-4 h-4 text-pink-400 focus:ring-pink-400 focus:ring-2"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Beställning</span>
              </label>
            </div>
          </div>

          {/* Ref Code - Only for Beställning */}
          {orderType === 'bestallning' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Referenskod <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
                placeholder="Ange referenskod för beställning"
                required={orderType === 'bestallning'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Referenskod är obligatoriskt för beställningar
              </p>
            </div>
          )}

          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <p className="text-sm text-gray-600 mb-3">
              ℹ️ Kontaktuppgifter som tekniker kan kontakta vid felavhjälpning
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kontaktperson</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Namn på kontaktperson"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Telefonnummer</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Telefonnummer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">E-post</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-post"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ladda upp bild (valfritt)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {image && (
              <p className="text-sm text-green-600 mt-1">
                ✓ Bild vald: {image.name}
              </p>
            )}
          </div>

          {/* Confidential Checkbox */}
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <label className="flex items-start cursor-pointer group">
              <input
                type="checkbox"
                checked={isConfidential}
                onChange={(e) => setIsConfidential(e.target.checked)}
                className="mt-1 w-4 h-4 text-orange-500 focus:ring-orange-400 focus:ring-2 rounded"
              />
              <div className="ml-3 flex-1">
                <span className="text-sm font-medium text-gray-700">
                  Sekretessmarkera arbetsorder
                </span>
                <p className="text-xs text-gray-500 mt-1" title="Sekretessmarkerade arbetsorder visas inte i publika listor eller rapporter. Använd detta för känsliga ärenden som kräver extra sekretesskydd.">
                  ℹ️ Sekretessmarkerade arbetsorder filtreras bort från visningar och rapporter. Använd för känsliga ärenden.
                </p>
              </div>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-pink-400 text-white py-3 px-6 rounded-md font-semibold hover:bg-pink-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Skickar...</span>
                </>
              ) : (
                orderType === 'felanmalan' ? 'Skicka felanmälan' : 'Skicka beställning'
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 rounded-md font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rensa
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
