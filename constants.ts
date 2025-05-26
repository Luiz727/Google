
import { ItemNavegacao, FuncaoUsuario } from './types';
import { 
  IconeDashboard, 
  IconeTarefas, 
  IconeDocumentos, 
  IconeCalendario, 
  IconeFinanceiro, 
  IconeFiscal, 
  IconeConciliador,
  IconeEstoque,
  IconeKPIs,
  IconeAdminSaas,
  IconeConfiguracoes,
  IconeAjuda,
  IconeAssinaturaEletronica,
  IconeMensagens,
  IconeAuditoria,
  IconePontoProdutividade,
  IconeRelatorios,
  IconeSimulacaoImpostos, 
  IconeEmpresa,
  IconeModelos,
  IconeXml,
  IconeHyCite,
  IconeFolhaPagamento,
  IconeLalur,      
  IconePatrimonio,
  IconeConsultoriaTributaria,
  IconeCnae,
  IconeSerpro // Adicionado IconeSerpro
} from './components/common/Icons';

// Ícone para Contabilidade (pode ser o mesmo do Financeiro ou um específico)
const IconeContabilidade = IconeFinanceiro; // Placeholder, idealmente criar um IconeContabilidade específico
const IconeEfdContribuicoes = IconeFiscal; // Placeholder, pode ser um ícone mais específico

export const ITENS_MENU_LATERAL: ItemNavegacao[] = [
  { 
    nome: 'Dashboard', 
    caminho: '/', 
    icone: IconeDashboard, 
    funcoesPermitidas: Object.values(FuncaoUsuario) 
  },
  {
    nome: 'Gestão de Clientes',
    caminho: '/empresas', 
    icone: IconeEmpresa,
    funcoesPermitidas: [FuncaoUsuario.SUPERADMIN, FuncaoUsuario.ADMIN_ESCRITORIO],
    subItens: [
      { 
        nome: 'Cadastro de Empresas', 
        caminho: '/empresas', 
        icone: IconeEmpresa, 
        funcoesPermitidas: [FuncaoUsuario.SUPERADMIN, FuncaoUsuario.ADMIN_ESCRITORIO] 
      },
    ]
  },
  {
    nome: 'Operacional',
    caminho: '/tarefas', 
    icone: IconeTarefas, 
    funcoesPermitidas: Object.values(FuncaoUsuario),
    subItens: [
      { 
        nome: 'Gestão de Tarefas', 
        caminho: '/tarefas', 
        icone: IconeTarefas, 
        funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO, FuncaoUsuario.ADMIN_CLIENTE, FuncaoUsuario.USUARIO_CLIENTE] 
      },
      { 
        nome: 'Calendário', 
        caminho: '/calendario', 
        icone: IconeCalendario, 
        funcoesPermitidas: Object.values(FuncaoUsuario) 
      },
      { 
        nome: 'Comunicações', 
        caminho: '/comunicacoes', 
        icone: IconeMensagens, 
        funcoesPermitidas: Object.values(FuncaoUsuario), 
      },
      { 
        nome: 'Controle de Estoque', 
        caminho: '/estoque', 
        icone: IconeEstoque, 
        funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO, FuncaoUsuario.ADMIN_CLIENTE, FuncaoUsuario.USUARIO_CLIENTE],
      },
    ]
  },
  {
    nome: 'Documentos & Assinaturas',
    caminho: '/documentos', 
    icone: IconeDocumentos,
    funcoesPermitidas: Object.values(FuncaoUsuario),
    subItens: [
      { 
        nome: 'Documentos Gerais', 
        caminho: '/documentos', 
        icone: IconeDocumentos, 
        funcoesPermitidas: Object.values(FuncaoUsuario) 
      },
      { 
        nome: 'Modelos e Geração', 
        caminho: '/modelos-documentos', 
        icone: IconeModelos, 
        funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO] 
      },
      { 
        nome: 'Assinatura Eletrônica', 
        caminho: '/assinaturas', 
        icone: IconeAssinaturaEletronica, 
        funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO, FuncaoUsuario.ADMIN_CLIENTE, FuncaoUsuario.USUARIO_CLIENTE],
      },
    ]
  },
  { 
    nome: 'Escrita Fiscal', 
    caminho: '/escrita-fiscal', 
    icone: IconeFiscal, 
    funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO, FuncaoUsuario.ADMIN_CLIENTE, FuncaoUsuario.USUARIO_CLIENTE]
  },
  { 
    nome: 'Folha de Pagamento', 
    caminho: '/folha-pagamento', 
    icone: IconeFolhaPagamento, 
    funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO]
  },
  { 
    nome: 'Patrimônio', 
    caminho: '/patrimonio', 
    icone: IconePatrimonio, 
    funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO, FuncaoUsuario.ADMIN_CLIENTE, FuncaoUsuario.USUARIO_CLIENTE]
  },
  {
    nome: 'Financeiro & Contábil',
    caminho: '/financeiro', 
    icone: IconeFinanceiro,
    funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO, FuncaoUsuario.ADMIN_CLIENTE, FuncaoUsuario.USUARIO_CLIENTE],
    subItens: [
      { 
        nome: 'Contabilidade', 
        caminho: '/contabilidade', 
        icone: IconeContabilidade, 
        funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO] 
      },
      { 
        nome: 'LALUR/LACS', 
        caminho: '/lalur', 
        icone: IconeLalur, 
        funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO] 
      },
      { 
        nome: 'Financeiro Geral', 
        caminho: '/financeiro', 
        icone: IconeFinanceiro, 
        funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO, FuncaoUsuario.ADMIN_CLIENTE, FuncaoUsuario.USUARIO_CLIENTE],
      },
      { 
        nome: 'Gestão de Honorários', 
        caminho: '/honorarios', 
        icone: IconeFinanceiro, // Poderia ser um ícone específico para honorários
        funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO], 
      },
      { 
        nome: 'Emissão de Notas', // Mantido para a funcionalidade específica de emissão
        caminho: '/fiscal', // Rota existente para EmissaoFiscalPage.tsx (FiscalPage.tsx)
        icone: IconeFiscal, 
        funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO, FuncaoUsuario.ADMIN_CLIENTE, FuncaoUsuario.USUARIO_CLIENTE],
      },
      { 
        nome: 'EFD Contribuições', 
        caminho: '/efd-contribuicoes', 
        icone: IconeEfdContribuicoes, 
        funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO, FuncaoUsuario.ADMIN_CLIENTE, FuncaoUsuario.USUARIO_CLIENTE],
      },
      { 
        nome: 'Organizador de XMLs', 
        caminho: '/organizador-xmls', 
        icone: IconeXml, 
        funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO, FuncaoUsuario.ADMIN_CLIENTE, FuncaoUsuario.USUARIO_CLIENTE],
      },
      { 
        nome: 'Simulação de Impostos', 
        caminho: '/simulacao-impostos', 
        icone: IconeSimulacaoImpostos, 
        funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO, FuncaoUsuario.ADMIN_CLIENTE, FuncaoUsuario.USUARIO_CLIENTE],
      },
      { 
        nome: 'Conciliador Bancário', 
        caminho: '/conciliador', 
        icone: IconeConciliador, 
        funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO, FuncaoUsuario.ADMIN_CLIENTE, FuncaoUsuario.USUARIO_CLIENTE],
      },
    ]
  },
  {
    nome: 'Análise & Gestão',
    caminho: '/kpis', 
    icone: IconeKPIs,
    funcoesPermitidas: [FuncaoUsuario.SUPERADMIN, FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.ADMIN_CLIENTE, FuncaoUsuario.USUARIO_ESCRITORIO],
    subItens: [
      { 
        nome: 'Painel de KPIs', 
        caminho: '/kpis', 
        icone: IconeKPIs, 
        funcoesPermitidas: [FuncaoUsuario.SUPERADMIN, FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.ADMIN_CLIENTE], 
      },
      { 
        nome: 'Relatórios', 
        caminho: '/relatorios', 
        icone: IconeRelatorios, 
        funcoesPermitidas: [FuncaoUsuario.SUPERADMIN, FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.ADMIN_CLIENTE, FuncaoUsuario.USUARIO_ESCRITORIO], 
      },
      { 
        nome: 'Relatórios Hy Cite', 
        caminho: '/relatorios-hycite', 
        icone: IconeHyCite, 
        funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO, FuncaoUsuario.ADMIN_CLIENTE, FuncaoUsuario.USUARIO_CLIENTE],
      },
      { 
        nome: 'Ponto e Produtividade', 
        caminho: '/ponto-produtividade', 
        icone: IconePontoProdutividade, 
        funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO], 
      },
    ]
  },
  { 
    nome: 'Consultoria Tributária', 
    caminho: '/consultoria-tributaria', 
    icone: IconeConsultoriaTributaria, 
    funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.USUARIO_ESCRITORIO, FuncaoUsuario.SUPERADMIN]
  },
];

