// Tipos base para as novas entidades
export interface Conta {
  id: string;
  nome: string;
  ativa: boolean;
  is_cora_account?: boolean; // Nova coluna para identificar conta Cora
  created_at: string;
  updated_at: string;
}

export interface Marketplace {
  id: string;
  nome: string;
  ativo: boolean;
  dinheiro_a_liberar: number;
  created_at: string;
  updated_at: string;
}

export interface Entrada {
  id: string;
  data: string; // YYYY-MM-DD
  conta_id: string;
  marketplace_id: string;
  valor: number;
  comissao_paga: boolean;
  observacao?: string;
  usuario_id: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos (quando incluídos na query)
  conta?: Conta;
  marketplace?: Marketplace;
  usuario?: {
    login: string;
  };
}

// Tipos para Fornecedores
export interface Fornecedor {
  id: string;
  nome: string;
  tipo: 'Camisa' | 'Gráfica' | 'Outros';
  status: 'Ativo' | 'Inativo';
  observacao?: string;
  saldo_devedor_manual: number;
  tem_ajuste_manual: boolean;
  created_at: string;
  updated_at: string;
  usuario_id: string;
}

export interface FornecedorComTotais extends Fornecedor {
  total_gasto: number;
  total_pago: number;
  total_aberto: number;
  saldo_aberto?: number; // Alias para total_aberto
  ultima_compra?: string; // Data da última compra
}

export interface Compra {
  id: string;
  fornecedor_id: string;
  data: string; // YYYY-MM-DD
  descricao: string;
  categoria: string;
  valor_total: number;
  valor_pago: number; // Valor pago obrigatório
  saldo_aberto?: number; // Nova coluna para saldo aberto
  forma: 'À Vista' | 'Fiado';
  vencimento?: string; // YYYY-MM-DD
  status: 'Aberta' | 'Parcial' | 'Quitada';
  created_at: string;
  updated_at: string;
  usuario_id: string;
}

export interface CompraComSaldo extends Compra {
  total_pago: number;
  saldo_aberto: number;
  fornecedor_nome: string;
  fornecedor_tipo: string;
  observacao?: string;
}

export interface CompraComDetalhes extends Compra {
  total_pago: number;
  saldo_aberto: number;
  fornecedor_nome: string;
  fornecedor_tipo: string;
  valor_pendente?: number;
}

export interface PagamentoFornecedor {
  id: string;
  compra_id: string;
  conta_id: string;
  data_pagamento: string; // YYYY-MM-DD
  valor_pago: number;
  tipo_pagamento?: 'total' | 'parcial'; // Nova coluna para tipo de pagamento
  pagamento_automatico?: boolean; // Nova coluna para pagamento automático
  saldo_anterior?: number; // Nova coluna para saldo anterior
  saldo_posterior?: number; // Nova coluna para saldo posterior
  observacao?: string;
  usuario_id: string;
  created_at: string;
}

export interface PagamentoComDetalhes extends PagamentoFornecedor {
  paid_value?: number;
  compra: {
    descricao: string;
    fornecedor: {
      nome: string;
    };
  };
  conta: {
    nome: string;
  };
  usuario: {
    email: string;
  };
}

// Tipos para formulários
export interface NovaEntradaForm {
  data: string;
  conta_id: string;
  marketplace_id: string;
  valor: string; // String para máscara BRL
  comissao_paga: boolean;
  observacao?: string;
}

export interface NovoMarketplaceForm {
  nome: string;
  dinheiro_a_liberar?: string; // String para máscara BRL
}

export interface NovoFornecedorForm {
  nome: string;
  tipo: 'Pessoa Física' | 'Pessoa Jurídica' | 'Camisa' | 'Gráfica' | 'Outros';
  status: 'Ativo' | 'Inativo';
  observacao?: string;
}

export interface NovaCompraForm {
  fornecedor_id: string;
  data: string;
  data_compra?: string;
  descricao: string;
  categoria: string;
  valor_total: string; // String para máscara BRL
  valor?: string;
  forma: 'À Vista' | 'Fiado';
  tipo_pagamento?: 'À Vista' | 'Fiado';
  vencimento?: string;
  observacao?: string;
}

export interface NovoPagamentoForm {
  compra_id: string;
  conta_id: string;
  data_pagamento: string;
  valor_pago: string; // String para máscara BRL
  observacao?: string;
}

