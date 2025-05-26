
import React from 'react';

// Define as funções de usuário no sistema
export enum FuncaoUsuario {
  SUPERADMIN = 'SuperAdmin',
  ADMIN_ESCRITORIO = 'AdminEscritorio', // Admin do escritório de contabilidade
  USUARIO_ESCRITORIO = 'UsuarioEscritorio', // Usuário interno do escritório
  ADMIN_CLIENTE = 'AdminCliente', // Admin da empresa cliente
  USUARIO_CLIENTE = 'UsuarioCliente', // Usuário da empresa cliente
  USUARIO_EXTERNO_CLIENTE = 'UsuarioExternoCliente', // Convidado pela empresa cliente
  CONTADOR_EXTERNO_CLIENTE = 'ContadorExternoCliente' // Contador externo da empresa cliente
}

// Representa um usuário no sistema
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  funcao: FuncaoUsuario;
  tenantId: string; // ID do tenant ao qual o usuário pertence (escritório OU empresa cliente durante personificação ou contexto de usuário externo)
  avatarUrl?: string;
  ativo: boolean; 
  accessibleEmpresaIds?: string[]; 
}

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export type RegimeTributario = 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | 'MEI' | 'OUTRO';

export type TipoApiWhatsapp = 'EVOLUTION' | 'META_OFICIAL' | 'NENHUMA';

export interface ConfiguracoesWhatsapp {
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  evolutionApiInstance?: string;
  metaAppId?: string;
  metaBusinessAccountId?: string;
  metaAccessToken?: string;
  metaPhoneNumberId?: string; 
  apiParaAlertas?: TipoApiWhatsapp; 
  apiParaAtendimento?: TipoApiWhatsapp; 
}

export interface ConfiguracoesEmissor {
  integraNotasApiKey?: string;
  certificadoConfigurado?: boolean; 
  nomeCertificado?: string;
  cnpj?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  endereco?: Endereco;
  regimeTributario?: RegimeTributario;
  telefone?: string;
  email?: string;
  cnaePrincipal?: string; 
  listaServicos?: string; 
  configuracoesWhatsapp?: ConfiguracoesWhatsapp;
}

export interface ConfiguracoesVisuais {
  logoPrincipalUrl?: string; // Para sidebar, relatórios
  logoReduzidaUrl?: string;  // Para favicons, ícones menores
  avatarPadraoUrl?: string;  // Fallback para avatares de usuário
  // corPrimaria?: string; // Futuro
  // corSecundaria?: string; // Futuro
}

// Novas interfaces para Configurações dos Módulos
export interface FiscalModuloConfig {
  seriePadraoNFe?: string;
  ambienteEmissaoNFe?: 'HOMOLOGACAO' | 'PRODUCAO';
  aliquotaISSPadrao?: number;
}

export interface FinanceiroModuloConfig {
  contaBancariaPadraoId?: string; // ID mock
  centroCustoPadrao?: string;
}

export interface TarefasModuloConfig {
  notificarResponsavelEmail?: boolean;
  prazoPadraoDias?: number;
}

export interface DocumentosModuloConfig {
  categoriaPadraoUpload?: string;
  habilitarVersionamento?: boolean;
}

export interface ModuloConfigs {
  fiscal?: FiscalModuloConfig;
  financeiro?: FinanceiroModuloConfig;
  tarefas?: TarefasModuloConfig;
  documentos?: DocumentosModuloConfig;
  // Adicionar outros módulos conforme necessário
}


// Representa um tenant (escritório de contabilidade)
export interface Tenant {
  id: string;
  nome: string;
  configuracoesEmissor?: ConfiguracoesEmissor; 
  usuariosDoTenant?: Usuario[]; 
  configuracoesVisuais?: ConfiguracoesVisuais; 
  configuracoesModulos?: ModuloConfigs; // Novo campo para configurações dos módulos
}

export interface ItemNavegacao {
  nome: string;
  caminho: string;
  icone: React.ReactElement<React.SVGProps<SVGSVGElement>> | ((props: React.SVGProps<SVGSVGElement>) => React.ReactNode) ; 
  subItens?: ItemNavegacao[]; 
  funcoesPermitidas?: FuncaoUsuario[]; 
}

export type TipoProduto = 'PRODUTO' | 'SERVICO' | 'KIT';
export type OrigemTenantProduto = 'UNIVERSAL_ESCRITORIO' | 'ESPECIFICO_CLIENTE';

