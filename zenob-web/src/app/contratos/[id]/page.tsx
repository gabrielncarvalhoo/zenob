import Link from 'next/link';
import { notFound } from 'next/navigation';

interface LeaseContract {
  id: string;
  unitId: string;
  primaryTenantId: string;
  startDate: string;
  endDate: string;
  dueDay: number;
  rentAmount: number;
  depositAmount: number | null;
  adjustmentIndex: 'IGP_M' | 'IPCA' | 'INPC' | 'FIXED';
  adjustmentFrequencyMonths: number;
  guaranteeType: 'DEPOSIT' | 'SURETY' | 'INSURANCE' | 'NONE';
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  notes: string | null;
  terminationDate: string | null;
}

async function getLease(id: string): Promise<LeaseContract | null> {
  try {
    const res = await fetch(`http://localhost:3000/api/v1/leases/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      console.error('Failed to fetch lease:', res.statusText);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching lease:', error);
    return null;
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
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

export default async function DetalheContratoPage({ params }: { params: { id: string } }) {
  const lease = await getLease(params.id);

  if (!lease) {
    notFound();
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Detalhes do Contrato</h1>
        <div>
          {getStatusBadge(lease.status)}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">Informações Financeiras</h2>
          
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

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Frequência de reajuste</span>
              <span className="text-base text-gray-900 font-medium">{lease.adjustmentFrequencyMonths} meses</span>
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
    </div>
  );
}
