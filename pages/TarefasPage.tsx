
import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeTarefas, IconeSparkles, IconeDocumentos, IconeEmpresa, IconeLixeira, IconeLink } from '../components/common/Icons';
import {
    Tarefa, PrioridadeTarefa, StatusTarefa, Usuario, FuncaoUsuario, Empresa,
    RecorrenciaConfig, DocumentoVinculado, TiposRecorrencia, DIAS_SEMANA_MAP, MESES_MAP, Documento,
    TipoAcaoAuditoria, ModuloSistemaAuditavel
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import { logAction } from '../services/LogService';
import { STORAGE_KEY_DOCUMENTOS_PREFIX } from './DocumentosPage';
import { GoogleGenerativeAI as GoogleGenAI, GenerateContentResponse } from "@google/genai";

const usuariosMock: Pick<Usuario, 'id' | 'nome'>[] = [
  { id: 'user-ana', nome: 'Ana Silva (Escritório)' },
  { id: 'user-joao', nome: 'João Costa (Escritório)' },
  { id: 'user-maria-cli', nome: 'Maria Oliveira (Cliente ABC)' },
  { id: 'user-carlos-cli', nome: 'Carlos Pereira (Cliente XYZ)' },
];

export const STORAGE_KEY_TAREFAS = 'nixconPortalTarefas';
const STORAGE_KEY_PREFIX_EMPRESAS = 'nixconPortalEmpresas_';

const inputBaseClasses = "px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm";
const inputStyles = `${inputBaseClasses} bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400`;
const selectStyles = `${inputBaseClasses} bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`;
const checkboxLabelStyles = "ml-2 block text-sm text-gray-700 dark:text-gray-300";

// Initialize Gemini API
const API_KEY = process.env.API_KEY;
let ai: GoogleGenAI | null = null; 
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY }); 
} else {
  console.warn("API Key for Gemini not found. AI features will be limited.");
}

