import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react';
import { usePagamentoRapido } from '@/hooks/usePagamentoRapido';

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

interface Conta {
  id: string;
  nome: string;
  saldo_atual: number;
  is_cora_account: boolean;
}

interface PagamentoRapidoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compra: Compra | null;
  onSuccess?: () => void;
}

export const PagamentoRapidoModal: React.FC<PagamentoRapidoModalProps> = ({
  open,
  onOpenChange,
  compra,
  onSuccess
}) => {
  const [foiPago, setFoiPago] = useState(true);
  const [contaCora, setContaCora] = useState<Conta | null>(null);
  const [validacao, setValidacao] = useState<any>(null);
  
  // Ref para controlar se o componente está montado
  const isMountedRef = useRef(true);
  
  // Flag para prevenir múltiplas chamadas simultâneas
  const carregandoRef = useRef(false);
  
  // Garantir que isMountedRef seja sempre true quando o modal estiver aberto
  useEffect(() => {
    if (open) {
      isMountedRef.current = true;
      // Limpar cache quando o modal abrir para garantir dados atualizados
      setContaCora(null);
      setValidacao(null);
    }
  }, [open]);

  const { 
    pagarTotal, 
    validarSaldoCora, 
    buscarContaCora, 
    loading, 
    validandoSaldo,
    cleanup
  } = usePagamentoRapido();

  // Função memoizada para carregar dados
  const carregarDados = useCallback(async () => {
    if (!open || !compra || !isMountedRef.current || carregandoRef.current) {
      return;
    }
    
    // Marcar como carregando
    carregandoRef.current = true;
    
    try {
      // Buscar conta Cora
      const conta = await buscarContaCora();
      
      if (!isMountedRef.current) {
        return;
      }
      
      setContaCora(conta);
      
      // SEMPRE validar saldo quando tiver conta - nunca usar saldo_atual diretamente
      if (conta) {
        const validacaoResult = await validarSaldoCora(compra.saldo_aberto || 0);
        
        if (!isMountedRef.current) {
          return;
        }
        
        setValidacao(validacaoResult);
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      
      console.error('❌ [MODAL] Erro ao carregar dados:', error);
      setValidacao({
        success: false,
        error: 'Erro ao carregar informações da conta Cora'
      });
    } finally {
      // Desmarcar como carregando
      carregandoRef.current = false;
    }
  }, [open, compra?.id, compra?.saldo_aberto, buscarContaCora, validarSaldoCora]);

  // Carregar dados quando modal abrir - apenas quando realmente necessário
  useEffect(() => {
    console.log('🔄 [MODAL-EFFECT] useEffect carregarDados disparado:', { 
      open, 
      compraId: compra?.id,
      temContaCora: !!contaCora,
      jaCarregando: carregandoRef.current,
      condicaoAtendida: open && compra && !contaCora && !carregandoRef.current
    });
    
    if (open && compra && !contaCora && !carregandoRef.current) {
      console.log('✅ [MODAL-EFFECT] Condições atendidas, chamando carregarDados');
      carregarDados();
    } else {
      console.log('❌ [MODAL-EFFECT] Condições NÃO atendidas:', {
        'open': open,
        'compra': !!compra,
        '!contaCora': !contaCora,
        '!carregandoRef.current': !carregandoRef.current
      });
    }
  }, [open, compra?.id]);

  // Reset estado quando modal fechar e cleanup
  useEffect(() => {
    if (!open) {
      setFoiPago(true);
      setContaCora(null);
      setValidacao(null);
      carregandoRef.current = false; // Reset flag de carregamento
      cleanup(); // Limpar requests em andamento
    }
  }, [open, cleanup]);

  // Cleanup quando componente desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  const handleConfirmarPagamento = async () => {
    if (!compra || !foiPago) return;

    console.log('🎯 Confirmando pagamento total:', {
      compraId: compra.id,
      valorTotal: compra.saldo_aberto,
      foiPago
    });

    const result = await pagarTotal(compra.id, foiPago);
    
    if (result.success) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const formatarMoeda = (valor: number | undefined | null): string => {
    if (valor === undefined || valor === null || isNaN(valor)) {
      return 'R$ 0,00';
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const calcularSaldoFinal = (): number => {
    if (!validacao?.success || !validacao.saldo_disponivel) {
      return 0;
    }
    
    const saldoAtual = validacao.saldo_disponivel;
    const valorDesconto = compra.valor_total - compra.valor_pago;
    
    return saldoAtual - valorDesconto;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (!compra) return null;

  const podeProcessar = validacao?.pode_processar && foiPago;
  const temSaldoInsuficiente = validacao && !validacao.pode_processar;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Pagamento Total - {compra.fornecedores?.nome}
          </DialogTitle>
          <DialogDescription>
            Confirme o pagamento total desta compra com desconto automático da conta Cora
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Detalhes da Compra */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Descrição:</span>
                  <span className="font-medium">{compra.descricao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Data:</span>
                  <span>{formatDate(compra.data)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor Total:</span>
                  <span className="font-medium">{formatarMoeda(compra.valor_total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Já Pago:</span>
                  <span>{formatarMoeda(compra.valor_pago || 0)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Saldo em Aberto:</span>
                  <span className="font-bold text-lg text-red-600">
                    {formatarMoeda(compra.saldo_aberto)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checkbox Principal */}
          <Card className={`border-2 ${foiPago ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
            <CardContent className="pt-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="foi-pago"
                  checked={foiPago}
                  onCheckedChange={(checked) => setFoiPago(checked as boolean)}
                  className="h-5 w-5"
                />
                <label 
                  htmlFor="foi-pago" 
                  className="text-lg font-semibold cursor-pointer"
                >
                  Foi pago?
                </label>
              </div>
              {foiPago && (
                <p className="text-sm text-green-700 mt-2">
                  ✓ Pagamento será processado automaticamente via conta Cora
                </p>
              )}
            </CardContent>
          </Card>

          {/* Informações da Conta Cora */}
          {foiPago && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Conta Cora</span>
                  <Badge variant="secondary" className="text-xs">Automática</Badge>
                </div>
                
                {(() => {
                  if (!contaCora && loading) {
                    return (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Carregando informações da conta...</span>
                      </div>
                    );
                  }
                  
                  if (validacao?.error) {
                    return (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">{validacao.error}</span>
                      </div>
                    );
                  }
                  
                  if (validacao?.success && contaCora) {
                    return (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Saldo Disponível:</span>
                          <span className="font-medium">
                            {formatarMoeda(contaCora.saldo_atual)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valor a Descontar:</span>
                          <span className="font-medium text-red-600">
                            -{formatarMoeda(compra.saldo_aberto)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span>Saldo Final:</span>
                          <span className={`font-bold ${
                            validacao.pode_processar ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatarMoeda(contaCora.saldo_atual - compra.saldo_aberto)}
                          </span>
                        </div>
                        {!validacao.pode_processar && (
                          <div className="flex items-center gap-1 text-red-600 text-xs mt-2">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Saldo insuficiente para processar o pagamento</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  if (contaCora) {
                    // NUNCA usar contaCora.saldo_atual diretamente - sempre forçar validação
                    // para garantir que valores em aberto sejam considerados
                    return (
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm">Validando saldo disponível...</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Aguarde enquanto calculamos o saldo considerando valores em aberto
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Carregando informações da conta...</span>
                    </div>
                  );
                })()}
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
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirmar Pagamento Total
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};