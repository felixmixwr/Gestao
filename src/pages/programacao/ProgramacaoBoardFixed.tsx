import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgramacaoAPI } from '../../lib/programacao-api';
import { Programacao, ProgramacaoFilters } from '../../types/programacao';
import { toast } from '../../lib/toast-hooks';
import { Layout } from '../../components/Layout';
import { Loading } from '../../components/Loading';
import { Button } from '../../components/Button';
import { Select } from '../../components/Select';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface BoardColumn {
  id: string;
  title: string;
  date: string;
  programacoes: Programacao[];
}

export default function ProgramacaoBoardFixed() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [bombas, setBombas] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  
  const [filters, setFilters] = useState<ProgramacaoFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ show: boolean; programacao: Programacao | null }>({
    show: false,
    programacao: null
  });

  // Gerar colunas para os próximos 7 dias
  const generateColumns = useCallback((programacoes: Programacao[]): BoardColumn[] => {
    const today = new Date();
    const columns: BoardColumn[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const dayName = dayNames[date.getDay()];
      const dayNumber = date.getDate();
      const monthNumber = date.getMonth() + 1;
      
      // Filtrar programações do dia
      const dayProgramacoes = programacoes.filter(p => p.data === dateStr);
      
      columns.push({
        id: dateStr,
        title: `${dayName} ${dayNumber}/${monthNumber}`,
        date: dateStr,
        programacoes: dayProgramacoes.sort((a, b) => a.horario.localeCompare(b.horario))
      });
    }

    return columns;
  }, []);

  const loadProgramacoes = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar programações dos próximos 7 dias
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);
      
      const startDateStr = today.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      console.log('Buscando programações de', startDateStr, 'até', endDateStr);
      const data = await ProgramacaoAPI.getByPeriod(startDateStr, endDateStr);
      console.log('Programações encontradas:', data);
      
      // Aplicar filtros
      let filteredData = data;
      
      if (filters.company_id) {
        filteredData = filteredData.filter(p => p.company_id === filters.company_id);
      }
      if (filters.bomba_id) {
        filteredData = filteredData.filter(p => p.bomba_id === filters.bomba_id);
      }
      if (filters.colaborador_id) {
        filteredData = filteredData.filter(p => 
          p.auxiliares_bomba?.includes(filters.colaborador_id!) ||
          p.motorista_operador === filters.colaborador_id
        );
      }
      if (searchTerm) {
        filteredData = filteredData.filter(p => 
          p.prefixo_obra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.endereco.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setColumns(generateColumns(filteredData));
    } catch (error) {
      console.error('Erro ao carregar programações:', error);
      toast.error('Erro ao carregar programações');
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm, generateColumns]);

  const loadInitialData = async () => {
    try {
      const [empresasData, bombasData, colaboradoresData] = await Promise.all([
        ProgramacaoAPI.getEmpresas(),
        ProgramacaoAPI.getBombas(),
        ProgramacaoAPI.getColaboradores(),
      ]);

      console.log('Dados iniciais carregados:', { empresasData, bombasData, colaboradoresData });
      setEmpresas(empresasData);
      setBombas(bombasData);
      setColaboradores(colaboradoresData);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  };

  useEffect(() => {
    loadInitialData();
    loadProgramacoes();
  }, [loadProgramacoes]);

  const handleEditProgramacao = (programacao: Programacao) => {
    navigate(`/programacao/${programacao.id}`);
  };

  const handleDeleteProgramacao = (programacao: Programacao) => {
    setDeleteDialog({ show: true, programacao });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.programacao) return;

    try {
      await ProgramacaoAPI.delete(deleteDialog.programacao.id);
      toast.success('Programação excluída com sucesso!');
      loadProgramacoes();
    } catch (error) {
      toast.error('Erro ao excluir programação');
      console.error(error);
    } finally {
      setDeleteDialog({ show: false, programacao: null });
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM
  };

  const formatAddress = (endereco: string, numero: string, bairro?: string) => {
    let address = `${endereco}, ${numero}`;
    if (bairro) {
      address += `, ${bairro}`;
    }
    return address.length > 50 ? address.substring(0, 50) + '...' : address;
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
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Programação de Obras</h1>
              <p className="text-gray-600 mt-2">
                Quadro interativo para gerenciar programações de obras e bombas
              </p>
            </div>
            <Button onClick={() => navigate('/programacao/nova')}>
              Nova Programação
            </Button>
          </div>

          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa
                </label>
                <Select
                  value={filters.company_id || ''}
                  onChange={(value) => setFilters(prev => ({ ...prev, company_id: value || undefined }))}
                  options={[
                    { value: '', label: 'Todas as empresas' },
                    ...empresas.map(empresa => ({
                      value: empresa.id,
                      label: empresa.name
                    }))
                  ]}
                  placeholder="Filtrar por empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bomba
                </label>
                <Select
                  value={filters.bomba_id || ''}
                  onChange={(value) => setFilters(prev => ({ ...prev, bomba_id: value || undefined }))}
                  options={[
                    { value: '', label: 'Todas as bombas' },
                    ...bombas.map(bomba => ({
                      value: bomba.id,
                      label: `${bomba.is_terceira ? '🔗 ' : ''}${bomba.name} - ${bomba.model}`
                    }))
                  ]}
                  placeholder="Filtrar por bomba"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colaborador
                </label>
                <Select
                  value={filters.colaborador_id || ''}
                  onChange={(value) => setFilters(prev => ({ ...prev, colaborador_id: value || undefined }))}
                  options={[
                    { value: '', label: 'Todos os colaboradores' },
                    ...colaboradores.map(colaborador => ({
                      value: colaborador.id,
                      label: colaborador.nome
                    }))
                  ]}
                  placeholder="Filtrar por colaborador"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Prefixo, cliente, endereço..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="overflow-x-auto">
          <div className="flex space-x-4 min-w-max">
            {columns.map((column) => (
              <div key={column.id} className="flex-shrink-0 w-80">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 text-center">
                    {column.title}
                  </h3>
                  
                  <div className="min-h-96 space-y-3">
                    {column.programacoes.map((programacao) => (
                      <div
                        key={programacao.id}
                        className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500"
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {programacao.prefixo_obra}
                            </h4>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEditProgramacao(programacao)}
                                className="text-blue-600 hover:text-blue-800 text-xs"
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteProgramacao(programacao)}
                                className="text-red-600 hover:text-red-800 text-xs"
                                title="Excluir"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <p className="font-medium">{programacao.cliente}</p>
                            <p className="text-xs">⏰ {formatTime(programacao.horario)}</p>
                            <p className="text-xs">📍 {formatAddress(
                              programacao.endereco,
                              programacao.numero,
                              programacao.bairro
                            )}</p>
                            
                            {programacao.motorista_nome && (
                              <p className="text-xs">
                                🚗 {programacao.motorista_nome}
                              </p>
                            )}
                            
                            {programacao.auxiliares_nomes && programacao.auxiliares_nomes.length > 0 && (
                              <p className="text-xs">
                                👥 {programacao.auxiliares_nomes.join(', ')}
                              </p>
                            )}
                            
                            {programacao.volume_previsto && (
                              <p className="text-xs">
                                📦 {programacao.volume_previsto}m³
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {column.programacoes.length === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        <p className="text-sm">Nenhuma programação</p>
                        <p className="text-xs">Crie uma nova programação</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog.show}
          onCancel={() => setDeleteDialog({ show: false, programacao: null })}
          onConfirm={confirmDelete}
          title="Excluir Programação"
          message={`Tem certeza que deseja excluir a programação "${deleteDialog.programacao?.prefixo_obra}"?`}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
        />
      </div>
    </Layout>
  );
}

