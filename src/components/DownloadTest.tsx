import React, { useState } from 'react';
import { Button } from './Button';
import { toast } from '../lib/toast';

export function DownloadTest() {
  const [testing, setTesting] = useState(false);

  const testSimpleDownload = () => {
    try {
      setTesting(true);
      
      // Teste simples de download de texto
      const content = 'Teste de download - Felix Mix\nData: ' + new Date().toLocaleString();
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'teste-download.txt';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      toast.success('Teste de download realizado! Verifique sua pasta de Downloads.');
      
    } catch (error) {
      console.error('Erro no teste:', error);
      toast.error('Erro no teste de download: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const testExcelDownload = () => {
    try {
      setTesting(true);
      
      // Teste simples de Excel usando XLSX
      const data = [
        { Nome: 'Felix Mix', Data: new Date().toLocaleDateString(), Status: 'Teste' },
        { Nome: 'WorldRental', Data: new Date().toLocaleDateString(), Status: 'Teste' }
      ];
      
      // Importar XLSX dinamicamente
      import('xlsx').then(XLSX => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Teste');
        
        // Tentar método padrão
        try {
          XLSX.writeFile(wb, 'teste-excel.xlsx');
          toast.success('Excel salvo com método padrão!');
        } catch (error) {
          console.warn('Método padrão falhou, tentando alternativo:', error);
          
          // Método alternativo
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([wbout], { type: 'application/octet-stream' });
          const url = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = 'teste-excel.xlsx';
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          window.URL.revokeObjectURL(url);
          toast.success('Excel salvo com método alternativo!');
        }
      }).catch(error => {
        console.error('Erro ao importar XLSX:', error);
        toast.error('Erro ao carregar biblioteca XLSX');
      });
      
    } catch (error) {
      console.error('Erro no teste Excel:', error);
      toast.error('Erro no teste Excel: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const testPDFDownload = () => {
    try {
      setTesting(true);
      
      // Teste simples de PDF usando jsPDF
      import('jspdf').then(jsPDF => {
        const doc = new jsPDF.default();
        doc.text('Teste de Download PDF', 20, 20);
        doc.text('Felix Mix - WorldRental', 20, 30);
        doc.text('Data: ' + new Date().toLocaleString(), 20, 40);
        
        // Tentar método padrão
        try {
          doc.save('teste-pdf.pdf');
          toast.success('PDF salvo com método padrão!');
        } catch (error) {
          console.warn('Método padrão falhou, tentando alternativo:', error);
          
          // Método alternativo
          const pdfBlob = doc.output('blob');
          const url = window.URL.createObjectURL(pdfBlob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = 'teste-pdf.pdf';
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          window.URL.revokeObjectURL(url);
          toast.success('PDF salvo com método alternativo!');
        }
      }).catch(error => {
        console.error('Erro ao importar jsPDF:', error);
        toast.error('Erro ao carregar biblioteca jsPDF');
      });
      
    } catch (error) {
      console.error('Erro no teste PDF:', error);
      toast.error('Erro no teste PDF: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">🧪 Teste de Downloads</h2>
      <p className="text-gray-600 mb-4">
        Use estes botões para testar se o problema é com downloads em geral ou específico da exportação de programação.
      </p>
      
      <div className="flex gap-3">
        <Button
          onClick={testSimpleDownload}
          disabled={testing}
          variant="outline"
          className="flex items-center gap-2"
        >
          {testing ? (
            <>
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Testando...
            </>
          ) : (
            <>
              📄 Teste TXT
            </>
          )}
        </Button>

        <Button
          onClick={testExcelDownload}
          disabled={testing}
          variant="outline"
          className="flex items-center gap-2"
        >
          {testing ? (
            <>
              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              Testando...
            </>
          ) : (
            <>
              📊 Teste Excel
            </>
          )}
        </Button>

        <Button
          onClick={testPDFDownload}
          disabled={testing}
          variant="outline"
          className="flex items-center gap-2"
        >
          {testing ? (
            <>
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              Testando...
            </>
          ) : (
            <>
              📄 Teste PDF
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">💡 Dicas para resolver problemas de download:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Verifique se o navegador não está bloqueando downloads</li>
          <li>• Verifique a pasta de Downloads padrão do seu navegador</li>
          <li>• Tente usar um navegador diferente (Chrome, Firefox, Safari)</li>
          <li>• Verifique se há extensões bloqueando downloads</li>
          <li>• Abra o Console do navegador (F12) para ver mensagens de erro</li>
        </ul>
      </div>
    </div>
  );
}
