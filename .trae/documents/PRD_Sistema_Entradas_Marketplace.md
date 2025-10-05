# PRD - Sistema de Entradas de Marketplace
## Financeiro DEBAJEYU - Extensão v2.0

## 1. Visão Geral do Projeto

### 1.1 Contexto
O sistema Financeiro DEBAJEYU já possui funcionalidades consolidadas para gestão de sócios, investimentos e dashboard. Esta extensão adiciona controle de entradas de dinheiro vindas de marketplaces para contas bancárias, começando com a conta Cora.

### 1.2 Objetivo
Implementar sistema de controle de entradas financeiras que chegam ao banco (Cora) vindas de marketplaces, com registro opcional de comissão de 4% para métricas informativas, sem afetar o saldo real da conta bancária.

### 1.3 Princípios de Implementação
- **Compatibilidade Total**: Não alterar dados ou funcionalidades existentes
- **Migração Segura**: Apenas adições incrementais ao banco de dados
- **Auditoria Completa**: Log de usuário e timestamp em todas as operações
- **Segurança**: RLS configurado para controle de acesso

## 2. Funcionalidades Principais

### 2.1 Módulo Contas
**Objetivo**: Gerenciar entradas de dinheiro por conta bancária

**Funcionalidades**:
- Visualização do total recebido por conta
- Listagem de todas as entradas da conta
- Criação, edição e exclusão de entradas
- Filtros por período e marketplace
- Busca por observação
- Ordenação por data (descendente por padrão)

### 2.2 Módulo Marketplaces
**Objetivo**: Visualizar métricas e entradas por marketplace

**Funcionalidades**:
- Cadastro de novos marketplaces
- Cards informativos por marketplace:
  - Valor enviado para Cora
  - Comissão 4% acumulada
  - Total marketplace (informativo)
- Listagem de entradas por marketplace
- Filtros e ordenação específicos

### 2.3 Dashboard Estendido
**Objetivo**: Adicionar métricas de entradas aos cards existentes

**Novos Cards**:
- Total enviado ao Cora (soma de todas as entradas)
- Comissão 4% acumulada (soma das comissões marcadas)

## 3. Estrutura de Dados

### 3.1 Novas Tabelas

