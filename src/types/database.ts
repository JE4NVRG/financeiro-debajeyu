// Tipos base para as novas entidades
export interface Conta {
  id: string;
  nome: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface Marketplace {
  id: string;
  nome: string;
  ativo: boolean;
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
}

export interface CompraComDetalhes extends Compra {
  total_pago: number;
  saldo_aberto: number;
  fornecedor_nome: string;
  fornecedor_tipo: string;
  valor_pago?: number;
  valor_pendente?: number;
}

export interface PagamentoFornecedor {
  id: string;
  compra_id: string;
  conta_id: string;
  data_pagamento: string; // YYYY-MM-DD
  valor_pago: number;
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

// Adicionar AuthUser interface
export interface AuthUser {
  id: string;
  email?: string;
  login?: string;
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
}