import Link from 'next/link';
import { MapPin, Home, Building2, Store, Trees, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';

interface Property {
  id: string;
  name: string;
  type: 'HOUSE' | 'APARTMENT' | 'COMMERCIAL' | 'LAND' | 'BUILDING' | 'COMPLEX' | 'OTHER';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  totalUnits: number;
  vacantUnits?: number;
  createdAt: string;
}

async function getProperties(): Promise<Property[]> {
  try {
    const res = await fetch('http://localhost:3000/api/v1/properties', {
      headers: { 'x-account-id': 'account-teste-001' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const PROPERTY_TYPE_MAP: Record<string, string> = {
  HOUSE: 'Casa',
  APARTMENT: 'Apartamento',
  COMMERCIAL: 'Comercial',
  LAND: 'Terreno',
  BUILDING: 'Prédio / Edifício',
  COMPLEX: 'Complexo',
  OTHER: 'Outro',
};

function getTypeIcon(type: Property['type']) {
  const cls = 'w-5 h-5 text-[#3B6D11]';
  switch (type) {
    case 'HOUSE':
      return <Home className={cls} />;
    case 'APARTMENT':
    case 'BUILDING':
    case 'COMPLEX':
      return <Building2 className={cls} />;
    case 'COMMERCIAL':
      return <Store className={cls} />;
    case 'LAND':
      return <Trees className={cls} />;
    default:
      return <Home className={cls} />;
  }
}

export default async function ImoveisPage() {
  const properties = await getProperties();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <PageHeader
        title="Imóveis"
        subtitle={`${properties.length} ${properties.length === 1 ? 'imóvel cadastrado' : 'imóveis cadastrados'}`}
        action={
          <Link
            href="/imoveis/novo"
            className="inline-flex items-center gap-2 bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo imóvel
          </Link>
        }
      />

      {properties.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum imóvel encontrado</h3>
          <p className="text-gray-500 mb-6">Você ainda não cadastrou nenhum imóvel.</p>
          <Link
            href="/imoveis/novo"
            className="inline-flex items-center gap-2 bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Cadastrar primeiro imóvel
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => {
            const typeLabel = PROPERTY_TYPE_MAP[property.type] || property.type;
            const vacantCount = property.vacantUnits ?? 0;
            const isMulti = property.type === 'COMPLEX' || property.type === 'BUILDING';

            return (
              <Link
                href={`/imoveis/${property.id}`}
                key={property.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-[#3B6D11] hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                <div className="bg-gradient-to-br from-[#EAF3DE] to-white p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(property.type)}
                      <span className="text-xs font-semibold text-[#3B6D11] uppercase tracking-wider">
                        {typeLabel}
                      </span>
                    </div>
                    {isMulti ? (
                      !property.totalUnits ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F3F4F6] text-[#6B7280]">
                          Sem unidades
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            vacantCount > 0
                              ? 'bg-[#FAEEDA] text-[#BA7517]'
                              : 'bg-[#EAF3DE] text-[#3B6D11]'
                          }`}
                        >
                          {vacantCount > 0
                            ? `${vacantCount} ${vacantCount === 1 ? 'vaga' : 'vagas'}`
                            : 'Lotado'}
                        </span>
                      )
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          vacantCount > 0
                            ? 'bg-[#FAEEDA] text-[#BA7517]'
                            : 'bg-[#EAF3DE] text-[#3B6D11]'
                        }`}
                      >
                        {vacantCount > 0 ? 'Vago' : 'Ocupado'}
                      </span>
                    )}
                  </div>
                  <h2
                    className="text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-[#3B6D11] transition-colors"
                    title={property.name}
                  >
                    {property.name}
                  </h2>
                </div>

                <div className="p-5 flex-grow space-y-2 text-sm text-gray-600">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">
                      {property.address}, {property.city}
                      {property.state ? ` - ${property.state}` : ''}
                    </span>
                  </p>
                  {isMulti && (
                    <p className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>
                        {property.totalUnits || 0}{' '}
                        {property.totalUnits === 1 ? 'unidade' : 'unidades'}
                      </span>
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
