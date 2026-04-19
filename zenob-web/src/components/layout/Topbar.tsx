'use client';

import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

const tituloPorRota: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/imoveis': 'Imóveis',
  '/inquilinos': 'Inquilinos',
  '/contratos': 'Contratos',
  '/cobrancas': 'Cobranças',
  '/despesas': 'Despesas',
  '/relatorios': 'Relatórios',
  '/manutencao': 'Manutenção',
  '/notificacoes': 'Notificações',
  '/ajustes': 'Ajustes',
};

function obterTitulo(pathname: string): string {
  // Verifica rota exata primeiro
  if (tituloPorRota[pathname]) return tituloPorRota[pathname];
  // Verifica prefixo (sub-rotas)
  const prefixo = Object.keys(tituloPorRota).find((rota) => pathname.startsWith(rota + '/'));
  return prefixo ? tituloPorRota[prefixo] : 'Zenob';
}

export function Topbar() {
  const pathname = usePathname();
  const titulo = obterTitulo(pathname);

  return (
    <header className="fixed top-0 left-60 right-0 h-14 bg-white border-b border-gray-200 z-30 flex items-center px-6 gap-4">
      {/* Título da página */}
      <h1 className="text-base font-semibold text-gray-900 shrink-0">{titulo}</h1>

      {/* Barra de busca — centro */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#3B6D11] focus:ring-2 focus:ring-[#3B6D11]/10 transition-colors placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Avatar do usuário */}
      <div className="shrink-0">
        <button
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3B6D11] text-white text-xs font-semibold hover:bg-[#27500A] transition-colors"
          title="Perfil do usuário"
        >
          GC
        </button>
      </div>
    </header>
  );
}
