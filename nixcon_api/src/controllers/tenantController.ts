import { Request, Response } from 'express';
import tenantService from '../services/tenantService';
import { AuthenticatedRequest, UserProfile } from '../middlewares/authMiddleware';
import { FuncaoUsuario } from '../types/enums';
import { CreateTenantDto, UpdateTenantDto } from '../types/dtos/tenant.dto';

class TenantController {
  async getAllTenants(req: Request, res: Response) {
    try {
      const tenants = await tenantService.findAllTenants();
      res.status(200).json(tenants);
    } catch (error: any) {
      console.error('Erro no TenantController.getAllTenants:', error.message);
      res.status(500).json({ message: 'Erro ao buscar tenants.', details: error.message });
    }
  }

  async getTenantById(req: AuthenticatedRequest, res: Response) {
    const tenantIdToFetch = req.params.id;
    const user = req.user as UserProfile;

    if (!user || !user.id || !user.funcao) {
      return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' });
    }

    try {
      if (user.funcao === FuncaoUsuario.SUPERADMIN) {
        const tenant = await tenantService.findTenantById(tenantIdToFetch);
        if (tenant) {
          return res.status(200).json(tenant);
        } else {
          return res.status(404).json({ message: `Tenant com ID ${tenantIdToFetch} não encontrado.` });
        }
      } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO) {
        if (tenantIdToFetch === user.tenant_id) {
          const tenant = await tenantService.findTenantById(tenantIdToFetch);
          if (tenant) {
            return res.status(200).json(tenant);
          } else {
            console.error(`AdminEscritorio ${user.id} do tenant ${user.tenant_id} não encontrou seu próprio tenant (ID buscado: ${tenantIdToFetch}).`);
            return res.status(404).json({ message: `Tenant com ID ${tenantIdToFetch} não encontrado.` });
          }
        } else {
          return res.status(403).json({ message: 'Acesso proibido: Você só pode visualizar dados do seu próprio escritório.' });
        }
      } else {
        return res.status(403).json({ message: 'Acesso proibido: Sua função não permite esta ação.' });
      }
    } catch (error: any) {
      console.error(`Erro no TenantController.getTenantById para ID ${tenantIdToFetch}:`, error.message);
      if (error.message === 'ID do tenant inválido.') {
        return res.status(400).json({ message: 'ID do tenant fornecido é inválido.' });
      }
      res.status(500).json({ message: 'Erro ao buscar o tenant.', details: error.message });
    }
  }

  async createTenant(req: AuthenticatedRequest, res: Response) {
    const tenantData = req.body as CreateTenantDto;
    if (!tenantData.nome || typeof tenantData.nome !== 'string' || tenantData.nome.trim() === '') {
      return res.status(400).json({ message: 'O campo "nome" é obrigatório e deve ser uma string não vazia.' });
    }
    try {
      const novoTenant = await tenantService.createTenant(tenantData);
      if (novoTenant) {
        return res.status(201).json(novoTenant);
      } else {
        return res.status(500).json({ message: 'Falha ao criar o tenant, o serviço não retornou dados.' });
      }
    } catch (error: any) {
      console.error('Erro no TenantController.createTenant:', error.message);
      if (error.code === '23505') {
        return res.status(409).json({ message: 'Conflito: Já existe um tenant com dados semelhantes (ex: nome duplicado).', details: error.detail || error.message });
      }
      return res.status(500).json({ message: 'Erro ao criar o tenant.', details: error.message });
    }
  }

  async updateTenant(req: AuthenticatedRequest, res: Response) {
    const tenantIdToUpdate = req.params.id;
    const user = req.user as UserProfile;
    const updateData = req.body as UpdateTenantDto;

    if (!user || !user.id || !user.funcao) {
      return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' });
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Nenhum dado fornecido para atualização.' });
    }
    if (updateData.nome !== undefined && (typeof updateData.nome !== 'string' || updateData.nome.trim() === '')) {
        return res.status(400).json({ message: 'Se fornecido, o campo "nome" não pode ser uma string vazia.' });
    }

    try {
      let canUpdate = false;
      if (user.funcao === FuncaoUsuario.SUPERADMIN) {
        canUpdate = true;
      } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO) {
        if (tenantIdToUpdate === user.tenant_id) {
          canUpdate = true;
        } else {
          return res.status(403).json({ message: 'Acesso proibido: Você só pode atualizar dados do seu próprio escritório.' });
        }
      } else {
        return res.status(403).json({ message: 'Acesso proibido: Sua função não permite esta ação.' });
      }

      if (canUpdate) {
        const tenantAtualizado = await tenantService.updateTenant(tenantIdToUpdate, updateData);
        if (tenantAtualizado) {
          return res.status(200).json(tenantAtualizado);
        } else {
          return res.status(404).json({ message: `Tenant com ID ${tenantIdToUpdate} não encontrado para atualização.` });
        }
      }
    } catch (error: any) {
      console.error(`Erro no TenantController.updateTenant para ID ${tenantIdToUpdate}:`, error.message);
      if (error.message === 'ID do tenant inválido.') {
        return res.status(400).json({ message: 'ID do tenant fornecido é inválido.' });
      }
      if (error.code === '23505') {
        return res.status(409).json({ message: 'Conflito: O nome do tenant já existe.', details: error.detail });
      }
      res.status(500).json({ message: 'Erro ao atualizar o tenant.', details: error.message });
    }
  }

  async deleteTenant(req: AuthenticatedRequest, res: Response) {
    // A autorização (SuperAdmin) já foi feita pelo middleware na rota.
    const tenantIdToDelete = req.params.id;

    try {
      const success = await tenantService.deleteTenant(tenantIdToDelete);
      if (success) {
        return res.status(204).send(); // 204 No Content para deleção bem-sucedida
      } else {
        // Isso acontece se o tenantService.deleteTenant retornar false (ID não encontrado)
        return res.status(404).json({ message: `Tenant com ID ${tenantIdToDelete} não encontrado para deleção.` });
      }
    } catch (error: any) {
      console.error(`Erro no TenantController.deleteTenant para ID ${tenantIdToDelete}:`, error.message);
      if (error.message === 'ID do tenant inválido.') {
        return res.status(400).json({ message: 'ID do tenant fornecido é inválido.' });
      }
      // Tratar outros erros, como violações de FK se ON DELETE não estiver configurado para CASCADE onde necessário,
      // embora o Supabase deva lidar com isso e retornar um erro genérico se a deleção for impedida.
      res.status(500).json({ message: 'Erro ao deletar o tenant.', details: error.message });
    }
  }
}

export default new TenantController();
