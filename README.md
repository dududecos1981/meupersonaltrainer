# 🏋️‍♂️ Sistema Personal Trainer Balbino Pro

Plataforma inteligente de prescrição de treinos, periodização biomecânica, nutrição esportiva e gestão de planilhas de evolução física na nuvem.

O projeto foi construído com arquitetura **100% Gratuita na Nuvem**, alta performance e **total conformidade com as normas e leis de segurança vigentes no Brasil**.

---

## ☁️ Arquitetura 100% Gratuita na Nuvem

Todo o ecossistema utiliza ferramentas de nível profissional sem custos de manutenção:

| Ferramenta | Finalidade | Plano / Custo |
| :--- | :--- | :--- |
| **[GitHub](https://github.com)** | Armazenamento de código-fonte, versionamento seguro e CI/CD | **100% Gratuito** |
| **[Neon Database](https://neon.tech)** | Banco de dados PostgreSQL Serverless & armazenamento de planilhas | **100% Gratuito** (0.5 GiB, branching, RLS) |
| **[Vercel](https://vercel.com)** | Hospedagem em nuvem global, SSL automático e acesso virtual web/mobile | **100% Gratuito** (Hobby Plan) |
| **[Google Gemini AI](https://aistudio.google.com)** | Co-piloto de inteligência artificial para prescrição esportiva | **100% Gratuito** (Google AI Studio) |

---

## 🛡️ Segurança & Conformidade com a Legislação Brasileira

O sistema atende rigorosamente aos padrões de proteção de dados e diretrizes regulatórias:

### 1. Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)
* **Dados Sensíveis de Saúde (Art. 5º, II e Art. 11):** Anamneses, histórico clínico, restrições articulares, peso e dobras cutâneas recebem consentimento formal expresso e tratamento confidencial exclusivo para prescrição de saúde.
* **Portabilidade de Dados (Art. 18, V):** Botão nativo na interface para exportar instantaneamente todos os dados do aluno em pacote aberto (`JSON` e planilha `CSV`).
* **Direito ao Esquecimento (Art. 18, VI):** Eliminação segura e definitiva de todos os registros do aluno mediante solicitação formal, gerando registro com justificativa.
* **Consentimento Registrado:** Marcação de timestamp e consentimento formal arquivado no banco.

### 2. Marco Civil da Internet (Lei nº 12.965/2014, Art. 15)
* **Trilha de Auditoria Permanente:** Registro automático de data, hora, operador, recurso acessado e ação efetuada em conformidade com o dever de guarda de registros.

### 3. Segurança Técnica (OWASP & Boas Práticas)
* **Row Level Security (RLS):** Isolamento criptográfico no PostgreSQL para garantir que cada personal trainer acesse estritamente os seus próprios pacientes e fichas.
* **Consultas Parametrizadas:** Proteção completa contra *SQL Injection*.
* **Sanitização de Entradas:** Proteção contra *Cross-Site Scripting (XSS)*.
* **Cabeçalhos de Segurança HTTP no `vercel.json`:** `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security (HSTS)` e `Permissions-Policy`.

---

## 🚀 Guia Passo a Passo de Configuração e Deploy

### Passo 1: Criar o Repositório no GitHub
1. Acesse [github.com/new](https://github.com/new) e crie um novo repositório (pode ser **Público** ou **Privado**).
2. No seu computador, vincule o repositório e envie o código:
```bash
git remote set-url origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git add .
git commit -m "feat: Sistema Personal Trainer com Neon PostgreSQL e LGPD"
git branch -M main
git push -u origin main
```

### Passo 2: Criar o Banco de Dados Gratuito no Neon
1. Acesse [console.neon.tech](https://console.neon.tech) e faça login com sua conta do GitHub.
2. Clique em **"Create Project"** (escolha a região `US East (Ohio)` ou `US East (N. Virginia)`).
3. No painel inicial do projeto, copie a **Connection String** no formato:
   ```
   postgres://usuario:senha@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. No sistema (aba **Neon PostgreSQL & Nuvem** ou nas Configurações), cole a string de conexão e clique em **"Testar & Salvar Conexão"**.
5. Clique em **"Executar Migrações / DDL"** para criar automaticamente todas as tabelas, índices e políticas de segurança RLS no banco Neon em 1 clique!

### Passo 3: Publicar Gratuitamente na Vercel
1. Acesse [vercel.com](https://vercel.com) e conecte com seu GitHub.
2. Clique em **"Add New..."** &rarr; **"Project"** e selecione o repositório do projeto.
3. No formulário de importação:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Na seção **Environment Variables**, adicione:
   - `VITE_NEON_DATABASE_URL` = *(sua connection string do Neon)*
   - `VITE_GEMINI_API_KEY` = *(sua chave da API Gemini)*
5. Clique em **"Deploy"**. Em segundos, seu acesso virtual estará publicado com HTTPS seguro!

### Passo 4: Obter a Chave Gratuita do Google Gemini
1. Acesse [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
2. Crie uma chave de API gratuita e insira nas Configurações do Sistema.

---

## 📊 Gestão de Planilhas e Métricas na Nuvem

O sistema possui uma aba dedicada de **Planilhas & Métricas** que permite:
* Criar tabelas de acompanhamento esportivo (Evolução de Cargas 1RM, Circunferências Corporais, Frequência Semanal e Diário Nutricional).
* **Exportação para Excel/CSV:** Arquivos gerados com UTF-8 BOM para abrir formatados no Microsoft Excel e Google Sheets.
* **Importação de Planilhas CSV:** Leitura de arquivos locais e persistência direta na nuvem Neon PostgreSQL.
* **Sincronização em Tempo Real:** Sincronização automática entre o cache local e o servidor de banco de dados.

---

## 💻 Desenvolvimento Local

```bash
# 1. Instalar dependências
npm install

# 2. Executar servidor local de desenvolvimento
npm run dev

# 3. Executar suíte de testes automatizados (Vitest)
npm test

# 4. Validar integridade e tipagem TypeScript
npm run type-check

# 5. Gerar pacote de produção
npm run build
```

---

## ⚖️ Licença
Distribuído sob a licença **MIT**.
