"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const expenseSchema = z.object({
  category: z.enum(['MAINTENANCE', 'CONDOMINIUM', 'IPTU', 'INSURANCE', 'ADMIN', 'WATER', 'ENERGY', 'OTHER']),
  description: z.string().min(1, 'Descrição é obrigatória'),
  supplierName: z.string().optional(),
  propertyId: z.string().min(1, 'Imóvel é obrigatório'),
  amount: z.string().min(1, 'Valor é obrigatório'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  referenceMonth: z.string().optional().refine(val => !val || /^\d{4}-\d{2}$/.test(val), {
    message: 'Formato inválido. Use AAAA-MM',
  }),
  isRecoverable: z.boolean(),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface Property {
  id: string;
  name: string;
}

export default function NovaDespesaPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      isRecoverable: false,
    }
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/v1/properties');
        if (res.ok) {
          setProperties(await res.json());
        }
      } catch (err) {
        console.error('Failed to load properties', err);
      }
    };
    fetchProperties();
  }, []);

  const onSubmit = async (data: ExpenseFormValues) => {
    setErrorMsg(null);
    try {
      const payload = {
        category: data.category,
        description: data.description,
        supplierName: data.supplierName || undefined,
        propertyId: data.propertyId,
        amount: parseFloat(data.amount),
        dueDate: new Date(data.dueDate).toISOString(),
        referenceMonth: data.referenceMonth || undefined,
        isRecoverable: data.isRecoverable,
        isPaid: false,
        notes: data.notes || undefined,
      };

      const res = await fetch('http://localhost:3000/api/v1/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': 'account-teste-001',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || 'Falha ao salvar a despesa.');
      }

      router.push('/despesas');
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Ocorreu um erro interno.');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/despesas" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-[#3B6D11] transition-colors"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar para Despesas
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nova Despesa</h1>
      </div>

      {errorMsg && (
        <div className="bg-[#FCEBEB] border border-[#E24B4A] text-[#791F1F] px-4 py-3 rounded-md mb-6">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
          
          {/* Seção 1 — Identificação */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">1. Identificação</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria <span className="text-[#E24B4A]">*</span>
                </label>
                <select 
                  {...register('category')} 
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="MAINTENANCE">Manutenção</option>
                  <option value="CONDOMINIUM">Condomínio</option>
                  <option value="IPTU">IPTU</option>
                  <option value="INSURANCE">Seguro</option>
                  <option value="ADMIN">Administrativo</option>
                  <option value="WATER">Água</option>
                  <option value="ENERGY">Energia</option>
                  <option value="OTHER">Outros</option>
                </select>
                {errors.category && <p className="text-[#E24B4A] text-xs mt-1">{errors.category.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição <span className="text-[#E24B4A]">*</span>
                </label>
                <input 
                  {...register('description')} 
                  type="text" 
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
                  placeholder="Ex: Conserto do encanamento"
                />
                {errors.description && <p className="text-[#E24B4A] text-xs mt-1">{errors.description.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fornecedor
                </label>
                <input 
                  {...register('supplierName')} 
                  type="text" 
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
                  placeholder="Nome do prestador de serviço ou empresa"
                />
              </div>
            </div>
          </section>

          {/* Seção 2 — Imóvel */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">2. Imóvel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imóvel <span className="text-[#E24B4A]">*</span>
                </label>
                <select 
                  {...register('propertyId')} 
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
                >
                  <option value="">Selecione um imóvel</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.propertyId && <p className="text-[#E24B4A] text-xs mt-1">{errors.propertyId.message}</p>}
              </div>
            </div>
          </section>

          {/* Seção 3 — Valores e Datas */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">3. Valores e Datas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor (R$) <span className="text-[#E24B4A]">*</span>
                </label>
                <input 
                  {...register('amount')} 
                  type="number" 
                  step="0.01"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
                />
                {errors.amount && <p className="text-[#E24B4A] text-xs mt-1">{errors.amount.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de vencimento <span className="text-[#E24B4A]">*</span>
                </label>
                <input 
                  {...register('dueDate')} 
                  type="date" 
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
                />
                {errors.dueDate && <p className="text-[#E24B4A] text-xs mt-1">{errors.dueDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mês de referência
                </label>
                <input 
                  {...register('referenceMonth')} 
                  type="month" 
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
                />
                {errors.referenceMonth && <p className="text-[#E24B4A] text-xs mt-1">{errors.referenceMonth.message}</p>}
              </div>

              <div className="md:col-span-2 flex items-center mt-2">
                <input 
                  {...register('isRecoverable')} 
                  id="isRecoverable"
                  type="checkbox" 
                  className="h-4 w-4 text-[#3B6D11] focus:ring-[#3B6D11] border-gray-300 rounded" 
                />
                <label htmlFor="isRecoverable" className="ml-2 block text-sm text-gray-700">
                  Despesa recuperável (repassável ao inquilino)
                </label>
              </div>
            </div>
          </section>

          {/* Seção 4 — Observações */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">4. Observações</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea 
                {...register('notes')} 
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
              />
            </div>
          </section>

          <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
            <Link 
              href="/despesas" 
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#3B6D11] hover:bg-[#27500A] text-white rounded-md text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
            >
              {isSubmitting ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Salvar despesa'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
