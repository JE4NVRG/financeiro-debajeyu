# PRD - Financeiro DEBAJEYU

## 1. Product Overview

Sistema completo de controle financeiro para gestão de investimentos, pré-saldos entre 3 sócios (Jean, Yuri, Bárbara), entradas de marketplaces e despesas com fornecedores. O sistema permite controle abrangente de receitas e despesas com rastreamento detalhado de pagamentos.

O produto resolve o problema de controle financeiro compartilhado entre sócios, oferecendo visibilidade clara dos investimentos, saldos, receitas de marketplaces e despesas com fornecedores, incluindo controle de fiado e pagamentos parciais, facilitando a gestão financeira colaborativa completa.

## 2. Core Features

### 2.1 User Roles

| Role | Registration Method | Core Permissions |
|------|---------------------|------------------|
| Usuário Admin | Pré-cadastrado no sistema | Acesso completo a todas as funcionalidades, visualização de dados de todos os sócios |

### 2.2 Feature Module

Nosso sistema financeiro consiste nas seguintes páginas principais:

1. **Página de Login**: autenticação simples com usuário e senha.
2. **Dashboard**: cards de resumo financeiro, listagem dos últimos lançamentos, totais de fornecedores.
3. **Investimentos**: listagem completa de investimentos, formulário de novo lançamento.
4. **Contas**: gestão de contas bancárias, entradas e saídas, integração com fornecedores.
5. **Marketplaces**: gestão de marketplaces e entradas de vendas.
6. **Fornecedores**: gestão de fornecedores, compras e pagamentos, controle de fiado.
7. **Sócios**: listagem de pré-saldos, formulário de novo lançamento.

### 2.3 Page Details

| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| Login | Formulário de Autenticação | Validar credenciais (usuário e senha), redirecionar para dashboard após sucesso, exibir mensagens de erro |
| Dashboard | Cards de Resumo | Exibir totais de investimentos, pré-saldos, total em aberto de fornecedores e pagamentos do mês em cards visuais |
| Dashboard | Últimos Lançamentos | Listar os 10 lançamentos mais recentes (investimentos, pré-saldos, entradas e pagamentos) com data, tipo, sócio e valor |
| Investimentos | Listagem de Investimentos | Exibir tabela com data, descrição, setor, sócio, valor e observação, filtros e ordenação |
| Investimentos | Novo Lançamento | Modal com formulário completo (data, descrição, setor, sócio, valor, observação), validação e salvamento |
| Contas | Gestão de Contas | Exibir saldo atual, entradas e saídas da conta Cora, integração com fornecedores |
| Contas | Saídas da Conta | Tabela de saídas com data, fornecedor, compra, valor, observação, lançado por e quando, modal nova saída |
| Marketplaces | Gestão de Marketplaces | CRUD de marketplaces, listagem de entradas por marketplace, cálculo de comissões |
| Marketplaces | Entradas de Vendas | Tabela de entradas com data, marketplace, valor, comissão, modal nova entrada |
| Fornecedores | Resumo Geral | Cards com gasto total, pago e em aberto de todos os fornecedores |
| Fornecedores | Listagem de Fornecedores | Tabela com nome, tipo, gasto, pago, em aberto, status e ações, modal novo fornecedor |
| Fornecedores | Detalhe do Fornecedor | Cards específicos do fornecedor, abas de compras e pagamentos |
| Fornecedores | Aba Compras | Tabela de compras com data, descrição, categoria, valor total, pago, em aberto, status e ações, modal nova compra |
| Fornecedores | Aba Pagamentos | Tabela de pagamentos com data, conta, valor, observação, lançado por, lançado em e ações |
| Fornecedores | Nova Compra | Modal com data, descrição, categoria, valor total, forma (à vista/fiado), vencimento opcional |
| Sócios | Listagem de Pré-Saldos | Exibir tabela com data, sócio, valor e observação, filtros e ordenação |
| Sócios | Novo Lançamento | Modal com formulário (data, sócio, valor, observação), validação e salvamento |
| Menu Lateral | Navegação | Links para Dashboard, Investimentos, Contas, Marketplaces, Fornecedores, Sócios e Sair, indicador de página ativa |

