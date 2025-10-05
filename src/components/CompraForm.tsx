import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CurrencyInput } from './ui/CurrencyInput';
import { NovaCompraForm, Fornecedor } from '../types/database';
import { getCurrentDate } from '../lib/utils';
import { useFornecedores } from '../hooks/useFornecedores';
import { useCurrencyMask } from '../hooks/useCurrencyMask';

interface CompraFormProps {
  onSubmit: (data: NovaCompraForm) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: Partial<NovaCompraForm>;
  fornecedorId?: string;
}

export function CompraForm({ 
  onSubmit, 
  onCancel, 
  loading = false, 
  initialData,
  fornecedorId 
}: CompraFormProps) {
  const [formData, setFormData] = useState<NovaCompraForm>({
    fornecedor_id: fornecedorId || '',
    data: getCurrentDate(),
    descricao: '',
    categoria: 'Produtos',
    valor_total: '',
    forma: 'Fiado',
    vencimento: null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [valorNumerico, setValorNumerico] = useState<number>(0);

  const { fornecedores } = useFornecedores();
  const currencyMask = useCurrencyMask();

  // Filtrar apenas fornecedores ativos
  const fornecedoresAtivos = fornecedores.filter(f => f.status === 'Ativo');

  useEffect(() => {
    if (initialData) {
      // Se há valor inicial, converter para número
      if (initialData.valor_total) {
        const numericValue = typeof initialData.valor_total === 'number' 
          ? initialData.valor_total
          : currencyMask.parseToCanonical(initialData.valor_total);
        setValorNumerico(numericValue);
      } else {
        setValorNumerico(0);
      }

      setFormData({
        fornecedor_id: initialData.fornecedor_id || fornecedorId || '',
        data: initialData.data || getCurrentDate(),
        descricao: initialData.descricao || '',
        categoria: initialData.categoria || 'Produtos',
        valor_total: initialData.valor_total || '',
        forma: initialData.forma || 'Fiado',
        vencimento: initialData.vencimento || null
      });
    } else if (fornecedorId) {
      setFormData(prev => ({ ...prev, fornecedor_id: fornecedorId }));
      setValorNumerico(0);
    }
  }, [initialData, fornecedorId]);

  const handleValorChange = (numericValue: number) => {
    console.log('💰 Valor numérico recebido:', numericValue);
    
    setValorNumerico(numericValue);
    setFormData(prev => ({ ...prev, valor_total: numericValue.toString() }));
    
    if (errors.valor_total && numericValue > 0) {
      setErrors(prev => ({ ...prev, valor_total: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fornecedor_id) {
      newErrors.fornecedor_id = 'Fornecedor é obrigatório';
    }

    if (!formData.data) {
      newErrors.data = 'Data é obrigatória';
    }

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (!formData.categoria) {
      newErrors.categoria = 'Categoria é obrigatória';
    }

    if (valorNumerico <= 0) {
      newErrors.valor_total = 'Valor deve ser maior que zero';
    }

    if (!formData.forma) {
      newErrors.forma = 'Forma de pagamento é obrigatória';
    }

    // Se for fiado, vencimento é obrigatório
    if (formData.forma === 'Fiado' && !formData.vencimento) {
      newErrors.vencimento = 'Vencimento é obrigatório para compras fiado';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Dados do formulário de compra:', formData);
    console.log('📝 Valor numérico:', valorNumerico);
    
    if (validateForm()) {
      const dataToSubmit: NovaCompraForm = {
        ...formData,
        descricao: formData.descricao.trim(),
        valor_total: currencyMask.ensureTwoDecimals(valorNumerico).toString(),
        vencimento: formData.forma === 'À Vista' ? null : formData.vencimento
      };
      
      console.log('📝 Dados da compra a serem enviados:', dataToSubmit);
      onSubmit(dataToSubmit);
    } else {
      console.log('❌ Erros de validação:', errors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fornecedor">Fornecedor *</Label>
        <Select
          value={formData.fornecedor_id}
          onValueChange={(value) => {
            setFormData(prev => ({ ...prev, fornecedor_id: value }));
            if (errors.fornecedor_id) setErrors(prev => ({ ...prev, fornecedor_id: '' }));
          }}
          disabled={!!fornecedorId} // Desabilitar se fornecedor já foi definido
        >
          <SelectTrigger className={errors.fornecedor_id ? 'border-red-500' : ''}>
            <SelectValue placeholder="Selecione um fornecedor" />
          </SelectTrigger>
          <SelectContent>
            {fornecedoresAtivos.map((fornecedor) => (
              <SelectItem key={fornecedor.id} value={fornecedor.id}>
                {fornecedor.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.fornecedor_id && <p className="text-sm text-red-500">{errors.fornecedor_id}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data">Data *</Label>
          <Input
            id="data"
            type="date"
            value={formData.data}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, data: e.target.value }));
              if (errors.data) setErrors(prev => ({ ...prev, data: '' }));
            }}
            className={errors.data ? 'border-red-500' : ''}
          />
          {errors.data && <p className="text-sm text-red-500">{errors.data}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor">Valor Total *</Label>
          <CurrencyInput
            id="valor"
            value={valorNumerico}
            onChange={handleValorChange}
            placeholder="Digite o valor..."
            showError={!!errors.valor_total}
            errorMessage={errors.valor_total}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição *</Label>
        <Input
          id="descricao"
          type="text"
          value={formData.descricao}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, descricao: e.target.value }));
            if (errors.descricao) setErrors(prev => ({ ...prev, descricao: '' }));
          }}
          placeholder="Digite a descrição da compra..."
          className={errors.descricao ? 'border-red-500' : ''}
        />
        {errors.descricao && <p className="text-sm text-red-500">{errors.descricao}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria *</Label>
          <Select
            value={formData.categoria}
            onValueChange={(value) => {
              setFormData(prev => ({ ...prev, categoria: value }));
              if (errors.categoria) setErrors(prev => ({ ...prev, categoria: '' }));
            }}
          >
            <SelectTrigger className={errors.categoria ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Produtos">Produtos</SelectItem>
              <SelectItem value="Serviços">Serviços</SelectItem>
              <SelectItem value="Matéria Prima">Matéria Prima</SelectItem>
              <SelectItem value="Equipamentos">Equipamentos</SelectItem>
              <SelectItem value="Diversos">Diversos</SelectItem>
            </SelectContent>
          </Select>
          {errors.categoria && <p className="text-sm text-red-500">{errors.categoria}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="forma">Forma de Pagamento *</Label>
          <Select
            value={formData.forma}
            onValueChange={(value) => {
              setFormData(prev => ({ 
                ...prev, 
                forma: value as 'À Vista' | 'Fiado',
                vencimento: value === 'À Vista' ? null : prev.vencimento
              }));
              if (errors.forma) setErrors(prev => ({ ...prev, forma: '' }));
              if (errors.vencimento && value === 'À Vista') {
                setErrors(prev => ({ ...prev, vencimento: '' }));
              }
            }}
          >
            <SelectTrigger className={errors.forma ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione a forma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="À Vista">À Vista</SelectItem>
              <SelectItem value="Fiado">Fiado</SelectItem>
            </SelectContent>
          </Select>
          {errors.forma && <p className="text-sm text-red-500">{errors.forma}</p>}
        </div>
      </div>

      {formData.forma === 'Fiado' && (
        <div className="space-y-2">
          <Label htmlFor="vencimento">Vencimento *</Label>
          <Input
            id="vencimento"
            type="date"
            value={formData.vencimento || ''}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, vencimento: e.target.value || null }));
              if (errors.vencimento) setErrors(prev => ({ ...prev, vencimento: '' }));
            }}
            className={errors.vencimento ? 'border-red-500' : ''}
          />
          {errors.vencimento && <p className="text-sm text-red-500">{errors.vencimento}</p>}
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
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
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}