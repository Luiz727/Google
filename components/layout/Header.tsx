
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../../contexts/AuthContext';
import { IconeMenu, IconeSino, IconeSair, IconeOlho } from '../common/Icons'; 
import Button from '../common/Button';
import { Empresa, FuncaoUsuario, Tenant, StatusEmpresa, Endereco, Theme } from '../../types'; 

// Ícones para o botão de tema
const IconeSol = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

const IconeLua = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);


interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const getEmpresasMockParaHeader = (escritorioTenantId: string | undefined): Empresa[] => {
    if (!escritorioTenantId) return [];
    const STORAGE_KEY_PREFIX_EMPRESAS = 'nixconPortalEmpresas_'; 
    const storageKey = `${STORAGE_KEY_PREFIX_EMPRESAS}${escritorioTenantId}`;
    try {
        const empresasSalvas = localStorage.getItem(storageKey);
        if (empresasSalvas) {
            const parsedEmpresas = JSON.parse(empresasSalvas);
            if (Array.isArray(parsedEmpresas)) {
                 return parsedEmpresas.map(emp => ({
                    ...emp,
                    configuracoesEmissor: emp.configuracoesEmissor || {},
                    usuariosDaEmpresa: emp.usuariosDaEmpresa || [],
                })) as Empresa[];
            }
        }
    } catch (error) {
        console.error("Erro ao buscar empresas mock para header:", error);
    }
    const agora = new Date().toISOString();
    const fallbackEmpresas: Partial<Empresa>[] = [
        { 
            id: 'emp1-cliente-real', nome: 'BIOSOLARIS (Header Mock)', cnpj: '000', status: 'ATIVO' as StatusEmpresa, 
            tenantId: escritorioTenantId, dataCadastro: agora, dataAtualizacao: agora, 
            endereco: { cep: '000', logradouro: 'RUA', numero: '0', bairro: 'CENTRO', cidade: 'CIDADE', uf: 'PR' } as Endereco
        },
        { 
            id: 'emp2-cliente-real', nome: 'DIGNITATE (Header Mock)', cnpj: '111', status: 'ATIVO' as StatusEmpresa,
            tenantId: escritorioTenantId, dataCadastro: agora, dataAtualizacao: agora,
            endereco: { cep: '111', logradouro: 'AV', numero: '1', bairro: 'BAIRRO', cidade: 'OUTRA', uf: 'SP' } as Endereco
        },
    ];
    return fallbackEmpresas.map(emp => ({
        ...emp,
        configuracoesEmissor: emp.configuracoesEmissor || {}, 
        usuariosDaEmpresa: emp.usuariosDaEmpresa || [], 
    } as Empresa)); 
};


