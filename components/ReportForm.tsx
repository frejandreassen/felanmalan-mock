'use client';

import { useState, useEffect } from 'react';
import Combobox from './Combobox';
import MapDialog from './MapDialog';
import { apiClient } from '@/lib/apiClient';
import type { Objekt, Utrymme, Enhet } from '@/lib/fastaStrukturenStore';
import { getAddressString } from '@/lib/fastaStrukturenStore';

interface ReportFormProps {
  initialProperty?: string;
  initialRoom?: string;
}

export default function ReportForm({ initialProperty = '', initialRoom = '' }: ReportFormProps) {
  // Objekt state
  const [objektList, setObjektList] = useState<Objekt[]>([]);
  const [selectedObjektId, setSelectedObjektId] = useState(initialProperty);
  const [selectedObjekt, setSelectedObjekt] = useState<Objekt | undefined>(undefined);
  const [isLoadingObjekt, setIsLoadingObjekt] = useState(false);

  // Utrymme state
  const [utrymmesType, setUtrymmesType] = useState<'inomhus' | 'utomhus'>('inomhus');
  const [utrymmesOptions, setUtrymmesOptions] = useState<Utrymme[]>([]);
  const [selectedUtrymmesId, setSelectedUtrymmesId] = useState(initialRoom);
  const [selectedUtrymme, setSelectedUtrymme] = useState<Utrymme | undefined>(undefined);
  const [isLoadingUtrymmen, setIsLoadingUtrymmen] = useState(false);

  // Enhet state
  const [enheterOptions, setEnheterOptions] = useState<Enhet[]>([]);
  const [selectedEnhetId, setSelectedEnhetId] = useState('');
  const [selectedEnhet, setSelectedEnhet] = useState<Enhet | undefined>(undefined);
  const [isLoadingEnheter, setIsLoadingEnheter] = useState(false);

  // Form state
  const [orderType, setOrderType] = useState<'felanmalan' | 'bestallning'>('felanmalan');
  const [refCode, setRefCode] = useState('');
  const [description, setDescription] = useState('');
  const [contactPerson, setContactPerson] = useState('Frej Andreassen');
  const [email, setEmail] = useState('frej.andreassen@falkenberg.se');
  const [image, setImage] = useState<File | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
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

  // Handle initial room from URL
  useEffect(() => {
    setSelectedUtrymmesId(initialRoom);
  }, [initialRoom]);

  // Load utrymmen when objekt changes
  useEffect(() => {
    if (selectedObjektId) {
      loadUtrymmen(selectedObjektId, utrymmesType);
    } else {
      setUtrymmesOptions([]);
      setSelectedUtrymmesId('');
      setSelectedUtrymme(undefined);
    }
  }, [selectedObjektId, utrymmesType]);

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
      // Authenticate first
      await apiClient.login();

      // Fetch objekt list
      const response = await apiClient.listObjekt();
      setObjektList(response.objekt || []);
    } catch (error) {
      console.error('Error loading objekt:', error);
      setSubmitError('Kunde inte ladda fastigheter. Vänligen ladda om sidan.');
    } finally {
      setIsLoadingObjekt(false);
    }
  };

  const loadUtrymmen = async (objektId: string, typ: 'inomhus' | 'utomhus') => {
    setIsLoadingUtrymmen(true);
    try {
      const response = await apiClient.listUtrymmen(objektId, typ);
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
      // Authenticate first (in real app, this would be done once and token stored)
      await apiClient.login();

      // Create work order
      const workOrder = await apiClient.createWorkOrder({
        externtId: orderType === 'bestallning' ? refCode : undefined,
        ursprung: isConfidential ? 99 : 1, // 1 = Web Portal, 99 = Confidential
        objekt: {
          id: selectedObjekt.id,
          namn: selectedObjekt.namn,
          adress: getAddressString(selectedObjekt.adress)
        },
        utrymme: selectedUtrymme ? {
          id: selectedUtrymme.id,
          namn: selectedUtrymme.namn
        } : undefined,
        enhet: selectedEnhet ? {
          id: selectedEnhet.id,
          namn: selectedEnhet.namn
        } : undefined,
        information: {
          beskrivning: description,
          kommentar: undefined
        },
        annanAnmalare: contactPerson ? {
          namn: contactPerson,
          telefon: '',
          epostAdress: email || undefined
        } : undefined,
        arbetsorderTyp: orderType === 'felanmalan'
          ? { arbetsordertypKod: 'F', arbetsordertypBesk: 'Felanmälan' }
          : { arbetsordertypKod: 'G', arbetsordertypBesk: 'Beställning' },
        prio: {
          prioKod: '10',
          prioBesk: 'Normal'
        },
        bilder: undefined
      });

      setWorkOrderNumber(workOrder.id);
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
    setUtrymmesType('inomhus');
    setSelectedEnhetId('');
    setSelectedEnhet(undefined);
    setDescription('');
    setContactPerson('Frej Andreassen');
    setEmail('frej.andreassen@falkenberg.se');
    setImage(null);
    setIsConfidential(false);
  };

  const handleMapSelect = (property: Objekt) => {
    setSelectedObjektId(property.id);
    setSelectedObjekt(property);
    setSelectedUtrymmesId(''); // Reset room when property changes
    setSelectedUtrymme(undefined);
  };

  const handleObjektChange = (value: string) => {
    setSelectedObjektId(value);
    const objekt = objektList.find(o => o.id === value);
    setSelectedObjekt(objekt);
    setSelectedUtrymmesId(''); // Reset room when property changes
    setSelectedUtrymme(undefined);
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

  const utrymmesTypeOptions = [
    { value: 'inomhus', label: 'Inomhus' },
    { value: 'utomhus', label: 'Utomhus' }
  ];

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
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Combobox
                  label="Fastighet / objekt"
                  options={objektOptions}
                  value={selectedObjektId}
                  onChange={handleObjektChange}
                  placeholder={isLoadingObjekt ? "Laddar fastigheter..." : "Sök fastighet..."}
                  disabled={isLoadingObjekt}
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
            {selectedObjekt && (
              <p className="text-sm text-gray-600 mt-2">
                📍 {getAddressString(selectedObjekt.adress)}
              </p>
            )}
          </div>

          <div>
            <Combobox
              label="Utrymme"
              options={utrymmesTypeOptions}
              value={utrymmesType}
              onChange={(value) => setUtrymmesType(value as 'inomhus' | 'utomhus')}
              placeholder="Välj utrymme..."
            />
          </div>

          <div>
            <Combobox
              label="Lokal / rum"
              options={utrymmesComboboxOptions}
              value={selectedUtrymmesId}
              onChange={handleUtrymmesChange}
              placeholder={
                !selectedObjektId ? "Välj fastighet först..." :
                isLoadingUtrymmen ? "Laddar lokaler..." :
                "Välj lokal..."
              }
              disabled={!selectedObjektId || isLoadingUtrymmen}
            />
            {selectedObjektId && utrymmesOptions.length === 0 && !isLoadingUtrymmen && (
              <p className="text-sm text-gray-500 mt-1">
                Inga lokaler hittades för denna fastighet och utrymme.
              </p>
            )}
          </div>

          <div>
            <Combobox
              label="Enhet / System"
              options={enhetComboboxOptions}
              value={selectedEnhetId}
              onChange={handleEnhetChange}
              placeholder={
                !selectedUtrymmesId ? "Välj lokal först..." :
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

          <div>
            <label className="block text-sm font-medium mb-1">Kontaktperson</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Namn på kontaktperson"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">E-post</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-post till kontaktperson"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

      <MapDialog
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        properties={objektList}
        selectedProperty={selectedObjekt}
        onSelectProperty={handleMapSelect}
      />
    </>
  );
}
