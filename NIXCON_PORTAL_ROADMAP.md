
# Portal Grupo Nixcon 4.0 - Roadmap e Diretrizes

## 1. Visão Geral do Projeto

**Descrição:** Um sistema SaaS multitenant para escritórios de contabilidade, projetado para ser uma solução completa, abrangendo desde a gestão de tarefas, documentos e comunicação com clientes, até funcionalidades fiscais, contábeis, de folha de pagamento, patrimônio, Lalur, auditoria e EFD Contribuições, inspirado nas capacidades do "Domínio Sistemas".

**Objetivo Principal:** Facilitar a gestão completa de escritórios de contabilidade e a interação com seus clientes, centralizando informações e processos em uma plataforma moderna, intuitiva, integrada e em conformidade com as práticas contábeis e fiscais brasileiras.

## 2. Funcionalidades Chave do Sistema (Planejadas e Existentes em Estágio Inicial)

O portal visa incorporar as seguintes funcionalidades principais:

*   **Módulo Contabilidade (Baseado no Domínio Contábil Plus 10):** Gestão completa de transações contábeis, plano de contas, lançamentos, conciliação, apuração de resultados, relatórios (Balancetes, DRE, Balanço, etc.), livros oficiais (Diário, Razão) e geração de SPED Contábil (ECD) e SPED ECF.
*   **Módulo Lalur (Livro de Apuração do Lucro Real):**
    *   **Status:** Em Desenvolvimento - Fase Inicial (Estrutura da Página e Placeholder).
    *   **Detalhes Planejados:** Escrituração do e-Lalur e e-Lacs (Parte A: adições, exclusões, compensações; Parte B: controle de valores que afetam períodos futuros como prejuízos fiscais), apuração de IRPJ e CSLL para Lucro Real, controle e compensação de prejuízos fiscais, e geração dos livros e demonstrativos correspondentes. As especificações detalhadas do "Domínio Sistemas" (Fichas, etc.) estão sendo usadas como guia.
*   **Módulo Patrimônio (Baseado no Domínio Patrimônio):**
    *   **Status:** Em Desenvolvimento - Fase Inicial (Estrutura da Página e Placeholder).
    *   **Detalhes Planejados:** Cadastro e controle detalhado de bens do ativo imobilizado, cálculo de depreciação/amortização (fiscal e societária), gestão de CIAP, PIS/COFINS sobre imobilizado, baixas, transferências, e relatórios patrimoniais. As especificações detalhadas do "Domínio Sistemas" estão sendo usadas como guia.
    *   **Integração:** Com Contabilidade (lançamentos automáticos) e Fiscal (créditos).
*   **Módulo Auditoria (Baseado no Domínio Auditoria):** Rastreamento detalhado de alterações no sistema (inclusões, alterações, exclusões), configuração granular da auditoria, e relatórios de auditoria flexíveis para segurança e conformidade. Logs seguros e invioláveis. As especificações detalhadas do "Domínio Sistemas" estão sendo usadas como guia.
*   **Módulo EFD Contribuições:**
    *   **Status:** Em Aprimoramento (Especificações Detalhadas Recebidas - Análise e Incorporação).
    *   **Detalhes Identificados:** Parametrização da empresa (Regime Apuração, Tipo Escrituração, Leiaute, Natureza PJ, Atividade Preponderante), Configuração de Produtos/Serviços (CST PIS/COFINS Entrada/Saída, Natureza Receita, Alíquotas Específicas). Apuração de PIS/COFINS. Geração do arquivo EFD Contribuições (incluindo configurações internas como guia Contas, PIS sobre Folha e Bloco P INSS). Histórico de Arquivos Gerados. As especificações detalhadas do "Domínio Sistemas" estão sendo usadas como guia.
*   **Módulo Folha de Pagamento (Inspirado no Domínio Folha):**
    *   **Status:** Em Aprimoramento (Especificações Completas Recebidas - Análise e Incorporação).
    *   **Detalhes Identificados:** Cobertura completa desde cadastros essenciais (Empresas, Perfis, Sócios, etc.) até processos de cálculo (Folha, 13º, Férias, Rescisão), relatórios e eSocial. As especificações detalhadas do "Domínio Sistemas" estão sendo usadas como guia.
