import { Router } from 'express';
import empresaController from '../controllers/empresaController';
import authMiddleware from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware'; // Importar para checkRole
import { FuncaoUsuario } from '../types/enums'; // Importar para usar no checkRole

const router = Router();

// Rota para listar empresas de um tenant
// GET /api/v1/empresas
router.get(
  '/',
  authMiddleware.verifyToken,
  empresaController.getAllEmpresas
);

// Rota para buscar uma empresa específica por ID
// GET /api/v1/empresas/:id
router.get(
  '/:id',
  authMiddleware.verifyToken,
  empresaController.getEmpresaById
);

// Rota para criar uma nova empresa
// POST /api/v1/empresas
// Protegida: Requer autenticação e que o usuário seja SuperAdmin ou AdminEscritorio.
// A lógica mais granular (SuperAdmin especifica tenant_id, AdminEscritorio usa o seu) está no controller.
router.post(
  '/',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([FuncaoUsuario.SUPERADMIN, FuncaoUsuario.ADMIN_ESCRITORIO]),
  empresaController.createEmpresa
);

// TODO: Definir outras rotas CRUD para Empresas aqui.
// Exemplo:
// router.patch(
//   '/:id',
//   authMiddleware.verifyToken,
//   // Adicionar checkRole ou lógica no controller para quem pode atualizar
//   empresaController.updateEmpresa // Método a ser implementado
// );

// router.delete(
//   '/:id',
//   authMiddleware.verifyToken,
//   // Provavelmente restrito a SuperAdmin ou AdminEscritorio para empresas do seu tenant
//   empresaController.deleteEmpresa // Método a ser implementado
// );

export default router;
