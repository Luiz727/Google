
import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeDocumentos, IconeUpload } from '../components/common/Icons';
import { Documento, Empresa, FuncaoUsuario } from '../types'; 
import { useAuth } from '../contexts/AuthContext';

const categoriasDocumento = ["Contábil", "Fiscal", "Jurídico", "Certificados", "Outros"];
export const STORAGE_KEY_DOCUMENTOS_PREFIX = 'nixconPortalDocumentos_';

const getEmpresasFromStorage = (escritorioTenantId: string | undefined): Empresa[] => {
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
        console.error("Erro ao buscar empresas mock para getEmpresasFromStorage:", error);
    }
    return []; 
};


const DocumentosPage: React.FC = () => {
  const { usuarioAtual, tenantAtual, personificandoInfo, activeClientCompanyContext } = useAuth();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [novoDocNome, setNovoDocNome] = useState('');
  const [novoDocCategoria, setNovoDocCategoria] = useState(categoriasDocumento[0]);
  const [novoDocArquivo, setNovoDocArquivo] = useState<File | null>(null);
  
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroNome, setFiltroNome] = useState<string>('');

  const [modalDetalhesDocumentoAberto, setModalDetalhesDocumentoAberto] = useState(false);
  const [documentoParaDetalhes, setDocumentoParaDetalhes] = useState<Documento | null>(null);


  const getEffectiveTenantId = (): string | undefined => {
    if (personificandoInfo) return personificandoInfo.empresaId;
    if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && usuarioAtual.tenantId) {
        return usuarioAtual.tenantId;
    }
    if (activeClientCompanyContext && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN)) {
        return activeClientCompanyContext.id;
    }
    return usuarioAtual?.tenantId || tenantAtual?.id;
  };

  const effectiveTenantId = useMemo(getEffectiveTenantId, [personificandoInfo, usuarioAtual, activeClientCompanyContext, tenantAtual]);
  
  const getStorageKey = () => effectiveTenantId ? `${STORAGE_KEY_DOCUMENTOS_PREFIX}${effectiveTenantId}` : null;

  useEffect(() => {
    const storageKey = getStorageKey();
    if (storageKey) {
      const documentosSalvos = localStorage.getItem(storageKey);
      if (documentosSalvos) {
        setDocumentos(JSON.parse(documentosSalvos));
      } else {
        setDocumentos([]); 
      }
    } else {
        setDocumentos([]); 
    }
  }, [effectiveTenantId]); 

  useEffect(() => {
    const storageKey = getStorageKey();
    if (storageKey && documentos.length >= 0) { 
      localStorage.setItem(storageKey, JSON.stringify(documentos));
    }
  }, [documentos, effectiveTenantId]);


  const handleAbrirModalUpload = () => {
    setNovoDocNome('');
    setNovoDocCategoria(categoriasDocumento[0]);
    setNovoDocArquivo(null);
    setModalUploadAberto(true);
  };

  const handleFecharModalUpload = () => {
    setModalUploadAberto(false);
  };

  const handleSalvarDocumento = () => {
    if (!novoDocNome || !novoDocArquivo || !effectiveTenantId) {
      alert('Nome do documento, arquivo e contexto de tenant são obrigatórios.');
      return;
    }
    const novoDocumento: Documento = {
      id: `doc-${Date.now()}`,
      nome: novoDocNome,
      categoria: novoDocCategoria,
      dataUpload: new Date().toISOString(),
      tamanho: `${(novoDocArquivo.size / 1024 / 1024).toFixed(2)}MB`,
      arquivoMock: novoDocArquivo,
      tenantId: effectiveTenantId,
    };
    setDocumentos(prevDocs => [novoDocumento, ...prevDocs]);
    handleFecharModalUpload();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setNovoDocArquivo(event.target.files[0]);
      if (!novoDocNome) { 
        setNovoDocNome(event.target.files[0].name);
      }
    }
  };
  
  const handleExcluirDocumento = (idDoc: string) => {
      if(window.confirm(`Tem certeza que deseja excluir o documento?`)) {
          setDocumentos(prevDocs => prevDocs.filter(d => d.id !== idDoc));
      }
  };

  const handleAbrirDetalhesDocumento = (documento: Documento) => {
    setDocumentoParaDetalhes(documento);
    setModalDetalhesDocumentoAberto(true);
  };

  const handleFecharDetalhesDocumento = () => {
    setModalDetalhesDocumentoAberto(false);
    setDocumentoParaDetalhes(null);
  };


  const documentosFiltrados = useMemo(() => {
    return documentos.filter(doc => {
      const porCategoria = filtroCategoria ? doc.categoria === filtroCategoria : true;
      const porNome = filtroNome ? doc.nome.toLowerCase().includes(filtroNome.toLowerCase()) : true;
      return porCategoria && porNome && doc.tenantId === effectiveTenantId;
    });
  }, [documentos, filtroCategoria, filtroNome, effectiveTenantId]);
  
  const getActiveContextName = () => {
    if (personificandoInfo) return personificandoInfo.empresaNome;
    if (activeClientCompanyContext) return activeClientCompanyContext.nome;
    if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && usuarioAtual.tenantId) {
      const empresasEscritorio = tenantAtual ? getEmpresasFromStorage(tenantAtual.id) : [];
      const empresaDoExterno = empresasEscritorio.find(e => e.id === usuarioAtual.tenantId);
      return empresaDoExterno?.nome || 'Empresa Cliente';
    }
    return tenantAtual?.nome || 'Escritório';
  };
  
  const activeContextName = useMemo(getActiveContextName, [personificandoInfo, activeClientCompanyContext, usuarioAtual, tenantAtual]);


  const formatarData = (isoString?: string) => {
    if (!isoString) return '-';
    const data = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {dateStyle: 'short', timeStyle: 'short'}).format(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center mb-4 sm:mb-0">
          <IconeDocumentos className="w-8 h-8 mr-3 text-nixcon-gold" />
          Gerenciador de Documentos {activeContextName && <span className="text-lg text-gray-500 dark:text-gray-400 ml-2">({activeContextName})</span>}
        </h1>
        <Button onClick={handleAbrirModalUpload} disabled={!effectiveTenantId} leftIcon={<IconeUpload className="w-4 h-4"/>}>
           Upload de Documento
        </Button>
      </div>

      <Card className="shadow-lg dark:bg-nixcon-dark-card">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <input 
            type="text" 
            placeholder="Buscar por nome..." 
            value={filtroNome}
            onChange={(e) => setFiltroNome(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold sm:w-auto w-full dark:bg-gray-700 dark:text-gray-200"
          />
          <div>
            <label htmlFor="filtroCategoria" className="sr-only">Filtrar por Categoria</label>
            <select
              id="filtroCategoria"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold text-sm sm:w-auto w-full bg-white dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="">Todas as Categorias</option>
              {categoriasDocumento.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome do Arquivo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data de Upload</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tamanho</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {documentosFiltrados.length > 0 ? documentosFiltrados.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                        onClick={() => handleAbrirDetalhesDocumento(doc)}
                        className="text-nixcon-dark dark:text-nixcon-light hover:text-nixcon-gold dark:hover:text-yellow-400 hover:underline focus:outline-none"
                        title="Ver detalhes do documento"
                    >
                        {doc.nome}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{doc.categoria}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatarData(doc.dataUpload)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{doc.tamanho}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => alert(`Download de ${doc.nome} (simulado)`)} 
                        className="text-nixcon-gold hover:text-yellow-700 dark:hover:text-yellow-400 mr-2"
                    >
                        Download
                    </Button>
                    <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleExcluirDocumento(doc.id)}
                    >
                        Excluir
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhum documento encontrado {filtroCategoria ? `para a categoria "${filtroCategoria}"` : ''}
                    {filtroNome ? ` contendo "${filtroNome}"` : ''}
                    {` no contexto de "${activeContextName}"`}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalUploadAberto} onClose={handleFecharModalUpload} title="Upload de Novo Documento">
        <div className="space-y-4">
          <div>
            <label htmlFor="docNome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Documento</label>
            <input 
              type="text" 
              id="docNome" 
              value={novoDocNome} 
              onChange={(e) => setNovoDocNome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold dark:bg-gray-700 dark:text-gray-200"
              placeholder="Ex: Balancete_Cliente_X_Jan24.pdf" 
            />
          </div>
          <div>
            <label htmlFor="docCategoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
            <select 
              id="docCategoria" 
              value={novoDocCategoria} 
              onChange={(e) => setNovoDocCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-nixcon-gold focus:border-nixcon-gold bg-white dark:bg-gray-700 dark:text-gray-200"
            >
              {categoriasDocumento.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="docArquivo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Arquivo</label>
            <input 
              type="file" 
              id="docArquivo" 
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-nixcon-gold file:text-white hover:file:bg-yellow-600"
            />
            {novoDocArquivo && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{novoDocArquivo.name} ({(novoDocArquivo.size / 1024 / 1024).toFixed(2)}MB)</p>}
          </div>
        </div>
        <div className="mt-6 text-right space-x-2">
          <Button variant="secondary" onClick={handleFecharModalUpload}>Cancelar</Button>
          <Button onClick={handleSalvarDocumento} disabled={!novoDocNome || !novoDocArquivo}>Salvar Documento</Button>
        </div>
      </Modal>

      {modalDetalhesDocumentoAberto && documentoParaDetalhes && (
        <Modal 
          isOpen={modalDetalhesDocumentoAberto} 
          onClose={handleFecharDetalhesDocumento} 
          title="Detalhes do Documento"
        >
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <p><strong>Nome:</strong> {documentoParaDetalhes.nome}</p>
            <p><strong>Categoria:</strong> {documentoParaDetalhes.categoria}</p>
            <p><strong>Data de Upload:</strong> {formatarData(documentoParaDetalhes.dataUpload)}</p>
            <p><strong>Tamanho:</strong> {documentoParaDetalhes.tamanho}</p>
            <p><strong>Tenant ID:</strong> {documentoParaDetalhes.tenantId}</p>
            {documentoParaDetalhes.arquivoMock && (
                <p><strong>Tipo (Mock):</strong> {documentoParaDetalhes.arquivoMock.type}</p>
            )}
          </div>
          <div className="mt-6 text-right space-x-2">
            <Button 
              variant="secondary" 
              onClick={() => alert(`Simulando abertura/download do documento "${documentoParaDetalhes.nome}"...`)}
            >
              Abrir/Baixar (Simulado)
            </Button>
            <Button onClick={handleFecharDetalhesDocumento}>Fechar</Button>
          </div>
        </Modal>
      )}


      <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-4">
        Upload e download real para AWS S3 e outras funcionalidades avançadas serão implementadas.
      </p>
    </div>
  );
};

export default DocumentosPage;
