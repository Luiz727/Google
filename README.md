# Processo de Criação de um Projeto no Supabase

Esta documentação descreve os passos para criar um novo projeto na plataforma Supabase.

1.  **Acessar o Supabase:**
    *   Abra o seu navegador e acesse o site oficial: [https://supabase.com](https://supabase.com)

2.  **Login ou Criação de Conta:**
    *   Se você já possui uma conta, clique em "Login" e insira suas credenciais.
    *   Caso contrário, clique em "Start your project" ou "Sign up" para criar uma nova conta, seguindo as instruções fornecidas.

3.  **Iniciar um Novo Projeto:**
    *   Após o login, você será direcionado ao painel de controle (dashboard).
    *   Clique no botão "New Project" ou em uma opção similar para iniciar a criação de um novo projeto.

4.  **Selecionar Organização:**
    *   O Supabase utiliza organizações para agrupar projetos.
    *   Selecione uma organização existente na qual deseja criar o projeto.
    *   Se não tiver uma organização ou quiser criar uma nova, procure pela opção "Create new organization" e siga os passos.

5.  **Detalhes do Projeto:**
    *   **Nome do Projeto:** Insira um nome descritivo para o seu projeto. Por exemplo: `NixconPortalBackend`.
    *   **Senha do Banco de Dados (Database Password):** O Supabase irá gerar automaticamente um banco de dados Postgres para o seu projeto.
        *   Clique em "Generate a password" ou crie uma senha forte manualmente.
        *   **Importante:** Copie esta senha e guarde-a em um local seguro (como um gerenciador de senhas). Esta senha é crucial para acessar diretamente o seu banco de dados e não será exibida novamente pelo Supabase.
    *   **Região (Region):** Escolha a região onde os servidores do seu projeto estarão localizados. Selecionar uma região próxima aos seus usuários pode melhorar a latência. Por exemplo: `South America (Sao Paulo)`.
    *   **Plano (Pricing Plan):** Escolha o plano que melhor se adapta às suas necessidades. O Supabase geralmente oferece um plano gratuito ("Free tier") que é suficiente para muitos projetos iniciais e de desenvolvimento.

6.  **Criar o Projeto:**
    *   Revise todas as informações inseridas.
    *   Clique no botão "Create new project" ou "Create project".

7.  **Aguardar Provisionamento:**
    *   O Supabase levará alguns minutos para provisionar toda a infraestrutura do seu novo projeto (banco de dados, APIs, etc.).
    *   Após a conclusão, você será redirecionado para o painel do projeto recém-criado.

Com estes passos, seu projeto Supabase estará criado e pronto para ser configurado e utilizado. As informações de conexão, como URL do Projeto e chaves de API, estarão disponíveis no painel do projeto, geralmente na seção "Settings" > "API".
