import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CurrencyInput } from './ui/CurrencyInput';
import { NovoPagamentoForm, CompraComSaldo } from '../types/database';
import { getCurrentDate, formatBRL } from '../lib/utils';
import { useContas } from '../hooks/useContas';
import { useCurrencyMask } from '../hooks/useCurrencyMask';

interface PagamentoFormProps {
  onSubmit: (data: NovoPagamentoForm) => void;
  onCancel: () => void;
  loading?: boolean;
  compra: CompraComSaldo;
  initialData?: Partial<NovoPagamentoForm>;
}

export function PagamentoForm({ 
  onSubmit, 
  onCancel, 
  loading = false, 
  compra,
  initialData 
}: PagamentoFormProps) {
  const [formData, setFormData] = useState<NovoPagamentoForm>({
    compra_id: compra.id,
    conta_id: '',
    data_pagamento: getCurrentDate(),
    valor_pago: '',
    observacao: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [valorNumerico, setValorNumerico] = useState<number>(0);

  const { contas } = useContas();
  const currencyMask = useCurrencyMask();

  // Encontrar a conta Cora automaticamente
  const contaCora = contas.find(conta => conta.nome.toLowerCase().includes('cora'));

  useEffect(() => {
    if (initialData) {
      // Se há valor inicial, converter para número
      if (initialData.valor_pago) {
        const numericValue = typeof initialData.valor_pago === 'number' 
          ? initialData.valor_pago
          : currencyMask.parseToCanonical(initialData.valor_pago);
        setValorNumerico(numericValue);
      } else {
        setValorNumerico(0);
      }

      setFormData({
        compra_id: compra.id,
        conta_id: initialData.conta_id || contaCora?.id || '',
        data_pagamento: initialData.data_pagamento || getCurrentDate(),
        valor_pago: initialData.valor_pago || '',
        observacao: initialData.observacao || ''
      });
    } else if (contaCora) {
      // Se não há dados iniciais, usar a conta Cora por padrão
      setFormData(prev => ({ ...prev, conta_id: contaCora.id }));
      setValorNumerico(0);
    }
  }, [initialData, contaCora, compra.id]);

  const handleValorChange = (numericValue: number) => {
    console.log('💰 Valor numérico recebido:', numericValue);
    
    setValorNumerico(numericValue);
    setFormData(prev => ({ ...prev, valor_pago: numericValue.toString() }));
    
    if (errors.valor_pago && numericValue > 0) {
      setErrors(prev => ({ ...prev, valor_pago: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.conta_id) {
      newErrors.conta_id = 'Conta é obrigatória';
    }

    if (!formData.data_pagamento) {
      newErrors.data_pagamento = 'Data é obrigatória';
    }

    if (valorNumerico <= 0) {
      newErrors.valor_pago = 'Valor deve ser maior que zero';
    }

    if (valorNumerico > compra.saldo_aberto) {
      newErrors.valor_pago = `Valor não pode exceder o saldo aberto (${formatBRL(compra.saldo_aberto)})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Dados do formulário de pagamento:', formData);
    console.log('📝 Valor numérico:', valorNumerico);
    
    if (validateForm()) {
      const dataToSubmit: NovoPagamentoForm = {
        ...formData,
        valor_pago: currencyMask.ensureTwoDecimals(valorNumerico).toString(),
        observacao: formData.observacao?.trim() || null
      };
      
      console.log('📝 Dados do pagamento a serem enviados:', dataToSubmit);
      onSubmit(dataToSubmit);
    } else {
      console.log('❌ Erros de validação:', errors);
    }
  };

  const handlePagarTudo = () => {
    setValorNumerico(compra.saldo_aberto);
    setFormData(prev => ({ ...prev, valor_pago: compra.saldo_aberto.toString() }));
    if (errors.valor_pago) {
      setErrors(prev => ({ ...prev, valor_pago: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Informações da compra */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Compra</h4>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Fornecedor:</span> {compra.fornecedor_nome}</p>
          <p><span className="font-medium">Descrição:</span> {compra.descricao}</p>
          <p><span className="font-medium">Valor Total:</span> {formatBRL(compra.valor_total)}</p>
          <p><span className="font-medium">Saldo Aberto:</span> 
            <span className="font-mono text-red-600 ml-1">{formatBRL(compra.saldo_aberto)}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data">Data do Pagamento *</Label>
          <Input
            id="data"
            type="date"
            value={formData.data_pagamento}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, data_pagamento: e.target.value }));
              if (errors.data_pagamento) setErrors(prev => ({ ...prev, data_pagamento: '' }));
            }}
            className={errors.data_pagamento ? 'border-red-500' : ''}
          />
          {errors.data_pagamento && <p className="text-sm text-red-500">{errors.data_pagamento}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="valor">Valor Pago *</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePagarTudo}
              className="text-xs"
            >
              Pagar Tudo
            </Button>
          </div>
          <CurrencyInput
            id="valor"
            value={valorNumerico}
            onChange={handleValorChange}
            placeholder="Digite o valor..."
            showError={!!errors.valor_pago}
            errorMessage={errors.valor_pago}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="conta">Conta *</Label>
        <Select
          value={formData.conta_id}
          onValueChange={(value) => {
            setFormData(prev => ({ ...prev, conta_id: value }));
            if (errors.conta_id) setErrors(prev => ({ ...prev, conta_id: '' }));
          }}
        >
          <SelectTrigger className={errors.conta_id ? 'border-red-500' : ''}>
            <SelectValue placeholder="Selecione uma conta" />
          </SelectTrigger>
          <SelectContent>
            {contas.map((conta) => (
              <SelectItem key={conta.id} value={conta.id}>
                {conta.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.conta_id && <p className="text-sm text-red-500">{errors.conta_id}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacao">Observação</Label>
        <Textarea
          id="observacao"
          value={formData.observacao || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
          placeholder="Digite observações sobre o pagamento..."
          rows={3}
        />
      </div>

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
          {loading ? 'Salvando...' : 'Registrar Pagamento'}
        </Button>
      </div>
    </form>
  );
}