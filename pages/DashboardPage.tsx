import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button'; 
import ImpostometroWidget from '../components/dashboard/ImpostometroWidget'; // Importar o widget
import { 
    IconeTarefas, 
    IconeDocumentos, 
    IconeCalendario, 
    IconeFinanceiro, 
    IconeUpload, 
    IconeFiscal,
    IconeMensagens, 
    IconeKPIs 
} from '../components/common/Icons';
import { Tarefa, Documento, EventoCalendario, ContaPagar, ContaReceber, FuncaoUsuario } from '../types';
import { STORAGE_KEY_TAREFAS } from './TarefasPage';
import { STORAGE_KEY_DOCUMENTOS_PREFIX } from './DocumentosPage';
const STORAGE_KEY_EVENTOS_PREFIX = 'nixconPortalEventos_'; 
import { STORAGE_KEY_CONTAS_PAGAR_PREFIX, STORAGE_KEY_CONTAS_RECEBER_PREFIX } from './FinanceiroPage';


interface KpiCardProps {
  titulo: string;
  valor: string | number;
  descricao?: string;
  icone: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  corIcone?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ titulo, valor, descricao, icone, corIcone = "text-nixcon-gold" }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-nixcon-dark-card">
    <div className="flex items-center">
      <div className={`p-3 rounded-full bg-opacity-10 ${corIcone.replace('text-', 'bg-')}`}>
         {React.cloneElement(icone, { className: `w-8 h-8 ${corIcone}` })}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{titulo}</p>
        <p className="text-2xl font-semibold text-nixcon-dark dark:text-nixcon-light">{valor}</p>
      </div>
    </div>
    {descricao && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{descricao}</p>}
  </Card>
);

interface AcessoRapidoItemProps {
  titulo: string;
  link: string;
  icone: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  corIcone?: string;
}

const AcessoRapidoCard: React.FC<AcessoRapidoItemProps> = ({ titulo, link, icone, corIcone = "text-nixcon-gold" }) => (
    <Link to={link} className="block">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 text-center p-4 dark:bg-nixcon-dark-card hover:border-nixcon-gold dark:hover:border-nixcon-gold border-transparent border">
            {React.cloneElement(icone, { className: `w-10 h-10 mx-auto mb-2 ${corIcone}` })}
            <p className="text-sm font-medium text-nixcon-dark dark:text-nixcon-light">{titulo}</p>
        </Card>
    </Link>
);

interface AtividadeRecenteItem {
    id: string;
    texto: string;
    icone: React.ReactElement<React.SVGProps<SVGSVGElement>>;
    data: Date;
    link?: string;
}

