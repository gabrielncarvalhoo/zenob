"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface UpcomingRenewal {
  contractId: string;
  tenantName: string;
  propertyName: string;
  daysUntilExpiry: number;
  rentAmount: number;
}

export function RenewalAlerts() {
  const [alerts, setAlerts] = useState<UpcomingRenewal[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/v1/renewals/upcoming', {
      headers: { 'x-account-id': 'account-teste-001' },
    })
      .then(r => r.ok ? r.json() : [])
      .then(d => setAlerts(d.slice(0, 5))) // Show max 5
      .catch(() => setAlerts([]));
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-[#BA7517]" />
          Renovações próximas
        </h2>
        <Link href="/contratos" className="text-xs text-[#3B6D11] hover:underline">
          Ver todos
        </Link>
      </div>
      <div className="space-y-3">
        {alerts.map(a => (
          <div key={a.contractId} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{a.tenantName}</p>
              <p className="text-xs text-gray-500">{a.propertyName}</p>
            </div>
            <div className="text-right">
              {a.daysUntilExpiry <= 10 ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertTriangle className="w-3 h-3" />
                  {a.daysUntilExpiry <= 0 ? 'Venceu' : `${a.daysUntilExpiry}d`}
                </span>
              ) : (
                <span className="text-xs text-gray-500">{a.daysUntilExpiry}d</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}