const TarefasPage: React.FC = () => {
  const { usuarioAtual, tenantAtual, personificandoInfo, activeClientCompanyContext } = useAuth();
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [empresasClientes, setEmpresasClientes] = useState<Empresa[]>([]);
  const [modalTarefaAberto, setModalTarefaAberto] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState<Partial<Tarefa> | null>(null);
  const [tarefaOriginalParaLog, setTarefaOriginalParaLog] = useState<Tarefa | null>(null);
  const [sugerindoDescricao, setSugerindoDescricao] = useState(false);
  const [sugestaoErro, setSugestaoErro] = useState<string | null>(null);


  const [documentosDoTenantParaSelecao, setDocumentosDoTenantParaSelecao] = useState<Documento[]>([]);
  const [modalSelecionarDocumentoAberto, setModalSelecionarDocumentoAberto] = useState(false);
  const [documentosSelecionadosTemporariamente, setDocumentosSelecionadosTemporariamente] = useState<string[]>([]);
  const [modalDetalhesDocVinculadoAberto, setModalDetalhesDocVinculadoAberto] = useState(false);
  const [documentoParaDetalhes, setDocumentoParaDetalhes] = useState<Documento | null>(null);

  const [filtroResponsavelId, setFiltroResponsavelId] = useState<string>('');
  const [filtroPrioridade, setFiltroPrioridade] = useState<PrioridadeTarefa | ''>('');
  const [filtroStatus, setFiltroStatus] = useState<StatusTarefa | ''>('');
  const [filtroClienteEmpresaId, setFiltroClienteEmpresaId] = useState<string>('');

  const getEffectiveTenantId = () => {
    if (personificandoInfo) return personificandoInfo.empresaId;
    if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && usuarioAtual.tenantId) {
        return usuarioAtual.tenantId;
    }
    if (activeClientCompanyContext && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN)) {
        return activeClientCompanyContext.id;
    }
    return usuarioAtual?.tenantId || tenantAtual?.id;
  };

  const effectiveTenantId = useMemo(getEffectiveTenantId, [personificandoInfo, usuarioAtual, activeClientCompanyContext, tenantAtual]);
  const tenantIdEscritorio = useMemo(() => tenantAtual?.id, [tenantAtual]);

  useEffect(() => {
    const tarefasSalvas = localStorage.getItem(STORAGE_KEY_TAREFAS);
    if (tarefasSalvas) {
      setTarefas(JSON.parse(tarefasSalvas));
    }
    if (tenantAtual) {
      const storageKeyEmpresas = `${STORAGE_KEY_PREFIX_EMPRESAS}${tenantAtual.id}`;
      const empresasSalvas = localStorage.getItem(storageKeyEmpresas);
      if (empresasSalvas) {
        setEmpresasClientes(JSON.parse(empresasSalvas));
      }
    }
  }, [tenantAtual]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TAREFAS, JSON.stringify(tarefas));
  }, [tarefas]);

  const podeGerenciarRecorrenciaEClientes = useMemo(() => {
    return (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN) && !personificandoInfo && !activeClientCompanyContext;
  }, [usuarioAtual, personificandoInfo, activeClientCompanyContext]);

  const handleAbrirModalTarefa = (tarefa?: Tarefa) => {
    setSugestaoErro(null); // Limpa erro de sugestão ao abrir modal
    let tenantIdAtualVisualizado = effectiveTenantId;
    let clienteIdPreSelecionado: string | undefined = undefined;
    let clienteNomePreSelecionado: string | undefined = undefined;

    if (activeClientCompanyContext && !tarefa?.id) {
        tenantIdAtualVisualizado = tenantAtual?.id;
        clienteIdPreSelecionado = activeClientCompanyContext.id;
        clienteNomePreSelecionado = activeClientCompanyContext.nome;
    } else if (tarefa?.clienteEmpresaId && tenantAtual) {
        tenantIdAtualVisualizado = tenantAtual.id;
        clienteIdPreSelecionado = tarefa.clienteEmpresaId;
        clienteNomePreSelecionado = tarefa.clienteEmpresaNome;
    } else if (!tarefa?.id && !activeClientCompanyContext && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_CLIENTE || usuarioAtual?.funcao === FuncaoUsuario.USUARIO_CLIENTE || usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE)) {
      tenantIdAtualVisualizado = usuarioAtual.tenantId;
    }

    const tenantParaDocumentos = tarefa?.clienteEmpresaId || activeClientCompanyContext?.id || effectiveTenantId;
    if (tenantParaDocumentos) {
      const storageKeyDocs = `${STORAGE_KEY_DOCUMENTOS_PREFIX}${tenantParaDocumentos}`;
      const docsSalvos = localStorage.getItem(storageKeyDocs);
      setDocumentosDoTenantParaSelecao(docsSalvos ? JSON.parse(docsSalvos) : []);
    } else {
      setDocumentosDoTenantParaSelecao([]);
    }

    if (tarefa) {
      setTarefaOriginalParaLog({ ...tarefa });
      setTarefaEditando({
        ...tarefa,
        recorrencia: tarefa.recorrencia ? {...tarefa.recorrencia} : undefined,
        documentosVinculados: tarefa.documentosVinculados ? [...tarefa.documentosVinculados.map(d => ({...d}))] : []
      });
    } else {
      setTarefaOriginalParaLog(null);
      setTarefaEditando({
        titulo: '',
        descricao: '',
        prioridade: 'MEDIA',
        status: 'PENDENTE',
        prazo: new Date().toISOString().split('T')[0],
        tenantId: tenantIdAtualVisualizado,
        clienteEmpresaId: clienteIdPreSelecionado,
        clienteEmpresaNome: clienteNomePreSelecionado,
        recorrencia: undefined,
        documentosVinculados: [],
      });
    }
    setModalTarefaAberto(true);
  };

  const handleFecharModalTarefa = () => {
    setModalTarefaAberto(false);
    setTarefaEditando(null);
    setTarefaOriginalParaLog(null);
    setSugerindoDescricao(false);
    setSugestaoErro(null); // Limpa erro ao fechar
    setModalSelecionarDocumentoAberto(false);
    setDocumentosSelecionadosTemporariamente([]);
  };

  const handleChangeTarefaEditando = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setTarefaEditando(prev => {
      if (!prev) return null;
      if (name.startsWith("recorrencia.")) {
        const campoRecorrencia = name.split(".")[1] as keyof RecorrenciaConfig;
        let processedValue: any = value;
        if (campoRecorrencia === 'tipo') {
            processedValue = value as TiposRecorrencia;
        } else if (['intervalo', 'diaDaSemana', 'diaDoMes', 'mes'].includes(campoRecorrencia)) {
            const num = parseInt(value, 10);
            processedValue = isNaN(num) ? undefined : num;
        }

        const novaRecorrencia = {
            ...(prev.recorrencia || { tipo: TiposRecorrencia.MENSAL, intervalo: 1 }),
            [campoRecorrencia]: processedValue
        };

        if (campoRecorrencia === 'tipo' && processedValue === TiposRecorrencia.DIARIA) {
            delete novaRecorrencia.diaDaSemana;
            delete novaRecorrencia.diaDoMes;
            delete novaRecorrencia.mes;
        }
        return { ...prev, recorrencia: novaRecorrencia };
      }
      if (name === 'clienteEmpresaId') {
        const clienteSelecionado = empresasClientes.find(c => c.id === value);
        return { ...prev, clienteEmpresaId: value, clienteEmpresaNome: clienteSelecionado?.nome || '' };
      }
      return { ...prev, [name]: type === 'checkbox' ? checked : value };
    });
  };

  const handleToggleRecorrencia = (e: ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setTarefaEditando(prev => {
      if (!prev) return null;
      if (isChecked) {
        return { ...prev, recorrencia: prev.recorrencia || { tipo: TiposRecorrencia.MENSAL, diaDoMes: 1, intervalo: 1 } };
      } else {
        const { recorrencia, ...resto } = prev;
        return resto;
      }
    });
  };

  const handleAbrirModalSelecionarDocumento = () => {
    const tenantIdParaDocumentos = tarefaEditando?.clienteEmpresaId || activeClientCompanyContext?.id || effectiveTenantId;
    if (tenantIdParaDocumentos) {
      const storageKeyDocs = `${STORAGE_KEY_DOCUMENTOS_PREFIX}${tenantIdParaDocumentos}`;
      const docsSalvos = localStorage.getItem(storageKeyDocs);
      setDocumentosDoTenantParaSelecao(docsSalvos ? JSON.parse(docsSalvos) : []);
    } else {
      setDocumentosDoTenantParaSelecao([]);
    }
    setDocumentosSelecionadosTemporariamente(tarefaEditando?.documentosVinculados?.map(d => d.id) || []);
    setModalSelecionarDocumentoAberto(true);
  };

  const handleToggleDocumentoSelecionado = (docId: string) => {
    setDocumentosSelecionadosTemporariamente(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleConfirmarSelecaoDocumentos = () => {
    const novosDocumentosVinculados: DocumentoVinculado[] = documentosSelecionadosTemporariamente.map(docId => {
      const docOriginal = documentosDoTenantParaSelecao.find(d => d.id === docId);
      return {
        id: docOriginal?.id || docId,
        nome: docOriginal?.nome || 'Documento não encontrado',
      };
    });
    setTarefaEditando(prev => prev ? ({ ...prev, documentosVinculados: novosDocumentosVinculados }) : null);
    setModalSelecionarDocumentoAberto(false);
  };

  const handleRemoverDocumentoVinculado = (idDocVinculado: string) => {
    setTarefaEditando(prev => {
      if (!prev || !prev.documentosVinculados) return prev;
      return {
          ...prev,
          documentosVinculados: prev.documentosVinculados.filter(d => d.id !== idDocVinculado)
      };
    });
  };

  const handleAbrirDetalhesDocVinculado = (docVinculado: DocumentoVinculado) => {
    const tenantIdDoDocumento = tarefaEditando?.clienteEmpresaId || activeClientCompanyContext?.id || effectiveTenantId;
    if (!tenantIdDoDocumento) {
        alert("Contexto do tenant do documento não pôde ser determinado.");
        return;
    }
    const storageKeyDocs = `${STORAGE_KEY_DOCUMENTOS_PREFIX}${tenantIdDoDocumento}`;
    const docsSalvos = localStorage.getItem(storageKeyDocs);
    const documentosDoContexto: Documento[] = docsSalvos ? JSON.parse(docsSalvos) : [];
    const docCompleto = documentosDoContexto.find(d => d.id === docVinculado.id);

    if (docCompleto) {
        setDocumentoParaDetalhes(docCompleto);
        setModalDetalhesDocVinculadoAberto(true);
    } else {
        alert("Detalhes do documento não encontrados. O documento pode ter sido removido ou o contexto mudou.");
    }
  };

  const handleSalvarTarefa = (e: FormEvent) => {
    e.preventDefault();
    if (!tarefaEditando || !tarefaEditando.titulo || !usuarioAtual || !tenantIdEscritorio) {
      alert("Título da tarefa é obrigatório e contexto de usuário/tenant deve estar presente.");
      return;
    }

    let tenantIdDaTarefa = tarefaEditando.tenantId || effectiveTenantId;
    if (!tenantIdDaTarefa) {
        alert("Não foi possível determinar o tenant para esta tarefa.");
        return;
    }

    const responsavelSelecionado = usuariosMock.find(u => u.id === tarefaEditando.responsavelId);

    const logTenantId = tenantIdEscritorio;
    const logContextoEmpresaId = tarefaEditando.clienteEmpresaId || activeClientCompanyContext?.id || (personificandoInfo ? personificandoInfo.empresaId : undefined);
    const logContextoEmpresaNome = tarefaEditando.clienteEmpresaNome || activeClientCompanyContext?.nome || (personificandoInfo ? personificandoInfo.empresaNome : undefined);

    if (tarefaEditando.id) {
      const tarefaAtualizada = { ...tarefaOriginalParaLog, ...tarefaEditando as Tarefa, tenantId: tenantIdDaTarefa, responsavelNome: responsavelSelecionado?.nome };
      setTarefas(tarefas.map(t => t.id === tarefaEditando!.id ? tarefaAtualizada : t));
      logAction({
        acao: TipoAcaoAuditoria.ATUALIZACAO, modulo: ModuloSistemaAuditavel.TAREFAS,
        descricao: `Tarefa "${tarefaAtualizada.titulo}" atualizada.`,
        tenantId: logTenantId, usuario: usuarioAtual, entidadeId: tarefaAtualizada.id,
        dadosAntigos: tarefaOriginalParaLog, dadosNovos: tarefaAtualizada,
        contextoEmpresaClienteId: logContextoEmpresaId, contextoEmpresaClienteNome: logContextoEmpresaNome,
      });
    } else {
      const novaTarefa: Tarefa = {
        id: `task-${Date.now()}`,
        titulo: tarefaEditando.titulo,
        descricao: tarefaEditando.descricao,
        responsavelId: tarefaEditando.responsavelId,
        responsavelNome: responsavelSelecionado?.nome,
        prioridade: tarefaEditando.prioridade || 'MEDIA',
        prazo: tarefaEditando.prazo,
        status: tarefaEditando.status || 'PENDENTE',
        dataCriacao: new Date().toISOString(),
        tenantId: tenantIdDaTarefa,
        criadorId: usuarioAtual.id,
        criadorNome: usuarioAtual.nome,
        recorrencia: tarefaEditando.recorrencia,
        clienteEmpresaId: tarefaEditando.clienteEmpresaId,
        clienteEmpresaNome: tarefaEditando.clienteEmpresaNome,
        documentosVinculados: tarefaEditando.documentosVinculados,
      };
      setTarefas(prevTarefas => [novaTarefa, ...prevTarefas]);
      logAction({
        acao: TipoAcaoAuditoria.CRIACAO, modulo: ModuloSistemaAuditavel.TAREFAS,
        descricao: `Tarefa "${novaTarefa.titulo}" criada.`,
        tenantId: logTenantId, usuario: usuarioAtual, entidadeId: novaTarefa.id,
        dadosNovos: novaTarefa,
        contextoEmpresaClienteId: logContextoEmpresaId, contextoEmpresaClienteNome: logContextoEmpresaNome,
      });
    }
    handleFecharModalTarefa();
  };

  const handleExcluirTarefa = (idTarefa: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta tarefa?")) {
      const tarefaExcluida = tarefas.find(t => t.id === idTarefa);
      setTarefas(tarefas.filter(t => t.id !== idTarefa));
      if (tarefaExcluida && tenantIdEscritorio && usuarioAtual) {
        logAction({
            acao: TipoAcaoAuditoria.EXCLUSAO, modulo: ModuloSistemaAuditavel.TAREFAS,
            descricao: `Tarefa "${tarefaExcluida.titulo}" excluída.`,
            tenantId: tenantIdEscritorio, usuario: usuarioAtual, entidadeId: idTarefa,
            dadosAntigos: tarefaExcluida,
            contextoEmpresaClienteId: tarefaExcluida.clienteEmpresaId, contextoEmpresaClienteNome: tarefaExcluida.clienteEmpresaNome,
          });
      }
    }
  };

  const handleSugerirDescricaoIA = async () => {
    if (!tarefaEditando || !tarefaEditando.titulo) {
      setSugestaoErro("Por favor, insira um título para a tarefa primeiro.");
      return;
    }
    if (!ai) { 
      setSugestaoErro("A funcionalidade de IA não está disponível. Verifique a configuração da API Key.");
      return;
    }

    setSugerindoDescricao(true);
    setSugestaoErro(null);
    try {
      const prompt = `Crie uma descrição detalhada para uma tarefa contábil com o título: "${tarefaEditando.titulo}". A descrição deve ser útil para um profissional de contabilidade e incluir sugestões de pontos-chave a considerar para a execução completa da tarefa, como documentos necessários, prazos típicos (se aplicável), e principais verificações a serem feitas. Formate a resposta de forma clara e organizada, usando tópicos se apropriado.`;
      
      const result: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: prompt,
      });
      
      const suggestedDescription = result.text;
      setTarefaEditando(prev => prev ? { ...prev, descricao: suggestedDescription } : null);

    } catch (error) {
      console.error("Erro ao gerar descrição com IA:", error);
      let errorMessage = "Falha ao sugerir descrição. Tente novamente.";
       if (error instanceof Error) {
        errorMessage += ` Detalhe: ${error.message}`;
      }
      setSugestaoErro(errorMessage);
    } finally {
      setSugerindoDescricao(false);
    }
  };

  const getPrioridadeClass = (prioridade: PrioridadeTarefa) => {
    switch (prioridade) {
      case 'ALTA': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100';
      case 'BAIXA': return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusClass = (status: StatusTarefa) => {
    switch (status) {
      case 'PENDENTE': return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100';
      case 'EM_ANDAMENTO': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100';
      case 'CONCLUIDA': return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100';
      case 'CANCELADA': return 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 line-through';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatarData = (isoString?: string) => {
    if (!isoString) return '-';
    const data = new Date(isoString);
    const dataAjustada = new Date(data.valueOf() + data.getTimezoneOffset() * 60 * 1000);
    return new Intl.DateTimeFormat('pt-BR').format(dataAjustada);
  };

  const getDescricaoRecorrencia = (rec?: RecorrenciaConfig) => {
    if (!rec) return null;
    let desc = `Recorrente: ${rec.tipo}`;
    if (rec.intervalo && rec.intervalo > 1) desc += ` (a cada ${rec.intervalo})`;
    if (rec.tipo === TiposRecorrencia.SEMANAL && typeof rec.diaDaSemana === 'number') desc += ` - ${DIAS_SEMANA_MAP[rec.diaDaSemana]}`;
    if (rec.diaDoMes) desc += ` - Dia ${rec.diaDoMes}`;
    if (rec.mes) desc += ` de ${MESES_MAP[rec.mes]}`;
    if (rec.dataFimRecorrencia) desc += ` até ${formatarData(rec.dataFimRecorrencia)}`;
    return <span className="block text-xs text-blue-600 dark:text-blue-400 mt-1" title={desc}><IconeTarefas className="w-3 h-3 inline mr-1 transform rotate-90"/> Recorrente</span>;
  };

  const tarefasFiltradas = useMemo(() => {
    return tarefas
      .filter(t => t.tenantId === effectiveTenantId)
      .filter(t => filtroResponsavelId ? t.responsavelId === filtroResponsavelId : true)
      .filter(t => filtroPrioridade ? t.prioridade === filtroPrioridade : true)
      .filter(t => filtroStatus ? t.status === filtroStatus : true)
      .filter(t => {
          if (podeGerenciarRecorrenciaEClientes && filtroClienteEmpresaId) {
              return t.clienteEmpresaId === filtroClienteEmpresaId;
          }
          return true;
      });
  }, [tarefas, effectiveTenantId, filtroResponsavelId, filtroPrioridade, filtroStatus, filtroClienteEmpresaId, podeGerenciarRecorrenciaEClientes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center mb-4 sm:mb-0">
          <IconeTarefas className="w-8 h-8 mr-3 text-nixcon-gold" />
          Gestão de Tarefas
        </h1>
        <Button onClick={() => handleAbrirModalTarefa()}>Nova Tarefa</Button>
      </div>

      <Card className="shadow-lg dark:bg-nixcon-dark-card">
        <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <select value={filtroResponsavelId} onChange={e => setFiltroResponsavelId(e.target.value)} className={selectStyles}>
            <option value="">Todos Responsáveis</option>
            {usuariosMock.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
          <select value={filtroPrioridade} onChange={e => setFiltroPrioridade(e.target.value as PrioridadeTarefa | '')} className={selectStyles}>
            <option value="">Todas Prioridades</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Média</option>
            <option value="BAIXA">Baixa</option>
          </select>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as StatusTarefa | '')} className={selectStyles}>
            <option value="">Todos Status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
           {podeGerenciarRecorrenciaEClientes && (
                <select value={filtroClienteEmpresaId} onChange={e => setFiltroClienteEmpresaId(e.target.value)} className={selectStyles}>
                    <option value="">Todas Empresas Clientes</option>
                    {empresasClientes.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                </select>
            )}
        </div>
      </Card>

      <Card className="shadow-lg dark:bg-nixcon-dark-card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light">Lista de Tarefas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Título / Cliente</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Responsável</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prioridade</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prazo</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status / Docs</th>
                <th scope="col" className="relative px-4 py-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {tarefasFiltradas.map((tarefa) => (
                <tr key={tarefa.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-nixcon-dark dark:text-nixcon-light max-w-xs">
                    <p className="truncate" title={tarefa.titulo}>{tarefa.titulo}</p>
                    {tarefa.clienteEmpresaNome && <span className="block text-xs text-gray-500 dark:text-gray-400"><IconeEmpresa className="w-3 h-3 inline mr-1"/>{tarefa.clienteEmpresaNome}</span>}
                    {getDescricaoRecorrencia(tarefa.recorrencia)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tarefa.responsavelNome || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPrioridadeClass(tarefa.prioridade)}`}>
                      {tarefa.prioridade}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatarData(tarefa.prazo)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                     <span className={`block px-2 text-xs leading-5 font-semibold rounded-full ${getStatusClass(tarefa.status)} mb-1 text-center`}>
                       {tarefa.status.replace('_', ' ')}
                    </span>
                    {tarefa.documentosVinculados && tarefa.documentosVinculados.length > 0 && (
                        <span className="block text-xs text-purple-600 dark:text-purple-400 text-center" title={tarefa.documentosVinculados.map(d => d.nome).join(', ')}>
                            <IconeDocumentos className="w-3 h-3 inline mr-1"/> {tarefa.documentosVinculados.length} doc(s)
                        </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button onClick={() => handleAbrirModalTarefa(tarefa)} variant="ghost" size="sm">Editar</Button>
                    <Button onClick={() => handleExcluirTarefa(tarefa.id)} variant="danger" size="sm">Excluir</Button>
                  </td>
                </tr>
              ))}
              {tarefasFiltradas.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhuma tarefa encontrada para os filtros aplicados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modalTarefaAberto && tarefaEditando && (
        <Modal isOpen={modalTarefaAberto} onClose={handleFecharModalTarefa} title={tarefaEditando.id ? 'Editar Tarefa' : 'Nova Tarefa'}>
          <form onSubmit={handleSalvarTarefa} className="space-y-4 max-h-[75vh] overflow-y-auto p-1">
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título*</label>
              <input type="text" name="titulo" id="titulo" value={tarefaEditando.titulo || ''} onChange={handleChangeTarefaEditando} required className={`mt-1 block w-full ${inputStyles}`} />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                <Button
                  type="button"
                  onClick={handleSugerirDescricaoIA}
                  variant="ghost"
                  size="sm"
                  disabled={!tarefaEditando.titulo || sugerindoDescricao || !ai}
                  leftIcon={sugerindoDescricao ? <IconeSparkles className="w-4 h-4 animate-pulse" /> : <IconeSparkles className="w-4 h-4" />}
                >
                  {sugerindoDescricao ? 'Sugerindo...' : 'Sugerir Descrição (IA)'}
                </Button>
              </div>
              <textarea name="descricao" id="descricao" rows={4} value={tarefaEditando.descricao || ''} onChange={handleChangeTarefaEditando} className={`mt-1 block w-full ${inputStyles}`}></textarea>
              {sugestaoErro && <p className="text-xs text-red-500 mt-1">{sugestaoErro}</p>}
            </div>

            {podeGerenciarRecorrenciaEClientes && (
                <>
                    <div>
                        <label htmlFor="clienteEmpresaId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cliente Associado (Opcional)</label>
                        <select name="clienteEmpresaId" id="clienteEmpresaId" value={tarefaEditando.clienteEmpresaId || ''} onChange={handleChangeTarefaEditando} className={`mt-1 block w-full ${selectStyles}`}>
                            <option value="">Nenhum cliente específico</option>
                            {empresasClientes.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                        </select>
                    </div>
                    <div className="pt-2 border-t dark:border-gray-700">
                        <div className="flex items-center">
                            <input type="checkbox" name="isRecorrente" id="isRecorrente" checked={!!tarefaEditando.recorrencia} onChange={handleToggleRecorrencia} className="h-4 w-4 text-nixcon-gold border-gray-300 dark:border-gray-600 rounded focus:ring-nixcon-gold" />
                            <label htmlFor="isRecorrente" className={checkboxLabelStyles}>Tarefa Recorrente?</label>
                        </div>
                        {tarefaEditando.recorrencia && (
                            <div className="mt-2 space-y-3 p-3 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="recorrencia.tipo" className="text-xs text-gray-700 dark:text-gray-300">Tipo</label>
                                        <select name="recorrencia.tipo" value={tarefaEditando.recorrencia.tipo} onChange={handleChangeTarefaEditando} className={`mt-1 block w-full text-sm ${selectStyles}`}>
                                            {Object.values(TiposRecorrencia).map(tr => <option key={tr} value={tr}>{tr.charAt(0) + tr.slice(1).toLowerCase()}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="recorrencia.intervalo" className="text-xs text-gray-700 dark:text-gray-300">Intervalo (a cada X)</label>
                                        <input type="number" name="recorrencia.intervalo" min="1" value={tarefaEditando.recorrencia.intervalo || 1} onChange={handleChangeTarefaEditando} className={`mt-1 block w-full text-sm ${inputStyles}`} />
                                    </div>
                                </div>
                                {(tarefaEditando.recorrencia.tipo === TiposRecorrencia.SEMANAL) && (
                                    <div>
                                        <label htmlFor="recorrencia.diaDaSemana" className="text-xs text-gray-700 dark:text-gray-300">Dia da Semana</label>
                                        <select name="recorrencia.diaDaSemana" value={tarefaEditando.recorrencia.diaDaSemana || 1} onChange={handleChangeTarefaEditando} className={`mt-1 block w-full text-sm ${selectStyles}`}>
                                            {Object.entries(DIAS_SEMANA_MAP).map(([key, val]) => <option key={key} value={key}>{val}</option>)}
                                        </select>
                                    </div>
                                )}
                                {([TiposRecorrencia.MENSAL, TiposRecorrencia.BIMESTRAL, TiposRecorrencia.TRIMESTRAL, TiposRecorrencia.SEMESTRAL, TiposRecorrencia.ANUAL].includes(tarefaEditando.recorrencia.tipo)) && (
                                    <div>
                                        <label htmlFor="recorrencia.diaDoMes" className="text-xs text-gray-700 dark:text-gray-300">Dia do Mês</label>
                                        <input type="number" name="recorrencia.diaDoMes" min="1" max="31" value={tarefaEditando.recorrencia.diaDoMes || 1} onChange={handleChangeTarefaEditando} className={`mt-1 block w-full text-sm ${inputStyles}`} />
                                    </div>
                                )}
                                 {([TiposRecorrencia.ANUAL].includes(tarefaEditando.recorrencia.tipo)) && (
                                     <div>
                                        <label htmlFor="recorrencia.mes" className="text-xs text-gray-700 dark:text-gray-300">Mês</label>
                                        <select name="recorrencia.mes" value={tarefaEditando.recorrencia.mes || 1} onChange={handleChangeTarefaEditando} className={`mt-1 block w-full text-sm ${selectStyles}`}>
                                            {Object.entries(MESES_MAP).map(([key, val]) => <option key={key} value={key}>{val}</option>)}
                                        </select>
                                    </div>
                                 )}
                                <div>
                                    <label htmlFor="recorrencia.dataFimRecorrencia" className="text-xs text-gray-700 dark:text-gray-300">Repetir até (Opcional)</label>
                                    <input type="date" name="recorrencia.dataFimRecorrencia" value={tarefaEditando.recorrencia.dataFimRecorrencia || ''} onChange={handleChangeTarefaEditando} className={`mt-1 block w-full text-sm ${inputStyles}`} />
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="responsavelId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Responsável</label>
                <select name="responsavelId" id="responsavelId" value={tarefaEditando.responsavelId || ''} onChange={handleChangeTarefaEditando} className={`mt-1 block w-full ${selectStyles}`}>
                  <option value="">Ninguém atribuído</option>
                  {usuariosMock.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="prioridade" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prioridade*</label>
                <select name="prioridade" id="prioridade" value={tarefaEditando.prioridade || 'MEDIA'} onChange={handleChangeTarefaEditando} className={`mt-1 block w-full ${selectStyles}`}>
                  <option value="ALTA">Alta</option>
                  <option value="MEDIA">Média</option>
                  <option value="BAIXA">Baixa</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prazo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prazo</label>
                <input type="date" name="prazo" id="prazo" value={tarefaEditando.prazo || ''} onChange={handleChangeTarefaEditando} className={`mt-1 block w-full ${inputStyles}`} />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status*</label>
                <select name="status" id="status" value={tarefaEditando.status || 'PENDENTE'} onChange={handleChangeTarefaEditando} className={`mt-1 block w-full ${selectStyles}`}>
                  <option value="PENDENTE">Pendente</option>
                  <option value="EM_ANDAMENTO">Em Andamento</option>
                  <option value="CONCLUIDA">Concluída</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Documentos Vinculados</label>
                <Button type="button" variant="secondary" size="sm" onClick={handleAbrirModalSelecionarDocumento} className="mb-2 text-xs">Vincular Documento Existente</Button>
                {tarefaEditando.documentosVinculados && tarefaEditando.documentosVinculados.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs max-h-28 overflow-y-auto border dark:border-gray-600 rounded p-2 bg-gray-50 dark:bg-gray-700">
                        {tarefaEditando.documentosVinculados.map(doc => (
                            <li key={doc.id} className="flex justify-between items-center p-1 bg-white dark:bg-gray-600 rounded shadow-sm">
                                <button type="button" onClick={() => handleAbrirDetalhesDocVinculado(doc)} className="text-blue-600 dark:text-blue-400 hover:underline text-left truncate" title={doc.nome}>
                                    <IconeLink className="w-3 h-3 inline mr-1" /> {doc.nome}
                                </button>
                                <button type="button" onClick={() => handleRemoverDocumentoVinculado(doc.id)} className="text-red-500 hover:text-red-700 text-xs p-0.5"><IconeLixeira className="w-3 h-3"/></button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

             <div className="mt-6 text-right space-x-2">
              <Button type="button" variant="secondary" onClick={handleFecharModalTarefa}>Cancelar</Button>
              <Button type="submit" disabled={sugerindoDescricao}>Salvar Tarefa</Button>
            </div>
          </form>
        </Modal>
      )}

        {modalSelecionarDocumentoAberto && (
            <Modal
                isOpen={modalSelecionarDocumentoAberto}
                onClose={() => setModalSelecionarDocumentoAberto(false)}
                title="Selecionar Documentos para Vincular"
            >
                <div className="max-h-60 overflow-y-auto space-y-2 mb-4 p-1">
                    {documentosDoTenantParaSelecao.length > 0 ? documentosDoTenantParaSelecao.map(doc => (
                        <div key={doc.id} className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-gray-600">
                            <input
                                type="checkbox"
                                id={`doc-sel-${doc.id}`}
                                checked={documentosSelecionadosTemporariamente.includes(doc.id)}
                                onChange={() => handleToggleDocumentoSelecionado(doc.id)}
                                className="h-4 w-4 text-nixcon-gold border-gray-300 dark:border-gray-600 rounded focus:ring-nixcon-gold"
                            />
                            <label htmlFor={`doc-sel-${doc.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">{doc.nome} <span className="text-xs text-gray-500 dark:text-gray-400">({doc.categoria})</span></label>
                        </div>
                    )) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Nenhum documento disponível neste contexto para vincular.</p>
                    )}
                </div>
                <div className="mt-6 text-right space-x-2">
                    <Button variant="secondary" onClick={() => setModalSelecionarDocumentoAberto(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmarSelecaoDocumentos}>Confirmar Seleção</Button>
                </div>
            </Modal>
        )}

        {modalDetalhesDocVinculadoAberto && documentoParaDetalhes && (
            <Modal
                isOpen={modalDetalhesDocVinculadoAberto}
                onClose={() => { setModalDetalhesDocVinculadoAberto(false); setDocumentoParaDetalhes(null); }}
                title="Detalhes do Documento Vinculado"
            >
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <p><strong>Nome:</strong> {documentoParaDetalhes.nome}</p>
                <p><strong>Categoria:</strong> {documentoParaDetalhes.categoria}</p>
                <p><strong>Data de Upload:</strong> {formatarData(documentoParaDetalhes.dataUpload)}</p>
                <p><strong>Tamanho:</strong> {documentoParaDetalhes.tamanho}</p>
                <p><strong>Tenant ID (Documento):</strong> {documentoParaDetalhes.tenantId}</p>
                {documentoParaDetalhes.arquivoMock && (
                    <p><strong>Tipo (Mock):</strong> {documentoParaDetalhes.arquivoMock.type}</p>
                )}
            </div>
            <div className="mt-6 text-right space-x-2">
                <Button
                variant="secondary"
                onClick={() => alert(`Simulando abertura/download do documento "${documentoParaDetalhes.nome}"...`)}
                >
                Abrir/Baixar (Simulado)
                </Button>
                <Button onClick={() => { setModalDetalhesDocVinculadoAberto(false); setDocumentoParaDetalhes(null); }}>Fechar</Button>
            </div>
            </Modal>
        )}

    </div>
  );
};

export default TarefasPage;

<style>
{`
.animate-pulse {
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}
`}
</style>
