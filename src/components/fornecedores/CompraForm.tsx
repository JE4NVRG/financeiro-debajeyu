import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { CalendarIcon, Calculator } from 'lucide-react';
import { formatBRL, parseBRLToNumber } from '../../lib/utils';
import { useToast } from '../ui/toast';

interface CompraFormData {
  produto: string;
  valor: string;
  quantidade: string;
  data_compra: string;
  observacao?: string;
}

interface CompraFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CompraFormData & { preco_medio: number; valor_total: number }) => Promise<void>;
  fornecedorNome: string;
  loading?: boolean;
}

export function CompraForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  fornecedorNome,
  loading = false 
}: CompraFormProps) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState<CompraFormData>({
    produto: '',
    valor: '',
    quantidade: '',
    data_compra: new Date().toISOString().split('T')[0],
    observacao: ''
  });

  const [valorNumerico, setValorNumerico] = useState(0);
  const [quantidadeNumerica, setQuantidadeNumerica] = useState(0);
  const [precoMedio, setPrecoMedio] = useState(0);

  // Calcular preço médio automaticamente
  useEffect(() => {
    if (valorNumerico > 0 && quantidadeNumerica > 0) {
      const medio = valorNumerico / quantidadeNumerica;
      setPrecoMedio(medio);
    } else {
      setPrecoMedio(0);
    }
  }, [valorNumerico, quantidadeNumerica]);

  const handleValorChange = (value: string) => {
    setFormData(prev => ({ ...prev, valor: value }));
    const numerico = parseBRLToNumber(value);
    setValorNumerico(numerico);
  };

  const handleQuantidadeChange = (value: string) => {
    // Permitir apenas números e vírgula/ponto para decimais
    const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
    setFormData(prev => ({ ...prev, quantidade: cleanValue }));
    const numerico = parseFloat(cleanValue) || 0;
    setQuantidadeNumerica(numerico);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.produto.trim()) {
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Nome do produto é obrigatório'
      });
      return;
    }

    if (valorNumerico <= 0) {
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Valor deve ser maior que zero'
      });
      return;
    }

    if (quantidadeNumerica <= 0) {
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Quantidade deve ser maior que zero'
      });
      return;
    }

    if (!formData.data_compra) {
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Data da compra é obrigatória'
      });
      return;
    }

    try {
      await onSubmit({
        ...formData,
        preco_medio: precoMedio,
        valor_total: valorNumerico
      });

      // Limpar formulário após sucesso
      setFormData({
        produto: '',
        valor: '',
        quantidade: '',
        data_compra: new Date().toISOString().split('T')[0],
        observacao: ''
      });
      setValorNumerico(0);
      setQuantidadeNumerica(0);
      setPrecoMedio(0);

      onClose();
    } catch (error) {
      console.error('Erro ao salvar compra:', error);
    }
  };

  const handleClose = () => {
    // Limpar formulário ao fechar
    setFormData({
      produto: '',
      valor: '',
      quantidade: '',
      data_compra: new Date().toISOString().split('T')[0],
      observacao: ''
    });
    setValorNumerico(0);
    setQuantidadeNumerica(0);
    setPrecoMedio(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Lançar Despesa - {fornecedorNome}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Produto */}
          <div className="space-y-2">
            <Label htmlFor="produto">Nome do Produto *</Label>
            <Input
              id="produto"
              value={formData.produto}
              onChange={(e) => setFormData(prev => ({ ...prev, produto: e.target.value }))}
              placeholder="Digite o nome do produto"
              required
            />
          </div>

          {/* Valor Total */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor Total *</Label>
            <Input
              id="valor"
              value={formData.valor}
              onChange={(e) => handleValorChange(e.target.value)}
              placeholder="R$ 0,00"
              required
            />
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade *</Label>
            <Input
              id="quantidade"
              value={formData.quantidade}
              onChange={(e) => handleQuantidadeChange(e.target.value)}
              placeholder="Ex: 10 ou 2.5"
              required
            />
          </div>

          {/* Data da Compra */}
          <div className="space-y-2">
            <Label htmlFor="data_compra">Data da Compra *</Label>
            <div className="relative">
              <Input
                id="data_compra"
                type="date"
                value={formData.data_compra}
                onChange={(e) => setFormData(prev => ({ ...prev, data_compra: e.target.value }))}
                required
              />
              <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Preço Médio Calculado */}
          {precoMedio > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Preço Médio: {formatBRL(precoMedio)}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Calculado automaticamente: {formatBRL(valorNumerico)} ÷ {quantidadeNumerica} = {formatBRL(precoMedio)}
                </p>
              </CardContent>
            </Card>
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
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Despesa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}