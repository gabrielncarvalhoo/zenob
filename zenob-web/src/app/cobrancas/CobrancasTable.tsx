"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle, Coins, X, DollarSign } from "lucide-react";

interface Receivable {
  id: string;
  competencyMonth: string;
  dueDate: string;
  originalAmount: string | number;
  paidAmount: string | number;
  balanceAmount: string | number;
  status: "PENDING" | "PAID" | "PARTIAL" | "OVERDUE" | "RENEGOTIATED" | "WAIVED";
  paidAt: string | null;
  leaseContractId?: string;
}

interface Lease {
  id: string;
  unit?: { property?: { id: string; name: string } };
}

interface PaymentResumo {
  valorPago: number;
  totalPago: number;
  saldoRestante: number;
  credito: number;
  status: string;
}

interface Props {
  receivables: Receivable[];
  leasesMap: Record<string, Lease>;
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
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EEEDFE] text-[#26215C]">Renegociada</span>;
    case "WAIVED":
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">Dispensada</span>;
    default:
      return null;
  }
}

function formatCurrency(amount: string | number) {
  const n = Number(amount);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(isNaN(n) ? 0 : n);
}

function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  } catch {
    return dateString;
  }
}

function formatCompetency(competency: string) {
  if (!competency) return "-";
  const [year, month] = competency.split("-");
  if (!year || !month) return competency;
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${months[parseInt(month, 10) - 1]}/${year}`;
}

export function CobrancasTable({ receivables, leasesMap }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<Receivable | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resumo, setResumo] = useState<PaymentResumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const openModal = (r: Receivable) => {
    setTarget(r);
    const saldo = Number(r.balanceAmount);
    const fallback = Number(r.originalAmount) - Number(r.paidAmount);
    const valorInicial = isNaN(saldo) || saldo <= 0 ? fallback : saldo;
    setAmount(valorInicial.toFixed(2));
    setResumo(null);
    setErro(null);
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setSubmitting(true);
    setErro(null);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/receivables/${target.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-account-id": "account-teste-001" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.message || "Falha ao registrar pagamento");
      }
      const data = await res.json();
      setResumo(data.resumo);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro interno");
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setOpen(false);
    setTarget(null);
    router.refresh();
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full table-fixed text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-3 py-4 w-[8%]">Status</th>
              <th className="px-3 py-4 w-[16%]">Imóvel</th>
              <th className="px-3 py-4 w-[10%]">Competência</th>
              <th className="px-3 py-4 w-[10%]">Vencimento</th>
              <th className="px-3 py-4 w-[11%] text-right">Valor original</th>
              <th className="px-3 py-4 w-[10%] text-right">Valor pago</th>
              <th className="px-3 py-4 w-[10%]">Pago em</th>
              <th className="px-3 py-4 w-[11%] text-right">Saldo</th>
              <th className="px-3 py-4 w-[10%] text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {receivables.map((r) => {
              const lease = r.leaseContractId ? leasesMap[r.leaseContractId] : null;
              const property = lease?.unit?.property;
              const podePagar = ["PENDING", "PARTIAL", "OVERDUE"].includes(r.status);

              return (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-4 whitespace-nowrap">{getStatusBadge(r.status)}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium truncate">
                    {property ? (
                      <Link href={`/imoveis/${property.id}`} className="text-gray-900 hover:text-[#3B6D11] hover:underline">
                        {property.name}
                      </Link>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCompetency(r.competencyMonth)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(r.dueDate)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                    {formatCurrency(r.originalAmount)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-[#3B6D11] text-right">
                    {Number(r.paidAmount) > 0 ? formatCurrency(r.paidAmount) : "-"}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {r.paidAt ? formatDate(r.paidAt) : "-"}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                    {formatCurrency(r.balanceAmount)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-right">
                    {podePagar && (
                      <button
                        onClick={() => openModal(r)}
                        className="inline-flex items-center gap-1 text-[#3B6D11] hover:text-[#27500A] text-sm font-medium"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Pagar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {open && target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Registrar Pagamento</h2>
              {!resumo && (
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
            <div className="p-6">
              {resumo ? (
                <div className="py-2 space-y-3">
                  {resumo.status === "PAID" && (
                    <div className="bg-[#EAF3DE] text-[#3B6D11] p-4 rounded-lg flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                      <div className="font-semibold">Cobrança quitada!</div>
                    </div>
                  )}
                  {resumo.saldoRestante > 0 && (
                    <div className="bg-[#FAEEDA] text-[#633806] p-4 rounded-lg flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 flex-shrink-0 text-[#BA7517]" />
                      <div>
                        <div className="font-semibold">Pagamento parcial</div>
                        <div className="text-sm">{formatCurrency(resumo.saldoRestante)} ainda pendente</div>
                      </div>
                    </div>
                  )}
                  {resumo.credito > 0 && (
                    <div className="bg-[#E6F1FB] text-[#0C447C] p-4 rounded-lg flex items-center gap-3">
                      <Coins className="w-6 h-6 flex-shrink-0" />
                      <div>
                        <div className="font-semibold">Crédito gerado</div>
                        <div className="text-sm">{formatCurrency(resumo.credito)} aplicado em meses futuros</div>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={close}
                    className="mt-6 w-full bg-gray-900 hover:bg-gray-800 text-white py-2 rounded-md font-medium"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  {erro && (
                    <div className="bg-[#FCEBEB] border border-[#E24B4A] text-[#791F1F] px-4 py-3 rounded-md text-sm">
                      {erro}
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
                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-[#3B6D11] hover:bg-[#27500A] text-white rounded-md text-sm font-medium disabled:opacity-70 flex items-center justify-center min-w-[120px]"
                    >
                      {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Confirmar"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
