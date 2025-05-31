// src/types/dtos/documento.dto.ts

// Interface base para representar metadados de um Documento
export interface DocumentoDto {
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

// DTO para filtros de consulta de Documentos
export interface QueryDocumentoDto {
  tenant_id?: string;
  empresa_id?: string;
  uploader_id?: string;
  categoria?: string;
  tipo_mime?: string;
  nome_arquivo?: string;
  data_upload_min?: string;
  data_upload_max?: string;
  sortBy?: 'nome_arquivo' | 'data_upload' | 'created_at' | 'categoria' | 'tipo_mime';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// DTO para os dados que podem vir no corpo da requisição de upload de um novo Documento.
export interface CreateDocumentoBodyDto {
  nome_arquivo_customizado?: string;
  categoria?: string;
  empresa_id?: string;
  detalhes_geracao?: any;
}

// DTO completo para criar os metadados do Documento no banco de dados.
export interface FinalCreateDocumentoDto {
  tenant_id: string;
  uploader_id: string;
  nome_arquivo: string;
  categoria?: string;
  empresa_id?: string | null;
  tamanho_bytes: number;
  tipo_mime: string;
  storage_path: string;
  detalhes_geracao?: any | null;
  data_upload?: string;
}


// DTO para atualizar metadados de um Documento
export interface UpdateDocumentoDto {
  nome_arquivo?: string;
  categoria?: string;
  empresa_id?: string | null; // Permite associar a uma nova empresa ou desassociar (null)
  detalhes_geracao?: any; // Permitir atualização de detalhes de geração
  // Campos como storage_path, tenant_id, uploader_id, tamanho_bytes, tipo_mime, data_upload
  // geralmente não são atualizáveis diretamente por este DTO.
}
