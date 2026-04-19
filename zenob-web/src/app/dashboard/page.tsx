interface DashboardData {
  competencyMonth: string;
  aReceber: { total: number; count: number };
  recebido: { total: number; count: number };
  inadimplencia: { total: number; count: number };
  ocupacao: { percentual: number; ocupadas: number; total: number; vagas: number };
  despesas: { total: number; count: number };
  contratosAtivos: number;
}

const defaultData: DashboardData = {
  competencyMonth: '',
  aReceber: { total: 0, count: 0 },
  recebido: { total: 0, count: 0 },
  inadimplencia: { total: 0, count: 0 },
  ocupacao: { percentual: 0, ocupadas: 0, total: 0, vagas: 0 },
  despesas: { total: 0, count: 0 },
  contratosAtivos: 0,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);
}

async function getDashboardData(): Promise<DashboardData> {
  try {
    const res = await fetch('http://localhost:3000/api/v1/dashboard', {
      cache: 'no-store',
    });
    if (!res.ok) return defaultData;
    return await res.json();
  } catch {
    return defaultData;
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bom dia, Gabriel</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data.inadimplencia.count > 0
            ? `${data.inadimplencia.count} cobrança(s) vencida(s) precisam da sua atenção`
            : 'Todos os pagamentos estão em dia.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">A receber</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.aReceber.total)}</p>
          <p className="text-xs text-gray-400 mt-1">{data.aReceber.count} cobrança(s) pendente(s)</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Recebido</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.recebido.total)}</p>
          <p className="text-xs text-gray-400 mt-1">{data.recebido.count} pagamento(s) no mês</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Inadimplência</p>
          <p className={`text-2xl font-bold ${data.inadimplencia.total > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {formatCurrency(data.inadimplencia.total)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{data.inadimplencia.count} em atraso</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ocupação</p>
          <p className="text-2xl font-bold text-gray-900">{data.ocupacao.percentual}%</p>
          <p className="text-xs text-gray-400 mt-1">
            {data.ocupacao.ocupadas} de {data.ocupacao.total} unidades ocupadas
          </p>
        </div>
      </div>
    </div>
  );
}
