# Sistema Personal Trainer Balbino

Estrutura completa de Banco de Dados PostgreSQL (com Row Level Security) e Engenharia de Prompts para Agentes de IA especialistas em prescrição de treinos, planejamento nutricional esportivo e ajustes finos.

---

## 📁 Estrutura do Projeto

```text
├── schema.sql                   # DDL completo do PostgreSQL com RLS e Índices
├── seed.sql                     # Dados de exemplo para testes imediatos
├── package.json                 # Configuração do projeto Node/TypeScript
├── tsconfig.json                # Configuração do compilador TypeScript
└── src/
    ├── index.ts                 # Exportação unificada
    ├── types/
    │   ├── database.ts          # Tipos TypeScript espelhando o PostgreSQL
    │   └── ai.ts                # Tipos de entrada e saída dos Agentes IA
    ├── prompts/
    │   ├── workoutPrompt.ts     # Prompt 2: Prescrição de Treino Físico
    │   ├── nutritionPrompt.ts   # Prompt 3: Prescrição de Plano Alimentar
    │   └── adjustmentPrompt.ts  # Prompt 4: Edição e Ajustes Finos
    └── services/
        └── aiService.ts         # Serviço unificado de integração com Gemini / OpenAI
```

---

## 🗄️ 1. Banco de Dados PostgreSQL (Prompt 1)

O script [`schema.sql`](./schema.sql) cria a arquitetura relacional completa com isolamento de dados por Personal via **Row Level Security (RLS)**.

### Tabelas Criadas:
1. **`personais`**: Cadastro e credenciais dos personais (`id`, `nome`, `email`, `cref`, `created_at`).
2. **`pacientes`**: Alunos vinculados ao personal (`id`, `personal_id`, `nome`, `email`, `telefone`, `data_nascimento`, `sexo`).
3. **`exercicios`**: Biblioteca de exercícios com grupo muscular, equipamento e instruções.
4. **`fichas_treino`**: Fichas associadas ao personal e aluno com período de validade.
5. **`itens_treino`**: Exercícios de cada ficha com divisões (Treino A, B, C), séries, repetições, carga, descanso e ordem (`ON DELETE CASCADE`).
6. **`avaliacoes_fisicas`**: Histórico antropométrico, bioimpedância, dobras cutâneas (`jsonb`) e perímetros (`jsonb`).
7. **`planos_alimentares`**: Cardápios e metas de calorias/macronutrientes estruturados com status e refeições (`jsonb`).