export interface ComponenteKit {
  produtoId: string; 
  quantidade: number; 
  descricaoComponente?: string; 
  precoCustoComponente?: number;
  precoVendaComponente?: number;
}

export interface Produto {
  id: string; 
  codigoBarras?: string; 
  codigoInterno?: string; 
  tipoProduto: TipoProduto; 
  descricao: string; 
  precoCusto: number; 
  precoVendaVarejo: number; 
  precoVendaAtacado?: number; 
  quantidadeMinimaAtacado?: number; 
  unidade: string; 
  ativo: boolean; 
  categoria?: string; 
  subCategoria?: string; 
  movimentaEstoque: boolean; 
  estoqueMinimo?: number; 
  quantidadeEmEstoque?: number; 
  marca?: string; 
  modelo?: string; 
  ncm?: string; 
  cfop?: string; 
  origemFiscal?: string; 
  cest?: string; 
  icmsCst?: string; 
  icmsAliquota?: number; 
  pisCst?: string; // Legacy, pode ser usado para PIS Saída Padrão se não houver cstPisSaida
  pisAliquota?: number; // Legacy, pode ser usado para Alíquota PIS Padrão se não houver aliquotaPisEspecifica
  cofinsCst?: string; // Legacy, pode ser usado para COFINS Saída Padrão se não houver cstCofinsSaida
  cofinsAliquota?: number; // Legacy, pode ser usado para Alíquota COFINS Padrão se não houver aliquotaCofinsEspecifica
  origemTenant: OrigemTenantProduto; 
  escritorioTenantId?: string; 
  clienteTenantId?: string; 
  universalProdutoIdOriginal?: string; 
  tenantsComAcesso?: string[]; 
  alturaCm?: number;
  larguraCm?: number;
  profundidadeCm?: number;
  pesoKg?: number;
  tags?: string[]; 
  descricaoLojaVirtual?: string; 
  garantia?: string; 
  itensInclusos?: string; 
  especificacoesTecnicas?: string; 
  componentesKit?: ComponenteKit[]; 
  dataCriacao: string; 
  dataAtualizacao: string; 
  permiteRateioDesconto?: boolean; // Novo campo para controle de desconto

  // Campos para EFD Contribuições
  cstPisEntrada?: string;
  cstPisSaida?: string;
  cstCofinsEntrada?: string;
  cstCofinsSaida?: string;
  naturezaReceitaPisCofins?: string; // Código da tabela 4.3.10 ou 4.3.11
  aliquotaPisEspecifica?: number;
  aliquotaCofinsEspecifica?: number;
}

export enum TipoDocumentoFiscal {
  NFe = 'NF-e', 
  NFSe = 'NFS-e', 
  NFCe = 'NFC-e', 
  ENTRADA = 'Nota de Entrada', // Adicionado para Escrita Fiscal
}

export enum StatusNotaFiscal {
  PENDENTE = 'Pendente',
  PROCESSANDO = 'Processando Emissão',
  EMITIDA = 'Emitida', // Para NFe/NFCe/NFSe
  LANCADA = 'Lançada',   // Para Notas de Entrada (Escrita Fiscal)
  CANCELADA = 'Cancelada',
  ERRO = 'Erro na Emissão',
  CONSULTAR_RECIBO = 'Consultar Recibo', 
}

export interface ItemNotaFiscal {
  id: string; 
  produtoId?: string; 
  codigoProduto?: string; // Adicionado para referência no lançamento
  descricao: string;
  unidade?: string; // Adicionado
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  ncm?: string; 
  codigoServico?: string; 
  cnae?: string; 
  cfop?: string;
  icmsAliquota?: number;
  pisAliquota?: number;
  cofinsAliquota?: number;
  issAliquota?: number; 
  codigoTributacaoNacional?: string; 
  itemListaServicoLC116?: string; 
  valorDescontoItem?: number; // Adicionado
  valorOutrasDespesasItem?: number; // Adicionado
}

export interface DestinatarioNota { // Usado para NF-e, NFS-e, NFC-e
  nomeRazaoSocial: string;
  cpfCnpj: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  email?: string;
  endereco: Endereco;
  telefone?: string; 
}

export interface FornecedorNota { // Usado para Notas de Entrada
  nomeRazaoSocial: string;
  cpfCnpj: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  endereco?: Endereco; // Endereço do fornecedor pode ser opcional no lançamento simplificado
}

export interface EmitenteNota extends ConfiguracoesEmissor {}

export type TipoEmpresaSimulacao = 'NORMAL' | 'HY_CITE';

