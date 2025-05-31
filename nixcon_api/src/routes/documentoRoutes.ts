import { Router } from 'express';
import documentoController from '../controllers/documentoController';
import authMiddleware from '../middlewares/authMiddleware';
import authorizationMiddleware from '../middlewares/authorizationMiddleware';
import uploadMiddleware from '../middlewares/uploadMiddleware';
import { FuncaoUsuario } from '../types/enums';

const router = Router();

// Rota para listar metadados de documentos
router.get(
  '/',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([
    FuncaoUsuario.SUPERADMIN,
    FuncaoUsuario.ADMIN_ESCRITORIO,
    FuncaoUsuario.USUARIO_ESCRITORIO,
  ]),
  documentoController.getAllDocumentos
);

// Rota para upload de novo documento e criação de metadados
router.post(
  '/',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([
    FuncaoUsuario.SUPERADMIN,
    FuncaoUsuario.ADMIN_ESCRITORIO,
    FuncaoUsuario.USUARIO_ESCRITORIO,
  ]),
  uploadMiddleware.single('arquivo'),
  documentoController.createDocumento
);

// Rota para buscar metadados de um documento específico por ID
router.get(
  '/:id',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([
    FuncaoUsuario.SUPERADMIN,
    FuncaoUsuario.ADMIN_ESCRITORIO,
    FuncaoUsuario.USUARIO_ESCRITORIO,
  ]),
  documentoController.getDocumentoById
);

// Rota para baixar o arquivo físico de um documento
router.get(
  '/:id/download',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([
    FuncaoUsuario.SUPERADMIN,
    FuncaoUsuario.ADMIN_ESCRITORIO,
    FuncaoUsuario.USUARIO_ESCRITORIO,
  ]),
  documentoController.downloadDocumento
);

// Rota para deletar um documento (arquivo no Storage e metadados no DB)
router.delete(
  '/:id',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([
    FuncaoUsuario.SUPERADMIN,
    FuncaoUsuario.ADMIN_ESCRITORIO,
    FuncaoUsuario.USUARIO_ESCRITORIO,
  ]),
  documentoController.deleteDocumento
);

// Rota para atualizar metadados de um documento
// PATCH /api/v1/documentos/:id
router.patch(
  '/:id',
  authMiddleware.verifyToken,
  authorizationMiddleware.checkRole([ // Guarda inicial para roles permitidas
    FuncaoUsuario.SUPERADMIN,
    FuncaoUsuario.ADMIN_ESCRITORIO,
    FuncaoUsuario.USUARIO_ESCRITORIO,
  ]),
  documentoController.updateDocumentoMetadata
);


export default router;
