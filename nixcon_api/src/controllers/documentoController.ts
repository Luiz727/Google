import { Response } from 'express';
import documentoService, { Documento } from '../services/documentoService';
import empresaService from '../services/empresaService';
import { AuthenticatedRequest, UserProfile } from '../middlewares/authMiddleware';
import { FuncaoUsuario } from '../types/enums';
import { QueryDocumentoDto, CreateDocumentoBodyDto, FinalCreateDocumentoDto, UpdateDocumentoDto } from '../types/dtos/documento.dto';

class DocumentoController {
  async getAllDocumentos(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const user = req.user as UserProfile;
    const queryParams = req.query as QueryDocumentoDto;
    if (!user || !user.id || !user.funcao) { return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' }); }
    let tenantIdParaConsulta: string | null = null;
    try {
      if (user.funcao === FuncaoUsuario.SUPERADMIN) {
        if (queryParams.tenant_id) { tenantIdParaConsulta = queryParams.tenant_id; }
        else if (user.tenant_id) { console.warn(`SuperAdmin ${user.id} listando documentos do seu próprio tenant ${user.tenant_id} pois nenhum tenant_id foi especificado na query.`); tenantIdParaConsulta = user.tenant_id; }
        else { return res.status(400).json({ message: 'SuperAdmin deve especificar "tenant_id" como query parameter ou estar associado a um tenant para listar documentos.' }); }
      } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
        if (!user.tenant_id) { return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant específico. Não é possível listar documentos.' }); }
        if (queryParams.tenant_id && queryParams.tenant_id !== user.tenant_id) { console.warn(`Usuário ${user.id} tentou listar documentos de tenant_id ${queryParams.tenant_id} diferente do seu (${user.tenant_id}). A tentativa foi ignorada.`); }
        tenantIdParaConsulta = user.tenant_id;
        delete queryParams.tenant_id;
      } else { return res.status(403).json({ message: 'Acesso proibido: Sua função não permite listar documentos desta forma.' }); }
      if (!tenantIdParaConsulta) { return res.status(400).json({ message: 'Não foi possível determinar o tenant para a consulta de documentos.' }); }
      const documentos = await documentoService.findAllDocumentos(tenantIdParaConsulta, queryParams);
      return res.status(200).json(documentos);
    } catch (error: any) {
      console.error('Erro no DocumentoController.getAllDocumentos:', error.message);
      if (error.message.startsWith('ID do tenant inválido')) { return res.status(400).json({ message: error.message }); }
      return res.status(500).json({ message: 'Erro ao buscar metadados de documentos.', details: error.message });
    }
  }

  async createDocumento(req: AuthenticatedRequest & { file?: Express.Multer.File }, res: Response) {
    // ... (código existente omitido para brevidade)
    const user = req.user as UserProfile;
    const bodyData = req.body as CreateDocumentoBodyDto;
    if (!req.file) { return res.status(400).json({ message: 'Nenhum arquivo enviado.' }); }
    if (!user || !user.id || !user.funcao) { return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' }); }
    let tenantIdParaUpload: string;
    if (user.funcao === FuncaoUsuario.SUPERADMIN) {
      if (!user.tenant_id && !bodyData.empresa_id) { return res.status(400).json({ message: 'SuperAdmin deve estar associado a um tenant ou especificar uma empresa_id para o documento.' }); }
      if (bodyData.empresa_id) {
        try { const empresa = await empresaService.findEmpresaById(bodyData.empresa_id); if (!empresa) return res.status(400).json({ message: `Empresa com ID ${bodyData.empresa_id} não encontrada.`}); tenantIdParaUpload = empresa.tenant_id; }
        catch (e:any) { return res.status(500).json({ message: 'Erro ao validar empresa_id', details: e.message });}
      } else if (user.tenant_id) { tenantIdParaUpload = user.tenant_id; }
      else { return res.status(400).json({ message: 'Contexto de tenant não pôde ser determinado para SuperAdmin.'})}
    } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
      if (!user.tenant_id) { return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant. Upload não permitido.' }); }
      tenantIdParaUpload = user.tenant_id;
      if (bodyData.empresa_id) {
        try { const empresa = await empresaService.findEmpresaById(bodyData.empresa_id); if (!empresa || empresa.tenant_id !== tenantIdParaUpload) { return res.status(400).json({ message: `Empresa com ID ${bodyData.empresa_id} não encontrada ou não pertence ao seu tenant.` }); } }
        catch (e:any) { return res.status(500).json({ message: 'Erro ao validar empresa_id', details: e.message });}
      }
    } else { return res.status(403).json({ message: 'Acesso proibido: Sua função não permite fazer upload de documentos.' }); }
    let storageUploadResult;
    try { storageUploadResult = await documentoService.uploadFileToSupabaseStorage( req.file, tenantIdParaUpload, user.id, bodyData.nome_arquivo_customizado ); }
    catch (uploadError: any) { return res.status(500).json({ message: 'Falha no upload do arquivo para o armazenamento.', details: uploadError.message }); }
    const finalNomeArquivo = bodyData.nome_arquivo_customizado || req.file.originalname;
    const metadataParaSalvar: FinalCreateDocumentoDto = { tenant_id: tenantIdParaUpload, uploader_id: user.id, nome_arquivo: finalNomeArquivo, categoria: bodyData.categoria, empresa_id: bodyData.empresa_id || null, tamanho_bytes: req.file.size, tipo_mime: req.file.mimetype, storage_path: storageUploadResult.storagePath, detalhes_geracao: bodyData.detalhes_geracao, };
    try {
      const novoDocumentoMetadata = await documentoService.saveDocumentoMetadata(metadataParaSalvar);
      if (novoDocumentoMetadata) { return res.status(201).json(novoDocumentoMetadata); }
      else { console.error(`Metadados não salvos para arquivo ${storageUploadResult.storagePath}, mas upload no storage feito.`); return res.status(500).json({ message: 'Arquivo enviado para o armazenamento, mas falha ao salvar metadados.' }); }
    } catch (dbError: any) {
      console.error('Erro ao salvar metadados do documento no banco:', dbError.message);
      if (dbError.message.startsWith('Empresa com ID') || dbError.message.startsWith('Usuário uploader com ID') || dbError.message.startsWith('Tenant com ID')) { return res.status(400).json({ message: dbError.message }); }
      return res.status(500).json({ message: 'Erro ao salvar metadados do documento.', details: dbError.message });
    }
  }

  async getDocumentoById(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const documentoId = req.params.id;
    const user = req.user as UserProfile;
    if (!user || !user.id || !user.funcao) { return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' }); }
    try {
      const documento = await documentoService.findDocumentoById(documentoId);
      if (!documento) { return res.status(404).json({ message: `Metadados do documento com ID ${documentoId} não encontrados.` }); }
      if (user.funcao === FuncaoUsuario.SUPERADMIN) { return res.status(200).json(documento); }
      else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
        if (!user.tenant_id) { return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant. Acesso negado.' }); }
        if (documento.tenant_id === user.tenant_id) { return res.status(200).json(documento); }
        else { return res.status(403).json({ message: 'Acesso proibido: Você não tem permissão para visualizar estes metadados de documento.' }); }
      } else { return res.status(403).json({ message: 'Acesso proibido: Sua função não permite esta ação.' }); }
    } catch (error: any) {
      console.error(`Erro no DocumentoController.getDocumentoById para ID ${documentoId}:`, error.message);
      if (error.message === 'ID do documento inválido.') { return res.status(400).json({ message: 'ID do documento fornecido é inválido.' }); }
      return res.status(500).json({ message: 'Erro ao buscar os metadados do documento.', details: error.message });
    }
  }

  async downloadDocumento(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const documentoId = req.params.id;
    const user = req.user as UserProfile;
    if (!user || !user.id || !user.funcao) { return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' }); }
    try {
      const metadados = await documentoService.findDocumentoById(documentoId);
      if (!metadados) { return res.status(404).json({ message: `Documento com ID ${documentoId} não encontrado.` }); }
      let canDownload = false;
      if (user.funcao === FuncaoUsuario.SUPERADMIN) { canDownload = true; }
      else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
        if (!user.tenant_id) { return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant. Acesso negado.' }); }
        if (metadados.tenant_id === user.tenant_id) { canDownload = true; }
      }
      if (!canDownload) { return res.status(403).json({ message: 'Acesso proibido: Você não tem permissão para baixar este documento.' }); }
      const { fileBody, contentType, error: downloadError } = await documentoService.downloadFileFromSupabaseStorage(metadados.storage_path);
      if (downloadError || !fileBody) { return res.status(500).json({ message: 'Falha ao baixar o arquivo do armazenamento.', details: downloadError?.message }); }
      res.setHeader('Content-Type', contentType || metadados.tipo_mime || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${metadados.nome_arquivo}"`);
      res.send(Buffer.from(fileBody));
    } catch (error: any) {
      console.error(`Erro no DocumentoController.downloadDocumento para ID ${documentoId}:`, error.message);
      if (error.message === 'ID do documento inválido.') { return res.status(400).json({ message: 'ID do documento fornecido é inválido.' }); }
      return res.status(500).json({ message: 'Erro ao processar o download do documento.', details: error.message });
    }
  }

  async deleteDocumento(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const documentoId = req.params.id;
    const user = req.user as UserProfile;
    if (!user || !user.id || !user.funcao) { return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' }); }
    try {
      const metadados = await documentoService.findDocumentoById(documentoId);
      if (!metadados) { return res.status(404).json({ message: `Documento com ID ${documentoId} não encontrado.` }); }
      let canDelete = false;
      if (user.funcao === FuncaoUsuario.SUPERADMIN) { canDelete = true; }
      else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
        if (!user.tenant_id) { return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant. Acesso negado.' }); }
        if (metadados.tenant_id === user.tenant_id) { canDelete = true; }
      }
      if (!canDelete) { return res.status(403).json({ message: 'Acesso proibido: Você não tem permissão para deletar este documento.' }); }
      const { success: storageDeleteSuccess, error: storageError } = await documentoService.deleteFileFromSupabaseStorage(metadados.storage_path);
      if (!storageDeleteSuccess) { console.warn(`Falha ao deletar arquivo ${metadados.storage_path} do storage (ou arquivo não existia):`, storageError?.message); }
      const metadataDeleteSuccess = await documentoService.deleteDocumentoMetadata(documentoId);
      if (metadataDeleteSuccess) { return res.status(204).send(); }
      else { console.error(`Arquivo ${metadados.storage_path} pode ou não ter sido deletado do storage, mas a deleção dos metadados falhou para documento ID ${documentoId}.`); return res.status(500).json({ message: 'Erro ao deletar metadados do documento após possível deleção do arquivo no armazenamento.' }); }
    } catch (error: any) {
      console.error(`Erro no DocumentoController.deleteDocumento para ID ${documentoId}:`, error.message);
      if (error.message === 'ID do documento inválido.') { return res.status(400).json({ message: 'ID do documento fornecido é inválido.' }); }
      return res.status(500).json({ message: 'Erro ao processar a deleção do documento.', details: error.message });
    }
  }

  async updateDocumentoMetadata(req: AuthenticatedRequest, res: Response) {
    const documentoId = req.params.id;
    const user = req.user as UserProfile;
    const updateData = req.body as UpdateDocumentoDto;

    if (!user || !user.id || !user.funcao) {
      return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' });
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Nenhum dado fornecido para atualização.' });
    }
    if (updateData.nome_arquivo !== undefined && (typeof updateData.nome_arquivo !== 'string' || updateData.nome_arquivo.trim() === '')) {
        return res.status(400).json({ message: 'Se fornecido, o campo "nome_arquivo" não pode ser uma string vazia.' });
    }

    try {
      const documentoAtual = await documentoService.findDocumentoById(documentoId);
      if (!documentoAtual) {
        return res.status(404).json({ message: `Metadados do documento com ID ${documentoId} não encontrados.` });
      }

      // Lógica de Autorização
      let canUpdate = false;
      if (user.funcao === FuncaoUsuario.SUPERADMIN) {
        canUpdate = true;
      } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
        if (!user.tenant_id) {
            return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant. Acesso negado.' });
        }
        if (documentoAtual.tenant_id === user.tenant_id) {
          canUpdate = true;
        } else {
          return res.status(403).json({ message: 'Acesso proibido: Você só pode atualizar metadados de documentos do seu próprio escritório.' });
        }
      } else {
        return res.status(403).json({ message: 'Acesso proibido: Sua função não permite esta ação.' });
      }

      if (!canUpdate) {
        // Redundante devido à lógica acima, mas uma salvaguarda.
        return res.status(403).json({ message: 'Acesso negado para atualizar estes metadados.' });
      }

      // Validação de empresa_id se estiver sendo alterado
      if (updateData.empresa_id !== undefined) { // Permite desvincular passando null
        if (updateData.empresa_id) { // Se um novo empresa_id (não nulo) for fornecido
          const empresa = await empresaService.findEmpresaById(updateData.empresa_id);
          if (!empresa || empresa.tenant_id !== documentoAtual.tenant_id) {
            return res.status(400).json({ message: `Empresa com ID ${updateData.empresa_id} não encontrada ou não pertence ao tenant do documento (${documentoAtual.tenant_id}).` });
          }
        }
        // Se updateData.empresa_id for null, ele será atualizado para null (desvinculação)
      }

      const metadadosAtualizados = await documentoService.updateDocumentoMetadata(documentoId, updateData);
      if (metadadosAtualizados) {
        return res.status(200).json(metadadosAtualizados);
      } else {
        // O serviço retorna null se o ID do documento não foi encontrado durante o update.
        return res.status(404).json({ message: `Metadados do documento com ID ${documentoId} não encontrados durante a tentativa de atualização.` });
      }

    } catch (error: any) {
      console.error(`Erro no DocumentoController.updateDocumentoMetadata para ID ${documentoId}:`, error.message);
      if (error.message === 'ID do documento inválido.') {
        return res.status(400).json({ message: 'ID do documento fornecido é inválido.' });
      }
      if (error.message.startsWith('Empresa com ID')) { // Erro de FK vindo do serviço
          return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro ao atualizar os metadados do documento.', details: error.message });
    }
  }
}

export default new DocumentoController();