export type FormaPagamento = 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX' | 'BOLETO' | 'TRANSFERENCIA' | 'CHEQUE' | 'CREDIARIO' | 'OUTRO';
export const FormasPagamentoOptions: { value: FormaPagamento, label: string }[] = [
    { value: 'DINHEIRO', label: 'Dinheiro' },
    { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
    { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
    { value: 'PIX', label: 'PIX' },
    { value: 'BOLETO', label: 'Boleto Bancário' },
    { value: 'TRANSFERENCIA', label: 'Transferência Bancária' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'CREDIARIO', label: 'Crediário (Loja)' },
    { value: 'OUTRO', label: 'Outro' },
];


export interface PagamentoNota {
  id: string; 
  forma: FormaPagamento;
  valor: number;
  descricaoOutro?: string;
  detalhesCartao?: {
    bandeira?: 'VISA' | 'MASTERCARD' | 'ELO' | 'AMEX' | 'HIPERCARD' | 'OUTRA';
    numeroAutorizacao?: string;
  };
  chavePix?: string;
  parcelas?: number; 
}

export type ModalidadeFrete = 'SEM_FRETE' | 'EMITENTE' | 'DESTINATARIO' | 'TERCEIROS';
export const ModalidadesFreteOptions: { value: ModalidadeFrete, label: string }[] = [
    { value: 'SEM_FRETE', label: 'Sem Frete' },
    { value: 'EMITENTE', label: 'Por Conta do Emitente (CIF)' },
    { value: 'DESTINATARIO', label: 'Por Conta do Destinatário (FOB)' },
    { value: 'TERCEIROS', label: 'Por Conta de Terceiros' },
];

export interface TransportadoraNota {
  nomeRazaoSocial?: string;
  cpfCnpj?: string;
  inscricaoEstadual?: string;
  endereco?: Endereco;
  placaVeiculo?: string;
  ufVeiculo?: string;
  modalidadeFrete: ModalidadeFrete;
  quantidadeVolumes?: number;
  especieVolumes?: string; 
  marcaVolumes?: string; 
  numeracaoVolumes?: string;
  pesoBruto?: number; 
  pesoLiquido?: number; 
}


export interface NotaFiscal {
  id: string; 
  tipoDocumento: TipoDocumentoFiscal;
  numero?: string; 
  serie?: string; 
  chaveAcesso?: string; 
  protocoloAutorizacao?: string; 
  dataEmissao: string; 
  dataEntradaSaida?: string; // Para notas de entrada ou data de saída efetiva
  dataAutorizacao?: string;
  destinatario?: DestinatarioNota; // Opcional para Nota de Entrada
  fornecedor?: FornecedorNota; // Específico para Nota de Entrada
  emitente?: EmitenteNota; // Se for nota emitida pelo sistema
  itens: ItemNotaFiscal[];
  pagamentos?: PagamentoNota[]; 
  transportadora?: TransportadoraNota; 
  valorTotalProdutos?: number; 
  valorTotalServicos?: number; 
  valorDesconto?: number;
  valorFrete?: number;
  valorSeguro?: number;
  outrasDespesas?: number;
  valorTotalNota: number;
  status: StatusNotaFiscal;
  naturezaOperacao?: string; // Mais genérico para NF-e/NFC-e, pode ser CFOP principal
  cfopPrincipal?: string; // Específico para Notas de Entrada/Saída
  informacoesAdicionais?: string;
  xml?: string; 
  pdfUrl?: string; 
  mensagensErro?: string[]; 
  reciboLote?: string; 
  idIntegracaoApi?: string; 
  urlConsultaApi?: string; 
  tipoEmpresaSimulacao?: TipoEmpresaSimulacao; 
  tenantId: string; 
}

export type PrioridadeTarefa = 'ALTA' | 'MEDIA' | 'BAIXA';
export type StatusTarefa = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export interface RecorrenciaConfig {
  tipo: TiposRecorrencia;
  intervalo?: number; 
  diaDaSemana?: number; 
  diaDoMes?: number; 
  mes?: number; 
  dataFimRecorrencia?: string; 
}

export interface DocumentoVinculado {
  id: string; 
  nome: string; 
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao?: string;
  responsavelId?: string;
  responsavelNome?: string; 
  prioridade: PrioridadeTarefa;
  prazo?: string; 
  status: StatusTarefa;
  dataCriacao: string; 
  dataConclusao?: string; 
  tenantId: string; 
  criadorId: string;
  criadorNome?: string; 
  recorrencia?: RecorrenciaConfig;
  clienteEmpresaId?: string; 
  clienteEmpresaNome?: string; 
  documentosVinculados?: DocumentoVinculado[]; 
}

export type StatusEmpresa = 'ATIVO' | 'MOVIMENTO' | 'BAIXADO' | 'SUSPENSO' | 'PROSPECCAO';

export interface ConfiguracoesEfdContribuicoes {
  id: string; // Geralmente o ID da empresa/tenant
  regimeApuracao: 'CAIXA' | 'COMPETENCIA';
  tipoEscrituracao: 'COMPLETA_REGISTROS' | 'CONSOLIDADA_NOTA_A_NOTA' | 'CONSOLIDADA_OPERACAO';
  criterioEscrituracaoPresumido: 'CAIXA_RECEBIMENTO' | 'COMPETENCIA_EMISSAO';
  versaoLeiaute: string; // Ex: "007"
  indNaturezaPj: string; // Código da Tabela 3.1.1 (PJ em Geral, Soc. Cooperativa, etc.)
  indAtividadePreponderante: string; // Código da Tabela 5.1.1 (Industrial, Serviços, Comércio, etc.)
  aliquotaPisPadrao?: number; // Ex: 0.65 para Lucro Presumido
  aliquotaCofinsPadrao?: number; // Ex: 3.00 para Lucro Presumido
}

export interface Empresa {
  id: string; 
  nome: string;
  cnpj: string;
  email?: string;
  telefone?: string;
  contatoPrincipal?: string;
  status: StatusEmpresa;
  regimeTributario?: RegimeTributario; 
  honorarios?: number; 
  diaVencimentoHonorarios?: number; 
  dataInicioContrato?: string; 
  dataFimContrato?: string; 
  endereco: Endereco; 
  cpfResponsavelLegal?: string;
  tenantId: string; 
  tipoEmpresaSimulacao?: TipoEmpresaSimulacao; 
  dataCadastro: string; 
  dataAtualizacao: string; 
  configuracoesEmissor?: ConfiguracoesEmissor; 
  configuracoesEfd?: ConfiguracoesEfdContribuicoes; 
  usuariosDaEmpresa?: Usuario[]; 
}


export enum ModalidadeDistribuidorHyCite {
  DJ = 'DJ',
  D3 = 'D3',
  D2 = 'D2',
  D1 = 'D1',
  BLUE = 'Blue'
}

export interface TaxaConfiguravelHyCite {
  id: string;
  tituloOriginal: string;
  descricaoOriginal: string;
  apelido?: string;
  valorPercentual?: number;
  valorFixo?: number;
  baseCalculo?: string; 
  observacoes?: string;
  editavel: boolean; 
}

export interface ConfiguracaoModalidadeHyCite {
  modalidade: ModalidadeDistribuidorHyCite;
  taxas: TaxaConfiguravelHyCite[];
}

export interface ResultadosSimulacao {
  faturamentoTotal: number;
  custoTotalProdutos: number;
  impostosSobreComprasEstimativa: number;
  difalEstimativa: number;
  impostosSobreVendasTotalMock: number; 
  lucroBrutoEstimadoTotalMock: number; 
  detalhamentoProdutos: ProdutoSimulacao[]; 
  tipoEmpresaSimulacao?: TipoEmpresaSimulacao;
  nivelDistribuidorHyCite?: ModalidadeDistribuidorHyCite; 
  taxasHyCiteAplicadas?: Array<{ 
    idTaxa: string;
    tituloTaxa: string;
    valorCalculado: number;
    tipoValor: 'PERCENTUAL' | 'FIXO';
    baseCalculoUsada?: string; 
    observacoes?: string;
  }>;
  observacoesNotaFiscal?: string; 
  descontoTotalAplicado?: number; 
  percentualDescontoTotalAplicado?: number; 
  regimeSimulado?: RegimeTributario;
  detalhamentoTributos?: {
    nome: string; 
    valor: number;
    aliquotaEfetiva?: string; 
    observacao?: string; 
  }[];
  fatorRCalculado?: number; 
  observacaoFatorR?: string; 
}
export interface ProdutoSimulacao extends Produto { 
  quantidade: number;
  valorFinalUnitario: number; 
  descontoCalculado: number; 
  faturamentoItem: number;
  custoItem: number;
  impostoSobreVendaItemMock: number;
  lucroBrutoItemMock: number;
  participaRateioDesconto?: boolean; 
}

export interface LinhaExtratoCalculada {
  titulo: string;
  descricao: string;
  valorCalculado?: string | number;
  observacaoConfig?: string;
  idTaxaConfig?: string; 
}

export interface PersonificacaoInfo {
  empresaId: string;
  empresaNome: string;
  roleOriginal: FuncaoUsuario; 
  rolePersonificado: FuncaoUsuario; 
  personifiedUserId?: string; 
  personifiedUserNome?: string; 
}

export type Theme = 'light' | 'dark';

export interface AuthContextType {
  usuarioAtual: Usuario | null;
  tenantAtual: Tenant | null; 
  estaAutenticado: boolean;
  isLoading: boolean;
  login: (email: string, senha_mock: string) => Promise<void>;
  logout: () => void;
  setTenantConfiguracoesEmissor: (config: ConfiguracoesEmissor) => void; 
  salvarUsuariosDoTenant: (usuarios: Usuario[]) => void; 
  setTenantVisualConfigs: (config: ConfiguracoesVisuais) => void; 
  setTenantConfiguracoesModulos: (configs: ModuloConfigs) => void;

  personificandoInfo: PersonificacaoInfo | null;
  iniciarPersonificacao: (empresa: Empresa, roleToPersonify?: FuncaoUsuario, userIdToPersonify?: string) => void; 
  pararPersonificacao: () => void;

  switchActiveCompanyForExternalUser: (empresaId: string) => void;

  activeClientCompanyContext: Empresa | null;
  switchActiveClientCompanyContext: (empresa: Empresa | null) => void;

  theme: Theme;
  toggleTheme: () => void;
}

export interface EventoCalendario {
  id: string;
  titulo: string;
  dataInicio: string; 
  dataFim?: string; 
  diaInteiro?: boolean;
  descricao?: string;
  cor?: string; 
  tenantId: string;
  criadorId: string;
  criadorNome?: string;
}

export enum TiposRecorrencia {
  DIARIA = 'DIARIA',
  SEMANAL = 'SEMANAL',
  MENSAL = 'MENSAL',
  BIMESTRAL = 'BIMESTRAL',
  TRIMESTRAL = 'TRIMESTRAL',
  SEMESTRAL = 'SEMESTRAL',
  ANUAL = 'ANUAL',
}

export const DIAS_SEMANA_MAP: { [key: number]: string } = {
  0: 'Domingo', 1: 'Segunda-feira', 2: 'Terça-feira', 3: 'Quarta-feira',
  4: 'Quinta-feira', 5: 'Sexta-feira', 6: 'Sábado'
};

export const MESES_MAP: { [key: number]: string } = {
  1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril', 5: 'Maio', 6: 'Junho',
  7: 'Julho', 8: 'Agosto', 9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
};

export interface Documento {
  id: string;
  nome: string;
  categoria: string; 
  dataUpload: string; 
  tamanho: string; 
  arquivoMock?: File; 
  tenantId: string; 
  url?: string; 
  tipoArquivo?: string;
  detalhesGeracao?: { 
    nomeTemplateUsado: string;
    empresaClienteNome: string;
    conteudoFinalGerado: string; 
    processoAssinaturaId?: string;
  };
}

export type StatusContaPagar = 'PENDENTE' | 'PAGA' | 'ATRASADA' | 'CANCELADA';
export interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string; // ISO date string
  status: StatusContaPagar;
  tenantId: string;
  fornecedor?: string;
  categoria?: string;
  dataPagamento?: string; // ISO date string
}

export type StatusContaReceber = 'A_RECEBER' | 'RECEBIDA' | 'ATRASADA' | 'CANCELADA' | 'BOLETO_GERADO';
export interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: string; // ISO date string
  status: StatusContaReceber;
  tenantId: string;
  clienteNome?: string;
  categoria?: string;
  dataRecebimento?: string; // ISO date string
  nossoNumeroBoleto?: string; 
}