export const ITENS_MENU_UTILIDADES: ItemNavegacao[] = [
 { 
    nome: 'Configurações', 
    caminho: '/configuracoes', 
    icone: IconeConfiguracoes, 
    funcoesPermitidas: Object.values(FuncaoUsuario),
    subItens: [
        {
            nome: 'Cadastro de CNAEs',
            caminho: '/cadastro-cnaes',
            icone: IconeCnae,
            funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.SUPERADMIN]
        },
        {
            nome: 'IntegraContador SERPRO',
            caminho: '/integracontador-admin',
            icone: IconeSerpro,
            funcoesPermitidas: [FuncaoUsuario.ADMIN_ESCRITORIO, FuncaoUsuario.SUPERADMIN]
        }
    ]
 },
 { nome: 'Logs de Auditoria', caminho: '/auditoria', icone: IconeAuditoria, funcoesPermitidas: [FuncaoUsuario.SUPERADMIN, FuncaoUsuario.ADMIN_ESCRITORIO] },
 { nome: 'Central de Ajuda', caminho: '/ajuda', icone: IconeAjuda, funcoesPermitidas: Object.values(FuncaoUsuario) },
];

export const ITENS_MENU_SAAS_ADMIN: ItemNavegacao[] = [
  { nome: 'Admin SAAS Central', caminho: '/admin-saas', icone: IconeAdminSaas, funcoesPermitidas: [FuncaoUsuario.SUPERADMIN] },
];


export const NIXCON_LOGO_URL = "https://www.gruponixcon.com.br/wp-content/uploads/2023/10/logo-nixcon.png"; 
export const NOME_APLICACAO = "Portal Grupo Nixcon 4.0";
