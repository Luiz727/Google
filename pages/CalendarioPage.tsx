
import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeCalendario, IconeChevronEsquerda, IconeChevronDireita, IconeTarefas } from '../components/common/Icons';
import { useAuth } from '../contexts/AuthContext';
import { EventoCalendario, Tarefa, FuncaoUsuario } from '../types'; 
import { STORAGE_KEY_TAREFAS } from './TarefasPage'; 

interface ItemCalendarioDisplay extends EventoCalendario {
  tipoDisplay: 'EVENTO' | 'TAREFA';
}


const CalendarioPage: React.FC = () => {
  const { usuarioAtual, tenantAtual, personificandoInfo, activeClientCompanyContext } = useAuth();
  const [mesVisualizado, setMesVisualizado] = useState(new Date());
  const [eventosCalendario, setEventosCalendario] = useState<EventoCalendario[]>([]);
  const [tarefasCalendario, setTarefasCalendario] = useState<Tarefa[]>([]); 

  const [modalEventoAberto, setModalEventoAberto] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Partial<EventoCalendario> | null>(null);
  const [dataSelecionadaModal, setDataSelecionadaModal] = useState<string | null>(null);

  const tenantIdVisualizado = useMemo(() => {
    if (personificandoInfo) return personificandoInfo.empresaId;
    if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && usuarioAtual.tenantId) return usuarioAtual.tenantId;
    if (activeClientCompanyContext && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN)) return activeClientCompanyContext.id;
    return usuarioAtual?.tenantId || tenantAtual?.id;
  }, [personificandoInfo, tenantAtual, usuarioAtual, activeClientCompanyContext]);

  const storageKeyEventos = useMemo(() => 
    tenantIdVisualizado ? `nixconPortalEventos_${tenantIdVisualizado}` : null
  , [tenantIdVisualizado]);

  useEffect(() => {
    if (storageKeyEventos) {
      const eventosSalvos = localStorage.getItem(storageKeyEventos);
      if (eventosSalvos) {
        setEventosCalendario(JSON.parse(eventosSalvos).map((e: EventoCalendario) => ({...e, dataInicio: new Date(e.dataInicio).toISOString(), dataFim: e.dataFim ? new Date(e.dataFim).toISOString() : undefined })) );
      } else {
        setEventosCalendario([]);
      }
    }

    const tarefasSalvasGlobal = localStorage.getItem(STORAGE_KEY_TAREFAS);
    if (tarefasSalvasGlobal) {
        const todasAsTarefas: Tarefa[] = JSON.parse(tarefasSalvasGlobal);
        // Filtra tarefas pelo tenantIdVisualizado aqui, antes de setar o estado
        setTarefasCalendario(todasAsTarefas.filter(t => t.tenantId === tenantIdVisualizado)); 
    } else {
        setTarefasCalendario([]);
    }

  }, [storageKeyEventos, tenantIdVisualizado]); // Adicionado tenantIdVisualizado como dependência para recarregar tarefas

  useEffect(() => {
    if (storageKeyEventos) {
      localStorage.setItem(storageKeyEventos, JSON.stringify(eventosCalendario));
    }
  }, [eventosCalendario, storageKeyEventos]);

  const itensParaExibirNoCalendario = useMemo((): ItemCalendarioDisplay[] => {
    // Eventos já são carregados filtrados pelo tenantIdVisualizado (devido ao storageKeyEventos)
    const eventosFormatados: ItemCalendarioDisplay[] = eventosCalendario
      .map(e => ({...e, tipoDisplay: 'EVENTO'}));

    // Tarefas já foram filtradas no useEffect ao carregar
    const tarefasFormatadas: ItemCalendarioDisplay[] = tarefasCalendario
      .filter(t => t.prazo) // Apenas tarefas com prazo
      .map(t => ({
        id: `task-${t.id}`,
        titulo: `Tarefa: ${t.titulo}`,
        dataInicio: new Date(t.prazo!).toISOString(), 
        dataFim: new Date(t.prazo!).toISOString(), 
        diaInteiro: true,
        descricao: t.descricao || `Status: ${t.status}, Prioridade: ${t.prioridade}`,
        cor: 'bg-orange-500 border-orange-600', 
        tenantId: t.tenantId,
        criadorId: t.criadorId,
        criadorNome: t.criadorNome,
        tipoDisplay: 'TAREFA',
      }));
    return [...eventosFormatados, ...tarefasFormatadas];
  }, [eventosCalendario, tarefasCalendario]); // Removido tenantIdVisualizado daqui pois a filtragem já ocorre antes


  const handleMudarMes = (offset: number) => {
    setMesVisualizado(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const handleAbrirModalEvento = (data?: Date, item?: ItemCalendarioDisplay) => { 
    if (item?.tipoDisplay === 'TAREFA') { 
        alert(`Detalhes da Tarefa:\nTítulo: ${item.titulo.replace('Tarefa: ', '')}\nDescrição: ${item.descricao}`);
        // Poderia navegar para /tarefas?id=... ou abrir um modal de visualização de tarefa
        return;
    }
    
    const eventoBase = item as EventoCalendario | undefined; // Cast para EventoCalendario se não for tarefa
    setEventoEditando(eventoBase ? { ...eventoBase, dataInicio: eventoBase.dataInicio.split('T')[0], dataFim: eventoBase.dataFim?.split('T')[0] } : { diaInteiro: true, cor: 'bg-nixcon-gold' });
    setDataSelecionadaModal(data ? data.toISOString().split('T')[0] : (eventoBase?.dataInicio?.split('T')[0] || new Date().toISOString().split('T')[0]));
    setModalEventoAberto(true);
  };

  const handleFecharModalEvento = () => {
    setModalEventoAberto(false);
    setEventoEditando(null);
    setDataSelecionadaModal(null);
  };

  const handleChangeEventoEditando = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setEventoEditando(prev => {
      if (!prev) return null;
      const newValue = type === 'checkbox' ? checked : value;
      const updatedEvento = { ...prev, [name]: newValue };
      
      if (name === 'diaInteiro' && checked) {
        updatedEvento.dataFim = updatedEvento.dataInicio; 
      }
      return updatedEvento;
    });
  };

  const handleSalvarEvento = () => {
    if (!eventoEditando || !eventoEditando.titulo || !dataSelecionadaModal) {
      alert("Título e Data de Início são obrigatórios.");
      return;
    }
    if (!tenantIdVisualizado || !usuarioAtual) return;

    const dataInicioISO = eventoEditando.diaInteiro 
      ? new Date(eventoEditando.dataInicio || dataSelecionadaModal).toISOString()
      : new Date(`${eventoEditando.dataInicio || dataSelecionadaModal}T${eventoEditando.dataInicio?.split('T')[1] || '00:00:00'}`).toISOString();
    
    let dataFimISO: string | undefined = undefined;
    if (!eventoEditando.diaInteiro && eventoEditando.dataFim) {
         dataFimISO = new Date(`${eventoEditando.dataFim.split('T')[0]}T${eventoEditando.dataFim?.split('T')[1] || '23:59:59'}`).toISOString();
    } else if (eventoEditando.diaInteiro) {
        dataFimISO = dataInicioISO;
    }


    if (eventoEditando.id) { 
      setEventosCalendario(eventosCalendario.map(e => 
        e.id === eventoEditando!.id 
        ? { ...e, ...eventoEditando, dataInicio: dataInicioISO, dataFim: dataFimISO } as EventoCalendario
        : e
      ));
    } else { 
      const novoEvento: EventoCalendario = {
        id: `evt-${Date.now()}`,
        tenantId: tenantIdVisualizado,
        criadorId: usuarioAtual.id,
        criadorNome: usuarioAtual.nome,
        ...eventoEditando,
        titulo: eventoEditando.titulo!,
        dataInicio: dataInicioISO,
        dataFim: dataFimISO,
        diaInteiro: eventoEditando.diaInteiro || false,
      };
      setEventosCalendario(prevEventos => [...prevEventos, novoEvento]);
    }
    handleFecharModalEvento();
  };

  const handleExcluirEvento = (idEvento: string) => {
    if (window.confirm("Tem certeza que deseja excluir este evento?")) {
      setEventosCalendario(eventosCalendario.filter(e => e.id !== idEvento));
      handleFecharModalEvento();
    }
  };

  const gerarDiasDoMes = () => {
    const dias: (Date | null)[] = [];
    const data = new Date(mesVisualizado.getFullYear(), mesVisualizado.getMonth(), 1);
    const primeiroDiaSemana = data.getDay(); 
    const ultimoDiaMes = new Date(mesVisualizado.getFullYear(), mesVisualizado.getMonth() + 1, 0).getDate();

    for (let i = 0; i < primeiroDiaSemana; i++) {
      dias.push(null); 
    }
    for (let i = 1; i <= ultimoDiaMes; i++) {
      dias.push(new Date(mesVisualizado.getFullYear(), mesVisualizado.getMonth(), i));
    }
    const totalCelulas = dias.length;
    const celulasRestantes = (totalCelulas % 7 === 0) ? 0 : 7 - (totalCelulas % 7);
     for (let i = 0; i < celulasRestantes; i++) {
      dias.push(null);
    }
    return dias;
  };

  const diasDoMes = useMemo(gerarDiasDoMes, [mesVisualizado]);
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  const getCorItemCalendario = (item: ItemCalendarioDisplay) => {
    if (item.tipoDisplay === 'TAREFA') return item.cor || 'bg-orange-500 text-white border-orange-600'; // Cor padrão para tarefa
    // Para eventos, usa a cor definida ou um padrão. Adiciona classe para texto branco.
    return item.cor ? `${item.cor} text-white` : 'bg-nixcon-gold text-white';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center mb-4 sm:mb-0">
          <IconeCalendario className="w-8 h-8 mr-3 text-nixcon-gold" />
          Calendário Integrado
        </h1>
        <Button onClick={() => handleAbrirModalEvento(new Date())} disabled={!tenantIdVisualizado}>Novo Evento</Button>
      </div>

      <Card className="shadow-lg dark:bg-nixcon-dark-card">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" onClick={() => handleMudarMes(-1)} aria-label="Mês anterior">
            <IconeChevronEsquerda className="w-6 h-6" />
          </Button>
          <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light">
            {mesVisualizado.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <Button variant="ghost" onClick={() => handleMudarMes(1)} aria-label="Próximo mês">
            <IconeChevronDireita className="w-6 h-6" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-px border border-gray-200 dark:border-gray-600 bg-gray-200 dark:bg-gray-600">
          {diasSemana.map(dia => (
            <div key={dia} className="py-2 text-center font-medium text-sm text-nixcon-dark dark:text-nixcon-light bg-gray-50 dark:bg-gray-700">
              {dia}
            </div>
          ))}
          {diasDoMes.map((dia, index) => (
            <div
              key={index}
              className={`p-1.5 min-h-[100px] bg-white dark:bg-nixcon-dark-bg hover:bg-nixcon-light dark:hover:bg-gray-700 transition-colors relative ${dia ? 'cursor-pointer' : 'bg-gray-50 dark:bg-gray-700'}`}
              onClick={() => dia && handleAbrirModalEvento(dia)}
            >
              {dia && <span className="text-sm font-medium dark:text-nixcon-light">{dia.getDate()}</span>}
              <div className="mt-1 space-y-0.5 overflow-y-auto max-h-[70px]">
                {dia && itensParaExibirNoCalendario
                  .filter(item => {
                    const dataItem = new Date(item.dataInicio); // Assume-se que dataInicio sempre existe
                    return dataItem.getFullYear() === dia.getFullYear() &&
                           dataItem.getMonth() === dia.getMonth() &&
                           dataItem.getDate() === dia.getDate();
                  })
                  .map(item => (
                    <div
                      key={item.id}
                      className={`px-1.5 py-0.5 text-xs rounded truncate border ${getCorItemCalendario(item)}`}
                      title={item.titulo}
                      onClick={(e) => { e.stopPropagation(); handleAbrirModalEvento(dia, item); }}
                    >
                      {item.tipoDisplay === 'TAREFA' && <IconeTarefas className="w-3 h-3 inline mr-1" />}
                      {item.titulo}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
         <div className="mt-4 flex space-x-4 text-xs dark:text-gray-300">
            <div><span className="inline-block w-3 h-3 rounded-sm bg-nixcon-gold mr-1"></span> Evento</div>
            <div><span className="inline-block w-3 h-3 rounded-sm bg-orange-500 mr-1"></span> Prazo de Tarefa</div>
        </div>
      </Card>

      {modalEventoAberto && eventoEditando && dataSelecionadaModal && (
        <Modal 
            isOpen={modalEventoAberto} 
            onClose={handleFecharModalEvento} 
            title={eventoEditando.id ? 'Editar Evento' : 'Novo Evento'}
        >
          <form className="space-y-4">
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título*</label>
              <input type="text" name="titulo" id="titulo" value={eventoEditando.titulo || ''} onChange={handleChangeEventoEditando} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold dark:bg-gray-700 dark:text-gray-200" />
            </div>
            <div className="flex items-center">
              <input type="checkbox" name="diaInteiro" id="diaInteiro" checked={eventoEditando.diaInteiro || false} onChange={handleChangeEventoEditando} className="h-4 w-4 text-nixcon-gold border-gray-300 dark:border-gray-600 rounded focus:ring-nixcon-gold" />
              <label htmlFor="diaInteiro" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Evento de Dia Inteiro</label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dataInicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Início*</label>
                <input type="date" name="dataInicio" id="dataInicio" value={eventoEditando.dataInicio?.split('T')[0] || dataSelecionadaModal} onChange={handleChangeEventoEditando} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold dark:bg-gray-700 dark:text-gray-200" />
              </div>
              {!eventoEditando.diaInteiro && (
                <div>
                  <label htmlFor="horaInicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora Início</label>
                  <input type="time" name="dataInicioHora" id="dataInicioHora" value={eventoEditando.dataInicio?.split('T')[1]?.substring(0,5) || '09:00'} 
                    onChange={e => {
                        const dataParte = eventoEditando.dataInicio?.split('T')[0] || dataSelecionadaModal;
                        setEventoEditando(prev => prev ? ({...prev, dataInicio: `${dataParte}T${e.target.value}:00`}) : null);
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold dark:bg-gray-700 dark:text-gray-200" />
                </div>
              )}
            </div>
            {!eventoEditando.diaInteiro && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="dataFim" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Fim</label>
                        <input type="date" name="dataFim" id="dataFim" value={eventoEditando.dataFim?.split('T')[0] || eventoEditando.dataInicio?.split('T')[0] || dataSelecionadaModal} onChange={handleChangeEventoEditando} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold dark:bg-gray-700 dark:text-gray-200" />
                    </div>
                     <div>
                        <label htmlFor="horaFim" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora Fim</label>
                        <input type="time" name="dataFimHora" id="dataFimHora" value={eventoEditando.dataFim?.split('T')[1]?.substring(0,5) || '10:00'}
                         onChange={e => {
                            const dataParte = eventoEditando.dataFim?.split('T')[0] || eventoEditando.dataInicio?.split('T')[0] || dataSelecionadaModal;
                            setEventoEditando(prev => prev ? ({...prev, dataFim: `${dataParte}T${e.target.value}:00`}) : null);
                        }}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold dark:bg-gray-700 dark:text-gray-200" />
                    </div>
                </div>
            )}
            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
              <textarea name="descricao" id="descricao" rows={3} value={eventoEditando.descricao || ''} onChange={handleChangeEventoEditando} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold dark:bg-gray-700 dark:text-gray-200"></textarea>
            </div>
            <div>
                <label htmlFor="cor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cor do Evento</label>
                <select name="cor" id="cor" value={eventoEditando.cor || 'bg-nixcon-gold'} onChange={handleChangeEventoEditando} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold">
                    <option value="bg-nixcon-gold">Ouro Nixcon</option>
                    <option value="bg-blue-500">Azul</option>
                    <option value="bg-green-500">Verde</option>
                    <option value="bg-red-500">Vermelho</option>
                    <option value="bg-purple-500">Roxo</option>
                    <option value="bg-pink-500">Rosa</option>
                </select>
            </div>
            <div className="mt-6 flex justify-between">
                <div>
                    {eventoEditando.id && (
                        <Button type="button" variant="danger" onClick={() => handleExcluirEvento(eventoEditando.id!)}>Excluir Evento</Button>
                    )}
                </div>
                <div className="space-x-2">
                    <Button type="button" variant="secondary" onClick={handleFecharModalEvento}>Cancelar</Button>
                    <Button type="button" onClick={handleSalvarEvento}>Salvar Evento</Button>
                </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CalendarioPage;
