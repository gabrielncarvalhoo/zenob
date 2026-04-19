import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Expense {
  id: string;
  propertyId: string;
  unitId: string | null;
  category: 'MAINTENANCE' | 'CONDOMINIUM' | 'IPTU' | 'INSURANCE' | 'ADMIN' | 'WATER' | 'ENERGY' | 'OTHER';
  description: string;
  supplierName: string;
  referenceMonth: string;
  dueDate: string;
  paidDate: string | null;
  amount: number;
  isPaid: boolean;
  isRecoverable: boolean;
  notes: string | null;
}

async function getExpense(id: string): Promise<Expense | null> {
  try {
    const res = await fetch(`http://localhost:3000/api/v1/expenses/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      console.error('Failed to fetch expense:', res.statusText);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching expense:', error);
    return null;
  }
}

function getStatusInfo(isPaid: boolean, dueDate: string) {
  if (isPaid) {
    return {
      label: 'Paga',
      className: 'bg-[#EAF3DE] text-[#3B6D11]'
    };
  }

  const isOverdue = new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

  if (isOverdue) {
    return {
      label: 'Vencida',
      className: 'bg-[#FCEBEB] text-[#791F1F]'
    };
  }

  return {
    label: 'A pagar',
    className: 'bg-[#F3F4F6] text-[#6B7280]'
  };
}

function translateCategory(category: Expense['category']) {
  const map: Record<Expense['category'], string> = {
    MAINTENANCE: 'Manutenção',
    CONDOMINIUM: 'Condomínio',
    IPTU: 'IPTU',
    INSURANCE: 'Seguro',
    ADMIN: 'Administrativo',
    WATER: 'Água',
    ENERGY: 'Energia',
    OTHER: 'Outros',
  };
  return map[category] || category;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return dateString;
  }
}

function formatReferenceMonth(month: string) {
  if (!month) return '-';
  const [year, m] = month.split('-');
  if (!year || !m) return month;
  
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthName = months[parseInt(m, 10) - 1];
  
  return `${monthName}/${year}`;
}

export default async function DetalheDespesaPage({ params }: { params: { id: string } }) {
  const expense = await getExpense(params.id);

  if (!expense) {
    notFound();
  }

  const statusInfo = getStatusInfo(expense.isPaid, expense.dueDate);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/despesas" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-[#3B6D11] transition-colors"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Detalhes da Despesa</h1>
        <div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">Informações Gerais</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm md:col-span-2">
              <span className="text-sm font-medium text-gray-500 block mb-1">Descrição</span>
              <span className="text-base text-gray-900 font-medium">{expense.description}</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Categoria</span>
              <span className="text-base text-gray-900 font-medium">{translateCategory(expense.category)}</span>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Fornecedor</span>
              <span className="text-base text-gray-900 font-medium">{expense.supplierName || '-'}</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Mês de referência</span>
              <span className="text-base text-gray-900 font-medium">{formatReferenceMonth(expense.referenceMonth)}</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Recuperável</span>
              <span className="text-base text-gray-900 font-medium">{expense.isRecoverable ? 'Sim' : 'Não'}</span>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">Dados Financeiros e Prazos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Valor</span>
              <span className="text-lg text-gray-900 font-bold">{formatCurrency(expense.amount)}</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Vencimento</span>
              <span className="text-base text-gray-900 font-medium">{formatDate(expense.dueDate)}</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Data de pagamento</span>
              <span className="text-base text-gray-900 font-medium">{formatDate(expense.paidDate)}</span>
            </div>
          </div>

          {expense.notes && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-100 pb-2">Observações</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-line text-gray-700">
                {expense.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