export interface TransacaoExtrato {
  id: string; 
  data: string; 
  descricaoOriginal: string; 
  valor: number; 
  tipo: 'CREDITO' | 'DEBITO';
  tenantId: string; 
  idArquivoExtrato?: string; 
}

export interface LancamentoConciliacao { 
  idOriginalLancamento: string;
  tipoOriginalLancamento: 'PAGAR' | 'RECEBER';
  descricao: string;
  dataVencimento: string;
  valor: number;
  statusOriginal: StatusContaPagar | StatusContaReceber;
}

export interface SugestaoConciliacao {
  id: string; 
  transacaoExtrato: TransacaoExtrato;
  lancamentoSugerido: LancamentoConciliacao; 
  similaridade?: number; 
  confirmadaManualmente?: boolean;
  tenantId: string;
}

export type StatusProcessamentoXml = 'PENDENTE' | 'PROCESSADO' | 'ERRO_LEITURA' | 'ERRO_VALIDACAO';
export const STATUS_PROCESSAMENTO_XML_VALUES: StatusProcessamentoXml[] = ['PENDENTE', 'PROCESSADO', 'ERRO_LEITURA', 'ERRO_VALIDACAO'];


export interface ArquivoXmlInfo {
  id: string;
  nomeArquivo: string;
  tipoNota: TipoDocumentoFiscal | 'OUTRO_XML'; 
  dataUpload: string; 
  statusProcessamento: StatusProcessamentoXml;
  tenantId: string;
  chaveAcesso?: string; 
  protocoloAutorizacao?: string; 
  numeroNota?: string;
  serieNota?: string;
  nomeEmitente?: string;
  cnpjEmitente?: string;
  nomeDestinatario?: string;
  cnpjDestinatario?: string;
  valorNota?: number;
  dataEmissaoNota?: string; 
  mensagensErro?: string;
}

