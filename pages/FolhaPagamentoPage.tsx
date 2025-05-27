
import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeFolhaPagamento, IconeConfiguracoes, IconeDocumentos, IconeTarefas, IconeLixeira, IconeOlho } from '../components/common/Icons';
import { ColaboradorFolha, Endereco, FuncaoUsuario, DadosBancarios, Dependente } from '../types';
import { useAuth } from '../contexts/AuthContext';

type AbaFolha = 'painel' | 'colaboradores' | 'lancamentos' | 'processamento' | 'guiasRelatorios' | 'eSocial';

const STORAGE_KEY_COLABORADORES_PREFIX = 'nixconPortalColaboradores_';

const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm";
const selectClasses = `${inputClasses} bg-white dark:bg-gray-700`;
const emptyEndereco: Endereco = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' };
const emptyDadosBancarios: DadosBancarios = { banco: '', agencia: '', contaCorrente: '', tipoConta: 'CORRENTE' };


const FolhaPagamentoPage: React.FC = () => {
  const { usuarioAtual, tenantAtual, personificandoInfo, activeClientCompanyContext } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState<AbaFolha>('colaboradores'); // Inicia na aba de colaboradores
  const [colaboradores, setColaboradores] = useState<ColaboradorFolha[]>([]);

  const [modalColaboradorAberto, setModalColaboradorAberto] = useState(false);
  const [colaboradorEditando, setColaboradorEditando] = useState<Partial<ColaboradorFolha> | null>(null);


  const effectiveTenantId = useMemo(() => {
    if (personificandoInfo) return personificandoInfo.empresaId;
    if (activeClientCompanyContext && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN)) {
      return activeClientCompanyContext.id;
    }
    // Se usuário do escritório sem contexto de cliente, ou se for admin/usuário de cliente.
    return usuarioAtual?.tenantId || tenantAtual?.id;
  }, [personificandoInfo, activeClientCompanyContext, usuarioAtual, tenantAtual]);


  useEffect(() => {
    if (effectiveTenantId) {
      const storageKey = `${STORAGE_KEY_COLABORADORES_PREFIX}${effectiveTenantId}`;
      const colaboradoresSalvos = localStorage.getItem(storageKey);
      if (colaboradoresSalvos) {
        setColaboradores(JSON.parse(colaboradoresSalvos));
      } else {
        setColaboradores([]); // Inicia vazio se não houver dados salvos para o contexto
      }
    } else {
      setColaboradores([]);
    }
  }, [effectiveTenantId]);

  useEffect(() => {
    if (effectiveTenantId && colaboradores.length >=0) { // Salva mesmo se array vazio
      const storageKey = `${STORAGE_KEY_COLABORADORES_PREFIX}${effectiveTenantId}`;
      localStorage.setItem(storageKey, JSON.stringify(colaboradores));
    }
  }, [colaboradores, effectiveTenantId]);

  const handleAbrirModalColaborador = (colab?: ColaboradorFolha) => {
    if (colab) {
      setColaboradorEditando({ 
        ...colab, 
        endereco: { ...emptyEndereco, ...colab.endereco },
        dadosBancarios: colab.dadosBancarios ? { ...emptyDadosBancarios, ...colab.dadosBancarios } : { ...emptyDadosBancarios }
      });
    } else {
      setColaboradorEditando({
        nomeCompleto: '', cpf: '', cargo: '', salarioBase: 0,
        dataAdmissao: new Date().toISOString().split('T')[0],
        dataNascimento: '',
        endereco: { ...emptyEndereco },
        dadosBancarios: { ...emptyDadosBancarios },
        ativo: true,
        departamento: '',
        dependentes: [],
      });
    }
    setModalColaboradorAberto(true);
  };

  const handleChangeColaborador = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setColaboradorEditando(prev => {
      if (!prev) return null;
      let finalValue: any = value;
      if (type === 'checkbox') finalValue = checked;
      else if (name === 'salarioBase') finalValue = parseFloat(value) || 0;

      if (name.startsWith("endereco.")) {
        const enderecoField = name.split(".")[1] as keyof Endereco;
        return { ...prev, endereco: { ...(prev.endereco || emptyEndereco), [enderecoField]: finalValue } };
      } else if (name.startsWith("dadosBancarios.")) {
        const bancarioField = name.split(".")[1] as keyof DadosBancarios;
        return { ...prev, dadosBancarios: { ...(prev.dadosBancarios || emptyDadosBancarios), [bancarioField]: finalValue } };
      }
      return { ...prev, [name]: finalValue };
    });
  };

  const handleSalvarColaborador = (e: FormEvent) => {
    e.preventDefault();
    if (!colaboradorEditando || !colaboradorEditando.nomeCompleto || !colaboradorEditando.cpf || !colaboradorEditando.cargo || !effectiveTenantId) {
      alert("Nome, CPF e Cargo são obrigatórios.");
      return;
    }
    
    const colabFinalizado: ColaboradorFolha = {
        id: colaboradorEditando.id || `colab-${Date.now()}`,
        tenantId: effectiveTenantId, // Garante que o tenantId correto seja atribuído
        ...colaboradorEditando,
        // Garantir que campos obrigatórios tenham valores default se não preenchidos no Partial
        nomeCompleto: colaboradorEditando.nomeCompleto!,
        cpf: colaboradorEditando.cpf!,
        dataNascimento: colaboradorEditando.dataNascimento || new Date().toISOString().split('T')[0],
        dataAdmissao: colaboradorEditando.dataAdmissao || new Date().toISOString().split('T')[0],
        cargo: colaboradorEditando.cargo!,
        salarioBase: colaboradorEditando.salarioBase || 0,
        endereco: colaboradorEditando.endereco || emptyEndereco,
        ativo: colaboradorEditando.ativo !== undefined ? colaboradorEditando.ativo : true,
    } as ColaboradorFolha;


    if (colaboradorEditando.id) {
      setColaboradores(colaboradores.map(c => c.id === colabFinalizado.id ? colabFinalizado : c));
    } else {
      setColaboradores(prev => [colabFinalizado, ...prev]);
    }
    setModalColaboradorAberto(false);
  };

  const handleToggleStatusColaborador = (colab: ColaboradorFolha) => {
    const novoStatus = !colab.ativo;
    let dataDemissao = colab.dataDemissao;
    if (!novoStatus && !dataDemissao) { // Reativando e não tinha data de demissão
        dataDemissao = undefined; // Garante que fica undefined
    } else if (novoStatus === false) { // Desligando
        const dataInformada = prompt("Informe a data de demissão (AAAA-MM-DD):", new Date().toISOString().split('T')[0]);
        if (dataInformada && !isNaN(new Date(dataInformada).getTime())) {
            dataDemissao = new Date(dataInformada).toISOString().split('T')[0];
        } else if (dataInformada !== null) { // Se não cancelou e data é inválida
            alert("Data de demissão inválida.");
            return;
        } else { // Cancelou o prompt
             return;
        }
    }

    setColaboradores(colaboradores.map(c => 
        c.id === colab.id ? { ...c, ativo: novoStatus, dataDemissao } : c
    ));
  };

  const abas: { key: AbaFolha; label: string; icone: React.ReactElement }[] = [
    { key: 'painel', label: 'Painel Folha', icone: <IconeFolhaPagamento className="w-5 h-5 mr-2" /> },
    { key: 'colaboradores', label: 'Colaboradores', icone: <IconeTarefas className="w-5 h-5 mr-2" /> }, // Usando IconeTarefas como placeholder
    { key: 'lancamentos', label: 'Eventos/Lançamentos', icone: <IconeDocumentos className="w-5 h-5 mr-2" /> },
    { key: 'processamento', label: 'Processamento', icone: <IconeConfiguracoes className="w-5 h-5 mr-2" /> },
    { key: 'guiasRelatorios', label: 'Guias e Relatórios', icone: <IconeFolhaPagamento className="w-5 h-5 mr-2" /> },
    { key: 'eSocial', label: 'eSocial', icone: <IconeConfiguracoes className="w-5 h-5 mr-2" /> },
  ];
  
  const formatCurrency = (value: number | undefined) => (typeof value === 'number' ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00');
  const formatDate = (isoDate: string | undefined) => isoDate ? new Date(isoDate.split('T')[0]+'T00:00:00Z').toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-';


  const renderConteudoAba = () => {
    switch (abaAtiva) {
      case 'painel':
        return <Card className="dark:bg-nixcon-dark-card"><p className="text-gray-600 dark:text-gray-400">Resumo e principais indicadores da folha de pagamento. Gráficos, alertas e informações consolidadas.</p></Card>;
      case 'colaboradores':
        return (
          <Card className="shadow-lg dark:bg-nixcon-dark-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light">Lista de Colaboradores ({colaboradores.length})</h2>
              <Button onClick={() => handleAbrirModalColaborador()}>Novo Colaborador</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">CPF</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cargo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Admissão</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Salário Base</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
                  {colaboradores.map(colab => (
                    <tr key={colab.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-nixcon-dark dark:text-nixcon-light">{colab.nomeCompleto}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{colab.cpf}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{colab.cargo}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(colab.dataAdmissao)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(colab.salarioBase)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colab.ativo ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'}`}>
                          {colab.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        {!colab.ativo && colab.dataDemissao && <span className="block text-xxs text-gray-400 dark:text-gray-500">Demissão: {formatDate(colab.dataDemissao)}</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleAbrirModalColaborador(colab)} title="Editar Colaborador"><IconeConfiguracoes className="w-4 h-4" /></Button>
                        <Button variant={colab.ativo ? "danger" : "primary"} size="sm" onClick={() => handleToggleStatusColaborador(colab)} title={colab.ativo ? "Desligar Colaborador" : "Reativar Colaborador"}>
                            {colab.ativo ? <IconeLixeira className="w-4 h-4" /> : <IconeOlho className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {colaboradores.length === 0 && (<tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Nenhum colaborador encontrado para o contexto atual.</td></tr>)}
                </tbody>
              </table>
            </div>
          </Card>
        );
      case 'lancamentos':
        return <Card className="dark:bg-nixcon-dark-card"><p className="text-gray-600 dark:text-gray-400">Lançamento de eventos variáveis como horas extras, faltas, comissões, adiantamentos salariais, pensões, etc.</p></Card>;
      case 'processamento':
        return <Card className="dark:bg-nixcon-dark-card"><p className="text-gray-600 dark:text-gray-400">Rotinas de cálculo da folha mensal, adiantamentos, férias, 13º salário e rescisões contratuais.</p></Card>;
      case 'guiasRelatorios':
        return <Card className="dark:bg-nixcon-dark-card"><p className="text-gray-600 dark:text-gray-400">Emissão de guias de recolhimento (INSS, FGTS, IRRF) e diversos relatórios gerenciais e legais (holerites, resumo da folha, RAIS, DIRF).</p></Card>;
      case 'eSocial':
        return <Card className="dark:bg-nixcon-dark-card space-y-4"><h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light">Gestão eSocial</h2><p className="text-gray-600 dark:text-gray-400">Esta seção é dedicada à gestão completa dos eventos do eSocial. Funcionalidades de geração de leiautes, transmissão, acompanhamento e tratamento de retornos serão implementadas.</p></Card>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center mb-4 sm:mb-0">
          <IconeFolhaPagamento className="w-8 h-8 mr-3 text-nixcon-gold" />
          Módulo Folha de Pagamento
        </h1>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
          {abas.map(tab => (
            <button key={tab.key} onClick={() => setAbaAtiva(tab.key)}
              className={`flex items-center whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm transition-colors
                ${abaAtiva === tab.key ? 'border-nixcon-gold text-nixcon-gold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}>
              {tab.icone}{tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-4">
        {renderConteudoAba()}
      </div>

      {/* Modal Novo/Editar Colaborador */}
      {modalColaboradorAberto && colaboradorEditando && (
        <Modal isOpen={modalColaboradorAberto} onClose={() => setModalColaboradorAberto(false)} title={colaboradorEditando.id ? "Editar Colaborador" : "Novo Colaborador"}>
          <form onSubmit={handleSalvarColaborador} className="space-y-4 max-h-[75vh] overflow-y-auto p-1">
            <fieldset className="border p-3 rounded-md dark:border-gray-600"><legend className="px-1">Dados Pessoais</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><label className="text-xs">Nome Completo*</label><input type="text" name="nomeCompleto" value={colaboradorEditando.nomeCompleto || ''} onChange={handleChangeColaborador} required className={inputClasses}/></div>
                    <div><label className="text-xs">CPF*</label><input type="text" name="cpf" value={colaboradorEditando.cpf || ''} onChange={handleChangeColaborador} required className={inputClasses}/></div>
                    <div><label className="text-xs">RG</label><input type="text" name="rg" value={colaboradorEditando.rg || ''} onChange={handleChangeColaborador} className={inputClasses}/></div>
                    <div><label className="text-xs">Data de Nascimento*</label><input type="date" name="dataNascimento" value={colaboradorEditando.dataNascimento || ''} onChange={handleChangeColaborador} required className={inputClasses}/></div>
                </div>
            </fieldset>
            <fieldset className="border p-3 rounded-md dark:border-gray-600"><legend className="px-1">Dados Contratuais</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><label className="text-xs">Data de Admissão*</label><input type="date" name="dataAdmissao" value={colaboradorEditando.dataAdmissao || ''} onChange={handleChangeColaborador} required className={inputClasses}/></div>
                    <div><label className="text-xs">Cargo*</label><input type="text" name="cargo" value={colaboradorEditando.cargo || ''} onChange={handleChangeColaborador} required className={inputClasses}/></div>
                    <div><label className="text-xs">Salário Base (R$)*</label><input type="number" step="0.01" name="salarioBase" value={colaboradorEditando.salarioBase || 0} onChange={handleChangeColaborador} required className={inputClasses}/></div>
                    <div><label className="text-xs">Departamento</label><input type="text" name="departamento" value={colaboradorEditando.departamento || ''} onChange={handleChangeColaborador} className={inputClasses}/></div>
                    <div><label className="text-xs">Centro de Custo</label><input type="text" name="centroCusto" value={colaboradorEditando.centroCusto || ''} onChange={handleChangeColaborador} className={inputClasses}/></div>
                    <div><label className="text-xs">Status*</label><select name="ativo" value={colaboradorEditando.ativo ? 'true' : 'false'} onChange={e => handleChangeColaborador({target: {name: 'ativo', value: e.target.value === 'true', type: 'select-one'}} as any)} className={selectClasses}><option value="true">Ativo</option><option value="false">Inativo</option></select></div>
                    {!colaboradorEditando.ativo && (<div><label className="text-xs">Data de Demissão*</label><input type="date" name="dataDemissao" value={colaboradorEditando.dataDemissao || ''} onChange={handleChangeColaborador} required={!colaboradorEditando.ativo} className={inputClasses}/></div>)}
                </div>
            </fieldset>
            <fieldset className="border p-3 rounded-md dark:border-gray-600"><legend className="px-1">Endereço</legend>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div><label className="text-xs">CEP</label><input type="text" name="endereco.cep" value={colaboradorEditando.endereco?.cep || ''} onChange={handleChangeColaborador} className={inputClasses}/></div>
                    <div className="md:col-span-2"><label className="text-xs">Logradouro</label><input type="text" name="endereco.logradouro" value={colaboradorEditando.endereco?.logradouro || ''} onChange={handleChangeColaborador} className={inputClasses}/></div>
                    <div><label className="text-xs">Número</label><input type="text" name="endereco.numero" value={colaboradorEditando.endereco?.numero || ''} onChange={handleChangeColaborador} className={inputClasses}/></div>
                    <div><label className="text-xs">Bairro</label><input type="text" name="endereco.bairro" value={colaboradorEditando.endereco?.bairro || ''} onChange={handleChangeColaborador} className={inputClasses}/></div>
                    <div><label className="text-xs">Cidade</label><input type="text" name="endereco.cidade" value={colaboradorEditando.endereco?.cidade || ''} onChange={handleChangeColaborador} className={inputClasses}/></div>
                    <div><label className="text-xs">UF</label><input type="text" name="endereco.uf" value={colaboradorEditando.endereco?.uf || ''} onChange={handleChangeColaborador} maxLength={2} className={inputClasses}/></div>
                 </div>
            </fieldset>
            <fieldset className="border p-3 rounded-md dark:border-gray-600"><legend className="px-1">Dados Bancários</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><label className="text-xs">Banco</label><input type="text" name="dadosBancarios.banco" value={colaboradorEditando.dadosBancarios?.banco || ''} onChange={handleChangeColaborador} className={inputClasses}/></div>
                    <div><label className="text-xs">Agência</label><input type="text" name="dadosBancarios.agencia" value={colaboradorEditando.dadosBancarios?.agencia || ''} onChange={handleChangeColaborador} className={inputClasses}/></div>
                    <div><label className="text-xs">Conta Corrente</label><input type="text" name="dadosBancarios.contaCorrente" value={colaboradorEditando.dadosBancarios?.contaCorrente || ''} onChange={handleChangeColaborador} className={inputClasses}/></div>
                    <div><label className="text-xs">Tipo Conta</label><select name="dadosBancarios.tipoConta" value={colaboradorEditando.dadosBancarios?.tipoConta || 'CORRENTE'} onChange={handleChangeColaborador} className={selectClasses}><option value="CORRENTE">Corrente</option><option value="POUPANCA">Poupança</option><option value="SALARIO">Salário</option></select></div>
                    <div><label className="text-xs">Chave PIX</label><input type="text" name="dadosBancarios.pix" value={colaboradorEditando.dadosBancarios?.pix || ''} onChange={handleChangeColaborador} className={inputClasses}/></div>
                 </div>
            </fieldset>
            <fieldset className="border p-3 rounded-md dark:border-gray-600"><legend className="px-1">Outras Informações</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><label className="text-xs">Email Profissional</label><input type="email" name="emailProfissional" value={colaboradorEditando.emailProfissional || ''} onChange={handleChangeColaborador} className={inputClasses}/></div>
                    <div><label className="text-xs">Telefone de Contato</label><input type="tel" name="telefoneContato" value={colaboradorEditando.telefoneContato || ''} onChange={handleChangeColaborador} className={inputClasses}/></div>
                    <div><label className="text-xs">Matrícula eSocial</label><input type="text" name="matriculaESocial" value={colaboradorEditando.matriculaESocial || ''} onChange={handleChangeColaborador} className={inputClasses}/></div>
                    <div><label className="text-xs">Categoria Trabalhador eSocial</label><input type="text" name="categoriaTrabalhadorESocial" value={colaboradorEditando.categoriaTrabalhadorESocial || ''} onChange={handleChangeColaborador} className={inputClasses} placeholder="Ex: 101"/></div>
                 </div>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Gerenciamento de Dependentes será implementado em breve.</p>
            </fieldset>
            <div className="mt-6 text-right space-x-2">
              <Button type="button" variant="secondary" onClick={() => setModalColaboradorAberto(false)}>Cancelar</Button>
              <Button type="submit">Salvar Colaborador</Button>
            </div>
          </form>
        </Modal>
      )}
      <style>{`.text-xxs { font-size: 0.65rem; line-height: 0.9rem; }`}</style>
    </div>
  );
};

export default FolhaPagamentoPage;
