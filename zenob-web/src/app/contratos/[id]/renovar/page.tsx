"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw, Calendar, DollarSign, ArrowLeft } from 'lucide-react';

interface RenewalContract {
  contractId: string;
  tenantName: string;
  propertyName: string;
  unitCode: string;
  endDate: string;
  daysUntilExpiry: number;
  rentAmount: number;
  nextReminderDate: string | null;
  nextReminderDays: number | null;
  status: string;
}

interface ContractDetail {
  id: string;
  startDate: string;
  endDate: string;
  rentAmount: string;
  dueDay: number;
  status: string;
  adjustmentIndex: string;
  lateFeeValue: string;
  interestValue: string;
  unit: { code: string; property: { name: string; address: string } };
  leaseTenants: Array<{ tenant: { id: string; fullName: string; email: string; phone: string } }>;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function getDaysLabel(days: number) {
  if (days < 0) return `Venceu há ${Math.abs(days)} dia(s)`;
  if (days === 0) return 'Vence hoje';
  if (days === 1) return 'Vence amanhã';
  if (days <= 10) return `Vence em ${days} dia(s)`;
  return `${days} dia(s) para vencer`;
}

export default function ContratoRenovarPage({ params }: { params: { id: string } }) {
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [renewalData, setRenewalData] = useState({
    startDate: '',
    endDate: '',
    rentAmount: '',
    dueDay: 5,
    adjustmentIndex: 'IGP_M',
    lateFeeValue: '2',
    interestValue: '1',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch(`http://localhost:3000/api/v1/leases/${params.id}`, {
      headers: { 'x-account-id': 'account-teste-001' },
    })
      .then(r => r.ok ? r.json() : null)
      .then(c => {
        if (c) {
          setContract(c);
          // Pre-fill renewal data from existing contract
          const end = new Date(c.endDate);
          const newStart = new Date(end);
          newStart.setDate(newStart.getDate() + 1);
          const newEnd = new Date(newStart);
          newEnd.setFullYear(newEnd.getFullYear() + 1);

          setRenewalData({
            startDate: newStart.toISOString().split('T')[0],
            endDate: newEnd.toISOString().split('T')[0],
            rentAmount: c.rentAmount,
            dueDay: c.dueDay,
            adjustmentIndex: c.adjustmentIndex,
            lateFeeValue: c.lateFeeValue,
            interestValue: c.interestValue,
            notes: '',
          });
        }
        setLoading(false);
      });
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`http://localhost:3000/api/v1/leases/${params.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-account-id': 'account-teste-001' },
        body: JSON.stringify(renewalData),
      });

      if (res.ok) {
        router.push(`/contratos/${params.id}`);
      } else {
        const err = await res.json();
        setError(err.message ?? 'Erro ao renovar');
      }
    } catch {
      setError('Erro ao renovar contrato');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="text-center py-12 text-gray-500">Contrato não encontrado</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <button
        onClick={() => router.push(`/contratos/${params.id}`)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#FAEEDA] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#BA7517]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Renovar Contrato</h1>
          <p className="text-gray-500 text-sm">
            {contract.unit.property.name} — {contract.unit.code}
          </p>
        </div>
      </div>

      {/* Contract info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Inquilino:</span>
            <p className="font-medium">{contract.leaseTenants[0]?.tenant.fullName ?? 'N/A'}</p>
          </div>
          <div>
            <span className="text-gray-500">Aluguel atual:</span>
            <p className="font-medium">{formatCurrency(Number(contract.rentAmount))}/mês</p>
          </div>
          <div>
            <span className="text-gray-500">Vigência atual:</span>
            <p className="font-medium">{formatDate(contract.startDate)} → {formatDate(contract.endDate)}</p>
          </div>
          <div>
            <span className="text-gray-500">Vencimento:</span>
            <p className="font-medium">Dia {contract.dueDay} de cada mês</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h2 className="font-semibold text-gray-900">Dados do novo contrato</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data de início</label>
            <input
              type="date"
              value={renewalData.startDate}
              onChange={e => setRenewalData({ ...renewalData, startDate: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data de término</label>
            <input
              type="date"
              value={renewalData.endDate}
              onChange={e => setRenewalData({ ...renewalData, endDate: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Valor do aluguel (R$)</label>
            <input
              type="number"
              step="0.01"
              value={renewalData.rentAmount}
              onChange={e => setRenewalData({ ...renewalData, rentAmount: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Dia do vencimento</label>
            <input
              type="number"
              min="1"
              max="28"
              value={renewalData.dueDay}
              onChange={e => setRenewalData({ ...renewalData, dueDay: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Índice de reajuste</label>
            <select
              value={renewalData.adjustmentIndex}
              onChange={e => setRenewalData({ ...renewalData, adjustmentIndex: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="IGP_M">IGP-M</option>
              <option value="IPCA">IPCA</option>
              <option value="INPC">INPC</option>
              <option value="FIXED">Fixo (sem reajuste)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Multa (% ou R$)</label>
            <input
              type="number"
              step="0.01"
              value={renewalData.lateFeeValue}
              onChange={e => setRenewalData({ ...renewalData, lateFeeValue: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Juros (% ao mês)</label>
            <input
              type="number"
              step="0.01"
              value={renewalData.interestValue}
              onChange={e => setRenewalData({ ...renewalData, interestValue: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
          <input
            type="text"
            value={renewalData.notes}
            onChange={e => setRenewalData({ ...renewalData, notes: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            placeholder="Renovação automática — ajuste de X%"
          />
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={() => router.push(`/contratos/${params.id}`)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-[#3B6D11] hover:bg-[#27500A] text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Criando...' : 'Renovar contrato'}
          </button>
        </div>
      </form>
    </div>
  );
}