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

## 7. Exemplo de Implementação de Backend para Funcionalidade de Processamento de Texto (IA)

Esta seção documenta um exemplo de como criar um backend simples em Node.js com Express para processar texto enviado pelo frontend. Este backend pode ser usado como base para funcionalidades que envolvem IA, como a sugestão de descrição de tarefas.

### 7.1. Solicitação do Frontend

O frontend (Google AI Studio Build) solicitou o seguinte:

> 🧩 **Funcionalidade:**
> 
> *   Tenho um botão/formulário que envia um texto do usuário.
> *   Preciso que esse texto seja enviado para um endpoint backend via POST, como por exemplo `/mensagem`.
> *   O backend deve receber um JSON com `{ "texto": "exemplo" }`
> *   Deve responder com `{ "resposta": "Texto recebido: exemplo" }`
> 
> 📦 **Requisitos técnicos:**
> 
> *   Crie um backend em Node.js com Express
> *   Use estrutura simples, com `index.js` e, se possível, um arquivo de rota separado
> *   Use `express.json()` para processar o corpo da requisição
> *   Não use banco de dados por enquanto — armazene em memória
> *   Forneça o código completo pronto para rodar
> 
> 🚀 **Deploy:**
> 
> *   Me mostre como publicar esse backend no CloudRun
> *   Me indique o link que devo usar para chamar esse backend (exemplo: `https://meu-backend.repl.co/mensagem`)
> 
> 🔗 **Integração:**
> 
> *   Mostre um exemplo de código `fetch()` que posso usar aqui no frontend (Google Build) para me conectar com esse backend
> 
> 🧠 **Lembre-se:**
> 
> *   Fale comigo como se eu fosse um frontend esperando sua ajuda para funcionar corretamente
> *   Responda com código 100% pronto para copiar e colar

### 7.2. Implementação do Backend (Node.js com Express)

#### 7.2.1. Estrutura de Pastas

```
meu-backend-simples/
├── package.json
├── index.js
└── Dockerfile
```

#### 7.2.2. `package.json`

```json
{
  "name": "simple-message-backend",
  "version": "1.0.0",
  "description": "Backend simples para processar mensagens de texto.",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### 7.2.3. `index.js`

```javascript
const express = require('express');
const cors = require('cors'); // Para permitir requisições de diferentes origens
const app = express();

// O Cloud Run define a variável de ambiente PORT.
// Para desenvolvimento local, podemos usar 8080.
const port = process.env.PORT || 8080;

// Habilita CORS para todas as rotas
app.use(cors());

// Middleware para processar o corpo da requisição como JSON
app.use(express.json());

// Rota POST para /mensagem
app.post('/mensagem', (req, res) => {
  const textoRecebido = req.body.texto;

  if (textoRecebido === undefined) { // Verifica se a propriedade 'texto' existe
    return res.status(400).json({ error: "O campo 'texto' é obrigatório no corpo da requisição." });
  }

  console.log(`Texto recebido: ${textoRecebido}`);
  res.status(200).json({ resposta: `Texto recebido: ${textoRecebido}` });
});

// Uma rota GET para a raiz, apenas para testar se o servidor está no ar
app.get('/', (req, res) => {
  res.send('Backend está funcionando!');
});

app.listen(port, () => {
  console.log(`Backend ouvindo na porta ${port}`);
});
```

**Para rodar localmente:**

1.  Navegue até a pasta `meu-backend-simples` no seu terminal.
2.  Execute `npm install` para instalar as dependências (`express` e `cors`).
3.  Execute `npm start` para iniciar o servidor.
4.  Você poderá testar o endpoint `POST /mensagem` usando uma ferramenta como Postman ou curl, enviando um JSON como `{"texto": "Olá do Postman"}` para `http://localhost:8080/mensagem`.

### 7.3. Deploy no Google Cloud Run

#### 7.3.1. `Dockerfile`

```dockerfile
# Use uma imagem Node.js oficial como base. Escolha uma versão LTS estável.
FROM node:18-slim

# Defina o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copie os arquivos package.json e package-lock.json (se existir)
# Isso aproveita o cache de camadas do Docker se as dependências não mudarem
COPY package*.json ./

# Instale as dependências da aplicação
RUN npm install --only=production

# Copie o restante do código da aplicação para o diretório de trabalho
COPY . .

# Exponha a porta que sua aplicação usa (deve ser a mesma que o servidor Express escuta)
EXPOSE 8080

# Comando para iniciar sua aplicação quando o container iniciar
CMD [ "npm", "start" ]
```

