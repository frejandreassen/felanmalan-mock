'use client';

import Header from '@/components/Header';
import QRGeneratorWidget from '@/lib/exports/QRGeneratorWidget';

export default function QRGeneratorPage() {
  return (
    <>
      <div className="no-print">
        <Header />
      </div>
      <QRGeneratorWidget />
    </>
  );
}
