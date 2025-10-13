import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  CreditCard, 
  History, 
  AlertTriangle, 
  Calculator,
  Calendar,
  DollarSign
} from 'lucide-react';
import { usePagamentoParcial } from '@/hooks/usePagamentoParcial';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Compra {
  id: string;
  fornecedor_id: string;
  descricao: string;
  valor_total: number;
  valor_pago: number;
  saldo_aberto: number;
  status: string;
  data: string;
  fornecedores?: {
    nome: string;
  };
}

interface HistoricoPagamento {
  id: string;
  data_pagamento: string;
  valor_pago: number;
  conta_nome: string;
  observacao?: string;
  tipo_pagamento: string;
  pagamento_automatico: boolean;
}

interface PagamentoParcialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compra: Compra | null;
  onSuccess?: () => void;
}

export const PagamentoParcialModal: React.FC<PagamentoParcialModalProps> = ({
  open,
  onOpenChange,
  compra,
  onSuccess
}) => {
  const [valorPagamento, setValorPagamento] = useState('');
  const [contaSelecionada, setContaSelecionada] = useState('');
  const [observacao, setObservacao] = useState('');
  const [historico, setHistorico] = useState<HistoricoPagamento[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [validacao, setValidacao] = useState<any>(null);

  const { 
    pagarParcial, 
    buscarHistoricoPagamentos, 
    buscarDetalhesCompra,
    validarSaldoConta,
    loading 
  } = usePagamentoParcial();

  // Carregar dados quando modal abrir
  useEffect(() => {
    if (open && compra) {
      carregarDados();
    }
  }, [open, compra]);

  // Reset estado quando modal fechar
  useEffect(() => {
    if (!open) {
      setValorPagamento('');
      setContaSelecionada('');
      setObservacao('');
      setHistorico([]);
      setContas([]);
      setValidacao(null);
    }
  }, [open]);

  const carregarDados = async () => {
    if (!compra) return;

    try {
      // Buscar histórico de pagamentos
      const historicoData = await buscarHistoricoPagamentos(compra.id);
      const historicoFormatado = historicoData?.map(item => ({
        id: item.id,
        data_pagamento: item.data_pagamento,
        valor_pago: item.valor_pago,
        conta_nome: item.conta_nome,
        observacao: item.observacao,
        tipo_pagamento: item.tipo_pagamento,
        pagamento_automatico: true // Valor padrão
      })) || [];
      setHistorico(historicoFormatado);

      // Buscar detalhes atualizados da compra
      const detalhes = await buscarDetalhesCompra(compra.id);
      
      // Buscar conta Cora usando a mesma lógica do pagamento total
      const { data: contasData, error: contasError } = await supabase
        .from('contas')
        .select('*')
        .eq('is_cora_account', true)
        .single();

      if (contasError) {
        console.error('Erro ao buscar conta Cora:', contasError);
        toast.error('Erro ao carregar informações da conta Cora');
        return;
      }

      if (!contasData) {
        console.error('Conta Cora não encontrada');
        toast.error('Conta Cora não encontrada');
        return;
      }

      const contasDisponiveis = [
        { 
          id: contasData.id, 
          nome: contasData.nome, 
          saldo_atual: contasData.saldo_atual, // Usar saldo_atual da tabela contas
          is_cora_account: true 
        }
      ];
      setContas(contasDisponiveis);
      setContaSelecionada(contasData.id);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  // Validar valor quando mudar
  useEffect(() => {
    if (valorPagamento && contaSelecionada && compra) {
      const valor = parseFloat(valorPagamento.replace(/[^\d,]/g, '').replace(',', '.'));
      if (valor > 0) {
        validarPagamento(valor);
      }
    }
  }, [valorPagamento, contaSelecionada, compra]);

  const validarPagamento = async (valor: number) => {
    if (!contaSelecionada) return;

    const validacaoResult = await validarSaldoConta(contaSelecionada, valor);
    setValidacao(validacaoResult);
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Permitir apenas números, vírgula e ponto
    value = value.replace(/[^\d,.]/g, '');
    
    // Permitir apenas uma vírgula ou ponto
    const commaCount = (value.match(/,/g) || []).length;
    const dotCount = (value.match(/\./g) || []).length;
    
    if (commaCount > 1) {
      value = value.replace(/,(?=.*,)/, '');
    }
    if (dotCount > 1) {
      value = value.replace(/\.(?=.*\.)/, '');
    }
    
    // Definir o valor diretamente sem formatação para permitir digitação livre
    setValorPagamento(value);
  };

  const handleConfirmarPagamento = async () => {
    if (!compra || !valorPagamento || !contaSelecionada) return;

    const valor = parseFloat(valorPagamento.replace(/[^\d,]/g, '').replace(',', '.'));
    
    if (valor <= 0 || valor > compra.saldo_aberto) {
      return;
    }

    console.log('🎯 Confirmando pagamento parcial:', {
      compraId: compra.id,
      valor,
      contaId: contaSelecionada,
      observacao
    });

    const result = await pagarParcial(compra.id, contaSelecionada, valor, observacao);
    
    if (result.success) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (!compra) return null;

  const valorNumerico = valorPagamento ? 
    parseFloat(valorPagamento.replace(/[^\d,]/g, '').replace(',', '.')) : 0;
  
  const podeProcessar = valorNumerico > 0 && 
                       valorNumerico <= compra.saldo_aberto && 
                       validacao?.pode_processar && 
                       contaSelecionada;

  const saldoRestante = compra.saldo_aberto - valorNumerico;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Pagamento Parcial - {compra.fornecedores?.nome}
          </DialogTitle>
          <DialogDescription>
            Realize um pagamento parcial e acompanhe o histórico de pagamentos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo da Compra */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Resumo da Compra</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Descrição:</span>
                  <p className="font-medium">{compra.descricao}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Data:</span>
                  <p>{formatDate(compra.data)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-sm text-gray-600">Valor Total</span>
                  <p className="font-bold text-lg">{formatCurrency(compra.valor_total)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Já Pago</span>
                  <p className="font-bold text-lg text-green-600">
                    {formatCurrency(compra.valor_pago || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Saldo Aberto</span>
                  <p className="font-bold text-lg text-red-600">
                    {formatCurrency(compra.saldo_aberto)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulário de Pagamento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Novo Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valor">Valor do Pagamento</Label>
                  <Input
                    id="valor"
                    placeholder="0,00"
                    value={valorPagamento}
                    onChange={handleValorChange}
                    className="text-lg font-medium"
                  />
                  {valorNumerico > compra.saldo_aberto && (
                    <p className="text-sm text-red-600 mt-1">
                      Valor não pode ser maior que o saldo aberto
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="conta">Conta para Débito</Label>
                  <select
                    id="conta"
                    value={contaSelecionada}
                    onChange={(e) => setContaSelecionada(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Selecione uma conta</option>
                    {contas.map((conta) => (
                      <option key={conta.id} value={conta.id}>
                        {conta.nome} {conta.is_cora_account && '(Cora)'} - Saldo: {formatCurrency(conta.saldo_atual)}
                      </option>
                    ))}
                  </select>
                  {contaSelecionada && contas.find(c => c.id === contaSelecionada) && (
                    <p className="text-sm text-gray-600 mt-1">
                      Saldo atual: {formatCurrency(contas.find(c => c.id === contaSelecionada)?.saldo_atual || 0)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="observacao">Observação (opcional)</Label>
                <Input
                  id="observacao"
                  placeholder="Ex: Pagamento parcial conforme acordado"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>

              {/* Previsão do Saldo Restante */}
              {valorNumerico > 0 && valorNumerico <= compra.saldo_aberto && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Saldo Restante da Compra:</span>
                        <span className="font-bold text-lg text-blue-700">
                          {formatCurrency(saldoRestante)}
                        </span>
                      </div>
                      
                      {contaSelecionada && contas.find(c => c.id === contaSelecionada) && (
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="font-medium">Saldo da Conta após pagamento:</span>
                          <span className="font-bold text-lg text-green-700">
                            {formatCurrency((contas.find(c => c.id === contaSelecionada)?.saldo_atual || 0) - valorNumerico)}
                          </span>
                        </div>
                      )}
                      
                      {saldoRestante === 0 && (
                        <p className="text-sm text-green-600 mt-1">
                          ✓ Esta compra será quitada completamente
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Validação de Saldo */}
              {validacao && !validacao.pode_processar && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Saldo Insuficiente</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      Saldo disponível: {formatCurrency(validacao.saldo_disponivel || 0)}
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Pagamentos */}
          {historico.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Histórico de Pagamentos ({historico.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {historico.map((pagamento) => (
                    <div key={pagamento.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{formatDate(pagamento.data_pagamento)}</span>
                        </div>
                        <Badge variant={pagamento.pagamento_automatico ? "default" : "secondary"}>
                          {pagamento.tipo_pagamento}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          {formatCurrency(pagamento.valor_pago)}
                        </p>
                        <p className="text-xs text-gray-500">{pagamento.conta_nome}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmarPagamento}
            disabled={!podeProcessar || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Confirmar Pagamento de {formatCurrency(valorNumerico)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};