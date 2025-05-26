
import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeEmpresa, IconeFiscal, IconeGrupoUsuarios } from '../components/common/Icons'; 
import { Empresa, StatusEmpresa, Endereco, RegimeTributario, TipoEmpresaSimulacao, FuncaoUsuario, ConfiguracoesEmissor, Usuario } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Fix: Export STORAGE_KEY_PREFIX
export const STORAGE_KEY_PREFIX = 'nixconPortalEmpresas_';

const inputStyles = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm";
const selectStyles = "mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm";

const EmpresasPage: React.FC = () => {
  const { usuarioAtual, tenantAtual, iniciarPersonificacao } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [modalEmpresaAberto, setModalEmpresaAberto] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState<Partial<Empresa> | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<StatusEmpresa | ''>('');

  // Sub-modal para usuários da empresa
  const [modalUsuarioEmpresaAberto, setModalUsuarioEmpresaAberto] = useState(false);
  const [usuarioEmpresaEditando, setUsuarioEmpresaEditando] = useState<Partial<Usuario> | null>(null);
  const [abaModalEmpresa, setAbaModalEmpresa] = useState<'dados' | 'emissor' | 'usuarios'>('dados');

  // Estado para modal de opções de personificação
  const [modalOpcoesPersonificacaoAberto, setModalOpcoesPersonificacaoAberto] = useState(false);
  const [empresaParaOpcoesPersonificacao, setEmpresaParaOpcoesPersonificacao] = useState<Empresa | null>(null);
  const [usuarioEspecificoParaPersonificarId, setUsuarioEspecificoParaPersonificarId] = useState<string>('');


  const getStorageKey = () => tenantAtual ? `${STORAGE_KEY_PREFIX}${tenantAtual.id}` : null;

  const emptyEndereco: Endereco = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' };
  const emptyConfigEmissor: ConfiguracoesEmissor = {
      cnpj: '', razaoSocial: '', nomeFantasia: '', inscricaoEstadual: '', inscricaoMunicipal: '',
      endereco: { ...emptyEndereco }, regimeTributario: undefined, telefone: '', email: '',
      cnaePrincipal: '', listaServicos: '', integraNotasApiKey: '', certificadoConfigurado: false, nomeCertificado: ''
  };

  useEffect(() => {
    const storageKey = getStorageKey();
    if (storageKey) {
      const empresasSalvas = localStorage.getItem(storageKey);
      if (empresasSalvas) {
        const parsedEmpresas: Empresa[] = JSON.parse(empresasSalvas);
        const empresasNormalizadas = parsedEmpresas.map(emp => ({
            ...emp,
            configuracoesEmissor: {
                ...emptyConfigEmissor,
                ...(emp.configuracoesEmissor || {}),
                endereco: emp.configuracoesEmissor?.endereco ? { ...emptyEndereco, ...emp.configuracoesEmissor.endereco } : { ...emptyEndereco }
            },
            endereco: emp.endereco ? { ...emptyEndereco, ...emp.endereco } : { ...emptyEndereco },
            usuariosDaEmpresa: emp.usuariosDaEmpresa || [], 
        }));
        setEmpresas(empresasNormalizadas);
      } else {
        const agora = new Date().toISOString();
        const mockInitialEmpresasData = [
           { 
            id: 'emp1-cliente-real', nome: 'BIOSOLARIS - SEG AMBIENTAL E ENERGIAS RENOVÁVEIS', cnpj: '26346739000143', email: 'ea.claudinei@gmail.com', telefone: '45999154847', 
            status: 'ATIVO' as StatusEmpresa, 
            regimeTributario: 'SIMPLES_NACIONAL' as RegimeTributario, honorarios: 350, diaVencimentoHonorarios: 7, dataInicioContrato: '2023-01-01', endereco: { cep: '85877000', logradouro: 'RUA ALFREDO CHAVES', numero: '308', complemento: 'SALA 02', bairro: 'CENTRO', cidade: 'SÃO MIGUEL DO IGUAÇU', uf: 'PR' } as Endereco, cpfResponsavelLegal: '05201967914', tenantId: tenantAtual!.id, dataCadastro: agora, dataAtualizacao: agora, tipoEmpresaSimulacao: 'NORMAL' as TipoEmpresaSimulacao, 
            configuracoesEmissor: {cnpj: '26346739000143', razaoSocial: 'BIOSOLARIS...', certificadoConfigurado: true, endereco: { cep: '85877000', logradouro: 'RUA ALFREDO CHAVES', numero: '308', complemento: 'SALA 02', bairro: 'CENTRO', cidade: 'SÃO MIGUEL DO IGUAÇU', uf: 'PR' } as Endereco} as ConfiguracoesEmissor, 
            usuariosDaEmpresa: [
                { id: 'user-biosolaris-admin', nome: 'Admin Biosolaris', email: 'admin@biosolaris.com', funcao: FuncaoUsuario.ADMIN_CLIENTE, tenantId: 'emp1-cliente-real', ativo: true },
                { id: 'user-biosolaris-user', nome: 'User Biosolaris', email: 'user@biosolaris.com', funcao: FuncaoUsuario.USUARIO_CLIENTE, tenantId: 'emp1-cliente-real', ativo: true },
            ]
          },
          { 
            id: 'emp2-cliente-real', nome: 'DIGNITATE DISTRIBUIDORA DE UTENSILIOS DOMESTICOS', cnpj: '33038489000140', email: 'emersonbraz70@gmail.com', telefone: '44998607000', 
            status: 'ATIVO' as StatusEmpresa, 
            regimeTributario: 'LUCRO_PRESUMIDO' as RegimeTributario, honorarios: 395, diaVencimentoHonorarios: 7, dataInicioContrato: '2022-05-10', endereco: { cep: '87015370', logradouro: 'RUA EMÍLIO DE MENEZES', numero: '39', complemento: 'SALA 01', bairro: 'ZONA 05', cidade: 'MARINGÁ', uf: 'PR' } as Endereco, cpfResponsavelLegal: '77141458972', tenantId: tenantAtual!.id, dataCadastro: agora, dataAtualizacao: agora, tipoEmpresaSimulacao: 'HY_CITE' as TipoEmpresaSimulacao, 
            configuracoesEmissor: {cnpj: '33038489000140', razaoSocial: 'DIGNITATE...', certificadoConfigurado: true, endereco: { cep: '87015370', logradouro: 'RUA EMÍLIO DE MENEZES', numero: '39', complemento: 'SALA 01', bairro: 'ZONA 05', cidade: 'MARINGÁ', uf: 'PR' } as Endereco} as ConfiguracoesEmissor, 
            usuariosDaEmpresa: [
                { id: 'user-dignitate-admin', nome: 'Admin Dignitate', email: 'admin@dignitate.com', funcao: FuncaoUsuario.ADMIN_CLIENTE, tenantId: 'emp2-cliente-real', ativo: true },
            ]
          },
        ];
        
        const mockInitialEmpresas: Empresa[] = mockInitialEmpresasData.map(empData => ({
            ...empData,
            configuracoesEmissor: {
                ...emptyConfigEmissor,
                ...(empData.configuracoesEmissor || {}),
                endereco: empData.configuracoesEmissor?.endereco ? { ...emptyEndereco, ...empData.configuracoesEmissor.endereco } : { ...emptyEndereco }
            },
             endereco: empData.endereco ? { ...emptyEndereco, ...empData.endereco } : { ...emptyEndereco },
             usuariosDaEmpresa: empData.usuariosDaEmpresa || [],
        }));
        setEmpresas(mockInitialEmpresas);
      }
    }
  }, [tenantAtual]);

  useEffect(() => {
    const storageKey = getStorageKey();
    if (storageKey && empresas.length >= 0) { 
      localStorage.setItem(storageKey, JSON.stringify(empresas));
    }
  }, [empresas, tenantAtual]);

  const handleAbrirModalEmpresa = (empresa?: Empresa) => {
    const agora = new Date().toISOString().split('T')[0];
    setAbaModalEmpresa('dados'); 
    if (empresa) {
      setEmpresaEditando({ 
        ...empresa,
        configuracoesEmissor: {
            ...emptyConfigEmissor,
            ...(empresa.configuracoesEmissor || {}),
            endereco: empresa.configuracoesEmissor?.endereco ? { ...emptyEndereco, ...empresa.configuracoesEmissor.endereco } : { ...emptyEndereco }
        },
        endereco: empresa.endereco ? { ...emptyEndereco, ...empresa.endereco } : { ...emptyEndereco },
        usuariosDaEmpresa: empresa.usuariosDaEmpresa || [],
      });
    } else {
      setEmpresaEditando({
        nome: '',
        cnpj: '',
        status: 'ATIVO',
        endereco: { ...emptyEndereco },
        configuracoesEmissor: { ...emptyConfigEmissor },
        dataInicioContrato: agora,
        diaVencimentoHonorarios: 7,
        regimeTributario: 'SIMPLES_NACIONAL',
        tipoEmpresaSimulacao: 'NORMAL',
        usuariosDaEmpresa: [] 
      });
    }
    setModalEmpresaAberto(true);
  };

  const handleFecharModalEmpresa = () => {
    setModalEmpresaAberto(false);
    setEmpresaEditando(null);
  };

  const handleChangeEmpresa = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
  
    setEmpresaEditando(prev => {
      if (!prev) return null;
      let finalValue: any = value;
      if (type === 'number') {
        finalValue = parseFloat(value);
        if (isNaN(finalValue)) finalValue = undefined;
      } else if (type === 'checkbox') {
        finalValue = checked;
      }
  
      if (name.startsWith("endereco.")) {
        const enderecoField = name.split(".")[1] as keyof Endereco;
        return {
          ...prev,
          endereco: {
            ...(prev.endereco || emptyEndereco),
            [enderecoField]: finalValue
          }
        };
      } else if (name.startsWith("configuracoesEmissor.endereco.")) {
        const enderecoEmissorField = name.split(".")[2] as keyof Endereco;
        return {
            ...prev,
            configuracoesEmissor: {
                ...(prev.configuracoesEmissor || emptyConfigEmissor),
                endereco: {
                    ...(prev.configuracoesEmissor?.endereco || emptyEndereco),
                    [enderecoEmissorField]: finalValue
                }
            }
        }
      } else if (name.startsWith("configuracoesEmissor.")) {
        const configField = name.split(".")[1] as keyof ConfiguracoesEmissor;
        return {
            ...prev,
            configuracoesEmissor: {
                ...(prev.configuracoesEmissor || emptyConfigEmissor),
                [configField]: finalValue
            }
        }
      }
      return { ...prev, [name]: finalValue };
    });
  };

  const handleSalvarEmpresa = (e: FormEvent) => {
    e.preventDefault();
    if (!empresaEditando || !empresaEditando.nome || !empresaEditando.cnpj || !tenantAtual) {
      alert("Nome e CNPJ da empresa são obrigatórios.");
      return;
    }

    const agora = new Date().toISOString();
    if (empresaEditando.id) { 
      setEmpresas(empresas.map(emp => 
        emp.id === empresaEditando!.id 
        ? { ...emp, ...empresaEditando, dataAtualizacao: agora } as Empresa
        : emp
      ));
    } else { 
      const novaEmpresa: Empresa = {
        id: `emp-${Date.now()}`, 
        dataCadastro: agora,
        dataAtualizacao: agora,
        tenantId: tenantAtual.id, 
        configuracoesEmissor: { ...emptyConfigEmissor, ...(empresaEditando.configuracoesEmissor || {}) },
        usuariosDaEmpresa: empresaEditando.usuariosDaEmpresa || [],
        endereco: { ...emptyEndereco, ...(empresaEditando.endereco || {}) },
        ...empresaEditando,
      } as Empresa;
      setEmpresas(prevEmpresas => [novaEmpresa, ...prevEmpresas]);
    }
    handleFecharModalEmpresa();
  };
  
  const handleExcluirEmpresa = (idEmpresa: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.")) {
      setEmpresas(empresas.filter(emp => emp.id !== idEmpresa));
    }
  };

  const handleAbrirOpcoesPersonificacao = (empresa: Empresa) => {
    setEmpresaParaOpcoesPersonificacao(empresa);
    setUsuarioEspecificoParaPersonificarId(''); // Reseta a seleção de usuário específico
    setModalOpcoesPersonificacaoAberto(true);
  };

  const handleFecharOpcoesPersonificacao = () => {
    setModalOpcoesPersonificacaoAberto(false);
    setEmpresaParaOpcoesPersonificacao(null);
    setUsuarioEspecificoParaPersonificarId('');
  };

  const handleConfirmarPersonificacao = (roleToPersonify: FuncaoUsuario, userId?: string) => {
    if (empresaParaOpcoesPersonificacao) {
      iniciarPersonificacao(empresaParaOpcoesPersonificacao, roleToPersonify, userId);
      handleFecharOpcoesPersonificacao();
      if (modalEmpresaAberto) handleFecharModalEmpresa();
    }
  };

  const handlePersonificarUsuarioEspecifico = () => {
    if (empresaParaOpcoesPersonificacao && usuarioEspecificoParaPersonificarId) {
        const usuarioSelecionado = empresaParaOpcoesPersonificacao.usuariosDaEmpresa?.find(u => u.id === usuarioEspecificoParaPersonificarId);
        if (usuarioSelecionado) {
            handleConfirmarPersonificacao(usuarioSelecionado.funcao, usuarioSelecionado.id);
        } else {
            alert("Usuário selecionado não encontrado.");
        }
    }
  };


  // Funções para Gerenciamento de Usuários da Empresa
  const handleAbrirModalUsuarioEmpresa = (usuario?: Usuario) => {
    if (usuario) {
      setUsuarioEmpresaEditando({ ...usuario });
    } else {
      setUsuarioEmpresaEditando({ nome: '', email: '', funcao: FuncaoUsuario.USUARIO_CLIENTE, ativo: true });
    }
    setModalUsuarioEmpresaAberto(true);
  };

  const handleFecharModalUsuarioEmpresa = () => {
    setModalUsuarioEmpresaAberto(false);
    setUsuarioEmpresaEditando(null);
  };

  const handleChangeUsuarioEmpresa = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setUsuarioEmpresaEditando(prev => prev ? { ...prev, [name]: type === 'checkbox' ? checked : value } : null);
  };

  const handleSalvarUsuarioEmpresa = (e: FormEvent) => {
    e.preventDefault();
    if (!usuarioEmpresaEditando || !usuarioEmpresaEditando.nome || !usuarioEmpresaEditando.email || !empresaEditando) {
      alert("Nome e Email do usuário são obrigatórios.");
      return;
    }

    const currentUsuariosDaEmpresa = empresaEditando.usuariosDaEmpresa || [];
    const emailJaExiste = currentUsuariosDaEmpresa.some(u => u.email === usuarioEmpresaEditando.email && u.id !== usuarioEmpresaEditando.id);
    if (emailJaExiste) {
        alert("Este e-mail já está em uso por outro usuário nesta empresa.");
        return;
    }
    
    let usuariosAtualizados: Usuario[];
    if (usuarioEmpresaEditando.id) { 
      usuariosAtualizados = currentUsuariosDaEmpresa.map(u => 
        u.id === usuarioEmpresaEditando!.id ? { ...u, ...usuarioEmpresaEditando } as Usuario : u
      );
    } else { 
      const novoUsuario: Usuario = {
        id: `user-emp-${Date.now()}`,
        tenantId: empresaEditando.id!, 
        avatarUrl: `https://picsum.photos/seed/${usuarioEmpresaEditando.email}/100/100`,
        ...usuarioEmpresaEditando,
      } as Usuario;
      usuariosAtualizados = [...currentUsuariosDaEmpresa, novoUsuario];
    }
    setEmpresaEditando(prev => prev ? { ...prev, usuariosDaEmpresa: usuariosAtualizados } : null);
    handleFecharModalUsuarioEmpresa();
  };

  const handleRemoverUsuarioDaEmpresa = (idUsuario: string) => {
    if (window.confirm("Tem certeza que deseja remover este usuário da empresa?")) {
      setEmpresaEditando(prev => {
        if (!prev || !prev.usuariosDaEmpresa) return prev;
        return {
          ...prev,
          usuariosDaEmpresa: prev.usuariosDaEmpresa.filter(u => u.id !== idUsuario),
        };
      });
    }
  };

  const funcoesUsuarioEmpresa: { value: FuncaoUsuario; label: string }[] = [
    { value: FuncaoUsuario.ADMIN_CLIENTE, label: 'Admin da Empresa Cliente' },
    { value: FuncaoUsuario.USUARIO_CLIENTE, label: 'Usuário da Empresa Cliente' },
    { value: FuncaoUsuario.USUARIO_EXTERNO_CLIENTE, label: 'Usuário Externo Convidado' },
    { value: FuncaoUsuario.CONTADOR_EXTERNO_CLIENTE, label: 'Contador Externo da Empresa' },
  ];


  const empresasFiltradas = useMemo(() => {
    return empresas.filter(emp => filtroStatus ? emp.status === filtroStatus : true);
  }, [empresas, filtroStatus]);
  
  const regimesTributariosOptions: { value: RegimeTributario; label: string }[] = [
    { value: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
    { value: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido' },
    { value: 'LUCRO_REAL', label: 'Lucro Real' },
    { value: 'MEI', label: 'MEI' },
    { value: 'OUTRO', label: 'Outro' },
  ];

  const statusEmpresaOptions: { value: StatusEmpresa; label: string }[] = [
    { value: 'ATIVO', label: 'Ativo' },
    { value: 'MOVIMENTO', label: 'Em Movimento' },
    { value: 'BAIXADO', label: 'Baixado' },
    { value: 'SUSPENSO', label: 'Suspenso' },
    { value: 'PROSPECCAO', label: 'Prospecção' },
  ];
  
  const tiposEmpresaSimulacaoOptions: {value: TipoEmpresaSimulacao, label: string}[] = [
    {value: 'NORMAL', label: 'Normal'},
    {value: 'HY_CITE', label: 'Hy Cite'},
  ];

  const podePersonificar = usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark flex items-center mb-4 sm:mb-0">
          <IconeEmpresa className="w-8 h-8 mr-3 text-nixcon-gold" />
          Cadastro de Empresas Clientes
        </h1>
        <Button onClick={() => handleAbrirModalEmpresa()}>Nova Empresa</Button>
      </div>
      
      <Card className="shadow-lg">
        <h2 className="text-xl font-semibold text-nixcon-dark mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input type="text" placeholder="Buscar por nome ou CNPJ..." className={inputStyles} />
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as StatusEmpresa | '')} className={selectStyles}>
            <option value="">Todos Status</option>
            {statusEmpresaOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <Button variant="secondary" onClick={() => alert("Filtro aplicado (mock)")}>Aplicar Filtros</Button>
        </div>
      </Card>

      <Card className="shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Honorários</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venc.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {empresasFiltradas.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-nixcon-dark">{emp.nome}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{emp.cnpj}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      emp.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 
                      emp.status === 'MOVIMENTO' ? 'bg-blue-100 text-blue-800' :
                      emp.status === 'BAIXADO' ? 'bg-gray-200 text-gray-700 line-through' :
                      emp.status === 'SUSPENSO' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-purple-100 text-purple-800' 
                    }`}>
                      {statusEmpresaOptions.find(s => s.value === emp.status)?.label || emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{emp.honorarios ? emp.honorarios.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{emp.diaVencimentoHonorarios || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-1">
                    {podePersonificar && (
                         <Button onClick={() => handleAbrirOpcoesPersonificacao(emp)} variant="secondary" size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">Personificar</Button>
                    )}
                    <Button onClick={() => handleAbrirModalEmpresa(emp)} variant="ghost" size="sm">Editar</Button>
                    <Button onClick={() => handleExcluirEmpresa(emp.id)} variant="danger" size="sm">Excluir</Button>
                  </td>
                </tr>
              ))}
              {empresasFiltradas.length === 0 && (
                <tr><td colSpan={6} className="text-center py-4 text-gray-500">Nenhuma empresa encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Principal de Edição/Criação de Empresa */}
      {modalEmpresaAberto && empresaEditando && (
        <Modal isOpen={modalEmpresaAberto} onClose={handleFecharModalEmpresa} title={empresaEditando.id ? 'Editar Empresa Cliente' : 'Nova Empresa Cliente'}>
          <form onSubmit={handleSalvarEmpresa} className="space-y-4 max-h-[80vh] flex flex-col">
            {/* Abas do Modal */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button type="button" onClick={() => setAbaModalEmpresa('dados')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${abaModalEmpresa === 'dados' ? 'border-nixcon-gold text-nixcon-gold' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Dados Cadastrais
                </button>
                <button type="button" onClick={() => setAbaModalEmpresa('emissor')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${abaModalEmpresa === 'emissor' ? 'border-nixcon-gold text-nixcon-gold' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Config. Emissor
                </button>
                <button type="button" onClick={() => setAbaModalEmpresa('usuarios')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${abaModalEmpresa === 'usuarios' ? 'border-nixcon-gold text-nixcon-gold' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Usuários da Empresa
                </button>
              </nav>
            </div>

            <div className="overflow-y-auto px-1 flex-grow">
              {/* Conteúdo da Aba Dados Cadastrais */}
              {abaModalEmpresa === 'dados' && (
                <div className="space-y-4">
                  <fieldset className="border p-3 rounded-md">
                      <legend className="text-md font-medium text-nixcon-dark px-1">Dados Cadastrais</legend>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                          <div><label className="text-xs">Nome*</label><input type="text" name="nome" value={empresaEditando.nome || ''} onChange={handleChangeEmpresa} required className={inputStyles} /></div>
                          <div><label className="text-xs">CNPJ*</label><input type="text" name="cnpj" value={empresaEditando.cnpj || ''} onChange={handleChangeEmpresa} required className={inputStyles} /></div>
                          <div><label className="text-xs">Email</label><input type="email" name="email" value={empresaEditando.email || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                          <div><label className="text-xs">Telefone</label><input type="tel" name="telefone" value={empresaEditando.telefone || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                          <div><label className="text-xs">Contato Principal</label><input type="text" name="contatoPrincipal" value={empresaEditando.contatoPrincipal || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                          <div><label className="text-xs">CPF Resp. Legal</label><input type="text" name="cpfResponsavelLegal" value={empresaEditando.cpfResponsavelLegal || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                          <div><label className="text-xs">Status*</label><select name="status" value={empresaEditando.status || 'ATIVO'} onChange={handleChangeEmpresa} className={selectStyles}>{statusEmpresaOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                          <div><label className="text-xs">Regime Tributário</label><select name="regimeTributario" value={empresaEditando.regimeTributario || ''} onChange={handleChangeEmpresa} className={selectStyles}><option value="">Selecione...</option>{regimesTributariosOptions.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}</select></div>
                          <div><label className="text-xs">Tipo Empresa (Simulação)</label><select name="tipoEmpresaSimulacao" value={empresaEditando.tipoEmpresaSimulacao || 'NORMAL'} onChange={handleChangeEmpresa} className={selectStyles}>{tiposEmpresaSimulacaoOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                      </div>
                  </fieldset>
                  <fieldset className="border p-3 rounded-md"><legend className="text-md font-medium text-nixcon-dark px-1">Contrato e Financeiro</legend><div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1"><div><label className="text-xs">Honorários (R$)</label><input type="number" step="0.01" name="honorarios" value={empresaEditando.honorarios || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div><div><label className="text-xs">Dia Venc. Honorários</label><input type="number" min="1" max="31" name="diaVencimentoHonorarios" value={empresaEditando.diaVencimentoHonorarios || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div><div><label className="text-xs">Início Contrato</label><input type="date" name="dataInicioContrato" value={empresaEditando.dataInicioContrato || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div><div><label className="text-xs">Fim Contrato</label><input type="date" name="dataFimContrato" value={empresaEditando.dataFimContrato || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div></div></fieldset>
                  <fieldset className="border p-3 rounded-md"><legend className="text-md font-medium text-nixcon-dark px-1">Endereço Principal da Empresa</legend><div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1"><div><label className="text-xs">CEP*</label><input type="text" name="endereco.cep" value={empresaEditando.endereco?.cep || ''} onChange={handleChangeEmpresa} required className={inputStyles} /></div><div className="md:col-span-2"><label className="text-xs">Logradouro*</label><input type="text" name="endereco.logradouro" value={empresaEditando.endereco?.logradouro || ''} onChange={handleChangeEmpresa} required className={inputStyles} /></div><div><label className="text-xs">Número*</label><input type="text" name="endereco.numero" value={empresaEditando.endereco?.numero || ''} onChange={handleChangeEmpresa} required className={inputStyles} /></div><div><label className="text-xs">Complemento</label><input type="text" name="endereco.complemento" value={empresaEditando.endereco?.complemento || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div><div><label className="text-xs">Bairro*</label><input type="text" name="endereco.bairro" value={empresaEditando.endereco?.bairro || ''} onChange={handleChangeEmpresa} required className={inputStyles} /></div><div><label className="text-xs">Cidade*</label><input type="text" name="endereco.cidade" value={empresaEditando.endereco?.cidade || ''} onChange={handleChangeEmpresa} required className={inputStyles} /></div><div><label className="text-xs">UF*</label><input type="text" name="endereco.uf" value={empresaEditando.endereco?.uf || ''} onChange={handleChangeEmpresa} required maxLength={2} className={inputStyles} /></div></div></fieldset>
                </div>
              )}

              {/* Conteúdo da Aba Config. Emissor */}
              {abaModalEmpresa === 'emissor' && (
                <fieldset className="border p-3 rounded-md mt-0 border-nixcon-gold">
                    <legend className="text-md font-medium text-nixcon-dark px-1 flex items-center"><IconeFiscal className="w-5 h-5 mr-2 text-nixcon-gold" />Configurações do Emissor (Empresa Cliente)</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                        <div><label className="text-xs">Razão Social (Emissor)</label><input type="text" name="configuracoesEmissor.razaoSocial" value={empresaEditando.configuracoesEmissor?.razaoSocial || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                        <div><label className="text-xs">Nome Fantasia (Emissor)</label><input type="text" name="configuracoesEmissor.nomeFantasia" value={empresaEditando.configuracoesEmissor?.nomeFantasia || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                        <div><label className="text-xs">CNPJ (Emissor)</label><input type="text" name="configuracoesEmissor.cnpj" value={empresaEditando.configuracoesEmissor?.cnpj || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                        <div><label className="text-xs">Inscrição Estadual (Emissor)</label><input type="text" name="configuracoesEmissor.inscricaoEstadual" value={empresaEditando.configuracoesEmissor?.inscricaoEstadual || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                        <div><label className="text-xs">Inscrição Municipal (Emissor)</label><input type="text" name="configuracoesEmissor.inscricaoMunicipal" value={empresaEditando.configuracoesEmissor?.inscricaoMunicipal || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                        <div><label className="text-xs">Regime Tributário (Emissor)</label><select name="configuracoesEmissor.regimeTributario" value={empresaEditando.configuracoesEmissor?.regimeTributario || ''} onChange={handleChangeEmpresa} className={selectStyles}><option value="">Selecione...</option>{regimesTributariosOptions.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}</select></div>
                        <div><label className="text-xs">CNAE Principal (NFS-e)</label><input type="text" name="configuracoesEmissor.cnaePrincipal" value={empresaEditando.configuracoesEmissor?.cnaePrincipal || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                        <div><label className="text-xs">Cód. Serviço Municipal (NFS-e)</label><input type="text" name="configuracoesEmissor.listaServicos" value={empresaEditando.configuracoesEmissor?.listaServicos || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                        <div><label className="text-xs">Telefone (Emissor)</label><input type="tel" name="configuracoesEmissor.telefone" value={empresaEditando.configuracoesEmissor?.telefone || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                        <div><label className="text-xs">Email para Notas (Emissor)</label><input type="email" name="configuracoesEmissor.email" value={empresaEditando.configuracoesEmissor?.email || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Endereço do Emissor (Empresa Cliente)</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                        <div><label className="text-xs">CEP</label><input type="text" name="configuracoesEmissor.endereco.cep" value={empresaEditando.configuracoesEmissor?.endereco?.cep || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                        <div className="md:col-span-2"><label className="text-xs">Logradouro</label><input type="text" name="configuracoesEmissor.endereco.logradouro" value={empresaEditando.configuracoesEmissor?.endereco?.logradouro || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                        <div><label className="text-xs">Número</label><input type="text" name="configuracoesEmissor.endereco.numero" value={empresaEditando.configuracoesEmissor?.endereco?.numero || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                        <div><label className="text-xs">Bairro</label><input type="text" name="configuracoesEmissor.endereco.bairro" value={empresaEditando.configuracoesEmissor?.endereco?.bairro || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                        <div><label className="text-xs">Cidade</label><input type="text" name="configuracoesEmissor.endereco.cidade" value={empresaEditando.configuracoesEmissor?.endereco?.cidade || ''} onChange={handleChangeEmpresa} className={inputStyles} /></div>
                        <div><label className="text-xs">UF</label><input type="text" name="configuracoesEmissor.endereco.uf" value={empresaEditando.configuracoesEmissor?.endereco?.uf || ''} onChange={handleChangeEmpresa} maxLength={2} className={inputStyles} /></div>
                    </div>
                    <div className="mt-3 flex items-center"><input type="checkbox" name="configuracoesEmissor.certificadoConfigurado" id="certificadoConfiguradoCliente" checked={empresaEditando.configuracoesEmissor?.certificadoConfigurado || false} onChange={handleChangeEmpresa} className="h-4 w-4 text-nixcon-gold border-gray-300 rounded focus:ring-nixcon-gold" /><label htmlFor="certificadoConfiguradoCliente" className="ml-2 block text-sm text-gray-700">Certificado Digital da Empresa Cliente Configurado e Válido?</label></div>
                    <input type="text" placeholder="Nome/Referência do Certificado" name="configuracoesEmissor.nomeCertificado" value={empresaEditando.configuracoesEmissor?.nomeCertificado || ''} onChange={handleChangeEmpresa} className={`${inputStyles} mt-1`} />
                </fieldset>
              )}

              {/* Conteúdo da Aba Usuários da Empresa */}
              {abaModalEmpresa === 'usuarios' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                     <h3 className="text-md font-medium text-nixcon-dark flex items-center"><IconeGrupoUsuarios className="w-5 h-5 mr-2 text-nixcon-gold"/>Usuários Vinculados a Esta Empresa</h3>
                     <Button type="button" size="sm" onClick={() => handleAbrirModalUsuarioEmpresa()}>Adicionar Usuário</Button>
                  </div>
                   {(empresaEditando.usuariosDaEmpresa && empresaEditando.usuariosDaEmpresa.length > 0) ? (
                    <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto border rounded-md">
                        {empresaEditando.usuariosDaEmpresa.map(user => (
                            <li key={user.id} className="p-2 hover:bg-gray-50 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-nixcon-charcoal">{user.nome} <span className="text-xs text-gray-500">({user.email})</span></p>
                                    <p className="text-xs text-gray-600">Função: {user.funcao} - Status: <span className={user.ativo ? "text-green-600" : "text-red-600"}>{user.ativo ? 'Ativo' : 'Inativo'}</span></p>
                                </div>
                                <div className="space-x-1">
                                    <Button type="button" size="sm" variant="ghost" onClick={() => handleAbrirModalUsuarioEmpresa(user)}>Editar</Button>
                                    <Button type="button" size="sm" variant="danger" onClick={() => handleRemoverUsuarioDaEmpresa(user.id)}>Remover</Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                   ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Nenhum usuário vinculado a esta empresa ainda.</p>
                   )}
                </div>
              )}

            </div> {/* Fim do overflow-y-auto */}
            
            <div className="mt-auto pt-4 border-t text-right space-x-2">
              <Button type="button" variant="secondary" onClick={handleFecharModalEmpresa}>Cancelar</Button>
              <Button type="submit">Salvar Empresa</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Sub-Modal para Adicionar/Editar Usuário da Empresa */}
      {modalUsuarioEmpresaAberto && usuarioEmpresaEditando && (
        <Modal isOpen={modalUsuarioEmpresaAberto} onClose={handleFecharModalUsuarioEmpresa} title={usuarioEmpresaEditando.id ? 'Editar Usuário da Empresa' : 'Adicionar Usuário à Empresa'}>
          <form onSubmit={handleSalvarUsuarioEmpresa} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700">Nome*</label><input type="text" name="nome" value={usuarioEmpresaEditando.nome || ''} onChange={handleChangeUsuarioEmpresa} required className={inputStyles} /></div>
            <div><label className="block text-sm font-medium text-gray-700">Email*</label><input type="email" name="email" value={usuarioEmpresaEditando.email || ''} onChange={handleChangeUsuarioEmpresa} required className={inputStyles} /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Função na Empresa*</label>
              <select name="funcao" value={usuarioEmpresaEditando.funcao || FuncaoUsuario.USUARIO_CLIENTE} onChange={handleChangeUsuarioEmpresa} required className={selectStyles}>
                {funcoesUsuarioEmpresa.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="flex items-center">
                <input type="checkbox" name="ativo" id="usuarioEmpresaAtivo" checked={usuarioEmpresaEditando.ativo || false} onChange={handleChangeUsuarioEmpresa} className="h-4 w-4 text-nixcon-gold border-gray-300 rounded focus:ring-nixcon-gold" />
                <label htmlFor="usuarioEmpresaAtivo" className="ml-2 block text-sm text-gray-700">Usuário Ativo nesta empresa</label>
            </div>
            <div className="mt-6 text-right space-x-2">
              <Button type="button" variant="secondary" onClick={handleFecharModalUsuarioEmpresa}>Cancelar</Button>
              <Button type="submit">Salvar Usuário na Empresa</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de Opções de Personificação */}
      {modalOpcoesPersonificacaoAberto && empresaParaOpcoesPersonificacao && (
        <Modal isOpen={modalOpcoesPersonificacaoAberto} onClose={handleFecharOpcoesPersonificacao} title={`Personificar ${empresaParaOpcoesPersonificacao.nome}`}>
            <div className="space-y-4">
                <p className="text-sm text-gray-600">Selecione como você deseja personificar esta empresa:</p>
                <Button 
                    fullWidth 
                    onClick={() => handleConfirmarPersonificacao(FuncaoUsuario.ADMIN_CLIENTE)}
                    className="justify-start"
                >
                    Como Administrador da Empresa Cliente
                </Button>
                <Button 
                    fullWidth 
                    onClick={() => handleConfirmarPersonificacao(FuncaoUsuario.USUARIO_CLIENTE)}
                    className="justify-start"
                    variant="secondary"
                >
                    Como Usuário Padrão da Empresa Cliente
                </Button>
                
                {/* Personificar usuário específico */}
                {(empresaParaOpcoesPersonificacao.usuariosDaEmpresa && empresaParaOpcoesPersonificacao.usuariosDaEmpresa.length > 0) && (
                    <div className="pt-4 border-t">
                        <label htmlFor="usuarioEspecificoPersonificar" className="block text-sm font-medium text-gray-700 mb-1">Ou personificar um usuário específico:</label>
                        <div className="flex space-x-2 items-center">
                            <select 
                                id="usuarioEspecificoPersonificar" 
                                value={usuarioEspecificoParaPersonificarId}
                                onChange={(e) => setUsuarioEspecificoParaPersonificarId(e.target.value)}
                                className={`${selectStyles} flex-grow`}
                            >
                                <option value="">Selecione um usuário...</option>
                                {empresaParaOpcoesPersonificacao.usuariosDaEmpresa.map(user => (
                                    <option key={user.id} value={user.id}>{user.nome} ({user.funcao})</option>
                                ))}
                            </select>
                            <Button 
                                onClick={handlePersonificarUsuarioEspecifico} 
                                disabled={!usuarioEspecificoParaPersonificarId}
                                size="sm"
                            >
                                Personificar Usuário
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-6 text-right">
                <Button variant="ghost" onClick={handleFecharOpcoesPersonificacao}>Cancelar</Button>
            </div>
        </Modal>
      )}

    </div>
  );
};

export default EmpresasPage;
