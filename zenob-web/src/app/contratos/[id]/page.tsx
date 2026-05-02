import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReceivablesList } from './ReceivablesList';
import { LeaseAdjustmentActions } from './LeaseAdjustmentActions';
import { ContractActions } from './ContractActions';
import { AlertTriangle, CalendarClock, CheckCircle2, Wallet } from 'lucide-react';

interface LeaseContract {
  id: string;
  unitId: string;
  primaryTenantId: string;
  startDate: string;
  endDate: string;
  dueDay: number;
  rentAmount: number | string;
  depositAmount: number | string | null;
  adjustmentIndex: 'IGP_M' | 'IPCA' | 'INPC' | 'FIXED';
  guaranteeType: 'DEPOSIT' | 'SURETY' | 'INSURANCE' | 'NONE';
  lateFeeType: string;
  lateFeeValue: number | string;
  interestType: string;
  interestValue: number | string;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'CANCELLED';
  notes: string | null;
  terminationDate: string | null;
  nextAdjustmentDate?: string;
  unit?: {
    code: string;
    property?: {
      name: string;
      address: string;
      iptuCode: string | null;
      waterRegistration: string | null;
      energyRegistration: string | null;
    };
  };
  leaseTenants?: Array<{
    role: string;
    tenant: {
      fullName: string;
      email: string;
      phone: string;
      cpf: string;
    };
  }>;
}

