import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { NovaEntradaForm, Conta, Marketplace } from '../types/database';
import { formatBRL, parseBRLToNumber, formatBRLInput, getCurrentDate } from '../lib/utils';
import { useContas } from '../hooks/useContas';
import { useMarketplaces } from '../hooks/useMarketplaces';
import { useBRLMask } from '../hooks/useBRLMask';

interface EntradaFormProps {
  onSubmit: (data: NovaEntradaForm) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: Partial<NovaEntradaForm>;
}

export function EntradaForm({ onSubmit, onCancel, loading = false, initialData }: EntradaFormProps) {
  const [formData, setFormData] = useState<NovaEntradaForm>({
    data: getCurrentDate(),
    conta_id: '',
    marketplace_id: '',
    valor: '',
    comissao_paga: false,
    observacao: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { contas } = useContas();
  const { marketplaces } = useMarketplaces();
  const valorMask = useBRLMask();

  // Encontrar a conta Cora automaticamente
  const contaCora = contas.find(conta => conta.nome.toLowerCase().includes('cora'));

  useEffect(() => {
    if (initialData) {
      setFormData({
        data: initialData.data || getCurrentDate(),
        conta_id: initialData.conta_id || contaCora?.id || '',
        marketplace_id: initialData.marketplace_id || '',
        valor: '', // Sempre inicializar como string vazia
        comissao_paga: initialData.comissao_paga || false,
        observacao: initialData.observacao || ''
      });
      
      // Se há valor inicial, formatar e definir no mask
      if (initialData.valor) {
        const valorString = typeof initialData.valor === 'number' 
          ? initialData.valor.toString() 
          : initialData.valor;
        const formatted = valorMask.formatInputValue(valorString);
        valorMask.setValue(formatted);
        setFormData(prev => ({ ...prev, valor: formatted }));
      }
    } else if (contaCora) {
      // Se não há dados iniciais, usar a conta Cora por padrão
      setFormData(prev => ({ ...prev, conta_id: contaCora.id }));
    }
  }, [initialData, contaCora]);

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    console.log('💰 Input do valor:', input);
    
    // Usar o hook useBRLMask para formatação
    const formattedValue = valorMask.handleChange(input);
    const numericValue = valorMask.parseValue(formattedValue);
    
    console.log('💰 Valor formatado:', formattedValue);
    console.log('💰 Valor numérico:', numericValue);
    
    setFormData(prev => ({ ...prev, valor: formattedValue }));
    
    if (errors.valor && numericValue > 0) {
      setErrors(prev => ({ ...prev, valor: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.data) {
      newErrors.data = 'Data é obrigatória';
    }

    // Remover validação da conta já que será sempre Cora
    if (!contaCora) {
      newErrors.conta_id = 'Conta Cora não encontrada';
    }

    if (!formData.marketplace_id) {
      newErrors.marketplace_id = 'Marketplace é obrigatório';
    }

    const numericValue = valorMask.parseValue(valorMask.value);
    if (numericValue <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Dados do formulário antes da validação:', formData);
    console.log('📝 Valor do mask:', valorMask.value);
    console.log('📝 Valor parseado:', valorMask.parseValue(valorMask.value));
    
    if (validateForm()) {
      // Garantir que sempre use a conta Cora e converter valor para número
      const numericValue = valorMask.parseValue(valorMask.value);
      const dataToSubmit: NovaEntradaForm = {
        ...formData,
        conta_id: contaCora?.id || formData.conta_id,
        valor: numericValue.toString() // Manter como string para compatibilidade com NovaEntradaForm
      };
      
      console.log('📝 Dados a serem enviados:', dataToSubmit);
      onSubmit(dataToSubmit);
    } else {
      console.log('❌ Erros de validação:', errors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          <Label htmlFor="valor">Valor *</Label>
          <Input
            id="valor"
            type="text"
            value={valorMask.value}
            onChange={handleValorChange}
            placeholder="R$ 0,00"
            className={errors.valor ? 'border-red-500' : ''}
          />
          {errors.valor && <p className="text-sm text-red-500">{errors.valor}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="marketplace">Marketplace *</Label>
        <Select
          value={formData.marketplace_id}
          onValueChange={(value) => {
            setFormData(prev => ({ ...prev, marketplace_id: value }));
            if (errors.marketplace_id) setErrors(prev => ({ ...prev, marketplace_id: '' }));
          }}
        >
          <SelectTrigger className={errors.marketplace_id ? 'border-red-500' : ''}>
            <SelectValue placeholder="Selecione um marketplace" />
          </SelectTrigger>
          <SelectContent>
            {marketplaces.map((marketplace) => (
              <SelectItem key={marketplace.id} value={marketplace.id}>
                {marketplace.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.marketplace_id && <p className="text-sm text-red-500">{errors.marketplace_id}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="comissao"
          checked={formData.comissao_paga}
          onCheckedChange={(checked) => 
            setFormData(prev => ({ ...prev, comissao_paga: checked as boolean }))
          }
        />
        <Label htmlFor="comissao" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Comissão 4% paga
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacao">Observação</Label>
        <Textarea
          id="observacao"
          value={formData.observacao}
          onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
          placeholder="Observações adicionais..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}