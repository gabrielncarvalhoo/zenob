"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

const maskCurrency = (value: string) => {
  const onlyNumbers = value.replace(/\D/g, "");
  if (!onlyNumbers) return "";
  const num = parseInt(onlyNumbers, 10) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
};

const currencyToNumber = (value: string) => {
  const onlyNumbers = value.replace(/\D/g, "");
  return onlyNumbers ? parseInt(onlyNumbers, 10) / 100 : 0;
};

const tenantSchema = z.object({
  fullName: z.string().min(1, "O nome completo é obrigatório"),
  cpf: z.string().min(14, "CPF inválido"),
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  employer: z.string().optional(),
  monthlyIncome: z.string().optional(),
  notes: z.string().optional(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

export default function NovoInquilinoPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      fullName: "",
      cpf: "",
      rg: "",
      birthDate: "",
      email: "",
      phone: "",
      employer: "",
      monthlyIncome: "",
      notes: "",
    },
  });

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("cpf", maskCPF(e.target.value), { shouldValidate: true });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("phone", maskPhone(e.target.value), { shouldValidate: true });
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("monthlyIncome", maskCurrency(e.target.value));
  };

  const onSubmit = async (data: TenantFormData) => {
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const payload = {
        ...data,
        monthlyIncome: data.monthlyIncome ? currencyToNumber(data.monthlyIncome) : undefined,
      };

      const response = await fetch("/api/v1/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar o inquilino. Tente novamente.");
      }

      router.push("/inquilinos");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro desconhecido.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Novo Inquilino</h1>
        <p className="text-gray-500 mt-2">Cadastre um novo inquilino preenchendo os dados abaixo.</p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-[#FCEBEB] border border-[#E24B4A] rounded-md text-[#E24B4A]">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">
          
          <section>
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Dados pessoais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo <span className="text-[#E24B4A]">*</span>
                </label>
                <input
                  {...register("fullName")}
                  className={`w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-[#3B6D11] ${errors.fullName ? "border-[#E24B4A]" : "border-gray-300"}`}
                  placeholder="Ex: João da Silva"
                />
                {errors.fullName && <p className="text-[#E24B4A] text-sm mt-1">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF <span className="text-[#E24B4A]">*</span>
                </label>
                <input
                  {...register("cpf")}
                  onChange={handleCPFChange}
                  className={`w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-[#3B6D11] ${errors.cpf ? "border-[#E24B4A]" : "border-gray-300"}`}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                {errors.cpf && <p className="text-[#E24B4A] text-sm mt-1">{errors.cpf.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                <input
                  {...register("rg")}
                  className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#3B6D11]"
                  placeholder="Ex: 1234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de nascimento</label>
                <input
                  type="date"
                  {...register("birthDate")}
                  className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#3B6D11]"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  {...register("email")}
                  className={`w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-[#3B6D11] ${errors.email ? "border-[#E24B4A]" : "border-gray-300"}`}
                  placeholder="exemplo@email.com"
                />
                {errors.email && <p className="text-[#E24B4A] text-sm mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  {...register("phone")}
                  onChange={handlePhoneChange}
                  className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#3B6D11]"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Financeiro</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empregador / Empresa</label>
                <input
                  {...register("employer")}
                  className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#3B6D11]"
                  placeholder="Onde o inquilino trabalha"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Renda mensal</label>
                <input
                  {...register("monthlyIncome")}
                  onChange={handleIncomeChange}
                  className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#3B6D11]"
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Observações</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                {...register("notes")}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#3B6D11] resize-none"
                placeholder="Insira detalhes adicionais aqui..."
              />
            </div>
          </section>

          <div className="flex pt-4 border-t border-gray-200 items-center justify-end space-x-4">
            <Link 
              href="/inquilinos"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-[#3B6D11] hover:bg-[#27500A]"
              }`}
            >
              {isSubmitting ? "Salvando..." : "Salvar inquilino"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
