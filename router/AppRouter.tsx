
import React, { ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../components/auth/LoginPage';
import MainLayout from '../components/layout/MainLayout';
import DashboardPage from '../pages/DashboardPage';
import TarefasPage from '../pages/TarefasPage';
import DocumentosPage from '../pages/DocumentosPage';
import CalendarioPage from '../pages/CalendarioPage';
import FinanceiroPage from '../pages/FinanceiroPage';
import EmissaoFiscalPage from '../pages/EmissaoFiscalPage'; // Renomeado de FiscalPage
import EscritaFiscalPage from '../pages/EscritaFiscalPage'; 
import FolhaPagamentoPage from '../pages/FolhaPagamentoPage'; 
import PatrimonioPage from '../pages/PatrimonioPage'; 
import ConciliadorPage from '../pages/ConciliadorPage';
import EstoquePage from '../pages/EstoquePage';
import PainelKPIsPage from '../pages/PainelKPIsPage';
import ConfiguracoesPage from '../pages/ConfiguracoesPage';
import AjudaPage from '../pages/AjudaPage';
import AdminSaasPage from '../pages/AdminSaasPage';
import AssinaturaEletronicaPage from '../pages/AssinaturaEletronicaPage';
import ComunicacoesPage from '../pages/ComunicacoesPage';
import AuditoriaPage from '../pages/AuditoriaPage';
import PontoProdutividadePage from '../pages/PontoProdutividadePage';
import RelatoriosPage from '../pages/RelatoriosPage';
import NotificacoesPage from '../pages/NotificacoesPage';
import SimulacaoImpostosPage from '../pages/SimulacaoImpostosPage';
import EmpresasPage from '../pages/EmpresasPage'; 
import GeradorDeDocumentosPage from '../pages/GeradorDeDocumentosPage';
import OrganizadorXmlPage from '../pages/OrganizadorXmlPage';
import HonorariosPage from '../pages/HonorariosPage';
import ContabilidadePage from '../pages/ContabilidadePage'; 
import EfdContribuicoesPage from '../pages/EfdContribuicoesPage';
import HyCiteReportsPage from '../pages/HyCiteReportsPage'; 
import LalurPage from '../pages/LalurPage'; 
import ConsultoriaTributariaPage from '../pages/ConsultoriaTributariaPage';
import CnaePage from '../pages/CnaePage';
import IntegraContadorAdminPage from '../pages/IntegraContadorAdminPage'; // Nova página IntegraContador

interface ProtectedRouteProps {
  children?: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { estaAutenticado, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-nixcon-light"><p className="text-nixcon-dark text-lg">Carregando...</p></div>;
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

const AppRouter: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tarefas" element={<TarefasPage />} />
          <Route path="empresas" element={<EmpresasPage />} /> 
          <Route path="documentos" element={<DocumentosPage />} />
          <Route path="modelos-documentos" element={<GeradorDeDocumentosPage />} />
          <Route path="calendario" element={<CalendarioPage />} />
          <Route path="contabilidade" element={<ContabilidadePage />} /> 
          <Route path="lalur" element={<LalurPage />} /> 
          <Route path="financeiro" element={<FinanceiroPage />} />
          <Route path="honorarios" element={<HonorariosPage />} /> 
          <Route path="fiscal" element={<EmissaoFiscalPage />} /> {/* Rota para emissão de notas */}
          <Route path="escrita-fiscal" element={<EscritaFiscalPage />} /> 
          <Route path="folha-pagamento" element={<FolhaPagamentoPage />} /> 
          <Route path="patrimonio" element={<PatrimonioPage />} /> 
          <Route path="efd-contribuicoes" element={<EfdContribuicoesPage />} /> 
          <Route path="organizador-xmls" element={<OrganizadorXmlPage />} />
          <Route path="simulacao-impostos" element={<SimulacaoImpostosPage />} /> 
          <Route path="conciliador" element={<ConciliadorPage />} />
          <Route path="estoque" element={<EstoquePage />} />
          <Route path="assinaturas" element={<AssinaturaEletronicaPage />} />
          <Route path="comunicacoes" element={<ComunicacoesPage />} />
          <Route path="ponto-produtividade" element={<PontoProdutividadePage />} />
          <Route path="kpis" element={<PainelKPIsPage />} />
          <Route path="relatorios" element={<RelatoriosPage />} />
          <Route path="relatorios-hycite" element={<HyCiteReportsPage />} /> 
          <Route path="consultoria-tributaria" element={<ConsultoriaTributariaPage />} />
          <Route path="cadastro-cnaes" element={<CnaePage />} />
          <Route path="integracontador-admin" element={<IntegraContadorAdminPage />} /> {/* Nova rota IntegraContador */}
          <Route path="notificacoes" element={<NotificacoesPage />} />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
          <Route path="auditoria" element={<AuditoriaPage />} />
          <Route path="ajuda" element={<AjudaPage />} />
          <Route path="admin-saas" element={<AdminSaasPage />} /> 
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default AppRouter;
