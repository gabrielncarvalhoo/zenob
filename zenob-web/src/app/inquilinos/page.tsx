import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

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

interface Receivable {
  id: string;
  status: string;
  balanceAmount: string | number;
}

interface Lease {
  id: string;
  status: string;
  unitId: string;
  leaseTenants?: Array<{ tenant: { id: string } }>;
}

async function getTenants(): Promise<Tenant[]> {
  try {
    const res = await fetch('http://localhost:3000/api/v1/tenants', {
      headers: { 'x-account-id': 'account-teste-001' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getActiveLeases(): Promise<Lease[]> {
  try {
    const res = await fetch('http://localhost:3000/api/v1/leases?status=ACTIVE', {
      headers: { 'x-account-id': 'account-teste-001' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getTotalDue(tenantId: string): Promise<number> {
  try {
    const res = await fetch(`http://localhost:3000/api/v1/receivables?tenantId=${tenantId}`, {
      headers: { 'x-account-id': 'account-teste-001' },
      cache: 'no-store',
    });
    if (!res.ok) return 0;
    const receivables: Receivable[] = await res.json();
    return receivables
      .filter((r) => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(r.status))
      .reduce((acc, r) => acc + Number(r.balanceAmount), 0);
  } catch {
    return 0;
  }
}

function getInitials(fullName: string) {
  if (!fullName) return '??';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function getTenantStatusBadge(totalDue: number, imoveis: number) {
  const dot = (color: string) => (
    <span className={`w-1.5 h-1.5 rounded-full ${color} inline-block`} />
  );
  if (totalDue > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FCEBEB] text-[#E24B4A]">
        {dot('bg-[#E24B4A]')} Em dívida
      </span>
    );
  }
  if (imoveis > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAF3DE] text-[#3B6D11]">
        {dot('bg-[#3B6D11]')} Em dia
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">
      {dot('bg-[#6B7280]')} Inativo
    </span>
  );
}

export default async function InquilinosPage() {
  const [tenantsData, activeLeases] = await Promise.all([
    getTenants(),
    getActiveLeases(),
  ]);

  const tenants = await Promise.all(
    tenantsData.map(async (tenant) => {
      const totalDue = await getTotalDue(tenant.id);
      const imoveis = activeLeases.filter((l) =>
        l.leaseTenants?.some((lt) => lt.tenant.id === tenant.id),
      ).length;
      return { ...tenant, totalDue, imoveis };
    }),
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <PageHeader
        title="Inquilinos"
        subtitle={`${tenants.length} ${tenants.length === 1 ? 'inquilino cadastrado' : 'inquilinos cadastrados'}`}
        action={
          <Link
            href="/inquilinos/novo"
            className="inline-flex items-center gap-2 bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo inquilino
          </Link>
        }
      />

      {tenants.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum inquilino encontrado</h3>
          <p className="text-gray-500 mb-6">Você ainda não cadastrou nenhum inquilino.</p>
          <Link
            href="/inquilinos/novo"
            className="bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer inline-block"
          >
            Cadastrar primeiro inquilino
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full table-fixed text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-4 w-[30%]">Nome</th>
                <th className="px-4 py-4 w-[16%]">CPF</th>
                <th className="px-4 py-4 w-[16%]">Telefone</th>
                <th className="px-4 py-4 w-[14%]">Status</th>
                <th className="px-4 py-4 w-[18%] text-right">Total devido</th>
                <th className="px-4 py-4 w-[6%]"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenants.map((tenant) => {
                const devendo = tenant.totalDue > 0;
                return (
                  <tr key={tenant.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Link
                        href={`/inquilinos/${tenant.id}`}
                        className="flex items-center cursor-pointer"
                      >
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-[#EAF3DE] text-[#3B6D11] font-bold text-sm">
                          {getInitials(tenant.fullName)}
                        </div>
                        <div className="ml-4 text-sm font-medium text-gray-900 group-hover:text-[#3B6D11] truncate transition-colors">
                          {tenant.fullName}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {tenant.cpf}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {tenant.phone}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getTenantStatusBadge(tenant.totalDue, tenant.imoveis)}
                    </td>
                    <td
                      className={`px-4 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                        devendo ? 'text-[#E24B4A]' : 'text-[#3B6D11]'
                      }`}
                    >
                      {formatCurrency(tenant.totalDue)}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-right">
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#3B6D11] transition-colors inline" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
