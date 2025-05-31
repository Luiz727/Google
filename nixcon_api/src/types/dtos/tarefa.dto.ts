// src/types/dtos/tarefa.dto.ts

import { FuncaoUsuario } from '../enums'; // Supondo que FuncaoUsuario está em enums.ts

// Interface base para representar uma Tarefa (pode ser similar à entidade do banco)
export interface TarefaDto {
  id: string;
  tenant_id: string;
  empresa_id?: string | null; // ID da empresa cliente, se aplicável
  empresa_nome_cache?: string | null; // Nome da empresa cliente (denormalizado)
  titulo: string;
  descricao?: string | null;
  responsavel_id?: string | null; // ID do usuário (profile) responsável
  responsavel_nome_cache?: string | null; // Nome do responsável (denormalizado)
  prioridade?: string | null; // Ex: 'ALTA', 'MEDIA', 'BAIXA'
  prazo?: string | null; // ISO Date string
  status?: string | null; // Ex: 'PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA'
  data_conclusao?: string | null; // ISO Date string
  criador_id?: string | null; // ID do usuário (profile) que criou
  criador_nome_cache?: string | null; // Nome do criador (denormalizado)
  recorrencia?: any | null; // JSONB com configurações de recorrência
  documentos_vinculados_cache?: any | null; // JSONB com array de documentos
  created_at: string; // ISO Date string
  updated_at: string; // ISO Date string
}

// DTO para criar uma nova Tarefa
export interface CreateTarefaDto {
  tenant_id: string; // Definido pelo controller/serviço baseado no usuário
  empresa_id?: string;
  titulo: string;
  descricao?: string;
  responsavel_id?: string;
  // responsavel_nome_cache será preenchido pelo backend
  prioridade?: string;
  prazo?: string; // ISO Date string
  status?: string; // Geralmente 'PENDENTE' na criação
  // criador_id e criador_nome_cache serão preenchidos pelo backend
  recorrencia?: any;
  documentos_vinculados_cache?: any;
}

// DTO para atualizar uma Tarefa (todos os campos relevantes são opcionais)
export interface UpdateTarefaDto {
  empresa_id?: string | null;
  titulo?: string;
  descricao?: string | null;
  responsavel_id?: string | null;
  prioridade?: string | null;
  prazo?: string | null; // ISO Date string
  status?: string | null;
  data_conclusao?: string | null;
  recorrencia?: any | null;
  documentos_vinculados_cache?: any | null;
}

// DTO para filtros de consulta de Tarefas
export interface QueryTarefaDto {
  tenant_id?: string; // Usado pelo SuperAdmin para especificar o tenant
  empresa_id?: string;
  status?: string;
  responsavel_id?: string;
  prazo_min?: string; // ISO Date string
  prazo_max?: string; // ISO Date string
  prioridade?: string;
  sortBy?: 'prazo' | 'prioridade' | 'created_at' | 'status'; // Campos para ordenação
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  // Outros filtros relevantes podem ser adicionados
}
