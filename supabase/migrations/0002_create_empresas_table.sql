-- supabase/migrations/0002_create_empresas_table.sql
-- Cria a tabela para armazenar as empresas (clientes dos escritórios de contabilidade).
-- Esta tabela é central para gerenciar os dados de cada cliente atendido por um tenant.

-- Tabela para armazenar as empresas (clientes dos escritórios)
CREATE TABLE empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Identificador único universal para a empresa.
    tenant_id UUID NOT NULL, -- Chave estrangeira referenciando tenants.id, indica a qual escritório esta empresa pertence.
    nome TEXT NOT NULL, -- Razão Social ou Nome Fantasia da empresa.
    cnpj TEXT NOT NULL UNIQUE, -- CNPJ da empresa. A constraint UNIQUE é global. Pode ser revisada para UNIQUE(cnpj, tenant_id) se necessário.
    email TEXT, -- Email principal da empresa.
    telefone TEXT, -- Telefone principal da empresa.
    contato_principal TEXT, -- Nome da pessoa de contato principal na empresa.
    status TEXT, -- Status da empresa (ex: 'ATIVA', 'INATIVA', 'EM PROSPECÇÃO', 'SUSPENSA').
    regime_tributario TEXT, -- Regime tributário da empresa (ex: 'Simples Nacional', 'Lucro Presumido', 'Lucro Real').
    honorarios NUMERIC(10, 2), -- Valor dos honorários cobrados desta empresa.
    dia_vencimento_honorarios INTEGER, -- Dia do mês para o vencimento dos honorários (1-31).
    data_inicio_contrato DATE, -- Data de início do contrato de prestação de serviços.
    data_fim_contrato DATE, -- Data de término do contrato de prestação de serviços (se houver).
    endereco JSONB, -- Objeto JSON contendo o endereço da empresa (rua, número, bairro, cidade, estado, CEP).
    cpf_responsavel_legal TEXT, -- CPF do responsável legal pela empresa.
    tipo_empresa_simulacao TEXT, -- Campo para alguma categorização ou simulação específica, se necessário.
    configuracoes_emissor JSONB, -- Configurações específicas do emissor de NF-e para esta empresa.
    configuracoes_efd JSONB, -- Configurações específicas para EFD (Escrituração Fiscal Digital) desta empresa.
    created_at TIMESTAMPTZ DEFAULT now(), -- Timestamp de quando a empresa foi cadastrada (anteriormente dataCadastro).
    updated_at TIMESTAMPTZ DEFAULT now(), -- Timestamp da última atualização da empresa (anteriormente dataAtualizacao).

    CONSTRAINT fk_empresas_tenant
        FOREIGN KEY(tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE -- Se o tenant (escritório) for excluído, todas as suas empresas clientes também serão.
);

COMMENT ON TABLE empresas IS 'Armazena informações sobre as empresas clientes dos escritórios de contabilidade (tenants).';
COMMENT ON COLUMN empresas.id IS 'Chave primária, UUID gerado automaticamente.';
COMMENT ON COLUMN empresas.tenant_id IS 'Chave estrangeira para tenants.id. Indica o escritório ao qual a empresa pertence. ON DELETE CASCADE.';
COMMENT ON COLUMN empresas.nome IS 'Nome da empresa/cliente, obrigatório.';
COMMENT ON COLUMN empresas.cnpj IS 'CNPJ da empresa, obrigatório e globalmente único (inicialmente).';
COMMENT ON COLUMN empresas.email IS 'Email de contato da empresa.';
COMMENT ON COLUMN empresas.telefone IS 'Telefone de contato da empresa.';
COMMENT ON COLUMN empresas.contato_principal IS 'Nome do contato principal na empresa.';
COMMENT ON COLUMN empresas.status IS 'Status atual da empresa (ex: ATIVA, INATIVA). Futuramente um CHECK constraint.';
COMMENT ON COLUMN empresas.regime_tributario IS 'Regime tributário da empresa. Futuramente um CHECK constraint.';
COMMENT ON COLUMN empresas.honorarios IS 'Valor mensal dos honorários.';
COMMENT ON COLUMN empresas.dia_vencimento_honorarios IS 'Dia do vencimento dos honorários (1 a 31).';
COMMENT ON COLUMN empresas.data_inicio_contrato IS 'Data de início do contrato com o cliente.';
COMMENT ON COLUMN empresas.data_fim_contrato IS 'Data de término do contrato com o cliente.';
COMMENT ON COLUMN empresas.endereco IS 'Objeto JSON para armazenar o endereço completo da empresa.';
COMMENT ON COLUMN empresas.cpf_responsavel_legal IS 'CPF do responsável legal pela empresa.';
COMMENT ON COLUMN empresas.tipo_empresa_simulacao IS 'Tipo de empresa para simulação (uso interno).';
COMMENT ON COLUMN empresas.configuracoes_emissor IS 'JSONB para armazenar configurações do emissor de NF-e específicas da empresa.';
COMMENT ON COLUMN empresas.configuracoes_efd IS 'JSONB para armazenar configurações de EFD (Sped) específicas da empresa.';
COMMENT ON COLUMN empresas.created_at IS 'Data e hora do cadastro da empresa.';
COMMENT ON COLUMN empresas.updated_at IS 'Data e hora da última atualização da empresa.';

