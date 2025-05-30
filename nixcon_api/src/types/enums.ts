// src/types/enums.ts

/**
 * Define as funções (roles) dos usuários no sistema.
 * Estes valores devem ser consistentes com o que é armazenado no campo 'funcao' da tabela 'profiles'.
 */
export enum FuncaoUsuario {
  SUPERADMIN = 'SuperAdmin', // Acesso total ao sistema, gerenciamento de escritórios.
  ADMIN_ESCRITORIO = 'AdminEscritorio', // Administrador de um escritório de contabilidade (tenant).
  USUARIO_ESCRITORIO = 'UsuarioEscritorio', // Usuário padrão de um escritório (contador, etc.).
  ADMIN_CLIENTE = 'AdminCliente', // Administrador de uma empresa cliente (gerencia usuários da sua empresa).
  USUARIO_CLIENTE = 'UsuarioCliente', // Usuário padrão de uma empresa cliente.

  // As funções abaixo podem ser consideradas para cenários mais complexos ou futuros:
  // USUARIO_EXTERNO_CLIENTE = 'UsuarioExternoCliente', // Ex: Um consultor que acessa dados de um cliente específico.
  // CONTADOR_EXTERNO_CLIENTE = 'ContadorExternoCliente' // Ex: Um contador autônomo que não é do escritório principal mas atende um cliente.
}

// Outros enums podem ser adicionados aqui conforme necessário.
// Exemplo:
// export enum StatusTarefa {
//   PENDENTE = 'PENDENTE',
//   EM_ANDAMENTO = 'EM_ANDAMENTO',
//   CONCLUIDA = 'CONCLUIDA',
//   CANCELADA = 'CANCELADA',
// }
