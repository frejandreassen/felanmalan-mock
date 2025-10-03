'use client';

import { useState, useEffect } from 'react';
import Combobox from './Combobox';
import MapDialog from './MapDialog';
import { properties, getRoomsForProperty, categories, units, getUnitsForLocation, getPropertyById, type Property } from '@/lib/data';
import { apiClient } from '@/lib/apiClient';

interface ReportFormProps {
  initialProperty?: string;
  initialRoom?: string;
}

export default function ReportForm({ initialProperty = '', initialRoom = '' }: ReportFormProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialProperty);
  const [selectedProperty, setSelectedProperty] = useState<Property | undefined>(undefined);
  const [selectedRoom, setSelectedRoom] = useState(initialRoom);
  const [selectedLocation, setSelectedLocation] = useState('inomhus');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [description, setDescription] = useState('');
  const [reporter, setReporter] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [component, setComponent] = useState('');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [workOrderNumber, setWorkOrderNumber] = useState('');

  useEffect(() => {
    setSelectedPropertyId(initialProperty);
    if (initialProperty) {
      const prop = getPropertyById(initialProperty);
      setSelectedProperty(prop);
    }
  }, [initialProperty]);

  useEffect(() => {
    setSelectedRoom(initialRoom);
  }, [initialRoom]);

  useEffect(() => {
    if (selectedPropertyId) {
      const prop = getPropertyById(selectedPropertyId);
      setSelectedProperty(prop);
    }
  }, [selectedPropertyId]);

  const propertyOptions = properties.map(p => ({
    value: p.id,
    label: `${p.name}${p.code ? ` (${p.code})` : ''}`
  }));

  const roomOptions = selectedProperty
    ? getRoomsForProperty(selectedProperty.id, selectedProperty.category)
        .filter(r => r.type === selectedLocation)
        .map(r => ({ value: r.id, label: r.name }))
    : [];

  const locationOptions = categories.map(c => ({
    value: c.id,
    label: c.name
  }));

  const unitOptions = getUnitsForLocation(selectedLocation, selectedProperty?.category).map(u => ({
    value: u.id,
    label: u.name
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProperty) {
      setSubmitError('Vänligen välj en fastighet');
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

      // Find room and unit names
      const room = selectedRoom ? getRoomsForProperty(selectedProperty.id, selectedProperty.category).find(r => r.id === selectedRoom) : undefined;
      const unit = selectedUnit ? units.find(u => u.id === selectedUnit) : undefined;

      // Create work order
      const workOrder = await apiClient.createWorkOrder({
        objekt: {
          id: selectedProperty.id,
          namn: selectedProperty.name,
          adress: selectedProperty.address
        },
        utrymme: room ? {
          id: room.id,
          namn: room.name
        } : undefined,
        enhet: unit ? {
          id: unit.id,
          namn: unit.name
        } : undefined,
        information: {
          beskrivning: description,
          kommentar: component || undefined
        },
        annanAnmalare: reporter ? {
          namn: reporter,
          telefon: '',
          epostAdress: email || undefined
        } : undefined,
        prio: {
          prioKod: '10',
          prioBesk: 'Normal'
        },
        bilder: imageUrl ? [imageUrl] : undefined
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
    setSelectedPropertyId('');
    setSelectedProperty(undefined);
    setSelectedRoom('');
    setSelectedLocation('inomhus');
    setSelectedUnit('');
    setDescription('');
    setReporter('');
    setEmail('');
    setImage(null);
    setImageUrl('');
    setComponent('');
  };

  const handleMapSelect = (property: Property) => {
    setSelectedPropertyId(property.id);
    setSelectedProperty(property);
    setSelectedRoom(''); // Reset room when property changes
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Skapa felanmälan</h2>

        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <h3 className="font-semibold text-green-800">Felanmälan skickad!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Din felanmälan har registrerats med ärendenummer: <strong>{workOrderNumber}</strong>
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
              label="Lokal / rum"
              options={roomOptions}
              value={selectedRoom}
              onChange={setSelectedRoom}
              placeholder="Välj lokal..."
            />
          </div>

          <div>
            <Combobox
              label="Enhet / System"
              options={unitOptions}
              value={selectedUnit}
              onChange={setSelectedUnit}
              placeholder="Välj enhet..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Beskrivning</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv felet eller servicebehovet..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rapportör</label>
            <input
              type="text"
              value={reporter}
              onChange={(e) => setReporter(e.target.value)}
              placeholder="Frej Andreasssen"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">E-post (valfritt)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="frej.andreasson@falkenberg.se"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bild (valfritt)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">eller klistra in bildlänk</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Komponent/Kommentar (valfritt)</label>
            <input
              type="text"
              value={component}
              onChange={(e) => setComponent(e.target.value)}
              placeholder="T.ex. Fläkt i tak, Dörr A12"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
                'Skicka felanmälan'
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
        properties={properties}
        selectedProperty={selectedProperty}
        onSelectProperty={handleMapSelect}
      />
    </>
  );
}
