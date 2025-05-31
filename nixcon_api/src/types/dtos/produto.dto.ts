// src/types/dtos/produto.dto.ts

// Interface base para representar um Produto (refletindo a tabela 'produtos')
export interface ProdutoDto {
  id: string;
  escritorio_tenant_id: string;
  cliente_empresa_id?: string | null;
  origem_tenant: 'UNIVERSAL_ESCRITORIO' | 'ESPECIFICO_CLIENTE';
  universal_produto_id_original?: string | null;
  codigo_barras?: string | null;
  codigo_interno?: string | null;
  tipo_produto: 'PRODUTO' | 'SERVICO' | 'KIT';
  descricao: string;
  unidade: string;
  preco_custo?: number | null;
  preco_venda_varejo?: number | null;
  preco_venda_atacado?: number | null;
  quantidade_minima_atacado?: number | null;
  ativo?: boolean;
  categoria?: string | null;
  sub_categoria?: string | null;
  movimenta_estoque?: boolean;
  estoque_minimo?: number | null;
  quantidade_em_estoque?: number | null;
  marca?: string | null;
  modelo?: string | null;
  ncm?: string | null;
  cfop?: string | null;
  origem_fiscal?: string | null;
  cest?: string | null;
  icms_cst?: string | null;
  icms_aliquota?: number | null;
  pis_cst?: string | null;
  pis_aliquota?: number | null;
  cofins_cst?: string | null;
  cofins_aliquota?: number | null;
  cst_pis_entrada?: string | null;
  cst_pis_saida?: string | null;
  cst_cofins_entrada?: string | null;
  cst_cofins_saida?: string | null;
  natureza_receita_pis_cofins?: string | null;
  aliquota_pis_especifica?: number | null;
  aliquota_cofins_especifica?: number | null;
  altura_cm?: number | null;
  largura_cm?: number | null;
  profundidade_cm?: number | null;
  peso_kg?: number | null;
  tags?: string[] | null;
  descricao_loja_virtual?: string | null;
  garantia?: string | null;
  itens_inclusos?: string | null;
  especificacoes_tecnicas?: string | null;
  componentes_kit?: any | null; // JSONB
  permite_rateio_desconto?: boolean;
  created_at: string; // ISO Date string
  updated_at: string; // ISO Date string
}

// DTO para filtros de consulta de Produtos
export interface QueryProdutoDto {
  escritorio_tenant_id?: string; // Usado pelo SuperAdmin para especificar o tenant do escritório
  cliente_empresa_id?: string; // Para filtrar produtos de um cliente específico
  origem_tenant?: 'UNIVERSAL_ESCRITORIO' | 'ESPECIFICO_CLIENTE';
  tipo_produto?: 'PRODUTO' | 'SERVICO' | 'KIT';
  categoria?: string; // Busca parcial
  marca?: string;
  ncm?: string;
  descricao?: string; // Busca parcial
  codigo_interno?: string;
  ativo?: 'true' | 'false' | boolean; // Permitir string da query param ou boolean
  movimenta_estoque?: 'true' | 'false' | boolean;

  sortBy?: 'descricao' | 'created_at' | 'preco_venda_varejo' | 'categoria' | 'tipo_produto';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// DTO para criar um novo Produto
export interface CreateProdutoDto {
  escritorio_tenant_id: string; // Definido pelo controller/serviço
  cliente_empresa_id?: string | null;
  origem_tenant: 'UNIVERSAL_ESCRITORIO' | 'ESPECIFICO_CLIENTE';
  universal_produto_id_original?: string | null; // Se for cópia customizada de um universal

  descricao: string;
  tipo_produto: 'PRODUTO' | 'SERVICO' | 'KIT';
  unidade: string;

  codigo_barras?: string;
  codigo_interno?: string;
  preco_custo?: number;
  preco_venda_varejo?: number;
  preco_venda_atacado?: number;
  quantidade_minima_atacado?: number;
  ativo?: boolean; // Default true
  categoria?: string;
  sub_categoria?: string;
  movimenta_estoque?: boolean; // Default false
  estoque_minimo?: number;
  quantidade_em_estoque?: number; // Default 0
  marca?: string;
  modelo?: string;
  ncm?: string;
  cfop?: string;
  origem_fiscal?: string;
  cest?: string;
  icms_cst?: string;
  icms_aliquota?: number;
  pis_cst?: string;
  pis_aliquota?: number;
  cofins_cst?: string;
  cofins_aliquota?: number;
  cst_pis_entrada?: string;
  cst_pis_saida?: string;
  cst_cofins_entrada?: string;
  cst_cofins_saida?: string;
  natureza_receita_pis_cofins?: string;
  aliquota_pis_especifica?: number;
  aliquota_cofins_especifica?: number;
  altura_cm?: number;
  largura_cm?: number;
  profundidade_cm?: number;
  peso_kg?: number;
  tags?: string[];
  descricao_loja_virtual?: string;
  garantia?: string;
  itens_inclusos?: string;
  especificacoes_tecnicas?: string;
  componentes_kit?: any; // JSONB
  permite_rateio_desconto?: boolean; // Default true
}

// DTO para atualizar um Produto (todos os campos relevantes são opcionais)
export interface UpdateProdutoDto extends Partial<Omit<CreateProdutoDto, 'escritorio_tenant_id' | 'origem_tenant' | 'universal_produto_id_original'>> {
  // escritorio_tenant_id, origem_tenant, universal_produto_id_original não devem ser atualizados por aqui.
  // cliente_empresa_id também não deve ser alterado por PATCH (seria uma operação de reatribuição mais complexa).
}
