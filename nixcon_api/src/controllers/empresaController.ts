import { Response } from 'express';
import empresaService, { Empresa } from '../services/empresaService'; // Importar Empresa
import { AuthenticatedRequest, UserProfile } from '../middlewares/authMiddleware';
import { FuncaoUsuario } from '../types/enums';
import { CreateEmpresaRequestBodyDto, ProcessedCreateEmpresaDto, UpdateEmpresaDto } from '../types/dtos/empresa.dto';

class EmpresaController {
  async getAllEmpresas(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const user = req.user as UserProfile;
    if (!user || !user.id || !user.funcao) { return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' }); }
    let tenantIdParaConsulta: string | null = null;
    try {
      if (user.funcao === FuncaoUsuario.SUPERADMIN) {
        const queryTenantId = req.query.tenantId as string;
        if (!queryTenantId) { return res.status(400).json({ message: 'SuperAdmin deve especificar um "tenantId" como query parameter para listar empresas.' }); }
        tenantIdParaConsulta = queryTenantId;
      } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
        if (!user.tenant_id) { return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant específico.' }); }
        tenantIdParaConsulta = user.tenant_id;
      } else { return res.status(403).json({ message: 'Acesso proibido: Sua função não permite listar empresas desta forma.' }); }
      if (!tenantIdParaConsulta) { return res.status(400).json({ message: 'Não foi possível determinar o tenant para a consulta.' }); }
      const empresas = await empresaService.findAllEmpresasByTenant(tenantIdParaConsulta);
      return res.status(200).json(empresas);
    } catch (error: any) {
      console.error('Erro no EmpresaController.getAllEmpresas:', error.message);
      if (error.message === 'ID do tenant inválido.') { return res.status(400).json({ message: 'O ID do tenant fornecido é inválido.' }); }
      return res.status(500).json({ message: 'Erro ao buscar empresas.', details: error.message });
    }
  }

  async getEmpresaById(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const empresaId = req.params.id;
    const user = req.user as UserProfile;
    if (!user || !user.id || !user.funcao) { return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' }); }
    try {
      const empresa = await empresaService.findEmpresaById(empresaId);
      if (!empresa) { return res.status(404).json({ message: `Empresa com ID ${empresaId} não encontrada.` }); }
      if (user.funcao === FuncaoUsuario.SUPERADMIN) {
        return res.status(200).json(empresa);
      } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
        if (empresa.tenant_id === user.tenant_id) { return res.status(200).json(empresa); }
        else { return res.status(403).json({ message: 'Acesso proibido: Você não tem permissão para visualizar esta empresa.' }); }
      } else { return res.status(403).json({ message: 'Acesso proibido: Sua função não permite esta ação.' }); }
    } catch (error: any) {
      console.error(`Erro no EmpresaController.getEmpresaById para ID ${empresaId}:`, error.message);
      if (error.message === 'ID da empresa inválido.') { return res.status(400).json({ message: 'ID da empresa fornecido é inválido.' }); }
      return res.status(500).json({ message: 'Erro ao buscar a empresa.', details: error.message });
    }
  }

  async createEmpresa(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const user = req.user as UserProfile;
    const requestBody = req.body as CreateEmpresaRequestBodyDto;
    if (!requestBody.nome || typeof requestBody.nome !== 'string' || requestBody.nome.trim() === '') { return res.status(400).json({ message: 'O campo "nome" é obrigatório.' }); }
    if (!requestBody.cnpj || typeof requestBody.cnpj !== 'string' || requestBody.cnpj.trim() === '') { return res.status(400).json({ message: 'O campo "cnpj" é obrigatório.' }); }
    let tenantIdParaCriacao: string;
    if (user.funcao === FuncaoUsuario.SUPERADMIN) {
      if (!requestBody.tenant_id) { return res.status(400).json({ message: 'SuperAdmin deve especificar o "tenant_id" no corpo da requisição para criar uma empresa.' }); }
      tenantIdParaCriacao = requestBody.tenant_id;
    } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO) {
      if (!user.tenant_id) { return res.status(403).json({ message: 'Admin de escritório não associado a um tenant. Não é possível criar empresa.' }); }
      if (requestBody.tenant_id && requestBody.tenant_id !== user.tenant_id) { return res.status(403).json({ message: 'Admin de escritório não pode criar empresa para um tenant diferente do seu.' }); }
      tenantIdParaCriacao = user.tenant_id;
    } else { return res.status(403).json({ message: 'Acesso proibido: Sua função não permite criar empresas.' }); }
    const processedEmpresaData: ProcessedCreateEmpresaDto = { ...requestBody, tenant_id: tenantIdParaCriacao, };
    try {
      const novaEmpresa = await empresaService.createEmpresa(processedEmpresaData);
      if (novaEmpresa) { return res.status(201).json(novaEmpresa); }
      else { return res.status(500).json({ message: 'Falha ao criar a empresa, o serviço não retornou dados.' }); }
    } catch (error: any) {
      console.error('Erro no EmpresaController.createEmpresa:', error.message);
      if (error.code === '23505') {
        if (error.message.includes('empresas_cnpj_key')) { return res.status(409).json({ message: 'Conflito: Já existe uma empresa com este CNPJ.', details: error.detail }); }
        return res.status(409).json({ message: 'Conflito: Violação de constraint de unicidade.', details: error.detail || error.message });
      }
      if (error.code === '23503') {
         if (error.message.includes('empresas_tenant_id_fkey')) { return res.status(400).json({ message: `Tenant com ID "${tenantIdParaCriacao}" não encontrado. Impossível criar empresa.`, details: error.detail }); }
        return res.status(400).json({ message: 'Erro de referência a outra tabela (ex: tenant não existe).', details: error.detail || error.message });
      }
      return res.status(500).json({ message: 'Erro ao criar a empresa.', details: error.message });
    }
  }

