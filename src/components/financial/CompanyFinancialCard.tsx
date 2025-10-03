import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { formatCurrency } from '../../types/financial';
import { getDadosFinanceirosPorEmpresa } from '../../lib/financialApi';
import { useEffect, useState } from 'react';

interface CompanyFinancialData {
  company_id: string;
  company_name: string;
  faturamento_bruto: number;
  total_despesas: number;
  caixa_empresa: number;
  quantidade_despesas: number;
  total_relatorios: number;
}

interface CompanyFinancialCardProps {
  data?: CompanyFinancialData;
  isPositive?: boolean;
  showAllCompanies?: boolean;
  filters?: { pump_prefix?: string };
}

export function CompanyFinancialCard({ data, isPositive, showAllCompanies = false, filters }: CompanyFinancialCardProps) {
  const [companiesData, setCompaniesData] = useState<CompanyFinancialData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showAllCompanies) {
      loadCompaniesData();
    }
  }, [showAllCompanies, filters]);

  const loadCompaniesData = async () => {
    setLoading(true);
    try {
      const data = await getDadosFinanceirosPorEmpresa(filters);
      setCompaniesData(data);
    } catch (error) {
      console.error('Erro ao carregar dados das empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompanyColor = (companyName: string) => {
    if (companyName.includes('FELIX') || companyName.includes('Félix')) {
      return {
        gradient: 'from-blue-50 to-blue-100',
        border: 'border-blue-200',
        title: 'text-blue-800',
        icon: 'bg-blue-200',
        iconEmoji: '🏢'
      };
    } else if (companyName.includes('WORLD RENTAL') || companyName.includes('World Rental')) {
      return {
        gradient: 'from-green-50 to-green-100',
        border: 'border-green-200',
        title: 'text-green-800',
        icon: 'bg-green-200',
        iconEmoji: '🌍'
      };
    }
    return {
      gradient: 'from-gray-50 to-gray-100',
      border: 'border-gray-200',
      title: 'text-gray-800',
      icon: 'bg-gray-200',
      iconEmoji: '🏢'
    };
  };

  const renderCompanyCard = (companyData: CompanyFinancialData) => {
    const colors = getCompanyColor(companyData.company_name);
    const isPositiveCash = companyData.caixa_empresa >= 0;

    return (
      <Card key={companyData.company_id} className={`bg-gradient-to-br ${colors.gradient} ${colors.border} hover:shadow-lg transition-shadow duration-200`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className={`text-lg font-semibold ${colors.title}`}>
              {companyData.company_name}
            </CardTitle>
            <div className={`p-2 ${colors.icon} rounded-full`}>
              <span className="text-2xl">{colors.iconEmoji}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Faturamento Bruto */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <span className="text-lg">💰</span>
                <div>
                  <span className="text-sm font-medium text-green-800">Faturamento Bruto</span>
                  <div className="text-xs text-green-600">
                    {companyData.total_relatorios} relatórios
                  </div>
                </div>
              </div>
              <span className="text-lg font-bold text-green-700">
                {formatCurrency(companyData.faturamento_bruto)}
              </span>
            </div>

            {/* Despesas */}
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <span className="text-lg">💸</span>
                <div>
                  <span className="text-sm font-medium text-red-800">Despesas</span>
                  <div className="text-xs text-red-600">
                    {companyData.quantidade_despesas} despesas
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-red-700">
                  {formatCurrency(Math.abs(companyData.total_despesas))}
                </div>
                <div className="text-xs text-red-600">
                  Saída de caixa
                </div>
              </div>
            </div>

            {/* Caixa da Empresa */}
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              isPositiveCash 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{isPositiveCash ? '📈' : '📉'}</span>
                <div>
                  <span className="text-sm font-medium text-gray-800">Caixa da Empresa</span>
                  <div className="text-xs text-gray-600">
                    Faturamento - Despesas
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  isPositiveCash ? 'text-green-700' : 'text-red-700'
                }`}>
                  {formatCurrency(companyData.caixa_empresa)}
                </div>
                <div className={`text-xs font-medium ${
                  isPositiveCash ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositiveCash ? 'Saldo Positivo' : 'Saldo Negativo'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (showAllCompanies) {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            📊 Resumo Financeiro por Empresa
          </h2>
          <p className="text-gray-600">
            Faturamento bruto, despesas e caixa separados por empresa
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {companiesData.map(renderCompanyCard)}
        </div>

        {/* Resumo Consolidado */}
        {companiesData.length > 0 && (
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-purple-800 flex items-center gap-2">
                <span className="text-xl">📋</span>
                Resumo Consolidado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(companiesData.reduce((sum, c) => sum + c.faturamento_bruto, 0))}
                  </div>
                  <div className="text-sm text-gray-600">Faturamento Total</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-red-700">
                    {formatCurrency(Math.abs(companiesData.reduce((sum, c) => sum + c.total_despesas, 0)))}
                  </div>
                  <div className="text-sm text-gray-600">Despesas Totais</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                  <div className={`text-2xl font-bold ${
                    companiesData.reduce((sum, c) => sum + c.caixa_empresa, 0) >= 0 
                      ? 'text-green-700' 
                      : 'text-red-700'
                  }`}>
                    {formatCurrency(companiesData.reduce((sum, c) => sum + c.caixa_empresa, 0))}
                  </div>
                  <div className="text-sm text-gray-600">Caixa Consolidado</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Renderização para uma empresa específica (compatibilidade com versão anterior)
  if (!data) return null;

  const colors = getCompanyColor(data.company_name);
  const isPositiveCash = data.caixa_empresa >= 0;

  return (
    <Card className={`bg-gradient-to-br ${colors.gradient} ${colors.border} hover:shadow-lg transition-shadow duration-200`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-lg font-semibold ${colors.title}`}>
            {data.company_name}
          </CardTitle>
          <div className={`p-2 ${colors.icon} rounded-full`}>
            <span className="text-2xl">{colors.iconEmoji}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Faturamento Bruto */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              <div>
              <span className="text-sm font-medium text-green-800">Faturamento Bruto</span>
                <div className="text-xs text-green-600">
                  {data.total_relatorios || 0} relatórios
                </div>
              </div>
            </div>
            <span className="text-lg font-bold text-green-700">
              {formatCurrency(data.faturamento_bruto)}
            </span>
          </div>

          {/* Despesas */}
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">💸</span>
              <div>
              <span className="text-sm font-medium text-red-800">Despesas</span>
                <div className="text-xs text-red-600">
                  {data.quantidade_despesas} despesas
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-red-700">
                {formatCurrency(Math.abs(data.total_despesas))}
              </div>
              <div className="text-xs text-red-600">
                Saída de caixa
              </div>
            </div>
          </div>

          {/* Caixa da Empresa */}
          <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
            isPositiveCash 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{isPositiveCash ? '📈' : '📉'}</span>
              <div>
                <span className="text-sm font-medium text-gray-800">Caixa da Empresa</span>
                <div className="text-xs text-gray-600">
                  Faturamento - Despesas
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                isPositiveCash ? 'text-green-700' : 'text-red-700'
              }`}>
                {formatCurrency(data.caixa_empresa)}
              </div>
              <div className={`text-xs font-medium ${
                isPositiveCash ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositiveCash ? 'Saldo Positivo' : 'Saldo Negativo'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
