import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Tenant {
  id: string;
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  employer: string;
  monthlyIncome: number;
  notes: string | null;
  createdAt: string;
  leaseContracts?: Array<{
    leaseContract: {
      id: string;
      status: string;
      rentAmount: number;
      startDate: string;
      endDate: string;
      unit: {
        code: string;
        property: {
          id: string;
          name: string;
          address: string;
        };
      };
    };
  }>;
}

async function getTenant(id: string): Promise<Tenant | null> {
  try {
    const res = await fetch(`http://localhost:3000/api/v1/tenants/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      console.error('Failed to fetch tenant:', res.statusText);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return null;
  }
}

function getInitials(fullName: string) {
  if (!fullName) return '??';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

export default async function DetalheInquilinoPage({ params }: { params: { id: string } }) {
  const tenant = await getTenant(params.id);

  if (!tenant) {
    notFound();
  }

  const formattedIncome = new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(tenant.monthlyIncome);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/inquilinos" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-[#3B6D11] transition-colors"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar para inquilinos
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="bg-gray-50 p-8 flex flex-col items-center text-center border-b border-gray-200">
          <div className="h-24 w-24 rounded-full bg-[#EAF3DE] text-[#3B6D11] flex items-center justify-center text-3xl font-bold mb-4 shadow-sm border border-[#3B6D11]/10">
            {getInitials(tenant.fullName)}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{tenant.fullName}</h1>
          <p className="text-gray-500 mt-1">{tenant.employer || 'Profissão não informada'}</p>
        </div>

        <div className="p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">Informações Pessoais</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">CPF</span>
              <span className="text-base text-gray-900 font-medium">{tenant.cpf || '-'}</span>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Data de nascimento</span>
              <span className="text-base text-gray-900 font-medium">{formatDate(tenant.birthDate)}</span>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">E-mail</span>
              <span className="text-base text-gray-900 font-medium">{tenant.email || '-'}</span>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Telefone</span>
              <span className="text-base text-gray-900 font-medium">{tenant.phone || '-'}</span>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Profissão / Empregador</span>
              <span className="text-base text-gray-900 font-medium">{tenant.employer || '-'}</span>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Renda mensal</span>
              <span className="text-base text-gray-900 font-medium">{formattedIncome}</span>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">Imóveis alugados</h2>
            {!tenant.leaseContracts || tenant.leaseContracts.length === 0 ? (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center text-gray-500">
                Nenhum imóvel vinculado
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tenant.leaseContracts.map(({ leaseContract }) => (
                  <div key={leaseContract.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Link href={`/imoveis/${leaseContract.unit.property.id}`} className="text-lg font-bold text-gray-900 hover:text-[#3B6D11] transition-colors">
                          {leaseContract.unit.property.name}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">{leaseContract.unit.property.address}</p>
                      </div>
                      <div>
                        {leaseContract.status === 'ACTIVE' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAF3DE] text-[#3B6D11]">Ativo</span>}
                        {leaseContract.status === 'DRAFT' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">Rascunho</span>}
                        {leaseContract.status === 'EXPIRED' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FAEEDA] text-[#633806]">Vencido</span>}
                        {leaseContract.status === 'TERMINATED' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FCEBEB] text-[#791F1F]">Rescindido</span>}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-3">
                      <span className="font-medium text-gray-700">Unidade: {leaseContract.unit.code}</span>
                      <span className="font-semibold text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(leaseContract.rentAmount)}/mês</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {tenant.notes && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Observações</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-line text-gray-700">
                {tenant.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
