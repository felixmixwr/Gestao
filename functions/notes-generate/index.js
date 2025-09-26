import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fillTemplate } from './lib/helper_fill_xlsx.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET_INVOICES || 'invoices';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Valida JWT e verifica permissões do usuário
 * @param {string} authHeader - Header Authorization
 * @returns {Promise<Object>} - Dados do usuário autenticado
 */
async function validateAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token de autorização inválido');
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Token inválido ou expirado');
    }

    // Verificar role do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Perfil do usuário não encontrado');
    }

    if (!['financeiro', 'admin'].includes(profile.role)) {
      throw new Error('Usuário não tem permissão para gerar notas');
    }

    return { user, role: profile.role };
  } catch (error) {
    console.error('Erro na validação de auth:', error);
    throw new Error('Falha na autenticação');
  }
}

/**
 * Valida payload da requisição
 * @param {Object} payload - Dados da requisição
 * @returns {Object} - Payload validado
 */
function validatePayload(payload) {
  const required = [
    'report_id', 'company_logo', 'phone', 'nf_date', 'nf_due_date',
    'company_name', 'address', 'cnpj_cpf', 'city', 'cep', 'uf',
    'nf_value', 'descricao'
  ];

  const missing = required.filter(field => !payload[field]);
  if (missing.length > 0) {
    throw new Error(`Campos obrigatórios ausentes: ${missing.join(', ')}`);
  }

  // Validar formato de datas
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(payload.nf_date) || !dateRegex.test(payload.nf_due_date)) {
    throw new Error('Datas devem estar no formato YYYY-MM-DD');
  }

  // Validar valor numérico
  if (isNaN(payload.nf_value) || payload.nf_value <= 0) {
    throw new Error('Valor da nota deve ser um número positivo');
  }

  // Validar logo da empresa
  if (!['felixmix', 'worldrental'].includes(payload.company_logo)) {
    throw new Error('Logo da empresa deve ser "felixmix" ou "worldrental"');
  }

  return payload;
}

/**
 * Verifica se o report existe e está no status correto
 * @param {string} reportId - ID do report
 * @returns {Promise<Object>} - Dados do report
 */
async function validateReport(reportId) {
  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error || !report) {
    throw new Error('Report não encontrado');
  }

  if (report.status !== 'NOTA_EMITIDA') {
    throw new Error(`Report deve estar com status 'NOTA_EMITIDA', atual: ${report.status}`);
  }

  return report;
}

/**
 * Verifica se já existe nota para o report
 * @param {string} reportId - ID do report
 * @returns {Promise<boolean>} - True se já existe nota
 */
async function checkExistingNote(reportId) {
  const { data: existingNote, error } = await supabase
    .from('notes')
    .select('id')
    .eq('report_id', reportId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error('Erro ao verificar nota existente');
  }

  return !!existingNote;
}

/**
 * Cria nova nota no banco de dados
 * @param {Object} payload - Dados da nota
 * @param {string} reportId - ID do report
 * @returns {Promise<Object>} - Dados da nota criada
 */
