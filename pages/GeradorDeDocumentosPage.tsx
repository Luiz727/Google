
import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeModelos, IconeDocumentos as IconeVisualizarDoc, IconeLixeira, IconeUpload, IconeAssinaturaEletronica } from '../components/common/Icons';
import { useAuth } from '../contexts/AuthContext';
import { TemplateDocumento, DocumentoGerado, Empresa, Tenant, FuncaoUsuario, Documento, DocumentoParaAssinatura, Signatario } from '../types';
import { STORAGE_KEY_PREFIX as STORAGE_KEY_PREFIX_EMPRESAS } from './EmpresasPage';
import { STORAGE_KEY_DOCUMENTOS_PREFIX } from './DocumentosPage';
import { STORAGE_KEY_ASSINATURAS_PREFIX } from './AssinaturaEletronicaPage';


const STORAGE_KEY_TEMPLATES_PREFIX = 'nixconPortalDocTemplates_';
const STORAGE_KEY_DOCUMENTOS_GERADOS_PREFIX = 'nixconPortalDocsGerados_';

const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400";
const textareaClasses = `${inputClasses} min-h-[150px]`;
const selectClasses = `${inputClasses} bg-white dark:bg-gray-700`;

const GeradorDeDocumentosPage: React.FC = () => {
  const { usuarioAtual, tenantAtual } = useAuth();
  const [templates, setTemplates] = useState<TemplateDocumento[]>([]);
  const [documentosGerados, setDocumentosGerados] = useState<DocumentoGerado[]>([]);
  
  const [abaAtiva, setAbaAtiva] = useState<'modelos' | 'gerados'>('modelos');

  // Modal para templates
  const [modalTemplateAberto, setModalTemplateAberto] = useState(false);
  const [templateEditando, setTemplateEditando] = useState<Partial<TemplateDocumento> | null>(null);

  // Modal para gerar documento
  const [modalGerarDocumentoAberto, setModalGerarDocumentoAberto] = useState(false);
  const [templateSelecionadoParaGerar, setTemplateSelecionadoParaGerar] = useState<TemplateDocumento | null>(null);
  const [empresaClienteSelecionada, setEmpresaClienteSelecionada] = useState<Empresa | null>(null);
  const [empresasClientesDisponiveis, setEmpresasClientesDisponiveis] = useState<Empresa[]>([]);
  const [previewConteudoGerado, setPreviewConteudoGerado] = useState<string>('');
  const [nomeDocumentoFinal, setNomeDocumentoFinal] = useState<string>('');

  const tenantIdEscritorio = tenantAtual?.id;

  useEffect(() => {
    if (tenantIdEscritorio) {
      // Carregar Templates
      const storageKeyTemplates = `${STORAGE_KEY_TEMPLATES_PREFIX}${tenantIdEscritorio}`;
      const templatesSalvos = localStorage.getItem(storageKeyTemplates);
      if (templatesSalvos) {
        setTemplates(JSON.parse(templatesSalvos));
      } else {
        setTemplates([]);
      }

      // Carregar Documentos Gerados
      const storageKeyGerados = `${STORAGE_KEY_DOCUMENTOS_GERADOS_PREFIX}${tenantIdEscritorio}`;
      const geradosSalvos = localStorage.getItem(storageKeyGerados);
      if (geradosSalvos) {
        setDocumentosGerados(JSON.parse(geradosSalvos));
      } else {
        setDocumentosGerados([]);
      }

      // Carregar Empresas Clientes
      const storageKeyEmpresas = `${STORAGE_KEY_PREFIX_EMPRESAS}${tenantIdEscritorio}`;
      const empresasSalvas = localStorage.getItem(storageKeyEmpresas);
      if (empresasSalvas) {
        setEmpresasClientesDisponiveis(JSON.parse(empresasSalvas));
      } else {
        setEmpresasClientesDisponiveis([]);
      }
    }
  }, [tenantIdEscritorio]);

  useEffect(() => {
    if (tenantIdEscritorio) {
      localStorage.setItem(`${STORAGE_KEY_TEMPLATES_PREFIX}${tenantIdEscritorio}`, JSON.stringify(templates));
    }
  }, [templates, tenantIdEscritorio]);

  useEffect(() => {
    if (tenantIdEscritorio) {
      localStorage.setItem(`${STORAGE_KEY_DOCUMENTOS_GERADOS_PREFIX}${tenantIdEscritorio}`, JSON.stringify(documentosGerados));
    }
  }, [documentosGerados, tenantIdEscritorio]);

  const handleAbrirModalTemplate = (template?: TemplateDocumento) => {
    setTemplateEditando(template ? { ...template } : { nome: '', conteudo: '' });
    setModalTemplateAberto(true);
  };

  const handleSalvarTemplate = (e: FormEvent) => {
    e.preventDefault();
    if (!templateEditando || !templateEditando.nome || !templateEditando.conteudo || !tenantIdEscritorio) {
      alert("Nome e conteúdo do modelo são obrigatórios.");
      return;
    }
    const agora = new Date().toISOString();
    if (templateEditando.id) {
      setTemplates(templates.map(t => t.id === templateEditando.id ? { ...t, ...templateEditando, dataAtualizacao: agora } as TemplateDocumento : t));
    } else {
      const novoTemplate: TemplateDocumento = {
        id: `tmpl-${Date.now()}`,
        tenantId: tenantIdEscritorio,
        dataCriacao: agora,
        dataAtualizacao: agora,
        ...templateEditando,
      } as TemplateDocumento;
      setTemplates(prev => [novoTemplate, ...prev]);
    }
    setModalTemplateAberto(false);
  };
  
  const handleExcluirTemplate = (idTemplate: string) => {
    if (window.confirm("Tem certeza que deseja excluir este modelo?")) {
        setTemplates(templates.filter(t => t.id !== idTemplate));
    }
  };

  const substituirPlaceholders = (conteudo: string, empresa?: Empresa | null, escritorio?: Tenant | null): string => {
    let conteudoProcessado = conteudo;
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR');
    const dataExtenso = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    conteudoProcessado = conteudoProcessado.replace(/{{DATA_ATUAL}}/g, dataFormatada);
    conteudoProcessado = conteudoProcessado.replace(/{{DATA_ATUAL_EXTENSO}}/g, dataExtenso);

    if (escritorio) {
        conteudoProcessado = conteudoProcessado.replace(/{{ESCRITORIO_NOME}}/g, escritorio.nome || 'N/A');
        conteudoProcessado = conteudoProcessado.replace(/{{ESCRITORIO_CNPJ}}/g, escritorio.configuracoesEmissor?.cnpj || 'N/A');
    }
    if (empresa) {
        conteudoProcessado = conteudoProcessado.replace(/{{CLIENTE_NOME}}/g, empresa.nome || 'N/A');
        conteudoProcessado = conteudoProcessado.replace(/{{CLIENTE_CNPJ}}/g, empresa.cnpj || 'N/A');
        conteudoProcessado = conteudoProcessado.replace(/{{CLIENTE_EMAIL}}/g, empresa.email || 'N/A');
        conteudoProcessado = conteudoProcessado.replace(/{{CLIENTE_TELEFONE}}/g, empresa.telefone || 'N/A');
        const enderecoCompleto = empresa.endereco ? `${empresa.endereco.logradouro}, ${empresa.endereco.numero} - ${empresa.endereco.bairro}, ${empresa.endereco.cidade}/${empresa.endereco.uf}, CEP ${empresa.endereco.cep}` : 'N/A';
        conteudoProcessado = conteudoProcessado.replace(/{{CLIENTE_ENDERECO_COMPLETO}}/g, enderecoCompleto);
    }
    return conteudoProcessado;
  };

  const handleAbrirModalGerarDocumento = (template: TemplateDocumento) => {
    setTemplateSelecionadoParaGerar(template);
    setEmpresaClienteSelecionada(null);
    setPreviewConteudoGerado(substituirPlaceholders(template.conteudo, null, tenantAtual));
    setNomeDocumentoFinal(`${template.nome} - ${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.txt`); // Default extension
    setModalGerarDocumentoAberto(true);
  };
  
  useEffect(() => {
    if (templateSelecionadoParaGerar) {
        setPreviewConteudoGerado(substituirPlaceholders(templateSelecionadoParaGerar.conteudo, empresaClienteSelecionada, tenantAtual));
        if(empresaClienteSelecionada) {
             setNomeDocumentoFinal(`${templateSelecionadoParaGerar.nome} - ${empresaClienteSelecionada.nome} - ${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.txt`);
        } else {
            setNomeDocumentoFinal(`${templateSelecionadoParaGerar.nome} - ${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.txt`);
        }
    }
  }, [empresaClienteSelecionada, templateSelecionadoParaGerar, tenantAtual]);


  const salvarNoModuloDocumentos = (docGerado: DocumentoGerado): string | undefined => {
    if (!tenantIdEscritorio) return undefined;

    const tenantIdParaDocumento = docGerado.empresaClienteId || tenantIdEscritorio;
    const storageKeyDocs = `${STORAGE_KEY_DOCUMENTOS_PREFIX}${tenantIdParaDocumento}`;
    const documentosAtuaisStr = localStorage.getItem(storageKeyDocs);
    const documentosAtuais: Documento[] = documentosAtuaisStr ? JSON.parse(documentosAtuaisStr) : [];
    
    const novoDocumentoPrincipal: Documento = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        nome: docGerado.nomeDocumento,
        categoria: "Gerado via Modelo", 
        dataUpload: docGerado.dataGeracao,
        tamanho: `${(new TextEncoder().encode(docGerado.conteudoFinalGerado || '').length / 1024).toFixed(2)} KB`,
        tenantId: tenantIdParaDocumento,
        tipoArquivo: 'text/plain', // ou application/pdf se for gerado como PDF futuramente
        detalhesGeracao: { // Crucial para a página DocumentosPage e AssinaturaEletronicaPage
            nomeTemplateUsado: docGerado.nomeTemplateUsado,
            empresaClienteNome: docGerado.empresaClienteNome,
            conteudoFinalGerado: docGerado.conteudoFinalGerado || '',
            processoAssinaturaId: docGerado.processoAssinaturaId 
        }
    };

    documentosAtuais.unshift(novoDocumentoPrincipal); // Adiciona no início
    localStorage.setItem(storageKeyDocs, JSON.stringify(documentosAtuais));
    console.log(`Documento "${novoDocumentoPrincipal.nome}" salvo no módulo de Documentos para tenant ${tenantIdParaDocumento}.`);
    return novoDocumentoPrincipal.id;
  };

  const handleSalvarDocumentoGerado = (enviarParaAssinatura: boolean = false) => {
    if (!templateSelecionadoParaGerar || !tenantIdEscritorio || !empresaClienteSelecionada || !usuarioAtual) {
        alert("Template, Empresa Cliente e Usuário são necessários.");
        return;
    }
    
    const idDocGerado = `docgen-${Date.now()}`;
    let documentoSalvoIdNoSistema: string | undefined = undefined;
    let processoAssinaturaIdNoSistema: string | undefined = undefined;

    const docGeradoBase: DocumentoGerado = {
        id: idDocGerado,
        nomeDocumento: nomeDocumentoFinal || `Documento Gerado ${Date.now()}`,
        templateIdUsado: templateSelecionadoParaGerar.id,
        nomeTemplateUsado: templateSelecionadoParaGerar.nome,
        empresaClienteId: empresaClienteSelecionada.id,
        empresaClienteNome: empresaClienteSelecionada.nome,
        dataGeracao: new Date().toISOString(),
        conteudoFinalGerado: previewConteudoGerado,
        tenantId: tenantIdEscritorio,
    };
    
    documentoSalvoIdNoSistema = salvarNoModuloDocumentos(docGeradoBase);
    if (documentoSalvoIdNoSistema) {
        docGeradoBase.documentoSalvoId = documentoSalvoIdNoSistema;
    }

    if (enviarParaAssinatura && documentoSalvoIdNoSistema) {
        const storageKeyAssinaturas = `${STORAGE_KEY_ASSINATURAS_PREFIX}${tenantIdEscritorio}`; 
        const assinaturasAtuaisStr = localStorage.getItem(storageKeyAssinaturas);
        const assinaturasAtuais: DocumentoParaAssinatura[] = assinaturasAtuaisStr ? JSON.parse(assinaturasAtuaisStr) : [];

        const mockSigner: Signatario = {
            id: `mocksig-${Date.now()}`,
            nome: empresaClienteSelecionada.contatoPrincipal || empresaClienteSelecionada.nome,
            email: empresaClienteSelecionada.email || 'cliente@example.com',
            status: 'PENDENTE',
            ordem: 1,
        };
        
        const tenantDoDocumentoOriginal = empresaClienteSelecionada.id || tenantIdEscritorio;

        const novoProcessoAssinatura: DocumentoParaAssinatura = {
            id: `docass-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            nomeDocumentoCliente: docGeradoBase.nomeDocumento,
            idDocumentoOriginal: documentoSalvoIdNoSistema,
            documentoOriginalTenantId: tenantDoDocumentoOriginal, // Novo campo!
            nomeTemplateUsadoContexto: templateSelecionadoParaGerar.nome, // Adicionado na etapa anterior
            empresaClienteNomeContexto: empresaClienteSelecionada.nome, // Adicionado na etapa anterior
            dataEnvio: new Date().toISOString(),
            statusGeral: 'PENDENTE_TODOS',
            signatarios: [mockSigner],
            tenantId: tenantIdEscritorio, // Processo de assinatura é do escritório
            criadorId: usuarioAtual.id,
            criadorNome: usuarioAtual.nome,
            tipoAssinatura: 'SEQUENCIAL',
            proximoSignatarioNaOrdem: 1,
            historicoEventos: [{ data: new Date().toISOString(), evento: 'Documento enviado para assinatura (via Geração)' }]
        };
        assinaturasAtuais.unshift(novoProcessoAssinatura);
        localStorage.setItem(storageKeyAssinaturas, JSON.stringify(assinaturasAtuais));
        processoAssinaturaIdNoSistema = novoProcessoAssinatura.id;
        docGeradoBase.processoAssinaturaId = processoAssinaturaIdNoSistema;

        // Atualiza o Documento no módulo principal com o ID do processo de assinatura, se não foi feito em salvarNoModuloDocumentos
        if(documentoSalvoIdNoSistema) {
            const storageKeyDocs = `${STORAGE_KEY_DOCUMENTOS_PREFIX}${tenantDoDocumentoOriginal}`;
            const docsPrincipaisStr = localStorage.getItem(storageKeyDocs);
            if(docsPrincipaisStr) {
                let docsPrincipais: Documento[] = JSON.parse(docsPrincipaisStr);
                docsPrincipais = docsPrincipais.map(d => {
                    if (d.id === documentoSalvoIdNoSistema && d.detalhesGeracao) {
                        return {...d, detalhesGeracao: {...d.detalhesGeracao, processoAssinaturaId: processoAssinaturaIdNoSistema }};
                    }
                    return d;
                });
                localStorage.setItem(storageKeyDocs, JSON.stringify(docsPrincipais));
            }
        }
        console.log(`Processo de assinatura para "${novoProcessoAssinatura.nomeDocumentoCliente}" iniciado.`);
    }

    setDocumentosGerados(prev => [docGeradoBase, ...prev]);
    
    let mensagemAlerta = `Documento "${docGeradoBase.nomeDocumento}" salvo!`;
    if(documentoSalvoIdNoSistema) mensagemAlerta += ` Registrado no módulo de Documentos.`;
    if(processoAssinaturaIdNoSistema) mensagemAlerta += ` Processo de assinatura iniciado.`;
    
    alert(mensagemAlerta);
    setModalGerarDocumentoAberto(false);
  };


  const formatarData = (isoString?: string) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  
  const placeholdersDisponiveis = [
    '{{CLIENTE_NOME}}', '{{CLIENTE_CNPJ}}', '{{CLIENTE_EMAIL}}', '{{CLIENTE_TELEFONE}}',
    '{{CLIENTE_ENDERECO_COMPLETO}}', '{{ESCRITORIO_NOME}}', '{{ESCRITORIO_CNPJ}}',
    '{{DATA_ATUAL}}', '{{DATA_ATUAL_EXTENSO}}'
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center mb-4 sm:mb-0">
          <IconeModelos className="w-8 h-8 mr-3 text-nixcon-gold" />
          Modelos e Documentos
        </h1>
        {abaAtiva === 'modelos' && <Button onClick={() => handleAbrirModalTemplate()}>Novo Modelo</Button>}
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setAbaAtiva('modelos')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${abaAtiva === 'modelos' ? 'border-nixcon-gold text-nixcon-gold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}>
            Meus Modelos ({templates.length})
          </button>
          <button onClick={() => setAbaAtiva('gerados')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${abaAtiva === 'gerados' ? 'border-nixcon-gold text-nixcon-gold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}>
            Documentos Gerados ({documentosGerados.length})
          </button>
        </nav>
      </div>

      {abaAtiva === 'modelos' && (
        <Card className="shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome do Modelo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data Criação</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
                {templates.map(template => (
                  <tr key={template.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-nixcon-charcoal dark:text-nixcon-light">{template.nome}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={template.descricao}>{template.descricao || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatarData(template.dataCriacao)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                      <Button variant="secondary" size="sm" onClick={() => handleAbrirModalGerarDocumento(template)}>Usar</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleAbrirModalTemplate(template)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => handleExcluirTemplate(template.id)}><IconeLixeira className="w-4 h-4"/></Button>
                    </td>
                  </tr>
                ))}
                {templates.length === 0 && (<tr><td colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhum modelo cadastrado.</td></tr>)}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {abaAtiva === 'gerados' && (
         <Card className="shadow-lg">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome do Documento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente Associado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Modelo Usado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data Geração</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status Integrações</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
                    {documentosGerados.map(doc => (
                    <tr key={doc.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-nixcon-charcoal dark:text-nixcon-light">{doc.nomeDocumento}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{doc.empresaClienteNome}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{doc.nomeTemplateUsado}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatarData(doc.dataGeracao)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {doc.documentoSalvoId && <span className="block text-xs text-green-600 dark:text-green-400" title={`ID Doc: ${doc.documentoSalvoId}`}><IconeVisualizarDoc className="w-3 h-3 inline mr-1"/> Salvo Docs</span>}
                            {doc.processoAssinaturaId && <span className="block text-xs text-blue-600 dark:text-blue-400 mt-0.5" title={`ID Assin.: ${doc.processoAssinaturaId}`}><IconeAssinaturaEletronica className="w-3 h-3 inline mr-1"/> Em Assinatura</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => alert(`Visualizar documento: ${doc.nomeDocumento} (Mock)`)}>Ver</Button>
                            {!doc.processoAssinaturaId && doc.documentoSalvoId &&
                                <Button variant="secondary" size="sm" onClick={() => alert(`Enviar para assinatura: ${doc.nomeDocumento} (Mock)`)}>Enviar Assinatura</Button>
                            }
                        </td>
                    </tr>
                    ))}
                    {documentosGerados.length === 0 && (<tr><td colSpan={6} className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhum documento gerado ainda.</td></tr>)}
                </tbody>
                </table>
            </div>
        </Card>
      )}

      {/* Modal de Criação/Edição de Template */}
      {modalTemplateAberto && templateEditando && (
        <Modal isOpen={modalTemplateAberto} onClose={() => setModalTemplateAberto(false)} title={templateEditando.id ? "Editar Modelo" : "Novo Modelo de Documento"}>
          <form onSubmit={handleSalvarTemplate} className="space-y-4">
            <div>
              <label htmlFor="nomeTemplate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Modelo*</label>
              <input type="text" id="nomeTemplate" value={templateEditando.nome || ''} onChange={e => setTemplateEditando(p => p ? {...p, nome: e.target.value} : null)} required className={inputClasses} />
            </div>
            <div>
              <label htmlFor="descricaoTemplate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
              <input type="text" id="descricaoTemplate" value={templateEditando.descricao || ''} onChange={e => setTemplateEditando(p => p ? {...p, descricao: e.target.value} : null)} className={inputClasses} />
            </div>
            <div>
              <label htmlFor="conteudoTemplate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Conteúdo do Modelo*</label>
              <textarea id="conteudoTemplate" value={templateEditando.conteudo || ''} onChange={e => setTemplateEditando(p => p ? {...p, conteudo: e.target.value} : null)} required className={textareaClasses} placeholder="Insira o texto do seu modelo aqui. Use placeholders como {{CLIENTE_NOME}}."/>
              <div className="mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Placeholders disponíveis (exemplo):</p>
                <div className="flex flex-wrap gap-1 text-xs mt-0.5">
                    {placeholdersDisponiveis.map(ph => <code key={ph} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-700 dark:text-gray-300">{ph}</code>)}
                </div>
              </div>
            </div>
            <div className="text-right space-x-2">
              <Button type="button" variant="secondary" onClick={() => setModalTemplateAberto(false)}>Cancelar</Button>
              <Button type="submit">Salvar Modelo</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de Geração de Documento */}
      {modalGerarDocumentoAberto && templateSelecionadoParaGerar && (
        <Modal isOpen={modalGerarDocumentoAberto} onClose={() => setModalGerarDocumentoAberto(false)} title={`Gerar Documento: ${templateSelecionadoParaGerar.nome}`}>
            <div className="space-y-4 max-h-[75vh] flex flex-col">
                <div>
                    <label htmlFor="empresaClienteGerar" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecione a Empresa Cliente*</label>
                    <select 
                        id="empresaClienteGerar" 
                        value={empresaClienteSelecionada?.id || ''} 
                        onChange={e => {
                            const empresa = empresasClientesDisponiveis.find(emp => emp.id === e.target.value);
                            setEmpresaClienteSelecionada(empresa || null);
                        }} 
                        required 
                        className={selectClasses}
                    >
                        <option value="">Selecione uma empresa...</option>
                        {empresasClientesDisponiveis.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.nome} ({emp.cnpj})</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="nomeDocumentoFinal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Documento Final*</label>
                    <input type="text" id="nomeDocumentoFinal" value={nomeDocumentoFinal} onChange={e => setNomeDocumentoFinal(e.target.value)} required className={inputClasses} />
                </div>

                <div className="flex-grow overflow-y-auto border p-3 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                    <h4 className="text-md font-semibold text-nixcon-dark dark:text-nixcon-light mb-2">Preview do Conteúdo (Simulado)</h4>
                    <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">{previewConteudoGerado}</pre>
                </div>
                
                <div className="text-right space-x-2 pt-3 border-t dark:border-gray-600">
                    <Button type="button" variant="secondary" onClick={() => setModalGerarDocumentoAberto(false)}>Cancelar</Button>
                    <Button type="button" onClick={() => handleSalvarDocumentoGerado(false)} disabled={!empresaClienteSelecionada || !nomeDocumentoFinal} leftIcon={<IconeVisualizarDoc className="w-4 h-4"/>}>
                        Salvar em Documentos
                    </Button>
                     <Button type="button" onClick={() => handleSalvarDocumentoGerado(true)} disabled={!empresaClienteSelecionada || !nomeDocumentoFinal} leftIcon={<IconeAssinaturaEletronica className="w-4 h-4"/>}>
                        Salvar e Enviar Assinatura
                    </Button>
                </div>
            </div>
        </Modal>
      )}

    </div>
  );
};

export default GeradorDeDocumentosPage;

const style = document.createElement('style');
style.innerHTML = `
  .text-xxs {
    font-size: 0.6rem; 
    line-height: 0.8rem; 
  }
`;
document.head.appendChild(style);