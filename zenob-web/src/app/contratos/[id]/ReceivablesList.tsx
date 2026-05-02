"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, CheckCircle2, AlertTriangle, Coins, X, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";

interface Receivable {
  id: string;
  dueDate: string;
  originalAmount: string | number;
  paidAmount: string | number;
  balanceAmount: string | number;
  status: "PENDING" | "PAID" | "PARTIAL" | "OVERDUE" | "RENEGOTIATED" | "WAIVED";
  paidAt: string | null;
}

interface PaymentResult {
  valorPago: number;
  totalPago: number;
  saldoRestante: number;
  credito: number;
  status: string;
}

interface ReceivablesListProps {
  leaseId: string;
}

function getStatusBadge(status: Receivable["status"]) {
  switch (status) {
    case "PENDING":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">Pendente</span>;
    case "PAID":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAF3DE] text-[#3B6D11]">Pago</span>;
    case "PARTIAL":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FAEEDA] text-[#BA7517]">Parcial</span>;
    case "OVERDUE":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FCEBEB] text-[#E24B4A]">Atrasado</span>;
    case "RENEGOTIATED":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E6F1FB] text-[#378ADD]">Renegociado</span>;
    case "WAIVED":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#9CA3AF]">Isento</span>;
    default:
      return null;
  }
}

function formatMonthYear(dateString: string) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    const month = date.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" });
    const year = date.getFullYear();
    // Capitalize first letter of month
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  } catch {
    return dateString;
  }
}

function formatCurrency(amount: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(amount));
}

function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  } catch {
    return dateString;
  }
}

// Chave AAAA-MM derivada do dueDate (UTC)
function monthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Aplica regras de exibição combinadas:
// 1. Há OVERDUE → todos atrasados + mês atual (se existir)
// 2. Mês atual PAID → avança até primeiro mês não-pago
// 3. Sempre tenta retornar pelo menos 1 mês em aberto
// Resultado ordenado por dueDate DESC.
export function selectReceivablesToShow(data: Receivable[]): Receivable[] {
  if (data.length === 0) return [];

  const now = new Date();
  const currentKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const overdues = data.filter((r) => r.status === "OVERDUE");

  let result: Receivable[] = [];

  if (overdues.length > 0) {
    // Regra 1: todos os atrasados + mês atual (qualquer status que não seja OVERDUE já listado)
    result = [...overdues];
    const currentMonthRec = data.find(
      (r) => monthKey(r.dueDate) === currentKey && r.status !== "OVERDUE",
    );
    if (currentMonthRec) result.push(currentMonthRec);
  } else {
    // Regras 2-4: encontra o primeiro mês ≥ atual que NÃO está fechado
    const sortedAsc = [...data].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
    const fechado = (s: Receivable["status"]) =>
      s === "PAID" || s === "WAIVED" || s === "RENEGOTIATED";

    const firstOpenFromNow = sortedAsc.find(
      (r) => monthKey(r.dueDate) >= currentKey && !fechado(r.status),
    );

    if (firstOpenFromNow) {
      result = [firstOpenFromNow];
    } else {
      // Regra 5: tudo pago. Mostra o último PAID como referência (UI vazia se não houver)
      const lastPaid = [...data]
        .filter((r) => r.status === "PAID")
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())[0];
      if (lastPaid) result = [lastPaid];
    }
  }

  result.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  return result;
}

