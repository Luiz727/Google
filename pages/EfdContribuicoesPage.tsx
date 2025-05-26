
import React, { useState, useEffect, useMemo, FormEvent, ChangeEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeFiscal, IconeConfiguracoes, IconeDocumentos, IconeCaixa, IconeLixeira } from '../components/common/Icons';
import { useAuth } from '../contexts/AuthContext';
import { 
  FuncaoUsuario, 
  ConfiguracoesEfdContribuicoes, 
  Empresa, 
  Produto,
  Tenant,
  NotaFiscal,
  ItemNotaFiscal,
  CST_PIS_COFINS_ENTRADA_OPCOES, // Importado de types.ts
  CST_PIS_COFINS_SAIDA_OPCOES,   // Importado de types.ts
  NATUREZA_RECEITA_OPCOES,       // Importado de types.ts
  ArquivoEfdGerado
} from '../types';
import { STORAGE_KEY_PREFIX as STORAGE_KEY_EMPRESAS_PREFIX } from './EmpresasPage';
import { STORAGE_KEY_PRODUTOS_PREFIX } from './EstoquePage'; 

const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400";
const selectClasses = `${inputClasses} bg-white dark:bg-gray-700`;
const STORAGE_KEY_EMPRESA_DATA_PREFIX = 'nixconPortalEmpresas_'; 
const NOTAS_FISCAIS_STORAGE_PREFIX = 'nixconPortalNotasFiscais_';
const STORAGE_KEY_ARQUIVOS_EFD_PREFIX = 'nixconPortalArquivosEfd_';


