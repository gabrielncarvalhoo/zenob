import Link from 'next/link';
import { TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CobrancasTable } from './CobrancasTable';

interface Receivable {
  id: string;
  competencyMonth: string;
  dueDate: string;
  originalAmount: string | number;
  paidAmount: string | number;
  balanceAmount: string | number;
  penaltiesAmount: string | number;
  discountAmount: string | number;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'RENEGOTIATED' | 'WAIVED';
  paidAt: string | null;
  leaseContractId?: string;
}

interface Lease {
  id: string;
  unit?: { property?: { id: string; name: string } };
}

async function getReceivables(): Promise<Receivable[]> {
  try {
    const res = await fetch('http://localhost:3000/api/v1/receivables', {
      headers: { 'x-account-id': 'account-teste-001' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getLease(leaseId: string): Promise<Lease | null> {
  try {
    const res = await fetch(`http://localhost:3000/api/v1/leases/${leaseId}`, {
      headers: { 'x-account-id': 'account-teste-001' },
      cache: 'no-store',
    });
    if (res.ok) return res.json();
  } catch {
    /* noop */
  }
  return null;
}

// Mesma lógica de ReceivablesList: chave AAAA-MM, decisão por contrato
function monthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function selectPerLease(items: Receivable[]): Receivable[] {
  if (items.length === 0) return [];
  const now = new Date();
  const currentKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const overdues = items.filter((r) => r.status === 'OVERDUE');
  const result: Receivable[] = [];
  if (overdues.length > 0) {
    result.push(...overdues);
    const atual = items.find((r) => monthKey(r.dueDate) === currentKey && r.status !== 'OVERDUE');
    if (atual) result.push(atual);
    return result;
  }
  const fechado = (s: Receivable['status']) =>
    s === 'PAID' || s === 'WAIVED' || s === 'RENEGOTIATED';
  const sortedAsc = [...items].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );
  const firstOpen = sortedAsc.find(
    (r) => monthKey(r.dueDate) >= currentKey && !fechado(r.status),
  );
  if (firstOpen) return [firstOpen];
  const lastPaid = [...items]
    .filter((r) => r.status === 'PAID')
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())[0];
  return lastPaid ? [lastPaid] : [];
}

export default async function CobrancasPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const allReceivables = await getReceivables();
  const currentStatus = searchParams.status || 'ALL';

  let receivables: Receivable[];
  if (currentStatus === 'ALL') {
    // Aplica smart filter por contrato e concatena resultados
    const byLease: Record<string, Receivable[]> = {};
    for (const r of allReceivables) {
      const key = r.leaseContractId || '_';
      if (!byLease[key]) byLease[key] = [];
      byLease[key].push(r);
    }
    receivables = [];
    for (const key of Object.keys(byLease)) {
      receivables.push(...selectPerLease(byLease[key]));
    }
  } else {
    receivables = allReceivables.filter((r) => r.status === currentStatus);
  }

  receivables.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const leaseIds = Array.from(
    new Set(receivables.map((r) => r.leaseContractId).filter(Boolean)),
  );
  const leasesData = await Promise.all(
    leaseIds.map(async (id) => ({ id, lease: await getLease(id as string) })),
  );
  const leasesMap = leasesData.reduce((acc, curr) => {
    if (curr.lease) acc[curr.id as string] = curr.lease;
    return acc;
  }, {} as Record<string, Lease>);

  const tabs = [
    { label: 'Todas', value: 'ALL' },
    { label: 'Pendentes', value: 'PENDING' },
    { label: 'Atrasadas', value: 'OVERDUE' },
    { label: 'Pagas', value: 'PAID' },
    { label: 'Parcial', value: 'PARTIAL' },
  ];

  // KPIs (calculados sobre allReceivables, ignoram filtro de aba)
  const aReceber = allReceivables
    .filter((r) => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(r.status))
    .reduce((acc, r) => acc + Number(r.balanceAmount), 0);

  const hoje = new Date();
  const recebidoMes = allReceivables
    .filter((r) => {
      if (!r.paidAt) return false;
      const d = new Date(r.paidAt);
      return d.getUTCFullYear() === hoje.getUTCFullYear() && d.getUTCMonth() === hoje.getUTCMonth();
    })
    .reduce((acc, r) => acc + Number(r.paidAmount), 0);

  const atrasadas = allReceivables.filter((r) => r.status === 'OVERDUE');
  const atrasadasTotal = atrasadas.reduce((acc, r) => acc + Number(r.balanceAmount), 0);

  const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <PageHeader title="Cobranças" subtitle="Acompanhe pagamentos e inadimplência" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">A receber</span>
            <TrendingUp className="w-4 h-4 text-[#3B6D11]" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(aReceber)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recebido no mês</span>
            <CheckCircle2 className="w-4 h-4 text-[#3B6D11]" />
          </div>
          <p className="text-2xl font-bold text-[#3B6D11]">{fmt(recebidoMes)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Atrasadas</span>
            <AlertTriangle className="w-4 h-4 text-[#E24B4A]" />
          </div>
          <p className="text-2xl font-bold text-[#E24B4A]">{fmt(atrasadasTotal)}</p>
          <p className="text-xs text-gray-500 mt-1">{atrasadas.length} cobrança{atrasadas.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200 mb-6">
        {tabs.map((tab) => {
          const isActive = currentStatus === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value === 'ALL' ? '/cobrancas' : `/cobrancas?status=${tab.value}`}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-[#3B6D11] text-[#3B6D11]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {receivables.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma cobrança encontrada</h3>
          <p className="text-gray-500">
            {currentStatus === 'ALL'
              ? 'Ainda não há nenhuma cobrança registrada no sistema.'
              : 'Nenhuma cobrança corresponde ao filtro selecionado.'}
          </p>
        </div>
      ) : (
        <CobrancasTable receivables={receivables} leasesMap={leasesMap} />
      )}
    </div>
  );
}
