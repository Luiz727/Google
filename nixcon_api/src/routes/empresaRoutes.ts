import { Router } from 'express';
import empresaController from '../controllers/empresaController';
import authMiddleware from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import { FuncaoUsuario } from '../types/enums';

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
router.post(
  '/',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([FuncaoUsuario.SUPERADMIN, FuncaoUsuario.ADMIN_ESCRITORIO]),
  empresaController.createEmpresa
);

// Rota para atualizar uma empresa existente
// PATCH /api/v1/empresas/:id
router.patch(
  '/:id',
  authMiddleware.verifyToken,
  // A autorização mais granular (SuperAdmin vs AdminEscritorio do mesmo tenant) é feita no controller.
  // Poderia adicionar checkRole([FuncaoUsuario.SUPERADMIN, FuncaoUsuario.ADMIN_ESCRITORIO]) aqui
  // para barrar outras roles mais cedo.
  empresaController.updateEmpresa
);

// Rota para deletar uma empresa existente
// DELETE /api/v1/empresas/:id
// Protegida: Requer autenticação. A lógica de autorização (SuperAdmin vs AdminEscritorio do mesmo tenant)
// é tratada dentro do empresaController.deleteEmpresa.
router.delete(
  '/:id',
  authMiddleware.verifyToken,
  // Adicionar checkRole aqui para permitir apenas roles que podem deletar,
  // antes da lógica mais fina no controller.
  authorizationMiddleware.checkRole([FuncaoUsuario.SUPERADMIN, FuncaoUsuario.ADMIN_ESCRITORIO]),
  empresaController.deleteEmpresa
);

export default router;
