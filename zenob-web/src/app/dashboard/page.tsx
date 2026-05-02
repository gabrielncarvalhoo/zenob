import Link from 'next/link';
import {
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Home,
  FileSignature,
  TrendingDown,
  Plus,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { DashboardCharts } from './DashboardCharts';
import { RenewalAlerts } from './RenewalAlerts';

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

function saudacao(): string {
  // Hora servidor em America/Sao_Paulo
  const horaSP = new Date().toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    hour12: false,
  });
  const h = parseInt(horaSP, 10);
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

async function getDashboardData(): Promise<DashboardData> {
  try {
    const res = await fetch('http://localhost:3000/api/v1/dashboard', {
      headers: { 'x-account-id': 'account-teste-001' },
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

  const cards = [
    {
      label: 'A receber',
      value: formatCurrency(data.aReceber.total),
      sub: `${data.aReceber.count} cobrança${data.aReceber.count === 1 ? '' : 's'} pendente${data.aReceber.count === 1 ? '' : 's'}`,
      icon: Wallet,
      iconColor: 'text-[#3B6D11]',
      iconBg: 'bg-[#EAF3DE]',
    },
    {
      label: 'Recebido',
      value: formatCurrency(data.recebido.total),
      sub: `${data.recebido.count} pagamento${data.recebido.count === 1 ? '' : 's'} no mês`,
      icon: CheckCircle2,
      iconColor: 'text-[#3B6D11]',
      iconBg: 'bg-[#EAF3DE]',
      valueColor: 'text-[#3B6D11]',
    },
    {
      label: 'Inadimplência',
      value: formatCurrency(data.inadimplencia.total),
      sub: `${data.inadimplencia.count} em atraso`,
      icon: AlertTriangle,
      iconColor: 'text-[#E24B4A]',
      iconBg: 'bg-[#FCEBEB]',
      valueColor: data.inadimplencia.total > 0 ? 'text-[#E24B4A]' : '',
    },
    {
      label: 'Ocupação',
      value: `${data.ocupacao.percentual}%`,
      sub: `${data.ocupacao.ocupadas} de ${data.ocupacao.total} unidades`,
      icon: Home,
      iconColor: 'text-[#BA7517]',
      iconBg: 'bg-[#FAEEDA]',
    },
    {
      label: 'Contratos ativos',
      value: String(data.contratosAtivos),
      sub: 'em vigor agora',
      icon: FileSignature,
      iconColor: 'text-[#3B6D11]',
      iconBg: 'bg-[#EAF3DE]',
    },
    {
      label: 'Despesas',
      value: formatCurrency(data.despesas.total),
      sub: `${data.despesas.count} lançamento${data.despesas.count === 1 ? '' : 's'} no mês`,
      icon: TrendingDown,
      iconColor: 'text-[#BA7517]',
      iconBg: 'bg-[#FAEEDA]',
    },
  ];

  const atalhos = [
    {
      href: '/cobrancas?status=OVERDUE',
      label: 'Ver cobranças atrasadas',
      desc: `${data.inadimplencia.count} pendência${data.inadimplencia.count === 1 ? '' : 's'} aguardando ação`,
      icon: Receipt,
      highlight: data.inadimplencia.count > 0,
    },
    {
      href: '/contratos/novo',
      label: 'Novo contrato',
      desc: 'Cadastrar um novo aluguel',
      icon: Plus,
      highlight: false,
    },
    {
      href: '/imoveis/novo',
      label: 'Novo imóvel',
      desc: 'Registrar imóvel ou unidade',
      icon: Home,
      highlight: false,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{saudacao()}, Gabriel</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data.inadimplencia.count > 0
            ? `${data.inadimplencia.count} cobrança${data.inadimplencia.count === 1 ? '' : 's'} vencida${data.inadimplencia.count === 1 ? '' : 's'} precisa${data.inadimplencia.count === 1 ? '' : 'm'} da sua atenção`
            : 'Todos os pagamentos estão em dia.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {c.label}
              </span>
              <div className={`w-9 h-9 rounded-lg ${c.iconBg} flex items-center justify-center`}>
                <c.icon className={`w-4 h-4 ${c.iconColor}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${c.valueColor ?? 'text-gray-900'}`}>{c.value}</p>
            <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <DashboardCharts />

      <RenewalAlerts />

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Atalhos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {atalhos.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`group bg-white rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${
              a.highlight
                ? 'border-[#E24B4A]/40 hover:border-[#E24B4A]'
                : 'border-gray-200 hover:border-[#3B6D11]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  a.highlight ? 'bg-[#FCEBEB] text-[#E24B4A]' : 'bg-[#EAF3DE] text-[#3B6D11]'
                }`}
              >
                <a.icon className="w-4 h-4" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#3B6D11] transition-colors" />
            </div>
            <p className="font-semibold text-gray-900">{a.label}</p>
            <p className="text-sm text-gray-500 mt-1">{a.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
