import { supabase } from '../config/supabaseClient';
import { QueryTarefaDto, CreateTarefaDto, UpdateTarefaDto } from '../types/dtos/tarefa.dto';

export interface Tarefa {
  id: string;
  tenant_id: string;
  empresa_id?: string | null;
  empresa_nome_cache?: string | null;
  titulo: string;
  descricao?: string | null;
  responsavel_id?: string | null;
  responsavel_nome_cache?: string | null;
  prioridade?: string | null;
  prazo?: string | null;
  status?: string | null;
  data_conclusao?: string | null;
  criador_id?: string | null;
  criador_nome_cache?: string | null;
  recorrencia?: any | null;
  documentos_vinculados_cache?: any | null;
  created_at: string;
  updated_at: string;
}

class TarefaService {
  async findAllTarefas(tenantId: string, queryParams: QueryTarefaDto): Promise<Tarefa[]> {
    // ... (código existente omitido para brevidade)
    if (!tenantId || typeof tenantId !== 'string') { throw new Error('ID do tenant inválido para buscar tarefas.'); }
    try {
      let query = supabase.from('tarefas').select(`id, tenant_id, empresa_id, titulo, descricao, responsavel_id, responsavel_nome_cache, prioridade, prazo, status, data_conclusao, criador_id, criador_nome_cache, recorrencia, documentos_vinculados_cache, created_at, updated_at`).eq('tenant_id', tenantId);
      if (queryParams.empresa_id) { query = query.eq('empresa_id', queryParams.empresa_id); }
      if (queryParams.status) { query = query.eq('status', queryParams.status); }
      if (queryParams.responsavel_id) { query = query.eq('responsavel_id', queryParams.responsavel_id); }
      if (queryParams.prioridade) { query = query.eq('prioridade', queryParams.prioridade); }
      if (queryParams.prazo_min) { query = query.gte('prazo', queryParams.prazo_min); }
      if (queryParams.prazo_max) { query = query.lte('prazo', queryParams.prazo_max); }
      const sortBy = queryParams.sortBy || 'created_at';
      const sortOrder = queryParams.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      const page = queryParams.page || 1;
      const pageSize = queryParams.pageSize || 25;
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);
      const { data, error } = await query;
      if (error) { throw error; }
      return data || [];
    } catch (error) { console.error('Exceção em TarefaService.findAllTarefas:', error); throw error; }
  }

  async findTarefaById(tarefaId: string): Promise<Tarefa | null> {
    // ... (código existente omitido para brevidade)
    if (!tarefaId || typeof tarefaId !== 'string') { throw new Error('ID da tarefa inválido.'); }
    try {
      const { data, error } = await supabase.from('tarefas').select('*').eq('id', tarefaId).single();
      if (error) { if (error.code === 'PGRST116') { return null; } throw error; }
      return data as Tarefa | null;
    } catch (error) { console.error('Exceção em TarefaService.findTarefaById:', error); throw error; }
  }

  async createTarefa(tarefaData: CreateTarefaDto, criadorId: string): Promise<Tarefa | null> {
    // ... (código existente omitido para brevidade)
    if (!tarefaData.tenant_id) { throw new Error('tenant_id é obrigatório para criar uma tarefa.'); }
    if (!criadorId) { throw new Error('criador_id é obrigatório para criar uma tarefa.'); }
    if (!tarefaData.titulo) { throw new Error('Título é obrigatório para criar uma tarefa.'); }
    const dataToInsert = { ...tarefaData, criador_id: criadorId, status: tarefaData.status || 'PENDENTE', };
    try {
      const { data, error } = await supabase.from('tarefas').insert(dataToInsert).select().single();
      if (error) {
        if (error.code === '23503') {
            if (error.message.includes('tarefas_empresa_id_fkey')) { throw new Error(`Empresa com ID ${tarefaData.empresa_id} não encontrada no tenant especificado.`); }
            if (error.message.includes('tarefas_responsavel_id_fkey')) { throw new Error(`Responsável com ID ${tarefaData.responsavel_id} não encontrado.`); }
            if (error.message.includes('tarefas_tenant_id_fkey')) { throw new Error(`Tenant com ID ${tarefaData.tenant_id} não encontrado.`); }
        }
        throw error;
      }
      return data as Tarefa | null;
    } catch (error) { console.error('Exceção em TarefaService.createTarefa:', error); throw error; }
  }

  async updateTarefa(tarefaId: string, tarefaData: UpdateTarefaDto): Promise<Tarefa | null> {
    // ... (código existente omitido para brevidade)
    if (!tarefaId || typeof tarefaId !== 'string') { throw new Error('ID da tarefa inválido.'); }
    const { tenant_id, criador_id, ...dataToUpdate } = tarefaData as any;
    if (tenant_id !== undefined || criador_id !== undefined) { console.warn(`Tentativa de atualizar tenant_id ou criador_id para tarefa ${tarefaId} foi ignorada.`); }
    if (Object.keys(dataToUpdate).length === 0) { return this.findTarefaById(tarefaId); }
    try {
      const { data, error } = await supabase.from('tarefas').update(dataToUpdate).eq('id', tarefaId).select().single();
      if (error) {
        if (error.code === '23503') {
            if (error.message.includes('tarefas_empresa_id_fkey') && dataToUpdate.empresa_id) { throw new Error(`Empresa com ID ${dataToUpdate.empresa_id} não encontrada.`); }
            if (error.message.includes('tarefas_responsavel_id_fkey') && dataToUpdate.responsavel_id) { throw new Error(`Responsável com ID ${dataToUpdate.responsavel_id} não encontrado.`); }
        }
        throw error;
      }
      return data as Tarefa | null;
    } catch (error: any) { if (error.code === 'PGRST116') { return null; } throw error; }
  }

  /**
   * Deleta uma tarefa existente pelo ID.
   * @param tarefaId - O UUID da tarefa a ser deletada.
   * @returns Promise<boolean> - True se a deleção foi bem-sucedida (tarefa existia e foi deletada), false se a tarefa não foi encontrada. Lança erro em caso de falha na deleção.
   */
  async deleteTarefa(tarefaId: string): Promise<boolean> {
    if (!tarefaId || typeof tarefaId !== 'string') {
      console.error('ID da tarefa inválido fornecido para deleteTarefa:', tarefaId);
      throw new Error('ID da tarefa inválido.');
    }
    try {
      // A verificação de existência será feita no controller para fins de autorização antes de chamar este método.
      // Se este método for chamado, assume-se que a autorização já ocorreu e a tarefa existe.
      // No entanto, uma verificação dupla não faria mal ou pode-se confiar no resultado do delete.
      // Para consistência com deleteTenant, vamos manter a verificação aqui também.
      const tarefaExistente = await this.findTarefaById(tarefaId);
      if (!tarefaExistente) {
        return false; // Tarefa não encontrada.
      }

      const { error } = await supabase
        .from('tarefas')
        .delete()
        .eq('id', tarefaId);

      if (error) {
        console.error(`Erro ao deletar tarefa com ID ${tarefaId}:`, error.message);
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Exceção em TarefaService.deleteTarefa:', error);
      throw error;
    }
  }
}

export default new TarefaService();
