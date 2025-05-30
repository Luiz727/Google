import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabaseClient';
import { FuncaoUsuario } from '../types/enums'; // Import FuncaoUsuario

// Definição do que esperamos que o objeto user contenha após a autenticação e busca no perfil
export interface UserProfile {
  id: string; // Auth user ID
  email?: string; // Auth user email
  funcao?: FuncaoUsuario | string; // Role from profiles table
  tenant_id?: string | null; // tenant_id from profiles table
  // Adicione quaisquer outros campos do perfil que devam ser anexados a req.user
  // nome?: string;
  // avatar_url?: string;
  // ativo?: boolean;
}

// Estendendo a interface Request para incluir a propriedade 'user' com o tipo UserProfile
export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

class AuthMiddleware {
  async verifyToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token de autenticação não fornecido ou mal formatado.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token de autenticação não encontrado após "Bearer ".' });
    }

    try {
      // 1. Validar o token e obter o usuário de autenticação (auth.users)
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

      if (authError) {
        console.error('Erro ao validar token com Supabase Auth:', authError.message);
        if (authError.message === 'invalid JWT' || authError.message.includes('expired')) {
             return res.status(401).json({ message: 'Token inválido ou expirado.' });
        }
        return res.status(401).json({ message: 'Falha na autenticação do token.', details: authError.message });
      }

      if (!authUser) {
        return res.status(401).json({ message: 'Usuário não autenticado (token inválido ou sessão não encontrada).' });
      }

      // 2. Buscar o perfil do usuário na tabela 'profiles' para obter 'funcao' e outros dados
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('funcao, tenant_id, nome, ativo, avatar_url') // Adicione outros campos do perfil conforme necessário
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error(`Erro ao buscar perfil para o usuário ${authUser.id}:`, profileError.message);
        // Se o perfil não for encontrado, ainda podemos considerar o usuário autenticado, mas sem uma função/perfil específico.
        // Dependendo da política do app, isso pode ser um erro ou um estado válido para certas rotas.
        // Por agora, vamos tratar como um erro que impede a continuação para rotas que dependem do perfil.
        if (profileError.code === 'PGRST116') { // Query returned no rows
             console.warn(`Perfil não encontrado para o usuário autenticado: ${authUser.id}. O usuário existe no Supabase Auth mas não na tabela profiles.`);
             //  return res.status(403).json({ message: 'Perfil de usuário não configurado corretamente.' });
        }
        // Para outras roles, pode ser importante ter o perfil. Para SuperAdmin, talvez não seja estritamente necessário ter um perfil em `profiles`
        // mas para `checkRole` funcionar, ele precisa da `funcao`.
        // Se `funcao` não for encontrada, `checkRole` irá barrar.
        // Vamos anexar o que temos, e `checkRole` fará a validação da função.
      }

      // 3. Anexar um objeto user combinado à requisição
      req.user = {
        id: authUser.id,
        email: authUser.email,
        funcao: profile?.funcao || undefined, // Garante que funcao seja undefined se não houver perfil
        tenant_id: profile?.tenant_id || null,
        // nome: profile?.nome,
        // ativo: profile?.ativo,
        // avatar_url: profile?.avatar_url,
      };

      next(); // Prossegue para o próximo middleware ou rota

    } catch (error: any) {
      console.error('Erro interno no middleware de autenticação verifyToken:', error);
      return res.status(500).json({ message: 'Erro interno no servidor durante a autenticação.', details: error.message });
    }
  }
}

export default new AuthMiddleware();
