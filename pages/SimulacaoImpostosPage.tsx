import React, { useState, useEffect, ChangeEvent, useMemo } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { IconeSimulacaoImpostos, IconeFinanceiro, IconeFiscal, IconeTarefas, IconeDocumentos, IconeMensagens } from '../components/common/Icons';
import { useAuth } from '../contexts/AuthContext';
import { 
  Produto as ProdutoGlobal, 
  TipoEmpresaSimulacao, 
  ResultadosSimulacao as ResultadosSimulacaoGlobal,
  ProdutoSimulacao as ProdutoSimulacaoGlobal,
  ModalidadeDistribuidorHyCite,
  ConfiguracaoModalidadeHyCite,
  TaxaConfiguravelHyCite,
  RegimeTributario,
  ConfiguracoesEmissor,
  Empresa
} from '../types';

interface ProdutoSimulacao extends ProdutoSimulacaoGlobal {}
interface ResultadosSimulacao extends ResultadosSimulacaoGlobal {}

const agora = new Date().toISOString();

const clientesMock: Empresa[] = [
  { 
    id: 'cli1', nome: 'Cliente Exemplo Alfa Ltda', cnpj: '111', status: 'ATIVO', tenantId: 'mockTenant', dataCadastro: agora, dataAtualizacao: agora,
    endereco: { cep: '000', logradouro: 'Rua', numero: '1', bairro: 'Bairro', cidade: 'Cidade', uf: 'UF' },
    configuracoesEmissor: { regimeTributario: 'SIMPLES_NACIONAL' } as ConfiguracoesEmissor 
  },
  { 
    id: 'cli2', nome: 'Cliente Beta Serviços ME', cnpj: '222', status: 'ATIVO', tenantId: 'mockTenant', dataCadastro: agora, dataAtualizacao: agora,
    endereco: { cep: '000', logradouro: 'Rua', numero: '1', bairro: 'Bairro', cidade: 'Cidade', uf: 'UF' },
    configuracoesEmissor: { regimeTributario: 'LUCRO_PRESUMIDO' } as ConfiguracoesEmissor
  },
  { 
    id: 'cli3', nome: 'Indústria Gama S/A', cnpj: '333', status: 'ATIVO', tenantId: 'mockTenant', dataCadastro: agora, dataAtualizacao: agora,
    endereco: { cep: '000', logradouro: 'Rua', numero: '1', bairro: 'Bairro', cidade: 'Cidade', uf: 'UF' },
    configuracoesEmissor: { regimeTributario: 'LUCRO_REAL' } as ConfiguracoesEmissor
  },
];

const produtosDisponiveisMock: ProdutoGlobal[] = [
  { 
    id: 'prod1', descricao: 'Produto Digital A', tipoProduto: 'PRODUTO', unidade: 'UN',
    precoCusto: 50, precoVendaVarejo: 150, movimentaEstoque: false, ativo: true, 
    origemTenant: 'UNIVERSAL_ESCRITORIO', dataCriacao: agora, dataAtualizacao: agora,
    permiteRateioDesconto: true,
  },
  { 
    id: 'prod2', descricao: 'Serviço de Consultoria Basic', tipoProduto: 'SERVICO', unidade: 'HORA',
    precoCusto: 200, precoVendaVarejo: 500, movimentaEstoque: false, ativo: true,
    origemTenant: 'UNIVERSAL_ESCRITORIO', dataCriacao: agora, dataAtualizacao: agora,
    permiteRateioDesconto: true,
  },
  { 
    id: 'prod3', descricao: 'Produto Físico X', tipoProduto: 'PRODUTO', unidade: 'UN',
    precoCusto: 120, precoVendaVarejo: 280, movimentaEstoque: true, quantidadeEmEstoque: 100, estoqueMinimo: 10, ativo: true,
    ncm: '12345678', origemTenant: 'UNIVERSAL_ESCRITORIO', dataCriacao: agora, dataAtualizacao: agora,
    permiteRateioDesconto: false, 
  },
  { 
    id: 'prod4', descricao: 'Pacote de Horas Técnicas', tipoProduto: 'SERVICO', unidade: 'PCT',
    precoCusto: 80, precoVendaVarejo: 180, movimentaEstoque: false, ativo: true,
    origemTenant: 'UNIVERSAL_ESCRITORIO', dataCriacao: agora, dataAtualizacao: agora,
    permiteRateioDesconto: true,
  },
];

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const tiposEmpresaSimulacaoOptions: { value: TipoEmpresaSimulacao; label: string }[] = [
    { value: 'NORMAL', label: 'Normal' },
    { value: 'HY_CITE', label: 'Hy Cite' },
];

const STORAGE_KEY_HYCITE_CONFIG = 'nixconPortalHyCiteConfig';

