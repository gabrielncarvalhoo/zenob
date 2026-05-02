"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Wrench, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
  openedAt: string;
  closedAt: string | null;
  estimatedCost: string | null;
  actualCost: string | null;
  property: { id: string; name: string; address: string };
  unit: { id: string; code: string } | null;
  tenant: { id: string; fullName: string } | null;
}

function getPriorityBadge(priority: Ticket['priority']) {
  const map = {
    LOW: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Baixa</span>,
    MEDIUM: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Média</span>,
    HIGH: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Alta</span>,
    URGENT: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Urgente</span>,
  };
  return map[priority];
}

function getStatusBadge(status: Ticket['status']) {
  const map = {
    OPEN: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Aberto</span>,
    IN_PROGRESS: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Em andamento</span>,
    WAITING: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Aguardando</span>,
    RESOLVED: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Resolvido</span>,
    CLOSED: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-500">Encerrado</span>,
  };
  return map[status];
}

function formatCurrency(value: string | null | undefined) {
  if (!value) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default function ManutencaoPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    fetch('http://localhost:3000/api/v1/maintenance')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setTickets(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? tickets : tickets.filter(t => t.status === filter);

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    waiting: tickets.filter(t => t.status === 'WAITING').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
    closed: tickets.filter(t => t.status === 'CLOSED').length,
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manutenção</h1>
          <p className="text-gray-500 mt-1 text-sm">{stats.total} chamado(s) no total</p>
        </div>
        <Link
          href="/manutencao/novo"
          className="inline-flex items-center gap-2 bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo chamado
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <button
          onClick={() => setFilter('ALL')}
          className={`p-4 rounded-xl border text-left transition-colors ${filter === 'ALL' ? 'border-[#3B6D11] bg-[#EAF3DE]' : 'border-gray-200 bg-white hover:border-gray-300'}`}
        >
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </button>
        <button
          onClick={() => setFilter('OPEN')}
          className={`p-4 rounded-xl border text-left transition-colors ${filter === 'OPEN' ? 'border-[#3B6D11] bg-[#EAF3DE]' : 'border-gray-200 bg-white hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Abertos
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.open}</div>
        </button>
        <button
          onClick={() => setFilter('IN_PROGRESS')}
          className={`p-4 rounded-xl border text-left transition-colors ${filter === 'IN_PROGRESS' ? 'border-[#3B6D11] bg-[#EAF3DE]' : 'border-gray-200 bg-white hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" /> Em andar
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
        </button>
        <button
          onClick={() => setFilter('WAITING')}
          className={`p-4 rounded-xl border text-left transition-colors ${filter === 'WAITING' ? 'border-[#3B6D11] bg-[#EAF3DE]' : 'border-gray-200 bg-white hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            <Wrench className="w-3.5 h-3.5 text-yellow-500" /> Aguardando
          </div>
          <div className="text-2xl font-bold text-yellow-600">{stats.waiting}</div>
        </button>
        <button
          onClick={() => setFilter('RESOLVED')}
          className={`p-4 rounded-xl border text-left transition-colors ${filter === 'RESOLVED' ? 'border-[#3B6D11] bg-[#EAF3DE]' : 'border-gray-200 bg-white hover:border-gray-300'}`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Resolvidos
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum chamado encontrado</p>
          <Link href="/manutencao/novo" className="text-[#3B6D11] hover:underline text-sm mt-2 inline-block">
            Criar primeiro chamado
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Título</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Imóvel</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Prioridade</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Aberto em</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Custo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ticket => (
                <tr key={ticket.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/manutencao/${ticket.id}`} className="font-medium text-gray-900 hover:text-[#3B6D11]">
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700">{ticket.property.name}</div>
                    <div className="text-xs text-gray-400">{ticket.property.address}</div>
                  </td>
                  <td className="px-4 py-3">{getPriorityBadge(ticket.priority)}</td>
                  <td className="px-4 py-3">{getStatusBadge(ticket.status)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(ticket.openedAt)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(ticket.actualCost ?? ticket.estimatedCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}