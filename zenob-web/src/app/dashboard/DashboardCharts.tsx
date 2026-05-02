"use client";

import { useEffect, useState } from 'react';
import { Card } from '@tremor/react';

interface HistoricalEntry { month: string; label: string; received: number; expenses: number; overdue: number; }
interface OccupancyEntry { month: string; label: string; total: number; occupied: number; rate: number; }
interface StatusEntry { status: string; count: number; total: number; }
interface CategoryEntry { category: string; total: number; }

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  PARTIAL: 'Parcial',
  OVERDUE: 'Vencida',
  RENEGOTIATED: 'Renegociada',
  WAIVED: 'Dispensada',
};

const CATEGORY_LABELS: Record<string, string> = {
  MAINTENANCE: 'Manutenção',
  CONDOMINIUM: 'Condomínio',
  IPTU: 'IPTU',
  INSURANCE: 'Seguro',
  ADMIN: 'Administrativa',
  WATER: 'Água',
  ENERGY: 'Energia',
  OTHER: 'Outra',
};

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

export function DashboardCharts() {
  const [historical, setHistorical] = useState<HistoricalEntry[]>([]);
  const [byStatus, setByStatus] = useState<StatusEntry[]>([]);
  const [byCategory, setByCategory] = useState<CategoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3000/api/v1/dashboard/historical').then(r => r.ok ? r.json() : []),
      fetch('http://localhost:3000/api/v1/dashboard/receivables-by-status').then(r => r.ok ? r.json() : []),
      fetch('http://localhost:3000/api/v1/dashboard/expenses-by-category').then(r => r.ok ? r.json() : []),
    ]).then(([h, s, c]) => {
      setHistorical(h);
      setByStatus(s);
      setByCategory(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-72 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Carregando gráficos...</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-72 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Carregando gráficos...</span>
        </div>
      </div>
    );
  }

  // Simple SVG bar chart for historical data
  const maxVal = Math.max(...historical.map(h => Math.max(h.received, h.expenses)), 1);
  const barW = 100 / historical.length;

  return (
    <div className="space-y-6">
      {/* Monthly revenue vs expenses */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Receita vs Despesas (12 meses)</h3>
        <div className="relative" style={{ height: 180 }}>
          <svg className="w-full h-full" viewBox={`0 0 100 100`} preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(y => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f0f0f0" strokeWidth="0.3" />
            ))}
            {/* Received bars */}
            {historical.map((h, i) => {
              const bh = (h.received / maxVal) * 85;
              return (
                <rect
                  key={`r-${i}`}
                  x={`${i * barW + 0.3}%`}
                  y={`${85 - bh}%`}
                  width={`${barW * 0.4}%`}
                  height={`${bh}%`}
                  fill="#3B6D11"
                  opacity="0.85"
                />
              );
            })}
            {/* Expenses bars */}
            {historical.map((h, i) => {
              const bh = (h.expenses / maxVal) * 85;
              return (
                <rect
                  key={`e-${i}`}
                  x={`${i * barW + barW * 0.45}%`}
                  y={`${85 - bh}%`}
                  width={`${barW * 0.4}%`}
                  height={`${bh}%`}
                  fill="#BA7517"
                  opacity="0.85"
                />
              );
            })}
          </svg>
          {/* X axis labels */}
          <div className="flex justify-between mt-1" style={{ fontSize: '9px', color: '#9ca3af' }}>
            {historical.filter((_, i) => i % 2 === 0).map(h => (
              <span key={h.month}>{h.label}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6 mt-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#3B6D11] inline-block" />
            Recebido
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#BA7517] inline-block" />
            Despesas
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receivables by status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Cobranças por Status</h3>
          {byStatus.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sem dados disponíveis</p>
          ) : (
            <div className="space-y-3">
              {byStatus.map(s => {
                const totalAll = byStatus.reduce((acc, x) => acc + x.total, 0);
                const pct = totalAll > 0 ? Math.round((s.total / totalAll) * 100) : 0;
                const colors: Record<string, string> = {
                  PENDING: 'bg-gray-400', PAID: 'bg-[#3B6D11]', PARTIAL: 'bg-blue-400',
                  OVERDUE: 'bg-red-400', RENEGOTIATED: 'bg-purple-400', WAIVED: 'bg-gray-300',
                };
                return (
                  <div key={s.status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{STATUS_LABELS[s.status] ?? s.status}</span>
                      <span className="text-gray-900 font-medium">{formatCurrency(s.total)} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[s.status] ?? 'bg-gray-400'} rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expenses by category */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Despesas por Categoria (mês atual)</h3>
          {byCategory.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sem despesas este mês</p>
          ) : (
            <div className="space-y-3">
              {byCategory.map(c => {
                const totalAll = byCategory.reduce((acc, x) => acc + x.total, 0);
                const pct = totalAll > 0 ? Math.round((c.total / totalAll) * 100) : 0;
                return (
                  <div key={c.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{CATEGORY_LABELS[c.category] ?? c.category}</span>
                      <span className="text-gray-900 font-medium">{formatCurrency(c.total)} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#BA7517] rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}