*   **Módulo Escrita Fiscal (Inspirado no Domínio Escrita Fiscal - DETALHADO):**
    *   **Status:** Em Aprimoramento Contínuo (Especificações Detalhadas Recebidas e Sendo Incorporadas).
    *   **Detalhes Abrangentes:** Cobertura extensa de configurações (Parâmetros da Empresa), cadastros fiscais (Produtos, Acumuladores, Impostos), lançamento de notas (Entradas, Saídas, Serviços, Reduções Z, etc. com todas as suas guias e subguias detalhadas, incluindo Estoque, SPED, Contabilidade, Parcelas, etc.), apuração de impostos, e geração de diversas obrigações acessórias. A importação de documentos fiscais (NF-e, NFC-e, CT-e, etc.) é uma funcionalidade central, com configurações detalhadas por tipo de documento e operação. As especificações detalhadas do "Domínio Sistemas" (menus Controle, Arquivos, Movimentos, Relatórios, Utilitários) estão sendo usadas como guia.
    *   **Apuração do Simples Nacional (Baseado na LC 123/2006 e Resoluções CGSN):**
        *   Configuração dos parâmetros da empresa para o Simples Nacional (RBT12, FS12, Anexo de enquadramento, alíquota ISS municipal).
        *   Cálculo do Fator R (FS12/RBT12) para enquadramento correto entre Anexos III e V.
        *   Cálculo da alíquota efetiva conforme tabelas dos Anexos I a V.
        *   Detalhamento da composição da alíquota efetiva (percentuais de IRPJ, CSLL, Cofins, PIS, CPP, ICMS, ISS).
        *   Apuração mensal do valor devido no DAS (Documento de Arrecadação do Simples Nacional).
        *   Geração da guia DAS (simulada e/ou com integração futura para emissão).
        *   Preparação de dados e/ou geração da DEFIS (Declaração de Informações Socioeconômicas e Fiscais).
        *   Consideração de sublimites estaduais para ICMS/ISS (em fases posteriores).
        *   Tratamento para segregação de receitas (isenção, ST, monofásico - em fases posteriores).
    *   **Obrigações Acessórias Geradas/Gerenciadas (detalhamento adicional abaixo):**
        *   SPED Fiscal (ICMS/IPI)
        *   EFD-Reinf
        *   Sintegra
        *   DCTF (Mensal, Trimestral, Semestral)
        *   DACON (histórico)
        *   DNF (Declaração de Notas Fiscais)
        *   CFEM (Compensação Financeira pela Exploração de Recursos Minerais)
        *   DIRF (Declaração do Imposto de Renda Retido na Fonte - modelos antigo e novo)
        *   DIPJ (Declaração de Informações Econômico-Fiscais da Pessoa Jurídica - com Fichas)
        *   PJSI (Declaração Simplificada da Pessoa Jurídica Inativa ou Simples Nacional)
        *   DASN (Declaração Anual do Simples Nacional)
        *   GIA Estadual / GIA-ST (Guia de Informação e Apuração do ICMS)
        *   Outras obrigações estaduais e municipais específicas (a serem mapeadas).
*   **Módulo EFD-Reinf:**
    *   **Status:** Especificações Recebidas - Planejamento Detalhado.
    *   **Detalhes Planejados:** Configuração completa (Outros Dados), seleção e envio de eventos de tabela, periódicos e não periódicos (R-1000 a R-3010), gestão de Boletim Financeiro (para R-3010), tratamento de INSS-RET Construção Civil, consulta de envios e conclusão de atividades.
*   **Módulo Sintegra:**
    *   **Status:** Especificações Recebidas - Planejamento Detalhado.
    *   **Detalhes Planejados:** Geração do arquivo mensal com todas as opções configuráveis (finalidade, natureza, produtos, inventário, ECFs), incluindo Posse de Produtos e emissão de GNRE.
*   **Módulo DCTF (Mensal, Trimestral, Semestral):**
    *   **Status:** Especificações Recebidas - Planejamento Detalhado.
    *   **Detalhes Planejados:** Geração das declarações com todas as configurações de "Outros Dados" (regime, forma de tributação, qualificação, situação especial, etc.) para os diferentes períodos.