  async updateEmpresa(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const empresaId = req.params.id;
    const user = req.user as UserProfile;
    const updateData = req.body as UpdateEmpresaDto;
    if (!user || !user.id || !user.funcao) { return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' }); }
    if (Object.keys(updateData).length === 0) { return res.status(400).json({ message: 'Nenhum dado fornecido para atualização.' }); }
    if (updateData.nome !== undefined && (typeof updateData.nome !== 'string' || updateData.nome.trim() === '')) { return res.status(400).json({ message: 'Se fornecido, o campo "nome" não pode ser uma string vazia.' }); }
    if (updateData.cnpj !== undefined && (typeof updateData.cnpj !== 'string' || updateData.cnpj.trim() === '')) { return res.status(400).json({ message: 'Se fornecido, o campo "cnpj" não pode ser uma string vazia.' }); }
    try {
      const empresaAtual = await empresaService.findEmpresaById(empresaId);
      if (!empresaAtual) { return res.status(404).json({ message: `Empresa com ID ${empresaId} não encontrada.` }); }
      let canProcess = false;
      if (user.funcao === FuncaoUsuario.SUPERADMIN) {
        canProcess = true;
      } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO) {
        if (empresaAtual.tenant_id === user.tenant_id) { canProcess = true; }
        else { return res.status(403).json({ message: 'Acesso proibido: Você só pode atualizar empresas do seu próprio escritório.' }); }
      } else { return res.status(403).json({ message: 'Acesso proibido: Sua função não permite esta ação.' }); }
      if (canProcess) {
        const empresaAtualizada = await empresaService.updateEmpresa(empresaId, updateData);
        if (empresaAtualizada) { return res.status(200).json(empresaAtualizada); }
        else { return res.status(404).json({ message: `Empresa com ID ${empresaId} não encontrada durante a tentativa de atualização.` }); }
      }
    } catch (error: any) {
      console.error(`Erro no EmpresaController.updateEmpresa para ID ${empresaId}:`, error.message);
      if (error.message === 'ID da empresa inválido.') { return res.status(400).json({ message: 'ID da empresa fornecido é inválido.' }); }
      if (error.code === '23505') {
        if (error.message.includes('empresas_cnpj_key')) { return res.status(409).json({ message: 'Conflito: Já existe uma empresa com este CNPJ.', details: error.detail }); }
        return res.status(409).json({ message: 'Conflito: Violação de constraint de unicidade.', details: error.detail || error.message });
      }
      return res.status(500).json({ message: 'Erro ao atualizar a empresa.', details: error.message });
    }
  }

  async deleteEmpresa(req: AuthenticatedRequest, res: Response) {
    const empresaId = req.params.id;
    const user = req.user as UserProfile;

    if (!user || !user.id || !user.funcao) {
      return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' });
    }

    try {
      // Primeiro, buscar a empresa para verificar a propriedade do tenant (para AdminEscritorio)
      const empresaParaDeletar = await empresaService.findEmpresaById(empresaId);
      if (!empresaParaDeletar) {
        return res.status(404).json({ message: `Empresa com ID ${empresaId} não encontrada.` });
      }

      // Lógica de Autorização
      let canDelete = false;
      if (user.funcao === FuncaoUsuario.SUPERADMIN) {
        canDelete = true;
      } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO) {
        if (empresaParaDeletar.tenant_id === user.tenant_id) {
          canDelete = true;
        } else {
          return res.status(403).json({ message: 'Acesso proibido: Você só pode deletar empresas do seu próprio escritório.' });
        }
      } else {
        return res.status(403).json({ message: 'Acesso proibido: Sua função não permite esta ação.' });
      }

      if (canDelete) {
        const success = await empresaService.deleteEmpresa(empresaId); // O serviço já verifica a existência, mas a checagem aqui é para autorização.
        if (success) {
          return res.status(204).send(); // 204 No Content para deleção bem-sucedida
        } else {
          // Este caso (success === false) indica que a empresa não foi encontrada pelo serviço,
          // o que é redundante se findEmpresaById já foi chamado, mas é uma segurança.
          return res.status(404).json({ message: `Empresa com ID ${empresaId} não foi encontrada para deleção (verificação do serviço).` });
        }
      }
    } catch (error: any) {
      console.error(`Erro no EmpresaController.deleteEmpresa para ID ${empresaId}:`, error.message);
      if (error.message === 'ID da empresa inválido.') {
        return res.status(400).json({ message: 'ID da empresa fornecido é inválido.' });
      }
      // Tratar outros erros, como violações de FK se ON DELETE não estiver configurado para CASCADE onde necessário.
      res.status(500).json({ message: 'Erro ao deletar a empresa.', details: error.message });
    }
  }
}

export default new EmpresaController();
