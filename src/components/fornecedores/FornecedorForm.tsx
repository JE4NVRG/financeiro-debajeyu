import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../ui/toast';

interface Fornecedor {
  id?: string;
  nome: string;
  tipo?: 'Fornecedor' | 'Prestador de Serviço';
}

interface FornecedorFormProps {
  fornecedor?: any;
  onSubmit: (fornecedor: any) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export function FornecedorForm({ fornecedor, onSubmit, onCancel, loading = false }: FornecedorFormProps) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState<Omit<Fornecedor, 'id'>>({
    nome: fornecedor?.nome || '',
    tipo: fornecedor?.tipo || 'Fornecedor'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      addToast({
        title: 'Erro',
        description: 'Nome do fornecedor é obrigatório',
        type: 'error'
      });
      return;
    }

    try {
      await onSubmit(formData);
      addToast({
        title: 'Sucesso',
        description: fornecedor ? 'Fornecedor atualizado com sucesso' : 'Fornecedor criado com sucesso',
        type: 'success'
      });
    } catch (error) {
      addToast({
        title: 'Erro',
        description: 'Erro ao salvar fornecedor',
        type: 'error'
      });
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              placeholder="Nome do fornecedor"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => handleChange('tipo', value as 'Fornecedor' | 'Prestador de Serviço')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                <SelectItem value="Prestador de Serviço">Prestador de Serviço</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (fornecedor ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}