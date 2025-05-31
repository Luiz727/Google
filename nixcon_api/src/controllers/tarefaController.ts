import { Response } from 'express';
import tarefaService, { Tarefa } from '../services/tarefaService';
import empresaService from '../services/empresaService';
import { AuthenticatedRequest, UserProfile } from '../middlewares/authMiddleware';
import { FuncaoUsuario } from '../types/enums';
import { QueryTarefaDto, CreateTarefaDto, UpdateTarefaDto } from '../types/dtos/tarefa.dto';

class TarefaController {
  async getAllTarefas(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const user = req.user as UserProfile;
    const queryParams = req.query as QueryTarefaDto;
    if (!user || !user.id || !user.funcao) { return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' });}
    let tenantIdParaConsulta: string | null = null;
    try {
      if (user.funcao === FuncaoUsuario.SUPERADMIN) {
        if (queryParams.tenant_id) { tenantIdParaConsulta = queryParams.tenant_id; }
        else if (user.tenant_id) { console.warn(`SuperAdmin ${user.id} listando tarefas do seu próprio tenant ${user.tenant_id} pois nenhum tenant_id foi especificado na query.`); tenantIdParaConsulta = user.tenant_id; }
        else { return res.status(400).json({ message: 'SuperAdmin deve especificar "tenant_id" como query parameter ou estar associado a um tenant para listar tarefas.' });}
      } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
        if (!user.tenant_id) { return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant específico. Não é possível listar tarefas.' }); }
        if (queryParams.tenant_id && queryParams.tenant_id !== user.tenant_id) { console.warn(`Usuário ${user.id} tentou listar tarefas de tenant_id ${queryParams.tenant_id} diferente do seu (${user.tenant_id}). A tentativa foi ignorada.`); }
        tenantIdParaConsulta = user.tenant_id;
        delete queryParams.tenant_id;
      } else { return res.status(403).json({ message: 'Acesso proibido: Sua função não permite listar tarefas desta forma.' }); }
      if (!tenantIdParaConsulta) { return res.status(400).json({ message: 'Não foi possível determinar o tenant para a consulta de tarefas.' });}
      const tarefas = await tarefaService.findAllTarefas(tenantIdParaConsulta, queryParams);
      return res.status(200).json(tarefas);
    } catch (error: any) {
      console.error('Erro no TarefaController.getAllTarefas:', error.message);
      if (error.message.startsWith('ID do tenant inválido')) { return res.status(400).json({ message: error.message }); }
      return res.status(500).json({ message: 'Erro ao buscar tarefas.', details: error.message });
    }
  }

  async getTarefaById(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const tarefaId = req.params.id;
    const user = req.user as UserProfile;
    if (!user || !user.id || !user.funcao) { return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' }); }
    try {
      const tarefa = await tarefaService.findTarefaById(tarefaId);
      if (!tarefa) { return res.status(404).json({ message: `Tarefa com ID ${tarefaId} não encontrada.` }); }
      if (user.funcao === FuncaoUsuario.SUPERADMIN) { return res.status(200).json(tarefa); }
      else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
        if (!user.tenant_id) { return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant. Acesso negado.' }); }
        if (tarefa.tenant_id === user.tenant_id) { return res.status(200).json(tarefa); }
        else { return res.status(403).json({ message: 'Acesso proibido: Você não tem permissão para visualizar esta tarefa.' }); }
      } else { return res.status(403).json({ message: 'Acesso proibido: Sua função não permite esta ação.' }); }
    } catch (error: any) {
      console.error(`Erro no TarefaController.getTarefaById para ID ${tarefaId}:`, error.message);
      if (error.message === 'ID da tarefa inválido.') { return res.status(400).json({ message: 'ID da tarefa fornecido é inválido.' }); }
      return res.status(500).json({ message: 'Erro ao buscar a tarefa.', details: error.message });
    }
  }

  async createTarefa(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const user = req.user as UserProfile;
    const requestBody = req.body as Omit<CreateTarefaDto, 'tenant_id' | 'criador_id'>;
    if (!user || !user.id || !user.funcao) { return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' }); }
    if (!requestBody.titulo || typeof requestBody.titulo !== 'string' || requestBody.titulo.trim() === '') { return res.status(400).json({ message: 'O campo "titulo" é obrigatório.' }); }
    let tenantIdDaTarefa: string;
    if (user.funcao === FuncaoUsuario.SUPERADMIN) {
      if (!user.tenant_id) { return res.status(400).json({ message: 'SuperAdmin não associado a um tenant não pode criar tarefas sem especificar um target_tenant_id (não implementado).' }); }
      tenantIdDaTarefa = user.tenant_id;
    } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
      if (!user.tenant_id) { return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant. Não é possível criar tarefa.' }); }
      tenantIdDaTarefa = user.tenant_id;
    } else { return res.status(403).json({ message: 'Acesso proibido: Sua função não permite criar tarefas.' }); }
    if (requestBody.empresa_id) {
      try {
        const empresa = await empresaService.findEmpresaById(requestBody.empresa_id);
        if (!empresa || empresa.tenant_id !== tenantIdDaTarefa) { return res.status(400).json({ message: `Empresa com ID ${requestBody.empresa_id} não encontrada ou não pertence ao tenant ${tenantIdDaTarefa}.` }); }
      } catch (empresaError: any) { return res.status(400).json({ message: 'Erro ao validar empresa_id.', details: empresaError.message }); }
    }
    const tarefaDataParaServico: CreateTarefaDto = { ...requestBody, tenant_id: tenantIdDaTarefa, };
    try {
      const novaTarefa = await tarefaService.createTarefa(tarefaDataParaServico, user.id);
      if (novaTarefa) { return res.status(201).json(novaTarefa); }
      else { return res.status(500).json({ message: 'Falha ao criar a tarefa, o serviço não retornou dados.' }); }
    } catch (error: any) {
      console.error('Erro no TarefaController.createTarefa:', error.message);
      if (error.message.startsWith('Empresa com ID') || error.message.startsWith('Responsável com ID') || error.message.startsWith('Tenant com ID')) { return res.status(400).json({ message: error.message }); }
      return res.status(500).json({ message: 'Erro ao criar a tarefa.', details: error.message });
    }
  }

  async updateTarefa(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const tarefaId = req.params.id;
    const user = req.user as UserProfile;
    const updateData = req.body as UpdateTarefaDto;
    if (!user || !user.id || !user.funcao) { return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' });}
    if (Object.keys(updateData).length === 0) { return res.status(400).json({ message: 'Nenhum dado fornecido para atualização.' }); }
    if (updateData.titulo !== undefined && (typeof updateData.titulo !== 'string' || updateData.titulo.trim() === '')) { return res.status(400).json({ message: 'Se fornecido, o campo "titulo" não pode ser uma string vazia.' });}
    try {
      const tarefaAtual = await tarefaService.findTarefaById(tarefaId);
      if (!tarefaAtual) { return res.status(404).json({ message: `Tarefa com ID ${tarefaId} não encontrada.` }); }
      let canUpdate = false;
      if (user.funcao === FuncaoUsuario.SUPERADMIN) { canUpdate = true; }
      else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
        if (!user.tenant_id) { return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant. Acesso negado.' }); }
        if (tarefaAtual.tenant_id === user.tenant_id) { canUpdate = true; }
        else { return res.status(403).json({ message: 'Acesso proibido: Você só pode atualizar tarefas do seu próprio escritório.' }); }
      } else { return res.status(403).json({ message: 'Acesso proibido: Sua função não permite esta ação.' }); }
      if (!canUpdate) { return res.status(403).json({ message: 'Acesso negado para atualizar esta tarefa.' }); }
      if (updateData.empresa_id !== undefined) {
        if (updateData.empresa_id) {
          const empresa = await empresaService.findEmpresaById(updateData.empresa_id);
          if (!empresa || empresa.tenant_id !== tarefaAtual.tenant_id) { return res.status(400).json({ message: `Empresa com ID ${updateData.empresa_id} não encontrada ou não pertence ao tenant da tarefa (${tarefaAtual.tenant_id}).` }); }
        } else { updateData.empresa_id = null; }
      }
      const tarefaAtualizada = await tarefaService.updateTarefa(tarefaId, updateData);
      if (tarefaAtualizada) { return res.status(200).json(tarefaAtualizada); }
      else { return res.status(404).json({ message: `Tarefa com ID ${tarefaId} não encontrada durante a tentativa de atualização.` }); }
    } catch (error: any) {
      console.error(`Erro no TarefaController.updateTarefa para ID ${tarefaId}:`, error.message);
      if (error.message === 'ID da tarefa inválido.') { return res.status(400).json({ message: 'ID da tarefa fornecido é inválido.' }); }
      if (error.message.startsWith('Empresa com ID') || error.message.startsWith('Responsável com ID')) { return res.status(400).json({ message: error.message }); }
      return res.status(500).json({ message: 'Erro ao atualizar a tarefa.', details: error.message });
    }
  }

  async deleteTarefa(req: AuthenticatedRequest, res: Response) {
    const tarefaId = req.params.id;
    const user = req.user as UserProfile;

    if (!user || !user.id || !user.funcao) {
      return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' });
    }

    try {
      const tarefaParaDeletar = await tarefaService.findTarefaById(tarefaId);
      if (!tarefaParaDeletar) {
        return res.status(404).json({ message: `Tarefa com ID ${tarefaId} não encontrada.` });
      }

      // Lógica de Autorização
      let canDelete = false;
      if (user.funcao === FuncaoUsuario.SUPERADMIN) {
        canDelete = true;
      } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
        if (!user.tenant_id) {
            return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant. Acesso negado.' });
        }
        if (tarefaParaDeletar.tenant_id === user.tenant_id) {
          canDelete = true;
        } else {
          return res.status(403).json({ message: 'Acesso proibido: Você só pode deletar tarefas do seu próprio escritório.' });
        }
      } else {
        return res.status(403).json({ message: 'Acesso proibido: Sua função não permite esta ação.' });
      }

      if (canDelete) {
        const success = await tarefaService.deleteTarefa(tarefaId);
        if (success) {
          return res.status(204).send();
        } else {
          // Se findTarefaById no serviço (chamado por deleteTarefa) falhar após esta verificação.
          return res.status(404).json({ message: `Tarefa com ID ${tarefaId} não encontrada para deleção (verificação do serviço).` });
        }
      }
      // O else para canDelete já foi tratado com retornos de status 403.
    } catch (error: any) {
      console.error(`Erro no TarefaController.deleteTarefa para ID ${tarefaId}:`, error.message);
      if (error.message === 'ID da tarefa inválido.') {
        return res.status(400).json({ message: 'ID da tarefa fornecido é inválido.' });
      }
      res.status(500).json({ message: 'Erro ao deletar a tarefa.', details: error.message });
    }
  }
}

export default new TarefaController();
