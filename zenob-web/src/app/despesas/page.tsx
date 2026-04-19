import Link from 'next/link';

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

async function getExpenses(filter?: string): Promise<Expense[]> {
  try {
    let url = 'http://localhost:3000/api/v1/expenses';
    if (filter === 'PAID') url += '?isPaid=true';
    if (filter === 'UNPAID') url += '?isPaid=false';

    const res = await fetch(url, {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('Failed to fetch expenses:', res.statusText);
      return [];
    }
    return res.json();
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return [];
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

export default async function DespesasPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const currentStatus = searchParams.status || 'ALL';
  const expenses = await getExpenses(currentStatus);

  const tabs = [
    { label: 'Todas', value: 'ALL' },
    { label: 'A pagar', value: 'UNPAID' },
    { label: 'Pagas', value: 'PAID' },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Despesas</h1>
        <button className="bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer">
          + Nova despesa
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map(tab => {
          const isActive = currentStatus === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value === 'ALL' ? '/despesas' : `/despesas?status=${tab.value}`}
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

      {expenses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma despesa encontrada</h3>
          <p className="text-gray-500 mb-6">
            {currentStatus === 'ALL' 
              ? 'Ainda não há nenhuma despesa registrada no sistema.'
              : 'Nenhuma despesa corresponde ao filtro selecionado.'}
          </p>
          {currentStatus === 'ALL' && (
            <button className="bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer">
              Registrar primeira despesa
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[900px] w-full">
              <div className="grid grid-cols-[1fr_1.5fr_2fr_1.5fr_1.5fr_1.5fr] bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="px-6 py-4">Status</div>
                <div className="px-6 py-4">Categoria</div>
                <div className="px-6 py-4">Descrição</div>
                <div className="px-6 py-4">Vencimento</div>
                <div className="px-6 py-4">Valor</div>
                <div className="px-6 py-4">Fornecedor</div>
              </div>
              <div className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => {
                  const statusInfo = getStatusInfo(expense.isPaid, expense.dueDate);
                  return (
                    <Link 
                      href={`/despesas/${expense.id}`} 
                      key={expense.id} 
                      className="grid grid-cols-[1fr_1.5fr_2fr_1.5fr_1.5fr_1.5fr] hover:bg-gray-50 transition-colors items-center group cursor-pointer"
                    >
                      <div className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium group-hover:text-[#3B6D11] transition-colors">
                        {translateCategory(expense.category)}
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                        {expense.description}
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(expense.dueDate)}
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatCurrency(expense.amount)}
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.supplierName || '-'}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
