"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const propertySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['HOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND', 'OTHER'], {
    required_error: 'Tipo é obrigatório',
  }),
  zipCode: z.string().min(8, 'CEP inválido'),
  address: z.string().min(1, 'Endereço é obrigatório'),
  neighborhood: z.string().optional(),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório').max(2),
  iptuCode: z.string().min(1, 'Inscrição IPTU é obrigatória'),
  waterRegistration: z.string().min(1, 'Matrícula de Água é obrigatória'),
  energyRegistration: z.string().min(1, 'Matrícula de Energia é obrigatória'),
  deedNumber: z.string().optional(),
  acquisitionDate: z.string().optional().transform(v => v === '' ? undefined : v),
  acquisitionCost: z.string().optional().transform(v => v === '' || v === undefined ? undefined : Number(v)),
  notes: z.string().optional(),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function NovoImovelPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      type: 'HOUSE',
      state: 'PB',
    }
  });

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setValue('address', data.logradouro);
          setValue('neighborhood', data.bairro);
          setValue('city', data.localidade);
          setValue('state', data.uf as any);
        }
      } catch (error) {
        console.error('Erro ao buscar CEP', error);
      }
    }
  };

  const onSubmit = async (data: PropertyFormValues) => {
    setErrorMsg(null);
    try {
      const res = await fetch('http://localhost:3000/api/v1/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || 'Falha ao salvar o imóvel.');
      }

      router.push('/imoveis');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro interno.');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/imoveis" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-[#3B6D11] transition-colors"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar para Imóveis
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Novo Imóvel</h1>
      </div>

      {errorMsg && (
        <div className="bg-[#FCEBEB] border border-[#E24B4A] text-[#791F1F] px-4 py-3 rounded-md mb-6">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          
          <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">Informações Básicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do imóvel <span className="text-[#E24B4A]">*</span>
              </label>
              <input 
                {...register('name')} 
                type="text" 
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
                placeholder="Ex: Edifício Aurora"
              />
              {errors.name && <p className="text-[#E24B4A] text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo <span className="text-[#E24B4A]">*</span>
              </label>
              <select 
                {...register('type')} 
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
              >
                <option value="HOUSE">Casa</option>
                <option value="APARTMENT">Apartamento</option>
                <option value="COMMERCIAL">Comercial</option>
                <option value="LAND">Terreno</option>
                <option value="OTHER">Outro</option>
              </select>
              {errors.type && <p className="text-[#E24B4A] text-xs mt-1">{errors.type.message}</p>}
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">Endereço</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP <span className="text-[#E24B4A]">*</span>
              </label>
              <input 
                {...register('zipCode')} 
                onBlur={handleCepBlur}
                type="text" 
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
                placeholder="00000-000"
              />
              {errors.zipCode && <p className="text-[#E24B4A] text-xs mt-1">{errors.zipCode.message}</p>}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço / Logradouro <span className="text-[#E24B4A]">*</span>
              </label>
              <input 
                {...register('address')} 
                type="text" 
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
                placeholder="Rua, Número, Complemento"
              />
              {errors.address && <p className="text-[#E24B4A] text-xs mt-1">{errors.address.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
              <input 
                {...register('neighborhood')} 
                type="text" 
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
              />
              {errors.neighborhood && <p className="text-[#E24B4A] text-xs mt-1">{errors.neighborhood.message}</p>}
            </div>

            <div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade <span className="text-[#E24B4A]">*</span>
                  </label>
                  <input 
                    {...register('city')} 
                    type="text" 
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
                  />
                  {errors.city && <p className="text-[#E24B4A] text-xs mt-1">{errors.city.message}</p>}
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado <span className="text-[#E24B4A]">*</span>
                  </label>
                  <select 
                    {...register('state')} 
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
                  >
                    {UF_OPTIONS.map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                  {errors.state && <p className="text-[#E24B4A] text-xs mt-1">{errors.state.message}</p>}
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">Registros e Matrículas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2">
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Inscrição imobiliária IPTU <span className="text-[#E24B4A]">*</span>
                </label>
                <a 
                  href="https://campinagrande.pb.gov.br/iptu/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[#3B6D11] hover:underline"
                >
                  Consultar IPTU ↗
                </a>
              </div>
              <input 
                {...register('iptuCode')} 
                type="text" 
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
              />
              {errors.iptuCode && <p className="text-[#E24B4A] text-xs mt-1">{errors.iptuCode.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matrícula de água / Cagepa <span className="text-[#E24B4A]">*</span>
              </label>
              <input 
                {...register('waterRegistration')} 
                type="text" 
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
              />
              {errors.waterRegistration && <p className="text-[#E24B4A] text-xs mt-1">{errors.waterRegistration.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Matrícula de energia / Energisa <span className="text-[#E24B4A]">*</span>
              </label>
              <input 
                {...register('energyRegistration')} 
                type="text" 
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
              />
              {errors.energyRegistration && <p className="text-[#E24B4A] text-xs mt-1">{errors.energyRegistration.message}</p>}
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">Informações Opcionais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número da escritura</label>
              <input 
                {...register('deedNumber')} 
                type="text" 
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de aquisição</label>
                <input 
                  {...register('acquisitionDate')} 
                  type="date" 
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custo (R$)</label>
                <input 
                  {...register('acquisitionCost')} 
                  type="number" 
                  step="0.01"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea 
                {...register('notes')} 
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]" 
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t border-gray-100 pt-6">
            <Link 
              href="/imoveis" 
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#3B6D11] hover:bg-[#27500A] text-white rounded-md text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
            >
              {isSubmitting ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Salvar imóvel'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
