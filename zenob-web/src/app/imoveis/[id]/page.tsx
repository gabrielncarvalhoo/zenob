import Link from 'next/link';

interface Property {
  id: string;
  name: string;
  type: 'HOUSE' | 'APARTMENT' | 'COMMERCIAL' | 'LAND' | 'COMPLEX' | 'OTHER';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  totalUnits: number;
  createdAt: string;
  units?: Unit[];
}

interface Unit {
  id: string;
  propertyId: string;
  code: string;
  description: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  monthlyRent: number;
  occupancyStatus: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE';
  iptuCode?: string;
  waterRegistration?: string;
  energyRegistration?: string;
  leaseContracts?: Array<{
    status: string;
    leaseTenants: Array<{
      tenant: {
        id: string;
        fullName: string;
        email: string;
        phone: string;
      }
    }>;
  }>;
}

async function getProperty(id: string): Promise<Property | null> {
  try {
    const res = await fetch(`http://localhost:3000/api/v1/properties/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch property: ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}



const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  OCCUPIED: {
    label: 'Ocupada',
    className: 'bg-[#EAF3DE] text-[#3B6D11]',
  },
  VACANT: {
    label: 'Vaga',
    className: 'bg-[#F3F4F6] text-[#6B7280]',
  },
  MAINTENANCE: {
    label: 'Manutenção',
    className: 'bg-[#FAEEDA] text-[#633806]',
  },
};

const PROPERTY_TYPE_MAP: Record<string, string> = {
  HOUSE: 'Casa',
  APARTMENT: 'Apartamento',
  COMMERCIAL: 'Comercial',
  LAND: 'Terreno',
  COMPLEX: 'Complexo',
  OTHER: 'Outro',
};

export default async function ImovelDetalhePage({ params }: { params: { id: string } }) {
  const property = await getProperty(params.id);

  if (!property) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Imóvel não encontrado</h2>
        <Link href="/imoveis" className="text-[#3B6D11] hover:underline">
          Voltar para a lista de imóveis
        </Link>
      </div>
    );
  }

  const typeLabel = PROPERTY_TYPE_MAP[property.type] || property.type;
  const units = property.units || [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <Link href="/imoveis" className="text-sm text-gray-500 hover:text-gray-900 flex items-center mb-4">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Voltar
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-800">
                {typeLabel}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {property.address}, {property.city} - {property.state}
              </span>
            </div>
          </div>
          <button className="bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium transition-colors">
            Editar imóvel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Unidades ({units.length})</h2>
          <button className="text-sm font-medium text-[#3B6D11] hover:text-[#27500A]">
            + Adicionar unidade
          </button>
        </div>
        
        {units.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma unidade cadastrada para este imóvel.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white border-b border-gray-200 text-gray-600">
                <tr>
                  <th className="px-6 py-3 font-semibold">Código</th>
                  <th className="px-6 py-3 font-semibold">Matrículas</th>
                  <th className="px-6 py-3 font-semibold">Descrição</th>
                  <th className="px-6 py-3 font-semibold">Inquilino(s)</th>
                  <th className="px-6 py-3 font-semibold">Aluguel</th>
                  <th className="px-6 py-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {units.map((unit) => {
                  const status = STATUS_CONFIG[unit.occupancyStatus] || {
                    label: unit.occupancyStatus,
                    className: 'bg-gray-100 text-gray-800',
                  };
                  
                  return (
                    <tr key={unit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{unit.code}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {unit.iptuCode && <div>IPTU: {unit.iptuCode}</div>}
                        {unit.waterRegistration && <div>Água: {unit.waterRegistration}</div>}
                        {unit.energyRegistration && <div>Energia: {unit.energyRegistration}</div>}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{unit.description}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {unit.occupancyStatus === 'VACANT' || !unit.leaseContracts ? (
                          '-'
                        ) : (
                          unit.leaseContracts
                            .filter(lc => lc.status === 'ACTIVE')
                            .flatMap(lc => lc.leaseTenants)
                            .map((lt, idx, arr) => (
                              <span key={lt.tenant.id}>
                                <Link href={`/inquilinos/${lt.tenant.id}`} className="hover:text-[#3B6D11] hover:underline transition-colors block md:inline">
                                  {lt.tenant.fullName}
                                </Link>
                                {idx < arr.length - 1 ? ', ' : ''}
                              </span>
                            ))
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{formatCurrency(unit.monthlyRent)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
