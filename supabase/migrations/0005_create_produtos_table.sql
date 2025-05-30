-- supabase/migrations/0005_create_produtos_table.sql
-- Cria a tabela para gerenciamento de produtos e serviços, incluindo dados fiscais e de estoque.

CREATE TABLE produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escritorio_tenant_id UUID NOT NULL, -- FK para tenants.id. Escritório que "possui" este produto (se universal) ou do qual o produto específico do cliente se origina.
    cliente_empresa_id UUID, -- FK para empresas.id. Usado se origem_tenant for ESPECIFICO_CLIENTE.
    origem_tenant TEXT NOT NULL, -- Indica se é um produto universal do escritório ou específico de um cliente.
    universal_produto_id_original UUID, -- FK para produtos.id (self-reference). Se este é um produto específico de cliente que foi copiado de um universal.

    codigo_barras TEXT,
    codigo_interno TEXT, -- Código interno/SKU.
    tipo_produto TEXT NOT NULL, -- Tipo de item (PRODUTO, SERVICO, KIT).
    descricao TEXT NOT NULL, -- Descrição principal do produto/serviço.
    unidade TEXT NOT NULL, -- Unidade de medida (UN, KG, CX, PC, HR, etc.).

    preco_custo NUMERIC(12, 2) DEFAULT 0.00,
    preco_venda_varejo NUMERIC(12, 2) DEFAULT 0.00,
    preco_venda_atacado NUMERIC(12, 2),
    quantidade_minima_atacado INTEGER,

    ativo BOOLEAN DEFAULT true, -- Se o produto está ativo para venda/uso.
    categoria TEXT,
    sub_categoria TEXT,

    movimenta_estoque BOOLEAN DEFAULT false,
    estoque_minimo NUMERIC(10, 3),
    quantidade_em_estoque NUMERIC(10, 3) DEFAULT 0.000,

    marca TEXT,
    modelo TEXT,

    -- Dados Fiscais
    ncm TEXT, -- Nomenclatura Comum do Mercosul.
    cfop TEXT, -- Código Fiscal de Operações e Prestações.
    origem_fiscal TEXT, -- Origem da mercadoria (0 Nacional, 1 Estrangeira Importação Direta, etc.).
    cest TEXT, -- Código Especificador da Substituição Tributária.
    icms_cst TEXT, -- CST do ICMS.
    icms_aliquota NUMERIC(5, 2), -- Alíquota do ICMS (%).
    pis_cst TEXT, -- CST do PIS.
    pis_aliquota NUMERIC(5, 2), -- Alíquota do PIS (%).
    cofins_cst TEXT, -- CST da COFINS.
    cofins_aliquota NUMERIC(5, 2), -- Alíquota da COFINS (%).

    -- Campos EFD Adicionais
    cst_pis_entrada TEXT,
    cst_pis_saida TEXT,
    cst_cofins_entrada TEXT,
    cst_cofins_saida TEXT,
    natureza_receita_pis_cofins TEXT, -- Código da Natureza da Receita para PIS/COFINS (usado no SPED).
    aliquota_pis_especifica NUMERIC(10, 4), -- Alíquota específica de PIS (valor, não percentual).
    aliquota_cofins_especifica NUMERIC(10, 4), -- Alíquota específica de COFINS (valor, não percentual).

    -- Dimensões e Peso (para logística)
    altura_cm NUMERIC(8, 2),
    largura_cm NUMERIC(8, 2),
    profundidade_cm NUMERIC(8, 2),
    peso_kg NUMERIC(8, 3),

    tags TEXT[], -- Array de tags para busca e categorização.

    -- Informações para Loja Virtual/Outros Usos
    descricao_loja_virtual TEXT,
    garantia TEXT, -- Termos de garantia (ex: "90 dias").
    itens_inclusos TEXT, -- Descrição dos itens inclusos na embalagem.
    especificacoes_tecnicas TEXT, -- Especificações técnicas detalhadas.

    componentes_kit JSONB, -- Para produtos do tipo KIT, armazena os componentes e suas quantidades. Formato: [{"produto_id": "uuid", "quantidade": 2}, ...].
    permite_rateio_desconto BOOLEAN DEFAULT true, -- Se o produto permite rateio de desconto em vendas.

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT fk_produtos_escritorio_tenant
        FOREIGN KEY(escritorio_tenant_id)
        REFERENCES tenants(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_produtos_cliente_empresa
        FOREIGN KEY(cliente_empresa_id)
        REFERENCES empresas(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_produtos_universal_original
        FOREIGN KEY(universal_produto_id_original)
        REFERENCES produtos(id)
        ON DELETE SET NULL,

    CONSTRAINT check_origem_tenant CHECK (origem_tenant IN ('UNIVERSAL_ESCRITORIO', 'ESPECIFICO_CLIENTE')),
    CONSTRAINT check_tipo_produto CHECK (tipo_produto IN ('PRODUTO', 'SERVICO', 'KIT')),

    -- Garante que cliente_empresa_id seja preenchido se origem_tenant for ESPECIFICO_CLIENTE
    CONSTRAINT chk_cliente_empresa_id_if_especifico CHECK (
        (origem_tenant = 'ESPECIFICO_CLIENTE' AND cliente_empresa_id IS NOT NULL) OR
        (origem_tenant = 'UNIVERSAL_ESCRITORIO' AND cliente_empresa_id IS NULL) -- Adicionado para garantir que cliente_empresa_id seja NULL se universal
    ),
    -- Garante que universal_produto_id_original só seja preenchido (ou não) de acordo com origem_tenant
    CONSTRAINT chk_universal_produto_id_logic CHECK (
        (origem_tenant = 'ESPECIFICO_CLIENTE') OR -- Se ESPECIFICO_CLIENTE, universal_produto_id_original PODE ou NÃO ser preenchido
        (origem_tenant = 'UNIVERSAL_ESCRITORIO' AND universal_produto_id_original IS NULL) -- Se UNIVERSAL_ESCRITORIO, universal_produto_id_original DEVE ser NULL
    ),
    -- Unicidade do código interno:
    -- 1. Para produtos universais do escritório: codigo_interno deve ser único por escritorio_tenant_id onde cliente_empresa_id é NULL.
    -- 2. Para produtos específicos do cliente: codigo_interno deve ser único por cliente_empresa_id.
    CONSTRAINT unique_codigo_interno_escritorio_universal UNIQUE (escritorio_tenant_id, codigo_interno, origem_tenant) WHERE (origem_tenant = 'UNIVERSAL_ESCRITORIO' AND cliente_empresa_id IS NULL),
    CONSTRAINT unique_codigo_interno_cliente_especifico UNIQUE (cliente_empresa_id, codigo_interno, origem_tenant) WHERE (origem_tenant = 'ESPECIFICO_CLIENTE')
);

COMMENT ON TABLE produtos IS 'Armazena informações sobre produtos e serviços, incluindo dados de estoque, fiscais e de venda.';
COMMENT ON COLUMN produtos.escritorio_tenant_id IS 'Tenant do escritório que gerencia o produto (se universal) ou ao qual o cliente do produto específico pertence.';
COMMENT ON COLUMN produtos.cliente_empresa_id IS 'Empresa cliente específica para a qual este produto é definido (se origem_tenant = ESPECIFICO_CLIENTE).';
COMMENT ON COLUMN produtos.origem_tenant IS 'Define a origem e o escopo do produto: UNIVERSAL_ESCRITORIO ou ESPECIFICO_CLIENTE.';
COMMENT ON COLUMN produtos.universal_produto_id_original IS 'Se ESPECIFICO_CLIENTE e baseado em um produto UNIVERSAL, este campo armazena o ID do produto original.';
COMMENT ON COLUMN produtos.codigo_interno IS 'Código interno (SKU) do produto. Unicidade gerenciada por constraints específicas.';
COMMENT ON COLUMN produtos.tipo_produto IS 'Indica se é um PRODUTO físico, um SERVICO ou um KIT de produtos/serviços.';
COMMENT ON COLUMN produtos.componentes_kit IS 'JSONB para descrever os componentes de um produto tipo KIT. Ex: [{"produto_id": "uuid", "quantidade": 2}]';
COMMENT ON COLUMN produtos.aliquota_pis_especifica IS 'Alíquota específica de PIS em valor (R$) por unidade, para regimes monofásicos ou ST.';
COMMENT ON COLUMN produtos.aliquota_cofins_especifica IS 'Alíquota específica de COFINS em valor (R$) por unidade, para regimes monofásicos ou ST.';

-- Índices
CREATE INDEX idx_produtos_escritorio_tenant_id ON produtos(escritorio_tenant_id);
CREATE INDEX idx_produtos_cliente_empresa_id ON produtos(cliente_empresa_id);
CREATE INDEX idx_produtos_tipo_produto ON produtos(tipo_produto);
CREATE INDEX idx_produtos_ncm ON produtos(ncm);
CREATE INDEX idx_produtos_origem_tenant ON produtos(origem_tenant);
CREATE INDEX idx_produtos_universal_produto_id_original ON produtos(universal_produto_id_original);
-- Índices para suportar as constraints de unicidade do codigo_interno (já criados implicitamente pelas constraints UNIQUE)
-- CREATE INDEX idx_produtos_codigo_interno_escritorio_universal ON produtos(escritorio_tenant_id, codigo_interno) WHERE (origem_tenant = 'UNIVERSAL_ESCRITORIO' AND cliente_empresa_id IS NULL);
-- CREATE INDEX idx_produtos_codigo_interno_cliente_especifico ON produtos(cliente_empresa_id, codigo_interno) WHERE (origem_tenant = 'ESPECIFICO_CLIENTE' AND cliente_empresa_id IS NOT NULL);


-- Trigger para updated_at
CREATE TRIGGER set_produtos_updated_at
BEFORE UPDATE ON produtos
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); -- Reutiliza a função

-- TODO: Row Level Security (RLS) - Escritórios veem seus produtos universais e os de seus clientes. Clientes (empresas) veem seus produtos específicos e os universais do escritório associado.
-- TODO: `tenantsComAcesso` - Se produtos UNIVERSAL_ESCRITORIO precisam ser explicitamente habilitados para clientes específicos, uma tabela de junção `produtos_clientes_habilitados (produto_id, cliente_empresa_id)` seria necessária.
-- TODO: Mais CHECK constraints para campos como unidade, origem_fiscal, CSTs, etc., se houver conjuntos de valores fixos.
-- TODO: Avaliar a necessidade de histórico de preços ou de alterações de estoque em tabelas separadas se for preciso auditoria detalhada.
-- TODO: Normalização de campos como categoria, marca, sub_categoria para tabelas separadas se houver muita repetição e necessidade de gerenciá-los independentemente.

-- Fim do script 0005_create_produtos_table.sql
