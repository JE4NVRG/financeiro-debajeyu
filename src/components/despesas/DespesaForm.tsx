import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { CurrencyInput } from '../ui/CurrencyInput';
import { NovaDespesaForm, RecorrenciaConfig } from '../../types/database';
import { getCurrentDate } from '../../lib/utils';
import { useContas } from '../../hooks/useContas';
import { useDespesas } from '../../hooks/useDespesas';
import { useCurrencyMask } from '../../hooks/useCurrencyMask';

interface DespesaFormProps {
  onSubmit: (data: NovaDespesaForm) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: Partial<NovaDespesaForm>;
}

export function DespesaForm({ onSubmit, onCancel, loading = false, initialData }: DespesaFormProps) {
  const [formData, setFormData] = useState<NovaDespesaForm>({
    descricao: '',
    valor: '',
    categoria_id: '',
    conta_id: '',
    subtipo: 'avulsa',
    data_vencimento: getCurrentDate(),
    observacoes: '',
    status: 'pendente'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [valorNumerico, setValorNumerico] = useState<number>(0);
  const [showRecorrencia, setShowRecorrencia] = useState(false);
  const [marcarComoPago, setMarcarComoPago] = useState(false);
  const [recorrenciaConfig, setRecorrenciaConfig] = useState<RecorrenciaConfig>({
    tipo: 'mensal',
    dia_vencimento: 1
  });

  const { contas } = useContas();
  const { categorias } = useDespesas();
  const currencyMask = useCurrencyMask();

  useEffect(() => {
    if (initialData) {
      if (initialData.valor) {
        const numericValue = typeof initialData.valor === 'number' 
          ? initialData.valor
          : currencyMask.parseToCanonical(initialData.valor);
        setValorNumerico(numericValue);
      }

      setFormData({
        descricao: initialData.descricao || '',
        valor: initialData.valor || '',
        categoria_id: initialData.categoria_id || '',
        conta_id: initialData.conta_id || '',
        subtipo: initialData.subtipo || 'avulsa',
        data_vencimento: initialData.data_vencimento || getCurrentDate(),
        observacoes: initialData.observacoes || '',
        status: initialData.status || 'pendente',
        data_pagamento: initialData.data_pagamento,
        recorrencia_config: initialData.recorrencia_config
      });

      // Se a despesa já está paga, marcar o checkbox
      if (initialData.status === 'pago') {
        setMarcarComoPago(true);
      }

      if (initialData.subtipo === 'recorrente') {
        setShowRecorrencia(true);
        if (initialData.recorrencia_config) {
          setRecorrenciaConfig(initialData.recorrencia_config);
        }
      }
    }
  }, [initialData]);

  const handleValorChange = (numericValue: number) => {
    setValorNumerico(numericValue);
    setFormData(prev => ({ ...prev, valor: numericValue.toString() }));
    
    if (errors.valor && numericValue > 0) {
      setErrors(prev => ({ ...prev, valor: '' }));
    }
  };

  const handleSubtipoChange = (subtipo: 'recorrente' | 'avulsa') => {
    setFormData(prev => ({ ...prev, subtipo }));
    setShowRecorrencia(subtipo === 'recorrente');
    
    if (subtipo === 'avulsa') {
      setFormData(prev => ({ ...prev, recorrencia_config: undefined }));
    } else {
      setFormData(prev => ({ ...prev, recorrencia_config: recorrenciaConfig }));
    }
  };

  const handleRecorrenciaChange = (field: keyof RecorrenciaConfig, value: any) => {
    const newConfig = { ...recorrenciaConfig, [field]: value };
    setRecorrenciaConfig(newConfig);
    setFormData(prev => ({ ...prev, recorrencia_config: newConfig }));
  };

  const handleMarcarComoPagoChange = (checked: boolean) => {
    setMarcarComoPago(checked);
    if (checked) {
      setFormData(prev => ({ 
        ...prev, 
        status: 'pago',
        data_pagamento: getCurrentDate()
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        status: 'pendente',
        data_pagamento: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (valorNumerico <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    if (!formData.categoria_id) {
      newErrors.categoria_id = 'Categoria é obrigatória';
    }

    if (!formData.conta_id) {
      newErrors.conta_id = 'Conta é obrigatória';
    }

    if (!formData.data_vencimento) {
      newErrors.data_vencimento = 'Data de vencimento é obrigatória';
    }

    if (formData.subtipo === 'recorrente') {
      if (!recorrenciaConfig.tipo) {
        newErrors.recorrencia_tipo = 'Tipo de recorrência é obrigatório';
      }
      
      if (recorrenciaConfig.dia_vencimento < 1 || recorrenciaConfig.dia_vencimento > 31) {
        newErrors.dia_vencimento = 'Dia deve estar entre 1 e 31';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const dataToSubmit: NovaDespesaForm = {
        ...formData,
        valor: currencyMask.ensureTwoDecimals(valorNumerico).toString(),
        recorrencia_config: formData.subtipo === 'recorrente' ? recorrenciaConfig : undefined
      };
      
      onSubmit(dataToSubmit);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição *</Label>
        <Input
          id="descricao"
          value={formData.descricao}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, descricao: e.target.value }));
            if (errors.descricao) setErrors(prev => ({ ...prev, descricao: '' }));
          }}
          placeholder="Ex: Aluguel, Energia elétrica..."
          className={errors.descricao ? 'border-red-500' : ''}
        />
        {errors.descricao && <p className="text-sm text-red-500">{errors.descricao}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valor">Valor *</Label>
          <CurrencyInput
            id="valor"
            value={valorNumerico}
            onChange={handleValorChange}
            placeholder="Digite o valor..."
            showError={!!errors.valor}
            errorMessage={errors.valor}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
          <Input
            id="data_vencimento"
            type="date"
            value={formData.data_vencimento}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, data_vencimento: e.target.value }));
              if (errors.data_vencimento) setErrors(prev => ({ ...prev, data_vencimento: '' }));
            }}
            className={errors.data_vencimento ? 'border-red-500' : ''}
          />
          {errors.data_vencimento && <p className="text-sm text-red-500">{errors.data_vencimento}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria *</Label>
          <Select
            value={formData.categoria_id}
            onValueChange={(value) => {
              setFormData(prev => ({ ...prev, categoria_id: value }));
              if (errors.categoria_id) setErrors(prev => ({ ...prev, categoria_id: '' }));
            }}
          >
            <SelectTrigger className={errors.categoria_id ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((categoria) => (
                <SelectItem key={categoria.id} value={categoria.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: categoria.cor }}
                    />
                    {categoria.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoria_id && <p className="text-sm text-red-500">{errors.categoria_id}</p>}
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtipo">Tipo de Despesa *</Label>
        <Select
          value={formData.subtipo}
          onValueChange={handleSubtipoChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="avulsa">Avulsa (única vez)</SelectItem>
            <SelectItem value="recorrente">Recorrente (repetir automaticamente)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showRecorrencia && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
          <h4 className="font-medium text-blue-900">Configuração de Recorrência</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recorrencia_tipo">Frequência *</Label>
              <Select
                value={recorrenciaConfig.tipo}
                onValueChange={(value: any) => handleRecorrenciaChange('tipo', value)}
              >
                <SelectTrigger className={errors.recorrencia_tipo ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="bimestral">Bimestral</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
              {errors.recorrencia_tipo && <p className="text-sm text-red-500">{errors.recorrencia_tipo}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dia_vencimento">Dia do Vencimento *</Label>
              <Input
                id="dia_vencimento"
                type="number"
                min="1"
                max="31"
                value={recorrenciaConfig.dia_vencimento}
                onChange={(e) => handleRecorrenciaChange('dia_vencimento', parseInt(e.target.value))}
                className={errors.dia_vencimento ? 'border-red-500' : ''}
              />
              {errors.dia_vencimento && <p className="text-sm text-red-500">{errors.dia_vencimento}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_fim">Data Limite (opcional)</Label>
              <Input
                id="data_fim"
                type="date"
                value={recorrenciaConfig.data_fim || ''}
                onChange={(e) => handleRecorrenciaChange('data_fim', e.target.value || undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidade_parcelas">Ou Quantidade de Parcelas</Label>
              <Input
                id="quantidade_parcelas"
                type="number"
                min="1"
                value={recorrenciaConfig.quantidade_parcelas || ''}
                onChange={(e) => handleRecorrenciaChange('quantidade_parcelas', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Ex: 12 parcelas"
              />
            </div>
          </div>

          <p className="text-sm text-blue-700">
            💡 A próxima despesa será gerada automaticamente quando esta for marcada como paga.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
          placeholder="Observações adicionais..."
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2 p-4 bg-green-50 rounded-lg border border-green-200">
        <Checkbox
          id="marcar-como-pago"
          checked={marcarComoPago}
          onCheckedChange={handleMarcarComoPagoChange}
        />
        <Label 
          htmlFor="marcar-como-pago" 
          className="text-sm font-medium text-green-700 cursor-pointer"
        >
          💰 Marcar como pago (será debitado automaticamente da conta selecionada)
        </Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Despesa'}
        </Button>
      </div>
    </form>
  );
}