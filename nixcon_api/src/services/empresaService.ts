import { supabase } from '../config/supabaseClient';
import { ProcessedCreateEmpresaDto } from '../types/dtos/empresa.dto'; // Importar o DTO processado

// Interface para o objeto Empresa, refletindo a estrutura da tabela 'empresas'
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
  endereco?: any | null; // JSONB
  cpf_responsavel_legal?: string | null;
  tipo_empresa_simulacao?: string | null;
  configuracoes_emissor?: any | null; // JSONB
  configuracoes_efd?: any | null; // JSONB
  created_at: string;
  updated_at: string;
}

class EmpresaService {
  async findAllEmpresasByTenant(tenantId: string): Promise<Empresa[]> {
    // ... (código existente omitido para brevidade)
    if (!tenantId || typeof tenantId !== 'string') {
      console.error('ID do tenant inválido fornecido para findAllEmpresasByTenant:', tenantId);
      throw new Error('ID do tenant inválido.');
    }

    try {
      const { data, error } = await supabase
        .from('empresas')
        .select(`
          id,
          tenant_id,
          nome,
          cnpj,
          email,
          telefone,
          contato_principal,
          status,
          regime_tributario,
          created_at,
          updated_at
        `)
        .eq('tenant_id', tenantId)
        .order('nome', { ascending: true });

      if (error) {
        console.error(`Erro ao buscar empresas para o tenant ID ${tenantId}:`, error.message);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Exceção em EmpresaService.findAllEmpresasByTenant:', error);
      throw error;
    }
  }

  async findEmpresaById(empresaId: string): Promise<Empresa | null> {
    // ... (código existente omitido para brevidade)
    if (!empresaId || typeof empresaId !== 'string') {
      console.error('ID da empresa inválido fornecido para findEmpresaById:', empresaId);
      throw new Error('ID da empresa inválido.');
    }

    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error(`Erro ao buscar empresa com ID ${empresaId}:`, error.message);
        throw error;
      }

      return data as Empresa | null;
    } catch (error) {
      console.error('Exceção em EmpresaService.findEmpresaById:', error);
      throw error;
    }
  }

  /**
   * Cria uma nova empresa no banco de dados.
   * @param empresaData - Dados da empresa a ser criada, com tenant_id já validado e garantido.
   * @returns Promise<Empresa | null> - O objeto da empresa recém-criada. Lança erro em caso de falha.
   */
  async createEmpresa(empresaData: ProcessedCreateEmpresaDto): Promise<Empresa | null> {
    try {
      // O empresaData já deve vir com todos os campos necessários e validados pelo controller,
      // incluindo o tenant_id correto.
      const { data, error } = await supabase
        .from('empresas')
        .insert(empresaData) // Insere o objeto diretamente, pois ele já corresponde ao schema esperado.
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar empresa:', error.message);
        // Erros de constraint (ex: CNPJ duplicado, se houver constraint UNIQUE) serão lançados aqui.
        // O controller pode querer tratar códigos de erro específicos (ex: '23505' para unique_violation).
        throw error;
      }

      return data as Empresa | null;
    } catch (error) {
      console.error('Exceção em EmpresaService.createEmpresa:', error);
      throw error;
    }
  }

  // TODO: Implementar updateEmpresa e deleteEmpresa
  // async updateEmpresa(id: string, empresaData: UpdateEmpresaDto): Promise<Empresa | null> { ... }
  // async deleteEmpresa(id: string): Promise<boolean> { ... }
}

export default new EmpresaService();
