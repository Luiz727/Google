-- supabase/migrations/0004_create_documentos_table.sql
-- Cria a tabela para armazenar metadados de documentos.
-- Os arquivos físicos serão armazenados no Supabase Storage.

-- Tabela para metadados de documentos
CREATE TABLE documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Identificador único universal para o metadado do documento.
    tenant_id UUID NOT NULL, -- Chave estrangeira referenciando tenants.id. O documento deve pertencer a um escritório.
    empresa_id UUID, -- Chave estrangeira referenciando empresas.id. Opcional, se o documento for específico de uma empresa cliente.
    uploader_id UUID, -- Chave estrangeira referenciando profiles.id. Usuário que realizou o upload.
    nome_arquivo TEXT NOT NULL, -- Nome original ou fornecido pelo usuário para o arquivo.
    categoria TEXT, -- Categoria do documento (ex: 'Contrato', 'Relatório Fiscal', 'Comprovante').
    tamanho_bytes BIGINT, -- Tamanho do arquivo em bytes.
    tipo_mime TEXT, -- MIME type do arquivo (ex: 'application/pdf', 'image/jpeg', 'text/csv').
    storage_path TEXT NOT NULL UNIQUE, -- Caminho único para o arquivo no Supabase Storage (ex: 'tenant_uuid/documentos/arquivo_uuid.pdf').
    detalhes_geracao JSONB, -- JSONB para armazenar detalhes se o documento foi gerado pelo sistema (ex: parâmetros, template usado).
    data_upload TIMESTAMPTZ DEFAULT now(), -- Data e hora do upload do arquivo, mantido para compatibilidade com types.ts.
    created_at TIMESTAMPTZ DEFAULT now(), -- Timestamp de quando o metadado do documento foi criado.
    updated_at TIMESTAMPTZ DEFAULT now(), -- Timestamp da última atualização do metadado.

    CONSTRAINT fk_documentos_tenant
        FOREIGN KEY(tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE, -- Se o tenant (escritório) for excluído, todos os seus metadados de documentos também serão.
    CONSTRAINT fk_documentos_empresa
        FOREIGN KEY(empresa_id)
        REFERENCES empresas(id)
        ON DELETE SET NULL, -- Se a empresa vinculada for excluída, o metadado do documento permanece, mas empresa_id fica NULL.
    CONSTRAINT fk_documentos_uploader
        FOREIGN KEY(uploader_id)
        REFERENCES profiles(id)
        ON DELETE SET NULL -- Se o perfil do uploader for excluído, uploader_id fica NULL.
);

COMMENT ON TABLE documentos IS 'Armazena metadados dos arquivos. Os arquivos em si são guardados no Supabase Storage.';
COMMENT ON COLUMN documentos.id IS 'Chave primária, UUID gerado automaticamente.';
COMMENT ON COLUMN documentos.tenant_id IS 'FK para tenants.id. Indica o escritório ao qual o documento pertence. ON DELETE CASCADE.';
COMMENT ON COLUMN documentos.empresa_id IS 'FK para empresas.id. Empresa cliente à qual o documento pode ser associado. ON DELETE SET NULL.';
COMMENT ON COLUMN documentos.uploader_id IS 'FK para profiles.id. Usuário que fez o upload do documento. ON DELETE SET NULL.';
COMMENT ON COLUMN documentos.nome_arquivo IS 'Nome do arquivo, como exibido ao usuário.';
COMMENT ON COLUMN documentos.categoria IS 'Categoria para organização dos documentos.';
COMMENT ON COLUMN documentos.tamanho_bytes IS 'Tamanho do arquivo em bytes.';
COMMENT ON COLUMN documentos.tipo_mime IS 'MIME type do arquivo, para identificar o tipo de conteúdo.';
COMMENT ON COLUMN documentos.storage_path IS 'Caminho único do arquivo no Supabase Storage. Usado para construir a URL de acesso.';
COMMENT ON COLUMN documentos.detalhes_geracao IS 'JSONB para detalhes de documentos gerados pelo sistema.';
COMMENT ON COLUMN documentos.data_upload IS 'Data e hora em que o arquivo foi carregado.';
COMMENT ON COLUMN documentos.created_at IS 'Data e hora de criação do registro do metadado.';
COMMENT ON COLUMN documentos.updated_at IS 'Data e hora da última atualização do registro do metadado.';

-- Índices para otimização de consultas
CREATE INDEX idx_documentos_tenant_id ON documentos(tenant_id);
COMMENT ON INDEX idx_documentos_tenant_id IS 'Índice na coluna tenant_id.';
CREATE INDEX idx_documentos_empresa_id ON documentos(empresa_id);
COMMENT ON INDEX idx_documentos_empresa_id IS 'Índice na coluna empresa_id.';
CREATE INDEX idx_documentos_uploader_id ON documentos(uploader_id);
COMMENT ON INDEX idx_documentos_uploader_id IS 'Índice na coluna uploader_id.';
CREATE INDEX idx_documentos_categoria ON documentos(categoria);
COMMENT ON INDEX idx_documentos_categoria IS 'Índice na coluna categoria.';
CREATE INDEX idx_documentos_tipo_mime ON documentos(tipo_mime);
COMMENT ON INDEX idx_documentos_tipo_mime IS 'Índice na coluna tipo_mime.';
CREATE INDEX idx_documentos_storage_path ON documentos(storage_path); -- Para garantir a unicidade e buscas rápidas pelo path
COMMENT ON INDEX idx_documentos_storage_path IS 'Índice na coluna storage_path para garantir unicidade e buscas.';


-- Trigger para atualizar documentos.updated_at automaticamente
-- Reutiliza a função trigger_set_timestamp() definida na migração 0001.
CREATE TRIGGER set_documentos_updated_at
BEFORE UPDATE ON documentos
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
COMMENT ON TRIGGER set_documentos_updated_at ON documentos IS 'Garante que o campo updated_at seja atualizado sempre que um metadado de documento for modificado.';

-- TODO: Adicionar CHECK constraints para colunas como 'categoria' ou 'tipo_mime' se houver um conjunto finito de valores válidos.
-- Exemplo: ALTER TABLE documentos ADD CONSTRAINT check_documentos_categoria CHECK (categoria IN ('CONTRATO', 'NOTA_FISCAL', 'RELATORIO', 'OUTROS'));

-- TODO: Definir políticas de Row Level Security (RLS) para a tabela documentos.
-- Estas políticas devem estar alinhadas com as permissões de acesso aos buckets do Supabase Storage.
-- Exemplo: Usuários podem ver/gerenciar documentos do seu tenant.
-- ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Tenant users can access documents within their tenant"
--   ON documentos FOR ALL
--   USING (tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'::uuid);

-- TODO: Considerar como lidar com versionamento de documentos, se necessário no futuro.
-- Isso poderia envolver uma tabela separada para versões ou uma lógica na aplicação.

-- TODO: Considerar a criação de uma tabela de junção `tarefas_documentos` se a coluna `documentos_vinculados_cache`
-- na tabela `tarefas` se mostrar insuficiente, para permitir referências diretas e integridade.

-- Fim do script 0004_create_documentos_table.sql
