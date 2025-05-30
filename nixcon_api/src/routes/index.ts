import { Router } from 'express';
import authRoutes from './authRoutes';
import tenantRoutes from './tenantRoutes';
import empresaRoutes from './empresaRoutes'; // Importar as rotas de empresas

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
router.use('/empresas', empresaRoutes); // Adicionar as rotas de empresas sob o prefixo /empresas


// Exemplo de como adicionar outras rotas no futuro:
// import productRoutes from './productRoutes';
// router.use('/products', productRoutes);

export default router;
