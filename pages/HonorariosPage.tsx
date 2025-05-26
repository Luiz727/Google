
import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeFinanceiro, IconeLixeira } from '../components/common/Icons'; // Usando IconeFinanceiro por enquanto
import { useAuth } from '../contexts/AuthContext';
import { 
  Empresa, 
  ServicoContabil, 
  ItemContratoHonorarios, 
  ContratoHonorarios, 
  StatusContratoHonorarios, 
  UnidadeServicoContabil, 
  PeriodicidadeCobranca,
  FuncaoUsuario
} from '../types';
import { STORAGE_KEY_PREFIX as STORAGE_KEY_EMPRESAS_PREFIX } from './EmpresasPage';

const STORAGE_KEY_CONTRATOS_HONORARIOS_PREFIX = 'nixconPortalContratosHonorarios_';
// const STORAGE_KEY_SERVICOS_CONTABEIS_PREFIX = 'nixconPortalServicosContabeis_'; // Para quando os serviços forem dinâmicos

const inputStyles = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400";
const selectStyles = `${inputStyles} bg-white dark:bg-gray-700`;

// Lista Mock de Serviços Contábeis (será substituída por cadastro/API no futuro)
const servicosContabeisMock: ServicoContabil[] = [
  { id: 'serv-cont-mensal', nome: "Escrituração Contábil Mensal", valorPadrao: 500, unidade: "MENSAL", tenantId: "global", descricao: "Serviços completos de escrituração contábil." },
  { id: 'serv-dp-mensal', nome: "Departamento Pessoal (até 5 func.)", valorPadrao: 300, unidade: "MENSAL", tenantId: "global", descricao: "Processamento da folha de pagamento e obrigações." },
  { id: 'serv-fiscal-simples', nome: "Apuração Simples Nacional", valorPadrao: 250, unidade: "MENSAL", tenantId: "global", descricao: "Cálculo e emissão de guias do Simples Nacional." },
  { id: 'serv-irpf', nome: "Declaração IRPF", valorPadrao: 150, unidade: "UNICO", tenantId: "global", descricao: "Elaboração e entrega da Declaração de Imposto de Renda Pessoa Física." },
  { id: 'serv-consultoria-hora', nome: "Consultoria Avulsa", valorPadrao: 200, unidade: "HORA", tenantId: "global", descricao: "Consultoria especializada por hora." },
  { id: 'serv-abertura-emp', nome: "Abertura de Empresa", valorPadrao: 800, unidade: "UNICO", tenantId: "global", descricao: "Processo completo de abertura e legalização de empresas." },
];

// Fix: Define options array for StatusContratoHonorarios
const statusContratoOptions: { value: StatusContratoHonorarios, label: string }[] = [
    { value: 'ATIVO', label: 'Ativo' },
    { value: 'SUSPENSO', label: 'Suspenso' },
    { value: 'CANCELADO', label: 'Cancelado' },
    { value: 'CONCLUIDO', label: 'Concluído' },
];


