import React from 'react';
import { formatCurrency, formatDate, formatPhone, formatDocument, formatCEP } from '../utils/format';

interface NotePreviewProps {
  data: {
    company_logo: string;
    phone: string;
    nf_date: string;
    nf_due_date: string;
    company_name: string;
    address?: string;
    cnpj_cpf?: string;
    city?: string;
    cep?: string;
    uf?: string;
    nf_value: number;
    descricao?: string;
    obs?: string;
  };
  nfNumber?: string;
}

/**
 * Componente de preview da nota fiscal em tempo real
 */
export const NotePreview: React.FC<NotePreviewProps> = ({ data, nfNumber = '000001' }) => {
  const getCompanyName = () => {
    return data.company_logo === 'felixmix' ? 'FÉLIX MIX' : 'WORLD RENTAL';
  };

  const getCompanyColor = () => {
    return data.company_logo === 'felixmix' ? 'text-blue-600' : 'text-green-600';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
      {/* Cabeçalho */}
      <div className="text-center mb-6 border-b border-gray-300 pb-4">
        <div className={`text-sm font-semibold mb-2 ${getCompanyColor()}`}>
          {getCompanyName()}
        </div>
        <h1 className="text-xl font-bold text-gray-900">NOTA FISCAL DE LOCAÇÃO</h1>
        <div className="text-sm text-gray-600 mt-2">
          Número: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{nfNumber}</span>
        </div>
      </div>

      {/* Dados da Empresa */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          Dados da Empresa
        </h3>
        <div className="text-sm space-y-2 bg-gray-50 p-3 rounded">
          <div className="flex justify-between">
            <span className="text-gray-600">Empresa:</span>
            <span className="font-medium">{data.company_name || 'Nome da empresa'}</span>
          </div>
          {data.cnpj_cpf && (
            <div className="flex justify-between">
              <span className="text-gray-600">CNPJ/CPF:</span>
              <span className="font-mono">{formatDocument(data.cnpj_cpf)}</span>
            </div>
          )}
          {data.address && (
            <div className="flex justify-between">
              <span className="text-gray-600">Endereço:</span>
              <span className="text-right max-w-48">{data.address}</span>
            </div>
          )}
          {(data.city || data.uf) && (
            <div className="flex justify-between">
              <span className="text-gray-600">Cidade:</span>
              <span>{data.city || 'Cidade'} - {data.uf || 'UF'}</span>
            </div>
          )}
          {data.cep && (
            <div className="flex justify-between">
              <span className="text-gray-600">CEP:</span>
              <span className="font-mono">{formatCEP(data.cep)}</span>
            </div>
          )}
          {data.phone && (
            <div className="flex justify-between">
              <span className="text-gray-600">Telefone:</span>
              <span className="font-mono">{formatPhone(data.phone)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dados da Nota */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Dados da Nota
        </h3>
        <div className="text-sm space-y-2 bg-gray-50 p-3 rounded">
          <div className="flex justify-between">
            <span className="text-gray-600">Data de Emissão:</span>
            <span>{data.nf_date ? formatDate(data.nf_date) : 'Data da nota'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Data de Vencimento:</span>
            <span>{data.nf_due_date ? formatDate(data.nf_due_date) : 'Data de vencimento'}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-gray-600 font-medium">Valor Total:</span>
            <span className="font-bold text-lg text-green-600">
              {formatCurrency(data.nf_value || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Descrição */}
      {data.descricao && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
            Descrição dos Serviços
          </h3>
          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">
            {data.descricao}
          </div>
        </div>
      )}

      {/* Observações */}
      {data.obs && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            Observações
          </h3>
          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">
            {data.obs}
          </div>
        </div>
      )}

      {/* Rodapé */}
      <div className="text-center text-xs text-gray-500 border-t border-gray-300 pt-4 mt-6">
        <p>Esta nota fiscal foi gerada automaticamente em {formatDate(new Date().toISOString())}</p>
        <p className="mt-1 font-medium">WorldRental FelixMix - Sistema de Gestão de Bombas</p>
      </div>

      {/* Indicador de Status */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
          Preview em Tempo Real
        </div>
      </div>
    </div>
  );
};
