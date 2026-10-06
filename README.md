# 🎓 ProClass - Sistema de Gestão de Aulas

Sistema completo para professores particulares gerenciarem alunos, aulas, finanças e desempenho. Construído com **Next.js 16**, **Firebase** e **Tailwind CSS 4**.

## ✨ Funcionalidades

### 📊 Dashboard
- Visão geral com métricas de alunos ativos, aulas concluídas, receita mensal e previsão total
- Seletor de mês para navegar entre períodos
- Alertas de pagamentos pendentes e vencidos
- Próximas aulas nos próximos 7 dias

### 👨‍🎓 Alunos
- Cadastro completo com nome, e-mail, telefone, responsável, disciplina, turma e valor da mensalidade
- Busca e filtros por status, disciplina e turma
- Controle de aulas contratadas e tempo de estudo

### 📅 Aulas
- Calendário mensal com aulas codificadas por cor (agendada, concluída, cancelada, remarcada)
- Gerenciamento de ciclos de aulas com marcadores de "Fim do Ciclo"
- Lançamento de conteúdo abordado e observações
- Relatórios e download

### 💰 Financeiro
- Controle de pagamentos de alunos com tabela ordenável
- Geração automática de pagamentos pendentes
- Resumo com total recebido, pendente e em atraso
- Mensalidades de professores (plataforma)

### 📈 BI & Analytics
- Gráficos de tendência de receita (Recharts)
- Distribuição de alunos e taxas de conclusão de aulas
- Rankings de alunos por aulas e retenção
- Alertas inteligentes

### 👑 Painel Administrativo
- Gerenciamento de professores e permissões (admin/teacher)
- Controle de expiração de contrato e isenção de mensalidade
- Definição de senha via API
- Importação de dados do sistema legado (Base44)
- Geração de dados fictícios para testes
- Backup completo em JSON com filtros por professor/alunos

## 🚀 Tecnologias

| Categoria | Tecnologia |
|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Linguagem** | TypeScript 5 |
| **Banco de Dados** | Firebase Firestore |
| **Autenticação** | Firebase Auth + Firebase Admin SDK |
| **Estado/Cache** | TanStack React Query |
| **Estilização** | Tailwind CSS 4 + shadcn/ui |
| **Animações** | Framer Motion |
| **Ícones** | Lucide React |
| **Gráficos** | Recharts |
| **Datas** | date-fns (locale ptBR) |
| **Notificações** | Sonner |
| **Tema** | next-themes (dark/light) |
| **Runtime** | Bun |
| **Deploy** | Next.js Standalone + Caddy |

## 🚀 Início Rápido

### 1. Instalar dependências

```bash
npm install
# ou, se preferir Bun:
# bun install
```

### 2. Configurar as variáveis de ambiente

```bash
cp .env.example .env.local
```

Depois abra o `.env.local` e preencha com os dados do seu projeto Firebase:

| Variável | Onde encontrar | Quando é necessária |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → ⚙️ Configurações do projeto → Seus apps → app Web | Sempre |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | idem | Sempre |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | idem | Sempre |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | idem | Sempre |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | idem | Sempre |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | idem | Sempre |
| `FIREBASE_CLIENT_EMAIL` | ⚙️ Configurações do projeto → **Contas de serviço** → Gerar nova chave privada | Só para criar/excluir usuários no `/admin` |
| `FIREBASE_PRIVATE_KEY` | idem (campo `private_key` do JSON baixado) | Só para criar/excluir usuários no `/admin` |

> As seis `NEXT_PUBLIC_*` são **públicas** — ficam embutidas no bundle do navegador, é normal que apareçam nas ferramentas de desenvolvedor.
> Já `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY` são **secretas**: o acesso ao Firestore é controlado pelas regras (`firestore.rules`), não por elas.
> O `.env.local` é ignorado pelo Git, então suas credenciais nunca são versionadas.

### 3. Rodar o projeto

```bash
# Desenvolvimento em http://localhost:3000
npm run dev

# Build de produção (gera o .next/standalone)
npm run build

# Servidor de produção
npm start
```

> **Fallback WebAssembly:** em ambientes restritos, onde o binário nativo do SWC não carrega, use `npm run dev:wasm`.
>
> **Bun:** o script `npm start` executa `bun .next/standalone/server.js`, então o start de produção exige o Bun instalado. Se preferir Node, rode `NODE_ENV=production node .next/standalone/server.js`. O desenvolvimento e o build funcionam com qualquer um dos dois.

## 📁 Estrutura

```
src/
├── app/                  # Páginas (App Router)
│   ├── page.tsx          # Dashboard
│   ├── login/            # Autenticação
│   ├── admin/            # Painel administrativo
│   ├── students/         # Gerenciamento de alunos
│   ├── lessons/          # Gerenciamento de aulas
│   ├── finance/          # Financeiro
│   ├── bi/               # Business Intelligence
│   ├── teachers/         # Professores
│   ├── teacher-payments/ # Mensalidades de professores
│   └── api/              # API Routes
├── components/           # Componentes React
│   └── ui/               # Componentes shadcn/ui
├── contexts/             # Contextos (AuthContext)
├── hooks/                # Hooks customizados
├── lib/                  # Utilitários e Firebase
└── providers/            # Providers (ThemeProvider)
```

## 📄 Licença

Projeto privado — todos os direitos reservados.
