import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { NovaCompraForm, Fornecedor } from '../../types/database';
import { formatBRL, parseBRLToNumber } from '../../lib/utils';

interface NovaCompraFormProps {
  onSubmit: (data: NovaCompraForm) => Promise<void>;
  onCancel: () => void;
  fornecedores: Fornecedor[];
  loading?: boolean;
  initialData?: Partial<NovaCompraForm>;
}

export function NovaCompraFormComponent({ 
  onSubmit, 
  onCancel, 
  fornecedores,
  loading = false,
  initialData
}: NovaCompraFormProps) {
  const [formData, setFormData] = useState<NovaCompraForm>({
    fornecedor_id: initialData?.fornecedor_id || '',
    data: initialData?.data || new Date().toISOString().split('T')[0],
    descricao: initialData?.descricao || '',
    categoria: initialData?.categoria || '',
    valor_total: initialData?.valor_total || '',
    forma: initialData?.forma || 'À Vista',
    vencimento: initialData?.vencimento || '',
    observacao: initialData?.observacao || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    const newErrors: Record<string, string> = {};
    
    if (!formData.fornecedor_id) {
      newErrors.fornecedor_id = 'Fornecedor é obrigatório';
    }
    
    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }
    
    if (!formData.categoria.trim()) {
      newErrors.categoria = 'Categoria é obrigatória';
    }
    
    if (!formData.valor_total || parseBRLToNumber(formData.valor_total) <= 0) {
      newErrors.valor_total = 'Valor deve ser maior que zero';
    }
    
    if (!formData.data) {
      newErrors.data = 'Data é obrigatória';
    }
    
    if (formData.forma === 'Fiado' && !formData.vencimento) {
      newErrors.vencimento = 'Vencimento é obrigatório para compras fiadas';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao salvar compra:', error);
    }
  };

  const handleValorChange = (value: string) => {
    // Remove caracteres não numéricos exceto vírgula e ponto
    const cleanValue = value.replace(/[^\d.,]/g, '');
    setFormData(prev => ({ ...prev, valor_total: cleanValue }));
    if (errors.valor_total) {
      setErrors(prev => ({ ...prev, valor_total: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Fornecedor */}
      <div className="space-y-2">
        <Label htmlFor="fornecedor_id">Fornecedor *</Label>
        <Select
          value={formData.fornecedor_id}
          onValueChange={(value) => {
            setFormData(prev => ({ ...prev, fornecedor_id: value }));
            if (errors.fornecedor_id) {
              setErrors(prev => ({ ...prev, fornecedor_id: '' }));
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um fornecedor" />
          </SelectTrigger>
          <SelectContent>
            {fornecedores.map((fornecedor) => (
              <SelectItem key={fornecedor.id} value={fornecedor.id}>
                {fornecedor.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.fornecedor_id && (
          <p className="text-sm text-red-500">{errors.fornecedor_id}</p>
        )}
      </div>

      {/* Data */}
      <div className="space-y-2">
        <Label htmlFor="data">Data *</Label>
        <Input
          id="data"
          type="date"
          value={formData.data}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, data: e.target.value }));
            if (errors.data) {
              setErrors(prev => ({ ...prev, data: '' }));
            }
          }}
          required
        />
        {errors.data && (
          <p className="text-sm text-red-500">{errors.data}</p>
        )}
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição *</Label>
        <Input
          id="descricao"
          value={formData.descricao}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, descricao: e.target.value }));
            if (errors.descricao) {
              setErrors(prev => ({ ...prev, descricao: '' }));
            }
          }}
          placeholder="Descrição da compra"
          required
        />
        {errors.descricao && (
          <p className="text-sm text-red-500">{errors.descricao}</p>
        )}
      </div>

      {/* Categoria */}
      <div className="space-y-2">
        <Label htmlFor="categoria">Categoria *</Label>
        <Input
          id="categoria"
          value={formData.categoria}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, categoria: e.target.value }));
            if (errors.categoria) {
              setErrors(prev => ({ ...prev, categoria: '' }));
            }
          }}
          placeholder="Categoria da compra"
          required
        />
        {errors.categoria && (
          <p className="text-sm text-red-500">{errors.categoria}</p>
        )}
      </div>

      {/* Valor Total */}
      <div className="space-y-2">
        <Label htmlFor="valor_total">Valor Total *</Label>
        <Input
          id="valor_total"
          value={formData.valor_total}
          onChange={(e) => handleValorChange(e.target.value)}
          placeholder="R$ 0,00"
          required
        />
        {errors.valor_total && (
          <p className="text-sm text-red-500">{errors.valor_total}</p>
        )}
      </div>

      {/* Forma de Pagamento */}
      <div className="space-y-2">
        <Label htmlFor="forma">Forma de Pagamento *</Label>
        <Select
          value={formData.forma}
          onValueChange={(value: 'À Vista' | 'Fiado') => {
            setFormData(prev => ({ ...prev, forma: value }));
            // Limpar vencimento se mudou para À Vista
            if (value === 'À Vista') {
              setFormData(prev => ({ ...prev, vencimento: '' }));
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="À Vista">À Vista</SelectItem>
            <SelectItem value="Fiado">Fiado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vencimento (apenas se for Fiado) */}
      {formData.forma === 'Fiado' && (
        <div className="space-y-2">
          <Label htmlFor="vencimento">Vencimento *</Label>
          <Input
            id="vencimento"
            type="date"
            value={formData.vencimento}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, vencimento: e.target.value }));
              if (errors.vencimento) {
                setErrors(prev => ({ ...prev, vencimento: '' }));
              }
            }}
            required
          />
          {errors.vencimento && (
            <p className="text-sm text-red-500">{errors.vencimento}</p>
          )}
        </div>
      )}

      {/* Observação */}
      <div className="space-y-2">
        <Label htmlFor="observacao">Observação</Label>
        <Textarea
          id="observacao"
          value={formData.observacao}
          onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
          placeholder="Observações adicionais (opcional)"
          rows={3}
        />
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Salvar Compra'}
        </Button>
      </div>
    </form>
  );
}