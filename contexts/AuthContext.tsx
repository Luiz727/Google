
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Usuario, FuncaoUsuario, Tenant, ConfiguracoesEmissor, Empresa, PersonificacaoInfo, AuthContextType as IAuthContextType, Theme, ConfiguracoesVisuais, ModuloConfigs } from '../types'; // Adicionado ConfiguracoesVisuais, ModuloConfigs

// Chaves do localStorage
const USER_STORAGE_KEY = 'usuarioAtual';
const TENANT_STORAGE_KEY = 'tenantAtual';
const PERSONIFICATION_INFO_KEY = 'personificandoInfo';
const ORIGINAL_USER_KEY = 'usuarioOriginal';
const ACTIVE_CLIENT_COMPANY_CONTEXT_KEY = 'activeClientCompanyContext';
const THEME_STORAGE_KEY = 'nixconPortalTheme'; 

const getEmpresasMockParaExterno = (escritorioTenantId: string): Empresa[] => {
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
        console.error("Erro ao buscar empresas mock para externo:", error);
    }
    const agora = new Date().toISOString();
    const fallbackData: Empresa[] = [
        { 
            id: 'emp1-cliente-real', nome: 'BIOSOLARIS - SEG AMBIENTAL E ENERGIAS RENOVÁVEIS', cnpj: '26346739000143', status: 'ATIVO', 
            tenantId: escritorioTenantId, dataCadastro: agora, dataAtualizacao: agora, 
            endereco: { cep: '85877000', logradouro: 'RUA ALFREDO CHAVES', numero: '308', bairro: 'CENTRO', cidade: 'SÃO MIGUEL DO IGUAÇU', uf: 'PR' },
            configuracoesEmissor: { cnpj: '26346739000143', razaoSocial: 'BIOSOLARIS...' },
            usuariosDaEmpresa: []
        },
        { 
            id: 'emp2-cliente-real', nome: 'DIGNITATE DISTRIBUIDORA DE UTENSILIOS DOMESTICOS', cnpj: '33038489000140', status: 'ATIVO',
            tenantId: escritorioTenantId, dataCadastro: agora, dataAtualizacao: agora,
            endereco: { cep: '87015370', logradouro: 'RUA EMÍLIO DE MENEZES', numero: '39', bairro: 'ZONA 05', cidade: 'MARINGÁ', uf: 'PR' },
            configuracoesEmissor: { cnpj: '33038489000140', razaoSocial: 'DIGNITATE...' },
            usuariosDaEmpresa: []
        },
    ];
    return fallbackData;
};


