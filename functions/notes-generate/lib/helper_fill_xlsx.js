import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

/**
 * Helper para preencher templates XLSX com placeholders
 * Substitui strings {{PLACEHOLDER}} por valores reais e insere logos
 */
export class XlsxTemplateFiller {
  constructor() {
    this.workbook = null;
  }

  /**
   * Preenche template XLSX com dados fornecidos
   * @param {Object} options - Opções de preenchimento
   * @param {string} options.templatePath - Caminho para o template XLSX
   * @param {string} options.outputXlsxPath - Caminho para salvar XLSX preenchido
   * @param {Object} options.mapping - Mapeamento de placeholders para valores
   * @param {string} options.logoPath - Caminho para a logo da empresa
   * @returns {Promise<void>}
   */
  async fillTemplate({ templatePath, outputXlsxPath, mapping, logoPath }) {
    try {
      console.log(`[XlsxTemplateFiller] Iniciando preenchimento do template: ${templatePath}`);
      
      // Carregar workbook do template
      this.workbook = new ExcelJS.Workbook();
      await this.workbook.xlsx.readFile(templatePath);
      
      console.log(`[XlsxTemplateFiller] Template carregado com ${this.workbook.worksheets.length} planilhas`);
      
      // Processar cada planilha
      for (const worksheet of this.workbook.worksheets) {
        await this.processWorksheet(worksheet, mapping, logoPath);
      }
      
      // Criar diretório de saída se não existir
      const outputDir = path.dirname(outputXlsxPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Salvar arquivo preenchido
      await this.workbook.xlsx.writeFile(outputXlsxPath);
      console.log(`[XlsxTemplateFiller] Template preenchido salvo em: ${outputXlsxPath}`);
      
    } catch (error) {
      console.error('[XlsxTemplateFiller] Erro ao preencher template:', error);
      throw new Error(`Falha ao preencher template XLSX: ${error.message}`);
    }
  }

  /**
   * Processa uma planilha individual, substituindo placeholders e inserindo logos
   * @param {ExcelJS.Worksheet} worksheet - Planilha a ser processada
   * @param {Object} mapping - Mapeamento de placeholders
   * @param {string} logoPath - Caminho para logo
   */
  async processWorksheet(worksheet, mapping, logoPath) {
    console.log(`[XlsxTemplateFiller] Processando planilha: ${worksheet.name}`);
    
    // Iterar sobre todas as células da planilha
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        if (cell.value && typeof cell.value === 'string') {
          // Verificar se a célula contém placeholders
          const newValue = this.replacePlaceholders(cell.value, mapping);
          
          if (newValue !== cell.value) {
            console.log(`[XlsxTemplateFiller] Substituindo em ${worksheet.name}!${cell.address}: ${cell.value} → ${newValue}`);
            cell.value = newValue;
          }
          
          // Verificar se é um placeholder de logo
          if (cell.value.includes('{{LOGO}}')) {
            this.insertLogo(worksheet, cell, logoPath);
          }
        }
      });
    });
  }

  /**
   * Substitui placeholders em uma string
   * @param {string} text - Texto com placeholders
   * @param {Object} mapping - Mapeamento de placeholders
   * @returns {string} - Texto com placeholders substituídos
   */
  replacePlaceholders(text, mapping) {
    let result = text;
    
    // Substituir cada placeholder encontrado
    Object.entries(mapping).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
      result = result.replace(regex, value || '');
    });
    
    return result;
  }

  /**
   * Insere logo na posição da célula especificada
   * @param {ExcelJS.Worksheet} worksheet - Planilha
   * @param {ExcelJS.Cell} cell - Célula que contém {{LOGO}}
   * @param {string} logoPath - Caminho para o arquivo de logo
   */
  async insertLogo(worksheet, cell, logoPath) {
    try {
      if (!fs.existsSync(logoPath)) {
        console.warn(`[XlsxTemplateFiller] Logo não encontrada: ${logoPath}`);
        cell.value = '[LOGO]'; // Fallback
        return;
      }

      // Ler imagem como buffer
      const logoBuffer = fs.readFileSync(logoPath);
      
      // Adicionar imagem ao workbook
      const imageId = this.workbook.addImage({
        buffer: logoBuffer,
        extension: path.extname(logoPath).slice(1).toLowerCase()
      });
      
      // Inserir imagem na posição da célula
      worksheet.addImage(imageId, {
        tl: { col: cell.col - 1, row: cell.row - 1 },
        ext: { width: 100, height: 50 } // Tamanho padrão
      });
      
      // Limpar conteúdo da célula
      cell.value = '';
      
      console.log(`[XlsxTemplateFiller] Logo inserida em ${worksheet.name}!${cell.address}`);
      
    } catch (error) {
      console.error(`[XlsxTemplateFiller] Erro ao inserir logo:`, error);
      cell.value = '[LOGO]'; // Fallback em caso de erro
    }
  }

  /**
   * Gera HTML simples a partir do template preenchido (fallback para PDF)
   * @param {Object} mapping - Dados preenchidos
   * @returns {string} - HTML formatado
   */
  generateSimpleHTML(mapping) {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nota Fiscal</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .logo {
            max-width: 150px;
            max-height: 80px;
        }
        .company-info {
            margin: 20px 0;
        }
        .invoice-details {
            background-color: #f5f5f5;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .client-info {
            margin: 20px 0;
        }
        .description {
            margin: 20px 0;
            min-height: 100px;
        }
        .value {
            font-size: 16px;
            font-weight: bold;
            text-align: right;
            margin: 20px 0;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
        @media print {
            body { margin: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>NOTA FISCAL DE LOCAÇÃO</h1>
        <p>Número: ${mapping['{{NF_NUMBER}}'] || ''}</p>
    </div>
    
    <div class="company-info">
        <h3>Dados da Empresa</h3>
        <p><strong>Empresa:</strong> ${mapping['{{COMPANY_NAME}}'] || ''}</p>
        <p><strong>CNPJ/CPF:</strong> ${mapping['{{CNPJ_CPF}}'] || ''}</p>
        <p><strong>Endereço:</strong> ${mapping['{{ADDRESS}}'] || ''}</p>
        <p><strong>Cidade:</strong> ${mapping['{{CITY}}'] || ''} - ${mapping['{{UF}}'] || ''}</p>
        <p><strong>CEP:</strong> ${mapping['{{CEP}}'] || ''}</p>
        <p><strong>Telefone:</strong> ${mapping['{{FONE}}'] || ''}</p>
    </div>
    
    <div class="invoice-details">
        <h3>Detalhes da Nota Fiscal</h3>
        <p><strong>Data de Emissão:</strong> ${mapping['{{NF_DATE}}'] || ''}</p>
        <p><strong>Data de Vencimento:</strong> ${mapping['{{NF_DUE_DATE}}'] || ''}</p>
    </div>
    
    <div class="description">
        <h3>Descrição dos Serviços</h3>
        <p>${mapping['{{DESCRICAO}}'] || ''}</p>
    </div>
    
    <div class="value">
        <p>Valor Total: R$ ${mapping['{{NF_VALUE}}'] || '0,00'}</p>
    </div>
    
    ${mapping['{{OBS}}'] ? `
    <div class="footer">
        <h3>Observações</h3>
        <p>${mapping['{{OBS}}']}</p>
    </div>
    ` : ''}
    
    <div class="footer">
        <p>Esta nota fiscal foi gerada automaticamente em ${new Date().toLocaleDateString('pt-BR')}</p>
    </div>
</body>
</html>`;
  }
}

/**
 * Função principal para preencher template
 * @param {Object} options - Opções de preenchimento
 * @returns {Promise<void>}
 */
export async function fillTemplate(options) {
  const filler = new XlsxTemplateFiller();
  await filler.fillTemplate(options);
  return filler;
}

export default { XlsxTemplateFiller, fillTemplate };