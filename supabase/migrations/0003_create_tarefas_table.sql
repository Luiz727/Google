-- supabase/migrations/0003_create_tarefas_table.sql
-- Cria a tabela para gerenciamento de tarefas, incluindo suas configurações, responsáveis e vínculos.

-- Tabela para armazenar as tarefas
CREATE TABLE tarefas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Identificador único universal para a tarefa.
    tenant_id UUID NOT NULL, -- Chave estrangeira referenciando tenants.id. A tarefa deve pertencer a um escritório.
    empresa_id UUID, -- Chave estrangeira referenciando empresas.id. A tarefa pode estar vinculada a uma empresa cliente específica.
    titulo TEXT NOT NULL, -- Título breve da tarefa.
    descricao TEXT, -- Descrição detalhada da tarefa.
    responsavel_id UUID, -- Chave estrangeira referenciando profiles.id. Usuário responsável pela execução da tarefa.
    responsavel_nome_cache TEXT, -- Cache do nome do responsável para otimizar exibições (denormalizado).
    prioridade TEXT, -- Prioridade da tarefa (ex: 'ALTA', 'MEDIA', 'BAIXA').
    prazo TIMESTAMPTZ, -- Data e hora limite para a conclusão da tarefa.
    status TEXT, -- Status atual da tarefa (ex: 'PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA').
    data_conclusao TIMESTAMPTZ, -- Timestamp de quando a tarefa foi efetivamente concluída.
    criador_id UUID, -- Chave estrangeira referenciando profiles.id. Usuário que criou a tarefa.
    criador_nome_cache TEXT, -- Cache do nome do criador (denormalizado).
    recorrencia JSONB, -- Objeto JSON para armazenar configurações de recorrência da tarefa (ex: tipo, intervalo, dias, data_fim).
    documentos_vinculados_cache JSONB, -- Cache de informações sobre documentos vinculados (ex: [{nome: 'doc.pdf', url: '...'}, ...]).
    created_at TIMESTAMPTZ DEFAULT now(), -- Timestamp de quando a tarefa foi criada.
    updated_at TIMESTAMPTZ DEFAULT now(), -- Timestamp da última atualização da tarefa.

    CONSTRAINT fk_tarefas_tenant
        FOREIGN KEY(tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE, -- Se o tenant (escritório) for excluído, todas as suas tarefas também serão.
    CONSTRAINT fk_tarefas_empresa
        FOREIGN KEY(empresa_id)
        REFERENCES empresas(id)
        ON DELETE SET NULL, -- Se a empresa vinculada for excluída, a tarefa permanece, mas empresa_id fica NULL.
    CONSTRAINT fk_tarefas_responsavel
        FOREIGN KEY(responsavel_id)
        REFERENCES profiles(id)
        ON DELETE SET NULL, -- Se o perfil do responsável for excluído, responsavel_id fica NULL.
    CONSTRAINT fk_tarefas_criador
        FOREIGN KEY(criador_id)
        REFERENCES profiles(id)
        ON DELETE SET NULL -- Se o perfil do criador for excluído, criador_id fica NULL.
);

