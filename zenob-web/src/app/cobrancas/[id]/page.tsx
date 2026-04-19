import Link from 'next/link';
import { notFound } from 'next/navigation';

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

async function getReceivable(id: string): Promise<Receivable | null> {
  try {
    const res = await fetch(`http://localhost:3000/api/v1/receivables/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      console.error('Failed to fetch receivable:', res.statusText);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching receivable:', error);
    return null;
  }
}

function getStatusBadge(status: Receivable['status']) {
  switch (status) {
    case 'PENDING':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#F3F4F6] text-[#6B7280]">Pendente</span>;
    case 'PAID':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EAF3DE] text-[#3B6D11]">Paga</span>;
    case 'PARTIAL':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#E6F1FB] text-[#0C447C]">Parcial</span>;
    case 'OVERDUE':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#FCEBEB] text-[#791F1F]">Vencida</span>;
    case 'RENEGOTIATED':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EEEDFE] text-[#26215C]">Renegociada</span>;
    case 'WAIVED':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#F3F4F6] text-[#6B7280]">Dispensada</span>;
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

export default async function DetalheCobrancaPage({ params }: { params: { id: string } }) {
  const receivable = await getReceivable(params.id);

  if (!receivable) {
    notFound();
  }

  const isBalanceGreaterThanZero = receivable.balanceAmount > 0;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/cobrancas" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-[#3B6D11] transition-colors"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Detalhes da Cobrança</h1>
        <div>
          {getStatusBadge(receivable.status)}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Competência</span>
              <span className="text-base text-gray-900 font-medium">
                {formatCompetency(receivable.competencyMonth)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Vencimento</span>
              <span className="text-base text-gray-900 font-medium">
                {formatDate(receivable.dueDate)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Valor original</span>
              <span className="text-base text-gray-900 font-medium">
                {formatCurrency(receivable.originalAmount)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Multas / Acréscimos</span>
              <span className="text-base text-gray-900 font-medium">
                {formatCurrency(receivable.penaltiesAmount)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Desconto</span>
              <span className="text-base text-gray-900 font-medium">
                {formatCurrency(receivable.discountAmount)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Valor pago</span>
              <span className="text-base text-[#3B6D11] font-medium">
                {formatCurrency(receivable.paidAmount)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm lg:col-span-3 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Saldo devedor</span>
                <span className={`text-xl font-bold ${isBalanceGreaterThanZero ? 'text-[#791F1F]' : 'text-gray-900'}`}>
                  {formatCurrency(receivable.balanceAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