*   **Módulo DACON:**
    *   **Status:** Especificações Recebidas - Planejamento Detalhado.
    *   **Detalhes Planejados:** Geração do informativo (observando o limite de 01/2008) com todas as configurações de "Outros Dados".
*   **Módulo DNF (Declaração de Notas Fiscais):**
    *   **Status:** Especificações Recebidas - Planejamento Detalhado.
    *   **Detalhes Planejados:** Geração de arquivo ou relatório da DNF.
*   **Módulo CFEM (Compensação Financeira pela Exploração de Recursos Minerais):**
    *   **Status:** Especificações Recebidas - Planejamento Detalhado.
    *   **Detalhes Planejados:** Geração de relatórios Anexo I e II.
*   **Módulo DIRF (Declaração do Imposto de Renda Retido na Fonte):**
    *   **Status:** Especificações Recebidas - Planejamento Detalhado.
    *   **Detalhes Planejados:** Suporte aos modelos "Até 2009" e "A partir de 2010", com todas as configurações de "Outros Dados" (incluindo guias Folha, Escrita Fiscal, SCP) e geração de formulário ou arquivo.
*   **Módulo DIPJ (Declaração de Informações Econômico-Fiscais da Pessoa Jurídica):**
    *   **Status:** Especificações Recebidas - Planejamento Detalhado.
    *   **Detalhes Planejados:** Geração do informativo (foco no modelo 2014), incluindo a configuração detalhada das Fichas (04A a 70) com importação de saldos da contabilidade e LALUR, e todas as opções da Guia Geral.
*   **Módulo PJSI (Declaração Simplificada da Pessoa Jurídica Inativa ou Simples Nacional):**
    *   **Status:** Especificações Recebidas - Planejamento Detalhado.
    *   **Detalhes Planejados:** Geração do informativo (foco no modelo 2008) com as guias Geral, Refis/Paes-R10 e Sócios.
*   **Módulo DASN (Declaração Anual do Simples Nacional):**
    *   **Status:** Especificações Recebidas - Planejamento Detalhado.
    *   **Detalhes Planejados:** Geração do relatório ou preenchimento no site da Receita (foco no modelo 2012), com as guias Geral, Sócios, Doações Eleitorais, Econômicas e Fiscais, Mudança de Município.
*   **Módulo Consultoria Tributária Inteligente:**
    *   **Status:** Em Desenvolvimento - Fase Inicial (Estrutura da Página e Placeholder).
    *   **Detalhes Planejados:** Auditoria de notas fiscais, validação de NCM, impostos, benefícios fiscais, parametrizações, códigos e inconsistências, cruzando com dados do CNAE da empresa. Utilizará o banco de dados da empresa e suporte de Inteligência Artificial para buscas avançadas e otimização tributária.
*   **Módulo Cadastro de CNAEs:**
    *   **Status:** Em Desenvolvimento - Fase Inicial (Estrutura da Página e Placeholder).
    *   **Detalhes Planejados:** Cadastro de CNAEs, descrição, relação com códigos de serviço (LC 116/03), indicação do Anexo do Simples Nacional, e se permite MEI.
*   **Módulo de Tarefas/Processos:**
    *   **Status:** Em Aprimoramento (Especificações Recebidas - Melhorias no Módulo Existente).
    *   **Detalhes:** Gestão hierárquica de Processos e Atividades, com modelos, responsáveis, prazos, status, vinculação a clientes e relatórios. Melhorias baseadas nas especificações do "Domínio Processos".
*   **Módulo de Honorários:**
    *   **Status:** Em Aprimoramento (Especificações Recebidas - Melhorias no Módulo Existente).
    *   **Detalhes:** Gestão de contratos de honorários, faturamento, e controle financeiro específico para o escritório. Melhorias baseadas nas especificações do "Domínio Honorários".
*   **Módulo de Administração IntegraContador (SERPRO):**
    *   **Status:** Em Desenvolvimento - Fase Inicial (Estrutura da Página e Placeholder).
    *   **Detalhes Planejados:** Configuração e gerenciamento da integração com a API IntegraContador do SERPRO. Permitirá configurar credenciais, acompanhar logs de integração, e gerenciar o status das conexões para emissão de guias de tributos (DAS, DARF, etc.) e outras consultas.
