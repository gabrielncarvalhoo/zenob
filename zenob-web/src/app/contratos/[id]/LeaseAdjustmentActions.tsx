"use client";

import { useState } from 'react';
import { AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LeaseAdjustmentActionsProps {
  leaseId: string;
  daysToAdjustment: number;
}

export function LeaseAdjustmentActions({ leaseId, daysToAdjustment }: LeaseAdjustmentActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);

  const handleTerminate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/leases/${leaseId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': 'account-teste-001',
        },
        body: JSON.stringify({ status: 'TERMINATED' }),
      });
      if (!res.ok) throw new Error('Falha ao encerrar contrato');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao encerrar o contrato.');
    } finally {
      setLoading(false);
      setShowTerminateConfirm(false);
    }
  };

  if (dismissed) return null;

  return (
    <div className="bg-[#FFFDF4] border border-[#BA7517] rounded-xl shadow-sm overflow-hidden mb-8 p-6">
      <div className="flex items-start gap-4 mb-6">
        <AlertTriangle className="w-8 h-8 text-[#BA7517] shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-bold text-[#633806] mb-1">
            Atenção: Reajuste Previsto
          </h2>
          <p className="text-[#8B5614] font-medium text-sm">
            Faltam {daysToAdjustment} dia{daysToAdjustment !== 1 ? 's' : ''} para o reajuste deste contrato.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          disabled={loading}
          onClick={() => setDismissed(true)}
          className="bg-[#BA7517] hover:bg-[#A36614] text-white px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-70 flex items-center gap-2 min-w-[150px] justify-center"
        >
          <CheckCircle2 className="w-4 h-4" />
          Já registrei o reajuste
        </button>

        <button
          disabled={loading}
          onClick={() => setDismissed(true)}
          className="bg-white border border-[#BA7517] text-[#BA7517] hover:bg-[#FFFDF4] px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-70 min-w-[150px]"
        >
          Manter valor atual
        </button>

        <button
          disabled={loading}
          onClick={() => setShowTerminateConfirm(true)}
          className="bg-white border border-[#E24B4A] text-[#E24B4A] hover:bg-[#FCEBEB] px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-70 min-w-[150px]"
        >
          Encerrar contrato
        </button>
      </div>

      {showTerminateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Encerrar contrato?</h3>
            <p className="text-gray-600 mb-6 text-sm">
              O contrato será marcado como encerrado e não poderá ser reaberto. Cobranças pendentes permanecem no sistema.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTerminateConfirm(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleTerminate}
                disabled={loading}
                className="px-4 py-2 bg-[#E24B4A] hover:bg-[#C93A39] text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center min-w-[120px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Encerrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
