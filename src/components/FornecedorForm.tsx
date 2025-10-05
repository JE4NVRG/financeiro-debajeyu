import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { NovoFornecedorForm } from '../types/database';

interface FornecedorFormProps {
  onSubmit: (data: NovoFornecedorForm) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: Partial<NovoFornecedorForm>;
}

export function FornecedorForm({ onSubmit, onCancel, loading = false, initialData }: FornecedorFormProps) {
  const [formData, setFormData] = useState<NovoFornecedorForm>({
    nome: '',
    tipo: 'Camisa',
    status: 'Ativo',
    observacao: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        tipo: initialData.tipo || 'Camisa',
        status: initialData.status || 'Ativo',
        observacao: initialData.observacao || ''
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.tipo) {
      newErrors.tipo = 'Tipo é obrigatório';
    }

    if (!formData.status) {
      newErrors.status = 'Status é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Dados do formulário de fornecedor:', formData);
    
    if (validateForm()) {
      const dataToSubmit: NovoFornecedorForm = {
        ...formData,
        nome: formData.nome.trim(),
        observacao: formData.observacao?.trim() || null
      };
      
      console.log('📝 Dados do fornecedor a serem enviados:', dataToSubmit);
      onSubmit(dataToSubmit);
    } else {
      console.log('❌ Erros de validação:', errors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          type="text"
          value={formData.nome}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, nome: e.target.value }));
            if (errors.nome) setErrors(prev => ({ ...prev, nome: '' }));
          }}
          placeholder="Digite o nome do fornecedor..."
          className={errors.nome ? 'border-red-500' : ''}
        />
        {errors.nome && <p className="text-sm text-red-500">{errors.nome}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo *</Label>
          <Select
            value={formData.tipo}
            onValueChange={(value) => {
              setFormData(prev => ({ ...prev, tipo: value as 'Camisa' | 'Gráfica' | 'Outros' }));
              if (errors.tipo) setErrors(prev => ({ ...prev, tipo: '' }));
            }}
          >
            <SelectTrigger className={errors.tipo ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pessoa Física">Pessoa Física</SelectItem>
              <SelectItem value="Pessoa Jurídica">Pessoa Jurídica</SelectItem>
              <SelectItem value="Camisa">Camisa</SelectItem>
              <SelectItem value="Gráfica">Gráfica</SelectItem>
              <SelectItem value="Outros">Outros</SelectItem>
            </SelectContent>
          </Select>
          {errors.tipo && <p className="text-sm text-red-500">{errors.tipo}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => {
              setFormData(prev => ({ ...prev, status: value as 'Ativo' | 'Inativo' }));
              if (errors.status) setErrors(prev => ({ ...prev, status: '' }));
            }}
          >
            <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacao">Observação</Label>
        <Textarea
          id="observacao"
          value={formData.observacao || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
          placeholder="Digite observações sobre o fornecedor..."
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
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}