import { supabase } from '../config/supabaseClient';
import { CreateTenantDto, UpdateTenantDto } from '../types/dtos/tenant.dto';

export interface Tenant {
  id: string;
  nome: string;
  configuracoes_emissor?: any;
  configuracoes_visuais?: any;
  configuracoes_modulos?: any;
  created_at: string;
  updated_at: string;
}

class TenantService {
  async findAllTenants(): Promise<Tenant[]> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          id,
          nome,
          created_at,
          updated_at,
          configuracoes_emissor,
          configuracoes_visuais,
          configuracoes_modulos
        `)
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar tenants:', error.message);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Exceção em TenantService.findAllTenants:', error);
      throw error;
    }
  }

  async findTenantById(id: string): Promise<Tenant | null> {
    if (!id || typeof id !== 'string') {
      console.error('ID do tenant inválido fornecido para findTenantById:', id);
      throw new Error('ID do tenant inválido.');
    }
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error(`Erro ao buscar tenant com ID ${id}:`, error.message);
        throw error;
      }
      return data as Tenant | null;
    } catch (error) {
      console.error('Exceção em TenantService.findTenantById:', error);
      throw error;
    }
  }

  async createTenant(tenantData: CreateTenantDto): Promise<Tenant | null> {
    try {
      const newTenantData = {
        nome: tenantData.nome,
        configuracoes_emissor: tenantData.configuracoes_emissor || {},
        configuracoes_visuais: tenantData.configuracoes_visuais || {},
        configuracoes_modulos: tenantData.configuracoes_modulos || {},
      };

      const { data, error } = await supabase
        .from('tenants')
        .insert(newTenantData)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar tenant:', error.message);
        throw error;
      }
      return data as Tenant | null;
    } catch (error) {
      console.error('Exceção em TenantService.createTenant:', error);
      throw error;
    }
  }

  async updateTenant(id: string, tenantData: UpdateTenantDto): Promise<Tenant | null> {
    if (!id || typeof id !== 'string') {
      console.error('ID do tenant inválido fornecido para updateTenant:', id);
      throw new Error('ID do tenant inválido.');
    }
    try {
      const { data, error } = await supabase
        .from('tenants')
        .update(tenantData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Erro ao atualizar tenant com ID ${id}:`, error.message);
        // Com .single(), um erro será lançado se o ID não existir (PGRST116).
        // Esse erro será capturado no bloco catch abaixo.
        throw error;
      }
      return data as Tenant | null;
    } catch (error: any) {
      console.error('Exceção em TenantService.updateTenant:', error);
      if (error.code === 'PGRST116') {
          return null;
      }
      throw error;
    }
  }

  /**
   * Deleta um tenant existente pelo ID.
   * @param id - O UUID do tenant a ser deletado.
   * @returns Promise<boolean> - True se a deleção foi bem-sucedida e uma linha foi afetada, false caso contrário. Lança erro em caso de falha.
   */
  async deleteTenant(id: string): Promise<boolean> {
    if (!id || typeof id !== 'string') {
      console.error('ID do tenant inválido fornecido para deleteTenant:', id);
      throw new Error('ID do tenant inválido.');
    }
    try {
      // Para verificar se o tenant existe antes de deletar (e retornar true/false corretamente),
      // podemos fazer um select primeiro, ou confiar no count retornado pela operação de delete.
      // O SDK do Supabase v2 para JS, o método delete não retorna diretamente o 'count' na propriedade 'data' como v1.
      // A resposta de um delete bem-sucedido é { data: null, error: null, count: null } ou similar se nada for selecionado.
      // Se quisermos saber se algo foi realmente deletado, precisamos primeiro verificar se existe, ou
      // fazer um select após o delete (o que não faz sentido), ou
      // não se preocupar com o count e apenas retornar true se não houver erro.
      // No entanto, se o ID não existir, o delete não dará erro, simplesmente não afetará linhas.
      // Para prover um feedback de "não encontrado" (404), é melhor verificar primeiro.

      const existingTenant = await this.findTenantById(id);
      if (!existingTenant) {
        return false; // Tenant não encontrado, portanto não pode ser deletado.
      }

      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Erro ao deletar tenant com ID ${id}:`, error.message);
        // Considerar erros de FK se houver restrições não resolvidas com ON DELETE
        throw error;
      }

      // Se não houve erro, assume-se que a deleção foi bem-sucedida (se o ID existia).
      return true;
    } catch (error) {
      console.error('Exceção em TenantService.deleteTenant:', error);
      throw error;
    }
  }
}

export default new TenantService();