const DashboardPage: React.FC = () => {
  const { usuarioAtual, tenantAtual, personificandoInfo, activeClientCompanyContext } = useAuth();

  const [tarefasPendentes, setTarefasPendentes] = useState(0);
  const [tarefasUrgentes, setTarefasUrgentes] = useState(0);
  const [documentosRecentes, setDocumentosRecentes] = useState(0);
  const [proximosEventos, setProximosEventos] = useState(0);
  const [contasPagarVencendoValor, setContasPagarVencendoValor] = useState(0);
  const [contasPagarVencendoCount, setContasPagarVencendoCount] = useState(0);
  const [contasReceberProximasValor, setContasReceberProximasValor] = useState(0);
  const [contasReceberProximasCount, setContasReceberProximasCount] = useState(0);

  const getEffectiveTenantId = (): string | undefined => {
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

  useEffect(() => {
    if (!effectiveTenantId) return;

    const tarefasSalvas = localStorage.getItem(STORAGE_KEY_TAREFAS);
    if (tarefasSalvas) {
      const todasTarefas: Tarefa[] = JSON.parse(tarefasSalvas);
      const tarefasDoTenant = todasTarefas.filter(t => t.tenantId === effectiveTenantId);
      setTarefasPendentes(tarefasDoTenant.filter(t => t.status === 'PENDENTE' || t.status === 'EM_ANDAMENTO').length);
      setTarefasUrgentes(tarefasDoTenant.filter(t => (t.status === 'PENDENTE' || t.status === 'EM_ANDAMENTO') && t.prioridade === 'ALTA').length);
    }

    const storageKeyDocumentos = `${STORAGE_KEY_DOCUMENTOS_PREFIX}${effectiveTenantId}`;
    const documentosSalvos = localStorage.getItem(storageKeyDocumentos);
    if (documentosSalvos) {
      const todosDocumentos: Documento[] = JSON.parse(documentosSalvos);
      const hoje = new Date();
      const seteDiasAtras = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 7);
      setDocumentosRecentes(todosDocumentos.filter(d => new Date(d.dataUpload) >= seteDiasAtras).length);
    }

    const storageKeyEventos = `${STORAGE_KEY_EVENTOS_PREFIX}${effectiveTenantId}`;
    const eventosSalvos = localStorage.getItem(storageKeyEventos);
    if (eventosSalvos) {
      const todosEventos: EventoCalendario[] = JSON.parse(eventosSalvos);
      const hoje = new Date();
      const seteDiasDepois = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 7);
      setProximosEventos(todosEventos.filter(e => {
        const dataInicioEvento = new Date(e.dataInicio);
        return dataInicioEvento >= hoje && dataInicioEvento <= seteDiasDepois;
      }).length);
    }
    
    const storageKeyContasPagar = `${STORAGE_KEY_CONTAS_PAGAR_PREFIX}${effectiveTenantId}`;
    const contasPagarSalvas = localStorage.getItem(storageKeyContasPagar);
    if (contasPagarSalvas) {
        const todasContasPagar: ContaPagar[] = JSON.parse(contasPagarSalvas);
        const hoje = new Date();
        const seteDiasDepois = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 7);
        const contasVencendo = todasContasPagar.filter(cp => {
            const dataVenc = new Date(cp.dataVencimento);
            return cp.status === 'PENDENTE' && (dataVenc <= seteDiasDepois);
        });
        setContasPagarVencendoValor(contasVencendo.reduce((sum, cp) => sum + cp.valor, 0));
        setContasPagarVencendoCount(contasVencendo.length);
    }

    const storageKeyContasReceber = `${STORAGE_KEY_CONTAS_RECEBER_PREFIX}${effectiveTenantId}`;
    const contasReceberSalvas = localStorage.getItem(storageKeyContasReceber);
    if (contasReceberSalvas) {
        const todasContasReceber: ContaReceber[] = JSON.parse(contasReceberSalvas);
        const hoje = new Date();
        const seteDiasDepois = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 7);
        const contasProximas = todasContasReceber.filter(cr => {
            const dataVenc = new Date(cr.dataVencimento);
            return cr.status === 'A_RECEBER' && dataVenc >= hoje && dataVenc <= seteDiasDepois;
        });
        setContasReceberProximasValor(contasProximas.reduce((sum, cr) => sum + cr.valor, 0));
        setContasReceberProximasCount(contasProximas.length);
    }
  }, [effectiveTenantId]);

  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDateTime = (date: Date) => date.toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'});

  const kpis = [
    { titulo: 'Tarefas Pendentes', valor: tarefasPendentes, icone: <IconeTarefas />, corIcone: "text-blue-500 dark:text-blue-400", descricao: `${tarefasUrgentes} tarefas urgentes` },
    { titulo: 'Documentos Recentes', valor: documentosRecentes, icone: <IconeDocumentos />, corIcone: "text-green-500 dark:text-green-400", descricao: "Adicionados nos últimos 7 dias" },
    { titulo: 'Próximos Eventos', valor: proximosEventos, icone: <IconeCalendario />, corIcone: "text-purple-500 dark:text-purple-400", descricao: "Nos próximos 7 dias" },
    { titulo: 'Contas a Vencer', valor: formatCurrency(contasPagarVencendoValor), icone: <IconeFinanceiro />, corIcone: "text-red-500 dark:text-red-400", descricao: `${contasPagarVencendoCount} contas (próx. 7 dias ou vencidas)` },
    { titulo: 'Contas a Receber', valor: formatCurrency(contasReceberProximasValor), icone: <IconeFinanceiro />, corIcone: "text-teal-500 dark:text-teal-400", descricao: `${contasReceberProximasCount} contas (próx. 7 dias)` },
  ];

  const acessosRapidos: AcessoRapidoItemProps[] = [
    { titulo: 'Nova Tarefa', link: '/tarefas', icone: <IconeTarefas />, corIcone: "text-blue-500 dark:text-blue-400" },
    { titulo: 'Upload Documento', link: '/documentos', icone: <IconeUpload />, corIcone: "text-green-500 dark:text-green-400" },
    { titulo: 'Emitir Nota Fiscal', link: '/fiscal', icone: <IconeFiscal />, corIcone: "text-orange-500 dark:text-orange-400" },
    { titulo: 'Ver Calendário', link: '/calendario', icone: <IconeCalendario />, corIcone: "text-purple-500 dark:text-purple-400" },
  ];

  const atividadesRecentesMock: AtividadeRecenteItem[] = [
    { id: 'ar1', texto: 'Novo documento "Balanço Anual 2023" adicionado.', icone: <IconeDocumentos className="w-5 h-5 mr-3 text-blue-500 dark:text-blue-400" />, data: new Date(Date.now() - 3600000 * 1), link: '/documentos' },
    { id: 'ar2', texto: 'Tarefa "Preparar IRPF Cliente X" marcada como concluída.', icone: <IconeTarefas className="w-5 h-5 mr-3 text-green-500 dark:text-green-400" />, data: new Date(Date.now() - 3600000 * 3), link: '/tarefas' },
    { id: 'ar3', texto: 'Nova mensagem recebida de "Empresa Y".', icone: <IconeMensagens className="w-5 h-5 mr-3 text-purple-500 dark:text-purple-400" />, data: new Date(Date.now() - 3600000 * 6), link: '/comunicacoes' },
    { id: 'ar4', texto: 'Lembrete: Pagamento de GPS vence em 2 dias.', icone: <IconeFinanceiro className="w-5 h-5 mr-3 text-red-500 dark:text-red-400" />, data: new Date(Date.now() - 3600000 * 10), link: '/financeiro' },
  ];


  return (
    <div className="space-y-8">
      <div className="bg-nixcon-gold dark:bg-nixcon-charcoal text-white dark:text-nixcon-light p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold">
          Bem-vindo(a) de volta, {usuarioAtual?.nome?.split(' ')[0] || 'Usuário'}!
        </h1>
        <p className="mt-1 text-base opacity-90">Aqui está um resumo das suas atividades recentes e pendências.</p>
      </div>

      <ImpostometroWidget />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {kpis.map((kpi, index) => (
          <KpiCard 
            key={index} 
            titulo={kpi.titulo} 
            valor={kpi.valor} 
            icone={kpi.icone}
            corIcone={kpi.corIcone}
            descricao={kpi.descricao}
          />
        ))}
      </div>

      <Card className="shadow-lg dark:bg-nixcon-dark-card" title="Acesso Rápido">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {acessosRapidos.map((item, index) => (
                <AcessoRapidoCard 
                    key={index}
                    titulo={item.titulo}
                    link={item.link}
                    icone={item.icone}
                    corIcone={item.corIcone}
                />
            ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-lg dark:bg-nixcon-dark-card" title="Fluxo de Caixa (Exemplo)">
          <div className="h-64 bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-600">
            <p className="text-gray-400 dark:text-gray-500 text-lg">Gráfico de Fluxo de Caixa (Recharts) - A implementar</p>
          </div>
           <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">Este gráfico mostrará a evolução do seu saldo.</p>
        </Card>
        <Card className="shadow-lg dark:bg-nixcon-dark-card" title="Obrigações Pendentes (Exemplo)">
          <div className="h-64 bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-600">
            <p className="text-gray-400 dark:text-gray-500 text-lg">Gráfico de Obrigações (Recharts) - A implementar</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">Visualize suas obrigações fiscais e prazos.</p>
        </Card>
      </div>

      <Card className="shadow-lg dark:bg-nixcon-dark-card" title="Atividades Recentes">
        {atividadesRecentesMock.length > 0 ? (
            <ul className="space-y-3">
            {atividadesRecentesMock.map((atividade) => (
                <li key={atividade.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-between">
                    <div className="flex items-center">
                        {atividade.icone}
                        <span className="text-sm text-gray-700 dark:text-gray-300">{atividade.texto}</span>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {formatDateTime(atividade.data)}
                        {atividade.link && <Link to={atividade.link} className="ml-2 text-nixcon-gold hover:underline">Ver</Link>}
                    </div>
                </li>
            ))}
            </ul>
        ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhuma atividade recente para mostrar.</p>
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;
