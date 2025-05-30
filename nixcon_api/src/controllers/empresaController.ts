import { Response } from 'express';
import empresaService from '../services/empresaService';
import { AuthenticatedRequest, UserProfile } from '../middlewares/authMiddleware';
import { FuncaoUsuario } from '../types/enums';
import { CreateEmpresaRequestBodyDto, ProcessedCreateEmpresaDto } from '../types/dtos/empresa.dto';

class EmpresaController {
  async getAllEmpresas(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const user = req.user as UserProfile;

    if (!user || !user.id || !user.funcao) {
      return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' });
    }

    let tenantIdParaConsulta: string | null = null;

    try {
      if (user.funcao === FuncaoUsuario.SUPERADMIN) {
        const queryTenantId = req.query.tenantId as string;
        if (!queryTenantId) {
          return res.status(400).json({ message: 'SuperAdmin deve especificar um "tenantId" como query parameter para listar empresas.' });
        }
        tenantIdParaConsulta = queryTenantId;
      } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
        if (!user.tenant_id) {
          return res.status(403).json({ message: 'Usuário de escritório não associado a um tenant específico.' });
        }
        tenantIdParaConsulta = user.tenant_id;
      } else {
        return res.status(403).json({ message: 'Acesso proibido: Sua função não permite listar empresas desta forma.' });
      }

      if (!tenantIdParaConsulta) {
        return res.status(400).json({ message: 'Não foi possível determinar o tenant para a consulta.' });
      }

      const empresas = await empresaService.findAllEmpresasByTenant(tenantIdParaConsulta);
      return res.status(200).json(empresas);

    } catch (error: any) {
      console.error('Erro no EmpresaController.getAllEmpresas:', error.message);
      if (error.message === 'ID do tenant inválido.') {
        return res.status(400).json({ message: 'O ID do tenant fornecido é inválido.' });
      }
      return res.status(500).json({ message: 'Erro ao buscar empresas.', details: error.message });
    }
  }

  async getEmpresaById(req: AuthenticatedRequest, res: Response) {
    // ... (código existente omitido para brevidade)
    const empresaId = req.params.id;
    const user = req.user as UserProfile;

    if (!user || !user.id || !user.funcao) {
      return res.status(401).json({ message: 'Usuário não autenticado ou dados de perfil incompletos.' });
    }

    try {
      const empresa = await empresaService.findEmpresaById(empresaId);

      if (!empresa) {
        return res.status(404).json({ message: `Empresa com ID ${empresaId} não encontrada.` });
      }

      if (user.funcao === FuncaoUsuario.SUPERADMIN) {
        return res.status(200).json(empresa);
      } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO || user.funcao === FuncaoUsuario.USUARIO_ESCRITORIO) {
        if (empresa.tenant_id === user.tenant_id) {
          return res.status(200).json(empresa);
        } else {
          return res.status(403).json({ message: 'Acesso proibido: Você não tem permissão para visualizar esta empresa.' });
        }
      } else {
        return res.status(403).json({ message: 'Acesso proibido: Sua função não permite esta ação.' });
      }
    } catch (error: any) {
      console.error(`Erro no EmpresaController.getEmpresaById para ID ${empresaId}:`, error.message);
      if (error.message === 'ID da empresa inválido.') {
        return res.status(400).json({ message: 'ID da empresa fornecido é inválido.' });
      }
      return res.status(500).json({ message: 'Erro ao buscar a empresa.', details: error.message });
    }
  }

  async createEmpresa(req: AuthenticatedRequest, res: Response) {
    const user = req.user as UserProfile;
    const requestBody = req.body as CreateEmpresaRequestBodyDto;

    // Validação de campos obrigatórios
    if (!requestBody.nome || typeof requestBody.nome !== 'string' || requestBody.nome.trim() === '') {
      return res.status(400).json({ message: 'O campo "nome" é obrigatório.' });
    }
    if (!requestBody.cnpj || typeof requestBody.cnpj !== 'string' || requestBody.cnpj.trim() === '') {
      return res.status(400).json({ message: 'O campo "cnpj" é obrigatório.' });
    }
    // Adicionar mais validações conforme necessário (ex: formato do CNPJ, email, etc.)

    let tenantIdParaCriacao: string;

    // Determinação do tenant_id e Autorização
    if (user.funcao === FuncaoUsuario.SUPERADMIN) {
      if (!requestBody.tenant_id) {
        return res.status(400).json({ message: 'SuperAdmin deve especificar o "tenant_id" no corpo da requisição para criar uma empresa.' });
      }
      // TODO: Opcional: Verificar se o tenant_id fornecido pelo SuperAdmin existe.
      // Se não existir, o Supabase pode retornar um erro de FK constraint que será pego abaixo.
      tenantIdParaCriacao = requestBody.tenant_id;
    } else if (user.funcao === FuncaoUsuario.ADMIN_ESCRITORIO) {
      if (!user.tenant_id) {
        return res.status(403).json({ message: 'Admin de escritório não associado a um tenant. Não é possível criar empresa.' });
      }
      if (requestBody.tenant_id && requestBody.tenant_id !== user.tenant_id) {
        return res.status(403).json({ message: 'Admin de escritório não pode criar empresa para um tenant diferente do seu.' });
      }
      tenantIdParaCriacao = user.tenant_id;
    } else {
      return res.status(403).json({ message: 'Acesso proibido: Sua função não permite criar empresas.' });
    }

    // Montar o DTO Processado para o serviço
    const processedEmpresaData: ProcessedCreateEmpresaDto = {
      ...requestBody, // Inclui nome, cnpj, e todos os campos opcionais
      tenant_id: tenantIdParaCriacao, // tenant_id definido pela lógica acima
    };

    try {
      const novaEmpresa = await empresaService.createEmpresa(processedEmpresaData);
      if (novaEmpresa) {
        return res.status(201).json(novaEmpresa);
      } else {
        // Caso o serviço retorne null sem lançar erro (improvável com a lógica atual do serviço)
        return res.status(500).json({ message: 'Falha ao criar a empresa, o serviço não retornou dados.' });
      }
    } catch (error: any) {
      console.error('Erro no EmpresaController.createEmpresa:', error.message);
      // Tratar erro de constraint única (ex: CNPJ duplicado)
      // O código '23505' é para unique_violation no PostgreSQL.
      // A mensagem de erro do Supabase/Postgres pode conter o nome da constraint, ex: "empresas_cnpj_key".
      if (error.code === '23505') {
        if (error.message.includes('empresas_cnpj_key')) { // Ajustar nome da constraint se necessário
            return res.status(409).json({ message: 'Conflito: Já existe uma empresa com este CNPJ.', details: error.detail });
        }
        return res.status(409).json({ message: 'Conflito: Violação de constraint de unicidade.', details: error.detail || error.message });
      }
      // Tratar erro de FK constraint (ex: tenant_id não existe)
      // O código '23503' é para foreign_key_violation.
      if (error.code === '23503') {
         if (error.message.includes('empresas_tenant_id_fkey')) { // Ajustar nome da constraint se necessário
            return res.status(400).json({ message: `Tenant com ID "${tenantIdParaCriacao}" não encontrado. Impossível criar empresa.`, details: error.detail });
        }
        return res.status(400).json({ message: 'Erro de referência a outra tabela (ex: tenant não existe).', details: error.detail || error.message });
      }
      return res.status(500).json({ message: 'Erro ao criar a empresa.', details: error.message });
    }
  }

  // TODO: Implementar updateEmpresa e deleteEmpresa
}

export default new EmpresaController();