const EfdContribuicoesPage: React.FC = () => {
  const { usuarioAtual, tenantAtual, personificandoInfo, activeClientCompanyContext } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<'parametros' | 'produtosServicos' | 'apuracao' | 'historico'>('parametros');
  
  const [configEfd, setConfigEfd] = useState<Partial<ConfiguracoesEfdContribuicoes>>({});
  const [produtosParaConfig, setProdutosParaConfig] = useState<Produto[]>([]);

  // Estados para o modal de configuração de produto
  const [modalConfigProdutoAberto, setModalConfigProdutoAberto] = useState(false);
  const [produtoEditandoConfig, setProdutoEditandoConfig] = useState<Produto | null>(null);
  const [formConfigProduto, setFormConfigProduto] = useState<Partial<Produto>>({});

  // Estados para apuração
  const [mesReferenciaApuracao, setMesReferenciaApuracao] = useState<number>(new Date().getMonth() + 1);
  const [anoReferenciaApuracao, setAnoReferenciaApuracao] = useState<number>(new Date().getFullYear());
  const [resultadoApuracao, setResultadoApuracao] = useState<{
    basePis: number; totalPis: number; baseCofins: number; totalCofins: number;
  } | null>(null);
  const [isLoadingApuracao, setIsLoadingApuracao] = useState(false);
  const [arquivosEfdGerados, setArquivosEfdGerados] = useState<ArquivoEfdGerado[]>([]);


  const effectiveTenantId = useMemo(() => {
    if (personificandoInfo) return personificandoInfo.empresaId;
    if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && usuarioAtual.tenantId) return usuarioAtual.tenantId;
    if (activeClientCompanyContext && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN)) return activeClientCompanyContext.id;
    return usuarioAtual?.tenantId || tenantAtual?.id;
  }, [personificandoInfo, usuarioAtual, tenantAtual, activeClientCompanyContext]);

  const getTenantEscritorioId = (): string | undefined => tenantAtual?.id;
  const tenantEscritorioId = useMemo(getTenantEscritorioId, [tenantAtual]);


  useEffect(() => {
    if (effectiveTenantId && tenantEscritorioId) {
      const storageKeyEmpresasEscritorio = `${STORAGE_KEY_EMPRESA_DATA_PREFIX}${tenantEscritorioId}`;
      const empresasSalvasStr = localStorage.getItem(storageKeyEmpresasEscritorio);
      if (empresasSalvasStr) {
        const todasEmpresasDoEscritorio: Empresa[] = JSON.parse(empresasSalvasStr);
        const empresaContexto = todasEmpresasDoEscritorio.find(emp => emp.id === effectiveTenantId);
        if (empresaContexto && empresaContexto.configuracoesEfd) {
          setConfigEfd(empresaContexto.configuracoesEfd);
        } else {
          setConfigEfd({
            id: effectiveTenantId, regimeApuracao: 'COMPETENCIA', tipoEscrituracao: 'COMPLETA_REGISTROS',
            criterioEscrituracaoPresumido: 'COMPETENCIA_EMISSAO', versaoLeiaute: '007', indNaturezaPj: '00',
            indAtividadePreponderante: '1', aliquotaPisPadrao: 0.65, aliquotaCofinsPadrao: 3.00,
          });
        }
      }

      const storageKeyProdutos = `${STORAGE_KEY_PRODUTOS_PREFIX}${effectiveTenantId}`;
      const produtosSalvos = localStorage.getItem(storageKeyProdutos);
      setProdutosParaConfig(produtosSalvos ? JSON.parse(produtosSalvos) : []);

      const storageKeyArquivosEfd = `${STORAGE_KEY_ARQUIVOS_EFD_PREFIX}${effectiveTenantId}`;
      const arquivosSalvos = localStorage.getItem(storageKeyArquivosEfd);
      setArquivosEfdGerados(arquivosSalvos ? JSON.parse(arquivosSalvos) : []);

    }
  }, [effectiveTenantId, tenantEscritorioId]);

  useEffect(() => { // Salvar arquivos EFD gerados
    if (effectiveTenantId && arquivosEfdGerados.length >= 0) {
      const storageKeyArquivosEfd = `${STORAGE_KEY_ARQUIVOS_EFD_PREFIX}${effectiveTenantId}`;
      localStorage.setItem(storageKeyArquivosEfd, JSON.stringify(arquivosEfdGerados));
    }
  }, [arquivosEfdGerados, effectiveTenantId]);

  const handleChangeConfigEfd = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = name === 'aliquotaPisPadrao' || name === 'aliquotaCofinsPadrao' ? parseFloat(value) : value;
    setConfigEfd(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSalvarConfigEfd = (e: FormEvent) => {
    e.preventDefault();
    if (effectiveTenantId && tenantEscritorioId && configEfd) {
        const storageKeyEmpresasEscritorio = `${STORAGE_KEY_EMPRESA_DATA_PREFIX}${tenantEscritorioId}`;
        const empresasSalvasStr = localStorage.getItem(storageKeyEmpresasEscritorio);
        let todasEmpresasDoEscritorio: Empresa[] = empresasSalvasStr ? JSON.parse(empresasSalvasStr) : [];
        const empresaExiste = todasEmpresasDoEscritorio.some(emp => emp.id === effectiveTenantId);

        if (empresaExiste) {
            todasEmpresasDoEscritorio = todasEmpresasDoEscritorio.map(emp => 
                emp.id === effectiveTenantId ? { ...emp, configuracoesEfd: configEfd as ConfiguracoesEfdContribuicoes } : emp
            );
        } else {
            // Se a empresa não existe na lista do escritório (ex: é o próprio escritório), não faz nada aqui.
            // A lógica de salvar a config do próprio escritório deve ser separada ou o tenantAtual deve ser atualizado.
            // Por ora, focamos em salvar para empresas clientes.
            console.warn("Tentativa de salvar config EFD para empresa não encontrada na lista do escritório.");
        }
        localStorage.setItem(storageKeyEmpresasEscritorio, JSON.stringify(todasEmpresasDoEscritorio));
        alert("Configurações da EFD Contribuições salvas para esta empresa!");
    }
  };

  const handleAbrirModalConfigProduto = (produto: Produto) => {
    setProdutoEditandoConfig(produto);
    setFormConfigProduto({
      cstPisEntrada: produto.cstPisEntrada, cstPisSaida: produto.cstPisSaida,
      cstCofinsEntrada: produto.cstCofinsEntrada, cstCofinsSaida: produto.cstCofinsSaida,
      naturezaReceitaPisCofins: produto.naturezaReceitaPisCofins,
      aliquotaPisEspecifica: produto.aliquotaPisEspecifica,
      aliquotaCofinsEspecifica: produto.aliquotaCofinsEspecifica,
    });
    setModalConfigProdutoAberto(true);
  };
  
  const handleSalvarConfigProduto = (e: FormEvent) => {
    e.preventDefault();
    if (!produtoEditandoConfig || !effectiveTenantId) return;

    const produtosAtualizados = produtosParaConfig.map(p => 
      p.id === produtoEditandoConfig.id ? { ...p, ...formConfigProduto } : p
    );
    setProdutosParaConfig(produtosAtualizados);
    
    // Salvar no localStorage geral de produtos
    const storageKeyProdutos = `${STORAGE_KEY_PRODUTOS_PREFIX}${effectiveTenantId}`;
    localStorage.setItem(storageKeyProdutos, JSON.stringify(produtosAtualizados));
    
    alert(`Configurações PIS/COFINS para "${produtoEditandoConfig.descricao}" salvas.`);
    setModalConfigProdutoAberto(false);
  };

  const handleApurarSimulado = async () => {
    setIsLoadingApuracao(true);
    setResultadoApuracao(null);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay

    let totalBasePis = 0; let totalPisCalculado = 0;
    let totalBaseCofins = 0; let totalCofinsCalculado = 0;

    const notasStorageKey = `${NOTAS_FISCAIS_STORAGE_PREFIX}empresa_${effectiveTenantId}`; // Assumindo que notas são por empresa
    const notasSalvasStr = localStorage.getItem(notasStorageKey);
    const todasNotas: NotaFiscal[] = notasSalvasStr ? JSON.parse(notasSalvasStr) : [];

    const notasDoPeriodo = todasNotas.filter(nota => {
        const dataEmissao = new Date(nota.dataEmissao);
        return dataEmissao.getFullYear() === anoReferenciaApuracao && (dataEmissao.getMonth() + 1) === mesReferenciaApuracao;
    });

    notasDoPeriodo.forEach(nota => {
        nota.itens.forEach(item => {
            const produtoDb = produtosParaConfig.find(p => p.id === item.produtoId);
            const aliquotaPis = produtoDb?.aliquotaPisEspecifica ?? configEfd.aliquotaPisPadrao ?? 0;
            const aliquotaCofins = produtoDb?.aliquotaCofinsEspecifica ?? configEfd.aliquotaCofinsPadrao ?? 0;
            
            totalBasePis += item.valorTotal;
            totalPisCalculado += item.valorTotal * (aliquotaPis / 100);
            totalBaseCofins += item.valorTotal;
            totalCofinsCalculado += item.valorTotal * (aliquotaCofins / 100);
        });
    });

    setResultadoApuracao({ basePis: totalBasePis, totalPis: totalPisCalculado, baseCofins: totalBaseCofins, totalCofins: totalCofinsCalculado });
    setIsLoadingApuracao(false);
  };

  const handleGerarEfdSimulado = () => {
    if (!resultadoApuracao || !effectiveTenantId) {
      alert("Realize a apuração primeiro.");
      return;
    }
    const empresaNome = activeContextName.replace(/[^a-zA-Z0-9]/g, '_');
    const periodo = `${String(mesReferenciaApuracao).padStart(2,'0')}${anoReferenciaApuracao}`;
    const nomeArquivo = `EFD_CONTRIB_${empresaNome}_${periodo}.txt`;

    let conteudoEfd = `|0000|${configEfd.versaoLeiaute || '007'}|0|${activeContextName}|${configEfd.id?.replace(/\D/g,'') || 'CNPJ_NAO_CONFIG'}|${tenantAtual?.configuracoesEmissor?.endereco?.uf || 'XX'}|${tenantAtual?.configuracoesEmissor?.endereco?.cidade?.substring(0,7) || 'COD_MUN_NAO_CONFIG'}|IE_NAO_CONFIG|${configEfd.indAtividadePreponderante || '0'}|\n`;
    conteudoEfd += `|0001|0|\n`; // Abertura Bloco 0
    // Adicionar mais registros do Bloco 0 (0140, 0150, etc. - mock)
    conteudoEfd += `|0140|COD_EST_MOCK|NOME_EST_MOCK|CNPJ_EST_MOCK|UF_EST_MOCK|IE_EST_MOCK|COD_MUN_EST_MOCK|IM_EST_MOCK|SUFRAMA_EST_MOCK|\n`;
    conteudoEfd += `|0990|3|\n`; // Encerramento Bloco 0

    // Simular alguns dados de Bloco C (Notas Fiscais) - simplificado
    conteudoEfd += `|C001|0|\n`;
    conteudoEfd += `|C100|1|0|CHAVE_ACESSO_MOCK|1|00|55|001|00000123|${new Date().toLocaleDateString('ddMMyyyy')}|${new Date().toLocaleDateString('ddMMyyyy')}|${resultadoApuracao.basePis.toFixed(2)}|1|0.00|0.00|${resultadoApuracao.basePis.toFixed(2)}|9|0.00|${resultadoApuracao.basePis.toFixed(2)}|${resultadoApuracao.totalPis.toFixed(2)}|${resultadoApuracao.totalCofins.toFixed(2)}||\n`;
    conteudoEfd += `|C990|3|\n`;

    // Bloco M - Apuração
    conteudoEfd += `|M001|0|\n`;
    conteudoEfd += `|M200||${resultadoApuracao.basePis.toFixed(2)}|0.00|0.00|${resultadoApuracao.totalPis.toFixed(2)}|0.00|0.00|0.00|0.00|0.00|${resultadoApuracao.totalPis.toFixed(2)}|\n`;
    conteudoEfd += `|M600||${resultadoApuracao.baseCofins.toFixed(2)}|0.00|0.00|${resultadoApuracao.totalCofins.toFixed(2)}|0.00|0.00|0.00|0.00|0.00|${resultadoApuracao.totalCofins.toFixed(2)}|\n`;
    conteudoEfd += `|M990|4|\n`;

    conteudoEfd += `|9001|0|\n`;
    conteudoEfd += `|9900|0000|1|\n`; // Exemplo, pode precisar de mais registros
    conteudoEfd += `|9900|0001|1|\n`;
    conteudoEfd += `|9900|0140|1|\n`;
    conteudoEfd += `|9900|0990|1|\n`;
    conteudoEfd += `|9900|C001|1|\n`;
    conteudoEfd += `|9900|C100|1|\n`;
    conteudoEfd += `|9900|C990|1|\n`;
    conteudoEfd += `|9900|M001|1|\n`;
    conteudoEfd += `|9900|M200|1|\n`;
    conteudoEfd += `|9900|M600|1|\n`;
    conteudoEfd += `|9900|M990|1|\n`;
    conteudoEfd += `|9900|9001|1|\n`;
    conteudoEfd += `|9900|9999|1|\n`;
    const totalLinhas = (conteudoEfd.match(/\n/g) || []).length + 1; // Contar linhas + a próxima 9999
    conteudoEfd += `|9999|${totalLinhas}|\n`;

    const blob = new Blob([conteudoEfd], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    const novoArquivoGerado: ArquivoEfdGerado = {
        id: `efd-${Date.now()}`,
        nomeArquivo: nomeArquivo,
        mesReferencia: mesReferenciaApuracao,
        anoReferencia: anoReferenciaApuracao,
        dataGeracao: new Date().toISOString(),
        tenantId: effectiveTenantId,
        linkDownloadMock: '#' // Simulado
    };
    setArquivosEfdGerados(prev => [novoArquivoGerado, ...prev]);
    alert(`Arquivo ${nomeArquivo} gerado e download iniciado (simulado).`);
  };

  const activeContextName = useMemo(() => {
    if (personificandoInfo) return personificandoInfo.empresaNome;
    if (activeClientCompanyContext) return activeClientCompanyContext.nome;
    if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && tenantEscritorioId) {
        const empresasSalvas = localStorage.getItem(`${STORAGE_KEY_EMPRESAS_PREFIX}${tenantEscritorioId}`);
        if (empresasSalvas) {
            const empresasDoEscritorio: Empresa[] = JSON.parse(empresasSalvas);
            const empresaAtiva = empresasDoEscritorio.find(emp => emp.id === usuarioAtual.tenantId);
            return empresaAtiva?.nome || 'Empresa Ativa';
        }
    }
    return tenantAtual?.nome || 'Contexto Atual';
  }, [personificandoInfo, activeClientCompanyContext, usuarioAtual, tenantAtual, tenantEscritorioId]);

  const renderConteudoAba = () => {
    switch (abaAtiva) {
      case 'parametros':
        return null; // Handled by renderedParams
      case 'produtosServicos':
        return (
          <Card className="shadow-lg dark:bg-nixcon-dark-card">
            <h3 className="text-lg font-semibold mb-3 text-nixcon-dark dark:text-nixcon-light">Configuração PIS/COFINS para Produtos e Serviços</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Produto/Serviço</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">CST PIS Saída</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">CST COFINS Saída</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Alíq. PIS Espec. (%)</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Alíq. COFINS Espec. (%)</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
                        {produtosParaConfig.map(prod => (
                            <tr key={prod.id}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-nixcon-charcoal dark:text-nixcon-light">{prod.descricao}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{prod.cstPisSaida || '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{prod.cstCofinsSaida || '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{prod.aliquotaPisEspecifica?.toFixed(2) || '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{prod.aliquotaCofinsEspecifica?.toFixed(2) || '-'}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">
                                    <Button variant="ghost" size="sm" onClick={() => handleAbrirModalConfigProduto(prod)}>Configurar</Button>
                                </td>
                            </tr>
                        ))}
                         {produtosParaConfig.length === 0 && (<tr><td colSpan={6} className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhum produto/serviço cadastrado.</td></tr>)}
                    </tbody>
                </table>
            </div>
          </Card>
        );
      case 'apuracao':
        return (
            <Card className="shadow-lg dark:bg-nixcon-dark-card">
                <h3 className="text-lg font-semibold mb-3 text-nixcon-dark dark:text-nixcon-light">Apuração PIS/COFINS</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
                    <div>
                        <label className="text-xs text-gray-700 dark:text-gray-300">Mês Referência</label>
                        <select value={mesReferenciaApuracao} onChange={e => setMesReferenciaApuracao(parseInt(e.target.value))} className={selectClasses}>
                            {Array.from({length: 12}, (_, i) => i + 1).map(mes => <option key={mes} value={mes}>{String(mes).padStart(2,'0')}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-700 dark:text-gray-300">Ano Referência</label>
                        <input type="number" value={anoReferenciaApuracao} onChange={e => setAnoReferenciaApuracao(parseInt(e.target.value))} className={inputClasses} />
                    </div>
                    <Button onClick={handleApurarSimulado} disabled={isLoadingApuracao} fullWidth>
                        {isLoadingApuracao ? 'Apurando...' : 'Apurar PIS/COFINS (Simulado)'}
                    </Button>
                </div>
                {resultadoApuracao && (
                    <div className="mt-4 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 space-y-1 text-sm">
                        <p><strong>Base PIS:</strong> {resultadoApuracao.basePis.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})} | <strong>PIS Apurado:</strong> {resultadoApuracao.totalPis.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</p>
                        <p><strong>Base COFINS:</strong> {resultadoApuracao.baseCofins.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})} | <strong>COFINS Apurada:</strong> {resultadoApuracao.totalCofins.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</p>
                        <Button onClick={handleGerarEfdSimulado} variant="secondary" size="sm" className="mt-2">Gerar EFD (Simulado)</Button>
                    </div>
                )}
            </Card>
        );
      case 'historico':
        return (
            <Card className="shadow-lg dark:bg-nixcon-dark-card">
                 <h3 className="text-lg font-semibold mb-3 text-nixcon-dark dark:text-nixcon-light">Histórico de Arquivos EFD Gerados</h3>
                 {arquivosEfdGerados.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium">Nome Arquivo</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium">Período</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium">Data Geração</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
                                {arquivosEfdGerados.map(arq => (
                                    <tr key={arq.id}>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">{arq.nomeArquivo}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm">{String(arq.mesReferencia).padStart(2,'0')}/{arq.anoReferencia}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm">{new Date(arq.dataGeracao).toLocaleString('pt-BR')}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm"><Button variant="ghost" size="sm" onClick={() => alert(`Download simulado de ${arq.nomeArquivo}`)}>Baixar</Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 ) : (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-4">Nenhum arquivo gerado para este contexto ainda.</p>
                 )}
            </Card>
        );
      default:
        return null;
    }
  };

  const renderedParams = (
      <Card className="shadow-lg dark:bg-nixcon-dark-card">
        <form onSubmit={handleSalvarConfigEfd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-xs text-gray-700 dark:text-gray-300">Regime de Apuração PIS/COFINS</label><select name="regimeApuracao" value={configEfd.regimeApuracao || 'COMPETENCIA'} onChange={handleChangeConfigEfd} className={`${selectClasses} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`}><option value="COMPETENCIA">Competência</option><option value="CAIXA">Caixa</option></select></div>
            <div><label className="text-xs text-gray-700 dark:text-gray-300">Tipo de Escrituração</label><select name="tipoEscrituracao" value={configEfd.tipoEscrituracao || 'COMPLETA_REGISTROS'} onChange={handleChangeConfigEfd} className={`${selectClasses} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`}><option value="COMPLETA_REGISTROS">Completa (Blocos C, D, F)</option><option value="CONSOLIDADA_NOTA_A_NOTA">Consolidada (Nota a Nota)</option><option value="CONSOLIDADA_OPERACAO">Consolidada (Operação)</option></select></div>
            <div><label className="text-xs text-gray-700 dark:text-gray-300">Critério Escrituração (Lucro Presumido)</label><select name="criterioEscrituracaoPresumido" value={configEfd.criterioEscrituracaoPresumido || 'COMPETENCIA_EMISSAO'} onChange={handleChangeConfigEfd} className={`${selectClasses} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`}><option value="COMPETENCIA_EMISSAO">Regime de Competência - Emissão</option><option value="CAIXA_RECEBIMENTO">Regime de Caixa - Recebimento</option></select></div>
            <div><label className="text-xs text-gray-700 dark:text-gray-300">Versão do Leiaute EFD</label><input type="text" name="versaoLeiaute" value={configEfd.versaoLeiaute || '007'} onChange={handleChangeConfigEfd} className={`${inputClasses} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`} /></div>
            <div><label className="text-xs text-gray-700 dark:text-gray-300">Indicador Natureza PJ (Tabela 3.1.1)</label><input type="text" name="indNaturezaPj" value={configEfd.indNaturezaPj || '00'} onChange={handleChangeConfigEfd} className={`${inputClasses} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`} placeholder="Ex: 00" /></div>
            <div><label className="text-xs text-gray-700 dark:text-gray-300">Indicador Atividade Preponderante (Tabela 5.1.1)</label><input type="text" name="indAtividadePreponderante" value={configEfd.indAtividadePreponderante || '1'} onChange={handleChangeConfigEfd} className={`${inputClasses} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`} placeholder="Ex: 0, 1, 2..." /></div>
            <div><label className="text-xs text-gray-700 dark:text-gray-300">Alíquota PIS Padrão (%)</label><input type="number" step="0.01" name="aliquotaPisPadrao" value={configEfd.aliquotaPisPadrao || 0.65} onChange={handleChangeConfigEfd} className={`${inputClasses} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`} /></div>
            <div><label className="text-xs text-gray-700 dark:text-gray-300">Alíquota COFINS Padrão (%)</label><input type="number" step="0.01" name="aliquotaCofinsPadrao" value={configEfd.aliquotaCofinsPadrao || 3.00} onChange={handleChangeConfigEfd} className={`${inputClasses} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`} /></div>
          </div>
          <Button type="submit">Salvar Parâmetros</Button>
        </form>
      </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center">
          <IconeFiscal className="w-8 h-8 mr-3 text-nixcon-gold" />
          EFD Contribuições <span className="text-lg text-gray-500 dark:text-gray-400 ml-2">({activeContextName} - Lucro Presumido)</span>
        </h1>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {[
            { key: 'parametros', label: 'Parâmetros da Empresa', icone: <IconeConfiguracoes className="w-4 h-4 mr-1.5"/> },
            { key: 'produtosServicos', label: 'Produtos/Serviços', icone: <IconeCaixa className="w-4 h-4 mr-1.5"/> },
            { key: 'apuracao', label: 'Apuração e Geração', icone: <IconeFiscal className="w-4 h-4 mr-1.5"/> },
            { key: 'historico', label: 'Histórico', icone: <IconeDocumentos className="w-4 h-4 mr-1.5"/> }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setAbaAtiva(tab.key as any)}
              className={`flex items-center whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm 
                ${abaAtiva === tab.key 
                  ? 'border-nixcon-gold text-nixcon-gold' 
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              {tab.icone}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {!effectiveTenantId && <Card><p className="text-red-500 text-center">Contexto da empresa não definido. Selecione uma empresa ou verifique as configurações.</p></Card>}
      {effectiveTenantId && (abaAtiva === 'parametros' ? renderedParams : renderConteudoAba())}

       {/* Modal de Configuração PIS/COFINS do Produto */}
       {modalConfigProdutoAberto && produtoEditandoConfig && (
        <Modal isOpen={modalConfigProdutoAberto} onClose={() => setModalConfigProdutoAberto(false)} title={`Configurar PIS/COFINS: ${produtoEditandoConfig.descricao}`}>
            <form onSubmit={handleSalvarConfigProduto} className="space-y-3 text-sm">
                <div><label className="block font-medium text-gray-700 dark:text-gray-300">CST PIS Saída</label><select value={formConfigProduto.cstPisSaida || ''} onChange={e => setFormConfigProduto(p => ({...p, cstPisSaida: e.target.value}))} className={selectClasses}>{CST_PIS_COFINS_SAIDA_OPCOES.map(opt => <option key={opt.codigo} value={opt.codigo}>{opt.descricao}</option>)}</select></div>
                <div><label className="block font-medium text-gray-700 dark:text-gray-300">CST COFINS Saída</label><select value={formConfigProduto.cstCofinsSaida || ''} onChange={e => setFormConfigProduto(p => ({...p, cstCofinsSaida: e.target.value}))} className={selectClasses}>{CST_PIS_COFINS_SAIDA_OPCOES.map(opt => <option key={opt.codigo} value={opt.codigo}>{opt.descricao}</option>)}</select></div>
                <div><label className="block font-medium text-gray-700 dark:text-gray-300">CST PIS Entrada</label><select value={formConfigProduto.cstPisEntrada || ''} onChange={e => setFormConfigProduto(p => ({...p, cstPisEntrada: e.target.value}))} className={selectClasses}>{CST_PIS_COFINS_ENTRADA_OPCOES.map(opt => <option key={opt.codigo} value={opt.codigo}>{opt.descricao}</option>)}</select></div>
                <div><label className="block font-medium text-gray-700 dark:text-gray-300">CST COFINS Entrada</label><select value={formConfigProduto.cstCofinsEntrada || ''} onChange={e => setFormConfigProduto(p => ({...p, cstCofinsEntrada: e.target.value}))} className={selectClasses}>{CST_PIS_COFINS_ENTRADA_OPCOES.map(opt => <option key={opt.codigo} value={opt.codigo}>{opt.descricao}</option>)}</select></div>
                <div><label className="block font-medium text-gray-700 dark:text-gray-300">Natureza da Receita (Tabelas 4.3.10+)</label><select value={formConfigProduto.naturezaReceitaPisCofins || ''} onChange={e => setFormConfigProduto(p => ({...p, naturezaReceitaPisCofins: e.target.value}))} className={selectClasses}>{NATUREZA_RECEITA_OPCOES.map(opt => <option key={opt.codigo} value={opt.codigo}>{opt.descricao}</option>)}</select></div>
                <div><label className="block font-medium text-gray-700 dark:text-gray-300">Alíquota PIS Específica (%)</label><input type="number" step="0.01" value={formConfigProduto.aliquotaPisEspecifica || ''} onChange={e => setFormConfigProduto(p => ({...p, aliquotaPisEspecifica: parseFloat(e.target.value) || undefined}))} className={inputClasses}/></div>
                <div><label className="block font-medium text-gray-700 dark:text-gray-300">Alíquota COFINS Específica (%)</label><input type="number" step="0.01" value={formConfigProduto.aliquotaCofinsEspecifica || ''} onChange={e => setFormConfigProduto(p => ({...p, aliquotaCofinsEspecifica: parseFloat(e.target.value) || undefined}))} className={inputClasses}/></div>
                <div className="text-right space-x-2 pt-2">
                    <Button type="button" variant="secondary" onClick={() => setModalConfigProdutoAberto(false)}>Cancelar</Button>
                    <Button type="submit">Salvar Config. Produto</Button>
                </div>
            </form>
        </Modal>
      )}

    </div>
  );
};

export default EfdContribuicoesPage;
