import { supabase } from '../config/supabaseClient';
import { ProcessedCreateEmpresaDto, UpdateEmpresaDto } from '../types/dtos/empresa.dto';

export interface Empresa {
  id: string;
  tenant_id: string;
  nome: string;
  cnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
  contato_principal?: string | null;
  status?: string | null;
  regime_tributario?: string | null;
  honorarios?: number | null;
  dia_vencimento_honorarios?: number | null;
  data_inicio_contrato?: string | null;
  data_fim_contrato?: string | null;
  endereco?: any | null;
  cpf_responsavel_legal?: string | null;
  tipo_empresa_simulacao?: string | null;
  configuracoes_emissor?: any | null;
  configuracoes_efd?: any | null;
  created_at: string;
  updated_at: string;
}

class EmpresaService {
  async findAllEmpresasByTenant(tenantId: string): Promise<Empresa[]> {
    // ... (código existente omitido para brevidade)
    if (!tenantId || typeof tenantId !== 'string') { throw new Error('ID do tenant inválido.'); }
    try {
      const { data, error } = await supabase.from('empresas').select(`id, tenant_id, nome, cnpj, email, telefone, contato_principal, status, regime_tributario, created_at, updated_at`).eq('tenant_id', tenantId).order('nome', { ascending: true });
      if (error) { throw error; }
      return data || [];
    } catch (error) { console.error('Exceção em EmpresaService.findAllEmpresasByTenant:', error); throw error; }
  }

  async findEmpresaById(empresaId: string): Promise<Empresa | null> {
    // ... (código existente omitido para brevidade)
    if (!empresaId || typeof empresaId !== 'string') { throw new Error('ID da empresa inválido.'); }
    try {
      const { data, error } = await supabase.from('empresas').select('*').eq('id', empresaId).single();
      if (error) { if (error.code === 'PGRST116') { return null; } throw error; }
      return data as Empresa | null;
    } catch (error) { console.error('Exceção em EmpresaService.findEmpresaById:', error); throw error; }
  }

  async createEmpresa(empresaData: ProcessedCreateEmpresaDto): Promise<Empresa | null> {
    // ... (código existente omitido para brevidade)
    try {
      const { data, error } = await supabase.from('empresas').insert(empresaData).select().single();
      if (error) { throw error; }
      return data as Empresa | null;
    } catch (error) { console.error('Exceção em EmpresaService.createEmpresa:', error); throw error; }
  }

  async updateEmpresa(empresaId: string, empresaData: UpdateEmpresaDto): Promise<Empresa | null> {
    // ... (código existente omitido para brevidade)
    if (!empresaId || typeof empresaId !== 'string') { throw new Error('ID da empresa inválido.'); }
    const { tenant_id, ...dataToUpdate } = empresaData as any;
    if (tenant_id) { console.warn(`Tentativa de atualizar tenant_id para empresa ${empresaId} foi ignorada.`); }
    try {
      const { data, error } = await supabase.from('empresas').update(dataToUpdate).eq('id', empresaId).select().single();
      if (error) { throw error; }
      return data as Empresa | null;
    } catch (error: any) { if (error.code === 'PGRST116') { return null; } throw error; }
  }

  /**
   * Deleta uma empresa existente pelo ID.
   * @param empresaId - O UUID da empresa a ser deletada.
   * @returns Promise<boolean> - True se a deleção foi bem-sucedida (empresa existia e foi deletada), false se a empresa não foi encontrada. Lança erro em caso de falha na deleção.
   */
  async deleteEmpresa(empresaId: string): Promise<boolean> {
    if (!empresaId || typeof empresaId !== 'string') {
      console.error('ID da empresa inválido fornecido para deleteEmpresa:', empresaId);
      throw new Error('ID da empresa inválido.');
    }
    try {
      // Verificar se a empresa existe antes de tentar deletar.
      const empresaExistente = await this.findEmpresaById(empresaId);
      if (!empresaExistente) {
        return false; // Empresa não encontrada.
      }

      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', empresaId);

      if (error) {
        console.error(`Erro ao deletar empresa com ID ${empresaId}:`, error.message);
        // Considerar erros de FK se houver restrições não resolvidas com ON DELETE CASCADE.
        // O Supabase/Postgres deve retornar um erro apropriado se a deleção for impedida.
        throw error;
      }

      // Se não houve erro, e a empresa existia, a deleção foi bem-sucedida.
      return true;
    } catch (error) {
      // Se findEmpresaById lançar um erro que não seja "não encontrado", ele será pego aqui.
      console.error('Exceção em EmpresaService.deleteEmpresa:', error);
      throw error; // Re-lança para o controller
    }
  }
}

export default new EmpresaService();
