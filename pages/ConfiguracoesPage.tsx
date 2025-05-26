
import React, { useState, useEffect, ChangeEvent, FormEvent, useMemo } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeConfiguracoes, IconeFiscal, IconeGrupoUsuarios, IconeEmpresa as IconeEmpresaCliente, IconeUpload, IconeTarefas, IconeFinanceiro as IconeModuloFinanceiro, IconeDocumentos as IconeModuloDocumentos } from '../components/common/Icons'; 
import { useAuth } from '../contexts/AuthContext';
import { FuncaoUsuario, ConfiguracoesEmissor, Endereco, RegimeTributario, Usuario, Empresa, StatusEmpresa, TipoEmpresaSimulacao, ConfiguracoesVisuais, ModuloConfigs, FiscalModuloConfig, FinanceiroModuloConfig, TarefasModuloConfig, DocumentosModuloConfig } from '../types';
import { Link } from 'react-router-dom';


interface SettingsSectionProps {
  titulo: string;
  descricao: string;
  icone: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  funcoesPermitidas?: FuncaoUsuario[];
  children?: React.ReactNode; 
}

const SettingsSectionCard: React.FC<SettingsSectionProps> = ({ titulo, descricao, icone, funcoesPermitidas, children }) => {
  const { usuarioAtual } = useAuth();

  if (funcoesPermitidas && usuarioAtual && !funcoesPermitidas.includes(usuarioAtual.funcao)) {
    return null; 
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-start mb-4">
        {React.cloneElement(icone, { className: "w-10 h-10 text-nixcon-gold mr-4 mt-1 flex-shrink-0" })}
        <div>
          <h3 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light">{titulo}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{descricao}</p>
        </div>
      </div>
      {children}
    </Card>
  );
};

const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm";
const selectClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm";
const emptyEndereco: Endereco = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' };
const emptyConfigEmissor: ConfiguracoesEmissor = {
    cnpj: '', razaoSocial: '', nomeFantasia: '', inscricaoEstadual: '', inscricaoMunicipal: '',
    endereco: { ...emptyEndereco }, regimeTributario: undefined, telefone: '', email: '',
    cnaePrincipal: '', listaServicos: '', integraNotasApiKey: '', certificadoConfigurado: false, nomeCertificado: ''
};
const emptyConfiguracoesVisuais: ConfiguracoesVisuais = {
    logoPrincipalUrl: '', logoReduzidaUrl: '', avatarPadraoUrl: ''
};
const emptyModuloConfigs: ModuloConfigs = {
    fiscal: { ambienteEmissaoNFe: 'HOMOLOGACAO' },
    financeiro: {},
    tarefas: { notificarResponsavelEmail: true, prazoPadraoDias: 7 },
    documentos: { categoriaPadraoUpload: 'Outros', habilitarVersionamento: false }
};