#### Tabela: contas
```sql
CREATE TABLE contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabela: marketplaces
```sql
CREATE TABLE marketplaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Tabela: entradas
```sql
CREATE TABLE entradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data DATE NOT NULL,
    conta_id UUID NOT NULL REFERENCES contas(id),
    marketplace_id UUID NOT NULL REFERENCES marketplaces(id),
    valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
    comissao_paga BOOLEAN DEFAULT false,
    observacao TEXT,
    usuario_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.2 Dados Iniciais
- Conta "Cora" será criada automaticamente
- Marketplaces serão cadastrados conforme necessidade

## 4. Especificações de Interface

### 4.1 Navegação Atualizada
```
Dashboard • Investimentos • Contas • Marketplaces • Sócios • Sair
```

### 4.2 Tela: Contas

#### Layout Principal
- **Card Destaque**: "Total recebido na Cora" com valor formatado em BRL
- **Tabela de Entradas**: 
  - Colunas: Data | Marketplace | Valor | Comissão 4% | Observação | Lançado por | Lançado em | Ações
  - Ordenação padrão: Data descendente
  - Paginação se necessário

#### Modal: Nova Entrada
**Campos**:
- Data da entrada (padrão: hoje)
- Conta (padrão: Cora, select para futuras contas)
- Marketplace (select obrigatório)
- Valor (input com máscara BRL, obrigatório, > 0)
- Checkbox "Foi pago 4%" (opcional)
- Observação (textarea opcional)

**Comportamento**:
- Se "Foi pago 4%" marcado: exibir valor da comissão calculada (4% do valor)
- Validações em tempo real
- Toast de sucesso/erro

#### Filtros e Busca
- Filtro por período (data início/fim)
- Filtro por marketplace (select)
- Busca por observação (input texto)
- Botão "Limpar filtros"

### 4.3 Tela: Marketplaces

#### Layout Principal
- **Lista de Marketplaces**: Cards clicáveis com nome
- **Botão**: "Novo Marketplace"

#### Detalhes do Marketplace (ao clicar)
**Cards Informativos**:
- Enviado para Cora: R$ X.XXX,XX
- Comissão 4%: R$ XXX,XX
- Total Marketplace: R$ X.XXX,XX (informativo)

**Tabela de Entradas**: Mesma estrutura da tela Contas, filtrada pelo marketplace

### 4.4 Dashboard Estendido

#### Novos Cards (após os existentes)
```
[Pré-Saldos] [Investimentos] [Saldo a Receber]
[Total Cora] [Comissão 4%]
```

**Card: Total enviado ao Cora**
- Valor: Soma de todas as entradas.valor
- Cor: Verde (positivo)
- Ícone: Banco/Dinheiro

**Card: Comissão 4% acumulada**
- Valor: Soma das comissões onde comissao_paga = true
- Cor: Azul (informativo)
- Ícone: Porcentagem

## 5. Regras de Negócio

### 5.1 Entradas
- Data obrigatória (não pode ser futura)
- Valor obrigatório e maior que zero
- Marketplace obrigatório
- Conta obrigatória (padrão Cora)
- Comissão é opcional e apenas informativa

### 5.2 Comissão 4%
- **Importante**: Comissão NÃO altera o valor lançado na conta
- Comissão é calculada como: valor * 0.04
- Aparece apenas nos totais do marketplace
- Serve apenas para métricas e controle

### 5.3 Auditoria
- Toda entrada registra: usuario_id (quem lançou)
- Timestamp automático: created_at, updated_at
- Exibição: "Lançado por [nome_usuario] em [data/hora]"

### 5.4 Permissões (RLS)
- **Leitura**: Apenas usuários autenticados
- **Criação**: Apenas usuários autenticados
- **Edição**: Apenas o autor da entrada
- **Exclusão**: Apenas o autor da entrada

## 6. Validações e UX

### 6.1 Validações de Entrada
- Data: Obrigatória, não pode ser futura
- Valor: Obrigatório, > 0, máscara BRL
- Marketplace: Obrigatório, select com opções ativas
- Observação: Opcional, máximo 500 caracteres

### 6.2 Feedback ao Usuário
- Toasts de sucesso/erro para todas as operações
- Confirmação antes de excluir entradas
- Loading states durante operações
- Mensagens de validação em tempo real

### 6.3 Formatação
- Valores monetários: Formato BRL (R$ 1.234,56)
- Datas: Formato brasileiro (DD/MM/AAAA)
- Timestamps: DD/MM/AAAA HH:mm

## 7. Critérios de Aceite

### 7.1 Funcionalidades Básicas
- [ ] Criar nova entrada pela tela Contas
- [ ] Editar entrada existente (apenas autor)
- [ ] Excluir entrada com confirmação (apenas autor)
- [ ] Visualizar total da conta Cora atualizado
- [ ] Marcar/desmarcar "foi pago 4%" e ver reflexo nos totais do marketplace

### 7.2 Filtros e Busca
- [ ] Filtrar entradas por período
- [ ] Filtrar entradas por marketplace
- [ ] Buscar por observação
- [ ] Ordenar por data (desc/asc)
- [ ] Limpar todos os filtros

### 7.3 Tela Marketplaces
- [ ] Cadastrar novo marketplace
- [ ] Visualizar cards de totais por marketplace
- [ ] Acessar entradas específicas do marketplace
- [ ] Totais calculados corretamente (enviado + comissão)

### 7.4 Dashboard
- [ ] Card "Total enviado ao Cora" com valor correto
- [ ] Card "Comissão 4%" com valor correto
- [ ] Cards existentes não afetados

### 7.5 Auditoria e Segurança
- [ ] Log de usuário e timestamp em todas as entradas
- [ ] RLS funcionando (só autor edita/exclui)
- [ ] Dados existentes preservados
- [ ] Migração executada sem erros

## 8. Considerações Técnicas

### 8.1 Performance
- Índices nas colunas de busca frequente (data, conta_id, marketplace_id)
- Paginação para tabelas com muitos registros
- Cache de totais se necessário

### 8.2 Manutenibilidade
- Código modular e reutilizável
- Componentes UI consistentes com o sistema existente
- Documentação de APIs e funções

### 8.3 Escalabilidade
- Estrutura preparada para múltiplas contas
- Suporte a novos tipos de entrada no futuro
- Flexibilidade para diferentes percentuais de comissão

## 9. Cronograma de Implementação

### Fase 1: Estrutura Base (1-2 dias)
- Criação das migrações de banco
- Configuração de RLS
- Dados iniciais (conta Cora)

### Fase 2: Backend/API (1-2 dias)
- Funções de CRUD para entradas
- Cálculos de totais
- Validações

### Fase 3: Frontend - Contas (2-3 dias)
- Tela de contas
- Modal de nova entrada
- Filtros e busca
- Integração com API

### Fase 4: Frontend - Marketplaces (1-2 dias)
- Tela de marketplaces
- Cards de totais
- Listagem de entradas

### Fase 5: Dashboard e Ajustes (1 dia)
- Novos cards no dashboard
- Testes finais
- Ajustes de UX

### Fase 6: Testes e Deploy (1 dia)
- Testes de integração
- Validação dos critérios de aceite
- Deploy em produção

**Total estimado: 7-11 dias**