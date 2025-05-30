import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mainRouter from './routes'; // Descomentar quando as rotas existirem

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Configurar a origem permitida
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas principais (exemplo)
app.use('/api/v1', mainRouter); // Descomentar quando as rotas existirem

app.get('/', (req: Request, res: Response) => {
  res.send('Nixcon API está funcionando!');
});

// Error Handling Middleware (exemplo básico)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Algo deu errado!');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
  if (process.env.SUPABASE_URL) {
    console.log('Supabase URL configurada.');
  } else {
    console.warn('SUPABASE_URL não encontrada. Verifique o arquivo .env');
  }
});
