import Link from 'next/link';
import { LeaseList } from './LeaseList';

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
  guaranteeType: 'DEPOSIT' | 'SURETY' | 'INSURANCE' | 'NONE';
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  notes: string | null;
  terminationDate: string | null;
  nextAdjustmentDate?: string;
  unit?: {
    property?: {
      name: string;
    };
  };
  leaseTenants?: Array<{
    tenant: {
      fullName: string;
    };
  }>;
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

export default async function ContratosPage() {
  const leases = await getLeases();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
        <Link href="/contratos/novo" className="bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer inline-block">
          + Novo contrato
        </Link>
      </div>

      {leases.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
          <p className="text-gray-500 mb-6">Você ainda não possui nenhum contrato registrado.</p>
          <Link href="/contratos/novo" className="bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer inline-block">
            Registrar primeiro contrato
          </Link>
        </div>
      ) : (
        <LeaseList initialLeases={leases} />
      )}
    </div>
  );
}