export interface NovaSaidaForm {
  data_pagamento: string;
  conta_id: string;
  fornecedor_id: string;
  compra_id?: string;
  valor_pago: string; // String para máscara BRL
  observacao?: string;
}

// Tipos para filtros
export interface FiltrosEntrada {
  dataInicio?: string;
  dataFim?: string;
  conta_id?: string;
  marketplace_id?: string;
  valorMin?: string;
  valorMax?: string;
  comissaoPaga?: boolean;
  busca?: string;
}

export interface FiltrosFornecedor {
  tipo?: string;
  status?: string;
  busca?: string;
}

export interface FiltrosCompra {
  status?: string;
  dataInicio?: string;
  dataFim?: string;
  data_inicio?: string;
  data_fim?: string;
  tipo_pagamento?: string;
  busca?: string;
}

// Tipos para totais
export interface TotaisConta {
  conta_id: string;
  total_recebido: number;
  total_entradas: number;
}

export interface TotaisMarketplace {
  marketplace_id: string;
  total_enviado: number;
  total_comissao: number;
  total_marketplace: number;
  total_entradas: number;
}

export interface TotaisDashboard {
  total_cora: number;
  total_comissao: number;
  total_aberto_fornecedores: number;
  pagamentos_mes: number;
}

export interface TotaisFornecedor {
  total_gasto: number;
  total_pago: number;
  total_aberto: number;
}

// Hooks interfaces
export interface UseEntradasOptions {
  conta_id?: string;
  marketplace_id?: string;
  filtros?: FiltrosEntrada;
}

