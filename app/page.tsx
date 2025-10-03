'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import ReportForm from '@/components/ReportForm';
import ReportStatus from '@/components/ReportStatus';
import ApiLog from '@/components/ApiLog';

function HomeContent() {
  const searchParams = useSearchParams();
  const [initialProperty, setInitialProperty] = useState('');
  const [initialRoom, setInitialRoom] = useState('');

  useEffect(() => {
    // Read URL parameters for deep linking
    const objekt = searchParams.get('objekt');
    const rum = searchParams.get('rum');

    if (objekt) setInitialProperty(objekt);
    if (rum) setInitialRoom(rum);
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ReportForm initialProperty={initialProperty} initialRoom={initialRoom} />
        <ReportStatus />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
        <HomeContent />
      </Suspense>
      <ApiLog />

      <footer className="bg-[#0d47a1] text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-white p-2 rounded">
                  <div className="text-[#0d47a1] font-bold text-xl">FK</div>
                </div>
                <div>
                  <div className="font-bold">Falkenbergs</div>
                  <div className="font-bold -mt-1">kommun</div>
                </div>
              </div>
              <p className="text-sm mb-2">Stadshuset, Kuben, Rådhustorget 3C</p>
              <p className="text-sm mb-2"><strong>Telefon:</strong> 0346 88 60 00</p>
              <p className="text-sm"><strong>E-post:</strong> kontaktcenter@falkenberg.se</p>

              <div className="mt-6">
                <p className="text-sm font-bold mb-1">Öppettider</p>
                <p className="text-sm">Måndag, tisdag och torsdag: 8-17</p>
                <p className="text-sm">Onsdag: 8-19</p>
                <p className="text-sm">Fre: 8-15</p>
                <p className="text-sm">Dag före röd dag: efton 8-15</p>
                <p className="text-sm">Dag före trettonhelgern: 8-17</p>
              </div>

              <div className="mt-6">
                <p className="text-sm font-bold mb-1">Information om Kontaktcenter</p>
                <p className="text-sm">Postadress: 311 80 Falkenberg</p>
                <p className="text-sm">Våra förvaltningar har lunchstängt 12-13.</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3">Om Intranätet</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">Om Intranätet</a></li>
                <li><a href="#" className="hover:underline">Om Intranätets startsida</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-3">Andra kanaler</h3>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100">
                  <span className="text-[#0d47a1]">f</span>
                </a>
                <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100">
                  <span className="text-[#0d47a1]">Y</span>
                </a>
                <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100">
                  <span className="text-[#0d47a1]">V</span>
                </a>
                <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100">
                  <span className="text-[#0d47a1]">in</span>
                </a>
              </div>
              <ul className="mt-6 space-y-2 text-sm">
                <li><a href="#" className="hover:underline">→ kommun.falkenberg.se</a></li>
                <li><a href="#" className="hover:underline">→ FBG.falkenberg.se</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