async function getLease(id: string): Promise<LeaseContract | null> {
  try {
    const res = await fetch(`http://localhost:3000/api/v1/leases/${id}`, {
      headers: { 'x-account-id': 'account-teste-001' },
      cache: 'no-store',
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
}

interface ReceivableSummary {
  status: string;
  dueDate: string;
  paidAmount: string | number;
  balanceAmount: string | number;
}

async function getReceivablesForLease(leaseId: string): Promise<ReceivableSummary[]> {
  try {
    const res = await fetch(`http://localhost:3000/api/v1/receivables?leaseId=${leaseId}`, {
      headers: { 'x-account-id': 'account-teste-001' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function getStatusBadge(status: LeaseContract['status']) {
  switch (status) {
    case 'ACTIVE':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EAF3DE] text-[#3B6D11]">Ativo</span>;
    case 'DRAFT':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#F3F4F6] text-[#6B7280]">Rascunho</span>;
    case 'EXPIRED':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#FAEEDA] text-[#633806]">Vencido</span>;
    case 'TERMINATED':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#FCEBEB] text-[#791F1F]">Rescindido</span>;
    default:
      return null;
  }
}

function formatDate(dateString: string) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return dateString;
  }
}

function formatCurrency(amount: number | string | null | undefined) {
  const n = Number(amount ?? 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(isNaN(n) ? 0 : n);
}

function translateAdjustmentIndex(index: LeaseContract['adjustmentIndex']) {
  const map: Record<LeaseContract['adjustmentIndex'], string> = {
    IGP_M: 'IGP-M',
    IPCA: 'IPCA',
    INPC: 'INPC',
    FIXED: 'Sem reajuste',
  };
  return map[index] || index;
}

function translateGuaranteeType(type: LeaseContract['guaranteeType']) {
  const map: Record<LeaseContract['guaranteeType'], string> = {
    DEPOSIT: 'Caução',
    SURETY: 'Fiador',
    INSURANCE: 'Seguro fiança',
    NONE: 'Sem garantia',
  };
  return map[type] || type;
}

function getDaysUntil(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Reajuste anual a partir do início do contrato
function calculateNextAdjustment(startDate: string) {
  const start = new Date(startDate);
  const now = new Date();
  const next = new Date(start);
  while (next <= now) {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next.toISOString();
}

export default async function DetalheContratoPage({ params }: { params: { id: string } }) {
  const [lease, receivables] = await Promise.all([
    getLease(params.id),
    getReceivablesForLease(params.id),
  ]);

  if (!lease) {
    notFound();
  }

  const adjDate = lease.nextAdjustmentDate || calculateNextAdjustment(lease.startDate);
  const daysToAdj = getDaysUntil(adjDate);
  const needsAdjustmentAlert = daysToAdj >= 0 && daysToAdj <= 30 && lease.status === 'ACTIVE';
  const daysUntilEnd = getDaysUntil(lease.endDate);
  const needsRenewalAlert = daysUntilEnd >= 0 && daysUntilEnd <= 60 && lease.status === 'ACTIVE';

  // KPIs do contrato — aplicar lógica correta de exibição
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const hasOverdue = receivables.some(r => r.status === 'OVERDUE');

  // Se tem atrasado, pegar todos até mês atual. Senão, pegar do primeiro não-pago adiante.
  const shownReceivables = hasOverdue
    ? receivables.filter(r => {
        const m = r.dueDate.slice(0, 7);
        return m <= currentMonth && ['PENDING', 'PARTIAL', 'OVERDUE'].includes(r.status);
      })
    : receivables.filter(r => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(r.status)).slice(0, 3);

  const totalPago = receivables.reduce((acc, r) => acc + Number(r.paidAmount), 0);
  const saldoAberto = shownReceivables.reduce((acc, r) => acc + Number(r.balanceAmount), 0);
  const proximoVenc = shownReceivables
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/contratos" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-[#3B6D11] transition-colors"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          Detalhes do Contrato
          {needsAdjustmentAlert && (
            <div title={`Reajuste previsto em ${daysToAdj} dias`} className="cursor-help mt-1">
              <AlertTriangle className="w-6 h-6 text-[#BA7517]" />
            </div>
          )}
        </h1>
        <div className="flex items-center gap-3">
          {getStatusBadge(lease.status)}
          <a
            href={`http://localhost:3000/api/v1/leases/${lease.id}/contract/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Baixar contrato PDF
          </a>
        </div>
      </div>

      {needsRenewalAlert && (
        <div className="bg-[#E6F1FB] border border-[#378ADD] rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-start gap-4">
            <CalendarClock className="w-8 h-8 text-[#378ADD] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-[#0C447C] mb-1">Contrato próximo do vencimento</h2>
              <p className="text-[#1A5A9B] text-sm">
                Falta{daysUntilEnd !== 1 ? 'm' : ''} {daysUntilEnd} dia{daysUntilEnd !== 1 ? 's' : ''} para o término deste contrato.
                Considere renovar ou encerrar formalmente.
              </p>
            </div>
          </div>
        </div>
      )}

      {needsAdjustmentAlert && (
        <LeaseAdjustmentActions leaseId={lease.id} daysToAdjustment={daysToAdj} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Próximo vencimento</span>
            <CalendarClock className="w-4 h-4 text-[#BA7517]" />
          </div>
          <p className="text-xl font-bold text-gray-900">
            {proximoVenc ? formatDate(proximoVenc.dueDate) : '—'}
          </p>
          {proximoVenc && (
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(proximoVenc.balanceAmount as number)}</p>
          )}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total recebido</span>
            <CheckCircle2 className="w-4 h-4 text-[#3B6D11]" />
          </div>
          <p className="text-xl font-bold text-[#3B6D11]">{formatCurrency(totalPago)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Saldo aberto</span>
            <Wallet className={`w-4 h-4 ${saldoAberto > 0 ? 'text-[#E24B4A]' : 'text-gray-400'}`} />
          </div>
          <p className={`text-xl font-bold ${saldoAberto > 0 ? 'text-[#E24B4A]' : 'text-gray-900'}`}>
            {formatCurrency(saldoAberto)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">1. Imóvel</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Nome do imóvel</span>
              <span className="text-base text-gray-900 font-medium">{lease.unit?.property?.name || '-'}</span>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Endereço</span>
              <span className="text-base text-gray-900 font-medium">{lease.unit?.property?.address || '-'}</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Unidade</span>
              <span className="text-base text-gray-900 font-medium">{lease.unit?.code || '-'}</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">IPTU</span>
              <span className="text-base text-gray-900 font-medium">{lease.unit?.property?.iptuCode || 'Não informado'}</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Matrícula de água</span>
              <span className="text-base text-gray-900 font-medium">{lease.unit?.property?.waterRegistration || 'Não informado'}</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Matrícula de energia</span>
              <span className="text-base text-gray-900 font-medium">{lease.unit?.property?.energyRegistration || 'Não informado'}</span>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">2. Inquilino</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Nome completo</span>
              <span className="text-base text-gray-900 font-medium">{lease.leaseTenants?.[0]?.tenant?.fullName || '-'}</span>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">E-mail</span>
              <span className="text-base text-gray-900 font-medium">{lease.leaseTenants?.[0]?.tenant?.email || '-'}</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Telefone</span>
              <span className="text-base text-gray-900 font-medium">{lease.leaseTenants?.[0]?.tenant?.phone || '-'}</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">CPF</span>
              <span className="text-base text-gray-900 font-medium">{lease.leaseTenants?.[0]?.tenant?.cpf || '-'}</span>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">3. Condições</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Aluguel mensal</span>
              <span className="text-base text-gray-900 font-medium">{formatCurrency(lease.rentAmount)}</span>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Dia de vencimento</span>
              <span className="text-base text-gray-900 font-medium">{lease.dueDay}</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Índice de reajuste</span>
              <span className="text-base text-gray-900 font-medium">{translateAdjustmentIndex(lease.adjustmentIndex)}</span>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">Garantia & Depósito</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Tipo de garantia</span>
              <span className="text-base text-gray-900 font-medium">{translateGuaranteeType(lease.guaranteeType)}</span>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Depósito</span>
              <span className="text-base text-gray-900 font-medium">
                {lease.depositAmount ? formatCurrency(lease.depositAmount) : '-'}
              </span>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">Período e Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Período</span>
              <span className="text-base text-gray-900 font-medium">
                {formatDate(lease.startDate)} até {formatDate(lease.endDate)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Data de início</span>
              <span className="text-base text-gray-900 font-medium">{formatDate(lease.startDate)}</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Data de término</span>
              <span className="text-base text-gray-900 font-medium">{formatDate(lease.endDate)}</span>
            </div>

            {lease.terminationDate && (
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-sm font-medium text-gray-500 block mb-1">Data de rescisão</span>
                <span className="text-base text-[#791F1F] font-bold">{formatDate(lease.terminationDate)}</span>
              </div>
            )}
          </div>

          {lease.notes && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Observações</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-line text-gray-700">
                {lease.notes}
              </div>
            </div>
          )}
        </div>
      </div>

      <ContractActions
        leaseId={lease.id}
        status={lease.status}
        daysUntilEnd={daysUntilEnd}
        leaseData={{
          unitId: lease.unitId,
          primaryTenantId: lease.primaryTenantId,
          endDate: lease.endDate,
          rentAmount: lease.rentAmount,
          dueDay: lease.dueDay,
          depositAmount: lease.depositAmount,
          adjustmentIndex: lease.adjustmentIndex,
          guaranteeType: lease.guaranteeType,
          lateFeeType: lease.lateFeeType,
          lateFeeValue: lease.lateFeeValue,
          interestType: lease.interestType,
          interestValue: lease.interestValue,
          notes: lease.notes,
        }}
      />

      <ReceivablesList leaseId={lease.id} />
    </div>
  );
}
