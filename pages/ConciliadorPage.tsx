
import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeConciliador, IconeUpload, IconeLink } from '../components/common/Icons';
import { useAuth } from '../contexts/AuthContext';
import { 
  TransacaoExtrato, 
  LancamentoConciliacao, 
  SugestaoConciliacao, 
  ContaPagar, 
  ContaReceber, 
  FuncaoUsuario 
} from '../types';

const STORAGE_KEY_CONTAS_PAGAR_PREFIX = 'nixconPortalContasPagar_';
const STORAGE_KEY_CONTAS_RECEBER_PREFIX = 'nixconPortalContasReceber_';

const formatCurrencyInConciliador = (value: number | undefined) => {
  if (typeof value !== 'number') return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDateInConciliador = (isoString?: string) => {
  if (!isoString) return '-';
  // Garante que a data seja interpretada como UTC se não houver info de fuso, depois formata para local.
  const date = new Date(isoString.includes('T') || isoString.includes('Z') ? isoString : `${isoString}T00:00:00Z`);
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }); // Exibe a data como ela é, sem conversão de fuso local
};

const ConciliadorPage: React.FC = () => {
  const { usuarioAtual, tenantAtual, personificandoInfo, activeClientCompanyContext } = useAuth();
  
  const [arquivoExtrato, setArquivoExtrato] = useState<File | null>(null);
  const [transacoesExtrato, setTransacoesExtrato] = useState<TransacaoExtrato[]>([]);
  const [lancamentosPendentes, setLancamentosPendentes] = useState<LancamentoConciliacao[]>([]);
  const [sugestoesConciliacao, setSugestoesConciliacao] = useState<SugestaoConciliacao[]>([]);

  const [modalSugestaoAberto, setModalSugestaoAberto] = useState(false);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<TransacaoExtrato | null>(null);
  const [lancamentosSugeridosParaModal, setLancamentosSugeridosParaModal] = useState<LancamentoConciliacao[]>([]);

  const effectiveTenantId = useMemo(() => {
    if (personificandoInfo) return personificandoInfo.empresaId;
    if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && usuarioAtual.tenantId) return usuarioAtual.tenantId;
    if (activeClientCompanyContext && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN)) return activeClientCompanyContext.id;
    return usuarioAtual?.tenantId || tenantAtual?.id;
  }, [personificandoInfo, usuarioAtual, tenantAtual, activeClientCompanyContext]);

  useEffect(() => {
    if (effectiveTenantId) {
      const storageKeyPagar = `${STORAGE_KEY_CONTAS_PAGAR_PREFIX}${effectiveTenantId}`;
      const contasPagarSalvas = localStorage.getItem(storageKeyPagar);
      const pagamentos: LancamentoConciliacao[] = contasPagarSalvas 
        ? (JSON.parse(contasPagarSalvas) as ContaPagar[])
            .filter(cp => cp.status === 'PENDENTE' || cp.status === 'ATRASADA')
            .map(cp => ({ 
              idOriginalLancamento: cp.id, 
              tipoOriginalLancamento: 'PAGAR', 
              descricao: cp.descricao, 
              dataVencimento: cp.dataVencimento, 
              valor: cp.valor, 
              statusOriginal: cp.status 
            }))
        : [];

      const storageKeyReceber = `${STORAGE_KEY_CONTAS_RECEBER_PREFIX}${effectiveTenantId}`;
      const contasReceberSalvas = localStorage.getItem(storageKeyReceber);
      const recebimentos: LancamentoConciliacao[] = contasReceberSalvas
        ? (JSON.parse(contasReceberSalvas) as ContaReceber[])
            .filter(cr => cr.status === 'A_RECEBER' || cr.status === 'ATRASADA')
            .map(cr => ({ 
              idOriginalLancamento: cr.id, 
              tipoOriginalLancamento: 'RECEBER', 
              descricao: cr.descricao, 
              dataVencimento: cr.dataVencimento, 
              valor: cr.valor, 
              statusOriginal: cr.status 
            }))
        : [];
      
      setLancamentosPendentes([...pagamentos, ...recebimentos].sort((a,b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime()));
    } else {
      setLancamentosPendentes([]);
    }
  }, [effectiveTenantId]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setArquivoExtrato(event.target.files[0]);
      setTransacoesExtrato([]); 
      setSugestoesConciliacao([]); 
    }
  };

  const handleProcessarExtratoSimulado = () => {
    if (!arquivoExtrato || !effectiveTenantId) {
      alert("Selecione um arquivo de extrato primeiro.");
      return;
    }
    const dataBase = new Date();
    const mockTransacoes: TransacaoExtrato[] = [
      { id: `ext-${Date.now()}-1`, data: new Date(dataBase.setDate(dataBase.getDate() - 2)).toISOString(), descricaoOriginal: 'Pagamento Fornecedor XYZ', valor: 150.75, tipo: 'DEBITO', tenantId: effectiveTenantId, idArquivoExtrato: arquivoExtrato.name },
      { id: `ext-${Date.now()}-2`, data: new Date(dataBase.setDate(dataBase.getDate() - 1)).toISOString(), descricaoOriginal: 'Transferência Recebida Cliente ABC', valor: 500.00, tipo: 'CREDITO', tenantId: effectiveTenantId, idArquivoExtrato: arquivoExtrato.name },
      { id: `ext-${Date.now()}-3`, data: new Date(dataBase.setDate(dataBase.getDate() - 0)).toISOString(), descricaoOriginal: 'Tarifa Bancária Manutenção', valor: 25.50, tipo: 'DEBITO', tenantId: effectiveTenantId, idArquivoExtrato: arquivoExtrato.name },
      { id: `ext-${Date.now()}-4`, data: new Date(dataBase.setDate(dataBase.getDate() - 0)).toISOString(), descricaoOriginal: 'Pagamento Conta de Luz', valor: 120.00, tipo: 'DEBITO', tenantId: effectiveTenantId, idArquivoExtrato: arquivoExtrato.name },
      { id: `ext-${Date.now()}-5`, data: new Date(dataBase.setDate(dataBase.getDate() + 1)).toISOString(), descricaoOriginal: 'Aplicação Automática', valor: 1000.00, tipo: 'DEBITO', tenantId: effectiveTenantId, idArquivoExtrato: arquivoExtrato.name },
    ];
    setTransacoesExtrato(mockTransacoes);
    alert(`Extrato "${arquivoExtrato.name}" processado com ${mockTransacoes.length} transações (simulado).`);
  };

  const handleAbrirModalSugestao = (transacao: TransacaoExtrato) => {
    setTransacaoSelecionada(transacao);
    const sugestoesFiltradas = lancamentosPendentes.filter(lp => {
      const diffValor = Math.abs(lp.valor - transacao.valor);
      const mesmaNatureza = (transacao.tipo === 'DEBITO' && lp.tipoOriginalLancamento === 'PAGAR') || 
                           (transacao.tipo === 'CREDITO' && lp.tipoOriginalLancamento === 'RECEBER');
      return mesmaNatureza && diffValor <= transacao.valor * 0.20; 
    });
    setLancamentosSugeridosParaModal(sugestoesFiltradas);
    setModalSugestaoAberto(true);
  };

  const handleConfirmarConciliacao = (lancamentoConfirmado: LancamentoConciliacao) => {
    if (!transacaoSelecionada || !effectiveTenantId) return;

    const novaSugestaoConfirmada: SugestaoConciliacao = {
      id: `sug-${Date.now()}`,
      transacaoExtrato: transacaoSelecionada,
      lancamentoSugerido: lancamentoConfirmado,
      confirmadaManualmente: true,
      tenantId: effectiveTenantId,
    };
    setSugestoesConciliacao(prev => [...prev, novaSugestaoConfirmada]);
    
    setTransacoesExtrato(prev => prev.filter(t => t.id !== transacaoSelecionada.id));
    setLancamentosPendentes(prev => prev.filter(l => l.idOriginalLancamento !== lancamentoConfirmado.idOriginalLancamento));
    
    alert(`Conciliação confirmada: "${transacaoSelecionada.descricaoOriginal}" com "${lancamentoConfirmado.descricao}".`);
    setModalSugestaoAberto(false);
    setTransacaoSelecionada(null);
  };
  
  const isTransacaoConciliada = (transacaoId: string) => 
    sugestoesConciliacao.some(s => s.transacaoExtrato.id === transacaoId && s.confirmadaManualmente);

  const isLancamentoConciliado = (lancamentoId: string) =>
    sugestoesConciliacao.some(s => s.lancamentoSugerido.idOriginalLancamento === lancamentoId && s.confirmadaManualmente);


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center mb-4 sm:mb-0">
          <IconeConciliador className="w-8 h-8 mr-3 text-nixcon-gold" />
          Conciliador Bancário
        </h1>
        <input 
            type="file"
            accept=".ofx,.csv"
            onChange={handleFileChange}
            className="text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-nixcon-gold file:text-white hover:file:bg-yellow-600"
        />
      </div>

      <Card className="shadow-lg dark:bg-nixcon-dark-card">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light">Importação de Extratos</h2>
            {arquivoExtrato && (
                <Button onClick={handleProcessarExtratoSimulado} leftIcon={<IconeUpload className="w-4 h-4"/>}>
                    Processar Extrato: {arquivoExtrato.name}
                </Button>
            )}
        </div>
        {!arquivoExtrato && (
            <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-center hover:border-nixcon-gold transition-colors">
                <IconeUpload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">Selecione um arquivo de extrato (OFX, CSV) acima para começar.</p>
            </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg dark:bg-nixcon-dark-card">
          <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">Transações do Extrato ({transacoesExtrato.filter(t => !isTransacaoConciliada(t.id)).length})</h2>
          {transacoesExtrato.length > 0 ? (
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {transacoesExtrato.map(transacao => (
                <li 
                    key={transacao.id} 
                    className={`p-3 rounded-md border ${isTransacaoConciliada(transacao.id) ? 'bg-green-50 dark:bg-green-800 border-green-200 dark:border-green-700 opacity-60' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-nixcon-charcoal dark:text-nixcon-light">{transacao.descricaoOriginal}</p>
                      <p className={`text-xs ${transacao.tipo === 'CREDITO' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatDateInConciliador(transacao.data)} - {formatCurrencyInConciliador(transacao.valor)} ({transacao.tipo})
                      </p>
                    </div>
                    {!isTransacaoConciliada(transacao.id) ? (
                        <Button variant="secondary" size="sm" onClick={() => handleAbrirModalSugestao(transacao)}>Sugerir</Button>
                    ) : (
                        <span className="text-xs text-green-700 dark:text-green-300 font-semibold">Conciliado <IconeLink className="w-3 h-3 inline"/></span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma transação carregada do extrato ou todas foram conciliadas.</p>
          )}
        </Card>

        <Card className="shadow-lg dark:bg-nixcon-dark-card">
          <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">Lançamentos Pendentes no Sistema ({lancamentosPendentes.filter(l => !isLancamentoConciliado(l.idOriginalLancamento)).length})</h2>
          {lancamentosPendentes.length > 0 ? (
             <ul className="space-y-2 max-h-96 overflow-y-auto">
              {lancamentosPendentes.map(lancamento => (
                 <li 
                    key={lancamento.idOriginalLancamento} 
                    className={`p-3 rounded-md border ${isLancamentoConciliado(lancamento.idOriginalLancamento) ? 'bg-green-50 dark:bg-green-800 border-green-200 dark:border-green-700 opacity-60' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}
                >
                  <p className="text-sm font-medium text-nixcon-charcoal dark:text-nixcon-light">{lancamento.descricao}</p>
                  <p className={`text-xs ${lancamento.tipoOriginalLancamento === 'RECEBER' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    Venc: {formatDateInConciliador(lancamento.dataVencimento)} - {formatCurrencyInConciliador(lancamento.valor)} ({lancamento.tipoOriginalLancamento})
                  </p>
                  {isLancamentoConciliado(lancamento.idOriginalLancamento) && (
                     <span className="text-xs text-green-700 dark:text-green-300 font-semibold block mt-1">Conciliado <IconeLink className="w-3 h-3 inline"/></span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum lançamento pendente encontrado ou todos foram conciliados.</p>
          )}
        </Card>
      </div>
      
      {modalSugestaoAberto && transacaoSelecionada && (
        <Modal 
            isOpen={modalSugestaoAberto} 
            onClose={() => { setModalSugestaoAberto(false); setTransacaoSelecionada(null); }} 
            title={`Conciliar: ${transacaoSelecionada.descricaoOriginal} (${formatCurrencyInConciliador(transacaoSelecionada.valor)})`}
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-nixcon-dark dark:text-nixcon-light">Transação do Extrato Selecionada:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Data: {formatDateInConciliador(transacaoSelecionada.data)} | Tipo: {transacaoSelecionada.tipo}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-nixcon-dark dark:text-nixcon-light">Sugestões de Lançamentos do Sistema:</h4>
              {lancamentosSugeridosParaModal.length > 0 ? (
                <ul className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                  {lancamentosSugeridosParaModal.map(sugestao => (
                    <li key={sugestao.idOriginalLancamento} className="p-2 border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-200">{sugestao.descricao}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Venc: {formatDateInConciliador(sugestao.dataVencimento)} | Valor: {formatCurrencyInConciliador(sugestao.valor)} ({sugestao.tipoOriginalLancamento})</p>
                      </div>
                      <Button size="sm" onClick={() => handleConfirmarConciliacao(sugestao)}>Confirmar</Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Nenhuma sugestão automática encontrada. Você pode criar um novo lançamento ou buscar manualmente.</p>
              )}
            </div>
            <div className="mt-6 text-right space-x-2">
                 <Button variant="secondary" onClick={() => alert("Funcionalidade de criar novo lançamento a partir daqui.")}>Criar Novo Lançamento</Button>
                 <Button variant="ghost" onClick={() => { setModalSugestaoAberto(false); setTransacaoSelecionada(null); }}>Fechar</Button>
            </div>
          </div>
        </Modal>
      )}

      <Card className="shadow-lg dark:bg-nixcon-dark-card">
        <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">Conciliações Realizadas ({sugestoesConciliacao.length})</h2>
         {sugestoesConciliacao.length > 0 ? (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
                {sugestoesConciliacao.map(s => (
                    <li key={s.id} className="p-3 bg-green-50 dark:bg-green-800 rounded-md border border-green-200 dark:border-green-700">
                        <p className="text-sm font-medium text-green-700 dark:text-green-200">
                            <IconeLink className="w-4 h-4 inline mr-2"/> 
                            "{s.transacaoExtrato.descricaoOriginal}" ({formatCurrencyInConciliador(s.transacaoExtrato.valor)}) 
                            <span className="font-normal text-gray-600 dark:text-gray-300"> conciliado com </span> 
                            "{s.lancamentoSugerido.descricao}" ({formatCurrencyInConciliador(s.lancamentoSugerido.valor)})
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                            Extrato: {formatDateInConciliador(s.transacaoExtrato.data)} | Sistema: {formatDateInConciliador(s.lancamentoSugerido.dataVencimento)}
                        </p>
                    </li>
                ))}
            </ul>
         ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma conciliação realizada ainda.</p>
         )}
      </Card>

      <p className="text-center text-gray-500 dark:text-gray-400">
        Funcionalidades como regras de conciliação automática, criação de lançamentos a partir do extrato, e relatórios de conciliação serão implementadas.
      </p>
    </div>
  );
};

export default ConciliadorPage;