const PersonificationBanner: React.FC = () => {
  const { personificandoInfo, pararPersonificacao } = useAuth();
  const navigate = useNavigate();

  if (!personificandoInfo) {
    return null;
  }

  const handleStopPersonification = () => {
    pararPersonificacao();
    navigate('/empresas'); 
  };

  let bannerText = `Você está personificando: ${personificandoInfo.empresaNome}`;
  if (personificandoInfo.personifiedUserId && personificandoInfo.personifiedUserNome) {
    bannerText = `Você está personificando: ${personificandoInfo.personifiedUserNome} (${personificandoInfo.rolePersonificado}) na empresa ${personificandoInfo.empresaNome}`;
  } else {
    bannerText = `Você está personificando ${personificandoInfo.empresaNome} (como ${personificandoInfo.rolePersonificado})`;
  }


  return (
    <div className="bg-yellow-400 text-black p-2 text-center text-sm flex justify-between items-center w-full fixed top-0 left-0 z-50 shadow-lg">
      <span>
        {bannerText}
      </span>
      <Button onClick={handleStopPersonification} size="sm" variant="secondary" className="bg-red-500 hover:bg-red-600 text-white ml-4">
        <IconeSair className="w-4 h-4 mr-1 transform rotate-180" /> Parar Personificação
      </Button>
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { 
    usuarioAtual, 
    tenantAtual, 
    personificandoInfo, 
    switchActiveCompanyForExternalUser,
    activeClientCompanyContext, 
    switchActiveClientCompanyContext, 
    iniciarPersonificacao,
    theme,
    toggleTheme 
  } = useAuth();
  
  const [empresasDisponiveis, setEmpresasDisponiveis] = useState<Empresa[]>([]);

  useEffect(() => {
    if (tenantAtual) {
      const todasEmpresasDoEscritorio = getEmpresasMockParaHeader(tenantAtual.id);
      if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && usuarioAtual.accessibleEmpresaIds) {
        const acessiveis = todasEmpresasDoEscritorio.filter(emp => 
          usuarioAtual.accessibleEmpresaIds?.includes(emp.id)
        );
        setEmpresasDisponiveis(acessiveis);
      } else if (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN) {
        setEmpresasDisponiveis(todasEmpresasDoEscritorio);
      } else {
        setEmpresasDisponiveis([]);
      }
    }
  }, [usuarioAtual, tenantAtual]);

  const handleSwitchCompanyForExternalUser = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const empresaId = event.target.value;
    if (empresaId) {
      switchActiveCompanyForExternalUser(empresaId);
    }
  };

  const handleSwitchClientCompanyContextForAdmin = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const empresaId = event.target.value;
    if (empresaId === "__escritorio__") { 
        switchActiveClientCompanyContext(null);
    } else {
        const empresaSelecionada = empresasDisponiveis.find(emp => emp.id === empresaId);
        if (empresaSelecionada) {
            switchActiveClientCompanyContext(empresaSelecionada);
        }
    }
  };
  
  const handlePersonificacaoFromContext = () => {
    if (activeClientCompanyContext) {
        iniciarPersonificacao(activeClientCompanyContext, FuncaoUsuario.ADMIN_CLIENTE);
    }
  };

  const getActiveContextName = () => {
    if (personificandoInfo) {
       if (personificandoInfo.personifiedUserId && personificandoInfo.personifiedUserNome) {
         return `Painel de: ${personificandoInfo.personifiedUserNome} (${personificandoInfo.rolePersonificado}) @ ${personificandoInfo.empresaNome}`;
       }
       return `Painel de: ${personificandoInfo.empresaNome} (como ${personificandoInfo.rolePersonificado})`;
    }
    if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE) {
      const empresaAtiva = empresasDisponiveis.find(emp => emp.id === usuarioAtual.tenantId);
      return empresaAtiva ? `Contexto: ${empresaAtiva.nome}` : 'Selecione uma empresa';
    }
    if (activeClientCompanyContext && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN)) {
        return `Visualizando: ${activeClientCompanyContext.nome}`;
    }
    return tenantAtual?.nome || 'Portal Nixcon';
  };

  const renderAdminCompanySwitcher = () => {
    if (!personificandoInfo && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN) && empresasDisponiveis.length > 0) {
      return (
        <div className="relative flex items-center space-x-2">
          <select
            value={activeClientCompanyContext?.id || "__escritorio__"}
            onChange={handleSwitchClientCompanyContextForAdmin}
            className="text-xs appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-nixcon-dark dark:text-nixcon-dark-text py-1.5 pl-2 pr-8 rounded-md leading-tight focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-nixcon-gold shadow-sm"
            title="Trocar contexto da empresa cliente"
            aria-label="Selecionar empresa para visualizar"
          >
            <option value="__escritorio__">Meu Escritório</option>
            {empresasDisponiveis.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.nome}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400" style={{ right: activeClientCompanyContext ? '2.5rem' : '0' }}> 
            <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
          {activeClientCompanyContext && (
            <Button
                onClick={handlePersonificacaoFromContext}
                variant="ghost"
                size="sm"
                className="p-1 text-xs"
                title={`Personificar ${activeClientCompanyContext.nome} (como Admin Cliente)`}
                aria-label={`Personificar ${activeClientCompanyContext.nome} (como Admin Cliente)`}
            >
                <IconeOlho className="w-4 h-4 text-blue-500 dark:text-blue-400"/>
            </Button>
          )}
        </div>
      );
    }
    return null;
  };

  const renderExternalUserCompanySwitcher = () => {
    if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && empresasDisponiveis.length > 0) {
      return (
        <div className="relative">
          <select
            value={usuarioAtual.tenantId}
            onChange={handleSwitchCompanyForExternalUser}
            className="text-xs appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-nixcon-dark dark:text-nixcon-dark-text py-1.5 pl-2 pr-8 rounded-md leading-tight focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-nixcon-gold shadow-sm"
            title="Trocar empresa ativa"
            aria-label="Selecionar empresa ativa"
          >
            <option value="" disabled>Trocar Empresa...</option>
            {empresasDisponiveis.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.nome}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
            <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      );
    }
    return null;
  };

  const avatarSrc = usuarioAtual?.avatarUrl || 
                    tenantAtual?.configuracoesVisuais?.avatarPadraoUrl || 
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(usuarioAtual?.nome.split(' (Personificando')[0] || 'User')}&background=dbbd67&color=424240`;


  return (
    <>
      <PersonificationBanner />
      <header className={`sticky top-0 z-20 bg-white dark:bg-nixcon-dark-card shadow-md ${personificandoInfo ? 'pt-10' : ''} transition-colors duration-300`}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 -mb-px">
            <div className="flex lg:hidden">
              <button
                className="text-gray-500 dark:text-gray-400 hover:text-nixcon-dark dark:hover:text-nixcon-light focus:outline-none focus:ring-2 focus:ring-inset focus:ring-nixcon-gold"
                onClick={() => setSidebarOpen(true)}
                aria-controls="sidebar"
                aria-expanded={false} 
              >
                <span className="sr-only">Abrir sidebar</span>
                <IconeMenu className="w-6 h-6" />
              </button>
            </div>

            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold text-nixcon-dark dark:text-nixcon-dark-text">
                {getActiveContextName()}
              </h1>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4 ml-auto">
              {renderAdminCompanySwitcher()}
              {renderExternalUserCompanySwitcher()}
              
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-nixcon-gold dark:hover:text-nixcon-gold rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nixcon-gold"
                title={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
                aria-label="Alternar tema"
              >
                {theme === 'light' ? <IconeLua className="h-5 w-5" /> : <IconeSol className="h-5 w-5" />}
              </button>

              <Link 
                to="/notificacoes" 
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-nixcon-gold dark:hover:text-nixcon-gold rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nixcon-gold relative"
                title="Ver notificações"
                aria-label="Notificações"
              >
                <IconeSino className="h-6 w-6" />
              </Link>

              {usuarioAtual && ( 
                <div className="flex items-center">
                  <div className="mr-3 text-right">
                    <p className="text-sm font-medium text-nixcon-dark dark:text-nixcon-dark-text">{usuarioAtual.nome.split(' (Personificando')[0]}</p>
                    <p className="text-xs text-gray-500 dark:text-nixcon-dark-text-secondary">
                      {personificandoInfo ? `Papel Original: ${personificandoInfo.roleOriginal}` :
                       (usuarioAtual.funcao !== FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && !activeClientCompanyContext ? `Escritório: ${tenantAtual?.nome}` : 
                        (activeClientCompanyContext ? `Escritório: ${tenantAtual?.nome}` : `Escritório: ${tenantAtual?.nome}`)
                       )}
                    </p>
                  </div>
                  <img
                    className="h-10 w-10 rounded-full object-cover border-2 border-nixcon-gold"
                    src={avatarSrc}
                    alt={`Avatar de ${usuarioAtual.nome.split(' (Personificando')[0]}`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
