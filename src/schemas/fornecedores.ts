import { z } from 'zod';

// Schema para criação de fornecedor
export const fornecedorSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .refine(val => val.length > 0, 'Nome é obrigatório'),
  
  tipo: z.enum(['Fornecedor', 'Prestador de Serviço'], {
    errorMap: () => ({ message: 'Tipo deve ser Fornecedor ou Prestador de Serviço' })
  }).optional().default('Fornecedor')
});

// Schema para atualização de fornecedor (campos opcionais)
export const updateFornecedorSchema = fornecedorSchema.partial();

// Schema para compra
export const compraSchema = z.object({
  fornecedor_id: z.string()
    .uuid('ID do fornecedor inválido'),
  
  descricao: z.string()
    .min(2, 'Descrição deve ter pelo menos 2 caracteres')
    .max(200, 'Descrição deve ter no máximo 200 caracteres')
    .trim()
    .refine(val => val.length > 0, 'Descrição é obrigatória'),
  
  valor: z.number()
    .positive('Valor deve ser maior que zero')
    .max(999999.99, 'Valor deve ser menor que R$ 999.999,99')
    .refine(val => Number.isFinite(val), 'Valor deve ser um número válido'),
  
  tipo_pagamento: z.enum(['a_vista', 'fiado'], {
    errorMap: () => ({ message: 'Tipo de pagamento deve ser À Vista ou Fiado' })
  }),
  
  data_compra: z.string()
    .refine(val => !isNaN(Date.parse(val)), 'Data da compra inválida')
    .refine(val => {
      const date = new Date(val);
      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      return date >= oneYearAgo && date <= now;
    }, 'Data deve estar entre 1 ano atrás e hoje'),
  
  observacao: z.string()
    .max(500, 'Observação deve ter no máximo 500 caracteres')
    .optional()
    .nullable()
});

// Schema para pagamento
export const pagamentoSchema = z.object({
  compra_id: z.string()
    .uuid('ID da compra inválido'),
  
  valor: z.number()
    .positive('Valor deve ser maior que zero')
    .max(999999.99, 'Valor deve ser menor que R$ 999.999,99')
    .refine(val => Number.isFinite(val), 'Valor deve ser um número válido'),
  
  data_pagamento: z.string()
    .refine(val => !isNaN(Date.parse(val)), 'Data do pagamento inválida')
    .refine(val => {
      const date = new Date(val);
      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      return date >= oneYearAgo && date <= now;
    }, 'Data deve estar entre 1 ano atrás e hoje'),
  
  observacao: z.string()
    .max(500, 'Observação deve ter no máximo 500 caracteres')
    .optional()
    .nullable()
});

// Schema para filtros de fornecedor
export const filtrosFornecedorSchema = z.object({
  tipo: z.enum(['pessoa_fisica', 'pessoa_juridica']).optional(),
  status: z.enum(['ativo', 'inativo']).optional(),
  busca: z.string().max(100, 'Busca deve ter no máximo 100 caracteres').optional()
});

// Tipos derivados dos schemas
export type FornecedorFormData = z.infer<typeof fornecedorSchema>;
export type UpdateFornecedorFormData = z.infer<typeof updateFornecedorSchema>;
export type CompraFormData = z.infer<typeof compraSchema>;
export type PagamentoFormData = z.infer<typeof pagamentoSchema>;
export type FiltrosFornecedorData = z.infer<typeof filtrosFornecedorSchema>;

// Validadores de negócio
export const validatePagamentoAmount = (valorPagamento: number, valorCompra: number, totalPago: number) => {
  const saldoRestante = valorCompra - totalPago;
  
  if (valorPagamento > saldoRestante) {
    throw new Error(`Valor do pagamento (R$ ${valorPagamento.toFixed(2)}) não pode ser maior que o saldo restante (R$ ${saldoRestante.toFixed(2)})`);
  }
  
  return true;
};

export const validateCompraDate = (dataCompra: string, datasPagamentos: string[] = []) => {
  const compraDate = new Date(dataCompra);
  
  for (const dataPagamento of datasPagamentos) {
    const pagamentoDate = new Date(dataPagamento);
    if (pagamentoDate < compraDate) {
      throw new Error('Data do pagamento não pode ser anterior à data da compra');
    }
  }
  
  return true;
};

export const validateFornecedorDeletion = (totalCompras: number) => {
  if (totalCompras > 0) {
    throw new Error('Não é possível excluir fornecedor que possui compras registradas');
  }
  
  return true;
};

export const validateCompraDeletion = (totalPagamentos: number) => {
  if (totalPagamentos > 0) {
    throw new Error('Não é possível excluir compra que possui pagamentos registrados');
  }
  
  return true;
};