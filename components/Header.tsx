'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-[#1e3a8a] p-2 rounded">
              <div className="text-white font-bold text-xl">FK</div>
            </div>
            <div>
              <div className="font-bold text-lg">Falkenbergs</div>
              <div className="font-bold text-lg -mt-1">kommun</div>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="search"
                placeholder="Sök innehåll och kollega"
                className="px-4 py-2 border border-gray-300 rounded-md w-64"
              />
              <button className="p-2 hover:bg-gray-100 rounded">🔍</button>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              title="Logga ut"
            >
              {isLoggingOut ? '...' : 'Logga ut'}
            </button>
          </div>
        </div>
      </div>

      <nav className="bg-[#2d3e75] text-white">
        <div className="container mx-auto px-4">
          <ul className="flex gap-6 text-sm">
            <li><Link href="/" className="block py-3 hover:bg-[#3d4e85]">Felanmälan</Link></li>
            <li><Link href="/qr-generator" className="block py-3 hover:bg-[#3d4e85] flex items-center gap-1">
              <span>📱</span>
              <span>QR-kod Generator</span>
            </Link></li>
            <li><Link href="#" className="block py-3 hover:bg-[#3d4e85]">Stöd och Service</Link></li>
            <li><Link href="#" className="block py-3 hover:bg-[#3d4e85]">Organisation</Link></li>
            <li><Link href="#" className="block py-3 hover:bg-[#3d4e85]">Chefsled</Link></li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
