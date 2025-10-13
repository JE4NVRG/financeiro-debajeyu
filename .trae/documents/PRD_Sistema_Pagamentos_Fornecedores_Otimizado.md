# PRD - Sistema de Pagamentos de Fornecedores Otimizado

## 1. Product Overview

Sistema otimizado para gerenciamento de pagamentos de fornecedores com foco em flexibilidade e agilidade operacional. Permite pagamentos parciais recorrentes e pagamentos totais com desconto automático da conta Cora.

- **Problema a resolver**: Fornecedores trabalham com fiado (ex: Luna com R$ 17.201 em aberto), necessitando pagamentos parciais frequentes (R$ 4.000, R$ 5.000) e opção de quitação total rápida.
- **Público-alvo**: Operadores financeiros que gerenciam pagamentos de fornecedores com diferentes modalidades de pagamento.
- **Valor do produto**: Reduzir tempo de lançamento de pagamentos em 70% e eliminar erros manuais no controle de saldos.

## 2. Core Features

### 2.1 User Roles

| Role | Registration Method | Core Permissions |
|------|---------------------|------------------|
| Operador Financeiro | Login existente no sistema | Pode lançar pagamentos, visualizar saldos, gerenciar contas |
| Administrador | Acesso completo | Todas as permissões + configurações do sistema |

### 2.2 Feature Module

Nosso sistema de pagamentos otimizado consiste nas seguintes páginas principais:

1. **Página de Fornecedores**: listagem de fornecedores com saldos em aberto, ações rápidas de pagamento.
2. **Modal de Pagamento Rápido**: interface simplificada para pagamentos totais com desconto automático.
3. **Modal de Pagamento Parcial**: formulário para valores customizados com histórico visual.
4. **Histórico de Pagamentos**: visualização completa de todos os pagamentos realizados por fornecedor.

### 2.3 Page Details

| Page Name | Module Name | Feature description |
|-----------|-------------|---------------------|
| Página de Fornecedores | Lista de Saldos em Aberto | Exibe fornecedores com valores pendentes, saldo atual, botões "Pagar Tudo" e "Pagamento Parcial" |
| Página de Fornecedores | Ações Rápidas | Botões de ação direta na listagem: "Pagar Tudo" (verde) e "Pagamento Parcial" (azul) |
| Modal de Pagamento Rápido | Confirmação de Pagamento Total | Checkbox "Foi pago?", seleção automática da conta Cora, confirmação do valor total |
| Modal de Pagamento Rápido | Validação de Saldo | Verifica saldo suficiente na conta Cora antes de processar o pagamento |
| Modal de Pagamento Parcial | Formulário de Valor Customizado | Campo para valor personalizado, seleção de conta, observações |
| Modal de Pagamento Parcial | Histórico Visual | Mostra pagamentos anteriores, saldo restante, progresso visual |
| Histórico de Pagamentos | Lista de Transações | Exibe todos os pagamentos por fornecedor com data, valor, conta utilizada |
| Histórico de Pagamentos | Filtros e Busca | Filtro por período, fornecedor, tipo de pagamento (total/parcial) |

## 3. Core Process

### Fluxo de Pagamento Total (Operador Financeiro)
1. Acessa lista de fornecedores com saldos em aberto
2. Clica em "Pagar Tudo" no fornecedor desejado
3. Modal abre com checkbox "Foi pago?" já marcado
4. Sistema automaticamente:
   - Define valor como saldo total aberto
   - Seleciona conta Cora por padrão
   - Valida saldo suficiente na conta
5. Confirma o pagamento
6. Sistema registra transação e atualiza saldos

### Fluxo de Pagamento Parcial (Operador Financeiro)
1. Acessa lista de fornecedores com saldos em aberto
2. Clica em "Pagamento Parcial" no fornecedor desejado
3. Modal abre mostrando histórico de pagamentos anteriores
4. Insere valor personalizado (ex: R$ 4.000 de R$ 17.201)
5. Seleciona conta de origem
6. Adiciona observações se necessário
7. Confirma o pagamento
8. Sistema atualiza saldo restante e histórico

```mermaid
graph TD
    A[Lista de Fornecedores] --> B{Tipo de Pagamento?}
    B -->|Pagar Tudo| C[Modal Pagamento Total]
    B -->|Pagamento Parcial| D[Modal Pagamento Parcial]
    
    C --> E[Checkbox "Foi pago?"]
    E --> F[Validar Saldo Cora]
    F --> G[Processar Pagamento Total]
    
    D --> H[Inserir Valor Customizado]
    H --> I[Selecionar Conta]
    I --> J[Processar Pagamento Parcial]
    
    G --> K[Atualizar Saldos]
    J --> K
    K --> L[Histórico Atualizado]
```

## 4. User Interface Design

### 4.1 Design Style
- **Cores primárias**: Verde (#22c55e) para "Pagar Tudo", Azul (#3b82f6) para "Pagamento Parcial"
- **Cores secundárias**: Cinza (#6b7280) para textos, Vermelho (#ef4444) para alertas
- **Estilo de botões**: Rounded (border-radius: 6px), com ícones intuitivos
- **Fonte**: Inter, tamanhos 14px (corpo), 16px (títulos), 12px (legendas)
- **Layout**: Card-based com espaçamento consistente, navegação top
- **Ícones**: Lucide React - dinheiro, check, histórico, alerta

### 4.2 Page Design Overview

| Page Name | Module Name | UI Elements |
|-----------|-------------|-------------|
| Lista de Fornecedores | Cards de Saldo | Cards brancos com sombra sutil, nome do fornecedor em negrito, saldo em destaque (R$ 17.201,00), botões de ação alinhados à direita |
| Lista de Fornecedores | Botões de Ação | "Pagar Tudo" (verde, ícone check), "Pagamento Parcial" (azul, ícone dinheiro), hover com elevação |
| Modal Pagamento Total | Checkbox Principal | Checkbox grande "Foi pago?" com label em negrito, cor verde quando marcado |
| Modal Pagamento Total | Resumo do Pagamento | Card com fundo cinza claro, valor total destacado, conta Cora pré-selecionada |
| Modal Pagamento Parcial | Campo de Valor | Input com máscara de moeda (R$), validação em tempo real, placeholder "Ex: R$ 4.000,00" |
| Modal Pagamento Parcial | Histórico Visual | Timeline vertical com pagamentos anteriores, datas, valores, saldo restante em destaque |
| Histórico de Pagamentos | Tabela Responsiva | Colunas: Data, Valor, Conta, Tipo, Status, com ordenação e paginação |

### 4.3 Responsiveness
- **Desktop-first** com adaptação mobile
- **Breakpoints**: 768px (tablet), 640px (mobile)
- **Mobile**: Botões empilhados verticalmente, modals em tela cheia
- **Touch optimization**: Botões com altura mínima 44px, espaçamento adequado para toque