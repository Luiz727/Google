import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { IconeSino, IconeTarefas, IconeDocumentos, IconeFinanceiro, IconeConfiguracoes } from '../components/common/Icons';

type TipoNotificacao = 'tarefa' | 'documento' | 'financeiro' | 'sistema' | 'lembrete';

interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  descricao?: string;
  timestamp: Date;
  lida: boolean;
  link?: string; // Para onde a notificação deve levar o usuário
}

const getIconeNotificacao = (tipo: TipoNotificacao, className?: string) => {
  const props = { className: className || "w-6 h-6" };
  switch (tipo) {
    case 'tarefa':
      return <IconeTarefas {...props} />;
    case 'documento':
      return <IconeDocumentos {...props} />;
    case 'financeiro':
      return <IconeFinanceiro {...props} />;
    case 'sistema':
      return <IconeConfiguracoes {...props} />; // Usando configurações como ícone genérico de sistema
    case 'lembrete':
      return <IconeSino {...props} />; // Usando sino para lembretes
    default:
      return <IconeSino {...props} />;
  }
};

const NotificacoesPage: React.FC = () => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([
    { id: '1', tipo: 'tarefa', titulo: 'Nova tarefa atribuída: Revisar Balancete Cliente X', descricao: 'Prioridade Alta. Prazo: 20/07/2024', timestamp: new Date(Date.now() - 3600000 * 2), lida: false, link: '/tarefas' },
    { id: '2', tipo: 'documento', titulo: 'Novo documento carregado: Contrato Social Empresa Y.pdf', descricao: 'Categoria: Jurídico', timestamp: new Date(Date.now() - 3600000 * 5), lida: false, link: '/documentos' },
    { id: '3', tipo: 'lembrete', titulo: 'Lembrete: Vencimento DAS Cliente Z amanhã', descricao: 'Verifique as pendências fiscais.', timestamp: new Date(Date.now() - 3600000 * 24), lida: true, link: '/fiscal' },
    { id: '4', tipo: 'sistema', titulo: 'Atualização do sistema agendada', descricao: 'O sistema passará por uma breve manutenção no próximo domingo às 02:00.', timestamp: new Date(Date.now() - 3600000 * 48), lida: true },
    { id: '5', tipo: 'financeiro', titulo: 'Pagamento confirmado: Fatura #12345', descricao: 'Seu pagamento da mensalidade foi processado com sucesso.', timestamp: new Date(Date.now() - 3600000 * 72), lida: true, link: '/financeiro' },
  ]);

  const marcarComoLida = (id: string) => {
    setNotificacoes(notificacoes.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const marcarTodasComoLidas = () => {
    setNotificacoes(notificacoes.map(n => ({ ...n, lida: true })));
  };

  const excluirNotificacao = (id: string) => {
    setNotificacoes(notificacoes.filter(n => n.id !== id));
  };

  const limparTodasLidas = () => {
    setNotificacoes(notificacoes.filter(n => !n.lida));
  };

  const naoLidasCount = notificacoes.filter(n => !n.lida).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark flex items-center mb-4 sm:mb-0">
          <IconeSino className="w-8 h-8 mr-3 text-nixcon-gold" />
          Minhas Notificações {naoLidasCount > 0 && <span className="ml-2 text-sm bg-red-500 text-white rounded-full px-2 py-0.5">{naoLidasCount}</span>}
        </h1>
        <div className="space-x-2">
          {naoLidasCount > 0 && <Button onClick={marcarTodasComoLidas} variant="secondary" size="sm">Marcar todas como lidas</Button>}
          <Button onClick={limparTodasLidas} variant="ghost" size="sm" disabled={notificacoes.filter(n => n.lida).length === 0}>Limpar lidas</Button>
        </div>
      </div>

      {notificacoes.length === 0 ? (
        <Card className="shadow-lg text-center py-10">
          <IconeSino className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-500">Você não tem notificações no momento.</p>
        </Card>
      ) : (
        <Card className="shadow-lg p-0 sm:p-0"> {/* Remover padding para que os itens da lista ocupem toda a largura */}
          <ul className="divide-y divide-gray-200">
            {notificacoes.map((notificacao) => (
              <li 
                key={notificacao.id} 
                className={`p-4 hover:bg-gray-50 transition-colors flex items-start space-x-3 ${!notificacao.lida ? 'bg-nixcon-gold bg-opacity-5' : ''}`}
              >
                <div className={`mt-1 flex-shrink-0 p-2 rounded-full ${!notificacao.lida ? 'bg-nixcon-gold bg-opacity-20' : 'bg-gray-100'}`}>
                  {getIconeNotificacao(notificacao.tipo, `w-5 h-5 ${!notificacao.lida ? 'text-nixcon-gold' : 'text-gray-500'}`)}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-center">
                    <h3 className={`text-sm font-semibold ${!notificacao.lida ? 'text-nixcon-dark' : 'text-gray-700'}`}>
                      {notificacao.link ? (
                        <a href={`#${notificacao.link}`} className="hover:underline">{notificacao.titulo}</a>
                      ) : (
                        notificacao.titulo
                      )}
                    </h3>
                    <span className="text-xs text-gray-400">
                      {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(notificacao.timestamp)}
                    </span>
                  </div>
                  {notificacao.descricao && <p className="text-xs text-gray-500 mt-0.5">{notificacao.descricao}</p>}
                </div>
                <div className="flex-shrink-0 flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 ml-2">
                  {!notificacao.lida && (
                    <Button onClick={() => marcarComoLida(notificacao.id)} variant="ghost" size="sm" className="p-1 text-xs">
                      Marcar como lida
                    </Button>
                  )}
                  <Button onClick={() => excluirNotificacao(notificacao.id)} variant="ghost" size="sm" className="p-1 text-xs text-red-500 hover:text-red-700">
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-center text-gray-500 mt-8">
        Esta página de placeholder exibe notificações mock. A funcionalidade de tempo real e persistência será implementada.
      </p>
    </div>
  );
};

export default NotificacoesPage;