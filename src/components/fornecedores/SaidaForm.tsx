import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CurrencyInput } from '../ui/CurrencyInput';
import { NovaSaidaForm, CompraComSaldo } from '../../types/database';
import { getCurrentDate, formatBRL } from '../../lib/utils';
import { useContas } from '../../hooks/useContas';
import { useFornecedores } from '../../hooks/useFornecedores';
import { useCompras } from '../../hooks/useCompras';
import { useCurrencyMask } from '../../hooks/useCurrencyMask';

interface SaidaFormProps {
  onSubmit: (data: NovaSaidaForm) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: Partial<NovaSaidaForm>;
  compras?: CompraComSaldo[];
  fornecedores?: any[];
}

export function SaidaForm({ 
  onSubmit, 
  onCancel, 
  loading = false, 
  initialData 
}: SaidaFormProps) {
  const [formData, setFormData] = useState<NovaSaidaForm>({
    fornecedor_id: '',
    compra_id: null,
    conta_id: '',
    data_pagamento: getCurrentDate(),
    valor_pago: '',
    observacao: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [valorNumerico, setValorNumerico] = useState<number>(0);
  const [comprasEmAberto, setComprasEmAberto] = useState<CompraComSaldo[]>([]);

  const { contas } = useContas();
  const { fornecedores } = useFornecedores();
  const { compras } = useCompras();
  const currencyMask = useCurrencyMask();

  // Encontrar a conta Cora automaticamente
  const contaCora = contas.find(conta => conta.nome.toLowerCase().includes('cora'));

  // Filtrar apenas fornecedores ativos
  const fornecedoresAtivos = fornecedores.filter(f => f.status === 'Ativo');

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
        fornecedor_id: initialData.fornecedor_id || '',
        compra_id: initialData.compra_id || null,
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
  }, [initialData, contaCora]);

  // Filtrar compras em aberto quando fornecedor for selecionado
  useEffect(() => {
    if (formData.fornecedor_id) {
      const comprasDoFornecedor = compras
        .filter(compra => 
          compra.fornecedor_id === formData.fornecedor_id && 
          compra.status !== 'Quitada' &&
          compra.saldo_aberto > 0
        )
        .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()); // Mais antigas primeiro
      
      setComprasEmAberto(comprasDoFornecedor);
      
      // Se não há compra selecionada e há compras em aberto, limpar seleção
      if (formData.compra_id && !comprasDoFornecedor.find(c => c.id === formData.compra_id)) {
        setFormData(prev => ({ ...prev, compra_id: null }));
      }
    } else {
      setComprasEmAberto([]);
      setFormData(prev => ({ ...prev, compra_id: null }));
    }
  }, [formData.fornecedor_id, compras]);

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

    if (!formData.fornecedor_id) {
      newErrors.fornecedor_id = 'Fornecedor é obrigatório';
    }

    if (!formData.conta_id) {
      newErrors.conta_id = 'Conta é obrigatória';
    }

    if (!formData.data_pagamento) {
      newErrors.data_pagamento = 'Data é obrigatória';
    }

    if (valorNumerico <= 0) {
      newErrors.valor_pago = 'Valor deve ser maior que zero';
    }

    // Se há compra específica selecionada, validar saldo
    if (formData.compra_id) {
      const compraEscolhida = comprasEmAberto.find(c => c.id === formData.compra_id);
      if (compraEscolhida && valorNumerico > compraEscolhida.saldo_aberto) {
        newErrors.valor_pago = `Valor não pode exceder o saldo aberto (${formatBRL(compraEscolhida.saldo_aberto)})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Dados do formulário de saída:', formData);
    console.log('📝 Valor numérico:', valorNumerico);
    
    if (validateForm()) {
      const dataToSubmit: NovaSaidaForm = {
        ...formData,
        valor_pago: currencyMask.ensureTwoDecimals(valorNumerico).toString(),
        observacao: formData.observacao?.trim() || null
      };
      
      console.log('📝 Dados da saída a serem enviados:', dataToSubmit);
      onSubmit(dataToSubmit);
    } else {
      console.log('❌ Erros de validação:', errors);
    }
  };

  const compraEscolhida = formData.compra_id 
    ? comprasEmAberto.find(c => c.id === formData.compra_id)
    : null;

  const handlePagarTudo = () => {
    if (compraEscolhida) {
      setValorNumerico(compraEscolhida.saldo_aberto);
      setFormData(prev => ({ ...prev, valor_pago: compraEscolhida.saldo_aberto.toString() }));
      if (errors.valor_pago) {
        setErrors(prev => ({ ...prev, valor_pago: '' }));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fornecedor">Fornecedor *</Label>
        <Select
          value={formData.fornecedor_id}
          onValueChange={(value) => {
            setFormData(prev => ({ ...prev, fornecedor_id: value, compra_id: null }));
            if (errors.fornecedor_id) setErrors(prev => ({ ...prev, fornecedor_id: '' }));
          }}
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

      {formData.fornecedor_id && comprasEmAberto.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="compra">Compra Específica (opcional)</Label>
          <Select
            value={formData.compra_id || 'avulso'}
            onValueChange={(value) => {
              setFormData(prev => ({ ...prev, compra_id: value === 'avulso' ? null : value }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma compra ou deixe em branco para pagamento avulso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="avulso">Pagamento avulso (nova compra)</SelectItem>
              {comprasEmAberto.map((compra) => (
                <SelectItem key={compra.id} value={compra.id}>
                  {compra.descricao} - {formatBRL(compra.saldo_aberto)} em aberto
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Informações da compra selecionada */}
      {compraEscolhida && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Compra Selecionada</h4>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Descrição:</span> {compraEscolhida.descricao}</p>
            <p><span className="font-medium">Valor Total:</span> {formatBRL(compraEscolhida.valor_total)}</p>
            <p><span className="font-medium">Saldo Aberto:</span> 
              <span className="font-mono text-red-600 ml-1">{formatBRL(compraEscolhida.saldo_aberto)}</span>
            </p>
          </div>
        </div>
      )}

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
            {compraEscolhida && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePagarTudo}
                className="text-xs"
              >
                Pagar Tudo
              </Button>
            )}
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
          {loading ? 'Salvando...' : 'Registrar Saída'}
        </Button>
      </div>
    </form>
  );
}