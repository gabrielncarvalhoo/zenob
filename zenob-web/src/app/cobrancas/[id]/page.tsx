"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface PaymentResult {
  paymentId: string;
  valorPago: number;
  totalPago: number;
  saldoRestante: number;
  credito: number;
  status: string;
}

interface Receivable {
  id: string;
  competencyMonth: string;
  dueDate: string;
  originalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  penaltiesAmount: number;
  discountAmount: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'RENEGOTIATED' | 'WAIVED';
}

function getStatusBadge(status: Receivable['status']) {
  switch (status) {
    case 'PENDING':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#F3F4F6] text-[#6B7280]">Pendente</span>;
    case 'PAID':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EAF3DE] text-[#3B6D11]">Paga</span>;
    case 'PARTIAL':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#E6F1FB] text-[#0C447C]">Parcial</span>;
    case 'OVERDUE':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#FCEBEB] text-[#791F1F]">Vencida</span>;
    case 'RENEGOTIATED':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#EEEDFE] text-[#26215C]">Renegociada</span>;
    case 'WAIVED':
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#F3F4F6] text-[#6B7280]">Dispensada</span>;
    default:
      return null;
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
}

function formatDate(dateString: string) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return dateString;
  }
}

function formatCompetency(competency: string) {
  if (!competency) return '-';
  const [year, month] = competency.split('-');
  if (!year || !month) return competency;
  
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthName = months[parseInt(month, 10) - 1];
  
  return `${monthName}/${year}`;
}

export default function DetalheCobrancaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [receivable, setReceivable] = useState<Receivable | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('PIX');
  const [paymentDate, setPaymentDate] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReceivable = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/v1/receivables/${params.id}`);
      if (!res.ok) {
        setReceivable(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setReceivable(data);
      setAmount(data.balanceAmount.toString());
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchReceivable();
  }, [fetchReceivable]);

  const handleOpenModal = () => {
    if (receivable) {
      setAmount(receivable.balanceAmount.toString());
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setMethod('PIX');
      setPaymentResult(null);
      setErrorMsg(null);
      setIsModalOpen(true);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        amount: parseFloat(amount),
        method,
        paymentDate: new Date(paymentDate).toISOString(),
      };

      const res = await fetch(`http://localhost:3000/api/v1/receivables/${params.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    router.refresh();
    fetchReceivable(); // Also refetch locally to ensure state updates immediately
  };

  if (loading) {
    return <div className="container mx-auto py-8 px-4 text-center">Carregando...</div>;
  }

  if (!receivable) {
    return <div className="container mx-auto py-8 px-4 text-center">Cobrança não encontrada.</div>;
  }

  const isBalanceGreaterThanZero = receivable.balanceAmount > 0;
  const showPaymentButton = receivable.status !== 'PAID' && receivable.status !== 'WAIVED';

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl relative">
      <div className="mb-6">
        <Link 
          href="/cobrancas" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-[#3B6D11] transition-colors"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Detalhes da Cobrança</h1>
          {getStatusBadge(receivable.status)}
        </div>
        
        {showPaymentButton && (
          <button 
            onClick={handleOpenModal}
            className="bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Registrar pagamento
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Competência</span>
              <span className="text-base text-gray-900 font-medium">
                {formatCompetency(receivable.competencyMonth)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Vencimento</span>
              <span className="text-base text-gray-900 font-medium">
                {formatDate(receivable.dueDate)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Valor original</span>
              <span className="text-base text-gray-900 font-medium">
                {formatCurrency(receivable.originalAmount)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Multas / Acréscimos</span>
              <span className="text-base text-gray-900 font-medium">
                {formatCurrency(receivable.penaltiesAmount)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Desconto</span>
              <span className="text-base text-gray-900 font-medium">
                {formatCurrency(receivable.discountAmount)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500 block mb-1">Valor pago</span>
              <span className="text-base text-[#3B6D11] font-medium">
                {formatCurrency(receivable.paidAmount)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm lg:col-span-3 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Saldo devedor</span>
                <span className={`text-xl font-bold ${isBalanceGreaterThanZero ? 'text-[#791F1F]' : 'text-gray-900'}`}>
                  {formatCurrency(receivable.balanceAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Registrar Pagamento</h2>
              {!paymentResult && (
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              )}
            </div>

            <div className="p-6">
              {paymentResult ? (
                <div className="text-center py-6 space-y-4">
                  {paymentResult.status === 'PAID' && (
                    <div className="bg-[#EAF3DE] text-[#3B6D11] p-4 rounded-lg font-bold text-lg">
                      Cobrança quitada!
                    </div>
                  )}
                  {paymentResult.saldoRestante > 0 && (
                    <div className="bg-[#FAEEDA] text-[#633806] p-4 rounded-lg font-bold text-lg">
                      Pagamento parcial — {formatCurrency(paymentResult.saldoRestante)} ainda pendente
                    </div>
                  )}
                  {paymentResult.credito > 0 && (
                    <div className="bg-[#E6F1FB] text-[#0C447C] p-4 rounded-lg font-bold text-lg">
                      Pagamento a maior — {formatCurrency(paymentResult.credito)} de crédito
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    {paymentResult.paymentId && (
                      <a
                        href={`http://localhost:3000/api/v1/receivables/${paymentResult.paymentId}/receipt/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-[#3B6D11] hover:bg-[#27500A] text-white py-2.5 rounded-md font-medium transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Baixar recibo em PDF
                      </a>
                    )}
                    <button
                      onClick={handleCloseModal}
                      className="bg-gray-900 hover:bg-gray-800 text-white py-2 rounded-md font-medium transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Forma de pagamento <span className="text-[#E24B4A]">*</span>
                    </label>
                    <select 
                      required
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
                    >
                      <option value="PIX">PIX</option>
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="TRANSFERENCIA">Transferência</option>
                      <option value="BOLETO">Boleto</option>
                      <option value="CARTAO">Cartão</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data do pagamento <span className="text-[#E24B4A]">*</span>
                    </label>
                    <input 
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
                    />
                  </div>

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
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
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