const tabelasSimplesNacional: Record<string, { faixas: { ate: number, aliquota: number, deduzir: number }[], nome: string }> = {
  'I': { nome: 'Anexo I - Comércio', faixas: [ { ate: 180000, aliquota: 4, deduzir: 0 }, { ate: 360000, aliquota: 7.3, deduzir: 5940 }, { ate: 720000, aliquota: 9.5, deduzir: 13860 }, { ate: 1800000, aliquota: 10.7, deduzir: 22500 }, { ate: 3600000, aliquota: 14.3, deduzir: 87300 }, { ate: 4800000, aliquota: 19, deduzir: 378000 } ] },
  'II': { nome: 'Anexo II - Indústria', faixas: [ { ate: 180000, aliquota: 4.5, deduzir: 0 }, { ate: 360000, aliquota: 7.8, deduzir: 5940 }, { ate: 720000, aliquota: 10, deduzir: 13860 }, { ate: 1800000, aliquota: 11.2, deduzir: 22500 }, { ate: 3600000, aliquota: 14.7, deduzir: 85500 }, { ate: 4800000, aliquota: 30, deduzir: 720000 } ] },
  'III': { nome: 'Anexo III - Serviços (§5º-I do art. 18 da LC 123)', faixas: [ { ate: 180000, aliquota: 6, deduzir: 0 }, { ate: 360000, aliquota: 11.2, deduzir: 9360 }, { ate: 720000, aliquota: 13.5, deduzir: 17640 }, { ate: 1800000, aliquota: 16, deduzir: 35640 }, { ate: 3600000, aliquota: 21, deduzir: 125640 }, { ate: 4800000, aliquota: 33, deduzir: 648000 } ] },
  'IV': { nome: 'Anexo IV - Serviços (Construção, Advocacia, etc.)', faixas: [ { ate: 180000, aliquota: 4.5, deduzir: 0 }, { ate: 360000, aliquota: 9, deduzir: 8100 }, { ate: 720000, aliquota: 10.2, deduzir: 12420 }, { ate: 1800000, aliquota: 14, deduzir: 39780 }, { ate: 3600000, aliquota: 22, deduzir: 183780 }, { ate: 4800000, aliquota: 33, deduzir: 828000 } ] },
  'V': { nome: 'Anexo V - Serviços (Fator R < 28%)', faixas: [ { ate: 180000, aliquota: 15.5, deduzir: 0 }, { ate: 360000, aliquota: 18, deduzir: 4500 }, { ate: 720000, aliquota: 19.5, deduzir: 9900 }, { ate: 1800000, aliquota: 20.5, deduzir: 17100 }, { ate: 3600000, aliquota: 23, deduzir: 62100 }, { ate: 4800000, aliquota: 30.5, deduzir: 540000 } ] },
};