const AuthContext = createContext<IAuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [tenantAtual, setTenantAtual] = useState<Tenant | null>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('light');

  const [personificandoInfo, setPersonificandoInfo] = useState<PersonificacaoInfo | null>(null);
  const [usuarioOriginal, setUsuarioOriginal] = useState<Usuario | null>(null);
  const [activeClientCompanyContext, setActiveClientCompanyContext] = useState<Empresa | null>(null);


  useEffect(() => {
    const verificarAuth = () => {
      try {
        const storedUserJson = localStorage.getItem(USER_STORAGE_KEY);
        const storedTenantJson = localStorage.getItem(TENANT_STORAGE_KEY);
        const storedPersonificationInfoJson = localStorage.getItem(PERSONIFICATION_INFO_KEY);
        const storedOriginalUserJson = localStorage.getItem(ORIGINAL_USER_KEY);
        const storedActiveClientCompanyContextJson = localStorage.getItem(ACTIVE_CLIENT_COMPANY_CONTEXT_KEY);
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;

        if (storedTheme) {
            setTheme(storedTheme);
        } else {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(prefersDark ? 'dark' : 'light');
        }


        if (storedUserJson && storedTenantJson) {
          const parsedUser = JSON.parse(storedUserJson) as Usuario;
          let parsedTenant = JSON.parse(storedTenantJson) as Tenant;
          
          parsedTenant = {
            ...parsedTenant,
            configuracoesEmissor: parsedTenant.configuracoesEmissor || {},
            usuariosDoTenant: parsedTenant.usuariosDoTenant || [],
            configuracoesVisuais: parsedTenant.configuracoesVisuais || {},
            configuracoesModulos: parsedTenant.configuracoesModulos || {}, // Inicializa configuracoesModulos
          };

          setUsuarioAtual(parsedUser);
          setTenantAtual(parsedTenant);

          if (storedPersonificationInfoJson && storedOriginalUserJson) {
            setPersonificandoInfo(JSON.parse(storedPersonificationInfoJson));
            setUsuarioOriginal(JSON.parse(storedOriginalUserJson));
          }

          if (storedActiveClientCompanyContextJson) {
            setActiveClientCompanyContext(JSON.parse(storedActiveClientCompanyContextJson));
          }

        }
      } catch (error) {
        console.error("Falha ao carregar dados do localStorage:", error);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TENANT_STORAGE_KEY);
        localStorage.removeItem(PERSONIFICATION_INFO_KEY);
        localStorage.removeItem(ORIGINAL_USER_KEY);
        localStorage.removeItem(ACTIVE_CLIENT_COMPANY_CONTEXT_KEY);
        localStorage.removeItem(THEME_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };
    verificarAuth();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark';
    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const login = async (email: string, senha_mock: string) => {
    setIsLoading(true);
    localStorage.removeItem(PERSONIFICATION_INFO_KEY);
    localStorage.removeItem(ORIGINAL_USER_KEY);
    localStorage.removeItem(ACTIVE_CLIENT_COMPANY_CONTEXT_KEY); 
    setPersonificandoInfo(null);
    setUsuarioOriginal(null);
    setActiveClientCompanyContext(null); 

    // Senha padrão para todos os usuários mock
    const SENHA_PADRAO_MOCK = "ProjetoTeste123+";

    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (email && senha_mock === SENHA_PADRAO_MOCK) { 
          const mockUserId = `user-${Date.now()}`;
          const mockEscritorioTenantId = `tenant-escritorio-principal-mock`; 
          
          let funcaoUsuario: FuncaoUsuario = FuncaoUsuario.ADMIN_ESCRITORIO;
          let accessibleEmpresaIdsMock: string[] | undefined = undefined;
          let initialTenantIdForUser = mockEscritorioTenantId;

          if (email.toLowerCase() === 'luiz.reis@msn.com') {
            funcaoUsuario = FuncaoUsuario.SUPERADMIN;
          } else if (email.toLowerCase() === 'externo@example.com') {
            funcaoUsuario = FuncaoUsuario.USUARIO_EXTERNO_CLIENTE;
            const empresasDoEscritorio = getEmpresasMockParaExterno(mockEscritorioTenantId);
            accessibleEmpresaIdsMock = empresasDoEscritorio.map(e => e.id).slice(0, 2); 
            if (accessibleEmpresaIdsMock.length > 0) {
                initialTenantIdForUser = accessibleEmpresaIdsMock[0]; 
            } else {
                initialTenantIdForUser = 'sem-empresa-definida'; 
            }
          }


          const usuarioMock: Usuario = {
            id: mockUserId,
            nome: email.split('@')[0] || 'Usuário Mock',
            email: email,
            funcao: funcaoUsuario, 
            tenantId: initialTenantIdForUser, 
            avatarUrl: `https://picsum.photos/seed/${email}/100/100`,
            ativo: true,
            accessibleEmpresaIds: accessibleEmpresaIdsMock,
          };
          
          const tenantEscritorioMock: Tenant = { 
            id: mockEscritorioTenantId, 
            nome: 'Escritório Contábil Principal (Mock)',
            configuracoesEmissor: {},
            usuariosDoTenant: funcaoUsuario !== FuncaoUsuario.USUARIO_EXTERNO_CLIENTE ? [ {...usuarioMock} ] : [], 
            configuracoesVisuais: {},
            configuracoesModulos: {}, // Inicializa configuracoesModulos
          };

          setUsuarioAtual(usuarioMock);
          setTenantAtual(tenantEscritorioMock);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuarioMock));
          localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenantEscritorioMock));
          setIsLoading(false);
          resolve();
        } else {
          setIsLoading(false);
          reject(new Error('Credenciais inválidas. Verifique seu e-mail e senha.'));
        }
      }, 1000);
    });
  };

  const logout = () => {
    setIsLoading(true);
    setUsuarioAtual(null);
    setTenantAtual(null);
    setPersonificandoInfo(null);
    setUsuarioOriginal(null);
    setActiveClientCompanyContext(null); 
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TENANT_STORAGE_KEY);
    localStorage.removeItem(PERSONIFICATION_INFO_KEY);
    localStorage.removeItem(ORIGINAL_USER_KEY);
    localStorage.removeItem(ACTIVE_CLIENT_COMPANY_CONTEXT_KEY); 
    setTimeout(() => setIsLoading(false), 500);
  };

  const setTenantConfiguracoesEmissor = (config: ConfiguracoesEmissor) => {
    if (tenantAtual) { 
      const updatedTenant = {
        ...tenantAtual,
        configuracoesEmissor: { ...tenantAtual.configuracoesEmissor, ...config },
      };
      setTenantAtual(updatedTenant);
      localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(updatedTenant));
    }
  };

  const salvarUsuariosDoTenant = (usuarios: Usuario[]) => { 
    if (tenantAtual) {
      const updatedTenant = {
        ...tenantAtual,
        usuariosDoTenant: usuarios,
      };
      setTenantAtual(updatedTenant);
      localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(updatedTenant));
    }
  };

  const setTenantVisualConfigs = (configs: ConfiguracoesVisuais) => {
    if (tenantAtual) {
      const updatedTenant = {
        ...tenantAtual,
        configuracoesVisuais: { ...tenantAtual.configuracoesVisuais, ...configs },
      };
      setTenantAtual(updatedTenant);
      localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(updatedTenant));
    }
  };

  const setTenantConfiguracoesModulos = (configs: ModuloConfigs) => {
    if (tenantAtual) {
      const updatedTenant = {
        ...tenantAtual,
        configuracoesModulos: { ...tenantAtual.configuracoesModulos, ...configs },
      };
      setTenantAtual(updatedTenant);
      localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(updatedTenant));
    }
  };


  const iniciarPersonificacao = (empresa: Empresa, roleToPersonify?: FuncaoUsuario, userIdToPersonify?: string) => {
    if (!usuarioAtual || !tenantAtual) return;
    if (usuarioAtual.funcao !== FuncaoUsuario.ADMIN_ESCRITORIO && usuarioAtual.funcao !== FuncaoUsuario.SUPERADMIN) {
        console.warn("Usuário não tem permissão para personificar.");
        return;
    }
    
    setActiveClientCompanyContext(null); 
    localStorage.removeItem(ACTIVE_CLIENT_COMPANY_CONTEXT_KEY);

    const originalUser = { ...usuarioAtual };
    setUsuarioOriginal(originalUser);
    localStorage.setItem(ORIGINAL_USER_KEY, JSON.stringify(originalUser));

    let papelFinalPersonificado = roleToPersonify;
    let nomeUsuarioPersonificadoEspecifico: string | undefined = undefined;
    let nomeExibicaoPersonificacao = `${originalUser.nome} (Personificando ${empresa.nome}`;

    if (userIdToPersonify) {
        const usuarioEspecifico = empresa.usuariosDaEmpresa?.find(u => u.id === userIdToPersonify);
        if (usuarioEspecifico) {
            papelFinalPersonificado = usuarioEspecifico.funcao;
            nomeUsuarioPersonificadoEspecifico = usuarioEspecifico.nome;
            nomeExibicaoPersonificacao = `${originalUser.nome} (Personificando ${usuarioEspecifico.nome} @ ${empresa.nome} como ${usuarioEspecifico.funcao})`;
        } else {
            console.warn(`Usuário específico com ID ${userIdToPersonify} não encontrado na empresa ${empresa.nome}. Personificando com papel geral.`);
        }
    }

    if (!papelFinalPersonificado || 
        ![FuncaoUsuario.ADMIN_CLIENTE, FuncaoUsuario.USUARIO_CLIENTE, FuncaoUsuario.USUARIO_EXTERNO_CLIENTE, FuncaoUsuario.CONTADOR_EXTERNO_CLIENTE].includes(papelFinalPersonificado)
    ) {
        papelFinalPersonificado = FuncaoUsuario.ADMIN_CLIENTE; 
    }
    
    if (!userIdToPersonify) { 
      nomeExibicaoPersonificacao = `${originalUser.nome} (Personificando ${empresa.nome} como ${papelFinalPersonificado})`;
    }

    const personInfo: PersonificacaoInfo = {
        empresaId: empresa.id,
        empresaNome: empresa.nome,
        roleOriginal: originalUser.funcao,
        rolePersonificado: papelFinalPersonificado,
        personifiedUserId: userIdToPersonify,
        personifiedUserNome: nomeUsuarioPersonificadoEspecifico,
    };
    setPersonificandoInfo(personInfo);
    localStorage.setItem(PERSONIFICATION_INFO_KEY, JSON.stringify(personInfo));
    
    const usuarioPersonificado: Usuario = {
        ...originalUser, 
        nome: nomeExibicaoPersonificacao,
        funcao: papelFinalPersonificado, 
        tenantId: empresa.id, 
        accessibleEmpresaIds: undefined, 
    };
    setUsuarioAtual(usuarioPersonificado);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuarioPersonificado));
    
    setIsLoading(false); 
  };

  const pararPersonificacao = () => {
    if (usuarioOriginal) {
        setUsuarioAtual(usuarioOriginal);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuarioOriginal));
    }
    setPersonificandoInfo(null);
    setUsuarioOriginal(null);
    localStorage.removeItem(PERSONIFICATION_INFO_KEY);
    localStorage.removeItem(ORIGINAL_USER_KEY);
    setIsLoading(false); 
  };

  const switchActiveCompanyForExternalUser = (empresaId: string) => {
    if (usuarioAtual && usuarioAtual.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE) {
        const updatedUser = { ...usuarioAtual, tenantId: empresaId };
        setUsuarioAtual(updatedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        setIsLoading(false); 
    } else {
        console.warn("switchActiveCompanyForExternalUser chamado para usuário não externo ou não logado.");
    }
  };

  const switchActiveClientCompanyContext = (empresa: Empresa | null) => {
    if (usuarioAtual && (usuarioAtual.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual.funcao === FuncaoUsuario.SUPERADMIN)) {
        if (personificandoInfo) {
            console.warn("Não é possível trocar o contexto de empresa cliente enquanto estiver personificando. Pare a personificação primeiro.");
            return;
        }
        setActiveClientCompanyContext(empresa);
        if (empresa) {
            localStorage.setItem(ACTIVE_CLIENT_COMPANY_CONTEXT_KEY, JSON.stringify(empresa));
        } else {
            localStorage.removeItem(ACTIVE_CLIENT_COMPANY_CONTEXT_KEY);
        }
        setIsLoading(false); 
    } else {
        console.warn("switchActiveClientCompanyContext chamado para usuário não autorizado.");
    }
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <AuthContext.Provider value={{ 
        usuarioAtual, 
        tenantAtual, 
        estaAutenticado: !!usuarioAtual, 
        login, 
        logout, 
        isLoading, 
        setTenantConfiguracoesEmissor, 
        salvarUsuariosDoTenant,
        setTenantVisualConfigs,
        setTenantConfiguracoesModulos, // Exporta a nova função
        personificandoInfo,
        iniciarPersonificacao,
        pararPersonificacao,
        switchActiveCompanyForExternalUser,
        activeClientCompanyContext,
        switchActiveClientCompanyContext,
        theme,
        toggleTheme
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): IAuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
