import { Response, NextFunction } from 'express';
import { FuncaoUsuario } from '../types/enums';
import { AuthenticatedRequest, UserProfile } from './authMiddleware'; // Importar a interface atualizada

class AuthorizationMiddleware {
  /**
   * Middleware factory para verificar se o usuário logado possui uma das funções permitidas.
   * @param allowedRoles Array de FuncaoUsuario permitidas para acessar a rota.
   */
  public checkRole(allowedRoles: FuncaoUsuario[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const user = req.user as UserProfile; // Type assertion para garantir que temos UserProfile

      if (!user || !user.funcao) {
        return res.status(403).json({ message: 'Acesso proibido: Função do usuário não identificada.' });
      }

      const userRole = user.funcao as FuncaoUsuario; // Confia que a string em user.funcao é um valor válido de FuncaoUsuario

      if (allowedRoles.includes(userRole)) {
        next(); // Usuário tem a permissão, prossegue para a rota
      } else {
        return res.status(403).json({
          message: `Acesso proibido: Esta rota requer uma das seguintes funções: ${allowedRoles.join(', ')}. Sua função é ${userRole}.`
        });
      }
    };
  }

  // Outros middlewares de autorização podem ser adicionados aqui.
  // Ex: checkTenantAccess(req, res, next) para verificar se o usuário pertence ao tenant que está tentando acessar/modificar.
}

export default new AuthorizationMiddleware();
