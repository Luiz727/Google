import { Router } from 'express';
import authRoutes from './authRoutes';
import tenantRoutes from './tenantRoutes';
import empresaRoutes from './empresaRoutes';
import tarefaRoutes from './tarefaRoutes';
import documentoRoutes from './documentoRoutes';
import produtoRoutes from './produtoRoutes'; // Importar as rotas de produtos

const router = Router();

// Rota de health check
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Rotas de Autenticação
router.use('/auth', authRoutes);

// Rotas de Tenants
router.use('/tenants', tenantRoutes);

// Rotas de Empresas
router.use('/empresas', empresaRoutes);

// Rotas de Tarefas
router.use('/tarefas', tarefaRoutes);

// Rotas de Documentos
router.use('/documentos', documentoRoutes);

// Rotas de Produtos
router.use('/produtos', produtoRoutes); // Adicionar as rotas de produtos sob o prefixo /produtos


export default router;
