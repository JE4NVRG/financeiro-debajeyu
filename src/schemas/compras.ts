import { z } from 'zod';

// Schema para criação de compra baseado na estrutura da tabela compras
export const novaCompraSchema = z.object({
  fornecedor_id: z.string()
    .uuid('ID do fornecedor inválido'),
  
  data: z.string()
    .refine(val => !isNaN(Date.parse(val)), 'Data da compra inválida')
    .refine(val => {
      const date = new Date(val);
      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      return date >= oneYearAgo && date <= now;
    }, 'Data deve estar entre 1 ano atrás e hoje'),
  
  descricao: z.string()
    .min(2, 'Descrição deve ter pelo menos 2 caracteres')
    .max(200, 'Descrição deve ter no máximo 200 caracteres')
    .trim()
    .refine(val => val.length > 0, 'Descrição é obrigatória'),
  
  categoria: z.string()
    .min(1, 'Categoria é obrigatória')
    .max(100, 'Categoria deve ter no máximo 100 caracteres'),
  
  valor_total: z.union([
    z.number().positive('Valor deve ser maior que zero'),
    z.string().refine(val => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Valor deve ser um número válido maior que zero')
  ]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
  
  forma: z.enum(['À Vista', 'Fiado'], {
    message: 'Forma de pagamento deve ser À Vista ou Fiado'
  }),
  
  vencimento: z.string()
    .optional()
    .nullable()
    .refine(val => !val || !isNaN(Date.parse(val)), 'Data de vencimento inválida'),
  
  status: z.enum(['Aberta', 'Parcial', 'Quitada'])
    .optional()
    .default('Aberta'),
  
  observacao: z.string()
    .max(500, 'Observação deve ter no máximo 500 caracteres')
    .optional()
    .nullable()
});

export type NovaCompraFormData = z.infer<typeof novaCompraSchema>;