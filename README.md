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

```bash
# Instalar dependências
bun install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Firebase

# Iniciar em desenvolvimento
bun run dev

# Build para produção
bun run build

# Iniciar servidor de produção
bun start
```

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