COMMENT ON TABLE tarefas IS 'Armazena informações sobre tarefas, seus responsáveis, prazos, status e vínculos.';
COMMENT ON COLUMN tarefas.id IS 'Chave primária, UUID gerado automaticamente.';
COMMENT ON COLUMN tarefas.tenant_id IS 'FK para tenants.id. Indica o escritório ao qual a tarefa pertence. ON DELETE CASCADE.';
COMMENT ON COLUMN tarefas.empresa_id IS 'FK para empresas.id. Indica a empresa cliente à qual a tarefa pode estar associada. ON DELETE SET NULL.';
COMMENT ON COLUMN tarefas.titulo IS 'Título da tarefa, obrigatório.';
COMMENT ON COLUMN tarefas.descricao IS 'Descrição detalhada da tarefa.';
COMMENT ON COLUMN tarefas.responsavel_id IS 'FK para profiles.id. Usuário responsável pela tarefa. ON DELETE SET NULL.';
COMMENT ON COLUMN tarefas.responsavel_nome_cache IS 'Cache do nome do responsável. Atualizar via aplicação ou trigger se o nome em profiles mudar.';
COMMENT ON COLUMN tarefas.prioridade IS 'Prioridade da tarefa. Futuramente um CHECK constraint (ALTA, MEDIA, BAIXA).';
COMMENT ON COLUMN tarefas.prazo IS 'Data e hora limite para conclusão da tarefa.';
COMMENT ON COLUMN tarefas.status IS 'Status atual da tarefa. Futuramente um CHECK constraint (PENDENTE, EM_ANDAMENTO, CONCLUIDA, etc.).';
COMMENT ON COLUMN tarefas.data_conclusao IS 'Timestamp da conclusão efetiva da tarefa.';
COMMENT ON COLUMN tarefas.criador_id IS 'FK para profiles.id. Usuário que criou a tarefa. ON DELETE SET NULL.';
COMMENT ON COLUMN tarefas.criador_nome_cache IS 'Cache do nome do criador. Atualizar via aplicação ou trigger se o nome em profiles mudar.';
COMMENT ON COLUMN tarefas.recorrencia IS 'JSONB para configurações de recorrência (tipo, intervalo, etc.).';
COMMENT ON COLUMN tarefas.documentos_vinculados_cache IS 'JSONB para lista de documentos vinculados (nome, url). Considerar tabela de junção para maior integridade.';
COMMENT ON COLUMN tarefas.created_at IS 'Data e hora de criação da tarefa.';
COMMENT ON COLUMN tarefas.updated_at IS 'Data e hora da última atualização da tarefa.';

-- Índices para otimização de consultas
CREATE INDEX idx_tarefas_tenant_id ON tarefas(tenant_id);
COMMENT ON INDEX idx_tarefas_tenant_id IS 'Índice na coluna tenant_id.';
CREATE INDEX idx_tarefas_empresa_id ON tarefas(empresa_id);
COMMENT ON INDEX idx_tarefas_empresa_id IS 'Índice na coluna empresa_id.';
CREATE INDEX idx_tarefas_responsavel_id ON tarefas(responsavel_id);
COMMENT ON INDEX idx_tarefas_responsavel_id IS 'Índice na coluna responsavel_id.';
CREATE INDEX idx_tarefas_status ON tarefas(status);
COMMENT ON INDEX idx_tarefas_status IS 'Índice na coluna status para filtrar tarefas por seu estado.';
CREATE INDEX idx_tarefas_prazo ON tarefas(prazo);
COMMENT ON INDEX idx_tarefas_prazo IS 'Índice na coluna prazo para ordenar e filtrar tarefas por sua data de vencimento.';
CREATE INDEX idx_tarefas_criador_id ON tarefas(criador_id);
COMMENT ON INDEX idx_tarefas_criador_id IS 'Índice na coluna criador_id.';


-- Trigger para atualizar tarefas.updated_at automaticamente
-- Reutiliza a função trigger_set_timestamp() definida na migração 0001.
CREATE TRIGGER set_tarefas_updated_at
BEFORE UPDATE ON tarefas
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
COMMENT ON TRIGGER set_tarefas_updated_at ON tarefas IS 'Garante que o campo updated_at seja atualizado sempre que uma tarefa for modificada.';

-- TODO: Adicionar CHECK constraints para as colunas prioridade e status.
-- Exemplo: ALTER TABLE tarefas ADD CONSTRAINT check_tarefas_prioridade CHECK (prioridade IN ('ALTA', 'MEDIA', 'BAIXA'));
-- Exemplo: ALTER TABLE tarefas ADD CONSTRAINT check_tarefas_status CHECK (status IN ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'ATRASADA'));

-- TODO: Implementar lógica de atualização para campos cacheados (responsavel_nome_cache, criador_nome_cache).
-- Isso pode ser feito via triggers na tabela 'profiles' ou pela lógica da aplicação ao atualizar nomes de usuários.

-- TODO: Avaliar a necessidade de uma tabela de junção `tarefas_documentos` para `documentos_vinculados_cache`
-- se houver necessidade de integridade referencial forte ou consultas complexas sobre os documentos.

-- TODO: Definir políticas de Row Level Security (RLS) para a tabela tarefas.
-- Exemplo: Usuários podem ver tarefas do seu tenant; responsáveis podem editar suas tarefas, etc.
-- ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Tenant users can access tasks within their tenant"
--   ON tarefas FOR ALL
--   USING (tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'::uuid);
-- Adicionar políticas mais granulares para responsáveis, criadores, etc.

-- Fim do script 0003_create_tarefas_table.sql
