
import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeFiscal, IconeLixeira } from '../components/common/Icons';
import { useAuth } from '../contexts/AuthContext';
import { 
  NotaFiscal, 
  ItemNotaFiscal, 
  DestinatarioNota, 
  FornecedorNota, 
  Endereco, 
  TipoDocumentoFiscal, 
  StatusNotaFiscal,
  Produto as ProdutoGlobal,
  FuncaoUsuario
} from '../types';

const STORAGE_KEY_NOTAS_ENTRADA_PREFIX = 'nixconPortalNotasEntrada_';
const STORAGE_KEY_PRODUTOS_PREFIX = 'nixconPortalProdutos_'; // Para buscar produtos mock

const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm";
const selectClasses = `${inputClasses} bg-white dark:bg-gray-700`;

const formatCurrency = (value: number | undefined) => {
  if (typeof value !== 'number') return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString.includes('T') ? isoString : `${isoString}T00:00:00Z`);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};


const EscritaFiscalPage: React.FC = () => {
  const { usuarioAtual, tenantAtual, personificandoInfo, activeClientCompanyContext } = useAuth();
  const [notasEntrada, setNotasEntrada] = useState<NotaFiscal[]>([]);
  const [modalNotaAberto, setModalNotaAberto] = useState(false);
  const [notaEditando, setNotaEditando] = useState<Partial<NotaFiscal> | null>(null);
  
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoGlobal[]>([]);
  const [itemForm, setItemForm] = useState<Partial<ItemNotaFiscal> & { produtoSelecionadoId?: string }>({});


  const effectiveTenantId = useMemo(() => {
    if (personificandoInfo) return personificandoInfo.empresaId;
    if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && usuarioAtual.tenantId) return usuarioAtual.tenantId;
    if (activeClientCompanyContext && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN)) return activeClientCompanyContext.id;
    return usuarioAtual?.tenantId || tenantAtual?.id;
  }, [personificandoInfo, usuarioAtual, tenantAtual, activeClientCompanyContext]);

  useEffect(() => {
    if (effectiveTenantId) {
      const storageKey = `${STORAGE_KEY_NOTAS_ENTRADA_PREFIX}${effectiveTenantId}`;
      const notasSalvas = localStorage.getItem(storageKey);
      setNotasEntrada(notasSalvas ? JSON.parse(notasSalvas) : []);

      const storageKeyProdutos = `${STORAGE_KEY_PRODUTOS_PREFIX}${effectiveTenantId}`;
      const produtosSalvos = localStorage.getItem(storageKeyProdutos);
      setProdutosDisponiveis(produtosSalvos ? JSON.parse(produtosSalvos) : []);
    } else {
      setNotasEntrada([]);
      setProdutosDisponiveis([]);
    }
  }, [effectiveTenantId]);

  useEffect(() => {
    if (effectiveTenantId) {
      localStorage.setItem(`${STORAGE_KEY_NOTAS_ENTRADA_PREFIX}${effectiveTenantId}`, JSON.stringify(notasEntrada));
    }
  }, [notasEntrada, effectiveTenantId]);

  const resetFormularioItem = () => {
    setItemForm({ produtoSelecionadoId: '', quantidade: 1, valorUnitario: 0, descricao: '' });
  };

  const handleAbrirModalNota = (nota?: NotaFiscal) => {
    if (nota) {
      setNotaEditando({ 
        ...nota, 
        dataEmissao: nota.dataEmissao.split('T')[0],
        dataEntradaSaida: nota.dataEntradaSaida?.split('T')[0],
        itens: [...nota.itens] 
      });
    } else {
      setNotaEditando({
        tipoDocumento: TipoDocumentoFiscal.ENTRADA,
        dataEmissao: new Date().toISOString().split('T')[0],
        dataEntradaSaida: new Date().toISOString().split('T')[0],
        itens: [],
        valorTotalNota: 0,
        fornecedor: { nomeRazaoSocial: '', cpfCnpj: ''},
      });
    }
    resetFormularioItem();
    setModalNotaAberto(true);
  };

  const handleChangeNota = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNotaEditando(prev => {
        if (!prev) return null;
        if (name.startsWith("fornecedor.")) {
            const fornecedorField = name.split(".")[1] as keyof FornecedorNota;
            return { ...prev, fornecedor: { ...(prev.fornecedor || {}), [fornecedorField]: value } as FornecedorNota};
        }
        return { ...prev, [name]: value };
    });
  };
  
  const handleChangeItemForm = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue: any = value;
    if (name === 'quantidade' || name === 'valorUnitario') {
        finalValue = parseFloat(value);
        if (isNaN(finalValue)) finalValue = 0;
    }
    
    const newState = { ...itemForm, [name]: finalValue };

    if (name === 'produtoSelecionadoId' && value) {
        const produto = produtosDisponiveis.find(p => p.id === value);
        if (produto) {
            newState.descricao = produto.descricao;
            newState.valorUnitario = produto.precoCusto; // Usar preço de custo para entrada
            newState.unidade = produto.unidade;
            newState.produtoId = produto.id;
        }
    }
    setItemForm(newState);
  };

  const handleAdicionarItem = () => {
    if (!itemForm.descricao || (itemForm.quantidade || 0) <= 0 || (itemForm.valorUnitario || 0) < 0) {
        alert("Preencha descrição, quantidade e valor unitário válidos para o item.");
        return;
    }
    const novoItem: ItemNotaFiscal = {
        id: `item-${Date.now()}`,
        produtoId: itemForm.produtoSelecionadoId,
        codigoProduto: itemForm.produtoSelecionadoId, // Ou código interno do produto
        descricao: itemForm.descricao!,
        unidade: itemForm.unidade || 'UN',
        quantidade: itemForm.quantidade!,
        valorUnitario: itemForm.valorUnitario!,
        valorTotal: itemForm.quantidade! * itemForm.valorUnitario!,
    };
    setNotaEditando(prev => prev ? ({ ...prev, itens: [...(prev.itens || []), novoItem] }) : null);
    resetFormularioItem();
  };
  
  const handleRemoverItem = (itemId: string) => {
    setNotaEditando(prev => prev ? ({ ...prev, itens: prev.itens?.filter(item => item.id !== itemId) }) : null);
  };

  const calcularValorTotalNota = (itens: ItemNotaFiscal[]): number => {
    return itens.reduce((sum, item) => sum + item.valorTotal, 0);
  };

  const handleSalvarNota = (e: FormEvent) => {
    e.preventDefault();
    if (!notaEditando || !notaEditando.fornecedor?.nomeRazaoSocial || !notaEditando.numero || !effectiveTenantId) {
      alert("Fornecedor, Número da Nota e Data de Emissão/Entrada são obrigatórios.");
      return;
    }

    const valorTotalCalculado = calcularValorTotalNota(notaEditando.itens || []);
    const notaFinal: NotaFiscal = {
        ...notaEditando,
        tipoDocumento: TipoDocumentoFiscal.ENTRADA,
        status: StatusNotaFiscal.LANCADA,
        valorTotalNota: valorTotalCalculado,
        tenantId: effectiveTenantId, // Garante que o tenantId está definido
    } as NotaFiscal;

    if (notaFinal.id) {
      setNotasEntrada(notasEntrada.map(n => n.id === notaFinal.id ? notaFinal : n));
    } else {
      setNotasEntrada(prev => [{ ...notaFinal, id: `ne-${Date.now()}` }, ...prev]);
    }
    setModalNotaAberto(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center">
          <IconeFiscal className="w-8 h-8 mr-3 text-nixcon-gold" />
          Escrita Fiscal - Notas de Entrada
        </h1>
        <Button onClick={() => handleAbrirModalNota()}>Nova Nota de Entrada</Button>
      </div>

      <Card className="shadow-lg dark:bg-nixcon-dark-card">
        <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">Notas de Entrada Lançadas</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fornecedor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data Entrada</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valor Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {notasEntrada.map(nota => (
                <tr key={nota.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-nixcon-dark dark:text-nixcon-light">{nota.fornecedor?.nomeRazaoSocial}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{nota.numero}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(nota.dataEntradaSaida)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(nota.valorTotalNota)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleAbrirModalNota(nota)}>Editar</Button>
                    {/* Implementar exclusão se necessário */}
                  </td>
                </tr>
              ))}
              {notasEntrada.length === 0 && (
                <tr><td colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhuma nota de entrada lançada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modalNotaAberto && notaEditando && (
        <Modal isOpen={modalNotaAberto} onClose={() => setModalNotaAberto(false)} title={notaEditando.id ? 'Editar Nota de Entrada' : 'Nova Nota de Entrada'}>
          <form onSubmit={handleSalvarNota} className="space-y-4 max-h-[75vh] overflow-y-auto p-1">
            {/* Dados Gerais da Nota */}
            <fieldset className="border p-3 rounded-md dark:border-gray-600">
                <legend className="text-md font-medium px-1 text-nixcon-dark dark:text-nixcon-light">Dados Gerais da Nota</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                    <div><label className="text-xs">Fornecedor (Nome/Razão Social)*</label><input type="text" name="fornecedor.nomeRazaoSocial" value={notaEditando.fornecedor?.nomeRazaoSocial || ''} onChange={handleChangeNota} required className={inputClasses} /></div>
                    <div><label className="text-xs">CNPJ/CPF Fornecedor</label><input type="text" name="fornecedor.cpfCnpj" value={notaEditando.fornecedor?.cpfCnpj || ''} onChange={handleChangeNota} className={inputClasses} /></div>
                    <div><label className="text-xs">Número da Nota*</label><input type="text" name="numero" value={notaEditando.numero || ''} onChange={handleChangeNota} required className={inputClasses} /></div>
                    <div><label className="text-xs">Série</label><input type="text" name="serie" value={notaEditando.serie || ''} onChange={handleChangeNota} className={inputClasses} /></div>
                    <div><label className="text-xs">Data de Emissão*</label><input type="date" name="dataEmissao" value={notaEditando.dataEmissao || ''} onChange={handleChangeNota} required className={inputClasses} /></div>
                    <div><label className="text-xs">Data de Entrada*</label><input type="date" name="dataEntradaSaida" value={notaEditando.dataEntradaSaida || ''} onChange={handleChangeNota} required className={inputClasses} /></div>
                    <div><label className="text-xs">CFOP Principal</label><input type="text" name="cfopPrincipal" value={notaEditando.cfopPrincipal || ''} onChange={handleChangeNota} className={inputClasses} /></div>
                </div>
            </fieldset>

            {/* Itens da Nota */}
            <fieldset className="border p-3 rounded-md dark:border-gray-600">
                <legend className="text-md font-medium px-1 text-nixcon-dark dark:text-nixcon-light">Itens da Nota</legend>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end mt-1 mb-3">
                    <div className="md:col-span-4"><label className="text-xs">Produto/Serviço</label><select name="produtoSelecionadoId" value={itemForm.produtoSelecionadoId || ''} onChange={handleChangeItemForm} className={selectClasses}><option value="">Selecione...</option>{produtosDisponiveis.map(p => <option key={p.id} value={p.id}>{p.descricao} ({p.unidade})</option>)}</select></div>
                    <div className="md:col-span-3"><label className="text-xs">Descrição (Manual se não selecionar)</label><input type="text" name="descricao" value={itemForm.descricao || ''} onChange={handleChangeItemForm} className={inputClasses} /></div>
                    <div className="md:col-span-1"><label className="text-xs">Qtd*</label><input type="number" name="quantidade" value={itemForm.quantidade || 1} min="0.001" step="any" onChange={handleChangeItemForm} className={inputClasses} /></div>
                    <div className="md:col-span-2"><label className="text-xs">Vlr. Unit.*</label><input type="number" name="valorUnitario" value={itemForm.valorUnitario || 0} step="any" min="0" onChange={handleChangeItemForm} className={inputClasses} /></div>
                    <div className="md:col-span-2"><Button type="button" onClick={handleAdicionarItem} variant="secondary" size="sm" fullWidth disabled={!itemForm.descricao}>Adicionar Item</Button></div>
                </div>
                {notaEditando.itens && notaEditando.itens.length > 0 && (
                    <ul className="space-y-1 max-h-32 overflow-y-auto border dark:border-gray-700 rounded p-2 bg-gray-50 dark:bg-gray-800">
                        {notaEditando.itens.map(item => (
                            <li key={item.id} className="text-xs p-1.5 rounded bg-white dark:bg-gray-700 shadow-sm flex justify-between items-center">
                                <span className="dark:text-gray-200">{item.descricao} ({item.quantidade} x {formatCurrency(item.valorUnitario)}) = {formatCurrency(item.valorTotal)}</span>
                                <Button type="button" variant="danger" size="sm" onClick={() => handleRemoverItem(item.id)} className="p-0.5"><IconeLixeira className="w-3 h-3"/></Button>
                            </li>
                        ))}
                    </ul>
                )}
            </fieldset>
            
            <div className="text-right mt-2">
                <p className="text-lg font-semibold text-nixcon-dark dark:text-nixcon-light">Valor Total da Nota: {formatCurrency(calcularValorTotalNota(notaEditando.itens || []))}</p>
            </div>

            <div className="mt-6 pt-4 border-t dark:border-gray-700 text-right space-x-2">
              <Button type="button" variant="secondary" onClick={() => setModalNotaAberto(false)}>Cancelar</Button>
              <Button type="submit">Salvar Nota de Entrada</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default EscritaFiscalPage;
const style = document.createElement('style');
style.innerHTML = `
  .text-xxs { font-size: 0.65rem; line-height: 0.85rem; }
`;
document.head.appendChild(style);
