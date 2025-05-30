import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
// Usar a definição de AuthenticatedRequest e UserProfile do authMiddleware para consistência
import { AuthenticatedRequest, UserProfile } from '../middlewares/authMiddleware';

class AuthController {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login do Supabase:', error.message);
        return res.status(401).json({ message: 'Credenciais inválidas.', details: error.message });
      }

      if (data.session && data.user) {
        const { access_token, refresh_token, ...sessionData } = data.session;

        return res.status(200).json({
          message: 'Login bem-sucedido!',
          session: { access_token, ...sessionData },
          user: data.user, // Retorna o usuário do Supabase Auth (id, email, etc.)
        });
      } else {
        return res.status(500).json({ message: 'Ocorreu um erro inesperado durante o login.' });
      }
    } catch (error: any) {
      console.error('Erro interno no servidor durante o login:', error);
      return res.status(500).json({ message: 'Erro interno no servidor.', details: error.message });
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    // O middleware authMiddleware.verifyToken já populou req.user com os dados de autenticação e do perfil.
    // req.user agora deve ser do tipo UserProfile.
    const userProfile = req.user;

    if (!userProfile || !userProfile.id) {
      // Este caso teoricamente não deveria ser alcançado se o verifyToken funcionou.
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    // Verifica se o perfil (e, portanto, a função) foi encontrado pelo middleware.
    // O middleware anexa o user de auth e tenta aninhar dados do profile.
    // Se userProfile.funcao não existir, significa que o perfil não foi encontrado ou não tem função.
    if (!userProfile.funcao) {
        // Retornar os dados parciais do usuário (auth) e um aviso sobre o perfil.
        // Ou pode-se optar por um 404 se o perfil for estritamente necessário para a sessão ser considerada "completa".
        console.warn(`Usuário ${userProfile.id} autenticado mas sem perfil completo (função não encontrada).`);
        //  Devolvemos o que temos do usuário, o frontend pode decidir como lidar.
        //  Alternativamente, poderia retornar 404 Not Found se um perfil funcional é obrigatório.
        //  return res.status(404).json({ message: 'Perfil do usuário não encontrado ou incompleto (sem função definida).', user: { id: userProfile.id, email: userProfile.email } });
    }

    // Retorna os dados do perfil do usuário que foram anexados em req.user pelo authMiddleware
    // O objeto userProfile já contém id, email, funcao, tenant_id, etc.
    return res.status(200).json(userProfile);
  }
}

export default new AuthController();
