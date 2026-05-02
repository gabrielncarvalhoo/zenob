"use client";

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface LeaseContract {
  id: string;
  unitId: string;
  primaryTenantId: string;
  startDate: string;
  endDate: string;
  dueDay: number;
  rentAmount: number;
  depositAmount: number | null;
  adjustmentIndex: 'IGP_M' | 'IPCA' | 'INPC' | 'FIXED';
  adjustmentFrequencyMonths: number;
  guaranteeType: 'DEPOSIT' | 'SURETY' | 'INSURANCE' | 'NONE';
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  notes: string | null;
  terminationDate: string | null;
  nextAdjustmentDate?: string;
  unit?: {
    property?: {
      name: string;
    };
  };
  leaseTenants?: Array<{
    tenant: {
      fullName: string;
    };
  }>;
}

interface LeaseListProps {
  initialLeases: LeaseContract[];
}

function getStatusBadge(status: LeaseContract['status']) {
  switch (status) {
    case 'ACTIVE':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAF3DE] text-[#3B6D11]">Ativo</span>;
    case 'DRAFT':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">Rascunho</span>;
    case 'EXPIRED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FAEEDA] text-[#633806]">Vencido</span>;
    case 'TERMINATED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FCEBEB] text-[#791F1F]">Rescindido</span>;
    default:
      return null;
  }
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
}

function getDaysUntil(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateNextAdjustment(startDate: string, freqMonths: number) {
  const start = new Date(startDate);
  const now = new Date();
  const next = new Date(start);
  while (next <= now) {
    next.setMonth(next.getMonth() + freqMonths);
  }
  return next.toISOString();
}

export function LeaseList({ initialLeases }: LeaseListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('START_DATE_DESC');

  const filteredAndSortedLeases = useMemo(() => {
    let result = [...initialLeases];

    // Filter by search term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(lease => {
        const propertyName = lease.unit?.property?.name?.toLowerCase() || '';
        const tenantName = lease.leaseTenants?.[0]?.tenant?.fullName?.toLowerCase() || '';
        return propertyName.includes(lowerTerm) || tenantName.includes(lowerTerm);
      });
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      result = result.filter(lease => lease.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'START_DATE_DESC':
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case 'START_DATE_ASC':
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case 'RENT_DESC':
          return b.rentAmount - a.rentAmount;
        case 'RENT_ASC':
          return a.rentAmount - b.rentAmount;
        default:
          return 0;
      }
    });

    return result;
  }, [initialLeases, searchTerm, statusFilter, sortBy]);

  return (
    <div>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Buscar inquilino ou imóvel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
          />
        </div>
        <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
          >
            <option value="ALL">Todos os status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="DRAFT">Rascunho</option>
            <option value="EXPIRED">Vencido</option>
            <option value="TERMINATED">Rescindido</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#3B6D11] focus:border-[#3B6D11]"
          >
            <option value="START_DATE_DESC">Mais recentes primeiro</option>
            <option value="START_DATE_ASC">Mais antigos primeiro</option>
            <option value="RENT_DESC">Maior valor</option>
            <option value="RENT_ASC">Menor valor</option>
          </select>
        </div>
      </div>

      {filteredAndSortedLeases.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
          <p className="text-gray-500 mb-6">Nenhum contrato corresponde aos filtros aplicados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[900px] w-full">
              <div className="grid grid-cols-[1fr_1.5fr_1.5fr_1.5fr_1fr_1fr_1fr] bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="px-6 py-4">Status</div>
                <div className="px-6 py-4">Imóvel</div>
                <div className="px-6 py-4">Inquilino</div>
                <div className="px-6 py-4">Aluguel</div>
                <div className="px-6 py-4">Venc.</div>
                <div className="px-6 py-4">Início</div>
                <div className="px-6 py-4">Término</div>
              </div>
              <div className="bg-white divide-y divide-gray-200">
                {filteredAndSortedLeases.map((lease) => {
                  const adjDate = lease.nextAdjustmentDate || calculateNextAdjustment(lease.startDate, lease.adjustmentFrequencyMonths);
                  const daysToAdj = getDaysUntil(adjDate);
                  const needsAdjustmentAlert = daysToAdj >= 0 && daysToAdj <= 30;

                  return (
                    <Link 
                      href={`/contratos/${lease.id}`} 
                      key={lease.id} 
                      className="grid grid-cols-[1fr_1.5fr_1.5fr_1.5fr_1fr_1fr_1fr] hover:bg-gray-50 transition-colors items-center group cursor-pointer"
                    >
                      <div className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(lease.status)}
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 group-hover:text-[#3B6D11] transition-colors truncate flex items-center gap-2">
                        {lease.unit?.property?.name || '-'}
                        {needsAdjustmentAlert && (
                          <div title={`Reajuste previsto em ${daysToAdj} dias`} className="cursor-help">
                            <AlertTriangle className="w-4 h-4 text-[#BA7517]" />
                          </div>
                        )}
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate">
                        {lease.leaseTenants?.[0]?.tenant?.fullName || '-'}
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(lease.rentAmount)}
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Dia {lease.dueDay}
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(lease.startDate)}
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(lease.endDate)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