## 3. Core Process

**Fluxo Principal do Usuário:**

1. Usuário acessa a página de login e insere credenciais
2. Sistema valida e redireciona para o dashboard
3. No dashboard, usuário visualiza resumo financeiro completo e últimos lançamentos
4. Usuário navega entre módulos através do menu lateral: Investimentos, Contas, Marketplaces, Fornecedores, Sócios
5. Em cada módulo, usuário pode visualizar listagens existentes ou criar novos lançamentos
6. Novos lançamentos são criados através de modais com formulários específicos
7. No módulo Fornecedores, usuário pode gerenciar compras fiado e registrar pagamentos parciais
8. Na página Contas, usuário pode registrar saídas vinculadas a fornecedores e compras
9. Usuário pode fazer logout através do menu lateral

**Fluxo Específico de Fornecedores:**

1. Usuário cadastra fornecedor com tipo e observações
2. Registra compra (à vista ou fiado) vinculada ao fornecedor
3. Se fiado, pode registrar múltiplos pagamentos parciais
4. Sistema calcula automaticamente saldo em aberto e status da compra
5. Pagamentos podem ser registrados via página Contas (saídas) ou diretamente no fornecedor

```mermaid
graph TD
    A[Página de Login] --> B[Dashboard]
    B --> C[Investimentos]
    B --> D[Contas]
    B --> E[Marketplaces]
    B --> F[Fornecedores]
    B --> G[Sócios]
    
    F --> H[Lista Fornecedores]
    F --> I[Detalhe Fornecedor]
    H --> J[Novo Fornecedor]
    I --> K[Aba Compras]
    I --> L[Aba Pagamentos]
    K --> M[Nova Compra]
    
    D --> N[Saídas da Conta]
    N --> O[Nova Saída]
    O --> P[Vincula Fornecedor/Compra]
    
    B --> Q[Logout]
    Q --> A
```

## 4. User Interface Design

### 4.1 Design Style

- **Cores Primárias**: Azul (#3B82F6) para elementos principais, Verde (#10B981) para valores positivos
- **Cores Secundárias**: Cinza (#6B7280) para textos secundários, Branco (#FFFFFF) para fundos
- **Estilo de Botões**: Arredondados com sombra sutil, hover com transição suave
- **Fonte**: Inter ou system-ui, tamanhos 14px (corpo), 16px (títulos), 24px (cabeçalhos)
- **Layout**: Card-based com sidebar fixa, design limpo e minimalista
- **Ícones**: Lucide React icons, estilo outline, tamanho 20px padrão

### 4.2 Page Design Overview

| Page Name | Module Name | UI Elements |
|-----------|-------------|-------------|
| Login | Formulário de Autenticação | Card centralizado, campos de input com labels, botão primário azul, fundo gradiente sutil |
| Dashboard | Cards de Resumo | Grid 3x1 de cards com ícones, valores em destaque, cores diferenciadas por tipo |
| Dashboard | Últimos Lançamentos | Tabela responsiva com zebra striping, badges para tipos, formatação de moeda BRL |
| Investimentos | Listagem | Tabela com header fixo, paginação, botão "Novo Lançamento" destacado no topo direito |
| Investimentos | Modal Novo Lançamento | Modal overlay, formulário em duas colunas, botões de ação no rodapé |
| Pré-Saldo | Listagem | Mesmo padrão da tabela de investimentos, adaptado para menos campos |
| Menu Lateral | Navegação | Sidebar fixa 240px, logo no topo, itens com ícones, indicador visual de página ativa |

### 4.3 Responsiveness

O produto é desktop-first com adaptação mobile. Em telas menores (< 768px), o menu lateral se torna um drawer colapsável. Tabelas se tornam scrolláveis horizontalmente e modais ocupam toda a tela. Todos os elementos mantêm usabilidade em dispositivos touch.