*   **Funcionalidades Gerais da Plataforma (Existentes e Planejadas):**
    *   Dashboard Geral (com Impostômetro).
    *   Gestão de Empresas Clientes.
    *   Calendário Integrado.
    *   Gestão de Documentos (Gerais, Modelos, Geração).
    *   Assinatura Eletrônica (simulada).
    *   Comunicações (Chat Interno, Canais Cliente, Chatbot IA simulado).
    *   Financeiro Básico (Contas a Pagar/Receber, Fluxo de Caixa – simulados).
    *   Emissão de Notas Fiscais (NFe, NFSe, NFCe - simulada, com fluxo para IntegraNotas).
    *   Organizador de XMLs (simulado).
    *   Simulação de Impostos (com cálculo para Simples Nacional, Lucro Presumido e Real).
    *   Conciliador Bancário (simulado).
    *   Controle de Estoque (Cadastro e Movimentação).
    *   Painel de KPIs (placeholder).
    *   Relatórios Gerais (conforme especificações do Domínio, exemplo: Guias DARF, GPS, DAS).
    *   Configurações Gerais (Emissor do Escritório, Usuários do Escritório, Identidade Visual, Configurações de Módulos da Plataforma).
    *   Autenticação e RBAC.
    *   Personificação.
    *   Tema Claro/Escuro.
    *   Troca de Senha, Troca de Usuário, Sair do Sistema.
    *   Utilitários da Plataforma: Backup/Restauração Global, Atualização de Software, Gerenciamento de Conexões, Configuração de E-mail, Importador (Leiautes Antigos, Dados de Outra Empresa, Padrão XML/TXT), Exportador, Conversão de Municípios, Limpeza de Arquivos, Alteração de Notas/Produtos/Tipo Atividade, Geração de Parcelas, Exclusão de Parcelas, Geração de Bases de Impostos por Parcela, Atualização de Impostos no Cadastro de Produtos (NCM), Inclusão de Código de Atividade para INSS RB, Inclusão Simples Nacional nos Acumuladores, Inclusão SCP nas Notas, Vincular Acumuladores nas Parcelas Não Recebidas, Limpeza Base Testes EFD-Reinf, Menu Favoritos, Configurar Conexão Internet, Consulta Apuração, Conferência de Lançamentos, Alterar Cadastro Clientes/Fornecedores (Data, Município, Regime Apuração, Contribuinte CPRB), Excluir Contas, Registro de Atividades (F9), Calculadora (F12).
    *   Central de Ajuda.

## 3. Diretrizes de Desenvolvimento Futuro (Base Módulos Domínio)
*(As seções 3.1 a 3.12 do roadmap anterior permanecem válidas, com o Módulo Escrita Fiscal agora detalhado acima na seção 2. A numeração será ajustada para manter a consistência).*

## 4. Roteiro de Desenvolvimento (Roadmap Geral)
*(Permanece válido, com foco iterativo nos módulos detalhados)*

## 5. Status das Especificações Detalhadas (Baseadas nos Prompts/PDFs Domínio)
As especificações para os módulos **Escrita Fiscal** (incluindo **Simples Nacional**), **Folha de Pagamento**, **Patrimônio**, **Lalur**, **Auditoria**, **EFD Contribuições**, **EFD-Reinf**, **Sintegra**, **DCTF**, **DACON**, **DNF**, **CFEM**, **DIRF**, **DIPJ**, **PJSI** e **DASN** foram recebidas em formato detalhado (inspirado nos PDFs do Domínio Sistemas) e estão sendo analisadas e incorporadas ao planejamento de cada módulo. O nível de detalhe fornecido é extenso e servirá como uma base sólida para o desenvolvimento, cobrindo configurações, cadastros, lançamentos, apurações, relatórios e geração de arquivos/obrigações.

## 6. Diretrizes Estratégicas e Expansão Futura
*(Permanece válido, e será enriquecido à medida que os módulos core são desenvolvidos)*

---
*Este documento será a base para o desenvolvimento do Portal Grupo Nixcon 4.0, sendo atualizado conforme o progresso e novas informações.*