// Módulo de Assinatura Eletrônica
export type StatusAssinaturaDocumento = 
  | 'PENDENTE_TODOS'          
  | 'AGUARDANDO_SIGNATARIO' 
  | 'PARCIALMENTE_ASSINADO'   
  | 'CONCLUIDO'               
  | 'CANCELADO'               
  | 'EXPIRADO'                
  | 'RECUSADO';               

export type StatusSignatario = 'PENDENTE' | 'ASSINADO' | 'RECUSADO';

export interface Signatario {
  id: string; 
  nome: string;
  email: string;
  status: StatusSignatario;
  ordem?: number; 
  dataAssinatura?: string; 
  dataRecusa?: string; 
  motivoRecusa?: string;
}

export interface DocumentoParaAssinatura {
  id: string; 
  nomeDocumentoCliente: string; 
  idDocumentoOriginal?: string; 
  documentoOriginalTenantId?: string; 
  nomeOriginalArquivo?: string; 
  dataEnvio: string; 
  dataExpiracao?: string; 
  statusGeral: StatusAssinaturaDocumento;
  signatarios: Signatario[];
  tenantId: string; 
  criadorId: string;
  criadorNome?: string;
  mensagemOpcional?: string;
  documentoAssinadoUrlMock?: string; 
  proximoSignatarioNaOrdem?: number; 
  historicoEventos?: Array<{ data: string; evento: string; detalhes?: string }>;
  tipoAssinatura: 'SEQUENCIAL' | 'PARALELA';
  nomeTemplateUsadoContexto?: string; 
  empresaClienteNomeContexto?: string; 
}

