# 💰 Sistema Financeiro DEBAJEYU

Um sistema completo de gestão financeira desenvolvido para controle de sócios, investimentos e pré-saldos. Construído com tecnologias modernas e interface intuitiva.

## 🚀 Funcionalidades

### 📊 Dashboard
- **Visão Geral Completa**: Cards com totais de pré-saldos, investimentos e saldos a receber
- **Pré-Saldos por Sócio**: Cards individuais com navegação direta para detalhes
- **Investimentos por Sócio**: Visualização dos totais investidos por cada sócio
- **Resumo Detalhado**: Tabela com situação financeira completa de cada sócio
- **Últimos Investimentos**: Lista dos 10 investimentos mais recentes
- **Navegação Inteligente**: Clique nos cards para filtrar automaticamente nas páginas específicas

### 👥 Gestão de Sócios
- **CRUD Completo**: Criar, visualizar, editar e excluir sócios
- **Pré-Saldos**: Controle individual dos pré-saldos de cada sócio
- **Sistema de Filtros**: Filtro por sócio específico via URL parameters
- **Navegação Integrada**: Acesso direto via cards do Dashboard
- **Interface Responsiva**: Adaptável a diferentes tamanhos de tela

### 💼 Gestão de Investimentos
- **Registro Detalhado**: Data, descrição, setor, valor e observações
- **Vinculação com Sócios**: Cada investimento é associado a um sócio específico
- **Filtros Avançados**: Filtro por sócio com persistência na URL
- **Cards Interativos**: Visualização dos totais por sócio com filtro ao clicar
- **Histórico Completo**: Lista completa de todos os investimentos

### 🔐 Sistema de Autenticação
- **Login Seguro**: Autenticação via Supabase Auth
- **Proteção de Rotas**: Acesso restrito a usuários autenticados
- **Sessão Persistente**: Manutenção da sessão do usuário

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca principal para interface
- **TypeScript** - Tipagem estática para maior segurança
- **Vite** - Build tool moderna e rápida
- **React Router DOM** - Roteamento e navegação
- **Tailwind CSS** - Framework CSS utilitário
- **Radix UI** - Componentes acessíveis e customizáveis
- **Lucide React** - Ícones modernos e consistentes
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **Zustand** - Gerenciamento de estado global

### Backend & Database
- **Supabase** - Backend as a Service (BaaS)
- **PostgreSQL** - Banco de dados relacional
- **Row Level Security (RLS)** - Segurança a nível de linha
- **Real-time subscriptions** - Atualizações em tempo real

### Ferramentas de Desenvolvimento
- **ESLint** - Linting e padronização de código
- **PostCSS** - Processamento de CSS
- **Autoprefixer** - Prefixos CSS automáticos

## 📦 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### 1. Clone o repositório
```bash
git clone https://github.com/JE4NVRG/financeiro-debajeyu.git
cd financeiro-debajeyu
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 4. Configure o banco de dados
Execute as migrações SQL no seu projeto Supabase:
- `001_create_tables.sql` - Criação das tabelas
- `002_enable_rls.sql` - Habilitação do RLS
- Demais arquivos de migração conforme necessário

### 5. Execute o projeto
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── layout/         # Componentes de layout (Sidebar, Layout)
│   └── ui/             # Componentes de interface (Button, Card, etc.)
├── contexts/           # Contextos React (AuthContext)
├── hooks/              # Hooks customizados (useBRLMask, useTheme)
├── lib/                # Utilitários e configurações
│   ├── auth.ts         # Funções de autenticação
│   ├── supabase.ts     # Cliente e tipos do Supabase
│   └── utils.ts        # Funções utilitárias
├── pages/              # Páginas da aplicação
│   ├── Dashboard.tsx   # Página principal com resumos
│   ├── Investimentos.tsx # Gestão de investimentos
│   ├── Socios.tsx      # Gestão de sócios
│   ├── Login.tsx       # Página de login
│   └── Home.tsx        # Página inicial
└── assets/             # Recursos estáticos
```

## 🎨 Características da Interface

### Design System
- **Cores Consistentes**: Paleta harmoniosa com verde para pré-saldos, azul para investimentos
- **Tipografia**: Hierarquia clara com diferentes pesos e tamanhos
- **Espaçamento**: Grid system responsivo e espaçamentos consistentes
- **Componentes**: Biblioteca de componentes reutilizáveis baseada em Radix UI

### Experiência do Usuário
- **Navegação Intuitiva**: Sidebar fixa com navegação clara
- **Feedback Visual**: Toasts para ações do usuário, loading states
- **Responsividade**: Interface adaptável para desktop, tablet e mobile
- **Acessibilidade**: Componentes acessíveis com suporte a teclado e screen readers

## 🔄 Fluxo de Dados

1. **Autenticação**: Login via Supabase Auth
2. **Dashboard**: Carregamento de dados agregados de sócios e investimentos
3. **Navegação**: Filtros automáticos via URL parameters
4. **CRUD Operations**: Operações em tempo real com feedback imediato
5. **Sincronização**: Dados sempre atualizados via Supabase real-time

## 🚦 Scripts Disponíveis

```bash
npm run dev          # Inicia o servidor de desenvolvimento
npm run build        # Gera build de produção
npm run preview      # Visualiza o build de produção
npm run lint         # Executa o linter
npm run check        # Verifica tipos TypeScript
```

## 🤝 Como Contribuir

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**Jean Vargas** - [JE4NVRG](https://github.com/JE4NVRG)

---

⭐ Se este projeto te ajudou, considere dar uma estrela no repositório!
