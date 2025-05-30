// src/types/dtos/empresa.dto.ts

// Interface base para representar uma Empresa (pode ser similar à entidade do banco)
export interface EmpresaDto {
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
  data_inicio_contrato?: string | null; // ISO Date string
  data_fim_contrato?: string | null; // ISO Date string
  endereco?: any | null; // JSONB
  cpf_responsavel_legal?: string | null;
  tipo_empresa_simulacao?: string | null;
  configuracoes_emissor?: any | null; // JSONB
  configuracoes_efd?: any | null; // JSONB
  created_at: string; // ISO Date string
  updated_at: string; // ISO Date string
}

// DTO para criar uma nova Empresa, como recebido no corpo da requisição.
// O tenant_id é opcional aqui porque sua definição/validação é feita no controller
// com base na role do usuário. O serviço, no entanto, esperará um DTO com tenant_id preenchido.
export interface CreateEmpresaRequestBodyDto {
  nome: string; // Obrigatório
  cnpj: string; // Obrigatório
  tenant_id?: string; // SuperAdmin DEVE fornecer. AdminEscritorio NÃO DEVE, ou deve ser igual ao seu.

  email?: string;
  telefone?: string;
  contato_principal?: string;
  status?: string; // Ex: 'ATIVA', 'INATIVA'
  regime_tributario?: string; // Ex: 'Simples Nacional', 'Lucro Presumido'
  honorarios?: number;
  dia_vencimento_honorarios?: number; // 1-31
  data_inicio_contrato?: string; // ISO Date string
  data_fim_contrato?: string; // ISO Date string
  endereco?: any; // Estrutura de Endereco
  cpf_responsavel_legal?: string;
  tipo_empresa_simulacao?: string;
  configuracoes_emissor?: any;
  configuracoes_efd?: any;
}

// DTO para dados que o serviço de criação de empresa efetivamente usará (com tenant_id garantido)
export interface ProcessedCreateEmpresaDto extends Omit<CreateEmpresaRequestBodyDto, 'tenant_id'> {
  tenant_id: string;
}


// DTO para atualizar uma Empresa (todos os campos são opcionais)
export interface UpdateEmpresaDto {
  nome?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  contato_principal?: string;
  status?: string;
  regime_tributario?: string;
  honorarios?: number;
  dia_vencimento_honorarios?: number;
  data_inicio_contrato?: string;
  data_fim_contrato?: string;
  endereco?: any;
  cpf_responsavel_legal?: string;
  tipo_empresa_simulacao?: string;
  configuracoes_emissor?: any;
  configuracoes_efd?: any;
}
