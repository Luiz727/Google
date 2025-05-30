// src/types/dtos/tenant.dto.ts

/**
 * Data Transfer Object para a criação de um novo Tenant.
 * Define a estrutura esperada dos dados no corpo da requisição.
 */
export interface CreateTenantDto {
  nome: string; // Nome do tenant, obrigatório.

  // Campos opcionais na criação. Se não fornecidos, podem assumir valores padrão no serviço ou banco.
  configuracoes_emissor?: any; // Ex: { certificado_id: 'uuid', regime_tributario: 'simples' }
  configuracoes_visuais?: any;  // Ex: { cor_primaria: '#FFFFFF', logo_url: '...' }
  configuracoes_modulos?: any; // Ex: { fiscal: true, contabil: false }

  // Outros campos que podem ser definidos na criação podem ser adicionados aqui.
  // Ex: cnpj?: string;
  // Ex: email_contato?: string;
}

/**
 * Data Transfer Object para a atualização de um Tenant.
 * Geralmente, todos os campos são opcionais na atualização.
 */
export interface UpdateTenantDto {
  nome?: string;
  configuracoes_emissor?: any;
  configuracoes_visuais?: any;
  configuracoes_modulos?: any;
  // Outros campos atualizáveis
}
