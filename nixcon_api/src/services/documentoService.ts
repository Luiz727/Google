import { supabase } from '../config/supabaseClient';
import { QueryDocumentoDto, FinalCreateDocumentoDto, UpdateDocumentoDto } from '../types/dtos/documento.dto';

export interface Documento {
  id: string;
  tenant_id: string;
  empresa_id?: string | null;
  uploader_id?: string | null;
  nome_arquivo: string;
  categoria?: string | null;
  tamanho_bytes?: number | null;
  tipo_mime?: string | null;
  storage_path: string;
  detalhes_geracao?: any | null;
  data_upload: string;
  created_at: string;
  updated_at: string;
}

const DOCUMENTOS_BUCKET = 'documentos-bucket';

class DocumentoService {
  async findAllDocumentos(tenantId: string, queryParams: QueryDocumentoDto): Promise<Documento[]> {
    // ... (código existente omitido para brevidade)
    if (!tenantId || typeof tenantId !== 'string') { throw new Error('ID do tenant inválido para buscar documentos.'); }
    try {
      let query = supabase.from('documentos').select(`id, tenant_id, empresa_id, uploader_id, nome_arquivo, categoria, tamanho_bytes, tipo_mime, storage_path, detalhes_geracao, data_upload, created_at, updated_at`).eq('tenant_id', tenantId);
      if (queryParams.empresa_id) { query = query.eq('empresa_id', queryParams.empresa_id); }
      if (queryParams.uploader_id) { query = query.eq('uploader_id', queryParams.uploader_id); }
      if (queryParams.categoria) { query = query.ilike('categoria', `%${queryParams.categoria}%`); }
      if (queryParams.tipo_mime) { query = query.eq('tipo_mime', queryParams.tipo_mime); }
      if (queryParams.nome_arquivo) { query = query.ilike('nome_arquivo', `%${queryParams.nome_arquivo}%`); }
      if (queryParams.data_upload_min) { query = query.gte('data_upload', queryParams.data_upload_min); }
      if (queryParams.data_upload_max) { query = query.lte('data_upload', queryParams.data_upload_max); }
      const sortBy = queryParams.sortBy || 'created_at';
      const sortOrder = queryParams.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      const page = queryParams.page || 1;
      const pageSize = queryParams.pageSize || 25;
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);
      const { data, error } = await query;
      if (error) { throw error; }
      return data || [];
    } catch (error) { console.error('Exceção em DocumentoService.findAllDocumentos:', error); throw error; }
  }

  async uploadFileToSupabaseStorage( file: Express.Multer.File, tenantId: string, uploaderId: string, nomeArquivoCustomizado?: string ): Promise<{ storagePath: string }> {
    // ... (código existente omitido para brevidade)
    if (!file) throw new Error('Arquivo não fornecido para upload.');
    if (!tenantId) throw new Error('Tenant ID não fornecido para upload.');
    if (!uploaderId) throw new Error('Uploader ID não fornecido para upload.');
    const fileName = nomeArquivoCustomizado || file.originalname;
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `tenant_${tenantId}/${uploaderId}/${Date.now()}_${sanitizedFileName}`;
    try {
      const { data, error } = await supabase.storage.from(DOCUMENTOS_BUCKET).upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false, });
      if (error) { throw error; }
      if (!data || !data.path) { throw new Error('Upload para Supabase Storage não retornou um caminho válido.'); }
      return { storagePath: data.path };
    } catch (error) { console.error('Exceção em DocumentoService.uploadFileToSupabaseStorage:', error); throw error; }
  }

  async saveDocumentoMetadata(metadata: FinalCreateDocumentoDto): Promise<Documento | null> {
    // ... (código existente omitido para brevidade)
    try {
      const { data, error } = await supabase.from('documentos').insert(metadata).select().single();
      if (error) {
        if (error.code === '23503') {
            if (error.message.includes('documentos_empresa_id_fkey')) { throw new Error(`Empresa com ID ${metadata.empresa_id} não encontrada no tenant especificado.`); }
            if (error.message.includes('documentos_uploader_id_fkey')) { throw new Error(`Usuário uploader com ID ${metadata.uploader_id} não encontrado.`); }
            if (error.message.includes('documentos_tenant_id_fkey')) {  throw new Error(`Tenant com ID ${metadata.tenant_id} não encontrado.`); }
        }
        throw error;
      }
      return data as Documento | null;
    } catch (error) { console.error('Exceção em DocumentoService.saveDocumentoMetadata:', error); throw error; }
  }

  async findDocumentoById(documentoId: string): Promise<Documento | null> {
    // ... (código existente omitido para brevidade)
    if (!documentoId || typeof documentoId !== 'string') { throw new Error('ID do documento inválido.'); }
    try {
      const { data, error } = await supabase.from('documentos').select('*').eq('id', documentoId).single();
      if (error) { if (error.code === 'PGRST116') { return null; } throw error; }
      return data as Documento | null;
    } catch (error) { console.error('Exceção em DocumentoService.findDocumentoById:', error); throw error; }
  }

  async downloadFileFromSupabaseStorage(storagePath: string): Promise<{ fileBody: ArrayBuffer; contentType?: string; error: null } | { fileBody: null; contentType?: undefined; error: any }> {
    // ... (código existente omitido para brevidade)
    if (!storagePath) { return { fileBody: null, error: new Error('storagePath não fornecido.') }; }
    try {
      const { data, error } = await supabase.storage.from(DOCUMENTOS_BUCKET).download(storagePath);
      if (error) { return { fileBody: null, error }; }
      if (!data) { return { fileBody: null, error: new Error('Arquivo não encontrado ou vazio no armazenamento.') }; }
      const arrayBuffer = await data.arrayBuffer();
      return { fileBody: arrayBuffer, contentType: data.type || undefined, error: null };
    } catch (error) { console.error('Exceção em DocumentoService.downloadFileFromSupabaseStorage:', error); return { fileBody: null, error }; }
  }

  async deleteFileFromSupabaseStorage(storagePath: string): Promise<{ success: boolean; error?: any }> {
    // ... (código existente omitido para brevidade)
    if (!storagePath) { return { success: false, error: new Error('storagePath não fornecido.') }; }
    try {
      const { data, error } = await supabase.storage.from(DOCUMENTOS_BUCKET).remove([storagePath]);
      if (error) { return { success: false, error }; }
      return { success: true };
    } catch (error) { console.error('Exceção em DocumentoService.deleteFileFromSupabaseStorage:', error); return { success: false, error }; }
  }

  async deleteDocumentoMetadata(documentoId: string): Promise<boolean> {
    // ... (código existente omitido para brevidade)
    if (!documentoId || typeof documentoId !== 'string') { throw new Error('ID do documento inválido.'); }
    try {
      const existingDoc = await this.findDocumentoById(documentoId);
      if (!existingDoc) { return false; }
      const { error } = await supabase.from('documentos').delete().eq('id', documentoId);
      if (error) { throw error; }
      return true;
    } catch (error) { console.error('Exceção em DocumentoService.deleteDocumentoMetadata:', error); throw error; }
  }

  /**
   * Atualiza os metadados de um documento existente.
   * @param documentoId O UUID do documento a ser atualizado.
   * @param updateData DTO com os campos a serem atualizados.
   * @returns Promise<Documento | null> Metadados do documento atualizado ou null se não encontrado. Lança erro em caso de falha.
   */
  async updateDocumentoMetadata(documentoId: string, updateData: UpdateDocumentoDto): Promise<Documento | null> {
    if (!documentoId || typeof documentoId !== 'string') {
      throw new Error('ID do documento inválido.');
    }

    // Garantir que campos protegidos não sejam passados para o update.
    const {
      tenant_id, uploader_id, storage_path, tamanho_bytes, tipo_mime, data_upload,
      ...dataToUpdate
    } = updateData as any;

    if (Object.keys(dataToUpdate).length === 0) {
      // Nenhum campo válido para atualizar foi fornecido.
      // Retornar o documento existente para indicar que nada mudou.
      console.info(`Nenhum dado válido para atualizar nos metadados do documento ${documentoId}.`);
      return this.findDocumentoById(documentoId);
    }

    try {
      const { data, error } = await supabase
        .from('documentos')
        .update(dataToUpdate)
        .eq('id', documentoId)
        .select()
        .single();

      if (error) {
        console.error(`Erro ao atualizar metadados do documento com ID ${documentoId}:`, error.message);
        // Tratar erros de FK constraint (ex: empresa_id não existe)
        if (error.code === '23503' && dataToUpdate.empresa_id) {
            throw new Error(`Empresa com ID ${dataToUpdate.empresa_id} não encontrada.`);
        }
        throw error;
      }
      return data as Documento | null;
    } catch (error: any) {
      if (error.code === 'PGRST116') { // "Query returned no rows" - ID não encontrado para atualizar
        return null;
      }
      console.error('Exceção em DocumentoService.updateDocumentoMetadata:', error);
      throw error;
    }
  }
}

export default new DocumentoService();