const regimesTributariosOptions: { value: RegimeTributario; label: string }[] = [
    { value: 'SIMPLES_NACIONAL', label: 'Simples Nacional' }, { value: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido' },
    { value: 'LUCRO_REAL', label: 'Lucro Real' },
    { value: 'MEI', label: 'MEI' }, { value: 'OUTRO', label: 'Outro' }
];


const ConfiguracoesPage: React.FC = () => {
  const { 
    usuarioAtual, 
    tenantAtual, 
    setTenantConfiguracoesEmissor, 
    salvarUsuariosDoTenant, 
    setTenantVisualConfigs,
    setTenantConfiguracoesModulos // Nova função do contexto
  } = useAuth();
  
  const [configEmissorForm, setConfigEmissorForm] = useState<ConfiguracoesEmissor>(emptyConfigEmissor);
  const [usuariosDoTenantForm, setUsuariosDoTenantForm] = useState<Usuario[]>([]);
  const [modalUsuarioAberto, setModalUsuarioAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Partial<Usuario> | null>(null);

  // Estados para Identidade Visual
  const [logoPrincipalPreview, setLogoPrincipalPreview] = useState<string | null>(null);
  const [logoReduzidaPreview, setLogoReduzidaPreview] = useState<string | null>(null);
  const [avatarPadraoPreview, setAvatarPadraoPreview] = useState<string | null>(null);
  
  // Estado para Configurações dos Módulos
  const [moduloConfigsForm, setModuloConfigsForm] = useState<ModuloConfigs>(emptyModuloConfigs);


  useEffect(() => {
    if (tenantAtual) {
      setConfigEmissorForm(tenantAtual.configuracoesEmissor || { ...emptyConfigEmissor });
      setUsuariosDoTenantForm(tenantAtual.usuariosDoTenant || []);
      setLogoPrincipalPreview(tenantAtual.configuracoesVisuais?.logoPrincipalUrl || null);
      setLogoReduzidaPreview(tenantAtual.configuracoesVisuais?.logoReduzidaUrl || null);
      setAvatarPadraoPreview(tenantAtual.configuracoesVisuais?.avatarPadraoUrl || null);
      setModuloConfigsForm(tenantAtual.configuracoesModulos || { ...emptyModuloConfigs });
    }
  }, [tenantAtual]);

  const handleChangeConfigEmissor = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setConfigEmissorForm(prev => {
        let finalValue: any = value;
        if (type === 'checkbox') finalValue = checked;

        if (name.startsWith("endereco.")) {
            const enderecoField = name.split(".")[1] as keyof Endereco;
            return { ...prev, endereco: { ...(prev.endereco || emptyEndereco), [enderecoField]: finalValue } };
        }
        return { ...prev, [name]: finalValue };
    });
  };

  const handleSalvarConfigEmissor = (e: FormEvent) => {
    e.preventDefault();
    if (tenantAtual) {
      setTenantConfiguracoesEmissor(configEmissorForm);
      alert("Configurações do emissor salvas com sucesso!");
    }
  };
  
  // Funções para Usuários do Escritório
  const handleAbrirModalUsuario = (usuario?: Usuario) => {
    setUsuarioEditando(usuario ? { ...usuario } : { nome: '', email: '', funcao: FuncaoUsuario.USUARIO_ESCRITORIO, ativo: true });
    setModalUsuarioAberto(true);
  };

  const handleFecharModalUsuario = () => {
    setModalUsuarioAberto(false);
    setUsuarioEditando(null);
  };

  const handleChangeUsuario = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setUsuarioEditando(prev => prev ? { ...prev, [name]: type === 'checkbox' ? checked : value } : null);
  };

  const handleSalvarUsuario = (e: FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando || !usuarioEditando.nome || !usuarioEditando.email || !tenantAtual) {
      alert("Nome e Email do usuário são obrigatórios.");
      return;
    }
    
    const emailJaExiste = usuariosDoTenantForm.some(u => u.email === usuarioEditando.email && u.id !== usuarioEditando.id);
    if (emailJaExiste) {
        alert("Este e-mail já está em uso por outro usuário neste escritório.");
        return;
    }

    let usuariosAtualizados: Usuario[];
    if (usuarioEditando.id) { 
      usuariosAtualizados = usuariosDoTenantForm.map(u => 
        u.id === usuarioEditando!.id ? { ...u, ...usuarioEditando } as Usuario : u
      );
    } else { 
      const novoUsuario: Usuario = {
        id: `user-esc-${Date.now()}`,
        tenantId: tenantAtual.id, 
        avatarUrl: `https://picsum.photos/seed/${usuarioEditando.email}/100/100`,
        ...usuarioEditando,
      } as Usuario;
      usuariosAtualizados = [...usuariosDoTenantForm, novoUsuario];
    }
    setUsuariosDoTenantForm(usuariosAtualizados);
    salvarUsuariosDoTenant(usuariosAtualizados); 
    handleFecharModalUsuario();
  };

  const handleRemoverUsuario = (idUsuario: string) => {
    if (window.confirm("Tem certeza que deseja remover este usuário do escritório?")) {
        const usuariosRestantes = usuariosDoTenantForm.filter(u => u.id !== idUsuario);
        setUsuariosDoTenantForm(usuariosRestantes);
        salvarUsuariosDoTenant(usuariosRestantes);
    }
  };

  const funcoesUsuarioEscritorio: { value: FuncaoUsuario; label: string }[] = [
    { value: FuncaoUsuario.ADMIN_ESCRITORIO, label: 'Admin do Escritório' },
    { value: FuncaoUsuario.USUARIO_ESCRITORIO, label: 'Usuário do Escritório' },
  ];

  // Funções para Identidade Visual
  const handleFileChangeVisuals = (event: ChangeEvent<HTMLInputElement>, type: 'principal' | 'reduzida' | 'avatar') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        switch (type) {
          case 'principal': setLogoPrincipalPreview(base64String); break;
          case 'reduzida': setLogoReduzidaPreview(base64String); break;
          case 'avatar': setAvatarPadraoPreview(base64String); break;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveVisualConfigs = () => {
    if (tenantAtual) {
      const newConfigs: ConfiguracoesVisuais = {
        logoPrincipalUrl: logoPrincipalPreview || undefined,
        logoReduzidaUrl: logoReduzidaPreview || undefined,
        avatarPadraoUrl: avatarPadraoPreview || undefined,
      };
      setTenantVisualConfigs(newConfigs);
      alert("Configurações de identidade visual salvas!");
    }
  };

  // Funções para Configurações dos Módulos
  const handleChangeModuloConfig = (moduleKey: keyof ModuloConfigs, field: string, value: any) => {
    setModuloConfigsForm(prev => ({
      ...prev,
      [moduleKey]: {
        ...(prev[moduleKey] || {}),
        [field]: value
      }
    }));
  };

  const handleSalvarModuloConfigs = (e: FormEvent) => {
    e.preventDefault();
    if (tenantAtual) {
      setTenantConfiguracoesModulos(moduloConfigsForm);
      alert("Configurações dos módulos salvas com sucesso!");
    }
  };


  const renderAdminEscritorioContent = () => (
    <>
       <SettingsSectionCard 
        titulo="Configurações do Emissor Fiscal do Escritório"
        descricao="Defina os dados da sua empresa que serão utilizados na emissão de documentos fiscais para seus clientes ou para o próprio escritório."
        icone={<IconeFiscal />}
      >
        <form onSubmit={handleSalvarConfigEmissor} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Razão Social</label><input type="text" name="razaoSocial" value={configEmissorForm.razaoSocial || ''} onChange={handleChangeConfigEmissor} className={inputClasses} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Fantasia</label><input type="text" name="nomeFantasia" value={configEmissorForm.nomeFantasia || ''} onChange={handleChangeConfigEmissor} className={inputClasses} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CNPJ</label><input type="text" name="cnpj" value={configEmissorForm.cnpj || ''} onChange={handleChangeConfigEmissor} className={inputClasses} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Inscrição Estadual</label><input type="text" name="inscricaoEstadual" value={configEmissorForm.inscricaoEstadual || ''} onChange={handleChangeConfigEmissor} className={inputClasses} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Inscrição Municipal</label><input type="text" name="inscricaoMunicipal" value={configEmissorForm.inscricaoMunicipal || ''} onChange={handleChangeConfigEmissor} className={inputClasses} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Regime Tributário</label><select name="regimeTributario" value={configEmissorForm.regimeTributario || ''} onChange={handleChangeConfigEmissor} className={selectClasses}><option value="">Selecione...</option>{regimesTributariosOptions.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">CNAE Principal (NFS-e)</label><input type="text" name="cnaePrincipal" value={configEmissorForm.cnaePrincipal || ''} onChange={handleChangeConfigEmissor} className={inputClasses} placeholder="Ex: 6920601"/></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cód. Serviço Municipal (NFS-e)</label><input type="text" name="listaServicos" value={configEmissorForm.listaServicos || ''} onChange={handleChangeConfigEmissor} className={inputClasses} placeholder="Ex: 01.01 ou 12345"/></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone</label><input type="tel" name="telefone" value={configEmissorForm.telefone || ''} onChange={handleChangeConfigEmissor} className={inputClasses} /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email para Notas</label><input type="email" name="email" value={configEmissorForm.email || ''} onChange={handleChangeConfigEmissor} className={inputClasses} /></div>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-3">Endereço do Emissor</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="text-xs text-gray-700 dark:text-gray-300">CEP</label><input type="text" name="endereco.cep" value={configEmissorForm.endereco?.cep || ''} onChange={handleChangeConfigEmissor} className={inputClasses} /></div>
                <div className="md:col-span-2"><label className="text-xs text-gray-700 dark:text-gray-300">Logradouro</label><input type="text" name="endereco.logradouro" value={configEmissorForm.endereco?.logradouro || ''} onChange={handleChangeConfigEmissor} className={inputClasses} /></div>
                <div><label className="text-xs text-gray-700 dark:text-gray-300">Número</label><input type="text" name="endereco.numero" value={configEmissorForm.endereco?.numero || ''} onChange={handleChangeConfigEmissor} className={inputClasses} /></div>
                <div><label className="text-xs text-gray-700 dark:text-gray-300">Bairro</label><input type="text" name="endereco.bairro" value={configEmissorForm.endereco?.bairro || ''} onChange={handleChangeConfigEmissor} className={inputClasses} /></div>
                <div><label className="text-xs text-gray-700 dark:text-gray-300">Cidade</label><input type="text" name="endereco.cidade" value={configEmissorForm.endereco?.cidade || ''} onChange={handleChangeConfigEmissor} className={inputClasses} /></div>
                <div><label className="text-xs text-gray-700 dark:text-gray-300">UF</label><input type="text" name="endereco.uf" value={configEmissorForm.endereco?.uf || ''} onChange={handleChangeConfigEmissor} maxLength={2} className={inputClasses} /></div>
            </div>
             <div className="mt-3">
                 <div className="flex items-center"><input type="checkbox" name="certificadoConfigurado" id="certificadoConfiguradoEscritorio" checked={configEmissorForm.certificadoConfigurado || false} onChange={handleChangeConfigEmissor} className="h-4 w-4 text-nixcon-gold border-gray-300 dark:border-gray-600 rounded focus:ring-nixcon-gold" /><label htmlFor="certificadoConfiguradoEscritorio" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Certificado Digital Configurado e Válido?</label></div>
                 <input type="text" placeholder="Nome/Referência do Certificado" name="nomeCertificado" value={configEmissorForm.nomeCertificado || ''} onChange={handleChangeConfigEmissor} className={`${inputClasses} mt-1`} />
             </div>
            <Button type="submit" className="mt-4">Salvar Configurações do Emissor</Button>
        </form>
      </SettingsSectionCard>

      <SettingsSectionCard 
        titulo="Identidade Visual do Escritório"
        descricao="Personalize a aparência do portal para seu escritório com seus logos."
        icone={<IconeUpload />} 
      >
        <div className="space-y-6">
          {(['principal', 'reduzida', 'avatar'] as const).map(type => (
            <div key={type} className="border-t pt-4 dark:border-gray-700">
              <label htmlFor={`logo-${type}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {type === 'principal' ? 'Logo Principal (para Sidebar, Relatórios)' : type === 'reduzida' ? 'Logo Reduzida/Ícone (para Favicon, etc.)' : 'Avatar Padrão para Usuários'}
              </label>
              <input 
                type="file" 
                id={`logo-${type}`} 
                accept="image/*" 
                onChange={(e) => handleFileChangeVisuals(e, type)}
                className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-nixcon-gold file:text-white hover:file:bg-yellow-600"
              />
              {(type === 'principal' && logoPrincipalPreview) && <img src={logoPrincipalPreview} alt="Preview Logo Principal" className="mt-2 max-h-20 border p-1 dark:border-gray-600"/>}
              {(type === 'reduzida' && logoReduzidaPreview) && <img src={logoReduzidaPreview} alt="Preview Logo Reduzida" className="mt-2 max-h-16 border p-1 dark:border-gray-600"/>}
              {(type === 'avatar' && avatarPadraoPreview) && <img src={avatarPadraoPreview} alt="Preview Avatar Padrão" className="mt-2 h-16 w-16 rounded-full border p-1 dark:border-gray-600 object-cover"/>}
            </div>
          ))}
          <Button onClick={handleSaveVisualConfigs} className="mt-4">Salvar Identidade Visual</Button>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard 
        titulo="Gerenciamento de Usuários do Escritório"
        descricao="Adicione, edite ou remova usuários internos do seu escritório contábil."
        icone={<IconeGrupoUsuarios />}
      >
        <Button onClick={() => handleAbrirModalUsuario()} className="mb-4">Adicionar Novo Usuário</Button>
        {usuariosDoTenantForm.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto border rounded-md dark:border-gray-600">
                {usuariosDoTenantForm.map(user => (
                    <li key={user.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center">
                        <div>
                            <p className="text-sm font-medium text-nixcon-charcoal dark:text-nixcon-light">{user.nome} <span className="text-xs text-gray-500 dark:text-gray-400">({user.email})</span></p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">Função: {user.funcao} - Status: <span className={user.ativo ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{user.ativo ? 'Ativo' : 'Inativo'}</span></p>
                        </div>
                        <div className="space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => handleAbrirModalUsuario(user)}>Editar</Button>
                            <Button variant="danger" size="sm" onClick={() => handleRemoverUsuario(user.id)}>Remover</Button>
                        </div>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum usuário cadastrado para o escritório.</p>
        )}
      </SettingsSectionCard>

      <SettingsSectionCard 
        titulo="Cadastro de Empresas Clientes"
        descricao="Gerencie as empresas clientes do seu escritório, suas configurações e usuários."
        icone={<IconeEmpresaCliente />}
      >
        <Link to="/empresas">
            <Button>Acessar Cadastro de Empresas</Button>
        </Link>
      </SettingsSectionCard>

      <SettingsSectionCard
        titulo="Configurações dos Módulos"
        descricao="Ajuste as preferências e comportamentos padrão para os diferentes módulos do sistema."
        icone={<IconeConfiguracoes />} // Pode ser um ícone mais específico se tiver
      >
        <form onSubmit={handleSalvarModuloConfigs} className="space-y-6">
            {/* Fiscal */}
            <fieldset className="border p-3 rounded-md dark:border-gray-600">
                <legend className="text-md font-medium text-nixcon-dark dark:text-nixcon-light px-1 flex items-center"><IconeFiscal className="w-5 h-5 mr-2"/>Fiscal</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div><label className="text-xs text-gray-700 dark:text-gray-300">Série Padrão NF-e</label><input type="text" value={moduloConfigsForm.fiscal?.seriePadraoNFe || '1'} onChange={e => handleChangeModuloConfig('fiscal', 'seriePadraoNFe', e.target.value)} className={inputClasses} /></div>
                    <div><label className="text-xs text-gray-700 dark:text-gray-300">Ambiente Emissão NF-e</label><select value={moduloConfigsForm.fiscal?.ambienteEmissaoNFe || 'HOMOLOGACAO'} onChange={e => handleChangeModuloConfig('fiscal', 'ambienteEmissaoNFe', e.target.value)} className={selectClasses}><option value="HOMOLOGACAO">Homologação</option><option value="PRODUCAO">Produção</option></select></div>
                    <div><label className="text-xs text-gray-700 dark:text-gray-300">Alíquota ISS Padrão (%) NFS-e</label><input type="number" step="0.01" value={moduloConfigsForm.fiscal?.aliquotaISSPadrao || ''} onChange={e => handleChangeModuloConfig('fiscal', 'aliquotaISSPadrao', parseFloat(e.target.value))} className={inputClasses} placeholder="Ex: 5.00"/></div>
                </div>
            </fieldset>

            {/* Financeiro */}
            <fieldset className="border p-3 rounded-md dark:border-gray-600">
                <legend className="text-md font-medium text-nixcon-dark dark:text-nixcon-light px-1 flex items-center"><IconeModuloFinanceiro className="w-5 h-5 mr-2"/>Financeiro</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div><label className="text-xs text-gray-700 dark:text-gray-300">Conta Bancária Padrão</label><select value={moduloConfigsForm.financeiro?.contaBancariaPadraoId || ''} onChange={e => handleChangeModuloConfig('financeiro', 'contaBancariaPadraoId', e.target.value)} className={selectClasses}><option value="">Selecione (Mock)</option><option value="banco1">Banco A - C/C 123</option><option value="banco2">Banco B - C/C 456</option></select></div>
                    <div><label className="text-xs text-gray-700 dark:text-gray-300">Centro de Custo Padrão</label><input type="text" value={moduloConfigsForm.financeiro?.centroCustoPadrao || ''} onChange={e => handleChangeModuloConfig('financeiro', 'centroCustoPadrao', e.target.value)} className={inputClasses} /></div>
                </div>
            </fieldset>

            {/* Tarefas */}
            <fieldset className="border p-3 rounded-md dark:border-gray-600">
                <legend className="text-md font-medium text-nixcon-dark dark:text-nixcon-light px-1 flex items-center"><IconeTarefas className="w-5 h-5 mr-2"/>Tarefas</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 items-center">
                    <div className="flex items-center">
                        <input type="checkbox" id="notificarEmailTarefa" checked={moduloConfigsForm.tarefas?.notificarResponsavelEmail || false} onChange={e => handleChangeModuloConfig('tarefas', 'notificarResponsavelEmail', e.target.checked)} className="h-4 w-4 text-nixcon-gold rounded focus:ring-nixcon-gold" />
                        <label htmlFor="notificarEmailTarefa" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Notificar por e-mail ao atribuir tarefa?</label>
                    </div>
                    <div><label className="text-xs text-gray-700 dark:text-gray-300">Prazo Padrão para Novas Tarefas (dias)</label><input type="number" min="1" value={moduloConfigsForm.tarefas?.prazoPadraoDias || 7} onChange={e => handleChangeModuloConfig('tarefas', 'prazoPadraoDias', parseInt(e.target.value))} className={inputClasses} /></div>
                </div>
            </fieldset>
            
            {/* Documentos */}
             <fieldset className="border p-3 rounded-md dark:border-gray-600">
                <legend className="text-md font-medium text-nixcon-dark dark:text-nixcon-light px-1 flex items-center"><IconeModuloDocumentos className="w-5 h-5 mr-2"/>Documentos</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 items-center">
                    <div><label className="text-xs text-gray-700 dark:text-gray-300">Categoria Padrão para Uploads</label><input type="text" value={moduloConfigsForm.documentos?.categoriaPadraoUpload || 'Outros'} onChange={e => handleChangeModuloConfig('documentos', 'categoriaPadraoUpload', e.target.value)} className={inputClasses} /></div>
                    <div className="flex items-center">
                        <input type="checkbox" id="versionamentoDocs" checked={moduloConfigsForm.documentos?.habilitarVersionamento || false} onChange={e => handleChangeModuloConfig('documentos', 'habilitarVersionamento', e.target.checked)} className="h-4 w-4 text-nixcon-gold rounded focus:ring-nixcon-gold" />
                        <label htmlFor="versionamentoDocs" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Habilitar Versionamento?</label>
                    </div>
                </div>
            </fieldset>

            <Button type="submit" className="mt-4">Salvar Configurações dos Módulos</Button>
        </form>
      </SettingsSectionCard>

    </>
  );

  const renderAdminClienteContent = () => (
     <SettingsSectionCard 
        titulo="Dados da Minha Empresa e Emissor Fiscal"
        descricao="Atualize os dados cadastrais da sua empresa e as configurações para emissão de notas fiscais."
        icone={<IconeFiscal />}
      >
        <p className="text-gray-600 dark:text-gray-400">Funcionalidade de edição para Admin Cliente será implementada aqui. Permitirá alterar dados da empresa (CNPJ, Razão Social, Endereço) e as configurações do emissor fiscal (similar ao Admin Escritório, mas para a própria empresa cliente).</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Os dados atuais da empresa são: {tenantAtual?.nome} (CNPJ: {tenantAtual?.configuracoesEmissor?.cnpj || 'Não informado'}).</p>
         {/* Poderia ter um botão "Editar Dados da Minha Empresa" que abre um modal específico */}
      </SettingsSectionCard>
  );
  
  const renderCommonContent = () => (
    <SettingsSectionCard 
        titulo="Minha Conta"
        descricao="Gerencie suas informações pessoais, preferências de notificação e segurança."
        icone={<IconeConfiguracoes />}
      >
        <p className="text-gray-600 dark:text-gray-400">Aqui você poderá alterar seu nome, e-mail, senha (simulado), e definir preferências como tema da interface (claro/escuro) e como deseja receber notificações.</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Nome: {usuarioAtual?.nome}, Email: {usuarioAtual?.email}</p>
    </SettingsSectionCard>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center">
          <IconeConfiguracoes className="w-8 h-8 mr-3 text-nixcon-gold" />
          Configurações Gerais
        </h1>
      </div>

      {(usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN) && renderAdminEscritorioContent()}
      {usuarioAtual?.funcao === FuncaoUsuario.ADMIN_CLIENTE && renderAdminClienteContent()}
      {renderCommonContent()}


      {/* Modal para Adicionar/Editar Usuário do Escritório */}
      {modalUsuarioAberto && usuarioEditando && (
        <Modal isOpen={modalUsuarioAberto} onClose={handleFecharModalUsuario} title={usuarioEditando.id ? 'Editar Usuário do Escritório' : 'Novo Usuário do Escritório'}>
          <form onSubmit={handleSalvarUsuario} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome*</label><input type="text" name="nome" value={usuarioEditando.nome || ''} onChange={handleChangeUsuario} required className={`${inputClasses} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email*</label><input type="email" name="email" value={usuarioEditando.email || ''} onChange={handleChangeUsuario} required className={`${inputClasses} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`} /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Função*</label>
              <select name="funcao" value={usuarioEditando.funcao || FuncaoUsuario.USUARIO_ESCRITORIO} onChange={handleChangeUsuario} required className={`${selectClasses} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200`}>
                {funcoesUsuarioEscritorio.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="flex items-center">
                <input type="checkbox" name="ativo" id="usuarioAtivo" checked={usuarioEditando.ativo || false} onChange={handleChangeUsuario} className="h-4 w-4 text-nixcon-gold border-gray-300 dark:border-gray-600 rounded focus:ring-nixcon-gold" />
                <label htmlFor="usuarioAtivo" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Usuário Ativo</label>
            </div>
             <p className="text-xs text-gray-500 dark:text-gray-400">Uma senha temporária será gerada e enviada por e-mail para novos usuários (simulado).</p>
            <div className="mt-6 text-right space-x-2">
              <Button type="button" variant="secondary" onClick={handleFecharModalUsuario}>Cancelar</Button>
              <Button type="submit">Salvar Usuário</Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default ConfiguracoesPage;
