"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw, XCircle, PlayCircle } from 'lucide-react';

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
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
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
      // Encerra o contrato atual
      const terminateRes = await fetch(`http://localhost:3000/api/v1/leases/${leaseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-account-id': 'account-teste-001' },
        body: JSON.stringify({ status: 'TERMINATED' }),
      });
      if (!terminateRes.ok) throw new Error('Falha ao encerrar contrato atual');

      // Cria novo contrato com os mesmos dados + nova vigência
      const payload = {
        unitId: leaseData.unitId,
        primaryTenantId: leaseData.primaryTenantId,
        startDate: newStartDate,
        endDate: newEndDate,
        rentAmount: Number(newRentAmount),
        dueDay: leaseData.dueDay,
        depositAmount: leaseData.depositAmount,
        adjustmentIndex: leaseData.adjustmentIndex,
        adjustmentFrequencyMonths: leaseData.adjustmentFrequencyMonths,
        guaranteeType: leaseData.guaranteeType,
        lateFeeType: leaseData.lateFeeType,
        lateFeeValue: leaseData.lateFeeValue,
        interestType: leaseData.interestType,
        interestValue: leaseData.interestValue,
        notes: leaseData.notes,
        status: 'ACTIVE',
      };

      const createRes = await fetch('http://localhost:3000/api/v1/leases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-account-id': 'account-teste-001' },
        body: JSON.stringify(payload),
      });
      if (!createRes.ok) {
        const data = await createRes.json().catch(() => null);
        throw new Error(data?.message || 'Falha ao criar contrato renovado');
      }
      const newLease = await createRes.json();
      router.push(`/contratos/${newLease.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro interno');
      setLoading(false);
    }
  };

  if (status !== 'ACTIVE' && status !== 'DRAFT') return null;

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
        <div className="flex flex-wrap gap-3">
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
            <button
              disabled={loading}
              onClick={() => setShowTerminateModal(true)}
              className="inline-flex items-center gap-2 bg-white border border-[#E24B4A] text-[#E24B4A] hover:bg-[#FCEBEB] px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-70"
            >
              <XCircle className="w-4 h-4" />
              Encerrar contrato
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
