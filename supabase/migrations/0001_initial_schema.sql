-- supabase/migrations/0001_initial_schema.sql
-- Esquema inicial para as tabelas core: tenants e profiles.
-- Este script configura as tabelas iniciais necessárias para o funcionamento do sistema,
-- incluindo a gestão de múltiplos escritórios (tenants) e perfis de usuários.

-- Habilita a extensão uuid-ossp se ainda não estiver habilitada.
-- Esta extensão é necessária para a função uuid_generate_v4().
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para atualizar o campo updated_at automaticamente em qualquer tabela.
-- Esta função é chamada por triggers BEFORE UPDATE.
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION trigger_set_timestamp() IS 'Atualiza o campo updated_at para o timestamp atual antes de qualquer atualização na linha.';

-- Tabela para armazenar os tenants (escritórios de contabilidade ou empresas clientes)
-- Cada tenant representa uma entidade isolada dentro do sistema.
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Identificador único universal para o tenant.
    nome TEXT NOT NULL, -- Nome do tenant (ex: "Escritório Contábil XYZ").
    configuracoes_emissor JSONB, -- Configurações do emissor de notas fiscais, pode incluir dados como certificado digital, regime tributário, etc. (estrutura de ConfiguracoesEmissor).
    configuracoes_visuais JSONB, -- Configurações visuais personalizadas para o tenant, como logos, cores, etc. (estrutura de ConfiguracoesVisuais).
    configuracoes_modulos JSONB, -- Configurações de quais módulos estão ativos ou configurados para este tenant (estrutura de ModuloConfigs).
    created_at TIMESTAMPTZ DEFAULT now(), -- Timestamp de quando o tenant foi criado.
    updated_at TIMESTAMPTZ DEFAULT now() -- Timestamp da última atualização do tenant.
);
COMMENT ON TABLE tenants IS 'Armazena informações sobre os tenants (escritórios de contabilidade ou empresas clientes).';
COMMENT ON COLUMN tenants.id IS 'Chave primária, UUID gerado automaticamente.';
COMMENT ON COLUMN tenants.nome IS 'Nome do tenant, obrigatório.';
COMMENT ON COLUMN tenants.configuracoes_emissor IS 'JSONB para armazenar configurações do emissor de NF-e (ConfiguracoesEmissor).';
COMMENT ON COLUMN tenants.configuracoes_visuais IS 'JSONB para armazenar personalizações visuais (ConfiguracoesVisuais).';
COMMENT ON COLUMN tenants.configuracoes_modulos IS 'JSONB para armazenar configurações de módulos (ModuloConfigs).';
COMMENT ON COLUMN tenants.created_at IS 'Data e hora da criação do registro.';
COMMENT ON COLUMN tenants.updated_at IS 'Data e hora da última atualização do registro.';

-- Trigger para atualizar tenants.updated_at automaticamente
CREATE TRIGGER set_tenants_updated_at
BEFORE UPDATE ON tenants
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
COMMENT ON TRIGGER set_tenants_updated_at ON tenants IS 'Garante que o campo updated_at seja atualizado sempre que um tenant for modificado.';

