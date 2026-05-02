"use client";

import { useEffect, useState } from 'react';
import { Plus, Trash2, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  templateUrl: string;
  isActive: boolean;
  placeholders: string[];
  createdAt: string;
}

const PLACEHOLDERS = [
  '{{NOME_INQUILINO}}', '{{CPF_INQUILINO}}', '{{RG_INQUILINO}}',
  '{{EMAIL_INQUILINO}}', '{{TELEFONE_INQUILINO}}',
  '{{NOME_FIADOR}}', '{{CPF_FIADOR}}',
  '{{ENDERECO_IMOVEL}}', '{{NOME_IMOVEL}}', '{{CODIGO_UNIDADE}}',
  '{{IPTU}}', '{{MATRICULA_AGUA}}', '{{MATRICULA_ENERGIA}}',
  '{{VALOR_ALUGUEL}}', '{{DIA_VENCIMENTO}}',
  '{{DATA_INICIO}}', '{{DATA_FIM}}', '{{DURACAO_CONTRATO}}',
  '{{NOME_LOCADOR}}', '{{CPF_LOCADOR}}',
  '{{VALOR_GARANTIA}}', '{{TIPO_GARANTIA}}', '{{INDICE_REAJUSTE}}',
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', templateUrl: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTemplates = () => {
    fetch('http://localhost:3000/api/v1/templates', {
      headers: { 'x-account-id': 'account-teste-001' },
    })
      .then(r => r.ok ? r.json() : [])
      .then(d => { setTemplates(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('http://localhost:3000/api/v1/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-account-id': 'account-teste-001' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: '', templateUrl: '' });
        fetchTemplates();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir template?')) return;
    setDeleting(id);
    try {
      await fetch(`http://localhost:3000/api/v1/templates/${id}`, {
        method: 'DELETE',
        headers: { 'x-account-id': 'account-teste-001' },
      });
      fetchTemplates();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates de Contrato</h1>
          <p className="text-gray-500 mt-1 text-sm">Gerencie modelos PDF para seus contratos</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-[#3B6D11] hover:bg-[#27500A] text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo template
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Adicionar template</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome do template</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Ex: Contrato Padrão Residência"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">URL do template PDF</label>
              <input
                type="url"
                value={form.templateUrl}
                onChange={e => setForm({ ...form, templateUrl: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="https://exemplo.com/template-contrato.pdf"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                PDF com marcadores como {'{{NOME_INQUILINO}}'}, {'{{VALOR_ALUGUEL}}'}, etc.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#3B6D11] hover:bg-[#27500A] text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Placeholders help */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Marcadores suportados</p>
        <div className="flex flex-wrap gap-2">
          {PLACEHOLDERS.map(p => (
            <code key={p} className="text-xs bg-white border px-2 py-1 rounded text-gray-700">{p}</code>
          ))}
        </div>
      </div>

      {/* Templates list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum template cadastrado</p>
          <p className="text-sm text-gray-400 mt-1">Adicione a URL de um PDF com marcadores {'{{...}}'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                    {t.isActive && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#3B6D11]">
                        <CheckCircle2 className="w-3 h-3" /> Ativo
                      </span>
                    )}
                  </div>
                  <a
                    href={t.templateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {t.templateUrl.length > 60 ? t.templateUrl.slice(0, 60) + '...' : t.templateUrl}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {t.placeholders.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.placeholders.map(p => (
                        <code key={p} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{p}</code>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={deleting === t.id}
                  className="text-gray-400 hover:text-red-500 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}