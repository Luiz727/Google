
import React, { useState, useEffect, useMemo, FormEvent, ChangeEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeFinanceiro, IconeLixeira, IconeConfiguracoes } from '../components/common/Icons';
import { useAuth } from '../contexts/AuthContext';
import { ContaContabil, FuncaoUsuario } from '../types';

// Usando IconeFinanceiro como placeholder para IconeContabilidade
const IconeContabilidade = IconeFinanceiro;
const STORAGE_KEY_PLANO_CONTAS_PREFIX = 'nixconPortalPlanoContas_';

const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm";
const selectClasses = `${inputClasses} bg-white dark:bg-gray-700`;
const checkboxLabelClasses = "ml-2 block text-sm text-gray-700 dark:text-gray-300";

const ContabilidadePage: React.FC = () => {
  const { usuarioAtual, tenantAtual } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<'planoContas' | 'lancamentos' | 'relatorios' | 'configuracoes'>('planoContas');
  
  const [planoDeContas, setPlanoDeContas] = useState<ContaContabil[]>([]);
  const [modalContaAberto, setModalContaAberto] = useState(false);
  const [contaEditando, setContaEditando] = useState<Partial<ContaContabil> | null>(null);
  const [filtroDescricaoConta, setFiltroDescricaoConta] = useState('');

  const tenantIdEscritorio = useMemo(() => tenantAtual?.id, [tenantAtual]);

  useEffect(() => {
    if (tenantIdEscritorio) {
      const storageKey = `${STORAGE_KEY_PLANO_CONTAS_PREFIX}${tenantIdEscritorio}`;
      const planoSalvo = localStorage.getItem(storageKey);
      if (planoSalvo) {
        setPlanoDeContas(JSON.parse(planoSalvo));
      } else {
        const agora = new Date().toISOString();
        const planoMock: ContaContabil[] = [
          { id: '1', codigo: '1', descricao: 'ATIVO', tipo: 'SINTETICA', natureza: 'DEVEDORA', grupo: 'ATIVO', nivel: 1, permiteLancamentos: false, tenantId: tenantIdEscritorio, dataCriacao: agora, dataAtualizacao: agora },
          { id: '1.1', codigo: '1.1', descricao: 'ATIVO CIRCULANTE', tipo: 'SINTETICA', natureza: 'DEVEDORA', grupo: 'ATIVO', nivel: 2, contaPaiId: '1', permiteLancamentos: false, tenantId: tenantIdEscritorio, dataCriacao: agora, dataAtualizacao: agora },
          { id: '1.1.01', codigo: '1.1.01', descricao: 'DISPONIBILIDADES', tipo: 'SINTETICA', natureza: 'DEVEDORA', grupo: 'ATIVO CIRCULANTE', nivel: 3, contaPaiId: '1.1', permiteLancamentos: false, tenantId: tenantIdEscritorio, dataCriacao: agora, dataAtualizacao: agora },
          { id: '1.1.01.001', codigo: '1.1.01.001', descricao: 'CAIXA GERAL', tipo: 'ANALITICA', natureza: 'DEVEDORA', grupo: 'DISPONIBILIDADES', nivel: 4, contaPaiId: '1.1.01', permiteLancamentos: true, tenantId: tenantIdEscritorio, dataCriacao: agora, dataAtualizacao: agora },
          { id: '2', codigo: '2', descricao: 'PASSIVO', tipo: 'SINTETICA', natureza: 'CREDORA', grupo: 'PASSIVO', nivel: 1, permiteLancamentos: false, tenantId: tenantIdEscritorio, dataCriacao: agora, dataAtualizacao: agora },
        ];
        setPlanoDeContas(planoMock);
      }
    }
  }, [tenantIdEscritorio]);

  useEffect(() => {
    if (tenantIdEscritorio && planoDeContas.length > 0) { 
      localStorage.setItem(`${STORAGE_KEY_PLANO_CONTAS_PREFIX}${tenantIdEscritorio}`, JSON.stringify(planoDeContas));
    }
  }, [planoDeContas, tenantIdEscritorio]);

  const handleAbrirModalConta = (conta?: ContaContabil) => {
    setContaEditando(conta ? { ...conta } : { tipo: 'ANALITICA', natureza: 'DEVEDORA', permiteLancamentos: true, nivel: 1, codigo: '', descricao: '', grupo: '' });
    setModalContaAberto(true);
  };
  
  const handleChangeContaEditando = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
  
    setContaEditando(prev => {
      if (!prev) return null;
      let finalValue: string | number | boolean | undefined = value;
      if (type === 'checkbox') {
        finalValue = checked;
      } else if (name === 'nivel') {
        finalValue = parseInt(value, 10);
        if (isNaN(finalValue as number)) finalValue = 1; // Default to 1 if not a number
      }
  
      const newState = { ...prev, [name]: finalValue };
  
      // Se tipo muda para Sintética, desabilita e desmarca permiteLancamentos
      if (name === 'tipo' && value === 'SINTETICA') {
        newState.permiteLancamentos = false;
      }
      return newState;
    });
  };

  const handleSalvarConta = (e: FormEvent) => {
    e.preventDefault();
    if (!contaEditando || !contaEditando.codigo || !contaEditando.descricao || !tenantIdEscritorio || !contaEditando.nivel) {
      alert("Código, Descrição e Nível da conta são obrigatórios.");
      return;
    }
    
    const agora = new Date().toISOString();
    let contaFinalizada: ContaContabil;

    if (contaEditando.id) {
      contaFinalizada = { 
        ...planoDeContas.find(c => c.id === contaEditando.id)!, 
        ...contaEditando, 
        dataAtualizacao: agora 
      } as ContaContabil;
      setPlanoDeContas(planoDeContas.map(c => c.id === contaFinalizada.id ? contaFinalizada : c));
    } else {
      contaFinalizada = {
        id: `conta-${Date.now()}`,
        tenantId: tenantIdEscritorio,
        dataCriacao: agora,
        dataAtualizacao: agora,
        ...contaEditando,
      } as ContaContabil;
      setPlanoDeContas(prev => [...prev, contaFinalizada].sort((a,b) => a.codigo.localeCompare(b.codigo)));
    }
    setModalContaAberto(false);
  };
  
  const handleExcluirConta = (idConta: string) => {
    if (planoDeContas.some(c => c.contaPaiId === idConta)) {
        alert("Não é possível excluir uma conta que é pai de outras contas. Remova ou reatribua as contas filhas primeiro.");
        return;
    }
    if (window.confirm("Tem certeza que deseja excluir esta conta?")) {
        setPlanoDeContas(planoDeContas.filter(c => c.id !== idConta));
    }
  };

  const contasFiltradasParaRenderizar = useMemo(() => {
    const contasOrdenadas = [...planoDeContas].sort((a, b) => a.codigo.localeCompare(b.codigo));
    if (!filtroDescricaoConta) {
        return contasOrdenadas;
    }
    const filtroLower = filtroDescricaoConta.toLowerCase();
    return contasOrdenadas.filter(c => 
        c.descricao.toLowerCase().includes(filtroLower) || 
        c.codigo.toLowerCase().includes(filtroLower)
    );
  }, [planoDeContas, filtroDescricaoConta]);
  
  const getIndentacao = (codigo: string): number => {
    return (codigo.match(/\./g) || []).length * 1.5; // 1.5rem por nível de ponto
  };

  const canManage = usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN;

  const renderConteudoAba = () => {
    switch (abaAtiva) {
      case 'planoContas':
        return (
          <Card className="shadow-lg dark:bg-nixcon-dark-card">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
              <input 
                type="text" 
                placeholder="Buscar por código ou descrição..." 
                value={filtroDescricaoConta}
                onChange={e => setFiltroDescricaoConta(e.target.value)}
                className={`${inputClasses} max-w-xs dark:bg-gray-700 dark:text-gray-200`}
              />
              {canManage && <Button onClick={() => handleAbrirModalConta()}>Adicionar Conta</Button>}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Natureza</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Permite Lanç.</th>
                    {canManage && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
                  {contasFiltradasParaRenderizar.map(conta => (
                    <tr key={conta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" style={{ paddingLeft: `${getIndentacao(conta.codigo) + 1}rem` }}>{conta.codigo}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-nixcon-charcoal dark:text-nixcon-light">{conta.descricao}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{conta.tipo}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{conta.natureza}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">{conta.permiteLancamentos ? 'Sim' : 'Não'}</td>
                      {canManage && 
                        <td className="px-4 py-3 whitespace-nowrap text-sm space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleAbrirModalConta(conta)}>Editar</Button>
                          <Button variant="danger" size="sm" onClick={() => handleExcluirConta(conta.id)}><IconeLixeira className="w-3 h-3"/></Button>
                        </td>
                      }
                    </tr>
                  ))}
                  {contasFiltradasParaRenderizar.length === 0 && (<tr><td colSpan={canManage ? 6 : 5} className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhuma conta encontrada.</td></tr>)}
                </tbody>
              </table>
            </div>
          </Card>
        );
      case 'lancamentos':
        return <Card className="shadow-lg dark:bg-nixcon-dark-card"><p className="text-gray-600 dark:text-gray-400">Funcionalidade de Lançamentos Contábeis será implementada aqui.</p></Card>;
      case 'relatorios':
        return <Card className="shadow-lg dark:bg-nixcon-dark-card"><p className="text-gray-600 dark:text-gray-400">Geração de Relatórios Contábeis (Balancete, DRE, Balanço) será implementada aqui.</p></Card>;
      case 'configuracoes':
        return <Card className="shadow-lg dark:bg-nixcon-dark-card"><p className="text-gray-600 dark:text-gray-400">Configurações específicas do módulo Contabilidade (ex: histórico padrão, centros de custo) serão implementadas aqui.</p></Card>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center">
          <IconeContabilidade className="w-8 h-8 mr-3 text-nixcon-gold" />
          Módulo Contabilidade
        </h1>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {([
            { key: 'planoContas', label: 'Plano de Contas' },
            { key: 'lancamentos', label: 'Lançamentos' },
            { key: 'relatorios', label: 'Relatórios' },
            { key: 'configuracoes', label: 'Configurações' }
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setAbaAtiva(tab.key)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
                ${abaAtiva === tab.key 
                  ? 'border-nixcon-gold text-nixcon-gold' 
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {renderConteudoAba()}

      {modalContaAberto && contaEditando && canManage && (
        <Modal isOpen={modalContaAberto} onClose={() => setModalContaAberto(false)} title={contaEditando.id ? "Editar Conta Contábil" : "Nova Conta Contábil"}>
          <form onSubmit={handleSalvarConta} className="space-y-4 max-h-[75vh] overflow-y-auto p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label htmlFor="codigo" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Código*</label><input type="text" name="codigo" id="codigo" value={contaEditando.codigo || ''} onChange={handleChangeContaEditando} required className={inputClasses} /></div>
                <div><label htmlFor="codigoReduzido" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Cód. Reduzido</label><input type="text" name="codigoReduzido" id="codigoReduzido" value={contaEditando.codigoReduzido || ''} onChange={handleChangeContaEditando} className={inputClasses} /></div>
            </div>
            <div><label htmlFor="descricao" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Descrição*</label><input type="text" name="descricao" id="descricao" value={contaEditando.descricao || ''} onChange={handleChangeContaEditando} required className={inputClasses} /></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label htmlFor="tipo" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Tipo*</label><select name="tipo" id="tipo" value={contaEditando.tipo || 'ANALITICA'} onChange={handleChangeContaEditando} className={selectClasses}><option value="ANALITICA">Analítica</option><option value="SINTETICA">Sintética</option></select></div>
                <div><label htmlFor="natureza" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Natureza*</label><select name="natureza" id="natureza" value={contaEditando.natureza || 'DEVEDORA'} onChange={handleChangeContaEditando} className={selectClasses}><option value="DEVEDORA">Devedora</option><option value="CREDORA">Credora</option><option value="MISTA">Mista</option></select></div>
             </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label htmlFor="grupo" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Grupo (Classificação)</label><input type="text" name="grupo" id="grupo" value={contaEditando.grupo || ''} onChange={handleChangeContaEditando} className={inputClasses} /></div>
                <div><label htmlFor="nivel" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Nível*</label><input type="number" name="nivel" id="nivel" value={contaEditando.nivel || 1} min="1" onChange={handleChangeContaEditando} required className={inputClasses} /></div>
            </div>
            <div>
                <label htmlFor="contaPaiId" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Conta Pai (Sintética)</label>
                <select name="contaPaiId" id="contaPaiId" value={contaEditando.contaPaiId || ''} onChange={handleChangeContaEditando} className={selectClasses}>
                    <option value="">Nenhuma (Conta Raiz do Nível)</option>
                    {planoDeContas.filter(c => c.tipo === 'SINTETICA' && c.id !== contaEditando.id).sort((a,b)=>a.codigo.localeCompare(b.codigo)).map(cPai => (
                        <option key={cPai.id} value={cPai.id}>{cPai.codigo} - {cPai.descricao}</option>
                    ))}
                </select>
            </div>
            <div className="flex items-center">
                <input type="checkbox" name="permiteLancamentos" id="permiteLancamentosConta" checked={contaEditando.tipo === 'SINTETICA' ? false : (contaEditando.permiteLancamentos || false)} onChange={handleChangeContaEditando} className="h-4 w-4 text-nixcon-gold rounded focus:ring-nixcon-gold dark:border-gray-600" disabled={contaEditando.tipo === 'SINTETICA'}/>
                <label htmlFor="permiteLancamentosConta" className={checkboxLabelClasses}>Permite Lançamentos</label>
            </div>
            {contaEditando.tipo === 'SINTETICA' && <p className="text-xs text-gray-500 dark:text-gray-400">Contas sintéticas não permitem lançamentos diretos.</p>}
            <div className="mt-6 text-right space-x-2">
              <Button type="button" variant="secondary" onClick={() => setModalContaAberto(false)}>Cancelar</Button>
              <Button type="submit">Salvar Conta</Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default ContabilidadePage;
