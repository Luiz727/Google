
import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeAuditoria, IconeOlho } from '../components/common/Icons';
import { useAuth } from '../contexts/AuthContext';
import { LogAuditoria, TipoAcaoAuditoria, ModuloSistemaAuditavel, FuncaoUsuario } from '../types';
import { getLogs } from '../services/LogService'; // Importar getLogs

const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm";
const selectClasses = `${inputClasses} bg-white dark:bg-gray-700`;

const AuditoriaPage: React.FC = () => {
  const { usuarioAtual, tenantAtual } = useAuth();
  const [logsAuditoria, setLogsAuditoria] = useState<LogAuditoria[]>([]);
  
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroAcao, setFiltroAcao] = useState<TipoAcaoAuditoria | ''>('');
  const [filtroModulo, setFiltroModulo] = useState<ModuloSistemaAuditavel | ''>('');

  const [modalDetalhesLogAberto, setModalDetalhesLogAberto] = useState(false);
  const [logSelecionadoParaDetalhes, setLogSelecionadoParaDetalhes] = useState<LogAuditoria | null>(null);

  const tenantIdEscritorio = useMemo(() => tenantAtual?.id, [tenantAtual]);

  useEffect(() => {
    if (tenantIdEscritorio) {
      const fetchedLogs = getLogs(tenantIdEscritorio);
      setLogsAuditoria(fetchedLogs);
    } else {
      setLogsAuditoria([]);
    }
  }, [tenantIdEscritorio]);

  const logsFiltrados = useMemo(() => {
    return logsAuditoria.filter(log => {
      const matchUsuario = filtroUsuario ? 
        log.usuarioNome?.toLowerCase().includes(filtroUsuario.toLowerCase()) || 
        log.usuarioEmail?.toLowerCase().includes(filtroUsuario.toLowerCase()) : true;
      const matchAcao = filtroAcao ? log.acao === filtroAcao : true;
      const matchModulo = filtroModulo ? log.modulo === filtroModulo : true;
      return matchUsuario && matchAcao && matchModulo;
    });
  }, [logsAuditoria, filtroUsuario, filtroAcao, filtroModulo]);

  const handleAbrirDetalhesLog = (log: LogAuditoria) => {
    setLogSelecionadoParaDetalhes(log);
    setModalDetalhesLogAberto(true);
  };

  const formatarTimestamp = (isoString: string) => {
    return new Date(isoString).toLocaleString('pt-BR', {
      dateStyle: 'short', timeStyle: 'medium'
    });
  };
  
  if (usuarioAtual?.funcao !== FuncaoUsuario.ADMIN_ESCRITORIO && usuarioAtual?.funcao !== FuncaoUsuario.SUPERADMIN) {
    return (
      <Card className="shadow-lg text-center p-8 dark:bg-nixcon-dark-card">
        <IconeAuditoria className="w-16 h-16 text-nixcon-gold mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-nixcon-dark dark:text-nixcon-light mb-2">Acesso Negado</h1>
        <p className="text-gray-600 dark:text-gray-400">Você não tem permissão para visualizar os logs de auditoria.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center">
          <IconeAuditoria className="w-8 h-8 mr-3 text-nixcon-gold" />
          Logs de Auditoria do Sistema
        </h1>
      </div>

      <Card className="shadow-lg dark:bg-nixcon-dark-card">
        <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" placeholder="Filtrar por Usuário (Nome/Email)..." value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)} className={inputClasses} />
          <select value={filtroAcao} onChange={(e) => setFiltroAcao(e.target.value as TipoAcaoAuditoria | '')} className={selectClasses}>
            <option value="">Todas as Ações</option>
            {Object.values(TipoAcaoAuditoria).map(acao => <option key={acao} value={acao}>{acao.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={filtroModulo} onChange={(e) => setFiltroModulo(e.target.value as ModuloSistemaAuditavel | '')} className={selectClasses}>
            <option value="">Todos os Módulos</option>
            {Object.values(ModuloSistemaAuditavel).map(mod => <option key={mod} value={mod}>{mod.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </Card>

      <Card className="shadow-lg dark:bg-nixcon-dark-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data/Hora</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usuário</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ação</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Módulo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {logsFiltrados.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatarTimestamp(log.timestamp)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.usuarioNome || 'Sistema'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.acao.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.modulo?.replace(/_/g, ' ') || '-'}</td>
                  <td className="px-4 py-3 text-sm text-nixcon-dark dark:text-nixcon-light max-w-xs truncate" title={log.descricao}>{log.descricao}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <Button variant="ghost" size="sm" onClick={() => handleAbrirDetalhesLog(log)} leftIcon={<IconeOlho className="w-4 h-4"/>}>
                      Detalhes
                    </Button>
                  </td>
                </tr>
              ))}
              {logsFiltrados.length === 0 && (
                <tr><td colSpan={6} className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhum log encontrado para os filtros aplicados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {modalDetalhesLogAberto && logSelecionadoParaDetalhes && (
        <Modal 
            isOpen={modalDetalhesLogAberto} 
            onClose={() => setModalDetalhesLogAberto(false)} 
            title={`Detalhes do Log ID: ${logSelecionadoParaDetalhes.id.slice(-6)}`}
        >
            <div className="space-y-3 text-sm max-h-[60vh] overflow-y-auto">
                <p><strong>Timestamp:</strong> {formatarTimestamp(logSelecionadoParaDetalhes.timestamp)}</p>
                <p><strong>Usuário:</strong> {logSelecionadoParaDetalhes.usuarioNome || 'N/A'} ({logSelecionadoParaDetalhes.usuarioEmail || 'N/A'})</p>
                <p><strong>Ação:</strong> {logSelecionadoParaDetalhes.acao.replace(/_/g, ' ')}</p>
                <p><strong>Módulo:</strong> {logSelecionadoParaDetalhes.modulo?.replace(/_/g, ' ') || 'N/A'}</p>
                <p><strong>Descrição:</strong> {logSelecionadoParaDetalhes.descricao}</p>
                {logSelecionadoParaDetalhes.entidadeId && <p><strong>ID da Entidade:</strong> {logSelecionadoParaDetalhes.entidadeId}</p>}
                {logSelecionadoParaDetalhes.ipOrigem && <p><strong>IP de Origem:</strong> {logSelecionadoParaDetalhes.ipOrigem}</p>}
                {logSelecionadoParaDetalhes.contextoEmpresaClienteNome && <p><strong>Contexto Cliente:</strong> {logSelecionadoParaDetalhes.contextoEmpresaClienteNome} (ID: {logSelecionadoParaDetalhes.contextoEmpresaClienteId})</p>}
                
                {logSelecionadoParaDetalhes.dadosAntigos && (
                    <div>
                        <strong>Dados Antigos:</strong>
                        <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs whitespace-pre-wrap break-all">
                            {JSON.stringify(JSON.parse(logSelecionadoParaDetalhes.dadosAntigos), null, 2)}
                        </pre>
                    </div>
                )}
                {logSelecionadoParaDetalhes.dadosNovos && (
                    <div>
                        <strong>Dados Novos:</strong>
                        <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs whitespace-pre-wrap break-all">
                            {JSON.stringify(JSON.parse(logSelecionadoParaDetalhes.dadosNovos), null, 2)}
                        </pre>
                    </div>
                )}
            </div>
            <div className="mt-6 text-right">
                <Button variant="secondary" onClick={() => setModalDetalhesLogAberto(false)}>Fechar</Button>
            </div>
        </Modal>
      )}

    </div>
  );
};

export default AuditoriaPage;
