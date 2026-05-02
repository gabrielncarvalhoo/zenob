"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw, XCircle, PlayCircle, Trash2, Edit3 } from 'lucide-react';

interface LeaseData {
  unitId: string;
  primaryTenantId: string;
  endDate: string;
  rentAmount: number | string;
  dueDay: number;
  depositAmount: number | string | null;
  adjustmentIndex: string;
  adjustmentFrequencyMonths: number;
  guaranteeType: string;
  lateFeeType: string;
  lateFeeValue: number | string;
  interestType: string;
  interestValue: number | string;
  notes: string | null;
}

interface ContractActionsProps {
  leaseId: string;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'CANCELLED';
  daysUntilEnd: number;
  leaseData: LeaseData;
}

function toISODate(date: Date) {
  return date.toISOString().split('T')[0];
}

export function ContractActions({ leaseId, status, daysUntilEnd, leaseData }: ContractActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [newRentAmountInput, setNewRentAmountInput] = useState(String(leaseData.rentAmount));

  // O novo contrato começa no dia seguinte ao término atual
  const newStartDate = toISODate(new Date(new Date(leaseData.endDate).getTime() + 86_400_000));
  const minEndDate = toISODate(new Date(new Date(leaseData.endDate).getTime() + 2 * 86_400_000));

  // Padrão: renova pelo mesmo período
  const currentDuration = new Date(leaseData.endDate).getTime() - new Date(newStartDate).getTime();
  const defaultEnd = toISODate(new Date(new Date(newStartDate).getTime() + currentDuration + 365 * 86_400_000));

  const [newEndDate, setNewEndDate] = useState(defaultEnd);
  const [newRentAmount, setNewRentAmount] = useState(String(leaseData.rentAmount));

  const patchStatus = async (newStatus: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/leases/${leaseId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': 'account-teste-001',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Falha ao atualizar contrato');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro interno');
    } finally {
      setLoading(false);
      setShowTerminateModal(false);
      setShowActivateModal(false);
    }
  };

  const handleRenew = async () => {
    if (!newEndDate) return;
    setLoading(true);
    setError(null);
    try {
      // Endpoint /renew encerra atual (EXPIRED), copia tenants, gera receivables, agenda lembretes
      const res = await fetch(`http://localhost:3000/api/v1/leases/${leaseId}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': 'account-teste-001',
        },
        body: JSON.stringify({
          startDate: newStartDate,
          endDate: newEndDate,
          rentAmount: String(newRentAmount),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Falha ao renovar contrato');
      }
      const newLease = await res.json();
      router.push(`/contratos/${newLease.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro interno');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/leases/${leaseId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': 'account-teste-001',
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Falha ao excluir contrato');
      }
      router.push('/contratos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro interno');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleRentAdjustment = async () => {
    const amount = Number(newRentAmountInput);
    if (isNaN(amount) || amount <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/leases/${leaseId}/rent-amount`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': 'account-teste-001',
        },
        body: JSON.stringify({ rentAmount: amount }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Falha ao ajustar valor');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro interno');
    } finally {
      setLoading(false);
      setShowRentModal(false);
    }
  };

  if (status !== 'ACTIVE' && status !== 'DRAFT' && status !== 'TERMINATED' && status !== 'CANCELLED') return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Ações do contrato</h2>
      </div>
      <div className="p-6">
        {error && (
          <div className="bg-[#FCEBEB] border border-[#E24B4A] text-[#791F1F] px-4 py-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}
        <div className="flex flex-wrap gap-3 items-center">
          {status === 'DRAFT' && (
            <button
              disabled={loading}
              onClick={() => setShowActivateModal(true)}
              className="inline-flex items-center gap-2 bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-70"
            >
              <PlayCircle className="w-4 h-4" />
              Ativar contrato
            </button>
          )}
          {status === 'ACTIVE' && daysUntilEnd <= 60 && (
            <button
              disabled={loading}
              onClick={() => setShowRenewModal(true)}
              className="inline-flex items-center gap-2 bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-70"
            >
              <RefreshCw className="w-4 h-4" />
              Renovar contrato
            </button>
          )}
          {status === 'ACTIVE' && (
            <>
              <button
                disabled={loading}
                onClick={() => { setNewRentAmountInput(String(leaseData.rentAmount)); setShowRentModal(true); }}
                className="inline-flex items-center gap-2 bg-[#378ADD] hover:bg-[#2A6DB8] text-white px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-70"
              >
                <Edit3 className="w-4 h-4" />
                Ajustar aluguel
              </button>
              <button
                disabled={loading}
                onClick={() => setShowTerminateModal(true)}
                className="inline-flex items-center gap-2 bg-white border border-[#E24B4A] text-[#E24B4A] hover:bg-[#FCEBEB] px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-70"
              >
                <XCircle className="w-4 h-4" />
                Encerrar contrato
              </button>
            </>
          )}
          {(status === 'DRAFT' || status === 'CANCELLED' || status === 'TERMINATED') && (
            <button
              disabled={loading}
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 bg-white border border-[#E24B4A] text-[#E24B4A] hover:bg-[#FCEBEB] px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-70"
            >
              <Trash2 className="w-4 h-4" />
              Excluir contrato
            </button>
          )}
        </div>
      </div>

      {/* Modal: Encerrar */}
      {showTerminateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Encerrar contrato?</h3>
            <p className="text-gray-600 mb-6 text-sm">
              O contrato será encerrado imediatamente. Cobranças pendentes permanecem no sistema.
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTerminateModal(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => patchStatus('TERMINATED')}
                disabled={loading}
                className="px-4 py-2 bg-[#E24B4A] hover:bg-[#C93A39] text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center min-w-[100px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Encerrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Excluir */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir contrato?</h3>
            <p className="text-gray-600 mb-6 text-sm">
              O contrato será cancelado. Esta ação não pode ser desfeita. Cobranças existentes permanecem no sistema.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-[#E24B4A] hover:bg-[#C93A39] text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center min-w-[100px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ajustar Aluguel */}
      {showRentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ajustar valor do aluguel</h3>
            <p className="text-gray-600 mb-6 text-sm">
              O novo valor será atualizado imediatamente no contrato. Cobranças futuras usarão este valor.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Novo valor do aluguel (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={newRentAmountInput}
                onChange={(e) => setNewRentAmountInput(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRentModal(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRentAdjustment}
                disabled={loading || Number(newRentAmountInput) <= 0}
                className="px-4 py-2 bg-[#378ADD] hover:bg-[#2A6DB8] text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center min-w-[100px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ativar */}
      {showActivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ativar contrato?</h3>
            <p className="text-gray-600 mb-6 text-sm">
              O contrato será ativado e as cobranças mensais serão geradas automaticamente.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowActivateModal(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => patchStatus('ACTIVE')}
                disabled={loading}
                className="px-4 py-2 bg-[#3B6D11] hover:bg-[#27500A] text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center min-w-[100px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ativar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Renovar */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Renovar contrato</h3>
              <p className="text-sm text-gray-500 mt-1">
                Um novo contrato será criado com os mesmos dados. O contrato atual será encerrado.
              </p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Início da renovação
                </label>
                <input
                  type="text"
                  readOnly
                  value={new Date(newStartDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Dia seguinte ao término atual</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Novo término <span className="text-[#E24B4A]">*</span>
                </label>
                <input
                  type="date"
                  min={minEndDate}
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Novo valor do aluguel (R$) <span className="text-[#E24B4A]">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newRentAmount}
                  onChange={(e) => setNewRentAmount(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
                />
              </div>
            </div>

            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                onClick={() => setShowRenewModal(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRenew}
                disabled={loading || !newEndDate || Number(newRentAmount) <= 0}
                className="px-4 py-2 bg-[#3B6D11] hover:bg-[#27500A] text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center min-w-[140px] disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar renovação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