-- Tabela para armazenar perfis de usuários (complementar a auth.users do Supabase)
-- Esta tabela estende a tabela auth.users com informações específicas da aplicação.
CREATE TABLE profiles (
    id UUID PRIMARY KEY, -- Chave primária, DEVE ser o mesmo ID do usuário em auth.users.
    nome TEXT, -- Nome completo do usuário.
    email TEXT NOT NULL UNIQUE, -- Email do usuário (para referência e consistência, o principal está em auth.users).
    funcao TEXT, -- Função do usuário no sistema (ex: SuperAdmin, AdminEscritorio, Contador, Cliente). Representa FuncaoUsuario de types.ts.
    tenant_id UUID, -- Chave estrangeira referenciando tenants.id. Define a qual tenant o usuário pertence. Pode ser nulo para SuperAdmin.
    avatar_url TEXT, -- URL para a imagem de avatar do usuário.
    ativo BOOLEAN DEFAULT true, -- Indica se o perfil do usuário está ativo ou não.
    accessible_empresa_ids UUID[], -- Array de IDs de empresas (que também são tenants) que o usuário pode acessar diretamente (útil para certas funções de escritório que gerenciam múltiplas empresas).
    created_at TIMESTAMPTZ DEFAULT now(), -- Timestamp de quando o perfil foi criado.
    updated_at TIMESTAMPTZ DEFAULT now() -- Timestamp da última atualização do perfil.
);
COMMENT ON TABLE profiles IS 'Armazena informações de perfil dos usuários, estendendo auth.users.';
COMMENT ON COLUMN profiles.id IS 'Chave primária, referenciando auth.users.id.';
COMMENT ON COLUMN profiles.nome IS 'Nome completo do usuário.';
COMMENT ON COLUMN profiles.email IS 'Email do usuário, deve ser único e não nulo.';
COMMENT ON COLUMN profiles.funcao IS 'Função do usuário dentro da aplicação (e.g., SuperAdmin, AdminEscritorio).';
COMMENT ON COLUMN profiles.tenant_id IS 'ID do tenant ao qual o usuário está associado. Nulo para SuperAdmin.';
COMMENT ON COLUMN profiles.avatar_url IS 'URL da imagem de perfil do usuário.';
COMMENT ON COLUMN profiles.ativo IS 'Status do usuário (ativo/inativo), default true.';
COMMENT ON COLUMN profiles.accessible_empresa_ids IS 'Array de UUIDs de tenants/empresas que este perfil pode acessar (para funções específicas).';
COMMENT ON COLUMN profiles.created_at IS 'Data e hora da criação do registro.';
COMMENT ON COLUMN profiles.updated_at IS 'Data e hora da última atualização do registro.';

-- Chave estrangeira de profiles.id para auth.users.id
-- Garante que cada perfil corresponda a um usuário autenticado.
-- ON DELETE CASCADE significa que se um usuário for deletado de auth.users, seu perfil correspondente será deletado automaticamente.
ALTER TABLE profiles
ADD CONSTRAINT fk_profiles_auth_users
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
COMMENT ON CONSTRAINT fk_profiles_auth_users ON profiles IS 'Chave estrangeira que liga profiles.id a auth.users.id. A exclusão de um usuário em auth.users resultará na exclusão do perfil correspondente.';

-- Chave estrangeira de profiles.tenant_id para tenants.id
-- Associa um perfil de usuário a um tenant específico.
-- Esta FK é adicionada após a criação de ambas as tabelas para evitar dependências circulares na criação.
ALTER TABLE profiles
ADD CONSTRAINT fk_profiles_tenant
FOREIGN KEY (tenant_id)
REFERENCES tenants(id)
ON DELETE SET NULL; -- Se um tenant for deletado, o tenant_id no perfil do usuário se tornará NULL. Considere ON DELETE RESTRICT dependendo da lógica de negócio.
COMMENT ON CONSTRAINT fk_profiles_tenant ON profiles IS 'Chave estrangeira que liga profiles.tenant_id a tenants.id. Se um tenant for excluído, o campo tenant_id nos perfis associados será definido como NULL.';

-- Trigger para atualizar profiles.updated_at automaticamente
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
COMMENT ON TRIGGER set_profiles_updated_at ON profiles IS 'Garante que o campo updated_at seja atualizado sempre que um perfil for modificado.';

-- TODO: Adicionar CHECK constraints para a coluna 'funcao' na tabela 'profiles' para garantir que apenas valores válidos sejam inseridos.
-- Exemplo: ALTER TABLE profiles ADD CONSTRAINT check_profile_funcao CHECK (funcao IN ('SuperAdmin', 'AdminEscritorio', 'Contador', 'Cliente'));

-- TODO: Considerar políticas de Row Level Security (RLS) para ambas as tabelas,
-- especialmente para garantir que os usuários só possam acessar dados de seus próprios tenants.
-- Exemplo para tenants (permitir que usuários vejam apenas seu próprio tenant):
-- ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "User can see own tenant" ON tenants FOR SELECT USING (id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');

-- Exemplo para profiles (permitir que usuários vejam apenas perfis do seu tenant):
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "User can see profiles from own tenant" ON profiles FOR SELECT USING (tenant_id = current_setting('request.jwt.claims', true)::jsonb->>'tenant_id');
-- CREATE POLICY "User can see own profile" ON profiles FOR SELECT USING (id = auth.uid());

-- Lembre-se que as políticas RLS exatas dependerão dos requisitos específicos da sua aplicação.
-- As chaves JWT customizadas (como tenant_id) precisam ser configuradas corretamente.

-- Fim do script 0001_initial_schema.sql
