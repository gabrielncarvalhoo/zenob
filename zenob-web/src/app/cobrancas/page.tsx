import Link from 'next/link';

interface Receivable {
  id: string;
  competencyMonth: string;
  dueDate: string;
  originalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  penaltiesAmount: number;
  discountAmount: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'RENEGOTIATED' | 'WAIVED';
}

async function getReceivables(): Promise<Receivable[]> {
  try {
    const res = await fetch('http://localhost:3000/api/v1/receivables', {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('Failed to fetch receivables:', res.statusText);
      return [];
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching receivables:', error);
    return [];
  }
}

function getStatusBadge(status: Receivable['status']) {
  switch (status) {
    case 'PENDING':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">Pendente</span>;
    case 'PAID':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAF3DE] text-[#3B6D11]">Paga</span>;
    case 'PARTIAL':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E6F1FB] text-[#0C447C]">Parcial</span>;
    case 'OVERDUE':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FCEBEB] text-[#791F1F]">Vencida</span>;
    case 'RENEGOTIATED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EEEDFE] text-[#26215C]">Renegociada</span>;
    case 'WAIVED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">Dispensada</span>;
    default:
      return null;
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
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

function formatCompetency(competency: string) {
  if (!competency) return '-';
  const [year, month] = competency.split('-');
  if (!year || !month) return competency;
  
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthName = months[parseInt(month, 10) - 1];
  
  return `${monthName}/${year}`;
}

export default async function CobrancasPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const allReceivables = await getReceivables();
  
  const currentStatus = searchParams.status || 'ALL';
  
  const receivables = currentStatus === 'ALL' 
    ? allReceivables 
    : allReceivables.filter(r => {
        if (currentStatus === 'PENDING') return r.status === 'PENDING';
        if (currentStatus === 'OVERDUE') return r.status === 'OVERDUE';
        if (currentStatus === 'PAID') return r.status === 'PAID';
        if (currentStatus === 'PARTIAL') return r.status === 'PARTIAL';
        return true;
      });

  const tabs = [
    { label: 'Todas', value: 'ALL' },
    { label: 'Pendentes', value: 'PENDING' },
    { label: 'Vencidas', value: 'OVERDUE' },
    { label: 'Pagas', value: 'PAID' },
    { label: 'Parcial', value: 'PARTIAL' },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cobranças</h1>
      </div>

      <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map(tab => {
          const isActive = currentStatus === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value === 'ALL' ? '/cobrancas' : `/cobrancas?status=${tab.value}`}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                isActive 
                  ? 'border-[#3B6D11] text-[#3B6D11]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {receivables.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma cobrança encontrada</h3>
          <p className="text-gray-500">
            {currentStatus === 'ALL' 
              ? 'Ainda não há nenhuma cobrança registrada no sistema.'
              : 'Nenhuma cobrança corresponde ao filtro selecionado.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[900px] w-full">
              <div className="grid grid-cols-[1fr_1.5fr_1.5fr_1.5fr_1.5fr_1.5fr] bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="px-6 py-4">Status</div>
                <div className="px-6 py-4">Competência</div>
                <div className="px-6 py-4">Vencimento</div>
                <div className="px-6 py-4">Valor original</div>
                <div className="px-6 py-4">Valor pago</div>
                <div className="px-6 py-4">Saldo</div>
              </div>
              <div className="bg-white divide-y divide-gray-200">
                {receivables.map((receivable) => (
                  <Link 
                    href={`/cobrancas/${receivable.id}`} 
                    key={receivable.id} 
                    className="grid grid-cols-[1fr_1.5fr_1.5fr_1.5fr_1.5fr_1.5fr] hover:bg-gray-50 transition-colors items-center group cursor-pointer"
                  >
                    <div className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(receivable.status)}
                    </div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 group-hover:text-[#3B6D11] transition-colors">
                      {formatCompetency(receivable.competencyMonth)}
                    </div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(receivable.dueDate)}
                    </div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(receivable.originalAmount)}
                    </div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm text-[#3B6D11]">
                      {receivable.paidAmount > 0 ? formatCurrency(receivable.paidAmount) : '-'}
                    </div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(receivable.balanceAmount)}
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
