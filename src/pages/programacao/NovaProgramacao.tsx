import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProgramacaoAPI } from '../../lib/programacao-api';
import { useViaCep } from '../../lib/viacep-api';
import { ProgramacaoFormData } from '../../types/programacao';
import { toast } from '../../lib/toast-hooks';
// import { toBrasiliaISOString } from '../../utils/date-utils';
import { Layout } from '../../components/Layout';
import { Loading } from '../../components/Loading';
import { Button } from '../../components/Button';
import { DatePicker } from '../../components/ui/date-picker';
// Removidos imports não utilizados após mudança para layout do reports
import { ColaboradorOption, BombaOption, EmpresaOption, ClienteOption } from '../../types/programacao';
import { ErrorBoundary } from './ErrorBoundary';
import { useAuth } from '../../lib/auth-hooks';
import { supabase } from '../../lib/supabase';

const BritaOptions = [
  { value: '0', label: '0' },
  { value: '1', label: '1' },
  { value: '0+1', label: '0+1' },
];

const FCKOptions = [
  { value: '15', label: '15' },
  { value: '18', label: '18' },
  { value: '20', label: '20' },
  { value: '25', label: '25' },
  { value: '30', label: '30' },
  { value: '35', label: '35' },
  { value: '40', label: '40' },
  { value: '45', label: '45' },
  { value: '50', label: '50' },
];

const SlumpOptions = [
  { value: '10+/-2', label: '10+/-2' },
  { value: '12+/-2', label: '12+/-2' },
  { value: '14+/-2', label: '14+/-2' },
  { value: '16+/-2', label: '16+/-2' },
  { value: '18+/-2', label: '18+/-2' },
  { value: '20+/-2', label: '20+/-2' },
  { value: '22+/-2', label: '22+/-2' },
];

