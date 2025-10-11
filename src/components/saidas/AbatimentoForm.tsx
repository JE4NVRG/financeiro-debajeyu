import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CurrencyInput } from '../ui/CurrencyInput';
import { NovoAbatimentoForm } from '../../types/database';
import { getCurrentDate, formatBRL } from '../../lib/utils';
import { useContas } from '../../hooks/useContas';
import { useSocios } from '../../hooks/useSocios';
import { useCurrencyMask } from '../../hooks/useCurrencyMask';
import { AlertCircle, Users, DollarSign } from 'lucide-react';

interface AbatimentoFormProps {
  onSubmit: (data: NovoAbatimentoForm) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: Partial<NovoAbatimentoForm>;
}

export function AbatimentoForm({ 
  onSubmit, 
  onCancel, 
  loading = false, 
  initialData 
}: AbatimentoFormProps) {
  const [formData, setFormData] = useState<NovoAbatimentoForm>({
    socio_id: '',
    conta_id: '',
    valor: '',
    data_abatimento: getCurrentDate(),
    observacao: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [valorNumerico, setValorNumerico] = useState<number>(0);

  const { contas } = useContas();
  const { socios } = useSocios();
  const currencyMask = useCurrencyMask();

  // Encontrar a conta Cora automaticamente
  const contaCora = contas.find(conta => conta.nome.toLowerCase().includes('cora'));

  // Sócio selecionado
  const socioSelecionado = socios.find(s => s.id === formData.socio_id);

  useEffect(() => {
    if (initialData) {
      // Se há valor inicial, converter para número
      if (initialData.valor) {
        const numericValue = typeof initialData.valor === 'number' 
          ? initialData.valor
          : currencyMask.parseToCanonical(initialData.valor);
        setValorNumerico(numericValue);
      } else {
        setValorNumerico(0);
      }

      setFormData({
        socio_id: initialData.socio_id || '',
        conta_id: initialData.conta_id || contaCora?.id || '',
        valor: initialData.valor || '',
        data_abatimento: initialData.data_abatimento || getCurrentDate(),
        observacao: initialData.observacao || ''
      });
    } else if (contaCora) {
      // Se não há dados iniciais, usar a conta Cora por padrão
      setFormData(prev => ({ ...prev, conta_id: contaCora.id }));
      setValorNumerico(0);
    }
  }, [initialData, contaCora]);

  const handleValorChange = (numericValue: number) => {
    console.log('💰 Valor numérico recebido:', numericValue);
    
    setValorNumerico(numericValue);
    setFormData(prev => ({ ...prev, valor: numericValue.toString() }));
    
    if (errors.valor && numericValue > 0) {
      setErrors(prev => ({ ...prev, valor: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.socio_id) {
      newErrors.socio_id = 'Sócio é obrigatório';
    }

    if (!formData.conta_id) {
      newErrors.conta_id = 'Conta é obrigatória';
    }

    if (!formData.data_abatimento) {
      newErrors.data_abatimento = 'Data é obrigatória';
    }

    if (valorNumerico <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    // Validar se há saldo suficiente
    if (socioSelecionado && valorNumerico > socioSelecionado.pre_saldo) {
      newErrors.valor = `Valor não pode exceder o pré-saldo disponível (${formatBRL(socioSelecionado.pre_saldo)})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Dados do formulário de abatimento:', formData);
    console.log('📝 Valor numérico:', valorNumerico);
    
    if (validateForm()) {
      const dataToSubmit: NovoAbatimentoForm = {
        ...formData,
        valor: currencyMask.ensureTwoDecimals(valorNumerico).toString(),
        observacao: formData.observacao?.trim() || ''
      };
      
      console.log('📝 Dados do abatimento a serem enviados:', dataToSubmit);
      onSubmit(dataToSubmit);
    } else {
      console.log('❌ Erros de validação:', errors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header com informações */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-orange-900">Abatimento de Pré-Saldo</h3>
        </div>
        <p className="text-sm text-orange-700">
          Registre uma dedução do pré-saldo de um sócio/parceiro. O valor será automaticamente 
          descontado do saldo disponível.
        </p>
      </div>

      {/* Seleção do Sócio */}
      <div className="space-y-2">
        <Label htmlFor="socio">Sócio/Parceiro *</Label>
        <Select
          value={formData.socio_id}
          onValueChange={(value) => {
            setFormData(prev => ({ ...prev, socio_id: value }));
            if (errors.socio_id) setErrors(prev => ({ ...prev, socio_id: '' }));
          }}
        >
          <SelectTrigger className={errors.socio_id ? 'border-red-500' : ''}>
            <SelectValue placeholder="Selecione um sócio" />
          </SelectTrigger>
          <SelectContent>
            {socios.map((socio) => (
              <SelectItem key={socio.id} value={socio.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{socio.nome}</span>
                  <Badge variant="secondary" className="ml-2">
                    {formatBRL(socio.pre_saldo)}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.socio_id && (
          <p className="text-sm text-red-500">{errors.socio_id}</p>
        )}
      </div>

      {/* Informações do Sócio Selecionado */}
      {socioSelecionado && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-900 text-base">
              <DollarSign className="h-4 w-4" />
              Informações do Sócio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700">Nome:</span>
              <span className="text-sm text-blue-900">{socioSelecionado.nome}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-700">Pré-Saldo Disponível:</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {formatBRL(socioSelecionado.pre_saldo)}
              </Badge>
            </div>
            {socioSelecionado.pre_saldo <= 0 && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-700">
                  Este sócio não possui pré-saldo disponível para abatimento.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Valor do Abatimento */}
      <div className="space-y-2">
        <Label htmlFor="valor">Valor do Abatimento *</Label>
        <CurrencyInput
          id="valor"
          value={valorNumerico}
          onChange={handleValorChange}
          placeholder="R$ 0,00"
          className={errors.valor ? 'border-red-500' : ''}
          disabled={!socioSelecionado || socioSelecionado.pre_saldo <= 0}
        />
        {errors.valor && (
          <p className="text-sm text-red-500">{errors.valor}</p>
        )}
        {socioSelecionado && valorNumerico > 0 && valorNumerico <= socioSelecionado.pre_saldo && (
          <p className="text-sm text-green-600">
            Saldo restante após abatimento: {formatBRL(socioSelecionado.pre_saldo - valorNumerico)}
          </p>
        )}
      </div>

      {/* Data do Abatimento */}
      <div className="space-y-2">
        <Label htmlFor="data">Data do Abatimento *</Label>
        <Input
          id="data"
          type="date"
          value={formData.data_abatimento}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, data_abatimento: e.target.value }));
            if (errors.data_abatimento) setErrors(prev => ({ ...prev, data_abatimento: '' }));
          }}
          className={errors.data_abatimento ? 'border-red-500' : ''}
        />
        {errors.data_abatimento && (
          <p className="text-sm text-red-500">{errors.data_abatimento}</p>
        )}
      </div>

      {/* Conta */}
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
        {errors.conta_id && (
          <p className="text-sm text-red-500">{errors.conta_id}</p>
        )}
      </div>

      {/* Observação */}
      <div className="space-y-2">
        <Label htmlFor="observacao">Observação</Label>
        <Textarea
          id="observacao"
          value={formData.observacao}
          onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
          placeholder="Descreva o motivo do abatimento (opcional)"
          rows={3}
        />
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={loading || !socioSelecionado || socioSelecionado.pre_saldo <= 0}
          className="bg-orange-600 hover:bg-orange-700"
        >
          {loading ? 'Processando...' : 'Registrar Abatimento'}
        </Button>
      </div>
    </form>
  );
}