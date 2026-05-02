"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const leaseSchema = z.object({
  propertyId: z.string().min(1, 'Imóvel é obrigatório'),
  unitId: z.string().min(1, 'Selecione uma unidade'),
  primaryTenantId: z.string().min(1, 'Inquilino é obrigatório'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().min(1, 'Data de término é obrigatória'),
  dueDay: z.coerce.number().min(1, 'Dia mínimo é 1').max(31, 'Dia máximo é 31'),
  rentAmount: z.coerce.number().min(0.01, 'Valor do aluguel é obrigatório'),
  depositAmount: z.coerce.number().optional(),
  adjustmentIndex: z.enum(['IGP_M', 'IPCA', 'INPC', 'FIXED']),
  adjustmentFrequencyMonths: z.coerce.number().min(1, 'Mínimo de 1 mês'),
  guaranteeType: z.enum(['DEPOSIT', 'SURETY', 'INSURANCE', 'NONE']),
  notes: z.string().optional(),
});

type LeaseFormValues = z.infer<typeof leaseSchema>;

interface Property {
  id: string;
  name: string;
  type: string;
}

interface Unit {
  id: string;
  identifier?: string;
  code?: string;
  occupied?: boolean;
}

interface Tenant {
  id: string;
  fullName: string;
}

export default function NovoContratoPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [allOccupied, setAllOccupied] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeaseFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(leaseSchema) as any,
    defaultValues: {
      adjustmentIndex: 'IGP_M',
      adjustmentFrequencyMonths: 12,
      guaranteeType: 'NONE',
    }
  });

  const selectedPropertyId = watch('propertyId');

  useEffect(() => {
    // Carrega properties+tenants+leases ACTIVE em paralelo, depois filtra imóveis
    // sem nenhuma unidade livre
    const fetchData = async () => {
      try {
        const headers = { 'x-account-id': 'account-teste-001' };
        const [propsRes, tenantsRes, leasesRes] = await Promise.all([
          fetch('http://localhost:3000/api/v1/properties', { headers }),
          fetch('http://localhost:3000/api/v1/tenants', { headers }),
          fetch('http://localhost:3000/api/v1/leases?status=ACTIVE', { headers }),
        ]);

        const allProps: Property[] = propsRes.ok ? await propsRes.json() : [];
        const tenantsList = tenantsRes.ok ? await tenantsRes.json() : [];
        const activeLeases: Array<{ unitId: string }> = leasesRes.ok ? await leasesRes.json() : [];
        const occupiedUnits = new Set(activeLeases.map((l) => l.unitId));

        // Para cada property, verifica se há ao menos uma unidade livre
        const propsComUnitsLivres = await Promise.all(
          allProps.map(async (p) => {
            try {
              const r = await fetch(`http://localhost:3000/api/v1/properties/${p.id}/units`, { headers });
              if (!r.ok) return { property: p, hasFree: false };
              const units: Array<{ id: string }> = await r.json();
              if (units.length === 0) return { property: p, hasFree: false };
              const hasFree = units.some((u) => !occupiedUnits.has(u.id));
              return { property: p, hasFree };
            } catch {
              return { property: p, hasFree: false };
            }
          }),
        );

        setProperties(propsComUnitsLivres.filter((x) => x.hasFree).map((x) => x.property));
        setTenants(tenantsList);
      } catch (err) {
        console.error('Failed to load initial data', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      const fetchUnits = async () => {
        try {
          const res = await fetch(`http://localhost:3000/api/v1/properties/${selectedPropertyId}/units`, {
            headers: { 'x-account-id': 'account-teste-001' },
          });
          if (!res.ok) return;
          const fetchedUnits: Unit[] = await res.json();

          // Para cada unidade verifica se há contrato ACTIVE
          const enriched = await Promise.all(
            fetchedUnits.map(async (u) => {
              try {
                const r = await fetch(
                  `http://localhost:3000/api/v1/leases?unitId=${u.id}&status=ACTIVE`,
                  { headers: { 'x-account-id': 'account-teste-001' } },
                );
                if (!r.ok) return { ...u, occupied: false };
                const leases = await r.json();
                return { ...u, occupied: Array.isArray(leases) && leases.length > 0 };
              } catch {
                return { ...u, occupied: false };
              }
            }),
          );

          // Mostra apenas unidades livres
          const livres = enriched.filter((u) => !u.occupied);
          setUnits(livres);

          const selectedProp = properties.find((p) => p.id === selectedPropertyId);
          if (selectedProp && selectedProp.type !== 'COMPLEX') {
            if (livres.length > 0) {
              setValue('unitId', livres[0].id, { shouldValidate: true, shouldDirty: true });
            } else {
              setValue('unitId', '');
            }
          } else {
            setValue('unitId', '');
          }
          // Banner de bloqueio para non-COMPLEX usa enriched
          setAllOccupied(
            enriched.length > 0 && enriched.every((u) => u.occupied),
          );
        } catch (err) {
          console.error('Failed to load units', err);
        }
      };
      fetchUnits();
    } else {
      setUnits([]);
      setValue('unitId', '');
    }
  }, [selectedPropertyId, properties, setValue]);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const showUnitSelect = selectedProperty && selectedProperty.type === 'COMPLEX';
  const nonComplexOccupied =
    selectedProperty && selectedProperty.type !== 'COMPLEX' && allOccupied;

  const onSubmit = async (data: LeaseFormValues) => {
    setErrorMsg(null);
    try {
      const payload = {
        unitId: data.unitId,
        primaryTenantId: data.primaryTenantId,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        dueDay: data.dueDay,
        rentAmount: data.rentAmount,
        depositAmount: data.depositAmount,
        adjustmentIndex: data.adjustmentIndex,
        adjustmentFrequencyMonths: data.adjustmentFrequencyMonths,
        guaranteeType: data.guaranteeType,
        status: 'ACTIVE',
        notes: data.notes || undefined,
      };

      const res = await fetch('http://localhost:3000/api/v1/leases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': 'account-teste-001',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || 'Falha ao salvar o contrato.');
      }

      router.push('/contratos');
      router.refresh();
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Ocorreu um erro interno.');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/contratos" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-[#3B6D11] transition-colors"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar para Contratos
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Novo Contrato</h1>
      </div>

      {errorMsg && (
        <div className="bg-[#FCEBEB] border border-[#E24B4A] text-[#791F1F] px-4 py-3 rounded-md mb-6">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
          
          {/* Seção 1 — Imóvel e Unidade */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#EAF3DE] text-[#3B6D11] text-sm font-bold">1</span>
              Imóvel e Unidade
            </h2>
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

              {showUnitSelect && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidade <span className="text-[#E24B4A]">*</span>
                  </label>
                  <select
                    value={watch('unitId') ?? ''}
                    onChange={(e) =>
                      setValue('unitId', e.target.value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
                  >
                    <option value="">Selecione uma unidade</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.identifier ?? u.code ?? u.id}
                      </option>
                    ))}
                  </select>
                  {errors.unitId && <p className="text-[#E24B4A] text-xs mt-1">{errors.unitId.message}</p>}
                </div>
              )}
              {/* Hidden input sempre registrado — fonte única do unitId no RHF */}
              <input type="hidden" {...register('unitId')} />
            </div>
            {nonComplexOccupied && (
              <p className="mt-3 text-sm text-[#791F1F] bg-[#FCEBEB] border border-[#E24B4A] rounded-md px-3 py-2">
                Este imóvel já possui um contrato ativo. Encerre o contrato atual antes de criar um novo.
              </p>
            )}
          </section>

          {/* Seção 2 — Inquilino */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#EAF3DE] text-[#3B6D11] text-sm font-bold">2</span>
              Inquilino
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inquilino principal <span className="text-[#E24B4A]">*</span>
                </label>
                <select 
                  {...register('primaryTenantId')} 
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
                >
                  <option value="">Selecione um inquilino</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
                {errors.primaryTenantId && <p className="text-[#E24B4A] text-xs mt-1">{errors.primaryTenantId.message}</p>}
              </div>
            </div>
          </section>

          {/* Seção 3 — Condições do contrato */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#EAF3DE] text-[#3B6D11] text-sm font-bold">3</span>
              Condições do contrato
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de início <span className="text-[#E24B4A]">*</span>
                </label>
                <input 
                  {...register('startDate')} 
                  type="date" 
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
                />
                {errors.startDate && <p className="text-[#E24B4A] text-xs mt-1">{errors.startDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de término <span className="text-[#E24B4A]">*</span>
                </label>
                <input 
                  {...register('endDate')} 
                  type="date" 
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
                />
                {errors.endDate && <p className="text-[#E24B4A] text-xs mt-1">{errors.endDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dia de vencimento <span className="text-[#E24B4A]">*</span>
                </label>
                <input 
                  {...register('dueDay', { valueAsNumber: true })} 
                  type="number" 
                  min="1" 
                  max="31"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
                />
                {errors.dueDay && <p className="text-[#E24B4A] text-xs mt-1">{errors.dueDay.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor do aluguel (R$) <span className="text-[#E24B4A]">*</span>
                </label>
                <input 
                  {...register('rentAmount')} 
                  type="number" 
                  step="0.01"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
                />
                {errors.rentAmount && <p className="text-[#E24B4A] text-xs mt-1">{errors.rentAmount.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depósito caução (R$)
                </label>
                <input 
                  {...register('depositAmount')} 
                  type="number" 
                  step="0.01"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
                />
              </div>
            </div>
          </section>

          {/* Seção 4 — Reajuste */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#EAF3DE] text-[#3B6D11] text-sm font-bold">4</span>
              Reajuste
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Índice de reajuste <span className="text-[#E24B4A]">*</span>
                </label>
                <select 
                  {...register('adjustmentIndex')} 
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
                >
                  <option value="IGP_M">IGP-M</option>
                  <option value="IPCA">IPCA</option>
                  <option value="INPC">INPC</option>
                  <option value="FIXED">Sem reajuste</option>
                </select>
                {errors.adjustmentIndex && <p className="text-[#E24B4A] text-xs mt-1">{errors.adjustmentIndex.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequência de reajuste (meses) <span className="text-[#E24B4A]">*</span>
                </label>
                <input 
                  {...register('adjustmentFrequencyMonths', { valueAsNumber: true })} 
                  type="number" 
                  min="1"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
                />
                {errors.adjustmentFrequencyMonths && <p className="text-[#E24B4A] text-xs mt-1">{errors.adjustmentFrequencyMonths.message}</p>}
              </div>
            </div>
          </section>

          {/* Seção 5 — Garantia */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#EAF3DE] text-[#3B6D11] text-sm font-bold">5</span>
              Garantia
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de garantia <span className="text-[#E24B4A]">*</span>
                </label>
                <select 
                  {...register('guaranteeType')} 
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
                >
                  <option value="NONE">Sem garantia</option>
                  <option value="DEPOSIT">Caução</option>
                  <option value="SURETY">Fiador</option>
                  <option value="INSURANCE">Seguro fiança</option>
                </select>
                {errors.guaranteeType && <p className="text-[#E24B4A] text-xs mt-1">{errors.guaranteeType.message}</p>}
              </div>
            </div>
          </section>

          {/* Seção 6 — Observações */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#EAF3DE] text-[#3B6D11] text-sm font-bold">6</span>
              Observações
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações gerais</label>
              <textarea 
                {...register('notes')} 
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
              />
            </div>
          </section>

          <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
            <Link 
              href="/contratos" 
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
              ) : 'Salvar contrato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