function NovaProgramacaoContent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { buscarCEP, validarCEP, formatarCEP } = useViaCep();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [colaboradores, setColaboradores] = useState<ColaboradorOption[]>([]);
  const [bombas, setBombas] = useState<BombaOption[]>([]);

  const [formData, setFormData] = useState<ProgramacaoFormData>({
    prefixo_obra: '',
    data: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
    horario: '',
    cliente_id: '',
    cliente: '', // Nome do cliente para compatibilidade
    responsavel: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    volume_previsto: undefined,
    fck: '',
    brita: '',
    slump: '',
    motorista_operador: '',
    auxiliares_bomba: [''], // Começa com um auxiliar vazio
    bomba_id: '',
    status: 'programado', // Status padrão
    company_id: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = Boolean(id);

  useEffect(() => {
    loadInitialData();
    if (isEditing && id) {
      loadProgramacao(id);
    }
  }, [id, isEditing]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Iniciando carregamento de dados iniciais...');
      
      // Obter company_id do usuário logado
      let userCompanyId = '';
      if (user?.id) {
        console.log('🔍 Buscando company_id do usuário...');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('❌ Erro ao buscar company_id do usuário:', userError);
        } else {
          userCompanyId = userData?.company_id || '';
          console.log('✅ Company ID encontrado:', userCompanyId);
        }
      }
      
      console.log('👥 Buscando clientes...');
      const clientesData = await ProgramacaoAPI.getClientes();
      console.log('✅ Clientes carregados:', clientesData);
      
      console.log('📊 Buscando empresas...');
      const empresasData = await ProgramacaoAPI.getEmpresas();
      console.log('✅ Empresas carregadas:', empresasData);
      
      console.log('👥 Buscando colaboradores...');
      const colaboradoresData = await ProgramacaoAPI.getColaboradores();
      console.log('✅ Colaboradores carregados:', colaboradoresData);
      
      console.log('🚰 Buscando bombas...');
      const bombasData = await ProgramacaoAPI.getBombas();
      console.log('✅ Bombas carregadas:', bombasData);

      setClientes(clientesData);
      setEmpresas(empresasData);
      setColaboradores(colaboradoresData);
      setBombas(bombasData);

      // Definir company_id automaticamente se encontrado
      if (userCompanyId) {
        console.log('🔧 Definindo company_id automaticamente:', userCompanyId);
        setFormData(prev => ({
          ...prev,
          company_id: userCompanyId
        }));
      }

      // Se não está editando e há apenas uma empresa, selecionar automaticamente
      if (!isEditing && empresasData.length === 1) {
        setFormData(prev => ({ ...prev, company_id: empresasData[0].id }));
      }
      
      console.log('🎉 Todos os dados carregados com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao carregar dados iniciais:', error);
      toast.error(`Erro ao carregar dados iniciais: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadProgramacao = async (programacaoId: string) => {
    setLoading(true);
    try {
      const data = await ProgramacaoAPI.getById(programacaoId);
      if (data) {
        // Buscar nome do cliente se temos cliente_id
        let clienteNome = '';
        if (data.cliente_id) {
          const cliente = clientes.find(c => c.id === data.cliente_id);
          clienteNome = cliente?.name || '';
        }

        setFormData({
          prefixo_obra: data.prefixo_obra || '',
          data: data.data,
          horario: data.horario,
          cliente_id: data.cliente_id || data.cliente || '', // Compatibilidade com dados antigos
          cliente: clienteNome || data.cliente || '', // Nome do cliente para compatibilidade
          responsavel: data.responsavel || '',
          cep: data.cep,
          endereco: data.endereco,
          numero: data.numero,
          bairro: data.bairro || '',
          cidade: data.cidade || '',
          estado: data.estado || '',
          volume_previsto: data.volume_previsto,
          fck: data.fck || '',
          brita: data.brita || '',
          slump: data.slump || '',
          motorista_operador: data.motorista_operador || '',
          auxiliares_bomba: data.auxiliares_bomba && data.auxiliares_bomba.length > 0 ? data.auxiliares_bomba : [''],
          bomba_id: data.bomba_id || '',
          status: data.status || 'programado', // Status padrão para dados antigos
          company_id: data.company_id,
        });
      } else {
        toast.error('Programação não encontrada');
        navigate('/programacao/board');
      }
    } catch (error) {
      toast.error('Erro ao carregar programação');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProgramacaoFormData, value: string | number | string[] | undefined) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Se mudou o cliente_id, preencher automaticamente o nome do cliente
      if (field === 'cliente_id' && typeof value === 'string') {
        const cliente = clientes.find(c => c.id === value);
        if (cliente) {
          newData.cliente = cliente.name;
        }
      }
      
      return newData;
    });
    
    // Limpar erro do campo quando usuário digita
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addAssistant = () => {
    setFormData(prev => ({
      ...prev,
      auxiliares_bomba: [...(prev.auxiliares_bomba || []), '']
    }))
  }

  const removeAssistant = (index: number) => {
    if ((formData.auxiliares_bomba || []).length > 1) {
      setFormData(prev => ({
        ...prev,
        auxiliares_bomba: (prev.auxiliares_bomba || []).filter((_, i) => i !== index)
      }))
    }
  }

  const updateAssistant = (index: number, assistantId: string) => {
    setFormData(prev => ({
      ...prev,
      auxiliares_bomba: (prev.auxiliares_bomba || []).map((assistant, i) => 
        i === index ? assistantId : assistant
      )
    }))
  }

  const handleCEPSearch = async (cep: string) => {
    if (!validarCEP(cep)) {
      setErrors(prev => ({ ...prev, cep: 'CEP deve ter 8 dígitos' }));
      return;
    }

    setLoadingCEP(true);
    try {
      const result = await buscarCEP(cep);
      if (result.success && result.data) {
        const { data } = result;
        setFormData(prev => ({
          ...prev,
          cep: formatarCEP(cep),
          endereco: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
        }));
        setErrors(prev => ({ ...prev, cep: '' }));
      } else {
        setErrors(prev => ({ ...prev, cep: result.error || 'CEP não encontrado' }));
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, cep: 'Erro ao buscar CEP' }));
    } finally {
      setLoadingCEP(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Campos obrigatórios baseados no status
    const isReservado = formData.status === 'reservado';
    
    // Campos sempre obrigatórios
    if (!formData.cliente_id) {
      newErrors.cliente_id = 'Cliente é obrigatório';
    }
    if (!formData.responsavel?.trim()) {
      newErrors.responsavel = 'Responsável é obrigatório';
    }
    if (!formData.company_id) {
      newErrors.company_id = 'Empresa é obrigatória';
    }

    // Campos obrigatórios apenas para status "programado"
    if (!isReservado) {
      if (!formData.data) {
        newErrors.data = 'Data é obrigatória';
      }
      if (!formData.horario) {
        newErrors.horario = 'Horário é obrigatório';
      }
      if (!formData.cep.trim()) {
        newErrors.cep = 'CEP é obrigatório';
      }
      if (!formData.endereco.trim()) {
        newErrors.endereco = 'Endereço é obrigatório';
      }
      if (!formData.numero.trim()) {
        newErrors.numero = 'Número é obrigatório';
      }

      // Validação de auxiliares apenas para "programado"
      const auxiliaresSelecionados = formData.auxiliares_bomba?.filter(id => id && id.trim() !== '') || [];
      if (auxiliaresSelecionados.length < 1) {
        newErrors.auxiliares_bomba = 'É necessário selecionar pelo menos 1 auxiliar';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    // Validação adicional para company_id
    if (!formData.company_id || formData.company_id.trim() === '') {
      toast.error('Erro: Company ID não encontrado. Por favor, recarregue a página.');
      console.error('❌ [NovaProgramacao] Company ID vazio:', formData.company_id);
      return;
    }

    setSaving(true);
    try {
      // Debug: mostrar dados antes de enviar
      console.log('🔍 [NovaProgramacao] Dados do formulário:', formData);
      console.log('🔍 [NovaProgramacao] Company ID:', formData.company_id);
      console.log('🔍 [NovaProgramacao] Data selecionada:', formData.data);
      console.log('🔍 [NovaProgramacao] Data atual do sistema:', new Date().toISOString().split('T')[0]);
      
      // Enviar dados como estão - a data já está no formato correto (YYYY-MM-DD)
      if (isEditing && id) {
        await ProgramacaoAPI.update(id, formData);
        toast.success('Programação atualizada com sucesso!');
      } else {
        await ProgramacaoAPI.create(formData);
        toast.success('Programação criada com sucesso!');
      }
      navigate('/programacao/board');
    } catch (error) {
      toast.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} programação`);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Programação' : 'Nova Programação'}
          </h1>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/programacao/board'}
          >
            Voltar
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Seção 1 - Dados da Obra */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Dados da Obra</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prefixo da Obra */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prefixo da Obra (opcional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.prefixo_obra}
                  onChange={(e) => handleInputChange('prefixo_obra', e.target.value)}
                  placeholder="Ex: OBR-2024-001"
                />
                {errors.prefixo_obra && (
                  <p className="mt-1 text-sm text-red-600">{errors.prefixo_obra}</p>
                )}
              </div>

              {/* Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.cliente_id}
                  onChange={(e) => handleInputChange('cliente_id', e.target.value)}
                >
                  <option value="">Selecione o cliente</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.company_name || cliente.name}
                    </option>
                  ))}
                </select>
                {errors.cliente_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.cliente_id}</p>
                )}
              </div>

              {/* Responsável */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsável
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.responsavel}
                  onChange={(e) => handleInputChange('responsavel', e.target.value)}
                  placeholder="Nome do responsável"
                />
                {errors.responsavel && (
                  <p className="mt-1 text-sm text-red-600">{errors.responsavel}</p>
                )}
              </div>

              {/* Empresa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.company_id}
                  onChange={(e) => handleInputChange('company_id', e.target.value)}
                >
                  <option value="">Selecione a empresa</option>
                  {empresas.map(empresa => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.name}
                    </option>
                  ))}
                </select>
                {errors.company_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.company_id}</p>
                )}
              </div>

              {/* Status da Programação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status da Programação *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as 'programado' | 'reservado')}
                >
                  <option value="programado">Programado (todos os campos obrigatórios)</option>
                  <option value="reservado">Reservado (apenas cliente, responsável e telefone obrigatórios)</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                )}
              </div>
            </div>
          </div>

          {/* Seção 2 - Data e Horário */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Data e Horário
              {formData.status === 'reservado' && (
                <span className="ml-2 text-sm text-gray-500 font-normal">(opcional para reservas)</span>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data */}
              <DatePicker
                value={formData.data}
                onChange={(value) => handleInputChange('data', value)}
                label={`Data${formData.status === 'programado' ? ' *' : ''}`}
                required={formData.status === 'programado'}
                error={errors.data}
              />

              {/* Horário */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário{formData.status === 'programado' ? ' *' : ''}
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.horario}
                  onChange={(e) => handleInputChange('horario', e.target.value)}
                />
                {errors.horario && (
                  <p className="mt-1 text-sm text-red-600">{errors.horario}</p>
                )}
              </div>
            </div>
          </div>

          {/* Seção 3 - Endereço */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Endereço
              {formData.status === 'reservado' && (
                <span className="ml-2 text-sm text-gray-500 font-normal">(opcional para reservas)</span>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* CEP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP{formData.status === 'programado' ? ' *' : ''}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.cep}
                  onChange={(e) => handleInputChange('cep', e.target.value)}
                  onBlur={(e) => handleCEPSearch(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                />
                {loadingCEP && (
                  <p className="text-sm text-blue-600 mt-1">Buscando...</p>
                )}
                {errors.cep && (
                  <p className="mt-1 text-sm text-red-600">{errors.cep}</p>
                )}
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço{formData.status === 'programado' ? ' *' : ''}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  placeholder="Rua, Avenida, etc."
                />
                {errors.endereco && (
                  <p className="mt-1 text-sm text-red-600">{errors.endereco}</p>
                )}
              </div>

              {/* Número */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número{formData.status === 'programado' ? ' *' : ''}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                  placeholder="123"
                />
                {errors.numero && (
                  <p className="mt-1 text-sm text-red-600">{errors.numero}</p>
                )}
              </div>

              {/* Bairro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bairro
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  placeholder="Nome do bairro"
                />
                {errors.bairro && (
                  <p className="mt-1 text-sm text-red-600">{errors.bairro}</p>
                )}
              </div>

              {/* Cidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                  placeholder="Nome da cidade"
                />
                {errors.cidade && (
                  <p className="mt-1 text-sm text-red-600">{errors.cidade}</p>
                )}
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  placeholder="UF"
                  maxLength={2}
                />
                {errors.estado && (
                  <p className="mt-1 text-sm text-red-600">{errors.estado}</p>
                )}
              </div>
            </div>
          </div>

          {/* Seção 4 - Concreto */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Concreto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Volume Previsto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Volume Previsto (m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.volume_previsto || ''}
                  onChange={(e) => handleInputChange('volume_previsto', parseFloat(e.target.value) || undefined)}
                  placeholder="0.0"
                />
                {errors.volume_previsto && (
                  <p className="mt-1 text-sm text-red-600">{errors.volume_previsto}</p>
                )}
              </div>

              {/* FCK */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  FCK (MPA)
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.fck || ''}
                  onChange={(e) => handleInputChange('fck', e.target.value)}
                >
                  <option value="">Selecione o FCK</option>
                  {FCKOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.fck && (
                  <p className="mt-1 text-sm text-red-600">{errors.fck}</p>
                )}
              </div>

              {/* Brita */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brita
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.brita || ''}
                  onChange={(e) => handleInputChange('brita', e.target.value)}
                >
                  <option value="">Selecione a brita</option>
                  {BritaOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.brita && (
                  <p className="mt-1 text-sm text-red-600">{errors.brita}</p>
                )}
              </div>

              {/* Slump */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slump
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.slump || ''}
                  onChange={(e) => handleInputChange('slump', e.target.value)}
                >
                  <option value="">Selecione o slump</option>
                  {SlumpOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.slump && (
                  <p className="mt-1 text-sm text-red-600">{errors.slump}</p>
                )}
              </div>
            </div>
          </div>

          {/* Seção 5 - Equipe e Bomba */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Equipe</h3>
            <div className="space-y-6">
              {/* Motorista */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motorista Operador da Bomba
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.motorista_operador || ''}
                  onChange={(e) => handleInputChange('motorista_operador', e.target.value)}
                >
                  <option value="">Selecione um motorista</option>
                  {colaboradores
                    .filter(colaborador => colaborador.funcao === 'Motorista Operador de Bomba')
                    .map(colaborador => (
                      <option key={colaborador.id} value={colaborador.id}>
                        {colaborador.nome}
                      </option>
                    ))}
                </select>
                {errors.motorista_operador && (
                  <p className="mt-1 text-sm text-red-600">{errors.motorista_operador}</p>
                )}
              </div>

              {/* Auxiliares Dinâmicos */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Auxiliares
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAssistant}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    + Adicionar Auxiliar
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {(formData.auxiliares_bomba || []).map((assistant, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Auxiliar {index + 1}
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={assistant}
                          onChange={(e) => updateAssistant(index, e.target.value)}
                        >
                          <option value="">Selecione um auxiliar</option>
                          {colaboradores
                            .filter(colaborador => colaborador.funcao === 'Auxiliar de Bomba')
                            .map(colaborador => (
                              <option key={colaborador.id} value={colaborador.id}>
                                {colaborador.nome}
                              </option>
                            ))}
                        </select>
                      </div>
                      {(formData.auxiliares_bomba || []).length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAssistant(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-6"
                        >
                          🗑️
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                {errors.auxiliares_bomba && (
                  <p className="mt-1 text-sm text-red-600">{errors.auxiliares_bomba}</p>
                )}
              </div>

              {/* Bomba */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bomba
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.bomba_id || ''}
                  onChange={(e) => handleInputChange('bomba_id', e.target.value)}
                >
                  <option value="">Selecione a bomba</option>
                  {bombas.map(bomba => (
                    <option key={bomba.id} value={bomba.id}>
                      {bomba.is_terceira ? '🔗 ' : ''}{bomba.prefix} - {bomba.model} ({bomba.brand})
                    </option>
                  ))}
                </select>
                {errors.bomba_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.bomba_id}</p>
                )}
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/programacao/board')}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default function NovaProgramacao() {
  return (
    <ErrorBoundary>
      <NovaProgramacaoContent />
    </ErrorBoundary>
  );
}
