import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { NovoMarketplaceForm } from '../types/database';

interface MarketplaceFormProps {
  onSubmit: (data: NovoMarketplaceForm) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: Partial<NovoMarketplaceForm>;
}

export function MarketplaceForm({ 
  onSubmit, 
  onCancel, 
  loading = false, 
  initialData 
}: MarketplaceFormProps) {
  const [formData, setFormData] = useState<NovoMarketplaceForm>({
    nome: '',
    dinheiro_a_liberar: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        dinheiro_a_liberar: initialData.dinheiro_a_liberar || ''
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    console.log('Form validation result:', validateForm());
    
    if (validateForm()) {
      console.log('Calling onSubmit with:', { 
        nome: formData.nome.trim(),
        dinheiro_a_liberar: formData.dinheiro_a_liberar
      });
      onSubmit({
        nome: formData.nome.trim(),
        dinheiro_a_liberar: formData.dinheiro_a_liberar
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Marketplace *</Label>
        <Input
          id="nome"
          type="text"
          value={formData.nome}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, nome: e.target.value }));
            if (errors.nome) setErrors(prev => ({ ...prev, nome: '' }));
          }}
          placeholder="Ex: Amazon, Mercado Livre, Shopee..."
          className={errors.nome ? 'border-red-500' : ''}
        />
        {errors.nome && <p className="text-sm text-red-500">{errors.nome}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dinheiro_a_liberar">Saldo a Liberar (opcional)</Label>
        <Input
          id="dinheiro_a_liberar"
          type="text"
          value={formData.dinheiro_a_liberar}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, dinheiro_a_liberar: e.target.value }));
          }}
          placeholder="R$ 0,00"
        />
        <p className="text-xs text-gray-500">
          Valor que está bloqueado neste marketplace
        </p>
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