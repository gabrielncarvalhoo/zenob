import Link from 'next/link';

interface Property {
  id: string;
  name: string;
  type: 'HOUSE' | 'APARTMENT' | 'COMMERCIAL' | 'LAND' | 'OTHER';
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
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('Failed to fetch properties:', res.statusText);
      return [];
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
}

const PROPERTY_TYPE_MAP: Record<string, string> = {
  HOUSE: 'Casa',
  APARTMENT: 'Apartamento',
  COMMERCIAL: 'Comercial',
  LAND: 'Terreno',
  OTHER: 'Outro',
};

export default async function ImoveisPage() {
  const properties = await getProperties();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Imóveis</h1>
        <button className="bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium transition-colors">
          + Novo imóvel
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum imóvel encontrado</h3>
          <p className="text-gray-500 mb-6">Você ainda não cadastrou nenhum imóvel.</p>
          <button className="bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium transition-colors">
            Cadastrar primeiro imóvel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => {
            const typeLabel = PROPERTY_TYPE_MAP[property.type] || property.type;
            const vacantCount = property.vacantUnits ?? 0;
            
            return (
              <Link 
                href={`/imoveis/${property.id}`} 
                key={property.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col"
              >
                <div className="p-5 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 line-clamp-1" title={property.name}>
                      {property.name}
                    </h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {typeLabel}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {property.city}{property.state ? ` - ${property.state}` : ''}
                    </p>
                    <p className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      {property.totalUnits} {property.totalUnits === 1 ? 'unidade' : 'unidades'} totais
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center mt-auto">
                  <span className="text-sm font-medium text-gray-500">
                    Status:
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    vacantCount > 0 
                      ? 'bg-[#F3F4F6] text-[#6B7280]' 
                      : 'bg-[#EAF3DE] text-[#3B6D11]'
                  }`}>
                    {vacantCount} {vacantCount === 1 ? 'vaga' : 'vagas'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
