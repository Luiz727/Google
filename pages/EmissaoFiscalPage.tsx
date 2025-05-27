
import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeFiscal as IconePaginaFiscal, IconeDocumentos, IconeLixeira, IconeXml } from '../components/common/Icons'; // Renamed IconeFiscal import
import { useAuth } from '../contexts/AuthContext';
import { 
  TipoDocumentoFiscal, 
  StatusNotaFiscal, 
  NotaFiscal, 
  ItemNotaFiscal, 
  DestinatarioNota,
  Endereco,
  Produto as ProdutoGlobal,
  EmitenteNota,
  FuncaoUsuario,
  ConfiguracoesEmissor, 
  Empresa,
  PagamentoNota, 
  TransportadoraNota, 
  FormaPagamento, 
  FormasPagamentoOptions, 
  ModalidadeFrete, 
  ModalidadesFreteOptions 
} from '../types';
import { Link } from 'react-router-dom';


const agora = new Date().toISOString();
const produtosDisponiveisMock: ProdutoGlobal[] = [
  { 
    id: 'prod1', descricao: 'Produto Digital A', tipoProduto: 'PRODUTO', unidade: 'UN',
    precoCusto: 50, precoVendaVarejo: 150, movimentaEstoque: false, ativo: true, 
    origemTenant: 'UNIVERSAL_ESCRITORIO', dataCriacao: agora, dataAtualizacao: agora, ncm: '85234900'
  },
  { 
    id: 'serv1', descricao: 'Serviço de Consultoria Basic', tipoProduto: 'SERVICO', unidade: 'HORA',
    precoCusto: 200, precoVendaVarejo: 500, movimentaEstoque: false, ativo: true,
    origemTenant: 'UNIVERSAL_ESCRITORIO', dataCriacao: agora, dataAtualizacao: agora, ncm: '00000000' // NCM genérico para serviço ou código de serviço
  },
];

const formatCurrency = (value: number | undefined) => {
  if (typeof value !== 'number') return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(date);
};


const getEmpresasFromStorage = (tenantEscritorioId: string | undefined): Empresa[] => {
    if (!tenantEscritorioId) return [];
    const STORAGE_KEY_PREFIX_EMPRESAS = 'nixconPortalEmpresas_';
    const storageKey = `${STORAGE_KEY_PREFIX_EMPRESAS}${tenantEscritorioId}`;
    const empresasSalvas = localStorage.getItem(storageKey);
    return empresasSalvas ? JSON.parse(empresasSalvas) : [];
};

const NOTAS_FISCAIS_STORAGE_PREFIX = 'nixconPortalNotasFiscais_';