// Módulo de Comunicações
export type TipoCanal = 'CHAT_INTERNO_ESCRITORIO' | 'CANAL_EMPRESA_CLIENTE' | 'CHAT_DIRETO' | 'AVISOS_AUTOMATICOS';
export interface ParticipanteCanal {
  idUsuario: string;
  nomeUsuario: string;
}

export interface CanalComunicacao {
  id: string; 
  nome: string; 
  tipo: TipoCanal;
  tenantId?: string; 
  empresaClienteId?: string; 
  participantes?: ParticipanteCanal[]; 
  ultimaMensagemTexto?: string;
  timestampUltimaMensagem?: number; 
  naoLidas?: number; 
  avatarUrlMock?: string;
  corAvatarMock?: string; 
  atendenteResponsavelId?: string;
  atendenteResponsavelNome?: string;
  statusAtendimento?: 'ABERTO' | 'PENDENTE_CLIENTE' | 'PENDENTE_ATENDENTE' | 'RESOLVIDO' | 'ARQUIVADO';
  ehChatbotAtivo?: boolean;
  tags?: string[];
}

export interface MensagemComunicacao {
  id: string;
  canalId: string;
  remetenteId: string;
  remetenteNome: string;
  remetenteAvatarUrl?: string;
  avatarCorMock?: string; 
  conteudo: string;
  timestamp: number; 
  tipoRemetente?: 'USUARIO_SISTEMA' | 'CLIENTE_WHATSAPP' | 'CHATBOT_IA' | 'SISTEMA_AUTOMATICO';
}

export interface ConfiguracaoChatbotIA {
  id: string;
  tenantId: string; 
  nomeAgente: string; 
  promptBase: string; 
  saudacaoInicial: string; 
  mensagemTransferenciaHumano: string; 
  gatilhosTransferencia?: string[]; 
  ativo: boolean;
}

