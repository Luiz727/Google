import { Router } from 'express';
import authController from '../controllers/authController';
import authMiddleware from '../middlewares/authMiddleware';

const router = Router();

// Rota de Login
// POST /api/v1/auth/login
router.post('/login', authController.login);

// Rota para buscar informações do usuário logado (protegida)
// GET /api/v1/auth/me
router.get('/me', authMiddleware.verifyToken, authController.getMe);

export default router;
