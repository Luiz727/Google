import { supabase } from '../config/supabaseClient';
import { QueryProdutoDto, CreateProdutoDto, UpdateProdutoDto } from '../types/dtos/produto.dto';

export interface Produto {
  // ... (interface completa como definida anteriormente)
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
  componentes_kit?: any | null;
  permite_rateio_desconto?: boolean;
  created_at: string;
  updated_at: string;
}

class ProdutoService {
  async findAllProdutos(escritorioTenantId: string, queryParams: QueryProdutoDto): Promise<Produto[]> {
    // ... (código existente omitido para brevidade)
    if (!escritorioTenantId || typeof escritorioTenantId !== 'string') { throw new Error('ID do tenant do escritório inválido para buscar produtos.'); }
    try {
      let query = supabase.from('produtos').select('*').eq('escritorio_tenant_id', escritorioTenantId);
      if (queryParams.cliente_empresa_id) { query = query.eq('cliente_empresa_id', queryParams.cliente_empresa_id); }
      if (queryParams.origem_tenant) { query = query.eq('origem_tenant', queryParams.origem_tenant); if (queryParams.origem_tenant === 'UNIVERSAL_ESCRITORIO') { query = query.is('cliente_empresa_id', null); } }
      if (queryParams.tipo_produto) { query = query.eq('tipo_produto', queryParams.tipo_produto); }
      if (queryParams.categoria) { query = query.ilike('categoria', `%${queryParams.categoria}%`); }
      if (queryParams.marca) { query = query.ilike('marca', `%${queryParams.marca}%`); }
      if (queryParams.ncm) { query = query.eq('ncm', queryParams.ncm); }
      if (queryParams.descricao) { query = query.ilike('descricao', `%${queryParams.descricao}%`); }
      if (queryParams.codigo_interno) { query = query.eq('codigo_interno', queryParams.codigo_interno); }
      if (queryParams.ativo !== undefined) { query = query.eq('ativo', queryParams.ativo === 'true' || queryParams.ativo === true); }
      if (queryParams.movimenta_estoque !== undefined) { query = query.eq('movimenta_estoque', queryParams.movimenta_estoque === 'true' || queryParams.movimenta_estoque === true); }
      const sortBy = queryParams.sortBy || 'descricao';
      const sortOrder = queryParams.sortOrder || 'asc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      const page = queryParams.page || 1;
      const pageSize = queryParams.pageSize || 25;
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);
      const { data, error } = await query;
      if (error) { throw error; }
      return data as Produto[] || [];
    } catch (error) { console.error('Exceção em ProdutoService.findAllProdutos:', error); throw error; }
  }

  async findProdutoById(produtoId: string): Promise<Produto | null> {
    // ... (código existente omitido para brevidade)
    if (!produtoId || typeof produtoId !== 'string') { throw new Error('ID do produto inválido.'); }
    try {
      const { data, error } = await supabase.from('produtos').select('*').eq('id', produtoId).single();
      if (error) { if (error.code === 'PGRST116') { return null; } throw error; }
      return data as Produto | null;
    } catch (error) { console.error('Exceção em ProdutoService.findProdutoById:', error); throw error; }
  }

  async createProduto(produtoData: CreateProdutoDto): Promise<Produto | null> {
    // ... (código existente omitido para brevidade)
    if (!produtoData.escritorio_tenant_id || !produtoData.descricao || !produtoData.tipo_produto || !produtoData.unidade || !produtoData.origem_tenant) { throw new Error('Campos obrigatórios (escritorio_tenant_id, descricao, tipo_produto, unidade, origem_tenant) não fornecidos para criar produto.'); }
    if (produtoData.origem_tenant === 'ESPECIFICO_CLIENTE' && !produtoData.cliente_empresa_id) { throw new Error('cliente_empresa_id é obrigatório quando origem_tenant é ESPECIFICO_CLIENTE.'); }
    if (produtoData.origem_tenant === 'UNIVERSAL_ESCRITORIO' && produtoData.cliente_empresa_id) { produtoData.cliente_empresa_id = null; }
    const dataToInsert = { ...produtoData, ativo: produtoData.ativo !== undefined ? produtoData.ativo : true, movimenta_estoque: produtoData.movimenta_estoque !== undefined ? produtoData.movimenta_estoque : false, quantidade_em_estoque: produtoData.quantidade_em_estoque !== undefined ? produtoData.quantidade_em_estoque : 0, permite_rateio_desconto: produtoData.permite_rateio_desconto !== undefined ? produtoData.permite_rateio_desconto : true, preco_custo: produtoData.preco_custo !== undefined ? produtoData.preco_custo : 0.00, preco_venda_varejo: produtoData.preco_venda_varejo !== undefined ? produtoData.preco_venda_varejo : 0.00, };
    try {
      const { data, error } = await supabase.from('produtos').insert(dataToInsert).select().single();
      if (error) { throw error; }
      return data as Produto | null;
    } catch (error) { console.error('Exceção em ProdutoService.createProduto:', error); throw error; }
  }

  async updateProduto(produtoId: string, produtoData: UpdateProdutoDto): Promise<Produto | null> {
    // ... (código existente omitido para brevidade)
    if (!produtoId || typeof produtoId !== 'string') { throw new Error('ID do produto inválido.'); }
    const { escritorio_tenant_id, origem_tenant, cliente_empresa_id, universal_produto_id_original, ...dataToUpdate } = produtoData as any;
    if (Object.keys(dataToUpdate).length === 0) { return this.findProdutoById(produtoId); }
    try {
      const { data, error } = await supabase.from('produtos').update(dataToUpdate).eq('id', produtoId).select().single();
      if (error) { throw error; }
      return data as Produto | null;
    } catch (error: any) { if (error.code === 'PGRST116') { return null; } console.error(`Exceção em ProdutoService.updateProduto para ID ${produtoId}:`, error); throw error; }
  }

  /**
   * Deleta um produto existente pelo ID.
   * @param produtoId - O UUID do produto a ser deletado.
   * @returns Promise<boolean> - True se a deleção foi bem-sucedida (produto existia e foi deletado), false se o produto não foi encontrado. Lança erro em caso de falha na deleção.
   */
  async deleteProduto(produtoId: string): Promise<boolean> {
    if (!produtoId || typeof produtoId !== 'string') {
      console.error('ID do produto inválido fornecido para deleteProduto:', produtoId);
      throw new Error('ID do produto inválido.');
    }
    try {
      const produtoExistente = await this.findProdutoById(produtoId);
      if (!produtoExistente) {
        return false; // Produto não encontrado.
      }

      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', produtoId);

      if (error) {
        console.error(`Erro ao deletar produto com ID ${produtoId}:`, error.message);
        // FKs: Se este produto for referenciado (ex: universal_produto_id_original em outro produto),
        // a constraint ON DELETE SET NULL deve tratar isso no DB.
        // Se for referenciado em uma tabela de junção (ex: itens_pedido) sem ON DELETE CASCADE, pode dar erro.
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Exceção em ProdutoService.deleteProduto:', error);
      throw error;
    }
  }
}

export default new ProdutoService();