export interface DepartamentoAtendimento {
  id: string;
  nome: string;
  tenantId: string;
}

export interface MovimentacaoEstoque {
  id: string;
  produtoId: string;
  produtoDescricao: string;
  tipo: 'ENTRADA' | 'SAIDA';
  quantidade: number;
  motivo: string;
  data: string; // ISO date string
  usuarioResponsavelNome: string;
  saldoAnterior: number;
  saldoApos: number;
  tenantId: string;
}

// Módulo de Geração de Documentos
export interface TemplateDocumento {
  id: string;
  nome: string;
  descricao?: string;
  conteudo: string; 
  placeholdersUtilizados?: string[]; 
  tenantId: string; 
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface DocumentoGerado {
  id: string;
  nomeDocumento: string; 
  templateIdUsado: string;
  nomeTemplateUsado: string;
  empresaClienteId: string;
  empresaClienteNome: string;
  dataGeracao: string;
  conteudoFinalGerado?: string; 
  documentoSalvoId?: string; 
  processoAssinaturaId?: string; 
  tenantId: string; 
}

// Módulo de Honorários
export type UnidadeServicoContabil = 'MENSAL' | 'HORA' | 'UNICO' | 'ANUAL' | 'POR_EVENTO';
export type PeriodicidadeCobranca = 'MENSAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'UNICA';
export type StatusContratoHonorarios = 'ATIVO' | 'SUSPENSO' | 'CANCELADO' | 'CONCLUIDO';
export type StatusFaturaHonorarios = 'PENDENTE' | 'PAGA' | 'VENCIDA' | 'CANCELADA';


export interface ServicoContabil {
  id: string;
  nome: string;
  descricao?: string;
  valorPadrao: number;
  unidade: UnidadeServicoContabil;
  tenantId: string; // Escritório ao qual o serviço pertence
}

export interface ItemContratoHonorarios {
  id: string; // uuid para o item no contrato
  servicoContabilId: string; // Id do ServicoContabil
  descricaoPersonalizada?: string; // Se o nome do serviço no contrato for diferente do padrão
  valorCobrado: number; // Valor acordado para este serviço neste contrato
  quantidade: number; // Default 1
  periodicidadeCobranca: PeriodicidadeCobranca; // Ex: Mensal, Única
}

export interface ContratoHonorarios {
  id: string;
  empresaClienteId: string;
  empresaClienteNome: string; // Denormalizado para facilitar exibição
  numeroContrato?: string; // Opcional
  dataInicio: string; // ISO Date
  dataFim?: string; // ISO Date, opcional
  diaVencimentoFatura: number; // 1-31
  itens: ItemContratoHonorarios[];
  observacoes?: string;
  status: StatusContratoHonorarios;
  dataCriacao: string; // ISO DateTime
  dataAtualizacao: string; // ISO DateTime
  tenantId: string; // ID do escritório que emitiu o contrato
}

export interface FaturaHonorarios {
  id: string;
  contratoId: string;
  empresaClienteId: string;
  empresaClienteNome: string;
  referenciaMesAno: string; // Ex: "07/2024"
  dataEmissao: string; // ISO Date
  dataVencimento: string; // ISO Date
  itensFaturados: ItemContratoHonorarios[]; // Snapshot dos itens na data da fatura
  valorTotal: number;
  status: StatusFaturaHonorarios;
  linkBoletoMock?: string;
  dataPagamento?: string; // ISO Date
  observacoesInternas?: string;
  tenantId: string; // ID do escritório
}

// Módulo Contabilidade
export interface ContaContabil {
  id: string; 
  codigo: string; 
  codigoReduzido?: string;
  descricao: string;
  tipo: 'ANALITICA' | 'SINTETICA';
  natureza: 'DEVEDORA' | 'CREDORA' | 'MISTA';
  grupo: string; 
  nivel: number; 
  contaPaiId?: string;
  permiteLancamentos: boolean;
  tenantId: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

// Módulo Lalur
export interface ParteALalurLacs {
  id: string; 
  data: string; 
  historico: string;
  tipo: 'ADICAO' | 'EXCLUSAO' | 'COMPENSACAO_PREJUIZO';
  valor: number;
  contaContabilContrapartida?: string; 
  relacionadoParteBId?: string;
  contaParteBNome?: string; // Denormalizado para exibição
  documentoReferencia?: string;
  tenantId: string;
}

export interface ParteBLalurLacs {
  id: string; 
  codigoConta: string; 
  descricaoConta: string;
  dataCriacaoConta: string;
  saldoInicial: number;
  movimentacoes: Array<{ data: string; historico: string; valor: number; tipoMov: 'DEBITO' | 'CREDITO'; parteARelacionadaId?: string }>;
  saldoFinal: number; // Calculado
  indPrejuizoExercicio: boolean;
  indExercicioAnterior: boolean;
  tenantId: string;
}


// EFD Contribuições - Constantes para Selects
export const CST_PIS_COFINS_SAIDA_OPCOES = [
  { codigo: '01', descricao: '01 - Operação Tributável com Alíquota Básica' },
  { codigo: '02', descricao: '02 - Operação Tributável com Alíquota Diferenciada' },
  { codigo: '03', descricao: '03 - Operação Tributável com Alíquota por Unidade de Medida de Produto' },
  { codigo: '04', descricao: '04 - Operação Tributável Monofásica - Revenda a Alíquota Zero' },
  { codigo: '05', descricao: '05 - Operação Tributável por Substituição Tributária' },
  { codigo: '06', descricao: '06 - Operação Tributável a Alíquota Zero' },
  { codigo: '07', descricao: '07 - Operação Isenta da Contribuição' },
  { codigo: '08', descricao: '08 - Operação sem Incidência da Contribuição' },
  { codigo: '09', descricao: '09 - Operação com Suspensão da Contribuição' },
  { codigo: '49', descricao: '49 - Outras Operações de Saída' },
];

export const CST_PIS_COFINS_ENTRADA_OPCOES = [
  { codigo: '50', descricao: '50 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita Tributada no Mercado Interno' },
  { codigo: '51', descricao: '51 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita Não Tributada no Mercado Interno' },
  { codigo: '52', descricao: '52 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita de Exportação' },
  { codigo: '53', descricao: '53 - Operação com Direito a Crédito - Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno' },
  // Adicionar mais conforme necessidade
  { codigo: '60', descricao: '60 - Crédito Presumido - Operação de Aquisição Vinculada Exclusivamente a Receita Tributada no Mercado Interno' },
  { codigo: '70', descricao: '70 - Operação de Aquisição sem Direito a Crédito' },
  { codigo: '98', descricao: '98 - Outras Operações de Entrada com Crédito' },
  { codigo: '99', descricao: '99 - Outras Operações de Entrada sem Crédito' },
];

export const NATUREZA_RECEITA_OPCOES = [
  { codigo: '001', descricao: '001 - Receita Bruta Sujeita à Alíquota Básica (Serviços)' },
  { codigo: '002', descricao: '002 - Receita Bruta Sujeita à Alíquota Básica (Venda de Mercadorias)' },
  // Adicionar mais conforme tabelas 4.3.10, 4.3.11, 4.3.13 etc.
  { codigo: '101', descricao: '101 - Venda de Álcool para Fins Carburantes' },
  { codigo: '999', descricao: '999 - Outras Receitas' },
];

export interface ArquivoEfdGerado {
  id: string;
  nomeArquivo: string;
  mesReferencia: number; // 1-12
  anoReferencia: number;
  dataGeracao: string; // ISO
  tenantId: string;
  linkDownloadMock?: string;
}

// Módulo Cadastro de CNAEs
export type AnexoSimplesNacional = 'I' | 'II' | 'III' | 'IV' | 'V' | 'NAO_SE_APLICA';
export const ANEXOS_SIMPLES_NACIONAL_OPTIONS: { value: AnexoSimplesNacional, label: string }[] = [
  { value: 'I', label: 'Anexo I (Comércio)' },
  { value: 'II', label: 'Anexo II (Indústria)' },
  { value: 'III', label: 'Anexo III (Serviços)' },
  { value: 'IV', label: 'Anexo IV (Serviços)' },
  { value: 'V', label: 'Anexo V (Serviços)' },
  { value: 'NAO_SE_APLICA', label: 'Não se Aplica / Outro' },
];

export interface CnaeInfo {
  id: string;
  codigo: string; // Ex: "62.01-5-01" ou "6201501"
  descricao: string;
  codigosServicoLc116?: string[]; // Lista de códigos de serviço (LC 116/03) associados
  anexoSimplesNacional?: AnexoSimplesNacional;
  permiteMei?: boolean;
  observacoes?: string; // Para alíquotas, detalhes específicos, etc.
  tenantId: string; // "global" ou ID do escritório para customizações
}
