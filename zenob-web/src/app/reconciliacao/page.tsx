"use client";

import { useEffect, useState } from 'react';
import { Plus, RefreshCw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface ContractEntry {
  contractId: string;
  tenant: string;
  expectedAmount: number;
  paidAmount: number;
  isPaid: boolean;
  isPartial: boolean;
  matched: boolean;
}

interface ReconciliationStatus {
  competencyMonth: string;
  registered: number;
  expected: number;
  totalContracts: number;
  paidContracts: number;
  missingContracts: number;
  entries: ContractEntry[];
}

interface Tenant {
  id: string;
  fullName: string;
}

interface LeaseContract {
  id: string;
  rentAmount: string;
  unit: { code: string; property: { name: string } };
  primaryTenant: { id: string; fullName: string };
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function getCurrentCompetency() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function parseCompetency(v: string) {
  const [y, m] = v.split('-');
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${months[parseInt(m, 10) - 1]}/${y}`;
}

export default function ReconciliacaoPage() {
  const [data, setData] = useState<ReconciliationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [competency, setCompetency] = useState(getCurrentCompetency());
  const [showForm, setShowForm] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<LeaseContract[]>([]);
  const [form, setForm] = useState({
    tenantId: '',
    leaseContractId: '',
    amount: '',
    paymentMethod: 'PIX' as 'PIX' | 'CASH' | 'CHECK',
    transactionDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchStatus = (cm: string) => {
    setLoading(true);
    fetch(`http://localhost:3000/api/v1/reconciliation/status?competencyMonth=${cm}`, {
      headers: { 'x-account-id': 'account-teste-001' },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch(`http://localhost:3000/api/v1/tenants?accountId=account-teste-001`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setTenants(d.slice(0, 50)));
  }, []);

  useEffect(() => {
    if (form.tenantId) {
      fetch(`http://localhost:3000/api/v1/leases?accountId=account-teste-001&tenantId=${form.tenantId}&status=ACTIVE`)
        .then(r => r.ok ? r.json() : [])
        .then(d => setContracts(d))
        .catch(() => setContracts([]));
    }
  }, [form.tenantId]);

  useEffect(() => {
    fetchStatus(competency);
  }, [competency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      tenantId: form.tenantId,
      leaseContractId: form.leaseContractId,
      competencyMonth: competency,
      amount: parseFloat(form.amount),
      paymentMethod: form.paymentMethod,
      transactionDate: form.transactionDate,
      notes: form.notes || undefined,
    };
    try {
      const res = await fetch('http://localhost:3000/api/v1/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-account-id': 'account-teste-001' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ tenantId: '', leaseContractId: '', amount: '', paymentMethod: 'PIX', transactionDate: new Date().toISOString().split('T')[0], notes: '' });
        fetchStatus(competency);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Estornar esta entrada?')) return;
    await fetch(`http://localhost:3000/api/v1/reconciliation/${id}`, {
      method: 'DELETE',
      headers: { 'x-account-id': 'account-teste-001' },
    });
    fetchStatus(competency);
  };

  const paidEntries = data?.entries.filter(e => e.matched) ?? [];
  const missingEntries = data?.entries.filter(e => !e.matched) ?? [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conciliação Bancária</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Registre pagamentos Pix, dinheiro ou cheque e detecte faltantes
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar pagamento
        </button>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-medium text-gray-700">Competência:</label>
        <input
          type="month"
          value={competency}
          onChange={e => setCompetency(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <button onClick={() => fetchStatus(competency)} className="p-2 text-gray-500 hover:text-gray-700">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-[#3B6D11]" />
              <span className="text-xs font-semibold text-gray-500 uppercase">Registrados</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.paidContracts}/{data.totalContracts}</p>
            <p className="text-xs text-gray-400 mt-1">{formatCurrency(data.registered)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[#E24B4A]" />
              <span className="text-xs font-semibold text-gray-500 uppercase">Faltantes</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{data.missingContracts}</p>
            <p className="text-xs text-gray-400 mt-1">sem registro este mês</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[#BA7517]" />
              <span className="text-xs font-semibold text-gray-500 uppercase">Esperado</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.expected)}</p>
            <p className="text-xs text-gray-400 mt-1">{parseCompetency(competency)}</p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Registrar pagamento</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Inquilino</label>
              <select
                value={form.tenantId}
                onChange={e => setForm({ ...form, tenantId: e.target.value, leaseContractId: '' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                required
              >
                <option value="">Selecione</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contrato</label>
              <select
                value={form.leaseContractId}
                onChange={e => setForm({ ...form, leaseContractId: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                required
                disabled={!form.tenantId}
              >
                <option value="">Selecione inquilino primeiro</option>
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.unit?.property?.name} - {c.unit?.code} - {formatCurrency(Number(c.rentAmount))}/mês
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Método</label>
              <select
                value={form.paymentMethod}
                onChange={e => setForm({ ...form, paymentMethod: e.target.value as any })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="PIX">Pix</option>
                <option value="CASH">Dinheiro</option>
                <option value="CHECK">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data do pagamento</label>
              <input
                type="date"
                value={form.transactionDate}
                onChange={e => setForm({ ...form, transactionDate: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="opcional"
              />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#3B6D11] hover:bg-[#27500A] text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Missing entries */}
      {missingEntries.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Pagamentos faltantes ({missingEntries.length})
          </h2>
          <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-red-100">
                  <th className="text-left text-xs font-semibold text-red-700 px-4 py-3">Inquilino</th>
                  <th className="text-right text-xs font-semibold text-red-700 px-4 py-3">Esperado</th>
                </tr>
              </thead>
              <tbody>
                {missingEntries.map(entry => (
                  <tr key={entry.contractId} className="border-b border-red-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">{entry.tenant}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(entry.expectedAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paid entries */}
      {paidEntries.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Registrados ({paidEntries.length})
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Inquilino</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Valor</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {paidEntries.map(entry => (
                  <tr key={entry.contractId} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{entry.tenant}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-[#3B6D11]">
                      {formatCurrency(entry.paidAmount)}
                      {entry.isPartial && (
                        <span className="text-xs text-yellow-600 ml-1">parcial</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.isPartial ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Parcial</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Pago</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {/* TODO */}}
                        className="text-xs text-gray-500 hover:text-red-600"
                      >
                        Estornar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      )}

      {!loading && data && data.entries.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">Nenhum contrato ativo para esta competência</p>
        </div>
      )}
    </div>
  );
}