const HonorariosPage: React.FC = () => {
  const { usuarioAtual, tenantAtual } = useAuth();
  const [contratos, setContratos] = useState<ContratoHonorarios[]>([]);
  const [empresasClientes, setEmpresasClientes] = useState<Empresa[]>([]);
  
  const [modalContratoAberto, setModalContratoAberto] = useState(false);
  const [contratoEditando, setContratoEditando] = useState<Partial<ContratoHonorarios> | null>(null);
  const [itemContratoAtual, setItemContratoAtual] = useState<Partial<ItemContratoHonorarios> & { servicoId?: string }>({});

  const tenantIdEscritorio = tenantAtual?.id;

  useEffect(() => {
    if (tenantIdEscritorio) {
      // Carregar Contratos
      const storageKeyContratos = `${STORAGE_KEY_CONTRATOS_HONORARIOS_PREFIX}${tenantIdEscritorio}`;
      const contratosSalvos = localStorage.getItem(storageKeyContratos);
      if (contratosSalvos) setContratos(JSON.parse(contratosSalvos));
      else setContratos([]);

      // Carregar Empresas Clientes
      const storageKeyEmpresas = `${STORAGE_KEY_EMPRESAS_PREFIX}${tenantIdEscritorio}`;
      const empresasSalvas = localStorage.getItem(storageKeyEmpresas);
      if (empresasSalvas) setEmpresasClientes(JSON.parse(empresasSalvas));
      else setEmpresasClientes([]);
    }
  }, [tenantIdEscritorio]);

  useEffect(() => {
    if (tenantIdEscritorio) {
      localStorage.setItem(`${STORAGE_KEY_CONTRATOS_HONORARIOS_PREFIX}${tenantIdEscritorio}`, JSON.stringify(contratos));
    }
  }, [contratos, tenantIdEscritorio]);

  const handleAbrirModalContrato = (contrato?: ContratoHonorarios) => {
    if (contrato) {
      setContratoEditando({ ...contrato, itens: [...contrato.itens] });
    } else {
      setContratoEditando({
        empresaClienteId: '',
        dataInicio: new Date().toISOString().split('T')[0],
        diaVencimentoFatura: 10,
        itens: [],
        status: 'ATIVO',
      });
    }
    setItemContratoAtual({ servicoId: '', quantidade: 1, periodicidadeCobranca: 'MENSAL' });
    setModalContratoAberto(true);
  };

  const handleChangeContrato = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContratoEditando(prev => prev ? { ...prev, [name]: name === 'diaVencimentoFatura' ? parseInt(value) : value } : null);
  };

  const handleChangeItemContrato = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue: string | number | undefined = value;
    if (name === 'quantidade' || name === 'valorCobrado') {
        finalValue = parseFloat(value);
        if(isNaN(finalValue as number)) finalValue = undefined;
    }

    if (name === 'servicoId' && value) {
        const servicoBase = servicosContabeisMock.find(s => s.id === value);
        if (servicoBase) {
            let defaultPeriodicidade: PeriodicidadeCobranca;
            // Fix: Correct mapping from UnidadeServicoContabil to PeriodicidadeCobranca
            switch (servicoBase.unidade) {
                case 'MENSAL':
                    defaultPeriodicidade = 'MENSAL';
                    break;
                case 'ANUAL':
                    defaultPeriodicidade = 'ANUAL';
                    break;
                case 'UNICO':
                case 'HORA':
                case 'POR_EVENTO':
                    defaultPeriodicidade = 'UNICA';
                    break;
                // UnidadeServicoContabil doesn't have BIMESTRAL etc. These are only in PeriodicidadeCobranca
                default:
                    // Fallback for unmapped UnidadeServicoContabil values
                    defaultPeriodicidade = 'UNICA';
                    console.warn(`Unhandled UnidadeServicoContabil '${servicoBase.unidade}' in handleChangeItemContrato, defaulting periodicidade to UNICA.`);
            }

            setItemContratoAtual(prev => ({
                ...prev,
                servicoId: value,
                descricaoPersonalizada: servicoBase.nome,
                valorCobrado: servicoBase.valorPadrao,
                periodicidadeCobranca: defaultPeriodicidade,
            }));
        }
    } else {
       setItemContratoAtual(prev => ({ ...prev, [name]: finalValue }));
    }
  };
  
  const handleAdicionarItemAoContrato = () => {
    if (!itemContratoAtual.servicoId || !itemContratoAtual.quantidade || itemContratoAtual.quantidade <= 0 || typeof itemContratoAtual.valorCobrado !== 'number' || itemContratoAtual.valorCobrado < 0) {
        alert("Selecione um serviço e preencha quantidade e valor válidos.");
        return;
    }
    const servicoBase = servicosContabeisMock.find(s => s.id === itemContratoAtual.servicoId);
    if (!servicoBase) return;

    let finalPeriodicidade: PeriodicidadeCobranca;
    if (itemContratoAtual.periodicidadeCobranca) {
        finalPeriodicidade = itemContratoAtual.periodicidadeCobranca;
    } else {
        // Fix: Correct mapping from UnidadeServicoContabil to PeriodicidadeCobranca for fallback
        switch (servicoBase.unidade) {
            case 'MENSAL':
                finalPeriodicidade = 'MENSAL';
                break;
            case 'ANUAL':
                finalPeriodicidade = 'ANUAL';
                break;
            case 'UNICO':
            case 'HORA':
            case 'POR_EVENTO':
                finalPeriodicidade = 'UNICA';
                break;
            default:
                finalPeriodicidade = 'UNICA'; // Default for safety
                console.warn(`Unhandled servicoBase.unidade '${servicoBase.unidade}' in handleAdicionarItemAoContrato, defaulting periodicidade to UNICA.`);
        }
    }

    const novoItem: ItemContratoHonorarios = {
        id: `item-${Date.now()}`,
        servicoContabilId: itemContratoAtual.servicoId!,
        descricaoPersonalizada: itemContratoAtual.descricaoPersonalizada || servicoBase.nome,
        valorCobrado: itemContratoAtual.valorCobrado!,
        quantidade: itemContratoAtual.quantidade!,
        periodicidadeCobranca: finalPeriodicidade,
    };

    setContratoEditando(prev => prev ? ({ ...prev, itens: [...(prev.itens || []), novoItem] }) : null);
    setItemContratoAtual({ servicoId: '', quantidade: 1, periodicidadeCobranca: 'MENSAL' }); // Reset form
  };

  const handleRemoverItemDoContrato = (itemId: string) => {
    setContratoEditando(prev => prev ? ({ ...prev, itens: prev.itens?.filter(item => item.id !== itemId) }) : null);
  };


  const handleSalvarContrato = (e: FormEvent) => {
    e.preventDefault();
    if (!contratoEditando || !contratoEditando.empresaClienteId || !contratoEditando.dataInicio || !tenantIdEscritorio) {
      alert("Cliente, data de início e outros campos chave são obrigatórios.");
      return;
    }
    
    const clienteSelecionado = empresasClientes.find(emp => emp.id === contratoEditando.empresaClienteId);

    const contratoFinal: ContratoHonorarios = {
        ...contratoEditando,
        empresaClienteNome: clienteSelecionado?.nome || 'Nome não encontrado',
        dataCriacao: contratoEditando.id ? contratoEditando.dataCriacao! : new Date().toISOString(),
        dataAtualizacao: new Date().toISOString(),
        tenantId: tenantIdEscritorio,
    } as ContratoHonorarios;


    if (contratoEditando.id) {
      setContratos(contratos.map(c => c.id === contratoFinal.id ? contratoFinal : c));
    } else {
      setContratos(prev => [{ ...contratoFinal, id: `contrato-${Date.now()}` }, ...prev]);
    }
    setModalContratoAberto(false);
  };
  
  const formatarData = (isoString?: string) => isoString ? new Date(isoString.substring(0,10).replace(/-/g, '/')).toLocaleDateString('pt-BR') : '-';

  const calcularValorMensalContrato = (contrato: ContratoHonorarios): number => {
    return contrato.itens.reduce((total, item) => {
        if (item.periodicidadeCobranca === 'MENSAL') {
            return total + (item.valorCobrado * item.quantidade);
        }
        // Para outras periodicidades, um cálculo mais complexo seria necessário
        // para obter um "equivalente mensal". Por ora, só mensais.
        return total;
    }, 0);
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center mb-4 sm:mb-0">
          <IconeFinanceiro className="w-8 h-8 mr-3 text-nixcon-gold" />
          Gestão de Honorários e Faturamento
        </h1>
        <Button onClick={() => handleAbrirModalContrato()}>Novo Contrato</Button>
      </div>

      <Card className="shadow-lg">
        <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">Contratos Ativos</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nº Contrato</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Início</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dia Venc.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valor Mensal (Est.)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {contratos.map(contrato => (
                <tr key={contrato.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-nixcon-dark dark:text-nixcon-light">{contrato.empresaClienteNome}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{contrato.numeroContrato || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatarData(contrato.dataInicio)}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${contrato.status === 'ATIVO' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'}`}>{contrato.status}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{contrato.diaVencimentoFatura}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{calcularValorMensalContrato(contrato).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleAbrirModalContrato(contrato)}>Editar</Button>
                    <Button variant="secondary" size="sm" onClick={() => alert(`Gerar fatura para ${contrato.empresaClienteNome} (a implementar)`)}>Gerar Fatura</Button>
                  </td>
                </tr>
              ))}
              {contratos.length === 0 && (<tr><td colSpan={7} className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhum contrato de honorários cadastrado.</td></tr>)}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Novo/Editar Contrato */}
      {modalContratoAberto && contratoEditando && (
        <Modal isOpen={modalContratoAberto} onClose={() => setModalContratoAberto(false)} title={contratoEditando.id ? "Editar Contrato de Honorários" : "Novo Contrato de Honorários"}>
          <form onSubmit={handleSalvarContrato} className="space-y-4 max-h-[75vh] overflow-y-auto p-1">
            {/* Dados Gerais do Contrato */}
            <fieldset className="border p-3 rounded-md dark:border-gray-600">
                <legend className="text-md font-medium text-nixcon-dark dark:text-nixcon-light px-1">Dados Gerais</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                    <div><label className="text-xs text-gray-700 dark:text-gray-300">Empresa Cliente*</label><select name="empresaClienteId" value={contratoEditando.empresaClienteId || ''} onChange={handleChangeContrato} required className={selectStyles}><option value="">Selecione...</option>{empresasClientes.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}</select></div>
                    <div><label className="text-xs text-gray-700 dark:text-gray-300">Número do Contrato</label><input type="text" name="numeroContrato" value={contratoEditando.numeroContrato || ''} onChange={handleChangeContrato} className={inputStyles} /></div>
                    <div><label className="text-xs text-gray-700 dark:text-gray-300">Data Início*</label><input type="date" name="dataInicio" value={contratoEditando.dataInicio || ''} onChange={handleChangeContrato} required className={inputStyles} /></div>
                    <div><label className="text-xs text-gray-700 dark:text-gray-300">Data Fim (Opcional)</label><input type="date" name="dataFim" value={contratoEditando.dataFim || ''} onChange={handleChangeContrato} className={inputStyles} /></div>
                    <div><label className="text-xs text-gray-700 dark:text-gray-300">Dia Venc. Fatura* (1-31)</label><input type="number" name="diaVencimentoFatura" value={contratoEditando.diaVencimentoFatura || 10} min="1" max="31" onChange={handleChangeContrato} required className={inputStyles} /></div>
                    {/* Fix: Use defined options array for StatusContratoHonorarios */}
                    <div><label className="text-xs text-gray-700 dark:text-gray-300">Status*</label><select name="status" value={contratoEditando.status || 'ATIVO'} onChange={handleChangeContrato} className={selectStyles}>{statusContratoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                </div>
                 <div><label className="text-xs text-gray-700 dark:text-gray-300 mt-2">Observações</label><textarea name="observacoes" value={contratoEditando.observacoes || ''} onChange={handleChangeContrato} rows={2} className={inputStyles}></textarea></div>
            </fieldset>
            
            {/* Itens do Contrato */}
            <fieldset className="border p-3 rounded-md dark:border-gray-600">
                <legend className="text-md font-medium text-nixcon-dark dark:text-nixcon-light px-1">Serviços Inclusos no Contrato</legend>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end mt-1 mb-3">
                    <div className="md:col-span-4"><label className="text-xs text-gray-700 dark:text-gray-300">Serviço Base</label><select name="servicoId" value={itemContratoAtual.servicoId || ''} onChange={handleChangeItemContrato} className={selectStyles}><option value="">Selecione um serviço...</option>{servicosContabeisMock.map(s => <option key={s.id} value={s.id}>{s.nome} (R$ {s.valorPadrao.toFixed(2)}/{s.unidade})</option>)}</select></div>
                    <div className="md:col-span-3"><label className="text-xs text-gray-700 dark:text-gray-300">Descrição (no Contrato)</label><input type="text" name="descricaoPersonalizada" value={itemContratoAtual.descricaoPersonalizada || ''} onChange={handleChangeItemContrato} className={inputStyles} /></div>
                    <div className="md:col-span-1"><label className="text-xs text-gray-700 dark:text-gray-300">Qtd.</label><input type="number" name="quantidade" value={itemContratoAtual.quantidade || 1} min="1" onChange={handleChangeItemContrato} className={inputStyles} /></div>
                    <div className="md:col-span-2"><label className="text-xs text-gray-700 dark:text-gray-300">Valor Cobrado (Unit.)</label><input type="number" name="valorCobrado" value={itemContratoAtual.valorCobrado || 0} step="0.01" min="0" onChange={handleChangeItemContrato} className={inputStyles} /></div>
                    <div className="md:col-span-2"><Button type="button" onClick={handleAdicionarItemAoContrato} variant="secondary" size="sm" fullWidth disabled={!itemContratoAtual.servicoId}>Adicionar Item</Button></div>
                </div>
                {contratoEditando.itens && contratoEditando.itens.length > 0 ? (
                    <ul className="space-y-1 max-h-40 overflow-y-auto border dark:border-gray-700 rounded p-2 bg-gray-50 dark:bg-gray-800">
                        {contratoEditando.itens.map(item => (
                            <li key={item.id} className="text-xs p-1.5 rounded bg-white dark:bg-gray-700 shadow-sm flex justify-between items-center">
                                <div>
                                    <span className="font-medium text-nixcon-dark dark:text-nixcon-light">{item.descricaoPersonalizada}</span><br/>
                                    <span className="text-gray-500 dark:text-gray-400">Qtd: {item.quantidade}, Valor: {item.valorCobrado.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}, Período: {item.periodicidadeCobranca}</span>
                                </div>
                                <Button type="button" variant="danger" size="sm" onClick={() => handleRemoverItemDoContrato(item.id)} className="p-1"><IconeLixeira className="w-3 h-3"/></Button>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">Nenhum serviço adicionado a este contrato.</p>}
            </fieldset>

            <div className="mt-6 text-right space-x-2">
              <Button type="button" variant="secondary" onClick={() => setModalContratoAberto(false)}>Cancelar</Button>
              <Button type="submit">Salvar Contrato</Button>
            </div>
          </form>
        </Modal>
      )}

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Funcionalidades como geração de faturas, envio automático, controle de pagamento e relatórios serão implementadas.
      </p>
    </div>
  );
};

export default HonorariosPage;
