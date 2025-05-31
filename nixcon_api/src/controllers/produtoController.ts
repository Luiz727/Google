import { Response } from 'express';
import produtoService, { Produto } from '../services/produtoService';
import empresaService from '../services/empresaService';
import { AuthenticatedRequest, UserProfile } from '../middlewares/authMiddleware';
import { FuncaoUsuario } from '../types/enums';
import { QueryProdutoDto, CreateProdutoDto, UpdateProdutoDto } from '../types/dtos/produto.dto';

interface CreateProdutoRequestBody {
  descricao: string;
  tipo_produto: 'PRODUTO' | 'SERVICO' | 'KIT';
  unidade: string;
  cliente_empresa_id?: string | null;
  escritorio_tenant_id?: string;
  codigo_barras?: string;
  codigo_interno?: string;
  preco_custo?: number;
  preco_venda_varejo?: number;
  preco_venda_atacado?: number;
  quantidade_minima_atacado?: number;
  ativo?: boolean;
  categoria?: string;
  sub_categoria?: string;
  movimenta_estoque?: boolean;
  estoque_minimo?: number;
  quantidade_em_estoque?: number;
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
  componentes_kit?: any;
  permite_rateio_desconto?: boolean;
  universal_produto_id_original?: string | null;
}


class ProdutoController {
  async getAllProdutos(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const user = req.user as UserProfile;
    const queryParams = req.query as QueryProdutoDto;
    if (!user || !user.id || !user.funcao) { return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' }); }
    let escritorioTenantIdParaConsulta: string | null = null;
    try {
      if (user.funcao === FuncaoUsuario.SUPERADMIN) {
        if (queryParams.escritorio_tenant_id) { escritorioTenantIdParaConsulta = queryParams.escritorio_tenant_id; }
        else if (user.tenant_id) { console.warn(`SuperAdmin ${user.id} listando produtos do seu próprio tenant de perfil ${user.tenant_id} pois nenhum escritorio_tenant_id foi especificado na query.`); escritorioTenantIdParaConsulta = user.tenant_id; }
        else { return res.status(400).json({ message: 'SuperAdmin deve especificar "escritorio_tenant_id" como query parameter ou estar associado a um tenant para listar produtos.' }); }
      } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
        if (!user.tenant_id) { return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant específico. Não é possível listar produtos.' }); }
        if (queryParams.escritorio_tenant_id && queryParams.escritorio_tenant_id !== user.tenant_id) { console.warn(`Usuário ${user.id} tentou listar produtos de escritorio_tenant_id ${queryParams.escritorio_tenant_id} diferente do seu (${user.tenant_id}). A tentativa foi ignorada.`); }
        escritorioTenantIdParaConsulta = user.tenant_id;
      } else { return res.status(403).json({ message: 'Acesso proibido: Sua função não permite listar produtos.' }); }
      if (!escritorioTenantIdParaConsulta) { return res.status(400).json({ message: 'Não foi possível determinar o tenant do escritório para a consulta de produtos.' }); }
      const { escritorio_tenant_id, ...filters } = queryParams;
      const produtos = await produtoService.findAllProdutos(escritorioTenantIdParaConsulta, filters as QueryProdutoDto);
      return res.status(200).json(produtos);
    } catch (error: any) {
      console.error('Erro no ProdutoController.getAllProdutos:', error.message);
      if (error.message.startsWith('ID do tenant do escritório inválido')) { return res.status(400).json({ message: error.message }); }
      return res.status(500).json({ message: 'Erro ao buscar produtos.', details: error.message });
    }
  }

  async getProdutoById(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const produtoId = req.params.id;
    const user = req.user as UserProfile;
    if (!user || !user.id || !user.funcao) { return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' }); }
    try {
      const produto = await produtoService.findProdutoById(produtoId);
      if (!produto) { return res.status(404).json({ message: `Produto com ID ${produtoId} não encontrado.` }); }
      if (user.funcao === FuncaoUsuario.SUPERADMIN) { return res.status(200).json(produto); }
      else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
        if (!user.tenant_id) { return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant (escritório). Acesso negado.' }); }
        if (produto.escritorio_tenant_id === user.tenant_id) { return res.status(200).json(produto); }
        else { return res.status(403).json({ message: 'Acesso proibido: Você não tem permissão para visualizar este produto.' }); }
      } else { return res.status(403).json({ message: 'Acesso proibido: Sua função não permite esta ação.' }); }
    } catch (error: any) {
      console.error(`Erro no ProdutoController.getProdutoById para ID ${produtoId}:`, error.message);
      if (error.message === 'ID do produto inválido.') { return res.status(400).json({ message: 'ID do produto fornecido é inválido.' }); }
      return res.status(500).json({ message: 'Erro ao buscar o produto.', details: error.message });
    }
  }

  async createProduto(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const user = req.user as UserProfile;
    const body = req.body as CreateProdutoRequestBody;
    if (!user || !user.id || !user.funcao) { return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' }); }
    if (!body.descricao || typeof body.descricao !== 'string' || body.descricao.trim() === '') { return res.status(400).json({ message: 'O campo "descricao" é obrigatório.' }); }
    if (!body.tipo_produto || !['PRODUTO', 'SERVICO', 'KIT'].includes(body.tipo_produto)) { return res.status(400).json({ message: 'O campo "tipo_produto" é obrigatório e deve ser PRODUTO, SERVICO ou KIT.' }); }
    if (!body.unidade || typeof body.unidade !== 'string' || body.unidade.trim() === '') { return res.status(400).json({ message: 'O campo "unidade" é obrigatório.' }); }
    let escritorioTenantId: string;
    let origemTenant: 'UNIVERSAL_ESCRITORIO' | 'ESPECIFICO_CLIENTE';
    let clienteEmpresaIdFinal: string | null = body.cliente_empresa_id || null;
    if (user.funcao === FuncaoUsuario.SUPERADMIN) {
      if (body.escritorio_tenant_id) { escritorioTenantId = body.escritorio_tenant_id; }
      else if (user.tenant_id) { escritorioTenantId = user.tenant_id; }
      else { return res.status(400).json({ message: 'SuperAdmin deve especificar "escritorio_tenant_id" no corpo da requisição ou estar associado a um tenant de perfil.' }); }
    } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
      if (!user.tenant_id) { return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant. Não é possível criar produto.' }); }
      escritorioTenantId = user.tenant_id;
      if (body.escritorio_tenant_id && body.escritorio_tenant_id !== escritorioTenantId) { return res.status(403).json({ message: 'Você não pode criar produtos para um escritório diferente do seu.'}); }
    } else { return res.status(403).json({ message: 'Acesso proibido: Sua função não permite criar produtos.' }); }
    if (clienteEmpresaIdFinal) {
      try { const empresa = await empresaService.findEmpresaById(clienteEmpresaIdFinal); if (!empresa || empresa.tenant_id !== escritorioTenantId) { return res.status(400).json({ message: `Empresa cliente com ID ${clienteEmpresaIdFinal} não encontrada ou não pertence ao escritório ${escritorioTenantId}.` }); } origemTenant = 'ESPECIFICO_CLIENTE'; }
      catch (e: any) { return res.status(500).json({ message: "Erro ao validar empresa cliente.", details: e.message }); }
    } else { origemTenant = 'UNIVERSAL_ESCRITORIO'; clienteEmpresaIdFinal = null; }
    const produtoDataParaServico: CreateProdutoDto = { ...body, escritorio_tenant_id: escritorioTenantId, origem_tenant: origemTenant, cliente_empresa_id: clienteEmpresaIdFinal, };
    try {
      const novoProduto = await produtoService.createProduto(produtoDataParaServico);
      if (novoProduto) { return res.status(201).json(novoProduto); }
      else { return res.status(500).json({ message: 'Falha ao criar o produto, o serviço não retornou dados.' }); }
    } catch (error: any) {
      console.error('Erro no ProdutoController.createProduto:', error.message, error.details);
      if (error.code === '23505') { let friendlyMessage = 'Conflito: Violação de constraint de unicidade.'; if (error.message.includes('codigo_interno')) { friendlyMessage = 'Conflito: Código Interno já existe para este escopo (escritório ou cliente).'; } return res.status(409).json({ message: friendlyMessage, details: error.detail || error.message }); }
      if (error.code === '23503' && error.message.includes('produtos_cliente_empresa_id_fkey')) { return res.status(400).json({ message: `Empresa cliente com ID "${clienteEmpresaIdFinal}" não encontrada.`, details: error.detail }); }
      if (error.message.startsWith('Campos obrigatórios') || error.message.startsWith('cliente_empresa_id é obrigatório')) { return res.status(400).json({ message: error.message }); }
      return res.status(500).json({ message: 'Erro ao criar o produto.', details: error.message });
    }
  }

  async updateProduto(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const produtoId = req.params.id;
    const user = req.user as UserProfile;
    const updateData = req.body as UpdateProdutoDto;
    if (!user || !user.id || !user.funcao) { return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' }); }
    if (Object.keys(updateData).length === 0) { return res.status(400).json({ message: 'Nenhum dado fornecido para atualização.' }); }
    if (updateData.descricao !== undefined && (typeof updateData.descricao !== 'string' || updateData.descricao.trim() === '')) { return res.status(400).json({ message: 'Se fornecido, o campo "descricao" não pode ser uma string vazia.' }); }
    if (updateData.tipo_produto !== undefined && !['PRODUTO', 'SERVICO', 'KIT'].includes(updateData.tipo_produto)) { return res.status(400).json({ message: 'Se fornecido, o campo "tipo_produto" deve ser PRODUTO, SERVICO ou KIT.' }); }
    if (updateData.unidade !== undefined && (typeof updateData.unidade !== 'string' || updateData.unidade.trim() === '')) { return res.status(400).json({ message: 'Se fornecido, o campo "unidade" não pode ser uma string vazia.' }); }
    try {
      const produtoAtual = await produtoService.findProdutoById(produtoId);
      if (!produtoAtual) { return res.status(404).json({ message: `Produto com ID ${produtoId} não encontrado.` }); }
      let canUpdate = false;
      if (user.funcao === FuncaoUsuario.SUPERADMIN) { canUpdate = true; }
      else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
        if (!user.tenant_id) { return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant. Acesso negado.' }); }
        if (produtoAtual.escritorio_tenant_id === user.tenant_id) { canUpdate = true; }
        else { return res.status(403).json({ message: 'Acesso proibido: Você só pode atualizar produtos do seu próprio escritório.' }); }
      } else { return res.status(403).json({ message: 'Acesso proibido: Sua função não permite esta ação.' }); }
      if (!canUpdate) { return res.status(403).json({ message: 'Acesso negado para atualizar este produto.' }); }
      const produtoAtualizado = await produtoService.updateProduto(produtoId, updateData);
      if (produtoAtualizado) { return res.status(200).json(produtoAtualizado); }
      else { return res.status(404).json({ message: `Produto com ID ${produtoId} não encontrado durante a tentativa de atualização.` }); }
    } catch (error: any) {
      console.error(`Erro no ProdutoController.updateProduto para ID ${produtoId}:`, error.message, error.details);
      if (error.message === 'ID do produto inválido.') { return res.status(400).json({ message: 'ID do produto fornecido é inválido.' }); }
      if (error.code === '23505') { let friendlyMessage = 'Conflito: Violação de constraint de unicidade ao atualizar produto.'; if (error.message.includes('codigo_interno')) { friendlyMessage = 'Conflito: Código Interno já existe para este escopo (escritório ou cliente).'; } return res.status(409).json({ message: friendlyMessage, details: error.detail || error.message }); }
      return res.status(500).json({ message: 'Erro ao atualizar o produto.', details: error.message });
    }
  }

  async deleteProduto(req: AuthenticatedRequest, res: Response) {
    const produtoId = req.params.id;
    const user = req.user as UserProfile;

    if (!user || !user.id || !user.funcao) {
      return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' });
    }

    try {
      const produtoParaDeletar = await produtoService.findProdutoById(produtoId);
      if (!produtoParaDeletar) {
        return res.status(404).json({ message: `Produto com ID ${produtoId} não encontrado.` });
      }

      // Lógica de Autorização
      let canDelete = false;
      if (user.funcao === FuncaoUsuario.SUPERADMIN) {
        canDelete = true;
      } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
        if (!user.tenant_id) {
            return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant. Acesso negado.' });
        }
        if (produtoParaDeletar.escritorio_tenant_id === user.tenant_id) {
          canDelete = true;
        } else {
          return res.status(403).json({ message: 'Acesso proibido: Você só pode deletar produtos do seu próprio escritório.' });
        }
      } else {
        return res.status(403).json({ message: 'Acesso proibido: Sua função não permite esta ação.' });
      }

      if (canDelete) {
        const success = await produtoService.deleteProduto(produtoId);
        if (success) {
          return res.status(204).send();
        } else {
          // Se o serviço retornou false, significa que o produto não foi encontrado (apesar da checagem anterior)
          return res.status(404).json({ message: `Produto com ID ${produtoId} não encontrado para deleção (verificação do serviço).` });
        }
      }
      // O else para canDelete já foi tratado com retornos de status 403.
    } catch (error: any) {
      console.error(`Erro no ProdutoController.deleteProduto para ID ${produtoId}:`, error.message);
      if (error.message === 'ID do produto inválido.') {
        return res.status(400).json({ message: 'ID do produto fornecido é inválido.' });
      }
      // Tratar outros erros, como violações de FK se ON DELETE não estiver configurado para CASCADE onde necessário.
      res.status(500).json({ message: 'Erro ao deletar o produto.', details: error.message });
    }
  }
}

export default new ProdutoController();
