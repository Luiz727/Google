import { LogAuditoria, TipoAcaoAuditoria, ModuloSistemaAuditavel, Usuario } from '../types';

const STORAGE_KEY_AUDIT_LOGS_PREFIX = 'nixconPortalAuditLogs_';
const MAX_LOGS_PER_TENANT = 200;

interface LogActionParams {
  acao: TipoAcaoAuditoria;
  modulo?: ModuloSistemaAuditavel;
  descricao: string;
  tenantId: string; // ID do escritório que "possui" o log
  usuario?: Usuario | null; // Usuário que realizou a ação
  usuarioEmail?: string; // Email do usuário, para casos onde o objeto Usuario completo não está disponível
  entidadeId?: string;
  dadosAntigos?: any;
  dadosNovos?: any;
  contextoEmpresaClienteId?: string;
  contextoEmpresaClienteNome?: string;
  ipOrigem?: string; // Mock por enquanto
}

export const logAction = ({
  acao,
  modulo,
  descricao,
  tenantId,
  usuario,
  usuarioEmail, // Added to parameters
  entidadeId,
  dadosAntigos,
  dadosNovos,
  contextoEmpresaClienteId,
  contextoEmpresaClienteNome,
  ipOrigem = '127.0.0.1',
}: LogActionParams): void => {
  if (!tenantId) {
    console.warn("LogService: Tentativa de log sem tenantId do escritório.");
    return;
  }

  const newLog: LogAuditoria = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    usuarioId: usuario?.id,
    usuarioNome: usuario?.nome,
    usuarioEmail: usuario?.email || usuarioEmail, // Use email from Usuario object if present, otherwise use passed usuarioEmail
    acao,
    modulo,
    entidadeId,
    descricao,
    dadosAntigos: dadosAntigos ? JSON.stringify(dadosAntigos) : undefined,
    dadosNovos: dadosNovos ? JSON.stringify(dadosNovos) : undefined,
    ipOrigem,
    tenantId, // tenantId do escritório
    contextoEmpresaClienteId,
    contextoEmpresaClienteNome,
  };

  const storageKey = `${STORAGE_KEY_AUDIT_LOGS_PREFIX}${tenantId}`;
  let logs: LogAuditoria[] = [];
  try {
    const storedLogs = localStorage.getItem(storageKey);
    if (storedLogs) {
      logs = JSON.parse(storedLogs);
    }
  } catch (error) {
    console.error("LogService: Erro ao ler logs do localStorage", error);
    logs = [];
  }

  logs.unshift(newLog); // Adiciona no início para ter os mais recentes primeiro

  if (logs.length > MAX_LOGS_PER_TENANT) {
    logs = logs.slice(0, MAX_LOGS_PER_TENANT); // Mantém apenas os N mais recentes
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(logs));
  } catch (error) {
    console.error("LogService: Erro ao salvar logs no localStorage", error);
  }
};

export const getLogs = (tenantId: string): LogAuditoria[] => {
  if (!tenantId) {
    return [];
  }
  const storageKey = `${STORAGE_KEY_AUDIT_LOGS_PREFIX}${tenantId}`;
  try {
    const storedLogs = localStorage.getItem(storageKey);
    return storedLogs ? JSON.parse(storedLogs) : [];
  } catch (error) {
    console.error("LogService: Erro ao buscar logs do localStorage", error);
    return [];
  }
};