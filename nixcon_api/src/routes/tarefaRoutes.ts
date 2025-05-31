import { Router } from 'express';
import tarefaController from '../controllers/tarefaController';
import authMiddleware from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import { FuncaoUsuario } from '../types/enums';

const router = Router();

// Rota para listar tarefas
// GET /api/v1/tarefas
router.get(
  '/',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([
    FuncaoUsuario.SUPERADMIN,
    FuncaoUsuario.ADMIN_ESCRITORIO,
    FuncaoUsuario.USUARIO_ESCRITORIO,
  ]),
  tarefaController.getAllTarefas
);

// Rota para buscar uma tarefa específica por ID
// GET /api/v1/tarefas/:id
router.get(
  '/:id',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([
    FuncaoUsuario.SUPERADMIN,
    FuncaoUsuario.ADMIN_ESCRITORIO,
    FuncaoUsuario.USUARIO_ESCRITORIO,
  ]),
  tarefaController.getTarefaById
);

// Rota para criar uma nova tarefa
// POST /api/v1/tarefas
router.post(
  '/',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([
    FuncaoUsuario.SUPERADMIN,
    FuncaoUsuario.ADMIN_ESCRITORIO,
    FuncaoUsuario.USUARIO_ESCRITORIO,
  ]),
  tarefaController.createTarefa
);

// Rota para atualizar uma tarefa existente
// PATCH /api/v1/tarefas/:id
router.patch(
  '/:id',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([
    FuncaoUsuario.SUPERADMIN,
    FuncaoUsuario.ADMIN_ESCRITORIO,
    FuncaoUsuario.USUARIO_ESCRITORIO,
  ]),
  tarefaController.updateTarefa
);

// Rota para deletar uma tarefa existente
// DELETE /api/v1/tarefas/:id
// Protegida: Requer autenticação e que o usuário seja do tipo escritório.
// A lógica de autorização mais fina (SuperAdmin vs. usuários do tenant da tarefa)
// é tratada dentro do tarefaController.deleteTarefa.
router.delete(
  '/:id',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([ // Guarda inicial para roles permitidas
    FuncaoUsuario.SUPERADMIN,
    FuncaoUsuario.ADMIN_ESCRITORIO,
    FuncaoUsuario.USUARIO_ESCRITORIO,
  ]),
  tarefaController.deleteTarefa
);

export default router;
