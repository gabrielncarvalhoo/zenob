"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, ArrowLeft } from 'lucide-react';

interface PropertyIptu {
  id: string;
  name: string;
  iptuCode: string | null;
  iptuStatus: string | null;
  iptuLastChecked: string | null;
  address: string;
}

interface IptuStats {
  total: number;
  paid: number;
  pending: number;
  unknown: number;
  properties: PropertyIptu[];
}

export default function IptuPage() {
  const [stats, setStats] = useState<IptuStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  function fetchData() {
    setLoading(true);
    fetch('http://localhost:3000/api/v1/iptu/properties', {
      headers: { 'x-account-id': 'account-teste-001' },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setStats(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  async function handleBatchCheck() {
    setChecking(true);
    try {
      await fetch('http://localhost:3000/api/v1/iptu/batch-check', {
        method: 'POST',
        headers: { 'x-account-id': 'account-teste-001' },
      });
      fetchData();
    } finally {
      setChecking(false);
    }
  }

  async function handleConfirm(propertyId: string) {
    await fetch(`http://localhost:3000/api/v1/iptu/confirm/${propertyId}`, {
      method: 'POST',
      headers: { 'x-account-id': 'account-teste-001' },
    });
    fetchData();
  }

  function openIptuSite(iptuCode: string) {
    window.open(`https://campinagrande.pb.gov.br/iptu/`, '_blank');
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/imoveis" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IPTU</h1>
          <p className="text-sm text-gray-500">Status do Imposto Territorial</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Home className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 uppercase">Total</span>
          </div>
          <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
        </div>
        <div className="bg-[#EAF3DE] rounded-xl border border-[#3B6D11]/20 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#3B6D11]" />
            <span className="text-xs text-[#3B6D11] uppercase">Pagos</span>
          </div>
          <p className="text-2xl font-bold text-[#3B6D11]">{stats?.paid ?? 0}</p>
        </div>
        <div className="bg-[#FCEBEB] rounded-xl border border-[#E24B4A]/20 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-[#E24B4A]" />
            <span className="text-xs text-[#E24B4A] uppercase">Pendentes</span>
          </div>
          <p className="text-2xl font-bold text-[#E24B4A]">{stats?.pending ?? 0}</p>
        </div>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 uppercase">Desconhecidos</span>
          </div>
          <p className="text-2xl font-bold text-gray-600">{stats?.unknown ?? 0}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleBatchCheck}
          disabled={checking}
          className="flex items-center gap-2 bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Verificando...' : 'Verificar todos no site da Prefeitura'}
        </button>
      </div>

      {/* Properties list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Imóvel</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Código IPTU</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Última verificação</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.properties.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.address}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-gray-700">{p.iptuCode ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      p.iptuStatus === 'PAID' ? 'bg-[#EAF3DE] text-[#3B6D11]' :
                      p.iptuStatus === 'PENDING' ? 'bg-[#FCEBEB] text-[#E24B4A]' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {p.iptuStatus === 'PAID' && <CheckCircle2 className="w-3 h-3" />}
                      {p.iptuStatus === 'PENDING' && <AlertTriangle className="w-3 h-3" />}
                      {p.iptuStatus === 'PAID' ? 'Pago' :
                       p.iptuStatus === 'PENDING' ? 'Pendente' :
                       p.iptuStatus === 'NOT_FOUND' ? 'Não encontrado' : 'Desconhecido'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {p.iptuLastChecked ? new Date(p.iptuLastChecked).toLocaleDateString('pt-BR') : 'Nunca'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openIptuSite(p.iptuCode ?? '')}
                        className="flex items-center gap-1 text-xs text-[#3B6D11] hover:underline"
                        title="Verificar no site da Prefeitura"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Site
                      </button>
                      {p.iptuStatus !== 'PAID' && (
                        <button
                          onClick={() => handleConfirm(p.id)}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                          title="Confirmar pagamento"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Confirmar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {stats?.properties.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Nenhum imóvel cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
