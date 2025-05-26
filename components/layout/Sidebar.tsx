
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ItemNavegacao, FuncaoUsuario } from '../../types';
import { ITENS_MENU_LATERAL, ITENS_MENU_UTILIDADES, NIXCON_LOGO_URL, NOME_APLICACAO } from '../../constants';
import { IconeSair, IconeChevronDireita } from '../common/Icons'; // IconeChevronDireita para o dropdown

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { logout, usuarioAtual, tenantAtual } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // Efeito para expandir o menu pai se um de seus filhos estiver ativo
  useEffect(() => {
    const activeParent = ITENS_MENU_LATERAL.find(item => 
      item.subItens?.some(subItem => location.pathname === subItem.caminho || location.pathname.startsWith(subItem.caminho + '/'))
    );
    if (activeParent) {
      setExpandedMenus(prev => ({ ...prev, [activeParent.nome]: true }));
    }
  }, [location.pathname]);


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (itemName: string) => {
    setExpandedMenus(prev => ({ ...prev, [itemName]: !prev[itemName] }));
  };

  const renderizarItemMenu = (item: ItemNavegacao, index: number, isSubItem: boolean = false) => {
    if (item.funcoesPermitidas && usuarioAtual && !item.funcoesPermitidas.includes(usuarioAtual.funcao)) {
      return null;
    }
    
    const IconProp = item.icone;
    let iconElement: React.ReactNode;

    if (typeof IconProp === 'function') {
      iconElement = <IconProp className={`flex-shrink-0 ${isSubItem ? 'w-5 h-5 mr-2' : 'w-6 h-6 mr-3'}`} />;
    } else {
      iconElement = React.cloneElement(IconProp, {
        className: `flex-shrink-0 ${isSubItem ? 'w-5 h-5 mr-2' : 'w-6 h-6 mr-3'}`,
      });
    }

    const hasSubItems = item.subItens && item.subItens.length > 0;
    const isExpanded = expandedMenus[item.nome] || false;

    // Determina se o item pai ou algum de seus filhos está ativo
    const isParentOrChildActive = (menuItem: ItemNavegacao): boolean => {
        if (location.pathname === menuItem.caminho) return true;
        if (menuItem.subItens) {
            return menuItem.subItens.some(sub => location.pathname === sub.caminho || location.pathname.startsWith(sub.caminho + '/'));
        }
        return false;
    };
    
    const isActive = isParentOrChildActive(item);

    if (hasSubItems) {
      return (
        <li key={`${item.nome}-${index}`} className={`${isSubItem ? 'ml-4' : ''}`}>
          <button
            onClick={() => toggleMenu(item.nome)}
            className={`flex items-center justify-between w-full p-3 my-1 rounded-lg transition-colors duration-200 ease-in-out
                        ${isActive 
                          ? 'bg-nixcon-gold text-white shadow-md' 
                          : 'text-nixcon-charcoal dark:text-nixcon-light dark:hover:text-white hover:bg-nixcon-gold hover:text-white hover:bg-opacity-80'
                        }`}
          >
            <div className="flex items-center">
              {iconElement}
              <span className={`text-sm font-medium ${isSubItem ? 'text-xs' : ''}`}>{item.nome}</span>
            </div>
            <IconeChevronDireita className={`w-4 h-4 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`} />
          </button>
          {isExpanded && (
            <ul className="pl-4 border-l border-gray-200 dark:border-gray-600 ml-3">
              {item.subItens?.map((subItem, subIndex) => renderizarItemMenu(subItem, subIndex, true))}
            </ul>
          )}
        </li>
      );
    }
    
    // Item normal (folha ou utilidade)
    return (
      <li key={`${item.nome}-${index}`} className={`${isSubItem ? 'ml-0' : ''}`}> {/* No margin for subitems as parent ul has pl-4 */}
        <NavLink
          to={item.caminho}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive: navLinkIsActive }) =>
            `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ease-in-out
             ${navLinkIsActive 
               ? `bg-nixcon-gold text-white shadow-md ${isSubItem ? 'bg-opacity-80' : ''}`
               : `text-nixcon-charcoal dark:text-nixcon-light dark:hover:text-white hover:bg-nixcon-gold hover:text-white hover:bg-opacity-80 ${isSubItem ? 'hover:bg-opacity-60' : ''}`
             } ${isSubItem ? 'pl-7' : ''}` // Adiciona padding-left maior para subitens
          }
        >
          {iconElement}
          <span className={`font-medium ${isSubItem ? 'text-xs' : 'text-sm'}`}>{item.nome}</span>
        </NavLink>
      </li>
    );
  };
  
  const logoToDisplay = tenantAtual?.configuracoesVisuais?.logoPrincipalUrl || NIXCON_LOGO_URL;

  return (
    <>
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-white dark:bg-nixcon-dark-card shadow-xl transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-700">
          <img src={logoToDisplay} alt={`Logo ${NOME_APLICACAO}`} className="h-10 mr-2 object-contain" />
          <span className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light">{NOME_APLICACAO.split(" ")[2]}</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          <ul>
            {ITENS_MENU_LATERAL.map((item, index) => renderizarItemMenu(item, index))}
          </ul>
          <hr className="my-4 border-gray-200 dark:border-gray-700" />
          <ul>
            {ITENS_MENU_UTILIDADES.map((item, index) => renderizarItemMenu(item, index))}
             <li>
                <button
                  onClick={handleLogout}
                  className="flex items-center p-3 my-1 rounded-lg text-nixcon-charcoal dark:text-nixcon-light hover:bg-red-500 hover:text-white w-full transition-colors duration-200 ease-in-out"
                >
                  <IconeSair className="w-6 h-6 mr-3 flex-shrink-0" />
                  <span className="text-sm font-medium">Sair</span>
                </button>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">&copy; {new Date().getFullYear()} Grupo Nixcon</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