### Execução no Neon ou Supabase:
1. Abra o [Neon Console](https://console.neon.tech) ou [Supabase Dashboard](https://supabase.com/dashboard).
2. Acesse a aba **SQL Editor**.
3. Copie e cole o conteúdo de [`schema.sql`](./schema.sql) e clique em **Run**.
4. (Opcional) Execute o [`seed.sql`](./seed.sql) para popular o banco com dados de teste.

---

## 🤖 2. Prompts dos Agentes de IA

### Prompt 2 — Prescrição de Treino Físico
- **Arquivo**: [`src/prompts/workoutPrompt.ts`](./src/prompts/workoutPrompt.ts)
- **Função**: Gera divisões de treino (A/B, Push/Pull/Legs) com séries, repetições, tempos de descanso e observações de execução técnica biomecanicamente seguras.
- **Saída**: JSON puro formatado com títulos, divisões e lista de exercícios.

### Prompt 3 — Prescrição de Plano Alimentar Esportivo
- **Arquivo**: [`src/prompts/nutritionPrompt.ts`](./src/prompts/nutritionPrompt.ts)
- **Função**: Calcula o superávit/déficit calórico, divide os macronutrientes (proteína, carboidrato, gordura) e estrutura o cardápio distribuído estrategicamente em torno do horário de treino.
- **Saída**: JSON puro com metas calóricas, macros e array de refeições.

### Prompt 4 — Edição e Ajustes Finos (Comandos em Linguagem Natural)
- **Arquivo**: [`src/prompts/adjustmentPrompt.ts`](./src/prompts/adjustmentPrompt.ts)
- **Função**: Permite ao Personal Trainer realizar modificações em linguagem natural (ex: *"Troque o supino reto por halteres de 16kg e aumente 20g de proteína no pós-treino"*), preservando o restante da estrutura JSON intacta.

---

## 🚀 Como Utilizar o Serviço de IA em Código

```typescript
import { PersonalTrainerAIService } from './src/services/aiService';

const aiService = new PersonalTrainerAIService({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-1.5-pro'
});

// 1. Gerar Treino
const treino = await aiService.generateWorkoutPlan({
  nome_aluno: 'Carlos Silva',
  idade: 28,
  genero: 'Masculino',
  peso: 78.5,
  altura: 178,
  nivel_experiencia: 'INTERMEDIARIO',
  objetivo_principal: 'HIPERTROFIA',
  frequencia_semanal: 4,
  equipamentos_disponiveis: 'ACADEMIA_COMPLETA',
  lesoes_ou_dores: 'Leve desconforto no ombro direito em abdução máxima'
});

// 2. Aplicar Ajuste Fino
const treinoAjustado = await aiService.applyAdjustment({
  json_atual: treino,
  instrucao_do_personal: 'Troque o Supino Reto por Supino Reto com Halteres e coloque 4 séries de 10 a 12'
});
```

---

## 🔐 3. Autenticação do Sistema (Prompt 5 — Supabase Auth)

O sistema conta com um módulo robusto de autenticação e gestão de perfil de Personal Trainers via **Supabase Auth** e persistência síncrona na tabela pública `personais`.

- **Arquivo do Serviço**: [`src/services/authService.ts`](./src/services/authService.ts)
- **Telas**: Login & Cadastro responsivos com alternador de abas, medidor de força de senha e visualização de credenciais.

### 🛡️ Funcionalidades Implementadas:
1. **Cadastro Completo**: Validação em tempo real de Nome, CREF (Registro Profissional obrigatório), E-mail e Senha (mínimo 6 dígitos com confirmação de senha).
2. **Sincronização com a tabela `personais`**: 
   - No Supabase: Trigger `handle_new_personal_user()` captura os metadados do `auth.users` e insere/atualiza no `public.personais`.
   - Na aplicação: Chamada `upsert` defensiva garantindo persistência imediata mesmo em ambientes híbridos.
3. **Gestão de Sessão Persistente**: Reconhecimento automático de sessão ativa ao abrir a plataforma, redirecionando imediatamente para o Dashboard.
4. **Modo Demonstração Integrado**: Botão de acesso em 1 clique com conta de demonstração do Personal Balbino para testes ágeis.
5. **Segurança (RLS)**: Isolamento estrito de visualização e edição de registros onde `auth.uid() = personal_id`.

---

## 🚀 4. DevOps, Segurança & Pipeline CI/CD para Produção

### ⚙️ Arquitetura de Build & Performance
- **Bundler**: Vite 8 + ESBuild com minificação e divisão de chunks (`manualChunks` para isolar `@supabase/supabase-js`).
- **Validação de Tipos**: `npm run type-check` (`tsc --noEmit`) executado antes de cada build.
- **Cache de Assets**: Cabeçalho `Cache-Control: public, max-age=31536000, immutable` configurado no [`vercel.json`](./vercel.json) e [`netlify.toml`](./netlify.toml).

### 🔒 Segurança & Hardening
1. **Auditoria RLS**: Políticas estritas em todas as 7 tabelas do PostgreSQL (`auth.uid() = personal_id`).
2. **Cabeçalhos HTTP de Segurança**:
   - `X-Frame-Options: DENY` (Proteção contra Clickjacking)
   - `X-Content-Type-Options: nosniff` (Prevenção de MIME-sniffing)
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (HSTS)
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
3. **Proteção de API & Rate Limiting**: Limitador de requisições integrado em [`src/services/healthCheck.ts`](./src/services/healthCheck.ts).

### 🔄 Pipeline de CI/CD (GitHub Actions)
O workflow [`.github/workflows/ci-cd.yml`](./.github/workflows/ci-cd.yml) é disparado automaticamente a cada push nas branches `main` (produção) e `develop` (staging):
1. Instalação determinística de dependências.
2. Checagem estrita de tipos TypeScript.
3. Geração do bundle de produção com validação de variáveis de ambiente.
4. Armazenamento seguro de artefatos de build.

