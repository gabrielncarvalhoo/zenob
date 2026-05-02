"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

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
  supplierName: string | null;
  notes: string | null;
  property: { id: string; name: string; address: string };
  unit: { id: string; identifier: string } | null;
  tenant: { id: string; fullName: string; phone: string | null } | null;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['WAITING', 'RESOLVED', 'OPEN'],
  WAITING: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED: ['IN_PROGRESS', 'CLOSED'],
  CLOSED: [],
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em andamento',
  WAITING: 'Aguardando',
  RESOLVED: 'Resolvido',
  CLOSED: 'Encerrado',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatCurrency(v: string | null | undefined) {
  if (!v) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v));
}

export default function DetalheManutencaoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'OPEN',
    estimatedCost: '',
    actualCost: '',
    supplierName: '',
    notes: '',
  });

  useEffect(() => {
    fetch(`http://localhost:3000/api/v1/maintenance/${params.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setTicket(data);
          setForm({
            title: data.title,
            description: data.description ?? '',
            priority: data.priority,
            status: data.status,
            estimatedCost: data.estimatedCost ?? '',
            actualCost: data.actualCost ?? '',
            supplierName: data.supplierName ?? '',
            notes: data.notes ?? '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/maintenance/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          priority: form.priority,
          status: form.status,
          estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : null,
          actualCost: form.actualCost ? parseFloat(form.actualCost) : null,
          supplierName: form.supplierName || null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar');
      const updated = await res.json();
      setTicket(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro interno');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/maintenance/${params.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
      router.push('/manutencao');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro interno');
      setDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/maintenance/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar status');
      const updated = await res.json();
      setTicket(t => t ? { ...t, status: updated.status, closedAt: updated.closedAt } : t);
      setForm(f => ({ ...f, status: updated.status }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro interno');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container mx-auto py-8 px-4 text-center">Carregando...</div>;
  if (!ticket) return <div className="container mx-auto py-8 px-4 text-center">Chamado não encontrado.</div>;

  const nextStatuses = STATUS_TRANSITIONS[ticket.status] ?? [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-6">
        <Link href="/manutencao" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-[#3B6D11]">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Link>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
          <p className="text-gray-500 text-sm mt-1">Aberto em {formatDate(ticket.openedAt)}</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-[#378ADD] hover:underline text-sm font-medium">
            Editar
          </button>
        )}
      </div>

      {error && (
        <div className="bg-[#FCEBEB] border border-[#E24B4A] text-[#791F1F] px-4 py-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      {editing ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11]">
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11]">
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custo estimado (R$)</label>
                <input type="number" step="0.01" value={form.estimatedCost}
                  onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custo real (R$)</label>
                <input type="number" step="0.01" value={form.actualCost}
                  onChange={e => setForm(f => ({ ...f, actualCost: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
              <input value={form.supplierName} onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11]" />
            </div>
          </div>
          <div className="px-6 pb-6 flex justify-end gap-3">
            <button onClick={() => setEditing(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-[#3B6D11] hover:bg-[#27500A] text-white rounded-md text-sm font-medium disabled:opacity-70 flex items-center gap-2">
              {saving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
              Salvar
            </button>
          </div>
        </div>
      ) : null}

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Imóvel</span>
          <span className="text-sm font-medium text-gray-900">{ticket.property.name}</span>
          <span className="text-xs text-gray-400 block">{ticket.property.address}</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Prioridade</span>
          <span className={`text-sm font-bold ${ticket.priority === 'URGENT' ? 'text-red-600' : ticket.priority === 'HIGH' ? 'text-orange-600' : 'text-gray-900'}`}>
            {PRIORITY_LABELS[ticket.priority]}
          </span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Status</span>
          <span className="text-sm font-bold text-gray-900">{STATUS_LABELS[ticket.status]}</span>
        </div>
        {ticket.unit && (
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Unidade</span>
            <span className="text-sm font-medium text-gray-900">{ticket.unit.code}</span>
          </div>
        )}
        {ticket.tenant && (
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Inquilino</span>
            <span className="text-sm font-medium text-gray-900">{ticket.tenant.fullName}</span>
            {ticket.tenant.phone && <span className="text-xs text-gray-400 block">{ticket.tenant.phone}</span>}
          </div>
        )}
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Custo real</span>
          <span className="text-sm font-bold text-gray-900">{formatCurrency(ticket.actualCost ?? ticket.estimatedCost)}</span>
        </div>
      </div>

      {ticket.description && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Descrição</h2>
          <p className="text-gray-700 whitespace-pre-line">{ticket.description}</p>
        </div>
      )}

      {/* Status transitions */}
      {nextStatuses.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Atualizar status</h2>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map(s => (
              <button key={s} onClick={() => handleStatusChange(s)} disabled={saving}
                className="px-4 py-2 bg-[#378ADD] hover:bg-[#2A6DB8] text-white rounded-md text-sm font-medium disabled:opacity-70">
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Delete */}
      <div className="flex justify-end">
        <button onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium">
          <Trash2 className="w-4 h-4" /> Excluir chamado
        </button>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir chamado?</h3>
            <p className="text-gray-600 mb-6 text-sm">Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 bg-[#E24B4A] hover:bg-[#C93A39] text-white rounded-md text-sm font-medium disabled:opacity-70 flex items-center gap-2">
                {deleting ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Trash2 className="w-4 h-4" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}