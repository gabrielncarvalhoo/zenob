"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

interface Property { id: string; name: string; address: string }
interface Unit { id: string; identifier: string }
interface Tenant { id: string; fullName: string }

interface FormData {
  propertyId: string;
  unitId: string;
  tenantId: string;
  title: string;
  description: string;
  priority: string;
  estimatedCost: string;
  supplierName: string;
  notes: string;
}

export default function NovoChamadoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [form, setForm] = useState<FormData>({
    propertyId: '',
    unitId: '',
    tenantId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    estimatedCost: '',
    supplierName: '',
    notes: '',
  });

  useEffect(() => {
    fetch('http://localhost:3000/api/v1/properties')
      .then(r => r.json())
      .then(data => setProperties(Array.isArray(data) ? data : []))
      .catch(() => setProperties([]));
    fetch('http://localhost:3000/api/v1/tenants')
      .then(r => r.json())
      .then(data => setTenants(Array.isArray(data) ? data : []))
      .catch(() => setTenants([]));
  }, []);

  useEffect(() => {
    if (!form.propertyId) { setUnits([]); return; }
    fetch(`http://localhost:3000/api/v1/properties/${form.propertyId}/units`)
      .then(r => r.json())
      .then(data => setUnits(Array.isArray(data) ? data : []))
      .catch(() => setUnits([]));
  }, [form.propertyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.propertyId) {
      setError('Título e imóvel são obrigatórios');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        propertyId: form.propertyId,
        unitId: form.unitId || null,
        tenantId: form.tenantId || null,
        title: form.title.trim(),
        description: form.description || null,
        priority: form.priority,
        estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : null,
        supplierName: form.supplierName || null,
        notes: form.notes || null,
      };

      const res = await fetch('http://localhost:3000/api/v1/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Falha ao criar chamado');
      }

      const ticket = await res.json();
      router.push(`/manutencao/${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro interno');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-6">
        <Link href="/manutencao" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-[#3B6D11] transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Novo Chamado</h1>
          <p className="text-gray-500 text-sm mt-1">Registre um problema de manutenção no imóvel</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-[#FCEBEB] border border-[#E24B4A] text-[#791F1F] px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título <span className="text-[#E24B4A]">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Torneira pingando no banheiro"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
            />
          </div>

          {/* Imóvel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imóvel <span className="text-[#E24B4A]">*</span>
            </label>
            <select
              required
              value={form.propertyId}
              onChange={e => setForm(f => ({ ...f, propertyId: e.target.value, unitId: '' }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
            >
              <option value="">Selecione o imóvel</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.address}</option>
              ))}
            </select>
          </div>

          {/* Unidade */}
          {units.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <select
                value={form.unitId}
                onChange={e => setForm(f => ({ ...f, unitId: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
              >
                <option value="">Não aplicável</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{u.identifier}</option>
                ))}
              </select>
            </div>
          )}

          {/* Inquilino */}
          {tenants.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inquilino responsável</label>
              <select
                value={form.tenantId}
                onChange={e => setForm(f => ({ ...f, tenantId: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
              >
                <option value="">Não informado</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.fullName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Prioridade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
            >
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={4}
              placeholder="Descreva o problema em detalhes..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
            />
          </div>

          {/* Custo estimado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custo estimado (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.estimatedCost}
              onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
            />
          </div>

          {/* Fornecedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do fornecedor/profissional</label>
            <input
              type="text"
              value={form.supplierName}
              onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))}
              placeholder="Ex: João Encanador"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Observações privadas..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/manutencao"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#3B6D11] hover:bg-[#27500A] text-white rounded-md text-sm font-medium transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {loading ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Criar chamado
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}