async function createNote(payload, reportId) {
  const noteData = {
    report_id: reportId,
    company_logo: payload.company_logo,
    phone: payload.phone,
    nf_date: payload.nf_date,
    nf_due_date: payload.nf_due_date,
    company_name: payload.company_name,
    address: payload.address,
    cnpj_cpf: payload.cnpj_cpf,
    city: payload.city,
    cep: payload.cep,
    uf: payload.uf,
    nf_value: payload.nf_value,
    descricao: payload.descricao,
    obs: payload.obs || null,
    created_at: new Date().toISOString()
  };

  const { data: note, error } = await supabase
    .from('notes')
    .insert(noteData)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Erro ao criar nota: ${error.message}`);
  }

  return note;
}

/**
 * Converte XLSX para PDF usando Puppeteer
 * @param {string} xlsxPath - Caminho do arquivo XLSX
 * @param {string} pdfPath - Caminho de destino do PDF
 * @param {Object} mapping - Dados para gerar HTML
 * @returns {Promise<void>}
 */
async function convertXlsxToPdf(xlsxPath, pdfPath, mapping) {
  try {
    console.log('🔄 Convertendo XLSX para PDF usando Puppeteer...');
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Gerar HTML simples com os dados
    const html = generateInvoiceHTML(mapping);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Configurar página para impressão
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    await browser.close();
    console.log('✅ PDF gerado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao converter para PDF:', error);
    throw new Error(`Falha na conversão para PDF: ${error.message}`);
  }
}

/**
 * Gera HTML para conversão em PDF
 * @param {Object} mapping - Dados da nota
 * @returns {string} - HTML formatado
 */
function generateInvoiceHTML(mapping) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nota Fiscal ${mapping['{{FATURA_NUMERO}}']}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
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
            margin-bottom: 10px;
        }
        .company-info {
            margin: 20px 0;
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
        }
        .invoice-details {
            background-color: #e8f4f8;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        .client-info {
            margin: 20px 0;
            background-color: #f0f8f0;
            padding: 15px;
            border-radius: 5px;
        }
        .description {
            margin: 20px 0;
            min-height: 100px;
            background-color: #fff8e1;
            padding: 15px;
            border-radius: 5px;
        }
        .value {
            font-size: 18px;
            font-weight: bold;
            text-align: right;
            margin: 20px 0;
            background-color: #e8f5e8;
            padding: 15px;
            border-radius: 5px;
            border: 2px solid #28a745;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .section-title {
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
            font-size: 14px;
        }
        @media print {
            body { margin: 0; }
            .header { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>NOTA FISCAL DE LOCAÇÃO</h1>
        <p><strong>Número:</strong> ${mapping['{{FATURA_NUMERO}}'] || ''}</p>
        <p><strong>Data de Emissão:</strong> ${mapping['{{DATA_EMISSAO}}'] || ''}</p>
    </div>
    
    <div class="grid">
        <div class="company-info">
            <div class="section-title">DADOS DA EMPRESA</div>
            <p><strong>Empresa:</strong> ${mapping['{{EMPRESA}}'] || ''}</p>
            <p><strong>CNPJ/CPF:</strong> ${mapping['{{CNPJ_CPF}}'] || ''}</p>
            <p><strong>Endereço:</strong> ${mapping['{{ENDERECO}}'] || ''}</p>
            <p><strong>Cidade:</strong> ${mapping['{{MUNICIPIO}}'] || ''} - ${mapping['{{UF}}'] || ''}</p>
            <p><strong>CEP:</strong> ${mapping['{{CEP}}'] || ''}</p>
            <p><strong>Telefone:</strong> ${mapping['{{FONE}}'] || ''}</p>
        </div>
        
        <div class="invoice-details">
            <div class="section-title">DETALHES DA NOTA</div>
            <p><strong>Data de Emissão:</strong> ${mapping['{{DATA_EMISSAO}}'] || ''}</p>
            <p><strong>Data de Vencimento:</strong> ${mapping['{{VENCIMENTO}}'] || ''}</p>
            <p><strong>Número da Fatura:</strong> ${mapping['{{FATURA_NUMERO}}'] || ''}</p>
        </div>
    </div>
    
    <div class="description">
        <div class="section-title">DESCRIÇÃO DOS SERVIÇOS</div>
        <p>${mapping['{{DESCRIMINACAO}}'] || ''}</p>
    </div>
    
    <div class="value">
        <p><strong>VALOR TOTAL: R$ ${mapping['{{VALOR}}'] || '0,00'}</strong></p>
    </div>
    
    ${mapping['{{OBSERVACOES}}'] ? `
    <div class="footer">
        <div class="section-title">OBSERVAÇÕES</div>
        <p>${mapping['{{OBSERVACOES}}']}</p>
    </div>
    ` : ''}
    
    <div class="footer">
        <p>Esta nota fiscal foi gerada automaticamente em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        <p>WorldRental FelixMix - Sistema de Gestão de Bombas</p>
    </div>
</body>
</html>`;
}

/**
 * Faz upload dos arquivos para o Supabase Storage
 * @param {string} filePath - Caminho local do arquivo
 * @param {string} storagePath - Caminho no storage
 * @returns {Promise<string>} - URL pública do arquivo
 */
async function uploadToStorage(filePath, storagePath) {
  try {
    console.log(`📤 Fazendo upload: ${filePath} → ${storagePath}`);
    
    const fileBuffer = fs.readFileSync(filePath);
    
    const { data, error } = await supabase.storage
      .from(supabaseBucket)
      .upload(storagePath, fileBuffer, {
        contentType: filePath.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true
      });

    if (error) {
      throw new Error(`Erro no upload: ${error.message}`);
    }

    // Gerar URL assinada para download
    const { data: signedUrl } = await supabase.storage
      .from(supabaseBucket)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 dias

    return signedUrl?.signedUrl || '';
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    throw new Error(`Falha no upload: ${error.message}`);
  }
}

/**
 * Atualiza os caminhos dos arquivos na nota
 * @param {string} noteId - ID da nota
 * @param {string} xlsxPath - Caminho do XLSX no storage
 * @param {string} pdfPath - Caminho do PDF no storage
 * @returns {Promise<void>}
 */
async function updateNotePaths(noteId, xlsxPath, pdfPath) {
  const { error } = await supabase
    .from('notes')
    .update({
      file_xlsx_path: xlsxPath,
      file_pdf_path: pdfPath,
      updated_at: new Date().toISOString()
    })
    .eq('id', noteId);

  if (error) {
    throw new Error(`Erro ao atualizar caminhos: ${error.message}`);
  }
}

/**
 * Remove arquivos temporários
 * @param {Array<string>} files - Lista de arquivos para remover
 */
