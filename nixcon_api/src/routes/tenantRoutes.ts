import { Router } from 'express';
import tenantController from '../controllers/tenantController';
import authMiddleware from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import { FuncaoUsuario } from '../types/enums';

const router = Router();

// Rota para listar todos os tenants
// GET /api/v1/tenants
router.get(
  '/',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([FuncaoUsuario.SUPERADMIN]),
  tenantController.getAllTenants
);

// Rota para buscar um tenant específico por ID
// GET /api/v1/tenants/:id
router.get(
  '/:id',
  authMiddleware.verifyToken,
  tenantController.getTenantById
);

// Rota para criar um novo tenant
// POST /api/v1/tenants
router.post(
  '/',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([FuncaoUsuario.SUPERADMIN]),
  tenantController.createTenant
);

// Rota para atualizar um tenant existente
// PATCH /api/v1/tenants/:id
router.patch(
  '/:id',
  authMiddleware.verifyToken,
  tenantController.updateTenant // Autorização granular no controller
);

// Rota para deletar um tenant existente
// DELETE /api/v1/tenants/:id
// Protegida: Requer autenticação e que o usuário tenha a função SuperAdmin.
router.delete(
  '/:id',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([FuncaoUsuario.SUPERADMIN]),
  tenantController.deleteTenant
);


export default router;
