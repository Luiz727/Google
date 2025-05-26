
import React, { useState, useEffect, useMemo, useRef, FormEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeMensagens, IconeConfiguracoes } from '../components/common/Icons';
import { useAuth } from '../contexts/AuthContext';
import { 
  CanalComunicacao, 
  MensagemComunicacao, 
  TipoCanal, 
  FuncaoUsuario, 
  Empresa, 
  ConfiguracaoChatbotIA 
} from '../types';
import { STORAGE_KEY_PREFIX as STORAGE_KEY_PREFIX_EMPRESAS } from './EmpresasPage';

const STORAGE_KEY_CANAIS = 'nixconPortalCanais';
const STORAGE_KEY_MENSAGENS_CANAL_PREFIX = 'nixconPortalMensagens_canal_';
const STORAGE_KEY_CONFIG_CHATBOT_PREFIX = 'nixconPortalConfigChatbot_';

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const getInitials = (name: string = "") => {
  if (!name) return "?";
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};


const ComunicacoesPage: React.FC = () => {
  const { usuarioAtual, tenantAtual, personificandoInfo, activeClientCompanyContext } = useAuth();
  const [canais, setCanais] = useState<CanalComunicacao[]>([]);
  const [canalSelecionado, setCanalSelecionado] = useState<CanalComunicacao | null>(null);
  const [mensagensCanalAtual, setMensagensCanalAtual] = useState<MensagemComunicacao[]>([]);
  const [novaMensagemInput, setNovaMensagemInput] = useState('');
  const [isLoadingMensagens, setIsLoadingMensagens] = useState(false);

  const [configChatbotIAMock, setConfigChatbotIAMock] = useState<ConfiguracaoChatbotIA | null>(null);
  const [modalConfigChatbotAberto, setModalConfigChatbotAberto] = useState(false);
  const [formConfigChatbot, setFormConfigChatbot] = useState<Partial<ConfiguracaoChatbotIA>>({});

  const [filtroCanal, setFiltroCanal] = useState<'TODOS' | 'NAO_LIDOS' | 'MEUS_ATENDIMENTOS'>('TODOS');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getEffectiveTenantId = (): string | undefined => {
    if (personificandoInfo) return personificandoInfo.empresaId;
    if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && usuarioAtual.tenantId) return usuarioAtual.tenantId;
    if (activeClientCompanyContext && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN)) return activeClientCompanyContext.id;
    return usuarioAtual?.tenantId || tenantAtual?.id;
  };
  const effectiveTenantId = useMemo(getEffectiveTenantId, [personificandoInfo, usuarioAtual, activeClientCompanyContext, tenantAtual]);
  
  const getTenantEscritorioId = (): string | undefined => {
     return tenantAtual?.id; 
  };
  const tenantEscritorioId = useMemo(getTenantEscritorioId, [tenantAtual]);

  const getActiveContextName = () => {
    if (personificandoInfo) return personificandoInfo.empresaNome;
    if (activeClientCompanyContext) return activeClientCompanyContext.nome;
    if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && tenantEscritorioId) { // Adicionado check para tenantEscritorioId
        const empresasSalvas = localStorage.getItem(`${STORAGE_KEY_PREFIX_EMPRESAS}${tenantEscritorioId}`);
        if (empresasSalvas) {
            const empresasDoEscritorio: Empresa[] = JSON.parse(empresasSalvas);
            const empresaAtiva = empresasDoEscritorio.find(emp => emp.id === usuarioAtual.tenantId);
            return empresaAtiva?.nome || 'Empresa Ativa';
        }
    }
    return tenantAtual?.nome || 'Contexto Atual';
  };
  const activeContextName = useMemo(getActiveContextName, [personificandoInfo, activeClientCompanyContext, usuarioAtual, tenantAtual, tenantEscritorioId]);


  useEffect(() => {
    const canaisSalvos = localStorage.getItem(STORAGE_KEY_CANAIS);
    if (canaisSalvos) {
      setCanais(JSON.parse(canaisSalvos));
    } else if (tenantEscritorioId && usuarioAtual) {
      const canaisIniciais: CanalComunicacao[] = [];
      if (usuarioAtual.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual.funcao === FuncaoUsuario.SUPERADMIN) {
        canaisIniciais.push({
          id: `geral-esc-${tenantEscritorioId}`, nome: `# Geral (Escritório ${tenantEscritorioId.slice(-4)})`, tipo: 'CHAT_INTERNO_ESCRITORIO', tenantId: tenantEscritorioId,
          ultimaMensagemTexto: 'Bem-vindo ao chat interno!', timestampUltimaMensagem: Date.now(), naoLidas: 0, corAvatarMock: getRandomColor(), ehChatbotAtivo: false, statusAtendimento: 'ABERTO'
        });
        const empresasSalvas = localStorage.getItem(`${STORAGE_KEY_PREFIX_EMPRESAS}${tenantEscritorioId}`);
        if (empresasSalvas) {
          const empresasDoEscritorio: Empresa[] = JSON.parse(empresasSalvas);
          empresasDoEscritorio.forEach(emp => {
            canaisIniciais.push({
              id: `cliente-${emp.id}`, nome: `${emp.nome}`, tipo: 'CANAL_EMPRESA_CLIENTE', tenantId: tenantEscritorioId, empresaClienteId: emp.id,
              ultimaMensagemTexto: 'Novo canal de comunicação criado.', timestampUltimaMensagem: Date.now(), naoLidas: 0, corAvatarMock: getRandomColor(), ehChatbotAtivo: true, statusAtendimento: 'ABERTO'
            });
          });
        }
      } else if (usuarioAtual.funcao === FuncaoUsuario.ADMIN_CLIENTE || usuarioAtual.funcao === FuncaoUsuario.USUARIO_CLIENTE) {
        canaisIniciais.push({
            id: `cliente-${usuarioAtual.tenantId}`, nome: `Comunicação com Escritório`, tipo: 'CANAL_EMPRESA_CLIENTE', tenantId: tenantEscritorioId, 
            empresaClienteId: usuarioAtual.tenantId, 
            ultimaMensagemTexto: 'Bem-vindo ao seu canal de comunicação!', timestampUltimaMensagem: Date.now(), naoLidas: 0, corAvatarMock: getRandomColor(), ehChatbotAtivo: true, statusAtendimento: 'ABERTO'
          });
      }
      setCanais(canaisIniciais);
    }
  }, [tenantEscritorioId, usuarioAtual]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CANAIS, JSON.stringify(canais));
  }, [canais]);

  useEffect(() => {
    if (canalSelecionado) {
      setIsLoadingMensagens(true);
      const storageKeyMensagens = `${STORAGE_KEY_MENSAGENS_CANAL_PREFIX}${canalSelecionado.id}`;
      const mensagensSalvas = localStorage.getItem(storageKeyMensagens);
      if (mensagensSalvas) {
        setMensagensCanalAtual(JSON.parse(mensagensSalvas));
      } else {
        setMensagensCanalAtual([{ 
            id: `msg-welcome-${Date.now()}`, canalId: canalSelecionado.id, remetenteId: 'sistema', remetenteNome: 'Sistema', 
            conteudo: `Bem-vindo ao canal ${canalSelecionado.nome}!`, timestamp: Date.now(), tipoRemetente: 'SISTEMA_AUTOMATICO'
        }]);
      }
      setIsLoadingMensagens(false);
    } else {
      setMensagensCanalAtual([]);
    }
  }, [canalSelecionado]);

  useEffect(() => {
    if (canalSelecionado && mensagensCanalAtual.length > 0) {
      const storageKeyMensagens = `${STORAGE_KEY_MENSAGENS_CANAL_PREFIX}${canalSelecionado.id}`;
      localStorage.setItem(storageKeyMensagens, JSON.stringify(mensagensCanalAtual));
    }
  }, [mensagensCanalAtual, canalSelecionado]);
  
  useEffect(() => {
    if (effectiveTenantId) {
      const storageKey = `${STORAGE_KEY_CONFIG_CHATBOT_PREFIX}${effectiveTenantId}`;
      const savedConfig = localStorage.getItem(storageKey);
      if (savedConfig) {
        setConfigChatbotIAMock(JSON.parse(savedConfig));
        setFormConfigChatbot(JSON.parse(savedConfig));
      } else {
        const defaultConfig: ConfiguracaoChatbotIA = { 
          id: `chatbotcfg-${effectiveTenantId}`, tenantId: effectiveTenantId, nomeAgente: "Assistente Nixcon",
          promptBase: "Sou um assistente virtual da Nixcon Contabilidade. Como posso te ajudar hoje?", 
          saudacaoInicial: "Olá! Sou o Assistente Virtual da Nixcon. Pronto para ajudar!",
          mensagemTransferenciaHumano: "Entendi. Vou te transferir para um de nossos especialistas.",
          gatilhosTransferencia: ["falar com humano", "atendente", "especialista"], ativo: true 
        };
        setConfigChatbotIAMock(defaultConfig);
        setFormConfigChatbot(defaultConfig);
      }
    }
  }, [effectiveTenantId]);

  const handleSalvarConfigChatbot = (e: FormEvent) => {
    e.preventDefault();
    if (effectiveTenantId && formConfigChatbot) {
      const configParaSalvar: ConfiguracaoChatbotIA = {
        id: configChatbotIAMock?.id || `chatbotcfg-${effectiveTenantId}`,
        tenantId: effectiveTenantId,
        nomeAgente: formConfigChatbot.nomeAgente || "Assistente Nixcon",
        promptBase: formConfigChatbot.promptBase || "Como posso ajudar?",
        saudacaoInicial: formConfigChatbot.saudacaoInicial || "Olá!",
        mensagemTransferenciaHumano: formConfigChatbot.mensagemTransferenciaHumano || "Transferindo...",
        gatilhosTransferencia: typeof formConfigChatbot.gatilhosTransferencia === 'string' 
            ? (formConfigChatbot.gatilhosTransferencia as string).split(',').map(g => g.trim()).filter(g => g)
            : formConfigChatbot.gatilhosTransferencia || [],
        ativo: formConfigChatbot.ativo !== undefined ? formConfigChatbot.ativo : true,
      };
      const storageKey = `${STORAGE_KEY_CONFIG_CHATBOT_PREFIX}${effectiveTenantId}`;
      localStorage.setItem(storageKey, JSON.stringify(configParaSalvar));
      setConfigChatbotIAMock(configParaSalvar);
      setModalConfigChatbotAberto(false);
      alert("Configurações do Chatbot IA salvas!");
    }
  };


  const handleEnviarMensagem = () => {
    if (!novaMensagemInput.trim() || !canalSelecionado || !usuarioAtual) return;

    const novaMsg: MensagemComunicacao = {
      id: `msg-${Date.now()}`, canalId: canalSelecionado.id, remetenteId: usuarioAtual.id, remetenteNome: usuarioAtual.nome,
      conteudo: novaMensagemInput, timestamp: Date.now(), tipoRemetente: 'USUARIO_SISTEMA', avatarCorMock: getRandomColor()
    };
    setMensagensCanalAtual(prev => [...prev, novaMsg]);
    setNovaMensagemInput('');

    if (canalSelecionado.ehChatbotAtivo && configChatbotIAMock?.ativo) {
      setTimeout(() => {
        let respostaChatbotConteudo = `Resposta IA para: "${novaMsg.conteudo}". ${configChatbotIAMock.promptBase.substring(0, 50)}... (Mock)`;
        let transferirParaHumano = false;

        if (configChatbotIAMock.gatilhosTransferencia?.some(gatilho => novaMsg.conteudo.toLowerCase().includes(gatilho.toLowerCase()))) {
          respostaChatbotConteudo = configChatbotIAMock.mensagemTransferenciaHumano;
          transferirParaHumano = true;
        }
        
        const respostaChatbot: MensagemComunicacao = {
          id: `msg-chatbot-${Date.now()}`, canalId: canalSelecionado.id, remetenteId: 'chatbot-ia', remetenteNome: configChatbotIAMock.nomeAgente,
          conteudo: respostaChatbotConteudo, timestamp: Date.now(), tipoRemetente: 'CHATBOT_IA', avatarCorMock: '#A1A1AA' 
        };
        setMensagensCanalAtual(prev => [...prev, respostaChatbot]);

        if (transferirParaHumano) {
          setCanais(prevCanais => prevCanais.map(c => c.id === canalSelecionado.id ? {...c, ehChatbotAtivo: false, statusAtendimento: 'PENDENTE_ATENDENTE'} : c));
          setCanalSelecionado(prev => prev ? {...prev, ehChatbotAtivo: false, statusAtendimento: 'PENDENTE_ATENDENTE'} : null);
        }
      }, 1000);
    }
    
    setCanais(prevCanais => prevCanais.map(c => 
      c.id === canalSelecionado.id 
        ? { ...c, ultimaMensagemTexto: novaMsg.conteudo, timestampUltimaMensagem: novaMsg.timestamp } 
        : c
    ));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagensCanalAtual]);

  const formatarTimestampMensagem = (timestamp: number): string => {
    const msgDate = new Date(timestamp);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);

    if (msgDate.toDateString() === hoje.toDateString()) {
      return msgDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (msgDate.toDateString() === ontem.toDateString()) {
      return `Ontem, ${msgDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return msgDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ` ${msgDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  const canaisOrdenadosEFiltrados = useMemo(() => {
    let canaisFiltrados = [...canais];
    if (filtroCanal === 'NAO_LIDOS') {
        canaisFiltrados = canaisFiltrados.filter(c => (c.naoLidas || 0) > 0);
    } else if (filtroCanal === 'MEUS_ATENDIMENTOS' && usuarioAtual) {
        canaisFiltrados = canaisFiltrados.filter(c => c.atendenteResponsavelId === usuarioAtual.id);
    }
    return canaisFiltrados.sort((a, b) => (b.timestampUltimaMensagem || 0) - (a.timestampUltimaMensagem || 0));
  }, [canais, filtroCanal, usuarioAtual]);


  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col space-y-0"> 
      <div className="flex justify-between items-center mb-4 px-1"> 
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center">
          <IconeMensagens className="w-8 h-8 mr-3 text-nixcon-gold" />
          Comunicações ({activeContextName})
        </h1>
        <Button onClick={() => setModalConfigChatbotAberto(true)} variant="ghost" size="sm">
          <IconeConfiguracoes className="w-5 h-5 mr-1"/> Config. Chatbot IA
        </Button>
      </div>

      <div className="flex-grow flex border border-gray-200 dark:border-gray-700 rounded-lg shadow-md overflow-hidden">
        <div className="w-1/3 min-w-[280px] max-w-[350px] bg-gray-50 dark:bg-nixcon-dark-card border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-200 dark:border-gray-600">
            <input 
              type="search" 
              placeholder="Buscar canais..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-nixcon-gold focus:border-nixcon-gold bg-white dark:bg-gray-700 text-nixcon-dark dark:text-nixcon-light"
            />
            <div className="flex justify-around mt-2 text-xs">
                <Button variant={filtroCanal === 'TODOS' ? "primary" : "ghost"} size="sm" onClick={() => setFiltroCanal('TODOS')} className="flex-1">Todos</Button>
                <Button variant={filtroCanal === 'NAO_LIDOS' ? "primary" : "ghost"} size="sm" onClick={() => setFiltroCanal('NAO_LIDOS')} className="flex-1">Não Lidos</Button>
                <Button variant={filtroCanal === 'MEUS_ATENDIMENTOS' ? "primary" : "ghost"} size="sm" onClick={() => setFiltroCanal('MEUS_ATENDIMENTOS')} className="flex-1">Meus</Button>
            </div>
          </div>
          <ul className="overflow-y-auto flex-grow">
            {canaisOrdenadosEFiltrados.map(canal => (
              <li 
                key={canal.id} 
                className={`p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 transition-colors flex items-center space-x-3
                            ${canalSelecionado?.id === canal.id ? 'bg-nixcon-gold bg-opacity-20 dark:bg-nixcon-gold dark:bg-opacity-30' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                onClick={() => setCanalSelecionado(canal)}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                  style={{ backgroundColor: canal.corAvatarMock || '#A1A1AA' }}
                  title={canal.nome}
                >
                  {getInitials(canal.nome)}
                </div>
                <div className="flex-grow overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-nixcon-charcoal dark:text-nixcon-light truncate">{canal.nome}</span>
                    {(canal.naoLidas || 0) > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white flex-shrink-0">{canal.naoLidas}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={canal.ultimaMensagemTexto}>{canal.ultimaMensagemTexto || 'Nenhuma mensagem ainda.'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {canal.statusAtendimento} {canal.atendenteResponsavelNome ? `(${canal.atendenteResponsavelNome})` : ''}
                  </p>
                </div>
              </li>
            ))}
            {canaisOrdenadosEFiltrados.length === 0 && (
                <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">Nenhum canal encontrado para este filtro.</p>
            )}
          </ul>
        </div>

        <div className="flex-grow flex flex-col bg-white dark:bg-gray-800">
          {canalSelecionado ? (
            <>
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-nixcon-dark dark:text-nixcon-light">{canalSelecionado.nome}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Status: {canalSelecionado.statusAtendimento || 'N/A'}
                        {canalSelecionado.atendenteResponsavelNome && ` - Atendente: ${canalSelecionado.atendenteResponsavelNome}`}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {configChatbotIAMock && (
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                                setCanais(prevCanais => prevCanais.map(c => c.id === canalSelecionado.id ? {...c, ehChatbotAtivo: !c.ehChatbotAtivo} : c));
                                setCanalSelecionado(prev => prev ? {...prev, ehChatbotAtivo: !prev.ehChatbotAtivo} : null);
                            }}
                            title={canalSelecionado.ehChatbotAtivo ? "Desativar Chatbot" : "Ativar Chatbot"}
                        >
                           {canalSelecionado.ehChatbotAtivo ? "Chatbot ON" : "Chatbot OFF"} 
                        </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => alert(`Transferir chat ${canalSelecionado.nome}`)}>Transferir</Button>
                    <Button variant="secondary" size="sm" onClick={() => alert(`Resolver chat ${canalSelecionado.nome}`)}>Resolver</Button>
                </div>
              </div>
              <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-gray-100 dark:bg-gray-700">
                {isLoadingMensagens ? <p className="text-center text-gray-500 dark:text-gray-400">Carregando mensagens...</p> : 
                  mensagensCanalAtual.map(msg => (
                    <div key={msg.id} className={`flex ${msg.remetenteId === usuarioAtual?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-end max-w-xs md:max-w-md lg:max-w-lg ${msg.remetenteId === usuarioAtual?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mx-2"
                            style={{ backgroundColor: msg.avatarCorMock || (msg.tipoRemetente === 'CHATBOT_IA' ? '#A1A1AA' : getRandomColor()) }}
                            title={msg.remetenteNome}
                        >
                            {getInitials(msg.remetenteNome)}
                        </div>
                        <div className={`p-2.5 rounded-lg shadow ${msg.remetenteId === usuarioAtual?.id ? 'bg-nixcon-gold text-white rounded-br-none' : 'bg-white dark:bg-nixcon-dark-card text-nixcon-charcoal dark:text-nixcon-light rounded-bl-none'}`}>
                          <p className="text-sm">{msg.conteudo}</p>
                          <p className={`text-xxs mt-1 ${msg.remetenteId === usuarioAtual?.id ? 'text-yellow-200 text-right' : 'text-gray-400 dark:text-gray-500 text-left'}`}>
                            {msg.remetenteId !== usuarioAtual?.id && <span className="font-medium">{msg.remetenteNome} - </span>}
                            {formatarTimestampMensagem(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                }
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex bg-white dark:bg-nixcon-dark-card">
                <input 
                  type="text" 
                  placeholder="Digite sua mensagem..."
                  value={novaMensagemInput}
                  onChange={(e) => setNovaMensagemInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEnviarMensagem()}
                  className="flex-grow px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-l-md focus:ring-nixcon-gold focus:border-nixcon-gold bg-white dark:bg-gray-700 text-nixcon-dark dark:text-nixcon-light"
                />
                <Button onClick={handleEnviarMensagem} className="rounded-r-md rounded-l-none">Enviar</Button>
              </div>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500 dark:text-gray-400">
              <p>Selecione um canal para visualizar as mensagens.</p>
            </div>
          )}
        </div>
      </div>

      {modalConfigChatbotAberto && (
        <Modal isOpen={modalConfigChatbotAberto} onClose={() => setModalConfigChatbotAberto(false)} title={`Configurar Chatbot IA (${activeContextName})`}>
          <form onSubmit={handleSalvarConfigChatbot} className="space-y-3 text-sm">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300">Nome do Agente IA</label>
              <input type="text" value={formConfigChatbot.nomeAgente || ''} onChange={e => setFormConfigChatbot(p => ({...p, nomeAgente: e.target.value}))} className="mt-1 w-full px-2 py-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300">Prompt Base (Comportamento)</label>
              <textarea rows={3} value={formConfigChatbot.promptBase || ''} onChange={e => setFormConfigChatbot(p => ({...p, promptBase: e.target.value}))} className="mt-1 w-full px-2 py-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600"></textarea>
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300">Saudação Inicial</label>
              <input type="text" value={formConfigChatbot.saudacaoInicial || ''} onChange={e => setFormConfigChatbot(p => ({...p, saudacaoInicial: e.target.value}))} className="mt-1 w-full px-2 py-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300">Mensagem de Transferência para Humano</label>
              <input type="text" value={formConfigChatbot.mensagemTransferenciaHumano || ''} onChange={e => setFormConfigChatbot(p => ({...p, mensagemTransferenciaHumano: e.target.value}))} className="mt-1 w-full px-2 py-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300">Gatilhos para Transferência (separados por vírgula)</label>
              <input type="text" value={(Array.isArray(formConfigChatbot.gatilhosTransferencia) ? formConfigChatbot.gatilhosTransferencia.join(', ') : formConfigChatbot.gatilhosTransferencia || '')} onChange={e => setFormConfigChatbot(p => ({...p, gatilhosTransferencia: e.target.value.split(',').map(g => g.trim())}))} className="mt-1 w-full px-2 py-1.5 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
            <div className="flex items-center">
                <input type="checkbox" id="chatbotAtivoCfg" checked={formConfigChatbot.ativo !== undefined ? formConfigChatbot.ativo : true} onChange={e => setFormConfigChatbot(p => ({...p, ativo: e.target.checked}))} className="h-4 w-4 text-nixcon-gold rounded"/>
                <label htmlFor="chatbotAtivoCfg" className="ml-2 text-gray-700 dark:text-gray-300">Chatbot Ativo Globalmente</label>
            </div>
            <div className="text-right space-x-2 mt-4">
              <Button type="button" variant="secondary" onClick={() => setModalConfigChatbotAberto(false)}>Cancelar</Button>
              <Button type="submit">Salvar Configuração IA</Button>
            </div>
          </form>
        </Modal>
      )}
       <style>{`.text-xxs { font-size: 0.65rem; line-height: 0.9rem; }`}</style>
    </div>
  );
};

export default ComunicacoesPage;
