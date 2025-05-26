


import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { IconeAssinaturaEletronica, IconeLixeira, IconeModelos } from '../components/common/Icons'; // Adicionado IconeModelos
import { useAuth } from '../contexts/AuthContext';
import { 
  DocumentoParaAssinatura, 
  Signatario, 
  StatusAssinaturaDocumento, 
  StatusSignatario, 
  FuncaoUsuario,
  Documento 
} from '../types';
import { STORAGE_KEY_DOCUMENTOS_PREFIX } from './DocumentosPage'; 


export const STORAGE_KEY_ASSINATURAS_PREFIX = 'nixconPortalAssinaturas_';

const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-nixcon-gold focus:border-nixcon-gold sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400";

const AssinaturaEletronicaPage: React.FC = () => {
  const { usuarioAtual, tenantAtual, personificandoInfo, activeClientCompanyContext } = useAuth();
  const [documentosEmAssinatura, setDocumentosEmAssinatura] = useState<DocumentoParaAssinatura[]>([]);
  
  const [modalEnviarAberto, setModalEnviarAberto] = useState(false);
  const [docParaEnvio, setDocParaEnvio] = useState<Partial<DocumentoParaAssinatura>>({ signatarios: [] });
  const [signatarioForm, setSignatarioForm] = useState<Partial<Signatario>>({ nome: '', email: '' });

  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [docParaDetalhes, setDocParaDetalhes] = useState<DocumentoParaAssinatura | null>(null);
  
  const [modalVerConteudoBaseAberto, setModalVerConteudoBaseAberto] = useState(false);
  const [conteudoParaVisualizar, setConteudoParaVisualizar] = useState<string | null>(null);
  const [nomeDocumentoBaseVisualizar, setNomeDocumentoBaseVisualizar] = useState<string>('');


  const getEffectiveTenantId = (): string | undefined => {
    if (personificandoInfo) return personificandoInfo.empresaId;
    if (usuarioAtual?.funcao === FuncaoUsuario.USUARIO_EXTERNO_CLIENTE && usuarioAtual.tenantId) return usuarioAtual.tenantId;
    if (activeClientCompanyContext && (usuarioAtual?.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || usuarioAtual?.funcao === FuncaoUsuario.SUPERADMIN)) return activeClientCompanyContext.id;
    return usuarioAtual?.tenantId || tenantAtual?.id;
  };
  const effectiveTenantId = useMemo(getEffectiveTenantId, [personificandoInfo, usuarioAtual, activeClientCompanyContext, tenantAtual]);

  useEffect(() => {
    if (effectiveTenantId) {
      const storageKey = `${STORAGE_KEY_ASSINATURAS_PREFIX}${effectiveTenantId}`;
      const documentosSalvos = localStorage.getItem(storageKey);
      if (documentosSalvos) {
        setDocumentosEmAssinatura(JSON.parse(documentosSalvos));
      } else {
        setDocumentosEmAssinatura([]);
      }
    } else {
      setDocumentosEmAssinatura([]);
    }
  }, [effectiveTenantId]);

  useEffect(() => {
    if (effectiveTenantId) {
      const storageKey = `${STORAGE_KEY_ASSINATURAS_PREFIX}${effectiveTenantId}`;
      localStorage.setItem(storageKey, JSON.stringify(documentosEmAssinatura));
    }
  }, [documentosEmAssinatura, effectiveTenantId]);

  const handleAbrirModalEnviar = () => {
    setDocParaEnvio({ nomeDocumentoCliente: '', mensagemOpcional: '', signatarios: [] });
    setSignatarioForm({ nome: '', email: '' });
    setModalEnviarAberto(true);
  };

  const handleAdicionarSignatario = () => {
    if (!signatarioForm.nome || !signatarioForm.email) {
      alert("Nome e email do signatário são obrigatórios.");
      return;
    }
    const novoSignatario: Signatario = {
      id: `sig-${Date.now()}`,
      nome: signatarioForm.nome,
      email: signatarioForm.email,
      status: 'PENDENTE',
      ordem: (docParaEnvio.signatarios?.length || 0) + 1,
    };
    setDocParaEnvio(prev => ({ ...prev, signatarios: [...(prev.signatarios || []), novoSignatario] }));
    setSignatarioForm({ nome: '', email: '' });
  };

  const handleRemoverSignatario = (idSignatario: string) => {
    setDocParaEnvio(prev => ({
      ...prev,
      signatarios: prev.signatarios?.filter(s => s.id !== idSignatario)
                       .map((s, index) => ({ ...s, ordem: index + 1 })) 
    }));
  };

  const handleEnviarParaAssinatura = (e: FormEvent) => {
    e.preventDefault();
    if (!docParaEnvio.nomeDocumentoCliente || !docParaEnvio.signatarios || docParaEnvio.signatarios.length === 0) {
      alert("Nome do documento e pelo menos um signatário são obrigatórios.");
      return;
    }
    if (!effectiveTenantId || !usuarioAtual) return;

    const novoDocumento: DocumentoParaAssinatura = {
      id: `docass-${Date.now()}`,
      nomeDocumentoCliente: docParaEnvio.nomeDocumentoCliente!,
      dataEnvio: new Date().toISOString(),
      statusGeral: 'PENDENTE_TODOS',
      signatarios: docParaEnvio.signatarios.map(s => ({...s, status: 'PENDENTE'}) as Signatario),
      tenantId: effectiveTenantId,
      criadorId: usuarioAtual.id,
      criadorNome: usuarioAtual.nome,
      mensagemOpcional: docParaEnvio.mensagemOpcional,
      tipoAssinatura: 'SEQUENCIAL', 
      proximoSignatarioNaOrdem: 1, 
      historicoEventos: [{data: new Date().toISOString(), evento: 'Documento enviado para assinatura'}]
    };
    setDocumentosEmAssinatura(prev => [novoDocumento, ...prev]);
    setModalEnviarAberto(false);
  };

  const handleAbrirDetalhes = (doc: DocumentoParaAssinatura) => {
    setDocParaDetalhes(doc);
    setModalDetalhesAberto(true);
  };

  const handleSimularAssinatura = (docId: string, signatarioId: string) => {
    setDocumentosEmAssinatura(prevDocs => prevDocs.map(doc => {
      if (doc.id === docId) {
        let todosAssinaram = true;
        let proximoNaOrdem = doc.proximoSignatarioNaOrdem || 1;
        const signatariosAtualizados = doc.signatarios.map(sig => {
          if (sig.id === signatarioId) {
            proximoNaOrdem = (sig.ordem || 0) + 1;
            return { ...sig, status: 'ASSINADO' as StatusSignatario, dataAssinatura: new Date().toISOString() };
          }
          if (sig.status !== 'ASSINADO') todosAssinaram = false;
          return sig;
        });
        
        todosAssinaram = signatariosAtualizados.every(s => s.status === 'ASSINADO');

        const statusGeralAtualizado: StatusAssinaturaDocumento = todosAssinaram 
          ? 'CONCLUIDO' 
          : (proximoNaOrdem > doc.signatarios.length ? 'PENDENTE_TODOS' : 'AGUARDANDO_SIGNATARIO');
        
        const docAtualizado = { 
          ...doc, 
          signatarios: signatariosAtualizados, 
          statusGeral: statusGeralAtualizado,
          proximoSignatarioNaOrdem: proximoNaOrdem,
          historicoEventos: [...(doc.historicoEventos || []), {data: new Date().toISOString(), evento: `Assinatura registrada para ${signatariosAtualizados.find(s=>s.id === signatarioId)?.nome}`}]
        };
        if (docAtualizado.id === docParaDetalhes?.id) setDocParaDetalhes(docAtualizado);
        return docAtualizado;
      }
      return doc;
    }));
    alert("Documento assinado com sucesso (simulado)!");
  };
  
  const getStatusGeralLabel = (status: StatusAssinaturaDocumento) => {
    const map: Record<StatusAssinaturaDocumento, string> = {
      PENDENTE_TODOS: 'Pendente (Todos)', AGUARDANDO_SIGNATARIO: 'Aguardando Próximo', PARCIALMENTE_ASSINADO: 'Parcialmente Assinado',
      CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado', EXPIRADO: 'Expirado', RECUSADO: 'Recusado',
    };
    return map[status] || status;
  };
  
  const getStatusSignatarioLabel = (status: StatusSignatario) => {
     const map: Record<StatusSignatario, string> = { PENDENTE: 'Pendente', ASSINADO: 'Assinado', RECUSADO: 'Recusado' };
     return map[status] || status;
  };

  const handleVerDocumentoBase = () => {
    if (docParaDetalhes?.idDocumentoOriginal && docParaDetalhes.documentoOriginalTenantId) {
        const storageKeyDocOriginal = `${STORAGE_KEY_DOCUMENTOS_PREFIX}${docParaDetalhes.documentoOriginalTenantId}`;
        const documentosSalvosStr = localStorage.getItem(storageKeyDocOriginal);
        if (documentosSalvosStr) {
            const todosDocumentosTenant: Documento[] = JSON.parse(documentosSalvosStr);
            const docOriginal = todosDocumentosTenant.find(d => d.id === docParaDetalhes.idDocumentoOriginal);
            if (docOriginal && docOriginal.detalhesGeracao?.conteudoFinalGerado) {
                setConteudoParaVisualizar(docOriginal.detalhesGeracao.conteudoFinalGerado);
                setNomeDocumentoBaseVisualizar(docOriginal.nome);
                setModalVerConteudoBaseAberto(true);
            } else {
                alert("Conteúdo do documento base não encontrado ou o documento não foi gerado por um modelo.");
            }
        } else {
            alert("Repositório de documentos do tenant original não encontrado.");
        }
    } else {
        alert("ID do documento original ou seu tenant não especificado.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-nixcon-dark dark:text-nixcon-light flex items-center mb-4 sm:mb-0">
          <IconeAssinaturaEletronica className="w-8 h-8 mr-3 text-nixcon-gold" />
          Assinatura Eletrônica ({effectiveTenantId ? `Contexto: ${effectiveTenantId}` : 'Sem contexto'})
        </h1>
        <Button onClick={handleAbrirModalEnviar} disabled={!effectiveTenantId}>Enviar Novo Documento</Button>
      </div>

      <Card className="shadow-lg dark:bg-nixcon-dark-card">
        <h2 className="text-xl font-semibold text-nixcon-dark dark:text-nixcon-light mb-4">Documentos Enviados para Assinatura</h2>
         <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Documento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status Geral</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data Envio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Signatários</th>
                <th className="relative px-4 py-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-nixcon-dark-card divide-y divide-gray-200 dark:divide-gray-700">
              {documentosEmAssinatura.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-nixcon-dark dark:text-nixcon-light">
                    {doc.nomeDocumentoCliente}
                    {doc.nomeTemplateUsadoContexto && (
                        <span className="ml-2 px-1.5 py-0.5 text-xxs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100 inline-flex items-center" title={`Gerado do Modelo: ${doc.nomeTemplateUsadoContexto}`}>
                           <IconeModelos className="w-2.5 h-2.5 mr-0.5"/> Gerado
                        </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      doc.statusGeral === 'CONCLUIDO' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' :
                      doc.statusGeral === 'PENDENTE_TODOS' || doc.statusGeral === 'AGUARDANDO_SIGNATARIO' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                    }`}>
                      {getStatusGeralLabel(doc.statusGeral)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(doc.dataEnvio).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" title={doc.signatarios.map(s => `${s.nome} (${getStatusSignatarioLabel(s.status)})`).join(', ')}>
                    {doc.signatarios.length} signatário(s)
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm" onClick={() => handleAbrirDetalhes(doc)}>Ver Detalhes/Assinar</Button>
                  </td>
                </tr>
              ))}
              {documentosEmAssinatura.length === 0 && (
                <tr><td colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhum documento enviado para assinatura neste contexto.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modalEnviarAberto && (
        <Modal isOpen={modalEnviarAberto} onClose={() => setModalEnviarAberto(false)} title="Enviar Novo Documento para Assinatura">
          <form onSubmit={handleEnviarParaAssinatura} className="space-y-4">
            <div>
              <label htmlFor="nomeDocumentoCliente" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Documento*</label>
              <input type="text" id="nomeDocumentoCliente" value={docParaEnvio.nomeDocumentoCliente || ''} onChange={(e) => setDocParaEnvio(prev => ({...prev, nomeDocumentoCliente: e.target.value}))} required className={inputClasses} />
            </div>
            <div>
              <label htmlFor="mensagemOpcional" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mensagem Opcional</label>
              <textarea id="mensagemOpcional" rows={2} value={docParaEnvio.mensagemOpcional || ''} onChange={(e) => setDocParaEnvio(prev => ({...prev, mensagemOpcional: e.target.value}))} className={inputClasses}></textarea>
            </div>
            
            <fieldset className="border p-3 rounded-md dark:border-gray-600">
              <legend className="text-md font-medium text-nixcon-dark dark:text-nixcon-light px-1">Signatários</legend>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end mt-1">
                <div className="md:col-span-2"><label className="text-xs text-gray-600 dark:text-gray-400">Nome*</label><input type="text" placeholder="Nome do Signatário" value={signatarioForm.nome || ''} onChange={(e) => setSignatarioForm(prev => ({...prev, nome: e.target.value}))} className={inputClasses + " text-sm"} /></div>
                <div className="md:col-span-2"><label className="text-xs text-gray-600 dark:text-gray-400">Email*</label><input type="email" placeholder="Email do Signatário" value={signatarioForm.email || ''} onChange={(e) => setSignatarioForm(prev => ({...prev, email: e.target.value}))} className={inputClasses + " text-sm"} /></div>
                <Button type="button" onClick={handleAdicionarSignatario} variant="secondary" size="sm" fullWidth disabled={!signatarioForm.nome || !signatarioForm.email}>Adicionar</Button>
              </div>
              {docParaEnvio.signatarios && docParaEnvio.signatarios.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs max-h-40 overflow-y-auto">
                  {docParaEnvio.signatarios.map((sig, index) => (
                    <li key={sig.id} className="flex justify-between items-center p-1.5 bg-gray-100 dark:bg-gray-700 rounded">
                      <span className="text-gray-700 dark:text-gray-200">{index + 1}. {sig.nome} ({sig.email})</span>
                      <button type="button" onClick={() => handleRemoverSignatario(sig.id)} className="text-red-500 hover:text-red-700 p-0.5"><IconeLixeira className="w-3 h-3"/></button>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>

            <div className="mt-6 text-right space-x-2">
              <Button type="button" variant="secondary" onClick={() => setModalEnviarAberto(false)}>Cancelar</Button>
              <Button type="submit">Criar e Enviar</Button>
            </div>
          </form>
        </Modal>
      )}

      {modalDetalhesAberto && docParaDetalhes && (
        <Modal isOpen={modalDetalhesAberto} onClose={() => setModalDetalhesAberto(false)} title={`Detalhes: ${docParaDetalhes.nomeDocumentoCliente}`}>
          <div className="space-y-3 text-sm">
            <p><strong>Status Geral:</strong> <span className={`font-semibold ${docParaDetalhes.statusGeral === 'CONCLUIDO' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>{getStatusGeralLabel(docParaDetalhes.statusGeral)}</span></p>
            <p className="text-gray-700 dark:text-gray-300"><strong>Enviado por:</strong> {docParaDetalhes.criadorNome} em {new Date(docParaDetalhes.dataEnvio).toLocaleString('pt-BR')}</p>
            {docParaDetalhes.mensagemOpcional && <p className="text-gray-700 dark:text-gray-300"><strong>Mensagem:</strong> {docParaDetalhes.mensagemOpcional}</p>}
            
            {docParaDetalhes.nomeTemplateUsadoContexto && (
                <p className="text-gray-700 dark:text-gray-300"><strong>Origem:</strong> Modelo '{docParaDetalhes.nomeTemplateUsadoContexto}' para Cliente '{docParaDetalhes.empresaClienteNomeContexto || 'N/A'}'</p>
            )}
            {docParaDetalhes.idDocumentoOriginal && (
                <Button variant="ghost" size="sm" onClick={handleVerDocumentoBase} className="text-xs p-0 text-nixcon-gold hover:underline">Ver Documento Base</Button>
            )}

            <h4 className="font-semibold mt-2 text-gray-700 dark:text-gray-300">Signatários:</h4>
            <ul className="space-y-1 text-xs">
              {docParaDetalhes.signatarios.map(sig => (
                <li key={sig.id} className={`p-1.5 rounded ${sig.status === 'ASSINADO' ? 'bg-green-50 dark:bg-green-800' : sig.status === 'RECUSADO' ? 'bg-red-50 dark:bg-red-800' : 'bg-gray-50 dark:bg-gray-700'}`}>
                  <span className="text-gray-700 dark:text-gray-200">{sig.ordem}. {sig.nome} ({sig.email}) - Status: <strong>{getStatusSignatarioLabel(sig.status)}</strong></span>
                  {sig.dataAssinatura && <span className="text-gray-600 dark:text-gray-400"> em {new Date(sig.dataAssinatura).toLocaleDateString('pt-BR')}</span>}
                  {sig.status === 'PENDENTE' && usuarioAtual?.email?.toLowerCase() === sig.email.toLowerCase() && (docParaDetalhes.proximoSignatarioNaOrdem === sig.ordem || !docParaDetalhes.proximoSignatarioNaOrdem) && (
                    <Button size="sm" onClick={() => handleSimularAssinatura(docParaDetalhes.id, sig.id)} className="ml-2 text-xs py-0.5 px-1">Assinar Agora (Simulado)</Button>
                  )}
                </li>
              ))}
            </ul>
            {docParaDetalhes.documentoAssinadoUrlMock && <p className="mt-2 text-gray-700 dark:text-gray-300"><strong>Documento Assinado:</strong> <a href={docParaDetalhes.documentoAssinadoUrlMock} target="_blank" rel="noopener noreferrer" className="text-nixcon-gold hover:underline">Visualizar (Mock)</a></p>}
          </div>
           <div className="mt-6 text-right space-x-2">
              <Button variant="secondary" onClick={() => setModalDetalhesAberto(false)}>Fechar</Button>
            </div>
        </Modal>
      )}

      {modalVerConteudoBaseAberto && (
          <Modal 
            isOpen={modalVerConteudoBaseAberto} 
            onClose={() => {setModalVerConteudoBaseAberto(false); setConteudoParaVisualizar(null); setNomeDocumentoBaseVisualizar('');}}
            title={`Conteúdo do Documento: ${nomeDocumentoBaseVisualizar}`}
          >
            <div className="max-h-[60vh] overflow-y-auto bg-gray-100 dark:bg-gray-800 p-3 rounded">
                <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">
                    {conteudoParaVisualizar || "Conteúdo não disponível."}
                </pre>
            </div>
            <div className="mt-4 text-right">
                <Button variant="secondary" onClick={() => {setModalVerConteudoBaseAberto(false); setConteudoParaVisualizar(null); setNomeDocumentoBaseVisualizar('');}}>
                    Fechar
                </Button>
            </div>
          </Modal>
      )}
      <style>{`.text-xxs { font-size: 0.65rem; line-height: 0.9rem; }`}</style>
    </div>
  );
};

export default AssinaturaEletronicaPage;