export function ReceivablesList({ leaseId }: ReceivablesListProps) {
  const router = useRouter();
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReceivables = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/v1/receivables?leaseId=${leaseId}`, {
        headers: {
          "x-account-id": "account-teste-001"
        }
      });

      if (!res.ok) {
        throw new Error("Falha ao buscar cobranças");
      }

      const data: Receivable[] = await res.json();
      setReceivables(selectReceivablesToShow(data));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [leaseId]);

  useEffect(() => {
    fetchReceivables();
  }, [fetchReceivables]);

  const handleOpenModal = (receivable: Receivable) => {
    setSelectedReceivable(receivable);
    const saldo = Number(receivable.balanceAmount);
    const fallback = Number(receivable.originalAmount) - Number(receivable.paidAmount);
    const inicial = isNaN(saldo) || saldo <= 0 ? fallback : saldo;
    setAmount(inicial.toFixed(2));
    setPaymentResult(null);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceivable) return;
    
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        amount: parseFloat(amount),
      };

      const res = await fetch(`http://localhost:3000/api/v1/receivables/${selectedReceivable.id}/payments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-account-id': 'account-teste-001'
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || 'Falha ao registrar pagamento.');
      }

      const data = await res.json();
      setPaymentResult(data.resumo);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Ocorreu um erro interno.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReceivable(null);
    router.refresh();
    fetchReceivables();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
      <div className="p-8 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Cobranças Próximas {!loading && `(${receivables.length})`}
        </h2>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed min-w-[820px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-8 py-4 w-[16%] truncate">Competência</th>
              <th className="px-4 py-4 w-[12%] truncate">Vencimento</th>
              <th className="px-4 py-4 w-[12%] truncate">Valor</th>
              <th className="px-4 py-4 w-[12%] truncate">Pago</th>
              <th className="px-4 py-4 w-[12%] truncate">Pago em</th>
              <th className="px-4 py-4 w-[12%] truncate">Saldo</th>
              <th className="px-4 py-4 w-[12%] truncate">Status</th>
              <th className="px-8 py-4 w-[14%] text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#3B6D11]" />
                  </div>
                </td>
              </tr>
            ) : receivables.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="py-12 text-center text-gray-500 text-sm">
                    Nenhuma cobrança encontrada
                  </div>
                </td>
              </tr>
            ) : (
              receivables.map((receivable) => (
                <tr key={receivable.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatMonthYear(receivable.dueDate)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(receivable.dueDate)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(receivable.originalAmount)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-[#3B6D11] font-medium">
                    {formatCurrency(receivable.paidAmount)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(receivable.paidAt)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {formatCurrency(receivable.balanceAmount)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(receivable.status)}
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-right">
                    {['PENDING', 'PARTIAL', 'OVERDUE'].includes(receivable.status) && (
                      <button
                        onClick={() => handleOpenModal(receivable)}
                        className="inline-flex items-center gap-1 text-[#3B6D11] hover:text-[#27500A] text-sm font-medium transition-colors"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Pagar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedReceivable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Registrar Pagamento</h2>
              {!paymentResult && (
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            <div className="p-6">
              {paymentResult ? (
                <div className="py-2 space-y-3">
                  {paymentResult.status === 'PAID' && (
                    <div className="bg-[#EAF3DE] text-[#3B6D11] p-4 rounded-lg flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                      <div className="font-semibold">Cobrança quitada!</div>
                    </div>
                  )}
                  {paymentResult.saldoRestante > 0 && (
                    <div className="bg-[#FAEEDA] text-[#633806] p-4 rounded-lg flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 flex-shrink-0 text-[#BA7517]" />
                      <div>
                        <div className="font-semibold">Pagamento parcial</div>
                        <div className="text-sm">{formatCurrency(paymentResult.saldoRestante)} ainda pendente</div>
                      </div>
                    </div>
                  )}
                  {paymentResult.credito > 0 && (
                    <div className="bg-[#E6F1FB] text-[#0C447C] p-4 rounded-lg flex items-center gap-3">
                      <Coins className="w-6 h-6 flex-shrink-0" />
                      <div>
                        <div className="font-semibold">Crédito gerado</div>
                        <div className="text-sm">{formatCurrency(paymentResult.credito)} aplicado em meses futuros</div>
                      </div>
                    </div>
                  )}
                  <button 
                    onClick={handleCloseModal}
                    className="mt-6 w-full bg-gray-900 hover:bg-gray-800 text-white py-2 rounded-md font-medium transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  {errorMsg && (
                    <div className="bg-[#FCEBEB] border border-[#E24B4A] text-[#791F1F] px-4 py-3 rounded-md text-sm">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor pago (R$) <span className="text-[#E24B4A]">*</span>
                    </label>
                    <input 
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
                    />
                  </div>

                  {/* Fields method and paymentDate removed since payload only accepts amount */}

                  <div className="pt-4 flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-[#3B6D11] hover:bg-[#27500A] text-white rounded-md text-sm font-medium transition-colors disabled:opacity-70 flex items-center justify-center min-w-[120px]"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin h-5 w-5 text-white" />
                      ) : 'Confirmar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
