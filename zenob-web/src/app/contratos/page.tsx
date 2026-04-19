import Link from 'next/link';

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

async function getLeases(): Promise<LeaseContract[]> {
  try {
    const res = await fetch('http://localhost:3000/api/v1/leases', {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('Failed to fetch leases:', res.statusText);
      return [];
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching leases:', error);
    return [];
  }
}

function getStatusBadge(status: LeaseContract['status']) {
  switch (status) {
    case 'ACTIVE':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAF3DE] text-[#3B6D11]">Ativo</span>;
    case 'DRAFT':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">Rascunho</span>;
    case 'EXPIRED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FAEEDA] text-[#633806]">Vencido</span>;
    case 'TERMINATED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FCEBEB] text-[#791F1F]">Rescindido</span>;
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

export default async function ContratosPage() {
  const leases = await getLeases();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
        <button className="bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer">
          + Novo contrato
        </button>
      </div>

      {leases.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
          <p className="text-gray-500 mb-6">Você ainda não possui nenhum contrato registrado.</p>
          <button className="bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer">
            Registrar primeiro contrato
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[900px] w-full">
              <div className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1.5fr_1.5fr] bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="px-6 py-4">Status</div>
                <div className="px-6 py-4">Unidade</div>
                <div className="px-6 py-4">Aluguel</div>
                <div className="px-6 py-4">Vencimento</div>
                <div className="px-6 py-4">Início</div>
                <div className="px-6 py-4">Término</div>
              </div>
              <div className="bg-white divide-y divide-gray-200">
                {leases.map((lease) => (
                  <Link 
                    href={`/contratos/${lease.id}`} 
                    key={lease.id} 
                    className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1.5fr_1.5fr] hover:bg-gray-50 transition-colors items-center group cursor-pointer"
                  >
                    <div className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(lease.status)}
                    </div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 group-hover:text-[#3B6D11] transition-colors">
                      {lease.unitId}
                    </div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(lease.rentAmount)}
                    </div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Dia {lease.dueDay}
                    </div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(lease.startDate)}
                    </div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(lease.endDate)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