export interface UseEntradasReturn {
  entradas: Entrada[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  createEntrada: (entrada: NovaEntradaForm) => Promise<void>;
  updateEntrada: (id: string, entrada: Partial<NovaEntradaForm>) => Promise<void>;
  deleteEntrada: (id: string) => Promise<void>;
}

export interface UseTotaisReturn {
  totaisConta: TotaisConta[];
  totaisMarketplace: TotaisMarketplace[];
  totaisDashboard: TotaisDashboard;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseFornecedoresReturn {
  fornecedores: FornecedorComTotais[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  createFornecedor: (fornecedor: NovoFornecedorForm) => Promise<void>;
  updateFornecedor: (id: string, fornecedor: Partial<NovoFornecedorForm>) => Promise<void>;
  deleteFornecedor: (id: string) => Promise<void>;
}

export interface UseComprasReturn {
  compras: CompraComSaldo[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  createCompra: (compra: NovaCompraForm) => Promise<void>;
  updateCompra: (id: string, compra: Partial<NovaCompraForm>) => Promise<void>;
  deleteCompra: (id: string) => Promise<void>;
}



export interface UsePagamentosFornecedoresReturn {
  pagamentos: PagamentoComDetalhes[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  refreshPagamentos?: () => void;
  createPagamento: (pagamento: NovoPagamentoForm) => Promise<void>;
  createSaida: (saida: NovaSaidaForm) => Promise<void>;
  deletePagamento: (id: string) => Promise<void>;
}


// Tipos para Sócios
export interface Socio {
  id: string;
  nome: string;
  pre_saldo: number;
  created_at: string;
  updated_at: string;
}

// Tipos para histórico de valores bloqueados em marketplaces
export interface MarketplaceBalanceHistory {
  id: string;
  marketplace_id: string;
  valor_anterior: number;
  valor_novo: number;
  usuario_id: string;
  observacao?: string;
  created_at: string;
  
  // Relacionamentos (quando incluídos na query)
  marketplace?: {
    nome: string;
  };
  usuario?: {
    email: string;
  };
}

// Tipos para totais de valores bloqueados
export interface TotalBlockedAmounts {
  total_blocked: number;
  marketplaces: Array<{
    marketplace_id: string;
    marketplace_nome: string;
    dinheiro_a_liberar: number;
  }>;
}

// Tipos para formulários de edição de valores bloqueados
export interface EditBlockedAmountForm {
  marketplace_id: string;
  valor: string; // String para máscara BRL
  observacao?: string;
}

// Tipos para Abatimentos de Pré-Saldo
export interface AbatimentoPreSaldo {
  id: string;
  socio_id: string;
  conta_id: string;
  usuario_id: string;
  valor: number;
  saldo_anterior: number;
  saldo_posterior: number;
  data_abatimento: string; // YYYY-MM-DD
  observacao?: string;
  created_at: string;
}

export interface AbatimentoComDetalhes extends AbatimentoPreSaldo {
  socio: {
    nome: string;
  };
  conta: {
    nome: string;
  };
  usuario: {
    login: string;
  };
}

// Tipos para formulários de abatimento
export interface NovoAbatimentoForm {
  socio_id: string;
  conta_id: string;
  valor: string; // String para máscara BRL
  data_abatimento: string;
  observacao?: string;
}

// Tipos para filtros de abatimento
export interface FiltrosAbatimento {
  socio_id?: string;
  data_inicio?: string;
  data_fim?: string;
  valor_min?: string;
  valor_max?: string;
  busca?: string;
}

// Hook interface for Abatimentos
export interface UseAbatimentosReturn {
  abatimentos: AbatimentoComDetalhes[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  createAbatimento: (abatimento: NovoAbatimentoForm) => Promise<void>;
  updateAbatimento: (id: string, abatimento: Partial<NovoAbatimentoForm>) => Promise<void>;
  deleteAbatimento: (id: string) => Promise<void>;
}

// Hook interface for Socios
export interface UseSociosReturn {
  socios: Socio[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  getSocioById: (id: string) => Socio | undefined;
  updateSocio: (id: string, socio: Partial<Socio>) => Promise<void>;
  createSocio: (socio: Omit<Socio, 'id' | 'created_at' | 'updated_at'>) => Promise<Socio>;
  deleteSocio: (id: string) => Promise<void>;
}

// Novos tipos para pagamento otimizado
export interface HistoricoPagamento {
  id: string;
  compra_id: string;
  fornecedor_nome: string;
  compra_descricao: string;
  valor_compra: number;
  data_pagamento: string;
  valor_pago: number;
  conta_nome: string;
  tipo_pagamento: 'total' | 'parcial';
  pagamento_automatico: boolean;
  saldo_anterior: number;
  saldo_posterior: number;
  observacao?: string;
  usuario_login: string;
  created_at: string;
}

export interface ValidacaoSaldo {
  conta_id: string;
  saldo_disponivel: number;
  valor_solicitado: number;
  saldo_suficiente: boolean;
}

export interface ResultadoPagamento {
  success: boolean;
  pagamento_id?: string;
  compra_id?: string;
  valor_pago?: number;
  saldo_restante?: number;
  message?: string;
  error?: string;
}

// Tipos para hooks de pagamento otimizado
export interface UsePagamentoRapidoReturn {
  processarPagamentoTotal: (compraId: string) => Promise<ResultadoPagamento>;
  validarSaldoCora: (valor: number) => Promise<ValidacaoSaldo>;
  buscarContaCora: () => Promise<Conta | null>;
  loading: boolean;
  error: Error | null;
}

export interface UsePagamentoParcialReturn {
  processarPagamentoParcial: (compraId: string, contaId: string, valor: number, observacao?: string) => Promise<ResultadoPagamento>;
  buscarHistoricoPagamentos: (compraId: string) => Promise<HistoricoPagamento[]>;
  buscarDetalhesCompra: (compraId: string) => Promise<CompraComDetalhes | null>;
  validarSaldoConta: (contaId: string, valor: number) => Promise<ValidacaoSaldo>;
  loading: boolean;
  error: Error | null;
}


// Tipos para Sistema de Gestão de Usuários dos Sócios
export interface UserProfile {
  id: string;
  user_id: string;
  socio_id: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: 'admin' | 'socio' | 'socio_limitado';
  is_active: boolean;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos (quando incluídos na query)
  socio_nome?: string;
  email?: string;
  auth_created_at?: string;
  
  // Relacionamentos com objetos completos
  socios?: {
    id: string;
    nome: string;
  };
  usuarios?: {
    login: string;
  };
}

export interface UserPermission {
  id: string;
  user_profile_id: string;
  module_name: string;
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
  is_active: boolean;
  created_at: string;
}

export interface ProfileImage {
  id: string;
  user_profile_id: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  uploaded_at: string;
}

export interface UserManagementView {
  profile_id: string;
  user_id: string;
  socio_id: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: 'admin' | 'socio' | 'socio_limitado';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  socio_nome?: string;
  email?: string;
  auth_created_at?: string;
  permissions_count: number;
}

// Tipos para formulários de usuários
export interface CreateUserForm {
  socio_id: string;
  username: string; // Mudança: username ao invés de email
  password: string;
  confirm_password: string; // Novo campo para confirmação
  full_name: string;
  role: 'socio' | 'socio_limitado';
}

export interface UpdateProfileForm {
  full_name: string;
  phone?: string;
  preferences?: Record<string, any>;
}

export interface ChangePasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface UserProfileWithPermissions {
  profile: UserProfile;
  permissions: UserPermission[];
}

// Tipos para contexto de autenticação expandido
export interface AuthUser {
  id: string;
  email?: string;
  login?: string;
  profile?: UserProfile;
  permissions?: UserPermission[];
}

export interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  permissions: UserPermission[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: UpdateProfileForm) => Promise<void>;
  changePassword: (data: ChangePasswordForm) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  hasPermission: (module: string, action: 'read' | 'write' | 'delete') => boolean;
  isAdmin: () => boolean;
}

// Tipos para histórico de saldo devedor de fornecedores
export interface FornecedorSaldoHistory {
  id: string;
  fornecedor_id: string;
  valor_anterior: number;
  valor_novo: number;
  observacao: string;
  usuario_id: string;
  created_at: string;
  
  // Relacionamentos (quando incluídos na query)
  fornecedor?: {
    nome: string;
  };
  usuario?: {
    login: string;
  };
}

// Tipos para formulários de edição de saldo devedor
export interface EditSupplierBalanceForm {
  fornecedor_id: string;
  valor: string; // String para máscara BRL
  observacao: string;
}

// Tipos para Sistema de Despesas
export interface CategoriasDespesas {
  id: string;
  nome: string;
  tipo_padrao: 'fixa' | 'avulsa';
  cor: string;
  icone: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecorrenciaConfig {
  tipo: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
  dia_vencimento: number;
  data_fim?: string; // Data limite para gerar recorrências
  quantidade_parcelas?: number; // Alternativa à data_fim
}

export interface Despesa {
  id: string;
  tipo: 'despesa';
  subtipo: 'recorrente' | 'avulsa';
  descricao: string;
  valor: number;
  categoria_id: string;
  conta_id: string;
  status: 'pendente' | 'pago' | 'vencido';
  data_vencimento: string; // YYYY-MM-DD
  data_pagamento?: string; // YYYY-MM-DD
  observacoes?: string;
  recorrencia_config?: RecorrenciaConfig;
  despesa_origem_id?: string; // Para despesas geradas automaticamente
  usuario_id: string;
  created_at: string;
  updated_at: string;
}

export interface DespesaComDetalhes extends Despesa {
  categoria: {
    nome: string;
    cor: string;
    icone: string;
  };
  conta: {
    nome: string;
  };
  usuario: {
    login: string;
  };
  despesa_origem?: {
    descricao: string;
  };
}

// Tipos para formulários de despesas
export interface NovaDespesaForm {
  descricao: string;
  valor: string; // String para máscara BRL
  categoria_id: string;
  conta_id: string;
  subtipo: 'recorrente' | 'avulsa';
  data_vencimento: string;
  observacoes?: string;
  recorrencia_config?: RecorrenciaConfig;
  status?: 'pendente' | 'pago' | 'vencido';
  data_pagamento?: string;
}

// Tipos para filtros de despesas
export interface FiltrosDespesa {
  status?: 'pendente' | 'pago' | 'vencido';
  subtipo?: 'recorrente' | 'avulsa';
  categoria_id?: string;
  conta_id?: string;
  data_inicio?: string;
  data_fim?: string;
  valor_min?: string;
  valor_max?: string;
  busca?: string;
}

// Hook interface for Despesas
export interface UseDespesasReturn {
  despesas: DespesaComDetalhes[];
  categorias: CategoriasDespesas[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  createDespesa: (despesa: NovaDespesaForm) => Promise<void>;
  updateDespesa: (id: string, despesa: Partial<NovaDespesaForm>) => Promise<void>;
  deleteDespesa: (id: string) => Promise<void>;
  marcarComoPago: (id: string, data_pagamento: string, conta_id: string) => Promise<void>;
  gerarProximaRecorrencia: (id: string) => Promise<void>;
}