const SimulacaoImpostosPage: React.FC = () => {
  const { usuarioAtual, tenantAtual } = useAuth();
  const [dataSimulacao, setDataSimulacao] = useState<string>(new Date().toISOString().split('T')[0]);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string>('');
  const [regimeTributarioSelecionadoManualmente, setRegimeTributarioSelecionadoManualmente] = useState<RegimeTributario | ''>('');
  const [tipoEmpresaSimulacaoSelecionado, setTipoEmpresaSimulacaoSelecionado] = useState<TipoEmpresaSimulacao>('NORMAL');
  
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState<string>('');
  const [quantidadeProduto, setQuantidadeProduto] = useState<number>(1);
  const [valorUnitarioInformadoItem, setValorUnitarioInformadoItem] = useState<string>(''); 
  const [produtosNaSimulacao, setProdutosNaSimulacao] = useState<ProdutoSimulacao[]>([]);
  
  const [resultados, setResultados] = useState<ResultadosSimulacao | null>(null);
  const [simulacaoRealizada, setSimulacaoRealizada] = useState<boolean>(false);

  const [valorFinalNotaDesejado, setValorFinalNotaDesejado] = useState<string>('');
  const [descontoTotalCalculado, setDescontoTotalCalculado] = useState<number>(0);
  const [percentualDescontoTotalCalculado, setPercentualDescontoTotalCalculado] = useState<number>(0);
  
  const [configuracoesHyCite, setConfiguracoesHyCite] = useState<ConfiguracaoModalidadeHyCite[] | null>(null);
  const [nivelDistribuidorSelecionado, setNivelDistribuidorSelecionado] = useState<ModalidadeDistribuidorHyCite | ''>('');

  const [rbt12, setRbt12] = useState<string>('');
  const [fs12, setFs12] = useState<string>(''); // Novo estado para Folha de Salários
  const [anexoSimples, setAnexoSimples] = useState<string>('III');
  const [aliquotaIssMunicipal, setAliquotaIssMunicipal] = useState<string>('');
  const [despesasDedutiveis, setDespesasDedutiveis] = useState<string>('');
  const [creditosPis, setCreditosPis] = useState<string>('');
  const [creditosCofins, setCreditosCofins] = useState<string>('');

  const regimeTributarioAtual = useMemo(() => {
    if (clienteSelecionadoId) {
      return clientesMock.find(c => c.id === clienteSelecionadoId)?.configuracoesEmissor?.regimeTributario || '';
    }
    return tenantAtual?.configuracoesEmissor?.regimeTributario || regimeTributarioSelecionadoManualmente || '';
  }, [clienteSelecionadoId, tenantAtual, regimeTributarioSelecionadoManualmente]);


  useEffect(() => {
    const savedConfigs = localStorage.getItem(STORAGE_KEY_HYCITE_CONFIG);
    if (savedConfigs) setConfiguracoesHyCite(JSON.parse(savedConfigs));
  }, []);

  useEffect(() => {
    if (produtoSelecionadoId) {
      const produto = produtosDisponiveisMock.find(p => p.id === produtoSelecionadoId);
      if (produto) {
        setValorUnitarioInformadoItem(produto.precoVendaVarejo.toString());
      }
    } else {
        setValorUnitarioInformadoItem('');
    }
  }, [produtoSelecionadoId]);

  useEffect(() => {
    if (valorFinalNotaDesejado) {
        const valorFinalNum = parseFloat(valorFinalNotaDesejado);
        const faturamentoBrutoTotal = produtosNaSimulacao.reduce((sum, item) => sum + (item.precoVendaVarejo * item.quantidade), 0);
        if (!isNaN(valorFinalNum) && faturamentoBrutoTotal > 0 && valorFinalNum < faturamentoBrutoTotal) {
            const descontoNecessario = faturamentoBrutoTotal - valorFinalNum;
            setDescontoTotalCalculado(descontoNecessario);
            setPercentualDescontoTotalCalculado((descontoNecessario / faturamentoBrutoTotal) * 100);
            
            const produtosParaRateio = produtosNaSimulacao.filter(p => p.participaRateioDesconto);
            const baseRateioTotal = produtosParaRateio.reduce((sum, item) => sum + (item.precoVendaVarejo * item.quantidade), 0);

            setProdutosNaSimulacao(prevProdutos => prevProdutos.map(item => {
                if (item.participaRateioDesconto && baseRateioTotal > 0) {
                    const proporcaoItem = (item.precoVendaVarejo * item.quantidade) / baseRateioTotal;
                    const descontoDoItem = descontoNecessario * proporcaoItem;
                    const novoValorFinalUnitario = item.precoVendaVarejo - (descontoDoItem / item.quantidade);
                    return {
                        ...item,
                        valorFinalUnitario: parseFloat(novoValorFinalUnitario.toFixed(2)),
                        descontoCalculado: item.precoVendaVarejo > 0 ? ((item.precoVendaVarejo - novoValorFinalUnitario) / item.precoVendaVarejo) * 100 : 0,
                    };
                }
                return {...item, valorFinalUnitario: item.precoVendaVarejo, descontoCalculado: 0}; 
            }));
        } else { 
            setDescontoTotalCalculado(0);
            setPercentualDescontoTotalCalculado(0);
             setProdutosNaSimulacao(prevProdutos => prevProdutos.map(item => {
                const valorOriginal = produtosDisponiveisMock.find(p => p.id === item.id)?.precoVendaVarejo || 0;
                const valorFinalAtual = item.valorFinalUnitario || valorOriginal; 
                 return {
                    ...item,
                    valorFinalUnitario: valorFinalAtual,
                    descontoCalculado: valorOriginal > 0 ? ((valorOriginal - valorFinalAtual) / valorOriginal) * 100 : 0,
                };
            }));
        }
    } else { 
        setDescontoTotalCalculado(0);
        setPercentualDescontoTotalCalculado(0);
         setProdutosNaSimulacao(prevProdutos => prevProdutos.map(item => {
            const valorOriginal = produtosDisponiveisMock.find(p => p.id === item.id)?.precoVendaVarejo || 0;
            return {
                ...item,
                valorFinalUnitario: item.valorFinalUnitario, 
                descontoCalculado: valorOriginal > 0 ? ((valorOriginal - item.valorFinalUnitario) / valorOriginal) * 100 : 0,
            };
        }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valorFinalNotaDesejado, produtosNaSimulacao.length]); 


  const handleAdicionarProduto = () => {
    if (!produtoSelecionadoId || quantidadeProduto <= 0) {
      alert('Selecione um produto e informe uma quantidade válida.');
      return;
    }
    const produtoBase = produtosDisponiveisMock.find(p => p.id === produtoSelecionadoId);
    if (!produtoBase) return;

    const valorFinalUnitarioNum = parseFloat(valorUnitarioInformadoItem);
    if (isNaN(valorFinalUnitarioNum) || valorFinalUnitarioNum < 0) {
        alert('Valor unitário final inválido.');
        return;
    }
    
    const novoItemSimulacao: ProdutoSimulacao = {
      ...produtoBase,
      quantidade: quantidadeProduto,
      valorFinalUnitario: valorFinalUnitarioNum,
      descontoCalculado: produtoBase.precoVendaVarejo > 0 ? ((produtoBase.precoVendaVarejo - valorFinalUnitarioNum) / produtoBase.precoVendaVarejo) * 100 : 0,
      faturamentoItem: 0, custoItem: 0, impostoSobreVendaItemMock: 0, lucroBrutoItemMock: 0, 
      participaRateioDesconto: produtoBase.permiteRateioDesconto !== undefined ? produtoBase.permiteRateioDesconto : true,
    };
    setProdutosNaSimulacao(prev => [...prev, novoItemSimulacao]);
    setProdutoSelecionadoId(''); setQuantidadeProduto(1); setValorUnitarioInformadoItem('');
    setSimulacaoRealizada(false); setResultados(null);
  };
  
  const handleToggleParticipaRateio = (idProduto: string) => {
    setProdutosNaSimulacao(prevProdutos => 
        prevProdutos.map(p => p.id === idProduto ? { ...p, participaRateioDesconto: !p.participaRateioDesconto } : p)
    );
    if (valorFinalNotaDesejado) setValorFinalNotaDesejado(v => v + '');
  };

  const handleRemoverProduto = (idProduto: string) => {
    setProdutosNaSimulacao(produtosNaSimulacao.filter(p => p.id !== idProduto));
    setSimulacaoRealizada(false); setResultados(null);
    if (valorFinalNotaDesejado) setValorFinalNotaDesejado(v => v + '');
  };

  const handleSimular = () => {
    if (produtosNaSimulacao.length === 0) { alert('Adicione produtos para simular.'); return; }
    if (tipoEmpresaSimulacaoSelecionado === 'HY_CITE' && !nivelDistribuidorSelecionado) { alert('Selecione o Nível Hy Cite.'); return; }
    if (!regimeTributarioAtual) { alert('Defina um regime tributário para simulação.'); return; }

    let faturamentoTotalCalc = 0;
    let custoTotalProdutosCalc = 0;
    let taxasHyCiteAplicadasCalc: ResultadosSimulacao['taxasHyCiteAplicadas'] = [];
    let totalTaxasHyCite = 0;
    let impostosDetalhados: ResultadosSimulacao['detalhamentoTributos'] = [];
    let fatorRCalculadoSim: number | undefined = undefined;
    let observacaoFatorRSim: string | undefined = undefined;
    
    const detalhamentoAtualizado = produtosNaSimulacao.map(item => {
      const faturamentoItemCalc = item.quantidade * item.valorFinalUnitario;
      const custoItemCalc = item.quantidade * item.precoCusto;
      faturamentoTotalCalc += faturamentoItemCalc;
      custoTotalProdutosCalc += custoItemCalc;
      return { ...item, faturamentoItem: faturamentoItemCalc, custoItem: custoItemCalc, impostoSobreVendaItemMock: 0, lucroBrutoItemMock: 0 };
    });

    const faturamentoParaCalculo = faturamentoTotalCalc;
    if (regimeTributarioAtual === 'SIMPLES_NACIONAL') {
      const rbt12Num = parseFloat(rbt12);
      const fs12Num = parseFloat(fs12);
      const tabelaAnexo = tabelasSimplesNacional[anexoSimples];

      if (!isNaN(rbt12Num) && rbt12Num > 0 && !isNaN(fs12Num) && fs12Num >= 0) {
        fatorRCalculadoSim = fs12Num / rbt12Num;
        const fatorRPercent = (fatorRCalculadoSim * 100).toFixed(2);
        if (anexoSimples === 'III') {
            observacaoFatorRSim = fatorRCalculadoSim < 0.28 
                ? `Atenção: Com Fator R de ${fatorRPercent}%, esta atividade normalmente se enquadraria no Anexo V.`
                : `Fator R de ${fatorRPercent}% compatível com Anexo III.`;
        } else if (anexoSimples === 'V') {
            observacaoFatorRSim = fatorRCalculadoSim >= 0.28
                ? `Atenção: Com Fator R de ${fatorRPercent}%, esta atividade normalmente se enquadraria no Anexo III.`
                : `Fator R de ${fatorRPercent}% compatível com Anexo V.`;
        } else {
            observacaoFatorRSim = `Fator R de ${fatorRPercent}% calculado. Anexo ${anexoSimples} não é diretamente dependente do Fator R para enquadramento inicial.`;
        }
      } else if (!isNaN(rbt12Num)) {
         observacaoFatorRSim = "FS12 não informado ou inválido. Fator R não calculado.";
      }


      if (!isNaN(rbt12Num) && tabelaAnexo) {
        const rbt12Usar = rbt12Num === 0 ? 1 : rbt12Num; // Evitar divisão por zero se RBT12 for 0 (início de atividade)
        const faixa = tabelaAnexo.faixas.find(f => rbt12Usar <= f.ate) || tabelaAnexo.faixas[tabelaAnexo.faixas.length - 1];
        const aliquotaEfetiva = Math.max(0, (((rbt12Usar * (faixa.aliquota / 100)) - faixa.deduzir) / rbt12Usar) * 100);
        const valorDas = faturamentoParaCalculo * (aliquotaEfetiva / 100);
        impostosDetalhados.push({ nome: 'Simples Nacional (DAS)', valor: valorDas, aliquotaEfetiva: `${aliquotaEfetiva.toFixed(2)}%`, observacao: `RBT12: ${formatCurrency(rbt12Num)}, Anexo: ${tabelaAnexo.nome}` });
      } else {
         impostosDetalhados.push({ nome: 'Simples Nacional (DAS)', valor: 0, observacao: 'RBT12 ou Anexo inválido.'});
      }
    } else if (regimeTributarioAtual === 'LUCRO_PRESUMIDO') {
      // ... (lógica Lucro Presumido existente)
      const basePresuncaoServicos = 0.32; 
      const baseCalculoIrCsll = faturamentoParaCalculo * basePresuncaoServicos;
      const irpj = baseCalculoIrCsll * 0.15;
      let adicionalIrpj = 0;
      if (baseCalculoIrCsll > 20000) { 
          adicionalIrpj = (baseCalculoIrCsll - 20000) * 0.10;
      }
      const csll = baseCalculoIrCsll * 0.09;
      const pis = faturamentoParaCalculo * 0.0065;
      const cofins = faturamentoParaCalculo * 0.03;
      const issNum = parseFloat(aliquotaIssMunicipal);
      const iss = !isNaN(issNum) ? faturamentoParaCalculo * (issNum / 100) : 0;
      impostosDetalhados.push({ nome: 'IRPJ', valor: irpj, observacao: `Base: ${formatCurrency(baseCalculoIrCsll)}` });
      if(adicionalIrpj > 0) impostosDetalhados.push({ nome: 'Adicional IRPJ', valor: adicionalIrpj });
      impostosDetalhados.push({ nome: 'CSLL', valor: csll, observacao: `Base: ${formatCurrency(baseCalculoIrCsll)}` });
      impostosDetalhados.push({ nome: 'PIS', valor: pis });
      impostosDetalhados.push({ nome: 'COFINS', valor: cofins });
      if (iss > 0) impostosDetalhados.push({ nome: 'ISS', valor: iss, observacao: `Alíq.: ${issNum.toFixed(2)}%` });
    } else if (regimeTributarioAtual === 'LUCRO_REAL') {
      // ... (lógica Lucro Real existente)
      const despesasNum = parseFloat(despesasDedutiveis) || 0;
      const creditosPisNum = parseFloat(creditosPis) || 0;
      const creditosCofinsNum = parseFloat(creditosCofins) || 0;
      const lucroAntesIrCsll = faturamentoParaCalculo - despesasNum; 
      const irpj = lucroAntesIrCsll > 0 ? lucroAntesIrCsll * 0.15 : 0;
      let adicionalIrpj = 0;
      if (lucroAntesIrCsll * 3 > 60000) { 
          adicionalIrpj = Math.max(0, (lucroAntesIrCsll * 3 - 60000) * 0.10 / 3);
      }
      const csll = lucroAntesIrCsll > 0 ? lucroAntesIrCsll * 0.09 : 0;
      const pis = Math.max(0, (faturamentoParaCalculo * 0.0165) - creditosPisNum);
      const cofins = Math.max(0, (faturamentoParaCalculo * 0.076) - creditosCofinsNum);
      const issNum = parseFloat(aliquotaIssMunicipal);
      const iss = !isNaN(issNum) ? faturamentoParaCalculo * (issNum / 100) : 0;
      impostosDetalhados.push({ nome: 'IRPJ (Lucro Real)', valor: irpj, observacao: `Base: ${formatCurrency(lucroAntesIrCsll)}` });
      if(adicionalIrpj > 0) impostosDetalhados.push({ nome: 'Adicional IRPJ', valor: adicionalIrpj });
      impostosDetalhados.push({ nome: 'CSLL (Lucro Real)', valor: csll });
      impostosDetalhados.push({ nome: 'PIS (Não Cumulativo)', valor: pis, observacao: `Créditos: ${formatCurrency(creditosPisNum)}` });
      impostosDetalhados.push({ nome: 'COFINS (Não Cumulativa)', valor: cofins, observacao: `Créditos: ${formatCurrency(creditosCofinsNum)}` });
      if (iss > 0) impostosDetalhados.push({ nome: 'ISS', valor: iss, observacao: `Alíq.: ${issNum.toFixed(2)}%` });
    }

    const impostosSobreVendasTotalCalc = impostosDetalhados.reduce((sum, imp) => sum + imp.valor, 0);

    if (tipoEmpresaSimulacaoSelecionado === 'HY_CITE' && nivelDistribuidorSelecionado && configuracoesHyCite) {
        const configModalidade = configuracoesHyCite.find(c => c.modalidade === nivelDistribuidorSelecionado);
        if (configModalidade) {
            configModalidade.taxas.forEach(taxa => {
                let valorTaxaCalculada = 0;
                if (typeof taxa.valorPercentual === 'number') {
                    valorTaxaCalculada = faturamentoTotalCalc * (taxa.valorPercentual / 100);
                } else if (typeof taxa.valorFixo === 'number') {
                    valorTaxaCalculada = taxa.valorFixo;
                }
                totalTaxasHyCite += valorTaxaCalculada;
                taxasHyCiteAplicadasCalc.push({
                    idTaxa: taxa.id,
                    tituloTaxa: taxa.apelido || taxa.tituloOriginal,
                    valorCalculado: valorTaxaCalculada,
                    tipoValor: taxa.valorFixo !== undefined ? 'FIXO' : 'PERCENTUAL',
                    baseCalculoUsada: taxa.valorPercentual !== undefined ? `Faturamento (${formatCurrency(faturamentoTotalCalc)})` : undefined,
                    observacoes: taxa.observacoes
                });
            });
        }
    }

    const impostosSobreComprasEstimativaCalc = custoTotalProdutosCalc * 0.05; 
    const difalEstimativaCalc = faturamentoTotalCalc * 0.02; 
    const lucroBrutoEstimadoTotalMockCalc = faturamentoTotalCalc - custoTotalProdutosCalc - impostosSobreComprasEstimativaCalc - difalEstimativaCalc - impostosSobreVendasTotalCalc - totalTaxasHyCite;

    const totalImpostosEstimados = impostosSobreVendasTotalCalc + impostosSobreComprasEstimativaCalc + difalEstimativaCalc;
    const percentualImpostosEstimados = faturamentoTotalCalc > 0 ? (totalImpostosEstimados / faturamentoTotalCalc) * 100 : 0;
    const observacoesNota = `Valores aproximados dos tributos: ${formatCurrency(totalImpostosEstimados)} (${percentualImpostosEstimados.toFixed(2)}%) conforme Lei 12.741/2012. Regime: ${regimeTributarioAtual}.`;

    setResultados({
      faturamentoTotal: faturamentoTotalCalc,
      custoTotalProdutos: custoTotalProdutosCalc,
      impostosSobreComprasEstimativa: impostosSobreComprasEstimativaCalc,
      difalEstimativa: difalEstimativaCalc,
      impostosSobreVendasTotalMock: impostosSobreVendasTotalCalc,
      lucroBrutoEstimadoTotalMock: lucroBrutoEstimadoTotalMockCalc,
      detalhamentoProdutos: detalhamentoAtualizado,
      tipoEmpresaSimulacao: tipoEmpresaSimulacaoSelecionado,
      nivelDistribuidorHyCite: tipoEmpresaSimulacaoSelecionado === 'HY_CITE' ? nivelDistribuidorSelecionado || undefined : undefined,
      taxasHyCiteAplicadas: taxasHyCiteAplicadasCalc.length > 0 ? taxasHyCiteAplicadasCalc : undefined,
      observacoesNotaFiscal: observacoesNota,
      descontoTotalAplicado: descontoTotalCalculado,
      percentualDescontoTotalAplicado: percentualDescontoTotalCalculado,
      regimeSimulado: regimeTributarioAtual as RegimeTributario,
      detalhamentoTributos: impostosDetalhados,
      fatorRCalculado: fatorRCalculadoSim,
      observacaoFatorR: observacaoFatorRSim,
    });
    setSimulacaoRealizada(true);
  };
  
  const handleValorFinalNotaDesejadoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setValorFinalNotaDesejado(valor);
    if (!valor) {
        setDescontoTotalCalculado(0);
        setPercentualDescontoTotalCalculado(0);
        setProdutosNaSimulacao(prev => prev.map(item => {
            const produtoBase = produtosDisponiveisMock.find(p => p.id === item.id);
            const valorOriginal = produtoBase?.precoVendaVarejo || 0;
            return { ...item, valorFinalUnitario: valorOriginal, descontoCalculado: 0, participaRateioDesconto: produtoBase?.permiteRateioDesconto !== undefined ? produtoBase.permiteRateioDesconto : true };
        }));
    }
  };

  const handleSalvar = () => {
    if (!simulacaoRealizada || !resultados) { alert("Realize uma simulação antes de salvar."); return; }
    alert(`Simulação salva!`); console.log("Simulação Salva:", { dataSimulacao, clienteSelecionadoId, resultados });
  };
  const handleEnviarEscritorio = () => {
    if (!simulacaoRealizada || !resultados) { alert("Realize uma simulação antes de enviar."); return; }
    alert(`Simulação enviada para o escritório!`); console.log("Simulação para Envio:", { dataSimulacao, clienteSelecionadoId, resultados });
  };

  const renderRegimeSpecificInputs = () => {
    if (regimeTributarioAtual === 'SIMPLES_NACIONAL') {
      return (
        <>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RBT12 (Faturamento 12m)</label><input type="number" placeholder="Ex: 250000" value={rbt12} onChange={e => setRbt12(e.target.value)} className="input-form" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">FS12 (Folha Salários 12m)</label><input type="number" placeholder="Ex: 70000 (Opcional)" value={fs12} onChange={e => setFs12(e.target.value)} className="input-form" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Anexo Simples</label><select value={anexoSimples} onChange={e => setAnexoSimples(e.target.value)} className="input-form"><option value="I">Anexo I - Comércio</option><option value="II">Anexo II - Indústria</option><option value="III">Anexo III - Serviços</option><option value="IV">Anexo IV - Serviços</option><option value="V">Anexo V - Serviços</option></select></div>
        </>
      );
    }
    if (regimeTributarioAtual === 'LUCRO_PRESUMIDO') {
      return (
        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alíquota ISS Municipal (%)</label><input type="number" step="0.01" placeholder="Ex: 2.00" value={aliquotaIssMunicipal} onChange={e => setAliquotaIssMunicipal(e.target.value)} className="input-form" /></div>
      );
    }
    if (regimeTributarioAtual === 'LUCRO_REAL') {
      return (
        <>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Despesas Dedutíveis (R$)</label><input type="number" step="0.01" placeholder="Ex: 5000.00" value={despesasDedutiveis} onChange={e => setDespesasDedutiveis(e.target.value)} className="input-form" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Créditos PIS (R$)</label><input type="number" step="0.01" placeholder="Ex: 150.00" value={creditosPis} onChange={e => setCreditosPis(e.target.value)} className="input-form" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Créditos COFINS (R$)</label><input type="number" step="0.01" placeholder="Ex: 700.00" value={creditosCofins} onChange={e => setCreditosCofins(e.target.value)} className="input-form" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alíquota ISS Municipal (%)</label><input type="number" step="0.01" placeholder="Ex: 3.00" value={aliquotaIssMunicipal} onChange={e => setAliquotaIssMunicipal(e.target.value)} className="input-form" /></div>
        </>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center">
          <IconeSimulacaoImpostos className="w-8 h-8 mr-3 text-nixcon-gold" />
          Página de Simulação de Impostos
        </h1>
      </div>

      <Card className="shadow-lg">
        <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">1. Dados da Simulação</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label><input type="date" value={dataSimulacao} onChange={(e) => setDataSimulacao(e.target.value)} className="input-form" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente</label><select value={clienteSelecionadoId} onChange={(e) => { setClienteSelecionadoId(e.target.value); setRegimeTributarioSelecionadoManualmente(''); }} className="input-form"><option value="">Nenhum (Usar regime do escritório/manual)</option>{clientesMock.map(cli => <option key={cli.id} value={cli.id}>{cli.nome}</option>)}</select></div>
          {!clienteSelecionadoId && (
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Regime Manual</label>
              <select value={regimeTributarioSelecionadoManualmente} onChange={(e) => setRegimeTributarioSelecionadoManualmente(e.target.value as RegimeTributario | '')} className="input-form">
                <option value="">Selecione o Regime</option>
                <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                <option value="LUCRO_REAL">Lucro Real</option>
              </select>
            </div>
          )}
           <p className="text-xs text-gray-500 dark:text-gray-400 col-span-full md:col-span-1 lg:col-span-1 mt-2">Regime Atual Simulação: <span className="font-semibold">{regimeTributarioAtual || "Não definido"}</span></p>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo Empresa</label><select value={tipoEmpresaSimulacaoSelecionado} onChange={(e) => { setTipoEmpresaSimulacaoSelecionado(e.target.value as TipoEmpresaSimulacao); if (e.target.value !== 'HY_CITE') setNivelDistribuidorSelecionado(''); setSimulacaoRealizada(false); setResultados(null);}} className="input-form">{tiposEmpresaSimulacaoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
          {tipoEmpresaSimulacaoSelecionado === 'HY_CITE' && (<div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nível Hy Cite</label><select value={nivelDistribuidorSelecionado} onChange={(e) => { setNivelDistribuidorSelecionado(e.target.value as ModalidadeDistribuidorHyCite | ''); setSimulacaoRealizada(false); setResultados(null);}} className="input-form"><option value="">Selecione</option>{Object.values(ModalidadeDistribuidorHyCite).map(nivel => (<option key={nivel} value={nivel}>{nivel}</option>))}</select></div>)}
           {renderRegimeSpecificInputs()}
        </div>
      </Card>

      <Card className="shadow-lg">
        <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">2. Produtos e Valores</h2>
        {/* ... (seção de adicionar produtos existente) ... */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4"><label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Produto</label><select value={produtoSelecionadoId} onChange={(e) => setProdutoSelecionadoId(e.target.value)} className="input-form"><option value="">Selecione</option>{produtosDisponiveisMock.map(p => <option key={p.id} value={p.id}>{p.descricao}</option>)}</select></div>
          <div className="md:col-span-1"><label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Qtd.</label><input type="number" min="1" value={quantidadeProduto} onChange={(e) => setQuantidadeProduto(parseInt(e.target.value,10)||1)} className="input-form"/></div>
          <div className="md:col-span-2"><label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Vlr. Unit. Final</label><input type="number" step="0.01" placeholder="Com desconto" value={valorUnitarioInformadoItem} onChange={(e) => setValorUnitarioInformadoItem(e.target.value)} className="input-form"/></div>
          <div className="md:col-span-2"><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Custo: {formatCurrency(produtosDisponiveisMock.find(p=>p.id===produtoSelecionadoId)?.precoCusto||0)}<br/>Venda Padrão: {formatCurrency(produtosDisponiveisMock.find(p=>p.id===produtoSelecionadoId)?.precoVendaVarejo||0)}</p></div>
          <div className="md:col-span-3"><Button onClick={handleAdicionarProduto} fullWidth disabled={!produtoSelecionadoId}>Adicionar Produto</Button></div>
        </div>
        {produtosNaSimulacao.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-semibold text-nixcon-dark dark:text-nixcon-light mb-2">Itens na Simulação:</h3>
            <div className="mb-4 md:col-span-3">
                <label htmlFor="valorFinalNotaDesejado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Final da Nota Desejado (Opcional)</label>
                <input type="number" id="valorFinalNotaDesejado" placeholder="Ex: 1000.00" value={valorFinalNotaDesejado} onChange={handleValorFinalNotaDesejadoChange} className="input-form w-full md:w-1/3" step="0.01"/>
                {descontoTotalCalculado > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Desconto total necessário: {formatCurrency(descontoTotalCalculado)} ({percentualDescontoTotalCalculado.toFixed(2)}%)
                    </p>
                )}
            </div>
            <ul className="space-y-2">
              {produtosNaSimulacao.map(p => (
                <li key={p.id} className="flex flex-wrap justify-between items-center p-2 border rounded-md bg-gray-50 dark:bg-gray-700 gap-2">
                  <div className="flex-grow">
                    <span className="font-medium text-nixcon-dark dark:text-nixcon-light">{p.descricao}</span> (Qtd: {p.quantidade})<br/>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Vlr. Unit. Final: {formatCurrency(p.valorFinalUnitario)}</span>
                    {p.descontoCalculado > 0.01 && <span className="text-xs text-green-700 dark:text-green-400 ml-2"> (Desc: {p.descontoCalculado.toFixed(2)}%)</span>}
                  </div>
                  <div className="flex items-center space-x-2">
                     <label htmlFor={`rateio-${p.id}`} className="text-xs text-gray-600 dark:text-gray-300 flex items-center">
                        <input type="checkbox" id={`rateio-${p.id}`} checked={p.participaRateioDesconto} onChange={() => handleToggleParticipaRateio(p.id)} className="mr-1 h-3.5 w-3.5 text-nixcon-gold focus:ring-nixcon-gold border-gray-300 dark:border-gray-600 rounded"/>
                        Ratear Desc.
                    </label>
                    <Button onClick={() => handleRemoverProduto(p.id)} variant="danger" size="sm" className="p-1 text-xs">Remover</Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
        <Button onClick={handleSimular} disabled={produtosNaSimulacao.length === 0 || !regimeTributarioAtual} size="lg" leftIcon={<IconeFiscal className="w-5 h-5"/>}>Simular Impostos</Button>
        <Button onClick={handleSalvar} variant="secondary" size="lg" disabled={!simulacaoRealizada} leftIcon={<IconeDocumentos className="w-5 h-5"/>}>Salvar</Button>
        <Button onClick={handleEnviarEscritorio} variant="ghost" size="lg" disabled={!simulacaoRealizada} leftIcon={<IconeMensagens className="w-5 h-5"/>}>Enviar ao Escritório</Button>
      </div>

      {simulacaoRealizada && resultados && (
        <Card className="shadow-xl mt-8 bg-nixcon-light dark:bg-gray-800 border border-nixcon-gold dark:border-yellow-600">
          <h2 className="text-2xl font-bold text-nixcon-dark dark:text-nixcon-light mb-6 text-center">Resultado da Simulação ({resultados.regimeSimulado?.replace('_', ' ') || 'N/A'})</h2>
          
          {/* Exibição do Fator R e Observação */}
          {typeof resultados.fatorRCalculado === 'number' && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 border-l-4 border-blue-500 dark:border-blue-400 rounded-md">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Fator R Calculado: <span className="font-bold">{(resultados.fatorRCalculado * 100).toFixed(2)}%</span></p>
              {resultados.observacaoFatorR && <p className="text-xs text-blue-600 dark:text-blue-200 mt-1">{resultados.observacaoFatorR}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ... (resto do resumo financeiro e detalhamento de impostos) ... */}
            <div className="bg-white dark:bg-nixcon-dark-card p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-nixcon-dark dark:text-nixcon-light mb-3">Resumo Financeiro</h3>
              <dl className="space-y-1 text-sm">
                  <div className="flex justify-between py-1 border-b dark:border-gray-700"><dt className="text-gray-600 dark:text-gray-300">Faturamento Total:</dt><dd className="font-semibold text-nixcon-dark dark:text-nixcon-light">{formatCurrency(resultados.faturamentoTotal)}</dd></div>
                  {resultados.descontoTotalAplicado && resultados.descontoTotalAplicado > 0 && (
                    <div className="flex justify-between py-1 border-b dark:border-gray-700 text-red-600 dark:text-red-400"><dt>Desconto Total Aplicado:</dt><dd className="font-semibold">-{formatCurrency(resultados.descontoTotalAplicado)} ({resultados.percentualDescontoTotalAplicado?.toFixed(2)}%)</dd></div>
                  )}
                  <div className="flex justify-between py-1 border-b dark:border-gray-700"><dt className="text-gray-600 dark:text-gray-300">Custo Produtos:</dt><dd className="text-nixcon-dark dark:text-nixcon-light">{formatCurrency(resultados.custoTotalProdutos)}</dd></div>
                  <div className="flex justify-between py-1 border-b dark:border-gray-700"><dt className="text-gray-600 dark:text-gray-300">Impostos Compra (Est.):</dt><dd className="text-nixcon-dark dark:text-nixcon-light">{formatCurrency(resultados.impostosSobreComprasEstimativa)}</dd></div>
                  <div className="flex justify-between py-1 border-b dark:border-gray-700"><dt className="text-gray-600 dark:text-gray-300">DIFAL (Est.):</dt><dd className="text-nixcon-dark dark:text-nixcon-light">{formatCurrency(resultados.difalEstimativa)}</dd></div>
                  <div className="flex justify-between py-1 border-b dark:border-gray-700 font-semibold text-red-500 dark:text-red-400"><dt>Total Impostos Venda (Est.):</dt><dd>{formatCurrency(resultados.impostosSobreVendasTotalMock)}</dd></div>
                  {resultados.taxasHyCiteAplicadas?.map(taxa => (<div key={taxa.idTaxa} className="flex justify-between py-1 border-b dark:border-gray-700"><dt className="text-gray-600 dark:text-gray-300" title={taxa.observacoes||taxa.baseCalculoUsada}>{taxa.tituloTaxa}:</dt><dd className="text-red-600 dark:text-red-400">-{formatCurrency(taxa.valorCalculado)}</dd></div>))}
                  <div className="flex justify-between pt-2 mt-2 border-t-2 border-nixcon-gold dark:border-yellow-500"><dt className="text-lg font-bold text-nixcon-dark dark:text-nixcon-light">Lucro Bruto (Est.):</dt><dd className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(resultados.lucroBrutoEstimadoTotalMock)}</dd></div>
              </dl>
            </div>
             <div className="bg-white dark:bg-nixcon-dark-card p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-nixcon-dark dark:text-nixcon-light mb-3">Detalhamento dos Impostos sobre Vendas</h3>
                {resultados.detalhamentoTributos && resultados.detalhamentoTributos.length > 0 ? (
                    <dl className="space-y-1 text-sm">
                        {resultados.detalhamentoTributos.map(imposto => (
                            <div key={imposto.nome} className="flex justify-between py-1 border-b dark:border-gray-700">
                                <dt className="text-gray-600 dark:text-gray-300">
                                    {imposto.nome}
                                    {imposto.aliquotaEfetiva && <span className="text-xs text-blue-500 dark:text-blue-400 ml-1">({imposto.aliquotaEfetiva})</span>}
                                </dt>
                                <dd className="font-medium text-nixcon-dark dark:text-nixcon-light">{formatCurrency(imposto.valor)}</dd>
                            </div>
                        ))}
                    </dl>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">Nenhum imposto calculado para este regime/faturamento.</p>
                )}
                 {resultados.observacoesNotaFiscal && (
                    <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-200">Obs. Nota Fiscal (Estimativa):</h4>
                        <p className="text-xxs text-gray-600 dark:text-gray-300">{resultados.observacoesNotaFiscal}</p>
                    </div>
                )}
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mt-8 mb-4">Detalhamento por Produto</h3>
          <div className="overflow-x-auto bg-white dark:bg-nixcon-dark-card rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800"><tr>{[ "Produto (Qtd)", "Vlr. Venda Unit.", "Desc. Aplicado (%)", "Faturamento", "Custo", "Lucro Bruto (Est.)"].map(h=><th key={h} className="th-simu">{h}</th>)}</tr></thead>
              <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
                {resultados.detalhamentoProdutos.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="td-simu font-medium text-nixcon-dark dark:text-nixcon-light">{p.descricao} ({p.quantidade})</td>
                    <td className="td-simu text-gray-600 dark:text-gray-300">{formatCurrency(p.valorFinalUnitario)}</td>
                    <td className="td-simu text-green-600 dark:text-green-400">{p.descontoCalculado > 0.01 ? `${p.descontoCalculado.toFixed(2)}%` : '-'}</td>
                    <td className="td-simu text-gray-600 dark:text-gray-300">{formatCurrency(p.faturamentoItem)}</td>
                    <td className="td-simu text-gray-600 dark:text-gray-300">{formatCurrency(p.custoItem)}</td>
                    <td className="td-simu font-semibold text-green-600 dark:text-green-400">{formatCurrency(p.lucroBrutoItemMock)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">Atenção: Simulação com cálculos simplificados. Consulte seu contador.</p>
      <style>{`
        .input-form { display: block; width: 100%; padding: 0.5rem 0.75rem; font-size: 0.875rem; border-width: 1px; border-color: #D1D5DB; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); background-color: white; }
        .input-form:focus { outline: 2px solid transparent; outline-offset: 2px; ring-width: 2px; ring-color: #dbbd67; border-color: #dbbd67; }
        .dark .input-form { background-color: #374151; border-color: #4B5563; color: #D1D5DB; }
        .th-simu, .td-simu { padding: 0.5rem 0.75rem; text-align: left; font-size: 0.75rem; line-height: 1rem; }
        .th-simu { font-weight: 500; color: #6B7280; text-transform: uppercase; }
        .dark .th-simu { color: #9CA3AF; }
        .td-simu { color: #374151; }
        .dark .td-simu { color: #D1D5DB; }
        .text-xxs { font-size: 0.65rem; line-height: 0.9rem; }
      `}</style>
    </div>
  );
};

export default SimulacaoImpostosPage;