const gerarXmlNfseMock = (nota: NotaFiscal): string => {
  const itensXml = nota.itens.map(item => `
    <ItemServico>
      <Discriminacao>${item.descricao}</Discriminacao>
      <Quantidade>${item.quantidade}</Quantidade>
      <ValorUnitario>${item.valorUnitario.toFixed(2)}</ValorUnitario>
      <ValorTotal>${item.valorTotal.toFixed(2)}</ValorTotal>
      <CodigoServicoMunicipal>${item.itemListaServicoLC116 || 'N/A'}</CodigoServicoMunicipal>
      <AliquotaISS>${item.issAliquota?.toFixed(2) || '0.00'}</AliquotaISS>
    </ItemServico>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<CompNfse xmlns="http://www.abrasf.org.br/nfse.xsd">
  <Nfse>
    <InfNfse id="${nota.id}">
      <Numero>${nota.numero}</Numero>
      <CodigoVerificacao>${nota.protocoloAutorizacao}</CodigoVerificacao>
      <DataEmissao>${nota.dataEmissao}</DataEmissao>
      <NaturezaOperacao>${nota.naturezaOperacao}</NaturezaOperacao>
      <OptanteSimplesNacional>1</OptanteSimplesNacional> 
      <IncentivadorCultural>2</IncentivadorCultural>
      <Competencia>${nota.dataEmissao.substring(0,10).replace(/-/g,'')}</Competencia>
      <Servico>
        <Valores>
          <ValorServicos>${nota.valorTotalServicos?.toFixed(2) || nota.valorTotalNota.toFixed(2)}</ValorServicos>
          <ValorIss>${((nota.valorTotalServicos || nota.valorTotalNota) * (nota.itens[0]?.issAliquota || 0) / 100).toFixed(2) }</ValorIss> 
          <Aliquota>${nota.itens[0]?.issAliquota?.toFixed(2) || '0.00'}</Aliquota>
        </Valores>
        ${itensXml}
        <CodigoTributacaoMunicipio>${nota.itens[0]?.codigoTributacaoNacional || 'N/A'}</CodigoTributacaoMunicipio>
      </Servico>
      <PrestadorServico>
        <IdentificacaoPrestador>
          <Cnpj>${nota.emitente.cnpj}</Cnpj>
          <InscricaoMunicipal>${nota.emitente.inscricaoMunicipal || 'N/A'}</InscricaoMunicipal>
        </IdentificacaoPrestador>
        <RazaoSocial>${nota.emitente.razaoSocial}</RazaoSocial>
        <NomeFantasia>${nota.emitente.nomeFantasia || nota.emitente.razaoSocial}</NomeFantasia>
        <Endereco>
          <Logradouro>${nota.emitente.endereco?.logradouro}</Logradouro>
          <Numero>${nota.emitente.endereco?.numero}</Numero>
          <Bairro>${nota.emitente.endereco?.bairro}</Bairro>
          <CodigoMunicipio>${nota.emitente.endereco?.cidade?.substring(0,7)}</CodigoMunicipio> 
          <Uf>${nota.emitente.endereco?.uf}</Uf>
          <Cep>${nota.emitente.endereco?.cep}</Cep>
        </Endereco>
      </PrestadorServico>
      <TomadorServico>
        <IdentificacaoTomador>
          <CpfCnpj><Cnpj>${nota.destinatario.cpfCnpj.replace(/\D/g,'')}</Cnpj></CpfCnpj>
        </IdentificacaoTomador>
        <RazaoSocial>${nota.destinatario.nomeRazaoSocial}</RazaoSocial>
        <Endereco>
          <Logradouro>${nota.destinatario.endereco.logradouro}</Logradouro>
          <Numero>${nota.destinatario.endereco.numero}</Numero>
          <Bairro>${nota.destinatario.endereco.bairro}</Bairro>
          <CodigoMunicipio>${nota.destinatario.endereco.cidade?.substring(0,7)}</CodigoMunicipio>
          <Uf>${nota.destinatario.endereco.uf}</Uf>
          <Cep>${nota.destinatario.endereco.cep}</Cep>
        </Endereco>
      </TomadorServico>
    </InfNfse>
  </Nfse>
</CompNfse>`;
};


const EmissaoFiscalPage: React.FC = () => {
  const { usuarioAtual, tenantAtual, personificandoInfo, activeClientCompanyContext } = useAuth();
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
  const [modalNovaNotaAberto, setModalNovaNotaAberto] = useState(false);
  
  const [tipoDocSelecionadoForm, setTipoDocSelecionadoForm] = useState<TipoDocumentoFiscal>(TipoDocumentoFiscal.NFe);
  const [destinatarioForm, setDestinatarioForm] = useState<Partial<DestinatarioNota>>({ endereco: {} as Endereco });
  const [itensNotaForm, setItensNotaForm] = useState<ItemNotaFiscal[]>([]);
  const [naturezaOperacaoForm, setNaturezaOperacaoForm] = useState<string>('');
  const [infoAdicionaisForm, setInfoAdicionaisForm] = useState<string>('');
  const [localEmissaoForm, setLocalEmissaoForm] = useState<string>(''); // Para Recibo
  const [valorTotalReciboForm, setValorTotalReciboForm] = useState<string>(''); // Para Recibo

  const [pagamentosForm, setPagamentosForm] = useState<PagamentoNota[]>([]);
  const [pagamentoAtualForm, setPagamentoAtualForm] = useState<Partial<PagamentoNota>>({ forma: 'DINHEIRO', valor: 0 });
  const [transportadoraForm, setTransportadoraForm] = useState<Partial<TransportadoraNota>>({ modalidadeFrete: 'SEM_FRETE', endereco: {} as Endereco});

  const [produtoSelecionadoItem, setProdutoSelecionadoItem] = useState<string>('');
  const [quantidadeItem, setQuantidadeItem] = useState<number>(1);
  const [valorUnitarioItem, setValorUnitarioItem] = useState<string>(''); 
  const [codigoTributacaoNacionalItem, setCodigoTributacaoNacionalItem] = useState<string>('');
  const [itemListaServicoLC116Item, setItemListaServicoLC116Item] = useState<string>('');
  const [cnaeItem, setCnaeItem] = useState<string>('');
  const [issAliquotaItem, setIssAliquotaItem] = useState<string>(''); 

  const [abaAtiva, setAbaAtiva] = useState<TipoDocumentoFiscal>(TipoDocumentoFiscal.NFe);

  const [modalPreviewNotaVisivel, setModalPreviewNotaVisivel] = useState(false);
  const [notaParaPreview, setNotaParaPreview] = useState<NotaFiscal | null>(null);
  const [modalXmlVisivel, setModalXmlVisivel] = useState(false);
  const [xmlParaVisualizar, setXmlParaVisualizar] = useState<string | null>(null);

  const effectiveTenantId = useMemo(() => {
    if (personificandoInfo) return personificandoInfo.empresaId;
    if (activeClientCompanyContext && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN)) {
        return activeClientCompanyContext.id;
    }
    if (usuarioAtual && 
        (usuarioAtual.funcao === FuncaoUsuario.ADMIN_CLIENTE || 
         usuarioAtual.funcao === FuncaoUsuario.USUARIO_CLIENTE || 
         usuarioAtual.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE)) {
        return usuarioAtual.tenantId; 
    }
    if (tenantAtual && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN) && !activeClientCompanyContext && !personificandoInfo) {
        return tenantAtual.id;
    }
    return undefined; 
  }, [personificandoInfo, activeClientCompanyContext, usuarioAtual, tenantAtual]);

  const configuracoesEmissorAtuais = useMemo(() => {
    if (personificandoInfo && tenantAtual) { 
        const empresasDoEscritorio = getEmpresasFromStorage(tenantAtual.id);
        const empresaPersonificada = empresasDoEscritorio.find(emp => emp.id === personificandoInfo.empresaId);
        if (empresaPersonificada?.configuracoesEmissor?.cnpj && empresaPersonificada?.configuracoesEmissor?.certificadoConfigurado) {
            return empresaPersonificada.configuracoesEmissor;
        }
    } 
    else if (activeClientCompanyContext && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN)) {
        if (activeClientCompanyContext.configuracoesEmissor?.cnpj && activeClientCompanyContext.configuracoesEmissor?.certificadoConfigurado) {
            return activeClientCompanyContext.configuracoesEmissor;
        }
    }
    else if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && usuarioAtual.tenantId && tenantAtual) {
        const empresasDoEscritorio = getEmpresasFromStorage(tenantAtual.id);
        const empresaAtiva = empresasDoEscritorio.find(emp => emp.id === usuarioAtual.tenantId);
        if (empresaAtiva?.configuracoesEmissor?.cnpj && empresaAtiva?.configuracoesEmissor?.certificadoConfigurado) {
            return empresaAtiva.configuracoesEmissor;
        }
    }
    return tenantAtual?.configuracoesEmissor;
  }, [personificandoInfo, tenantAtual, usuarioAtual, activeClientCompanyContext]);


  const isEmitterConfigured = useMemo(() => {
    const config = configuracoesEmissorAtuais;
    return config && config.cnpj && config.razaoSocial && config.endereco?.cep && config.certificadoConfigurado;
  }, [configuracoesEmissorAtuais]);

  const activeContextName = useMemo(() => {
    if (personificandoInfo) return personificandoInfo.empresaNome;
    if (activeClientCompanyContext && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN)) {
        return activeClientCompanyContext.nome;
    }
    if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && usuarioAtual.tenantId && tenantAtual) {
        const empresasDoEscritorio = getEmpresasFromStorage(tenantAtual.id); 
        const empresaAtiva = empresasDoEscritorio.find(emp => emp.id === usuarioAtual.tenantId); 
        return empresaAtiva?.nome || 'Empresa Ativa (Não Encontrada)';
    }
    return tenantAtual?.nome || 'Escritório';
  }, [personificandoInfo, usuarioAtual, tenantAtual, activeClientCompanyContext]);

  const getNotasStorageKey = useMemo(() => {
    let contextId: string | undefined;
    let prefixType: 'empresa' | 'escritorio' = 'escritorio';

    if (personificandoInfo) {
        contextId = personificandoInfo.empresaId;
        prefixType = 'empresa';
    } else if (activeClientCompanyContext) {
        contextId = activeClientCompanyContext.id;
        prefixType = 'empresa';
    } else if (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_CLIENTE || usuarioAtual?.funcao === FuncaoUsuario.USUARIO_CLIENTE || usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE) {
        contextId = usuarioAtual.tenantId; 
        prefixType = 'empresa';
    } else if (tenantAtual && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN)) { 
        contextId = tenantAtual.id;
        prefixType = 'escritorio';
    }
    
    if (!contextId && effectiveTenantId) {
        contextId = effectiveTenantId;
        if (effectiveTenantId === tenantAtual?.id && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN) && !activeClientCompanyContext && !personificandoInfo) {
            prefixType = 'escritorio';
        } else {
            prefixType = 'empresa'; 
        }
    }
    
    return contextId ? `${NOTAS_FISCAIS_STORAGE_PREFIX}${prefixType}_${contextId}` : null;
  }, [personificandoInfo, activeClientCompanyContext, usuarioAtual, tenantAtual, effectiveTenantId]);


  useEffect(() => {
    if (getNotasStorageKey) {
        const notasSalvas = localStorage.getItem(getNotasStorageKey);
        if (notasSalvas) {
            setNotasFiscais(JSON.parse(notasSalvas));
        } else {
            setNotasFiscais([]);
        }
    } else {
        setNotasFiscais([]); 
    }
  }, [getNotasStorageKey]);

  useEffect(() => {
    if (getNotasStorageKey && notasFiscais.length >= 0) { 
        localStorage.setItem(getNotasStorageKey, JSON.stringify(notasFiscais));
    }
  }, [notasFiscais, getNotasStorageKey]);


  useEffect(() => {
    if(produtoSelecionadoItem) {
        const produto = produtosDisponiveisMock.find(p => p.id === produtoSelecionadoItem);
        if(produto) {
          setValorUnitarioItem(produto.precoVendaVarejo.toString());
           if (produto.tipoProduto === 'SERVICO' && tipoDocSelecionadoForm === TipoDocumentoFiscal.NFSe) {
                setCnaeItem(configuracoesEmissorAtuais?.cnaePrincipal || '');
                setItemListaServicoLC116Item(configuracoesEmissorAtuais?.listaServicos || '');
                setIssAliquotaItem(tenantAtual?.configuracoesModulos?.fiscal?.aliquotaISSPadrao?.toString() || '');
            } else {
                setCnaeItem('');
                setItemListaServicoLC116Item('');
                setIssAliquotaItem('');
            }
            setCodigoTributacaoNacionalItem('');
        }
    } else {
        setValorUnitarioItem('');
        setCnaeItem('');
        setItemListaServicoLC116Item('');
        setIssAliquotaItem('');
        setCodigoTributacaoNacionalItem('');
    }
  }, [produtoSelecionadoItem, tipoDocSelecionadoForm, configuracoesEmissorAtuais, tenantAtual]);

  const resetFormularioNovaNota = (tipoPadrao: TipoDocumentoFiscal = abaAtiva) => {
    setTipoDocSelecionadoForm(tipoPadrao);
    setDestinatarioForm({ telefone: '', endereco: { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: '' } });
    setItensNotaForm([]);
    setNaturezaOperacaoForm(tipoPadrao === TipoDocumentoFiscal.NFSe ? 'Prestação de Serviço' : tipoPadrao === TipoDocumentoFiscal.RECIBO ? 'Pagamento Referente a' : 'Venda de Mercadoria');
    setInfoAdicionaisForm('');
    setLocalEmissaoForm(configuracoesEmissorAtuais?.endereco?.cidade && configuracoesEmissorAtuais?.endereco?.uf ? `${configuracoesEmissorAtuais.endereco.cidade}, ${configuracoesEmissorAtuais.endereco.uf}` : '');
    setValorTotalReciboForm('');
    setProdutoSelecionadoItem('');
    setQuantidadeItem(1);
    setValorUnitarioItem('');
    setCodigoTributacaoNacionalItem('');
    setItemListaServicoLC116Item('');
    setCnaeItem('');
    setIssAliquotaItem('');
    setPagamentosForm([]);
    setPagamentoAtualForm({ forma: 'DINHEIRO', valor: 0 });
    setTransportadoraForm({ modalidadeFrete: 'SEM_FRETE', endereco: {} as Endereco });
  }

  const handleAbrirModalNovaNota = (notaParaDuplicar?: NotaFiscal) => {
    if (!isEmitterConfigured) {
      const mensagem = (personificandoInfo || activeClientCompanyContext || usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE)
        ? `Configurações do emissor fiscal para "${activeContextName}" não encontradas ou incompletas.`
        : "Configurações do emissor fiscal do escritório não encontradas ou incompletas.";
      alert(`${mensagem} Por favor, configure-as primeiro.`);
      return;
    }
    
    if (notaParaDuplicar) {
        setTipoDocSelecionadoForm(notaParaDuplicar.tipoDocumento);
        setDestinatarioForm({ ...notaParaDuplicar.destinatario, endereco: {...notaParaDuplicar.destinatario?.endereco} }); 
        if (notaParaDuplicar.tipoDocumento === TipoDocumentoFiscal.RECIBO) {
            setInfoAdicionaisForm(notaParaDuplicar.informacoesAdicionais || '');
            setValorTotalReciboForm(notaParaDuplicar.valorTotalNota.toString());
            setLocalEmissaoForm(notaParaDuplicar.localEmissao || '');
            setItensNotaForm([]); // Recibos não usam itens complexos
        } else {
            setItensNotaForm(notaParaDuplicar.itens.map((item, index) => ({ ...item, id: `item-dup-${Date.now()}-${index}` })));
            setValorTotalReciboForm('');
        }
        setNaturezaOperacaoForm(notaParaDuplicar.naturezaOperacao || '');
        setPagamentosForm(notaParaDuplicar.pagamentos?.map(p => ({...p, id: `pag-dup-${Date.now()}-${Math.random()}`})) || []);
        setTransportadoraForm(notaParaDuplicar.transportadora ? {...notaParaDuplicar.transportadora, endereco: {...notaParaDuplicar.transportadora.endereco}} : { modalidadeFrete: 'SEM_FRETE', endereco: {} as Endereco });
        setProdutoSelecionadoItem('');
        setQuantidadeItem(1);
        setValorUnitarioItem('');
        setPagamentoAtualForm({ forma: 'DINHEIRO', valor: 0 });
        setCodigoTributacaoNacionalItem('');
        setItemListaServicoLC116Item('');
        setCnaeItem('');
        setIssAliquotaItem('');
    } else {
        resetFormularioNovaNota(abaAtiva); 
    }
    
    setModalNovaNotaAberto(true);
  };

  const handleAdicionarItemNota = () => {
    const produtoBase = produtosDisponiveisMock.find(p => p.id === produtoSelecionadoItem);
    if (!produtoBase || quantidadeItem <= 0) {
      alert("Selecione um produto e quantidade válida.");
      return;
    }
    const valorUnit = parseFloat(valorUnitarioItem);
    if (isNaN(valorUnit) || valorUnit <= 0) {
      alert("Valor unitário inválido.");
      return;
    }
    const issAliquotaNum = parseFloat(issAliquotaItem);

    const novoItem: ItemNotaFiscal = {
      id: `item-${Date.now()}`, 
      produtoId: produtoBase.id,
      descricao: produtoBase.descricao,
      quantidade: quantidadeItem,
      valorUnitario: valorUnit,
      valorTotal: quantidadeItem * valorUnit,
      ncm: tipoDocSelecionadoForm !== TipoDocumentoFiscal.NFSe ? produtoBase.ncm : undefined,
      codigoTributacaoNacional: tipoDocSelecionadoForm === TipoDocumentoFiscal.NFSe ? codigoTributacaoNacionalItem : undefined,
      itemListaServicoLC116: tipoDocSelecionadoForm === TipoDocumentoFiscal.NFSe ? itemListaServicoLC116Item : undefined,
      cnae: tipoDocSelecionadoForm === TipoDocumentoFiscal.NFSe ? cnaeItem : undefined,
      issAliquota: tipoDocSelecionadoForm === TipoDocumentoFiscal.NFSe && !isNaN(issAliquotaNum) ? issAliquotaNum : undefined,
    };
    setItensNotaForm([...itensNotaForm, novoItem]);
    setProdutoSelecionadoItem('');
    setQuantidadeItem(1);
    setValorUnitarioItem('');
    setCodigoTributacaoNacionalItem('');
    setItemListaServicoLC116Item('');
    setCnaeItem('');
    setIssAliquotaItem('');
  };
  
  const handleRemoverItemNota = (idItem: string) => {
    setItensNotaForm(itensNotaForm.filter(item => item.id !== idItem));
  };

  const handleAdicionarPagamento = () => {
    if (!pagamentoAtualForm.forma || pagamentoAtualForm.valor <= 0) {
      alert("Selecione uma forma de pagamento e um valor válido.");
      return;
    }
    setPagamentosForm([...pagamentosForm, { ...pagamentoAtualForm, id: `pag-${Date.now()}` } as PagamentoNota]);
    setPagamentoAtualForm({ forma: 'DINHEIRO', valor: 0 }); 
  };

  const handleRemoverPagamento = (idPagamento: string) => {
    setPagamentosForm(pagamentosForm.filter(p => p.id !== idPagamento));
  };


  const calcularTotaisNota = () => {
    if (tipoDocSelecionadoForm === TipoDocumentoFiscal.RECIBO) {
        const valorRecibo = parseFloat(valorTotalReciboForm);
        return { valorTotalNota: isNaN(valorRecibo) ? 0 : valorRecibo };
    }
    const valorTotalItens = itensNotaForm.reduce((sum, item) => sum + item.valorTotal, 0);
    return { valorTotalNota: valorTotalItens, valorTotalProdutos: valorTotalItens, valorTotalServicos: valorTotalItens }; 
  };

  const handleEmitirNotaSimulado = () => {
    if (tipoDocSelecionadoForm !== TipoDocumentoFiscal.RECIBO && itensNotaForm.length === 0) {
      alert("Adicione pelo menos um item à nota.");
      return;
    }
    if (!destinatarioForm.nomeRazaoSocial || !destinatarioForm.cpfCnpj ) {
        alert("Preencha os dados do destinatário/recebedor (Nome/Razão Social, CPF/CNPJ).");
        return;
    }
     if (!configuracoesEmissorAtuais) { 
      alert("Configurações do emissor não encontradas. Verifique as configurações.");
      return;
    }
     if (!effectiveTenantId) {
        alert("Não foi possível determinar o contexto do tenant para esta nota. Verifique as configurações ou o contexto de personificação/cliente ativo.");
        return;
    }

    const { valorTotalNota, valorTotalProdutos, valorTotalServicos } = calcularTotaisNota();
    
    const novaNotaBase: Omit<NotaFiscal, 'id' | 'status'> = {
      tipoDocumento: tipoDocSelecionadoForm,
      dataEmissao: new Date().toISOString(),
      destinatario: destinatarioForm as DestinatarioNota, 
      emitente: configuracoesEmissorAtuais as EmitenteNota, 
      itens: tipoDocSelecionadoForm === TipoDocumentoFiscal.RECIBO ? [] : itensNotaForm,
      pagamentos: tipoDocSelecionadoForm !== TipoDocumentoFiscal.RECIBO && pagamentosForm.length > 0 ? pagamentosForm : undefined,
      transportadora: tipoDocSelecionadoForm === TipoDocumentoFiscal.NFe && transportadoraForm.modalidadeFrete !== 'SEM_FRETE' ? transportadoraForm as TransportadoraNota : undefined,
      valorTotalNota: valorTotalNota,
      valorTotalProdutos: tipoDocSelecionadoForm !== TipoDocumentoFiscal.NFSe && tipoDocSelecionadoForm !== TipoDocumentoFiscal.RECIBO ? valorTotalProdutos : undefined,
      valorTotalServicos: tipoDocSelecionadoForm === TipoDocumentoFiscal.NFSe ? valorTotalServicos : undefined,
      naturezaOperacao: tipoDocSelecionadoForm === TipoDocumentoFiscal.RECIBO ? `Recibo: ${infoAdicionaisForm.substring(0,30)}...` : naturezaOperacaoForm,
      informacoesAdicionais: infoAdicionaisForm,
      localEmissao: tipoDocSelecionadoForm === TipoDocumentoFiscal.RECIBO ? localEmissaoForm : undefined,
      tenantId: effectiveTenantId, 
      mensagensErro: []
    };

    const notaId = `nota-${Date.now()}`;
    let notaEmProcessamento: NotaFiscal = { ...novaNotaBase, id: notaId, status: StatusNotaFiscal.PROCESSANDO, mensagensErro: [] };
    
    if (tipoDocSelecionadoForm === TipoDocumentoFiscal.RECIBO) {
        notaEmProcessamento.status = StatusNotaFiscal.EMITIDA; // Recibos são emitidos diretamente
        setNotasFiscais(prev => [notaEmProcessamento, ...prev]);
        setModalNovaNotaAberto(false);
        setNotaParaPreview(notaEmProcessamento);
        setModalPreviewNotaVisivel(true);
        return;
    }
    
    // Lógica para NF-e, NFS-e, etc.
    setNotasFiscais(prev => [notaEmProcessamento, ...prev]);
    setModalNovaNotaAberto(false);

    setTimeout(() => { 
        if (tipoDocSelecionadoForm === TipoDocumentoFiscal.NFSe) {
            const falhaValidacao = Math.random() < 0.1; 
            if (falhaValidacao) {
                setNotasFiscais(prev => prev.map(n => n.id === notaId ? { ...n, status: StatusNotaFiscal.ERRO, mensagensErro: ["Erro simulado na validação dos dados da NFS-e."] } : n));
                return;
            }
            const reciboLote = `rps-${Date.now()}`;
            setNotasFiscais(prev => prev.map(n => n.id === notaId ? { ...n, status: StatusNotaFiscal.CONSULTAR_RECIBO, reciboLote } : n));
            
            setTimeout(() => { 
                const resultadoConsulta = Math.random();
                if (resultadoConsulta < 0.7) { 
                    const numeroNotaGerado = `NFS-${Math.floor(100 + Math.random() * 900)}`;
                    const protocolo = `nfseprot-${Date.now()}`;
                    const dataAutoriz = new Date().toISOString();
                    const xmlGerado = gerarXmlNfseMock({ ...notaEmProcessamento, numero: numeroNotaGerado, protocoloAutorizacao: protocolo, dataAutorizacao: dataAutoriz } as NotaFiscal);
                    
                    const notaEmitidaFinal: NotaFiscal = { ...notaEmProcessamento, id: notaId, status: StatusNotaFiscal.EMITIDA, numero: numeroNotaGerado, protocoloAutorizacao: protocolo, dataAutorizacao: dataAutoriz, xml: xmlGerado };
                    setNotasFiscais(prev => prev.map(n => n.id === notaId ? notaEmitidaFinal : n));
                    setNotaParaPreview(notaEmitidaFinal);
                    setModalPreviewNotaVisivel(true);

                } else if (resultadoConsulta < 0.9) { 
                    setNotasFiscais(prev => prev.map(n => n.id === notaId ? { ...n, status: StatusNotaFiscal.ERRO, mensagensErro: ["Erro de comunicação com o servidor da prefeitura (simulado)."] } : n));
                } else { 
                    console.log(`NFS-e ID ${notaId} ainda em processamento (simulado).`);
                }
            }, Math.random() * 1000 + 2000); 

        } else { // NFe, NFCe
            const notaEmitida: NotaFiscal = { 
                ...novaNotaBase, 
                id: notaId,
                status: StatusNotaFiscal.EMITIDA, 
                numero: Math.floor(1000 + Math.random() * 9000).toString(), 
                serie: tenantAtual?.configuracoesModulos?.fiscal?.seriePadraoNFe || '1', 
                chaveAcesso: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2,15)
            };
            setNotasFiscais(prevNotas => prevNotas.map(n => n.id === notaId ? notaEmitida : n));
            setNotaParaPreview(notaEmitida);
            setModalPreviewNotaVisivel(true);
        }
    }, 1000); 
  };
  
  const notasFiltradas = notasFiscais.filter(n => n.tipoDocumento === abaAtiva);

  const podeConfigurar = usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || 
                         usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN ||
                         (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && isEmitterConfigured); 

  if (!isEmitterConfigured && podeConfigurar) {
    const mensagemConfigNecessaria = (personificandoInfo || activeClientCompanyContext || usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE)
      ? `Para emitir documentos fiscais para "${activeContextName}", é necessário configurar os dados do emissor e o certificado digital desta empresa.`
      : "Para emitir documentos fiscais, é necessário primeiro configurar os dados do emissor e o certificado digital do escritório.";
    
    let linkConfig = "/configuracoes"; 
    if (personificandoInfo || activeClientCompanyContext) { 
      linkConfig = `/empresas`; 
    }
    
    const textoBotao = (personificandoInfo || activeClientCompanyContext || usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE) 
        ? `Verificar Config. de ${activeContextName}` 
        : "Ir para Configurações do Escritório";

    return (
      <div className="space-y-6 p-4 md:p-8">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center">
            <IconePaginaFiscal className="w-8 h-8 mr-3 text-nixcon-gold" />
            Emissão de Documentos Fiscais
            </h1>
        </div>
        <Card className="shadow-lg text-center">
          <IconePaginaFiscal className="w-16 h-16 text-nixcon-gold mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-2">Configuração Necessária</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {mensagemConfigNecessaria}
          </p>
          {(personificandoInfo || activeClientCompanyContext || usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN) && (
             <Link to={linkConfig}>
                <Button>{textoBotao}</Button>
             </Link>
          )}
        </Card>
      </div>
    );
  }


  const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm";
  const selectClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm";
  const modalInputClasses = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold text-sm";
  const modalSelectClasses = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold text-sm";


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center">
          <IconePaginaFiscal className="w-8 h-8 mr-3 text-nixcon-gold" />
          Emissão de Documentos Fiscais {configuracoesEmissorAtuais?.razaoSocial ? `(Emitindo por: ${configuracoesEmissorAtuais.razaoSocial.substring(0,30)}...)` : `(Contexto: ${activeContextName})`}
        </h1>
        <Button onClick={() => handleAbrirModalNovaNota()} disabled={!isEmitterConfigured}>
          {abaAtiva === TipoDocumentoFiscal.RECIBO ? 'Novo Recibo' : `Nova Nota (${abaAtiva})`}
        </Button>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {(Object.keys(TipoDocumentoFiscal) as Array<keyof typeof TipoDocumentoFiscal>).filter(key => TipoDocumentoFiscal[key] !== TipoDocumentoFiscal.ENTRADA).map((key) => (
            <button
              key={key}
              onClick={() => { setAbaAtiva(TipoDocumentoFiscal[key]); resetFormularioNovaNota(TipoDocumentoFiscal[key]); }}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${abaAtiva === TipoDocumentoFiscal[key] ? 'border-nixcon-gold text-nixcon-gold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 dark:hover:border-gray-600'}`}
            >
              {TipoDocumentoFiscal[key]}
            </button>
          ))}
        </nav>
      </div>

      <Card className="shadow-lg">
        <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">
            {abaAtiva === TipoDocumentoFiscal.RECIBO ? 'Recibos Emitidos' : `Notas Fiscais (${abaAtiva})`}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{abaAtiva === TipoDocumentoFiscal.RECIBO ? 'Número (ID)' : 'Número/Série'}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{abaAtiva === TipoDocumentoFiscal.RECIBO ? 'Recebedor' : 'Cliente'}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data Emissão</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {notasFiltradas.length > 0 ? notasFiltradas.map(nota => (
                <tr key={nota.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{nota.numero || nota.id.slice(-6)} {nota.serie && `/ ${nota.serie}`}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-nixcon-dark dark:text-nixcon-light">{nota.destinatario?.nomeRazaoSocial || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDateTime(nota.dataEmissao)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(nota.valorTotalNota)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        nota.status === StatusNotaFiscal.EMITIDA ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' :
                        nota.status === StatusNotaFiscal.PROCESSANDO || nota.status === StatusNotaFiscal.CONSULTAR_RECIBO ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' :
                        nota.status === StatusNotaFiscal.CANCELADA ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' :
                        nota.status === StatusNotaFiscal.ERRO ? 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                     }`}>
                        {nota.status}
                     </span>
                     {nota.reciboLote && nota.status === StatusNotaFiscal.CONSULTAR_RECIBO && <span className="block text-xxs text-gray-400 dark:text-gray-500">Recibo: {nota.reciboLote}</span>}
                     {nota.mensagensErro && nota.mensagensErro.length > 0 && <span className="block text-xxs text-red-500 dark:text-red-400" title={nota.mensagensErro.join('; ')}>{nota.mensagensErro[0].substring(0,30)}...</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm space-x-1">
                    {nota.status === StatusNotaFiscal.EMITIDA && nota.xml && nota.tipoDocumento !== TipoDocumentoFiscal.RECIBO && <Button variant="ghost" size="sm" onClick={() => {setXmlParaVisualizar(nota.xml!); setModalXmlVisivel(true);}}><IconeXml className="w-4 h-4"/></Button>}
                    {nota.status === StatusNotaFiscal.EMITIDA && <Button variant="ghost" size="sm" onClick={() => {setNotaParaPreview(nota); setModalPreviewNotaVisivel(true);}}>Ver</Button>}
                    {nota.status === StatusNotaFiscal.EMITIDA && <Button variant="secondary" size="sm" onClick={() => handleAbrirModalNovaNota(nota)}>Duplicar</Button>}
                    {nota.status === StatusNotaFiscal.EMITIDA && <Button variant="danger" size="sm" onClick={() => alert(`Cancelar ${nota.tipoDocumento} ${nota.numero || nota.id} (simulado)`)}>Cancelar</Button>}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhum documento emitido para este tipo.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modalNovaNotaAberto && (
        <Modal isOpen={modalNovaNotaAberto} onClose={() => setModalNovaNotaAberto(false)} title={tipoDocSelecionadoForm === TipoDocumentoFiscal.RECIBO ? 'Novo Recibo' : `Nova ${tipoDocSelecionadoForm}`}>
            <div className="space-y-4 max-h-[75vh] overflow-y-auto p-1">
                {tipoDocSelecionadoForm !== TipoDocumentoFiscal.RECIBO && (
                  <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Documento</label>
                      <select value={tipoDocSelecionadoForm} onChange={(e) => { const novoTipo = e.target.value as TipoDocumentoFiscal; setTipoDocSelecionadoForm(novoTipo); setNaturezaOperacaoForm(novoTipo === TipoDocumentoFiscal.NFSe ? 'Prestação de Serviço' : 'Venda de Mercadoria'); setProdutoSelecionadoItem(''); setTransportadoraForm({ modalidadeFrete: 'SEM_FRETE', endereco: {} as Endereco });}} className={`${selectClasses} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`}>
                          {(Object.keys(TipoDocumentoFiscal) as Array<keyof typeof TipoDocumentoFiscal>).filter(key => TipoDocumentoFiscal[key] !== TipoDocumentoFiscal.ENTRADA && TipoDocumentoFiscal[key] !== TipoDocumentoFiscal.RECIBO).map((key) => (<option key={key} value={TipoDocumentoFiscal[key]}>{TipoDocumentoFiscal[key]}</option>))}
                      </select>
                  </div>
                )}
                <fieldset className="border p-3 rounded-md dark:border-gray-600"><legend className="text-md font-medium text-nixcon-dark dark:text-nixcon-light px-1">{tipoDocSelecionadoForm === TipoDocumentoFiscal.RECIBO ? 'Recebedor' : 'Destinatário'}</legend><div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1"><input type="text" placeholder="Nome/Razão Social*" value={destinatarioForm.nomeRazaoSocial || ''} onChange={e => setDestinatarioForm(p => ({...p, nomeRazaoSocial: e.target.value}))} className={modalInputClasses} /><input type="text" placeholder="CPF/CNPJ*" value={destinatarioForm.cpfCnpj || ''} onChange={e => setDestinatarioForm(p => ({...p, cpfCnpj: e.target.value}))} className={modalInputClasses} /><input type="text" placeholder="Telefone" value={destinatarioForm.telefone || ''} onChange={e => setDestinatarioForm(p => ({...p, telefone: e.target.value}))} className={modalInputClasses} /><input type="text" placeholder="Inscrição Estadual" value={destinatarioForm.inscricaoEstadual || ''} onChange={e => setDestinatarioForm(p => ({...p, inscricaoEstadual: e.target.value}))} className={modalInputClasses} /><input type="email" placeholder="Email" value={destinatarioForm.email || ''} onChange={e => setDestinatarioForm(p => ({...p, email: e.target.value}))} className={modalInputClasses} /><input type="text" placeholder="CEP" value={destinatarioForm.endereco?.cep || ''} onChange={e => setDestinatarioForm(p => ({...p, endereco: {...p.endereco, cep: e.target.value} as Endereco}))} className={modalInputClasses} /><input type="text" placeholder="Logradouro" value={destinatarioForm.endereco?.logradouro || ''} onChange={e => setDestinatarioForm(p => ({...p, endereco: {...p.endereco, logradouro: e.target.value} as Endereco}))} className={modalInputClasses} /><input type="text" placeholder="Número" value={destinatarioForm.endereco?.numero || ''} onChange={e => setDestinatarioForm(p => ({...p, endereco: {...p.endereco, numero: e.target.value} as Endereco}))} className={modalInputClasses} /><input type="text" placeholder="Bairro" value={destinatarioForm.endereco?.bairro || ''} onChange={e => setDestinatarioForm(p => ({...p, endereco: {...p.endereco, bairro: e.target.value} as Endereco}))} className={modalInputClasses} /><input type="text" placeholder="Cidade" value={destinatarioForm.endereco?.cidade || ''} onChange={e => setDestinatarioForm(p => ({...p, endereco: {...p.endereco, cidade: e.target.value} as Endereco}))} className={modalInputClasses} /><input type="text" placeholder="UF" value={destinatarioForm.endereco?.uf || ''} onChange={e => setDestinatarioForm(p => ({...p, endereco: {...p.endereco, uf: e.target.value} as Endereco}))} maxLength={2} className={modalInputClasses} /></div></fieldset>
                
                {tipoDocSelecionadoForm === TipoDocumentoFiscal.RECIBO ? (
                    <>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição Detalhada do Recibo*</label><textarea value={infoAdicionaisForm} onChange={e => setInfoAdicionaisForm(e.target.value)} rows={4} required className={modalInputClasses}></textarea></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor Total do Recibo (R$)*</label><input type="number" step="0.01" value={valorTotalReciboForm} onChange={e => setValorTotalReciboForm(e.target.value)} required className={modalInputClasses}/></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Local de Emissão</label><input type="text" value={localEmissaoForm} onChange={e => setLocalEmissaoForm(e.target.value)} className={modalInputClasses} placeholder="Ex: São Paulo, SP"/></div>
                    </>
                ) : (
                    <>
                        <fieldset className="border p-3 rounded-md dark:border-gray-600"><legend className="text-md font-medium text-nixcon-dark dark:text-nixcon-light px-1">Itens/Serviços</legend>{/* ... campos de itens ... */}<div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end mt-1"><div className="md:col-span-2"><label className="text-xs text-gray-600 dark:text-gray-400">Produto/Serviço</label><select value={produtoSelecionadoItem} onChange={e => setProdutoSelecionadoItem(e.target.value)} className={modalSelectClasses}><option value="">Selecione...</option>{produtosDisponiveisMock.filter(p => tipoDocSelecionadoForm === TipoDocumentoFiscal.NFSe ? p.tipoProduto === 'SERVICO' : p.tipoProduto === 'PRODUTO').map(p => <option key={p.id} value={p.id}>{p.descricao}</option>)}</select></div><div><label className="text-xs text-gray-600 dark:text-gray-400">Qtd.</label><input type="number" min="1" value={quantidadeItem} onChange={e => setQuantidadeItem(parseInt(e.target.value) || 1)} className={`w-full text-sm ${modalInputClasses}`} /></div><div><label className="text-xs text-gray-600 dark:text-gray-400">Val. Unit.</label><input type="number" step="0.01" value={valorUnitarioItem} onChange={e => setValorUnitarioItem(e.target.value)} className={`w-full text-sm ${modalInputClasses}`} /></div><Button onClick={handleAdicionarItemNota} variant="secondary" size="sm" fullWidth disabled={!produtoSelecionadoItem}>Adicionar Item</Button></div>{tipoDocSelecionadoForm === TipoDocumentoFiscal.NFSe && (<div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2"><div><label className="text-xs text-gray-600 dark:text-gray-400">Cód. Trib. Nacional</label><input type="text" placeholder="Ex: 01.01.01" value={codigoTributacaoNacionalItem} onChange={e => setCodigoTributacaoNacionalItem(e.target.value)} className={`w-full text-sm ${modalInputClasses}`} /></div><div><label className="text-xs text-gray-600 dark:text-gray-400">Item Lista Serv. (LC116)</label><input type="text" placeholder="Ex: 01.01" value={itemListaServicoLC116Item} onChange={e => setItemListaServicoLC116Item(e.target.value)} className={`w-full text-sm ${modalInputClasses}`} /></div><div><label className="text-xs text-gray-600 dark:text-gray-400">CNAE</label><input type="text" placeholder="Ex: 6201501" value={cnaeItem} onChange={e => setCnaeItem(e.target.value)} className={`w-full text-sm ${modalInputClasses}`} /></div><div><label className="text-xs text-gray-600 dark:text-gray-400">Alíquota ISS (%)</label><input type="number" step="0.01" placeholder="Ex: 5.00" value={issAliquotaItem} onChange={e => setIssAliquotaItem(e.target.value)} className={`w-full text-sm ${modalInputClasses}`} /></div></div>)}{itensNotaForm.length > 0 && (<ul className="mt-3 space-y-1 text-xs max-h-24 overflow-y-auto">{itensNotaForm.map(item => (<li key={item.id} className="flex justify-between items-center p-1 bg-gray-50 dark:bg-gray-700 rounded"><div><span className="dark:text-gray-200">{item.descricao} (Qtd: {item.quantidade}, VU: {formatCurrency(item.valorUnitario)}) = {formatCurrency(item.valorTotal)}</span>{item.codigoTributacaoNacional && <span className="block text-gray-500 dark:text-gray-400 text-xxs">Cód.Nac: {item.codigoTributacaoNacional}</span>}{item.itemListaServicoLC116 && <span className="block text-gray-500 dark:text-gray-400 text-xxs">LC116: {item.itemListaServicoLC116}</span>}</div><Button onClick={() => handleRemoverItemNota(item.id)} variant="danger" size="sm" className="p-0.5"><IconeLixeira className="w-3 h-3"/></Button></li>))}</ul>)}</fieldset>
                        <fieldset className="border p-3 rounded-md dark:border-gray-600"><legend className="text-md font-medium text-nixcon-dark dark:text-nixcon-light px-1">Pagamentos</legend>{/* ... campos de pagamento ... */}<div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end mt-1"><div className="md:col-span-2"><label className="text-xs text-gray-600 dark:text-gray-400">Forma de Pagamento</label><select value={pagamentoAtualForm.forma} onChange={e => setPagamentoAtualForm(p => ({...p, forma: e.target.value as FormaPagamento}))} className={modalSelectClasses}>{FormasPagamentoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div><div className="md:col-span-2"><label className="text-xs text-gray-600 dark:text-gray-400">Valor do Pagamento</label><input type="number" step="0.01" value={pagamentoAtualForm.valor || ''} onChange={e => setPagamentoAtualForm(p => ({...p, valor: parseFloat(e.target.value) || 0}))} className={`w-full text-sm ${modalInputClasses}`} /></div>{pagamentoAtualForm.forma === 'CARTAO_CREDITO' && (<div className="md:col-span-1"><label className="text-xs text-gray-600 dark:text-gray-400">Parcelas</label><input type="number" min="1" value={pagamentoAtualForm.parcelas || 1} onChange={e => setPagamentoAtualForm(p => ({...p, parcelas: parseInt(e.target.value) || 1}))} className={`w-full text-sm ${modalInputClasses}`} /></div>)}<div className={pagamentoAtualForm.forma === 'CARTAO_CREDITO' ? "md:col-span-1" : "md:col-span-2"}><Button onClick={handleAdicionarPagamento} variant="secondary" size="sm" fullWidth disabled={(pagamentoAtualForm.valor || 0) <= 0}>Adicionar Pagamento</Button></div></div>{pagamentosForm.length > 0 && (<ul className="mt-3 space-y-1 text-xs max-h-20 overflow-y-auto">{pagamentosForm.map(pag => (<li key={pag.id} className="flex justify-between items-center p-1 bg-gray-50 dark:bg-gray-700 rounded"><span className="dark:text-gray-200">{FormasPagamentoOptions.find(o=>o.value === pag.forma)?.label || pag.forma}: {formatCurrency(pag.valor)} {pag.parcelas ? `(${pag.parcelas}x)` : ''}</span><Button onClick={() => handleRemoverPagamento(pag.id)} variant="danger" size="sm" className="p-0.5"><IconeLixeira className="w-3 h-3"/></Button></li>))}</ul>)}</fieldset>
                        {tipoDocSelecionadoForm === TipoDocumentoFiscal.NFe && (<fieldset className="border p-3 rounded-md dark:border-gray-600"><legend className="text-md font-medium text-nixcon-dark dark:text-nixcon-light px-1">Transportadora</legend>{/* ... campos de transportadora ... */}<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1"><div><label className="text-xs text-gray-600 dark:text-gray-400">Modalidade do Frete</label><select value={transportadoraForm.modalidadeFrete} onChange={e => setTransportadoraForm(p => ({...p, modalidadeFrete: e.target.value as ModalidadeFrete}))} className={modalSelectClasses}>{ModalidadesFreteOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div></div>{transportadoraForm.modalidadeFrete !== 'SEM_FRETE' && ( <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2"><input type="text" placeholder="Nome/Razão Social Transportadora" value={transportadoraForm.nomeRazaoSocial || ''} onChange={e => setTransportadoraForm(p => ({...p, nomeRazaoSocial: e.target.value}))} className={modalInputClasses} /><input type="text" placeholder="CNPJ/CPF Transportadora" value={transportadoraForm.cpfCnpj || ''} onChange={e => setTransportadoraForm(p => ({...p, cpfCnpj: e.target.value}))} className={modalInputClasses} /><input type="text" placeholder="Placa Veículo" value={transportadoraForm.placaVeiculo || ''} onChange={e => setTransportadoraForm(p => ({...p, placaVeiculo: e.target.value}))} className={modalInputClasses} /><input type="text" placeholder="UF Veículo" value={transportadoraForm.ufVeiculo || ''} onChange={e => setTransportadoraForm(p => ({...p, ufVeiculo: e.target.value}))} maxLength={2} className={modalInputClasses} /><input type="number" placeholder="Qtd. Volumes" value={transportadoraForm.quantidadeVolumes || ''} onChange={e => setTransportadoraForm(p => ({...p, quantidadeVolumes: parseInt(e.target.value) || undefined}))} className={modalInputClasses} /><input type="text" placeholder="Espécie Volumes" value={transportadoraForm.especieVolumes || ''} onChange={e => setTransportadoraForm(p => ({...p, especieVolumes: e.target.value}))} className={modalInputClasses} /><input type="number" step="0.001" placeholder="Peso Bruto (Kg)" value={transportadoraForm.pesoBruto || ''} onChange={e => setTransportadoraForm(p => ({...p, pesoBruto: parseFloat(e.target.value) || undefined}))} className={modalInputClasses} /><input type="number" step="0.001" placeholder="Peso Líquido (Kg)" value={transportadoraForm.pesoLiquido || ''} onChange={e => setTransportadoraForm(p => ({...p, pesoLiquido: parseFloat(e.target.value) || undefined}))} className={modalInputClasses} /></div>)}</fieldset>)}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Natureza da Operação</label><input type="text" value={naturezaOperacaoForm} onChange={e => setNaturezaOperacaoForm(e.target.value)} className={`${inputClasses} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`} /></div><div className="text-right mt-4"><p className="text-lg font-semibold text-nixcon-dark dark:text-nixcon-light">Total: {formatCurrency(calcularTotaisNota().valorTotalNota)}</p></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Informações Adicionais</label><textarea value={infoAdicionaisForm} onChange={e => setInfoAdicionaisForm(e.target.value)} rows={2} className={`${inputClasses} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`}></textarea></div>
                    </>
                )}
            </div>
            <div className="mt-6 text-right space-x-2">
                <Button variant="secondary" onClick={() => setModalNovaNotaAberto(false)}>Cancelar</Button>
                <Button onClick={handleEmitirNotaSimulado}>
                    {tipoDocSelecionadoForm === TipoDocumentoFiscal.RECIBO ? 'Emitir Recibo' : 'Emitir Nota'} (Simulado)
                </Button>
            </div>
        </Modal>
      )}

      {modalPreviewNotaVisivel && notaParaPreview && (
        <Modal 
            isOpen={modalPreviewNotaVisivel} 
            onClose={() => { setModalPreviewNotaVisivel(false); setNotaParaPreview(null); }} 
            title={notaParaPreview.tipoDocumento === TipoDocumentoFiscal.RECIBO ? `Recibo Emitido (ID: ${notaParaPreview.id.slice(-6)})` : `Preview da Nota Fiscal (${notaParaPreview.tipoDocumento} Nº ${notaParaPreview.numero || 'S/N'})`}
        >
            <div className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 max-w-2xl mx-auto text-xs print-preview">
                <div className="text-center border-b pb-1 mb-1 dark:border-gray-700">
                    <h3 className="font-bold text-sm text-nixcon-dark dark:text-nixcon-light">{notaParaPreview.emitente?.razaoSocial || 'EMITENTE NÃO CONFIGURADO'}</h3>
                    {notaParaPreview.emitente && (
                        <>
                        <p className="dark:text-gray-300">{notaParaPreview.emitente.cnpj || 'CNPJ Emitente'} - IE: {notaParaPreview.emitente.inscricaoEstadual || 'N/A'} - IM: {notaParaPreview.emitente.inscricaoMunicipal || 'N/A'}</p>
                        <p className="dark:text-gray-300">{`${notaParaPreview.emitente.endereco?.logradouro || ''}, ${notaParaPreview.emitente.endereco?.numero || ''} - ${notaParaPreview.emitente.endereco?.bairro || ''}`}</p>
                        <p className="dark:text-gray-300">{`${notaParaPreview.emitente.endereco?.cidade || ''} - ${notaParaPreview.emitente.endereco?.uf || ''} - CEP: ${notaParaPreview.emitente.endereco?.cep || ''}`}</p>
                        <p className="dark:text-gray-300">Fone: {notaParaPreview.emitente.telefone || 'N/A'}</p>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-1 border-b pb-1 mb-1 dark:border-gray-700">
                    <div className="col-span-2">
                        <p className="font-bold text-nixcon-dark dark:text-nixcon-light">
                           {notaParaPreview.tipoDocumento === TipoDocumentoFiscal.RECIBO ? 'RECIBO' : notaParaPreview.tipoDocumento === TipoDocumentoFiscal.NFSe ? 'NOTA FISCAL DE SERVIÇOS ELETRÔNICA - NFS-e' : 'DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA'}
                        </p>
                    </div>
                    <div className="text-right dark:text-gray-300">
                        <p><span className="font-semibold">Nº:</span> {notaParaPreview.numero || (notaParaPreview.tipoDocumento === TipoDocumentoFiscal.RECIBO ? notaParaPreview.id.slice(-6) : 'S/N')}</p>
                        {notaParaPreview.serie && <p><span className="font-semibold">Série:</span> {notaParaPreview.serie}</p>}
                    </div>
                </div>

                 {notaParaPreview.tipoDocumento !== TipoDocumentoFiscal.NFSe && notaParaPreview.tipoDocumento !== TipoDocumentoFiscal.RECIBO && notaParaPreview.chaveAcesso && (
                    <div className="border-y py-1 my-1 text-center dark:border-gray-700">
                        <p className="font-mono text-[0.6rem] break-all dark:text-gray-300">{notaParaPreview.chaveAcesso}</p>
                        <p className="text-[0.6rem] dark:text-gray-400">Consulte pela Chave de Acesso em <a href="http://www.nfe.fazenda.gov.br/portal" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">portal nacional da NF-e</a></p>
                    </div>
                 )}
                 {notaParaPreview.tipoDocumento === TipoDocumentoFiscal.NFSe && notaParaPreview.protocoloAutorizacao && (
                    <div className="border-y py-1 my-1 text-center dark:border-gray-700">
                        <p className="dark:text-gray-300"><span className="font-semibold">Protocolo/Cód. Verificação:</span> {notaParaPreview.protocoloAutorizacao}</p>
                    </div>
                 )}

                <div className="grid grid-cols-2 gap-1 border-b pb-1 mb-1 dark:border-gray-700 dark:text-gray-300">
                    {notaParaPreview.tipoDocumento !== TipoDocumentoFiscal.RECIBO && <div><span className="font-semibold">Natureza da Operação:</span> {notaParaPreview.naturezaOperacao}</div>}
                    <div><span className="font-semibold">Data Emissão:</span> {formatDateTime(notaParaPreview.dataEmissao)}</div>
                </div>

                <div className="border p-1 mb-1 rounded dark:border-gray-600">
                    <h4 className="font-bold text-center text-[0.7rem] bg-gray-200 dark:bg-gray-700 -mx-1 -mt-1 mb-0.5 text-nixcon-dark dark:text-nixcon-light">{notaParaPreview.tipoDocumento === TipoDocumentoFiscal.RECIBO ? 'RECEBEDOR' : 'DESTINATÁRIO / REMETENTE'}</h4>
                    {notaParaPreview.destinatario && (
                        <div className="dark:text-gray-300">
                            <p><span className="font-semibold">Nome/Razão Social:</span> {notaParaPreview.destinatario.nomeRazaoSocial}</p>
                            <p><span className="font-semibold">CNPJ/CPF:</span> {notaParaPreview.destinatario.cpfCnpj} {notaParaPreview.tipoDocumento !== TipoDocumentoFiscal.RECIBO && <><span className="ml-2 font-semibold">IE:</span> {notaParaPreview.destinatario.inscricaoEstadual || 'N/A'}</>}</p>
                            {notaParaPreview.destinatario.endereco?.logradouro && (
                                <>
                                <p><span className="font-semibold">Endereço:</span> {`${notaParaPreview.destinatario.endereco.logradouro}, ${notaParaPreview.destinatario.endereco.numero} - ${notaParaPreview.destinatario.endereco.bairro}`}</p>
                                <p><span className="font-semibold">Município:</span> {notaParaPreview.destinatario.endereco.cidade} <span className="ml-2 font-semibold">UF:</span> {notaParaPreview.destinatario.endereco.uf} <span className="ml-2 font-semibold">CEP:</span> {notaParaPreview.destinatario.endereco.cep}</p>
                                </>
                            )}
                            {notaParaPreview.destinatario.telefone && <p><span className="font-semibold">Telefone:</span> {notaParaPreview.destinatario.telefone}</p>}
                        </div>
                    )}
                </div>
                
                {notaParaPreview.tipoDocumento === TipoDocumentoFiscal.RECIBO ? (
                    <div className="border p-1 mb-1 rounded dark:border-gray-600">
                        <h4 className="font-bold text-center text-[0.7rem] bg-gray-200 dark:bg-gray-700 -mx-1 -mt-1 mb-0.5 text-nixcon-dark dark:text-nixcon-light">DESCRIÇÃO</h4>
                        <p className="text-xs dark:text-gray-300 whitespace-pre-wrap p-1">{notaParaPreview.informacoesAdicionais}</p>
                    </div>
                ) : (
                    <div className="border p-1 mb-1 rounded dark:border-gray-600">
                        <h4 className="font-bold text-center text-[0.7rem] bg-gray-200 dark:bg-gray-700 -mx-1 -mt-1 mb-0.5 text-nixcon-dark dark:text-nixcon-light">{notaParaPreview.tipoDocumento === TipoDocumentoFiscal.NFSe ? 'SERVIÇOS PRESTADOS' : 'DADOS DOS PRODUTOS / SERVIÇOS'}</h4>
                        <table className="w-full text-[0.65rem] leading-tight dark:text-gray-300">
                            <thead className="border-b dark:border-gray-700"><tr><th className="text-left p-0.5">Cód.</th><th className="text-left p-0.5">Descrição</th>{notaParaPreview.tipoDocumento !== TipoDocumentoFiscal.NFSe && <th className="text-left p-0.5">NCM</th>}{notaParaPreview.tipoDocumento === TipoDocumentoFiscal.NFSe && <th className="text-left p-0.5">Cód.Serv/CNAE</th>}<th className="text-right p-0.5">Qtd.</th><th className="text-right p-0.5">Un.</th><th className="text-right p-0.5">Vl. Unit.</th><th className="text-right p-0.5">Vl. Total</th></tr></thead>
                            <tbody>{notaParaPreview.itens.map(item => (<tr key={item.id} className="border-b dark:border-gray-700"><td className="p-0.5">{item.produtoId?.slice(-6) || 'N/A'}</td><td className="p-0.5">{item.descricao}</td>{notaParaPreview.tipoDocumento !== TipoDocumentoFiscal.NFSe && <td className="p-0.5">{item.ncm || '-'}</td>}{notaParaPreview.tipoDocumento === TipoDocumentoFiscal.NFSe && <td className="p-0.5">{item.itemListaServicoLC116 || item.cnae || '-'}</td>}<td className="p-0.5 text-right">{item.quantidade}</td><td className="p-0.5 text-right">{produtosDisponiveisMock.find(p=>p.id === item.produtoId)?.unidade || 'UN'}</td><td className="p-0.5 text-right">{formatCurrency(item.valorUnitario)}</td><td className="p-0.5 text-right">{formatCurrency(item.valorTotal)}</td></tr>))}</tbody>
                        </table>
                    </div>
                )}
                
                {notaParaPreview.tipoDocumento !== TipoDocumentoFiscal.RECIBO && notaParaPreview.pagamentos && notaParaPreview.pagamentos.length > 0 && (
                    <div className="border p-1 mb-1 rounded dark:border-gray-600">
                         <h4 className="font-bold text-center text-[0.7rem] bg-gray-200 dark:bg-gray-700 -mx-1 -mt-1 mb-0.5 text-nixcon-dark dark:text-nixcon-light">PAGAMENTOS</h4>
                         {notaParaPreview.pagamentos.map(pag => (<div key={pag.id} className="grid grid-cols-3 gap-1 text-[0.65rem] mb-0.5 dark:text-gray-300"><span>Forma: {FormasPagamentoOptions.find(o=>o.value === pag.forma)?.label || pag.forma}</span><span className="text-right">Valor: {formatCurrency(pag.valor)}</span>{pag.parcelas && <span className="text-right">Parcelas: {pag.parcelas}x</span>}</div>))}
                    </div>
                )}
                
                {notaParaPreview.tipoDocumento === TipoDocumentoFiscal.NFe && notaParaPreview.transportadora && notaParaPreview.transportadora.modalidadeFrete !== 'SEM_FRETE' && (
                     <div className="border p-1 mb-1 rounded dark:border-gray-600 dark:text-gray-300"><h4 className="font-bold text-center text-[0.7rem] bg-gray-200 dark:bg-gray-700 -mx-1 -mt-1 mb-0.5 text-nixcon-dark dark:text-nixcon-light">TRANSPORTADOR / VOLUMES TRANSPORTADOS</h4><p><span className="font-semibold">Modalidade Frete:</span> {ModalidadesFreteOptions.find(o=>o.value === notaParaPreview.transportadora!.modalidadeFrete)?.label || notaParaPreview.transportadora!.modalidadeFrete}</p><p><span className="font-semibold">Transportador:</span> {notaParaPreview.transportadora.nomeRazaoSocial || 'N/A'} <span className="ml-2 font-semibold">CNPJ/CPF:</span> {notaParaPreview.transportadora.cpfCnpj || 'N/A'}</p><p><span className="font-semibold">Placa:</span> {notaParaPreview.transportadora.placaVeiculo || 'N/A'} <span className="ml-2 font-semibold">UF:</span> {notaParaPreview.transportadora.ufVeiculo || 'N/A'}</p>{notaParaPreview.transportadora.quantidadeVolumes && <p><span className="font-semibold">Qtd. Volumes:</span> {notaParaPreview.transportadora.quantidadeVolumes} <span className="ml-2 font-semibold">Espécie:</span> {notaParaPreview.transportadora.especieVolumes || 'N/A'}</p>}{notaParaPreview.transportadora.pesoBruto && <p><span className="font-semibold">Peso Bruto:</span> {notaParaPreview.transportadora.pesoBruto} Kg <span className="ml-2 font-semibold">Peso Líquido:</span> {notaParaPreview.transportadora.pesoLiquido || 'N/A'} Kg</p>}</div>
                )}

                 <div className="grid grid-cols-4 gap-1 text-right mt-1 border-t pt-1 dark:border-gray-700 dark:text-gray-300">
                    {notaParaPreview.tipoDocumento !== TipoDocumentoFiscal.RECIBO && <><div></div><div></div><div className="font-semibold">Valor Total dos {notaParaPreview.tipoDocumento === TipoDocumentoFiscal.NFSe ? 'Serviços' : 'Produtos'}:</div><div>{formatCurrency(notaParaPreview.valorTotalProdutos || notaParaPreview.valorTotalServicos)}</div></>}
                    <div className="font-bold col-start-3 text-nixcon-dark dark:text-nixcon-light">VALOR TOTAL {notaParaPreview.tipoDocumento === TipoDocumentoFiscal.RECIBO ? 'DO RECIBO' : 'DA NOTA'}:</div>
                    <div className="font-bold text-nixcon-dark dark:text-nixcon-light">{formatCurrency(notaParaPreview.valorTotalNota)}</div>
                </div>

                {notaParaPreview.tipoDocumento !== TipoDocumentoFiscal.RECIBO && notaParaPreview.informacoesAdicionais && (
                    <div className="border-t mt-1 pt-1 dark:border-gray-700"><h4 className="font-bold text-[0.7rem] text-nixcon-dark dark:text-nixcon-light">Informações Adicionais:</h4><p className="text-[0.65rem] dark:text-gray-300">{notaParaPreview.informacoesAdicionais}</p></div>
                )}
                {notaParaPreview.tipoDocumento === TipoDocumentoFiscal.RECIBO && notaParaPreview.localEmissao && (
                     <div className="border-t mt-1 pt-1 dark:border-gray-700 text-center"><p className="text-[0.65rem] dark:text-gray-300">{notaParaPreview.localEmissao}, {formatDateTime(notaParaPreview.dataEmissao).split(' ')[0]}.</p></div>
                )}
                <div className="mt-4 text-center dark:text-gray-300"><p className="text-[0.65rem]">_________________________________________</p><p className="text-[0.65rem]">{notaParaPreview.emitente?.razaoSocial || 'Assinatura Emitente'}</p></div>
                 <p className="text-center text-[0.6rem] mt-2 text-gray-500 dark:text-gray-400">Este é um preview simulado. O layout oficial pode variar.</p>
            </div>
            <div className="mt-4 text-right">
                <Button variant="secondary" onClick={() => { setModalPreviewNotaVisivel(false); setNotaParaPreview(null); }}>Fechar Preview</Button>
            </div>
        </Modal>
      )}
      {modalXmlVisivel && xmlParaVisualizar && (
        <Modal isOpen={modalXmlVisivel} onClose={() => {setModalXmlVisivel(false); setXmlParaVisualizar(null);}} title="Visualizar XML da Nota">
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md max-h-[60vh] overflow-auto">
            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
              {xmlParaVisualizar}
            </pre>
          </div>
          <div className="mt-4 text-right">
            <Button variant="secondary" onClick={() => {setModalXmlVisivel(false); setXmlParaVisualizar(null);}}>Fechar</Button>
          </div>
        </Modal>
      )}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Atenção: A emissão é simulada. A integração real com APIs será implementada.
      </p>
    </div>
  );
};
export default EmissaoFiscalPage;
const style = document.createElement('style');
style.innerHTML = `.text-xxs { font-size: 0.65rem; line-height: 0.85rem; } .print-preview { font-family: 'Arial', sans-serif; }`;
document.head.appendChild(style);
