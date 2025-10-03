import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { FinancialDashboard } from './FinancialDashboard';
import { CreateExpense, ViewExpense } from './CreateExpense';
import { InvoicesIntegration } from './InvoicesIntegration';
import { FinancialReports } from './FinancialReports';
import { FolhaSalarial } from './FolhaSalarial';

export function FinancialModule() {
  return (
    <Layout>
      <Routes>
        {/* Dashboard principal */}
        <Route path="/" element={<FinancialDashboard />} />
        
        {/* Gestão de despesas */}
        <Route path="/expenses/new" element={<CreateExpense />} />
        <Route path="/expenses/edit/:id" element={<CreateExpense />} />
        <Route path="/expenses/view/:id" element={<ViewExpense />} />
        
        {/* Integração com notas fiscais */}
        <Route path="/invoices" element={<InvoicesIntegration />} />
        
        {/* Relatórios */}
        <Route path="/reports" element={<FinancialReports />} />
        
        {/* Folha Salarial */}
        <Route path="/folha-salarial" element={<FolhaSalarial />} />
        
        {/* Redirecionamento padrão */}
        <Route path="*" element={<Navigate to="/financial" replace />} />
      </Routes>
    </Layout>
  );
}

// Exportar componentes individuais para uso em outras partes do sistema
export { FinancialDashboard } from './FinancialDashboard';
export { CreateExpense, ViewExpense } from './CreateExpense';
export { InvoicesIntegration } from './InvoicesIntegration';
export { FinancialReports } from './FinancialReports';
export { FolhaSalarial } from './FolhaSalarial';