-- Adicionar índice em tenant_id para otimizar consultas filtradas por tenant
CREATE INDEX idx_empresas_tenant_id ON empresas(tenant_id);
COMMENT ON INDEX idx_empresas_tenant_id IS 'Índice na coluna tenant_id para acelerar buscas de empresas por escritório.';

-- Adicionar índice em cnpj se for frequentemente usado para buscas e para suportar a constraint UNIQUE
CREATE INDEX idx_empresas_cnpj ON empresas(cnpj);
COMMENT ON INDEX idx_empresas_cnpj IS 'Índice na coluna cnpj para acelerar buscas por CNPJ e para a constraint de unicidade.';

-- Trigger para atualizar empresas.updated_at automaticamente
-- Reutiliza a função trigger_set_timestamp() definida na migração 0001.
CREATE TRIGGER set_empresas_updated_at
BEFORE UPDATE ON empresas
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
COMMENT ON TRIGGER set_empresas_updated_at ON empresas IS 'Garante que o campo updated_at seja atualizado sempre que uma empresa for modificada.';

-- TODO: Adicionar CHECK constraints para as colunas status, regime_tributario, e dia_vencimento_honorarios.
-- Exemplo: ALTER TABLE empresas ADD CONSTRAINT check_empresas_status CHECK (status IN ('ATIVA', 'INATIVA', 'SUSPENSA', 'PROSPECCAO'));
-- Exemplo: ALTER TABLE empresas ADD CONSTRAINT check_empresas_regime_tributario CHECK (regime_tributario IN ('Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'MEI'));
-- Exemplo: ALTER TABLE empresas ADD CONSTRAINT check_dia_vencimento CHECK (dia_vencimento_honorarios >= 1 AND dia_vencimento_honorarios <= 31);

-- TODO: Revisar a constraint UNIQUE do CNPJ. Atualmente é global. Se for necessário permitir o mesmo CNPJ
-- para tenants diferentes (improvável, mas possível em cenários de teste ou estruturas complexas),
-- a constraint deveria ser: UNIQUE (tenant_id, cnpj).

-- TODO: Definir políticas de Row Level Security (RLS) para a tabela empresas.
-- Exemplo: Garantir que usuários de um tenant só possam ver/editar empresas do seu próprio tenant.
-- ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Tenant users can manage their own empresas"
--   ON empresas
--   FOR ALL
--   USING (tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'::uuid)
--   WITH CHECK (tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id'::uuid);
-- CREATE POLICY "Superadmins can access all empresas"
--    ON empresas
--    FOR ALL
--    USING (current_setting('request.jwt.claims', true)::jsonb->>'user_role' = 'SuperAdmin'); -- Assumindo que user_role está nos claims do JWT.

-- Fim do script 0002_create_empresas_table.sql
