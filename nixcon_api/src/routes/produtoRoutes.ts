import { Router } from 'express';
import produtoController from '../controllers/produtoController';
import authMiddleware from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import { FuncaoUsuario } from '../types/enums';

const router = Router();

// Rota para listar produtos
router.get(
  '/',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([
    FuncaoUsuario.SUPERADMIN,
    FuncaoUsuario.ADMIN_ESCRITORIO,
    FuncaoUsuario.USUARIO_ESCRITORIO,
  ]),
  produtoController.getAllProdutos
);

// Rota para buscar um produto específico por ID
router.get(
  '/:id',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([
    FuncaoUsuario.SUPERADMIN,
    FuncaoUsuario.ADMIN_ESCRITORIO,
    FuncaoUsuario.USUARIO_ESCRITORIO,
  ]),
  produtoController.getProdutoById
);

// Rota para criar um novo produto
router.post(
  '/',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([
    FuncaoUsuario.SUPERADMIN,
    FuncaoUsuario.ADMIN_ESCRITORIO,
    FuncaoUsuario.USUARIO_ESCRITORIO,
  ]),
  produtoController.createProduto
);

// Rota para atualizar um produto existente
router.patch(
  '/:id',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([
    FuncaoUsuario.SUPERADMIN,
    FuncaoUsuario.ADMIN_ESCRITORIO,
    FuncaoUsuario.USUARIO_ESCRITORIO,
  ]),
  produtoController.updateProduto
);

// Rota para deletar um produto existente
// DELETE /api/v1/produtos/:id
// Protegida: Requer autenticação e que o usuário seja SuperAdmin, AdminEscritorio ou UsuarioEscritorio.
// A lógica de autorização mais fina (quem pode deletar qual produto) está no controller.
router.delete(
  '/:id',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([
    FuncaoUsuario.SUPERADMIN,
    FuncaoUsuario.ADMIN_ESCRITORIO,
    FuncaoUsuario.USUARIO_ESCRITORIO, // Permitir que UsuarioEscritorio também possa deletar (se a lógica no controller permitir)
  ]),
  produtoController.deleteProduto
);

export default router;
