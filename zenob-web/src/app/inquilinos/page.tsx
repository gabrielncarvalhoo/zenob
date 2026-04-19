import Link from 'next/link';

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
}

async function getTenants(): Promise<Tenant[]> {
  try {
    const res = await fetch('http://localhost:3000/api/v1/tenants', {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('Failed to fetch tenants:', res.statusText);
      return [];
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return [];
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

export default async function InquilinosPage() {
  const tenants = await getTenants();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inquilinos</h1>
        <Link href="/inquilinos/novo" className="bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer">
          + Novo inquilino
        </Link>
      </div>

      {tenants.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum inquilino encontrado</h3>
          <p className="text-gray-500 mb-6">Você ainda não cadastrou nenhum inquilino.</p>
          <Link href="/inquilinos/novo" className="bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer inline-block">
            Cadastrar primeiro inquilino
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[900px] w-full">
              <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr] bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="px-6 py-4">Nome</div>
                <div className="px-6 py-4">CPF</div>
                <div className="px-6 py-4">E-mail</div>
                <div className="px-6 py-4">Telefone</div>
                <div className="px-6 py-4">Renda mensal</div>
              </div>
              <div className="bg-white divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <Link 
                    href={`/inquilinos/${tenant.id}`} 
                    key={tenant.id} 
                    className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr] hover:bg-gray-50 transition-colors items-center group cursor-pointer"
                  >
                    <div className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-[#EAF3DE] text-[#3B6D11] font-bold text-sm">
                          {getInitials(tenant.fullName)}
                        </div>
                        <div className="ml-4 text-sm font-medium text-gray-900 group-hover:text-[#3B6D11] transition-colors">
                          {tenant.fullName}
                        </div>
                      </div>
                    </div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {tenant.cpf}
                    </div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {tenant.email}
                    </div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {tenant.phone}
                    </div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tenant.monthlyIncome)}
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
