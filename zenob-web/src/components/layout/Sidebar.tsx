'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Receipt,
  TrendingDown,
  BarChart3,
  Wrench,
  Bell,
  Settings,
  ChevronDown,
  Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const gruposNavegacao = [
  {
    label: 'Principal',
    itens: [
      { href: '/dashboard', icone: LayoutDashboard, label: 'Dashboard' },
      { href: '/imoveis', icone: Building2, label: 'Imóveis' },
      { href: '/inquilinos', icone: Users, label: 'Inquilinos' },
      { href: '/contratos', icone: FileText, label: 'Contratos' },
    ],
  },
  {
    label: 'Financeiro',
    itens: [
      { href: '/cobrancas', icone: Receipt, label: 'Cobranças' },
      { href: '/despesas', icone: TrendingDown, label: 'Despesas' },
      { href: '/relatorios', icone: BarChart3, label: 'Relatórios' },
    ],
  },
  {
    label: 'Operações',
    itens: [
      { href: '/manutencao', icone: Wrench, label: 'Manutenção' },
      { href: '/notificacoes', icone: Bell, label: 'Notificações' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-60 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#3B6D11]">
          <Leaf className="w-4 h-4 text-white" strokeWidth={2} />
        </div>
        <span className="text-lg font-bold text-[#27500A] tracking-tight">Zenob</span>
      </div>

      {/* Seletor de workspace */}
      <div className="px-3 py-3 border-b border-gray-100">
        <button className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <div className="flex flex-col items-start">
            <span className="font-medium text-gray-900 text-xs leading-tight">Imobiliária G.N.</span>
            <span className="text-[11px] text-gray-500">Plano Pro</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {gruposNavegacao.map((grupo) => (
          <div key={grupo.label}>
            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {grupo.label}
            </p>
            <ul className="space-y-0.5">
              {grupo.itens.map(({ href, icone: Icone, label }) => {
                const ativo = pathname === href || pathname.startsWith(href + '/');
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        ativo
                          ? 'bg-[#EAF3DE] text-[#3B6D11] font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icone
                        className={cn('w-4 h-4 shrink-0', ativo ? 'text-[#3B6D11]' : 'text-gray-400')}
                        strokeWidth={ativo ? 2.2 : 1.8}
                      />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Rodapé — Ajustes */}
      <div className="px-3 py-3 border-t border-gray-100">
        <Link
          href="/ajustes"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            pathname === '/ajustes'
              ? 'bg-[#EAF3DE] text-[#3B6D11] font-medium'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <Settings
            className={cn(
              'w-4 h-4 shrink-0',
              pathname === '/ajustes' ? 'text-[#3B6D11]' : 'text-gray-400'
            )}
            strokeWidth={1.8}
          />
          Ajustes
        </Link>
      </div>
    </aside>
  );
}
