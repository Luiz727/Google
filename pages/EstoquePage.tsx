
import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeEstoque, IconeUpload as IconeUploadFallback, IconeCaixa, IconeLink } from '../components/common/Icons'; 
import { Produto, TipoProduto, OrigemTenantProduto, ComponenteKit, MovimentacaoEstoque } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { FuncaoUsuario } from '../types';

// Fix: Export STORAGE_KEY_PRODUTOS_PREFIX
export const STORAGE_KEY_PRODUTOS_PREFIX = 'nixconPortalProdutos_';
const STORAGE_KEY_MOVIMENTACOES_PREFIX = 'nixconPortalMovimentacoesEstoque_';


const EstoquePage: React.FC = () => {
  const { usuarioAtual, tenantAtual, personificandoInfo, activeClientCompanyContext } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [historicoMovimentacoesGeral, setHistoricoMovimentacoesGeral] = useState<MovimentacaoEstoque[]>([]);

  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [arquivoImportacao, setArquivoImportacao] = useState<File | null>(null);
  
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Partial<Produto> | null>(null);
  const [abaModalProduto, setAbaModalProduto] = useState<'dados' | 'componentes' | 'historico'>('dados');
  
  const [componenteKitSelecionadoId, setComponenteKitSelecionadoId] = useState<string>('');
  const [quantidadeComponenteKit, setQuantidadeComponenteKit] = useState<number>(1);

  // Estados para modal de movimentação
  const [modalMovimentacaoAberto, setModalMovimentacaoAberto] = useState(false);
  const [produtoParaMovimentacao, setProdutoParaMovimentacao] = useState<Produto | null>(null);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'ENTRADA' | 'SAIDA' | null>(null);
  const [formMovimentacao, setFormMovimentacao] = useState({ quantidade: 1, motivo: '', data: new Date().toISOString().split('T')[0] });


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


  // Carregar e Salvar Produtos
  useEffect(() => {
    if (effectiveTenantId) {
      const storageKeyProdutos = `${STORAGE_KEY_PRODUTOS_PREFIX}${effectiveTenantId}`;
      const produtosSalvos = localStorage.getItem(storageKeyProdutos);
      if (produtosSalvos) {
        setProdutos(JSON.parse(produtosSalvos));
      } else {
        // Inicializa com mock se não houver nada salvo para este tenant
        const agora = new Date().toISOString();
        const produtosBaseMock: Produto[] = [ /* ... mocks como antes ... */ ];
        const kitExemplo: Produto = { /* ... mock kit ... */ id: 'kit001', codigoInterno: 'KIT-ESC-BASIC', descricao: 'Kit Escritório Básico', tipoProduto: 'KIT', unidade: 'KIT', precoCusto: 0, precoVendaVarejo: 0, movimentaEstoque: false, ativo: true, categoria: 'Kits', origemTenant: 'UNIVERSAL_ESCRITORIO', escritorioTenantId: tenantAtual?.id || 'esc-master', componentesKit: [{ produtoId: 'prod002', quantidade: 1, descricaoComponente: 'Papel A4', precoCustoComponente: 15, precoVendaComponente: 25}, { produtoId: 'prod003', quantidade: 5, descricaoComponente: 'Caneta Azul', precoCustoComponente: 0.8, precoVendaComponente: 2 }], dataCriacao: agora, dataAtualizacao: agora, estoqueMinimo: 5 };
        setProdutos(produtosBaseMock);
      }
    } else {
      setProdutos([]);
    }
  }, [effectiveTenantId, tenantAtual]);

  useEffect(() => {
    if (effectiveTenantId && produtos.length >= 0) {
      const storageKeyProdutos = `${STORAGE_KEY_PRODUTOS_PREFIX}${effectiveTenantId}`;
      localStorage.setItem(storageKeyProdutos, JSON.stringify(produtos));
    }
  }, [produtos, effectiveTenantId]);

  // Carregar e Salvar Histórico de Movimentações
  useEffect(() => {
    if (effectiveTenantId) {
        const storageKeyMov = `${STORAGE_KEY_MOVIMENTACOES_PREFIX}${effectiveTenantId}`;
        const movSalvas = localStorage.getItem(storageKeyMov);
        setHistoricoMovimentacoesGeral(movSalvas ? JSON.parse(movSalvas) : []);
    } else {
        setHistoricoMovimentacoesGeral([]);
    }
  }, [effectiveTenantId]);

  useEffect(() => {
    if (effectiveTenantId && historicoMovimentacoesGeral.length >= 0) {
        const storageKeyMov = `${STORAGE_KEY_MOVIMENTACOES_PREFIX}${effectiveTenantId}`;
        localStorage.setItem(storageKeyMov, JSON.stringify(historicoMovimentacoesGeral));
    }
  }, [historicoMovimentacoesGeral, effectiveTenantId]);


  const calcularPrecosKit = (componentes: ComponenteKit[]): { precoCustoKit: number; precoVendaKit: number } => {
    let precoCustoKit = 0;
    let precoVendaKit = 0;
    componentes.forEach(comp => {
      const produtoBase = produtos.find(p => p.id === comp.produtoId);
      if (produtoBase) {
        precoCustoKit += produtoBase.precoCusto * comp.quantidade;
        precoVendaKit += produtoBase.precoVendaVarejo * comp.quantidade;
      }
    });
    return { precoCustoKit, precoVendaKit };
  };

  useEffect(() => {
    if (produtoEditando?.tipoProduto === 'KIT' && produtoEditando.componentesKit) {
      const { precoCustoKit, precoVendaKit } = calcularPrecosKit(produtoEditando.componentesKit);
      setProdutoEditando(prev => ({
        ...prev,
        precoCusto: precoCustoKit,
        precoVendaVarejo: precoVendaKit,
      }));
    }
  }, [produtoEditando?.componentesKit, produtos]);


  const handleAbrirModalProduto = (produto?: Produto) => {
    const ehAdminEscritorio = usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN;
    setAbaModalProduto('dados'); // Reset para aba principal
    const baseProduto: Partial<Produto> = { 
      ativo: true, 
      movimentaEstoque: true, 
      tipoProduto: 'PRODUTO', 
      unidade: 'UN',
      componentesKit: [],
      origemTenant: ehAdminEscritorio ? 'UNIVERSAL_ESCRITORIO' : 'ESPECIFICO_CLIENTE',
      escritorioTenantId: ehAdminEscritorio ? tenantAtual?.id : undefined,
      clienteTenantId: !ehAdminEscritorio ? effectiveTenantId : undefined,
    };

    if (produto) {
        setProdutoEditando({ ...produto, componentesKit: produto.componentesKit ? [...produto.componentesKit] : [] });
    } else {
        setProdutoEditando(baseProduto);
    }
    setModalProdutoAberto(true);
  };

  const handleSalvarProduto = () => {
    if (!produtoEditando || !produtoEditando.descricao) {
      alert("A descrição do produto é obrigatória.");
      return;
    }
    
    const agora = new Date().toISOString();
    let produtoFinalizado = { ...produtoEditando };

    if (produtoFinalizado.tipoProduto === 'KIT') {
        produtoFinalizado.movimentaEstoque = false; 
        const { precoCustoKit, precoVendaKit } = calcularPrecosKit(produtoFinalizado.componentesKit || []);
        produtoFinalizado.precoCusto = precoCustoKit;
        produtoFinalizado.precoVendaVarejo = precoVendaKit;
    }

    if (produtoFinalizado.id) { 
      setProdutos(produtos.map(p => p.id === produtoFinalizado!.id ? {...p, ...produtoFinalizado as Produto, dataAtualizacao: agora } : p));
    } else { 
      const novoProduto: Produto = {
        id: `prod-${Date.now()}`, 
        codigoInterno: produtoFinalizado.codigoInterno || `CI-${Date.now().toString().slice(-4)}`,
        ...produtoFinalizado,
        dataCriacao: agora,
        dataAtualizacao: agora,
      } as Produto; 
      setProdutos(prevProdutos => [...prevProdutos, novoProduto]);
    }
    setModalProdutoAberto(false);
    setProdutoEditando(null);
    setComponenteKitSelecionadoId('');
    setQuantidadeComponenteKit(1);
  };

  const handleChangeProdutoEditando = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setProdutoEditando(prev => {
        if (!prev) return null;
        let updatedValue: any = value;
        if (type === 'checkbox') {
          updatedValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number' || name === 'precoCusto' || name === 'precoVendaVarejo' || name === 'quantidadeEmEstoque' || name === 'estoqueMinimo') {
          updatedValue = parseFloat(value);
           if (isNaN(updatedValue)) updatedValue = undefined; 
        }

        const newState = {...prev, [name]: updatedValue};
        if (name === 'tipoProduto' && updatedValue === 'KIT') {
            newState.movimentaEstoque = false;
            newState.quantidadeEmEstoque = undefined;
            newState.estoqueMinimo = undefined;
            newState.componentesKit = newState.componentesKit || [];
        } else if (name === 'tipoProduto' && updatedValue !== 'KIT') {
             newState.componentesKit = undefined; 
        }
        return newState;
    });
  };

  const handleAdicionarComponenteKit = () => {
    if (!componenteKitSelecionadoId || quantidadeComponenteKit <= 0) {
      alert("Selecione um produto componente e informe uma quantidade válida.");
      return;
    }
    if (produtoEditando?.id === componenteKitSelecionadoId) {
      alert("Um kit não pode conter a si mesmo como componente.");
      return;
    }
    const produtoComponente = produtos.find(p => p.id === componenteKitSelecionadoId);
    if (!produtoComponente) return;

    if (produtoComponente.tipoProduto === 'KIT') {
      alert("Não é possível adicionar um KIT como componente de outro KIT (para simplificação).");
      return;
    }

    setProdutoEditando(prev => {
      if (!prev) return null;
      const novosComponentes = [...(prev.componentesKit || [])];
      const existente = novosComponentes.find(c => c.produtoId === componenteKitSelecionadoId);
      if (existente) {
        existente.quantidade += quantidadeComponenteKit;
      } else {
        novosComponentes.push({
          produtoId: componenteKitSelecionadoId,
          quantidade: quantidadeComponenteKit,
          descricaoComponente: produtoComponente.descricao,
          precoCustoComponente: produtoComponente.precoCusto,
          precoVendaComponente: produtoComponente.precoVendaVarejo,
        });
      }
      return { ...prev, componentesKit: novosComponentes };
    });
    setComponenteKitSelecionadoId('');
    setQuantidadeComponenteKit(1);
  };

  const handleRemoverComponenteKit = (produtoIdParaRemover: string) => {
    setProdutoEditando(prev => {
      if (!prev || !prev.componentesKit) return prev;
      return {
        ...prev,
        componentesKit: prev.componentesKit.filter(c => c.produtoId !== produtoIdParaRemover),
      };
    });
  };

  const handleAbrirModalMovimentacao = (produto: Produto, tipo: 'ENTRADA' | 'SAIDA') => {
    setProdutoParaMovimentacao(produto);
    setTipoMovimentacao(tipo);
    setFormMovimentacao({ quantidade: 1, motivo: '', data: new Date().toISOString().split('T')[0] });
    setModalMovimentacaoAberto(true);
  };

  const handleRegistrarMovimentacao = (e: FormEvent) => {
    e.preventDefault();
    if (!produtoParaMovimentacao || !tipoMovimentacao || formMovimentacao.quantidade <= 0 || !formMovimentacao.motivo) {
        alert("Verifique os dados da movimentação.");
        return;
    }
    if (tipoMovimentacao === 'SAIDA' && (produtoParaMovimentacao.quantidadeEmEstoque || 0) < formMovimentacao.quantidade) {
        alert("Quantidade de saída excede o estoque atual.");
        return;
    }

    const saldoAnterior = produtoParaMovimentacao.quantidadeEmEstoque || 0;
    const novaQuantidadeEmEstoque = tipoMovimentacao === 'ENTRADA' 
      ? saldoAnterior + formMovimentacao.quantidade
      : saldoAnterior - formMovimentacao.quantidade;

    setProdutos(prevProdutos => prevProdutos.map(p => 
        p.id === produtoParaMovimentacao.id 
        ? { ...p, quantidadeEmEstoque: novaQuantidadeEmEstoque, dataAtualizacao: new Date().toISOString() } 
        : p
    ));

    const novaMovimentacao: MovimentacaoEstoque = {
      id: `mov-${Date.now()}`,
      produtoId: produtoParaMovimentacao.id,
      produtoDescricao: produtoParaMovimentacao.descricao,
      tipo: tipoMovimentacao,
      quantidade: formMovimentacao.quantidade,
      motivo: formMovimentacao.motivo,
      data: new Date(formMovimentacao.data + "T00:00:00").toISOString(), // Garante que a data seja ISO
      usuarioResponsavelNome: usuarioAtual?.nome || 'Sistema',
      saldoAnterior,
      saldoApos: novaQuantidadeEmEstoque,
      tenantId: effectiveTenantId!,
    };
    setHistoricoMovimentacoesGeral(prev => [novaMovimentacao, ...prev]);

    alert(`Movimentação de ${tipoMovimentacao.toLowerCase()} registrada com sucesso!`);
    setModalMovimentacaoAberto(false);
  };


  const handleImportarArquivo = () => {
    if (arquivoImportacao) {
      console.log("Simulando importação do arquivo:", arquivoImportacao.name);
      alert(`Simulação: Arquivo "${arquivoImportacao.name}" seria processado.`);
      setModalImportarAberto(false);
      setArquivoImportacao(null);
    } else {
      alert("Nenhum arquivo selecionado.");
    }
  };
  
  const produtosFiltrados = useMemo(() => produtos.filter(p => {
    if (!usuarioAtual || !effectiveTenantId) return false;
    if (usuarioAtual.funcao === FuncaoUsuario.SUPERADMIN || usuarioAtual.funcao === FuncaoUsuario.ADMIN_ESCRITORIO) {
      return p.escritorioTenantId === effectiveTenantId || (p.origemTenant === 'ESPECIFICO_CLIENTE' && p.clienteTenantId && produtos.some(e => e.id === p.clienteTenantId && e.escritorioTenantId === effectiveTenantId));
    }
    return (p.origemTenant === 'UNIVERSAL_ESCRITORIO' && p.tenantsComAcesso?.includes(effectiveTenantId)) ||
           (p.origemTenant === 'ESPECIFICO_CLIENTE' && p.clienteTenantId === effectiveTenantId);
  }), [produtos, usuarioAtual, effectiveTenantId]);


  const calcularEstoqueKit = (kit: Produto): number => {
    if (kit.tipoProduto !== 'KIT' || !kit.componentesKit || kit.componentesKit.length === 0) {
      return kit.quantidadeEmEstoque || 0;
    }
    let maxKitsPossiveis = Infinity;
    for (const compKit of kit.componentesKit) {
      const produtoComponente = produtos.find(p => p.id === compKit.produtoId);
      if (!produtoComponente || !produtoComponente.movimentaEstoque || typeof produtoComponente.quantidadeEmEstoque !== 'number') {
        return 0; 
      }
      const kitsPorEsteComponente = Math.floor(produtoComponente.quantidadeEmEstoque / compKit.quantidade);
      if (kitsPorEsteComponente < maxKitsPossiveis) {
        maxKitsPossiveis = kitsPorEsteComponente;
      }
    }
    return maxKitsPossiveis === Infinity ? 0 : maxKitsPossiveis;
  };

  const formatarData = (isoString?: string) => {
    if (!isoString) return '-';
    const data = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(data);
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center">
          <IconeEstoque className="w-8 h-8 mr-3 text-nixcon-gold" />
          Controle de Estoque e Produtos/Serviços
        </h1>
        <div className="flex space-x-2">
          <Button onClick={() => setModalImportarAberto(true)} variant="secondary">
            <IconeUploadFallback className="w-4 h-4 mr-2"/> Importar Planilha
          </Button>
          <Button onClick={() => handleAbrirModalProduto()}>Adicionar Novo</Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light">Lista de Produtos e Serviços</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cód. Int.</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qtd. Estoque</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">R$ Custo</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">R$ Venda</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Movimentar</th>
                <th scope="col" className="relative px-3 py-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {produtosFiltrados.map((produto) => {
                const estoqueAtual = produto.tipoProduto === 'KIT' ? calcularEstoqueKit(produto) : produto.quantidadeEmEstoque;
                const emEstoqueBaixo = 
                    (produto.tipoProduto !== 'KIT' && produto.movimentaEstoque && typeof produto.estoqueMinimo === 'number' && typeof estoqueAtual === 'number' && estoqueAtual < produto.estoqueMinimo) ||
                    (produto.tipoProduto === 'KIT' && typeof produto.estoqueMinimo === 'number' && typeof estoqueAtual === 'number' && estoqueAtual < produto.estoqueMinimo);
                
                const rowClass = emEstoqueBaixo ? 'bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-800/40' : 'hover:bg-gray-50 dark:hover:bg-gray-700';

                return (
                <tr key={produto.id} className={`${rowClass} transition-colors`}>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{produto.codigoInterno || produto.id.slice(-6)}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-nixcon-dark dark:text-nixcon-light max-w-xs truncate" title={produto.descricao}>
                    {produto.tipoProduto === 'KIT' && <IconeCaixa className="w-4 h-4 mr-1 inline text-nixcon-gold" title="Este é um Kit"/>}
                    {produto.descricao}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{produto.tipoProduto}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                    {produto.movimentaEstoque || produto.tipoProduto === 'KIT' ? estoqueAtual : 'N/A'}
                    {emEstoqueBaixo && (
                        <span className="ml-1 px-1.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100" title={`Estoque mínimo: ${produto.estoqueMinimo}`}>Baixo</span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{produto.precoCusto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{produto.precoVendaVarejo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${produto.ativo ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'}`}>
                      {produto.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm space-x-1">
                    {produto.movimentaEstoque && produto.tipoProduto !== 'KIT' && (
                        <>
                            <Button variant="primary" size="sm" className="p-1 text-xs bg-green-500 hover:bg-green-600" onClick={() => handleAbrirModalMovimentacao(produto, 'ENTRADA')}>Entrada</Button>
                            <Button variant="danger" size="sm" className="p-1 text-xs" onClick={() => handleAbrirModalMovimentacao(produto, 'SAIDA')}>Saída</Button>
                        </>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <Button onClick={() => handleAbrirModalProduto(produto)} variant="ghost" size="sm">Editar</Button>
                  </td>
                </tr>
              )})}
              {produtosFiltrados.length === 0 && (
                <tr><td colSpan={9} className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhum produto ou serviço encontrado para este contexto.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Importação */}
      <Modal isOpen={modalImportarAberto} onClose={() => setModalImportarAberto(false)} title="Importar Planilha de Produtos (SEBRAE)">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Selecione um arquivo CSV ou XLSX seguindo o modelo da planilha SEBRAE.
            O sistema tentará mapear as colunas automaticamente.
          </p>
          <input 
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={(e) => setArquivoImportacao(e.target.files ? e.target.files[0] : null)}
            className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-nixcon-gold file:text-white hover:file:bg-yellow-600"
          />
          {arquivoImportacao && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Arquivo selecionado: {arquivoImportacao.name}</p>
              
              <div>
                <h4 className="text-sm font-medium text-nixcon-dark dark:text-nixcon-light mb-1">Pré-visualização (Simulada):</h4>
                <div className="overflow-x-auto text-xs border rounded-md dark:border-gray-600">
                  <table className="min-w-full">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        {["Código", "Descrição", "Preço Custo", "Preço Venda", "Qtd. Atual", "Un."].map(col => (
                          <th key={col} className="p-1.5 text-left font-medium text-gray-600 dark:text-gray-300">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-nixcon-dark-card">
                      {[
                        ["P001", "Caneta Azul Cristal", "0.80", "1.50", "1000", "UN"],
                        ["S005", "Consultoria Financeira (hora)", "50.00", "150.00", "N/A", "HR"],
                        ["P012", "Papel A4 Resma 500fl", "15.00", "25.00", "200", "PCT"],
                      ].map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t dark:border-gray-700">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="p-1.5 whitespace-nowrap text-gray-700 dark:text-gray-300">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-nixcon-dark dark:text-nixcon-light mb-1">Mapeamento de Colunas (Simulado):</h4>
                <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400 list-disc list-inside bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                  <li>Coluna A (Planilha) &rarr; Descrição (Sistema)</li>
                  <li>Coluna B (Planilha) &rarr; Código Interno (Sistema)</li>
                  <li>Coluna C (Planilha) &rarr; Preço de Custo (Sistema)</li>
                  <li>Coluna D (Planilha) &rarr; Preço de Venda (Sistema)</li>
                  <li>Coluna E (Planilha) &rarr; Unidade (Sistema)</li>
                  <li>Coluna F (Planilha) &rarr; Quantidade em Estoque (Sistema)</li>
                </ul>
                <p className="text-xxs text-gray-500 dark:text-gray-500 mt-1">O sistema tentará mapear automaticamente. Ajustes futuros podem ser necessários.</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 text-right">
          <Button variant="secondary" onClick={() => { setModalImportarAberto(false); setArquivoImportacao(null); }} className="mr-2">Cancelar</Button>
          <Button onClick={handleImportarArquivo} disabled={!arquivoImportacao}>Processar Importação</Button>
        </div>
      </Modal>

      {/* Modal de Adicionar/Editar Produto */}
      {produtoEditando && (
        <Modal isOpen={modalProdutoAberto} onClose={() => setModalProdutoAberto(false)} title={produtoEditando.id ? "Editar Produto/Serviço/Kit" : "Adicionar Novo Produto/Serviço/Kit"}>
          <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {['dados', 'componentes', 'historico'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setAbaModalProduto(tab as any)}
                  disabled={(tab === 'componentes' && produtoEditando.tipoProduto !== 'KIT') || (tab === 'historico' && !produtoEditando.movimentaEstoque)}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm 
                    ${abaModalProduto === tab ? 'border-nixcon-gold text-nixcon-gold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}
                    ${((tab === 'componentes' && produtoEditando.tipoProduto !== 'KIT') || (tab === 'historico' && (!produtoEditando.id || !produtoEditando.movimentaEstoque || produtoEditando.tipoProduto === 'KIT'))) ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {tab === 'dados' ? 'Dados Gerais' : tab === 'componentes' ? 'Componentes (Kit)' : 'Histórico Mov.'}
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {abaModalProduto === 'dados' && (
                <>
                    {/* Campos Comuns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="codigoInterno" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Código Interno</label>
                        <input type="text" name="codigoInterno" id="codigoInterno" value={produtoEditando.codigoInterno || ''} onChange={handleChangeProdutoEditando} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição*</label>
                        <input type="text" name="descricao" id="descricao" value={produtoEditando.descricao || ''} onChange={handleChangeProdutoEditando} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="tipoProduto" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo*</label>
                        <select name="tipoProduto" id="tipoProduto" value={produtoEditando.tipoProduto || 'PRODUTO'} onChange={handleChangeProdutoEditando} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm">
                          <option value="PRODUTO">Produto</option>
                          <option value="SERVICO">Serviço</option>
                          <option value="KIT">Kit</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="unidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unidade*</label>
                        <input type="text" name="unidade" id="unidade" value={produtoEditando.unidade || 'UN'} onChange={handleChangeProdutoEditando} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm" placeholder="UN, CX, KG, HORA, KIT" />
                      </div>
                       <div>
                        <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                        <input type="text" name="categoria" id="categoria" value={produtoEditando.categoria || ''} onChange={handleChangeProdutoEditando} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="precoCusto" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preço de Custo*</label>
                        <input type="number" name="precoCusto" id="precoCusto" value={produtoEditando.precoCusto || 0} onChange={handleChangeProdutoEditando} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm" step="0.01" readOnly={produtoEditando.tipoProduto === 'KIT'} />
                        {produtoEditando.tipoProduto === 'KIT' && <p className="text-xs text-gray-500 dark:text-gray-400">Calculado dos componentes.</p>}
                      </div>
                      <div>
                        <label htmlFor="precoVendaVarejo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preço de Venda (Varejo)*</label>
                        <input type="number" name="precoVendaVarejo" id="precoVendaVarejo" value={produtoEditando.precoVendaVarejo || 0} onChange={handleChangeProdutoEditando} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm" step="0.01" readOnly={produtoEditando.tipoProduto === 'KIT'}/>
                        {produtoEditando.tipoProduto === 'KIT' && <p className="text-xs text-gray-500 dark:text-gray-400">Calculado dos componentes.</p>}
                      </div>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="flex items-center">
                          <input type="checkbox" name="movimentaEstoque" id="movimentaEstoque" checked={produtoEditando.movimentaEstoque || false} onChange={handleChangeProdutoEditando} className="h-4 w-4 text-nixcon-gold border-gray-300 dark:border-gray-600 rounded focus:ring-nixcon-gold" disabled={produtoEditando.tipoProduto === 'KIT'} />
                          <label htmlFor="movimentaEstoque" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Movimenta Estoque?</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" name="ativo" id="ativo" checked={produtoEditando.ativo || false} onChange={handleChangeProdutoEditando} className="h-4 w-4 text-nixcon-gold border-gray-300 dark:border-gray-600 rounded focus:ring-nixcon-gold" />
                          <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Produto Ativo?</label>
                        </div>
                    </div>

                    {produtoEditando.movimentaEstoque && produtoEditando.tipoProduto !== 'KIT' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="quantidadeEmEstoque" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Qtd. em Estoque</label>
                          <input type="number" name="quantidadeEmEstoque" id="quantidadeEmEstoque" value={produtoEditando.quantidadeEmEstoque || 0} onChange={handleChangeProdutoEditando} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm" />
                        </div>
                        <div>
                          <label htmlFor="estoqueMinimo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estoque Mínimo</label>
                          <input type="number" name="estoqueMinimo" id="estoqueMinimo" value={produtoEditando.estoqueMinimo || 0} onChange={handleChangeProdutoEditando} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm" />
                        </div>
                      </div>
                    )}
                     <div>
                        <label htmlFor="ncm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">NCM</label>
                        <input type="text" name="ncm" id="ncm" value={produtoEditando.ncm || ''} onChange={handleChangeProdutoEditando} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm" />
                      </div>
                      {(usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN) && (
                      <div className="pt-4 border-t mt-4 dark:border-gray-700">
                         <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            name="origemTenant" 
                            id="origemTenantUniversal" 
                            checked={produtoEditando.origemTenant === 'UNIVERSAL_ESCRITORIO'} 
                            onChange={(e) => {
                              const isUniversal = e.target.checked;
                              setProdutoEditando(prev => {
                                if (!prev) return null;
                                return {
                                ...prev,
                                origemTenant: isUniversal ? 'UNIVERSAL_ESCRITORIO' : 'ESPECIFICO_CLIENTE',
                                escritorioTenantId: isUniversal ? tenantAtual?.id : undefined, // Escritório atual
                                clienteTenantId: !isUniversal ? effectiveTenantId : undefined, // Tenant efetivo se for específico
                                tenantsComAcesso: isUniversal ? prev.tenantsComAcesso || [] : undefined,
                              }});
                            }}
                            className="h-4 w-4 text-nixcon-gold border-gray-300 dark:border-gray-600 rounded focus:ring-nixcon-gold" 
                          />
                          <label htmlFor="origemTenantUniversal" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Produto/Serviço Universal do Escritório?</label>
                        </div>
                        {produtoEditando.origemTenant === 'UNIVERSAL_ESCRITORIO' && (
                          <div className="mt-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Clientes com Acesso (placeholder)</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Funcionalidade de seleção de clientes (multi-select) será implementada aqui.</p>
                          </div>
                        )}
                      </div>
                    )}
                </>
            )}

            {abaModalProduto === 'componentes' && produtoEditando.tipoProduto === 'KIT' && (
              <div className="pt-1">
                <h4 className="text-md font-semibold text-nixcon-dark dark:text-nixcon-light mb-2">Componentes do Kit</h4>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end mb-4">
                  <div className="md:col-span-3">
                    <label htmlFor="componenteKitSelecionadoId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adicionar Produto Componente</label>
                    <select 
                      id="componenteKitSelecionadoId" 
                      value={componenteKitSelecionadoId} 
                      onChange={(e) => setComponenteKitSelecionadoId(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm"
                    >
                      <option value="">Selecione um produto</option>
                      {produtos.filter(p => p.id !== produtoEditando.id && p.tipoProduto !== 'KIT' && p.ativo).map(p => (
                        <option key={p.id} value={p.id}>{p.descricao} (Custo: {p.precoCusto.toFixed(2)}, Venda: {p.precoVendaVarejo.toFixed(2)})</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-1">
                     <label htmlFor="quantidadeComponenteKit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Qtd.</label>
                    <input 
                      type="number" 
                      id="quantidadeComponenteKit" 
                      value={quantidadeComponenteKit} 
                      onChange={(e) => setQuantidadeComponenteKit(Math.max(1, parseInt(e.target.value,10)))} 
                      min="1"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button type="button" onClick={handleAdicionarComponenteKit} fullWidth variant="secondary" size="sm" disabled={!componenteKitSelecionadoId}>
                        <IconeLink className="w-4 h-4 mr-1"/> Adicionar Componente
                    </Button>
                  </div>
                </div>
                {produtoEditando.componentesKit && produtoEditando.componentesKit.length > 0 ? (
                  <ul className="space-y-2">
                    {produtoEditando.componentesKit.map(comp => {
                      const prodComp = produtos.find(p => p.id === comp.produtoId);
                      return (
                        <li key={comp.produtoId} className="flex justify-between items-center p-2 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700 text-sm">
                          <div>
                            <span className="font-medium dark:text-nixcon-light">{prodComp?.descricao || comp.produtoId}</span> x {comp.quantidade}
                          </div>
                          <Button type="button" onClick={() => handleRemoverComponenteKit(comp.produtoId)} variant="danger" size="sm" className="p-1 text-xs">Remover</Button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">Nenhum componente adicionado a este kit.</p>
                 )}
              </div>
            )}
            {abaModalProduto === 'historico' && produtoEditando.id && produtoEditando.movimentaEstoque && produtoEditando.tipoProduto !== 'KIT' && (
                <div className="pt-1">
                     <h4 className="text-md font-semibold text-nixcon-dark dark:text-nixcon-light mb-2">Histórico de Movimentações: {produtoEditando.descricao}</h4>
                     {historicoMovimentacoesGeral.filter(m => m.produtoId === produtoEditando.id).length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-400">Data</th>
                                    <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 dark:text-gray-400">Qtd</th>
                                    <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-400">Motivo</th>
                                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 dark:text-gray-400">Saldo Anterior</th>
                                    <th className="px-2 py-1.5 text-right font-medium text-gray-500 dark:text-gray-400">Saldo Após</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
                                {historicoMovimentacoesGeral
                                    .filter(m => m.produtoId === produtoEditando.id)
                                    .sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                                    .map(mov => (
                                    <tr key={mov.id}>
                                        <td className="px-2 py-1.5 whitespace-nowrap dark:text-gray-300">{formatarData(mov.data)}</td>
                                        <td className="px-2 py-1.5 whitespace-nowrap">
                                            <span className={`px-1.5 py-0.5 rounded-full text-xxs font-semibold ${mov.tipo === 'ENTRADA' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'}`}>
                                                {mov.tipo}
                                            </span>
                                        </td>
                                        <td className="px-2 py-1.5 whitespace-nowrap text-right dark:text-gray-300">{mov.quantidade}</td>
                                        <td className="px-2 py-1.5 whitespace-nowrap dark:text-gray-300 truncate max-w-[150px]" title={mov.motivo}>{mov.motivo}</td>
                                        <td className="px-2 py-1.5 whitespace-nowrap text-right dark:text-gray-300">{mov.saldoAnterior}</td>
                                        <td className="px-2 py-1.5 whitespace-nowrap text-right dark:text-gray-300">{mov.saldoApos}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">Nenhuma movimentação registrada para este produto.</p>
                     )}
                </div>
            )}

          </div>
          <div className="mt-6 pt-4 border-t dark:border-gray-700 text-right">
            <Button type="button" variant="secondary" onClick={() => setModalProdutoAberto(false)} className="mr-2">Cancelar</Button>
            <Button type="button" onClick={handleSalvarProduto}>Salvar</Button>
          </div>
        </Modal>
      )}

      {/* Modal de Movimentação de Estoque */}
      {modalMovimentacaoAberto && produtoParaMovimentacao && tipoMovimentacao && (
        <Modal isOpen={modalMovimentacaoAberto} onClose={() => setModalMovimentacaoAberto(false)} title={`Registrar ${tipoMovimentacao === 'ENTRADA' ? 'Entrada' : 'Saída'} de Estoque: ${produtoParaMovimentacao.descricao}`}>
            <form onSubmit={handleRegistrarMovimentacao} className="space-y-4">
                <div>
                    <label htmlFor="movQuantidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade*</label>
                    <input type="number" id="movQuantidade" value={formMovimentacao.quantidade} onChange={e => setFormMovimentacao({...formMovimentacao, quantidade: parseInt(e.target.value) || 1})} min="1" required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm"/>
                </div>
                <div>
                    <label htmlFor="movMotivo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Motivo*</label>
                    <input type="text" id="movMotivo" value={formMovimentacao.motivo} onChange={e => setFormMovimentacao({...formMovimentacao, motivo: e.target.value})} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm" placeholder="Ex: Compra NF 123, Venda Pedido XYZ, Ajuste"/>
                </div>
                <div>
                    <label htmlFor="movData" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data da Movimentação*</label>
                    <input type="date" id="movData" value={formMovimentacao.data} onChange={e => setFormMovimentacao({...formMovimentacao, data: e.target.value})} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm"/>
                </div>
                <div className="mt-6 text-right space-x-2">
                    <Button type="button" variant="secondary" onClick={() => setModalMovimentacaoAberto(false)}>Cancelar</Button>
                    <Button type="submit">Registrar Movimentação</Button>
                </div>
            </form>
        </Modal>
      )}


      <p className="text-center text-gray-500 dark:text-gray-400">
        Funcionalidades como filtros avançados, busca, paginação, e a lógica completa de importação e gestão de produtos universais/específicos serão implementadas.
      </p>
       <style>{`.text-xxs { font-size: 0.6rem; line-height: 0.8rem; }`}</style>
    </div>
  );
};

export default EstoquePage;