function cleanupTempFiles(files) {
  files.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`🗑️ Arquivo temporário removido: ${file}`);
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao remover arquivo temporário ${file}:`, error.message);
    }
  });
}

/**
 * Remove nota do banco em caso de erro
 * @param {string} noteId - ID da nota
 */
async function rollbackNote(noteId) {
  try {
    await supabase.from('notes').delete().eq('id', noteId);
    console.log(`🔄 Nota ${noteId} removida devido a erro`);
  } catch (error) {
    console.error('❌ Erro no rollback:', error);
  }
}

// Endpoint principal
app.post('/api/notes/generate', async (req, res) => {
  let noteId = null;
  const tempFiles = [];

  try {
    console.log('🚀 Iniciando geração de nota fiscal...');

    // 1. Validação de autenticação
    const auth = await validateAuth(req.headers.authorization);
    console.log(`✅ Usuário autenticado: ${auth.user.email} (${auth.role})`);

    // 2. Validação do payload
    const payload = validatePayload(req.body);
    console.log(`✅ Payload validado para report: ${payload.report_id}`);

    // 3. Validação do report
    const report = await validateReport(payload.report_id);
    console.log(`✅ Report validado: ${report.id}`);

    // 4. Verificar se já existe nota
    const hasExistingNote = await checkExistingNote(payload.report_id);
    if (hasExistingNote) {
      return res.status(409).json({
        ok: false,
        message: 'Já existe uma nota fiscal para este report'
      });
    }

    // 5. Criar nota no banco
    const note = await createNote(payload, payload.report_id);
    noteId = note.id;
    console.log(`✅ Nota criada: ${note.nf_number}`);

    // 6. Preparar dados para template
    const mapping = {
      '{{LOGO}}': '', // Será tratado pelo helper
      '{{FONE}}': payload.phone,
      '{{DATA_EMISSAO}}': payload.nf_date,
      '{{EMPRESA}}': payload.company_name,
      '{{ENDERECO}}': payload.address,
      '{{CNPJ_CPF}}': payload.cnpj_cpf,
      '{{MUNICIPIO}}': payload.city,
      '{{CEP}}': payload.cep,
      '{{UF}}': payload.uf,
      '{{FATURA_NUMERO}}': note.nf_number,
      '{{VALOR}}': payload.nf_value.toFixed(2).replace('.', ','),
      '{{VENCIMENTO}}': payload.nf_due_date,
      '{{DESCRIMINACAO}}': payload.descricao,
      '{{OBSERVACOES}}': payload.obs || ''
    };

    // 7. Caminhos dos arquivos
    const templatePath = path.join(__dirname, 'templates', 'fatura_template.xlsx');
    const logoPath = path.join(__dirname, 'public', 'logos', `${payload.company_logo}.png`);
    const tempXlsxPath = `/tmp/fatura-${note.nf_number}.xlsx`;
    const tempPdfPath = `/tmp/fatura-${note.nf_number}.pdf`;

    tempFiles.push(tempXlsxPath, tempPdfPath);

    // 8. Verificar se template existe
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template não encontrado: ${templatePath}`);
    }

    // 9. Gerar XLSX
    console.log('📊 Gerando arquivo XLSX...');
    await fillTemplate({
      templatePath,
      outputXlsxPath: tempXlsxPath,
      mapping,
      logoPath
    });

    // 10. Converter para PDF
    console.log('📄 Convertendo para PDF...');
    await convertXlsxToPdf(tempXlsxPath, tempPdfPath, mapping);

    // 11. Upload para Supabase Storage
    const year = new Date().getFullYear();
    const xlsxStoragePath = `invoices/${year}/${note.nf_number}/${note.nf_number}.xlsx`;
    const pdfStoragePath = `invoices/${year}/${note.nf_number}/${note.nf_number}.pdf`;

    const xlsxUrl = await uploadToStorage(tempXlsxPath, xlsxStoragePath);
    const pdfUrl = await uploadToStorage(tempPdfPath, pdfStoragePath);

    // 12. Atualizar caminhos na nota
    await updateNotePaths(noteId, xlsxStoragePath, pdfStoragePath);

    // 13. Limpar arquivos temporários
    cleanupTempFiles(tempFiles);

    // 14. Resposta de sucesso
    console.log('✅ Nota fiscal gerada com sucesso!');
    res.json({
      ok: true,
      note: {
        ...note,
        file_xlsx_path: xlsxStoragePath,
        file_pdf_path: pdfStoragePath
      },
      download_xlsx_url: xlsxUrl,
      download_pdf_url: pdfUrl
    });

  } catch (error) {
    console.error('❌ Erro na geração da nota:', error);

    // Rollback: remover nota se foi criada
    if (noteId) {
      await rollbackNote(noteId);
    }

    // Limpar arquivos temporários
    cleanupTempFiles(tempFiles);

    res.status(500).json({
      ok: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'notes-generate'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`📄 Endpoint: http://localhost:${PORT}/api/notes/generate`);
});

export default app;