#### 7.3.2. Comandos para Deploy (usando Google Cloud SDK - `gcloud`)

No seu terminal, na pasta `meu-backend-simples`:

*   **Defina o ID do seu projeto GCP (substitua `SEU_PROJECT_ID`):**
    ```bash
    gcloud config set project SEU_PROJECT_ID
    ```

*   **Construa a imagem do container e envie para o Google Container Registry (GCR) ou Artifact Registry:**
    (Substitua `NOME_DO_SERVICO` por um nome para seu serviço, ex: `meu-servico-mensagens`)
    ```bash
    gcloud builds submit --tag gcr.io/SEU_PROJECT_ID/NOME_DO_SERVICO
    ```

*   **Faça o deploy da imagem no Cloud Run:**
    ```bash
    gcloud run deploy NOME_DO_SERVICO \
      --image gcr.io/SEU_PROJECT_ID/NOME_DO_SERVICO \
      --platform managed \
      --region SUA_REGIAO \
      --allow-unauthenticated \
      --port 8080
    ```
    *   Substitua `SUA_REGIAO` pela região desejada (ex: `us-central1`, `southamerica-east1`).
    *   `--allow-unauthenticated` permite que qualquer um chame seu endpoint. Se precisar de autenticação, remova esta flag e configure o IAM.
    *   `--port 8080` especifica a porta que seu container expõe, conforme definido no `Dockerfile` e no `index.js`.

#### 7.3.3. URL do Serviço

Após o deploy bem-sucedido, o Cloud Run fornecerá uma URL para o seu serviço. Será algo como:
`https://NOME_DO_SERVICO-XXXXXXXXXX-XX.a.run.app`

### 7.4. Integração Frontend (Google Build)

Substitua `SUA_URL_DO_CLOUD_RUN` pela URL obtida no passo anterior.

```javascript
// Função de exemplo para chamar o backend
async function enviarMensagemParaBackend(textoParaEnviar) {
  const backendUrl = 'SUA_URL_DO_CLOUD_RUN/mensagem'; // Ex: https://meu-servico-mensagens-abcdef-uc.a.run.app/mensagem

  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ texto: textoParaEnviar }),
    });

    if (!response.ok) {
      // Se o status não for 2xx, trata como erro
      const errorData = await response.json(); // Tenta pegar o corpo do erro, se houver
      console.error('Erro na resposta do backend:', response.status, errorData);
      throw new Error(`Erro do backend: ${response.status} - ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log('Resposta do backend:', data);
    return data.resposta; // Retorna a mensagem de resposta do backend

  } catch (error) {
    console.error('Falha ao enviar mensagem para o backend:', error);
    // Aqui você pode mostrar uma mensagem de erro para o usuário no seu frontend
    throw error; // Re-lança o erro para que quem chamou a função possa tratar também
  }
}

// Exemplo de como usar a função:
// Suponha que você tem um input e um botão no seu HTML/React/Vue etc.
// E o texto do input está na variável 'textoDoUsuario'
/*
enviarMensagemParaBackend(textoDoUsuario)
  .then(respostaDoBackend => {
    // Faça algo com a resposta, ex: exibir na tela
    console.log("Sucesso:", respostaDoBackend);
    alert(`Backend respondeu: ${respostaDoBackend}`);
  })
  .catch(erro => {
    // Trate o erro, ex: exibir uma mensagem de falha
    console.error("Falha na comunicação:", erro);
    alert(`Erro ao comunicar com o backend: ${erro.message}`);
  });
*/
```
Lembre-se de que o uso do `cors` no backend é fundamental.

---
*Este documento será a base para o desenvolvimento do Portal Grupo Nixcon 4.0, sendo atualizado conforme o progresso e novas informações.*
---
*As instruções acima sobre o backend devem ser usadas como referência e ponto de partida para a criação conjunta de funcionalidades entre o frontend (Google AI Studio Build) e o backend (a ser desenvolvido pelo assistente de IA especializado em backend).*
