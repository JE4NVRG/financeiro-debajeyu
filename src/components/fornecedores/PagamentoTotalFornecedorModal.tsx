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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle, AlertTriangle, CreditCard, Building2, Receipt } from 'lucide-react';
import { usePagamentoFornecedor } from '@/hooks/usePagamentoFornecedor';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

import { useAuth } from '../../contexts/AuthContext';

interface Compra {
  id: string;
  fornecedor_id: string;
  descricao: string;
  valor_total: number;
  valor_pago: number;
  saldo_aberto: number;
  status: string;
  data: string;
}

interface Conta {
  id: string;
  nome: string;
  saldo_atual: number;
  is_cora_account: boolean;
}

interface FornecedorComTotais {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  total_gasto?: number;
  total_pago?: number;
  total_aberto?: number;
}

interface PagamentoTotalFornecedorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedor: FornecedorComTotais | null;
  onSuccess?: () => void;
}

export const PagamentoTotalFornecedorModal: React.FC<PagamentoTotalFornecedorModalProps> = ({
  open,
  onOpenChange,
  fornecedor,
  onSuccess
}) => {
  const [confirmarPagamento, setConfirmarPagamento] = useState(false);
  const [contaCora, setContaCora] = useState<Conta | null>(null);
  const [comprasEmAberto, setComprasEmAberto] = useState<Compra[]>([]);
  const [validacao, setValidacao] = useState<any>(null);
  
  // Ref para controlar se o componente está montado
  const isMountedRef = useRef(true);
  
  // Flag para prevenir múltiplas chamadas simultâneas
  const carregandoRef = useRef(false);
  
  // Adicionar hook de autenticação
  const { user, isAuthenticated } = useAuth();
  
  // Garantir que isMountedRef seja sempre true quando o modal estiver aberto
  useEffect(() => {
    if (open) {
      isMountedRef.current = true;
      // Limpar cache quando o modal abrir para garantir dados atualizados
      setContaCora(null);
      setComprasEmAberto([]);
      setValidacao(null);
      setConfirmarPagamento(false);
    }
  }, [open]);

  const { 
    buscarComprasEmAberto,
    pagarTodasCompras,
    loading
  } = usePagamentoFornecedor();

  // Função para buscar conta Cora
  const buscarContaCora = async (): Promise<Conta | null> => {
    try {
      const { data, error } = await supabase
        .from('contas')
        .select('id, nome, saldo_atual, is_cora_account')
        .eq('nome', 'Cora')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar conta Cora:', error);
      return null;
    }
  };

  // Função para validar saldo
  const validarSaldoCora = async (valorNecessario: number) => {
    if (!contaCora) return null;

    try {
      // Buscar saldo atualizado da conta Cora
      const { data: contaAtualizada, error } = await supabase
        .from('contas')
        .select('saldo_atual')
        .eq('id', contaCora.id)
        .single();

      if (error) throw error;

      const saldoDisponivel = contaAtualizada.saldo_atual;
      const podeProcessar = saldoDisponivel >= valorNecessario;

      return {
        success: true,
        conta_id: contaCora.id,
        conta_nome: contaCora.nome,
        saldo_disponivel: saldoDisponivel,
        valor_solicitado: valorNecessario,
        pode_processar: podeProcessar,
        diferenca: saldoDisponivel - valorNecessario
      };
    } catch (error) {
      console.error('Erro ao validar saldo:', error);
      return {
        success: false,
        error: 'Erro ao validar saldo da conta'
      };
    }
  };

  // Função memoizada para carregar dados
  const carregarDados = useCallback(async () => {
    if (!open || !fornecedor || !isMountedRef.current || carregandoRef.current) {
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
      
      // Buscar compras em aberto do fornecedor
      const compras = await buscarComprasEmAberto(fornecedor.id);
      
      if (!isMountedRef.current) {
        return;
      }
      
      setComprasEmAberto(compras);
      
      // Calcular valor total e validar saldo
      const valorTotal = compras.reduce((sum, compra) => sum + compra.saldo_aberto, 0);
      
      if (conta && valorTotal > 0) {
        const validacaoResult = await validarSaldoCora(valorTotal);
        
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
        error: 'Erro ao carregar informações do fornecedor'
      });
    } finally {
      // Desmarcar como carregando
      carregandoRef.current = false;
    }
  }, [open, fornecedor?.id, buscarComprasEmAberto]);

  // Carregar dados quando modal abrir
  useEffect(() => {
    if (open && fornecedor && !contaCora && !carregandoRef.current) {
      carregarDados();
    }
  }, [open, fornecedor?.id, carregarDados]);

  // Reset estado quando modal fechar
  useEffect(() => {
    if (!open) {
      setConfirmarPagamento(false);
      setContaCora(null);
      setComprasEmAberto([]);
      setValidacao(null);
      carregandoRef.current = false;
    }
  }, [open]);

  // Cleanup quando componente desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleConfirmarPagamento = async () => {
    if (!fornecedor || !confirmarPagamento) {
      console.log('❌ Validação falhou:', { fornecedor: !!fornecedor, confirmarPagamento });
      return;
    }

    // Verificar autenticação antes de prosseguir
    if (!isAuthenticated || !user) {
      console.error('❌ [MODAL] Usuário não autenticado:', { isAuthenticated, user: !!user });
      toast.error('Usuário não autenticado. Faça login novamente.');
      return;
    }

    try {
      console.log('🎯 Iniciando pagamento total do fornecedor:', {
        fornecedorId: fornecedor.id,
        fornecedorNome: fornecedor.nome,
        totalCompras: comprasEmAberto.length,
        valorTotal: comprasEmAberto.reduce((sum, compra) => sum + compra.saldo_aberto, 0),
        loading: loading,
        usuarioAutenticado: {
          id: user.id,
          login: user.login
        }
      });

      console.log('🔄 Chamando pagarTodasCompras...');
      const result = await pagarTodasCompras(fornecedor.id);
      
      console.log('📋 Resultado do pagamento:', result);
      
      if (result.success) {
        console.log('✅ Pagamento realizado com sucesso!');
        toast.success(
          `Pagamento realizado com sucesso!\n` +
          `${result.pagamentos?.length || 0} compra(s) quitada(s) para ${fornecedor.nome}`
        );
        onOpenChange(false);
        onSuccess?.();
      } else {
        console.error('❌ Erro no pagamento:', result.error);
        toast.error(`Erro no pagamento: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Erro inesperado no handleConfirmarPagamento:', error);
      toast.error(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (!fornecedor) return null;

  const valorTotal = comprasEmAberto.reduce((sum, compra) => sum + compra.saldo_aberto, 0);
  const podeProcessar = confirmarPagamento && valorTotal > 0;
  const temSaldoInsuficiente = validacao && !validacao.pode_processar;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Pagamento Total - {fornecedor.nome}
          </DialogTitle>
          <DialogDescription>
            Confirme o pagamento de todas as compras em aberto deste fornecedor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo do Fornecedor */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Resumo do Fornecedor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Nome:</span>
                  <p className="font-medium">{fornecedor.nome}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Tipo:</span>
                  <Badge variant="outline">{fornecedor.tipo}</Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Total Gasto:</span>
                  <p className="font-medium">{formatarMoeda(fornecedor.total_gasto)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Total Pago:</span>
                  <p className="font-medium text-green-600">{formatarMoeda(fornecedor.total_pago)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Em Aberto:</span>
                  <p className="font-bold text-lg text-red-600">{formatarMoeda(fornecedor.total_aberto)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Compras em Aberto */}
          {comprasEmAberto.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  Compras em Aberto ({comprasEmAberto.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {comprasEmAberto.map((compra) => (
                    <div key={compra.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{compra.descricao}</p>
                        <p className="text-xs text-gray-600">{formatDate(compra.data)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-600">{formatarMoeda(compra.saldo_aberto)}</p>
                        <Badge variant="outline" className="text-xs">
                          {compra.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-3" />
                
                <div className="flex justify-between items-center font-bold">
                  <span>Total a Pagar:</span>
                  <span className="text-lg text-red-600">{formatarMoeda(valorTotal)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informações da Conta Cora */}
          {contaCora && validacao && (
            <Card className={`border-2 ${validacao.pode_processar ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-medium">Conta Cora</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Saldo Atual:</span>
                      <p className="font-medium">{formatarMoeda(validacao.saldo_disponivel)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Após Pagamento:</span>
                      <p className={`font-medium ${validacao.diferenca >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatarMoeda(validacao.diferenca)}
                      </p>
                    </div>
                  </div>
                  
                  {!validacao.pode_processar && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Saldo insuficiente para processar o pagamento</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Checkbox de Confirmação */}
          {valorTotal > 0 && (
            <Card className={`border-2 ${confirmarPagamento ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
              <CardContent className="pt-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="confirmar-pagamento"
                    checked={confirmarPagamento}
                    onCheckedChange={(checked) => setConfirmarPagamento(checked === true)}
                    disabled={loading}
                  />
                  <div className="space-y-1">
                    <label
                      htmlFor="confirmar-pagamento"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Confirmo o pagamento total de {formatarMoeda(valorTotal)}
                    </label>
                    <p className="text-xs text-gray-600">
                      Todas as {comprasEmAberto.length} compra(s) em aberto serão quitadas e o valor será descontado da conta Cora
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mensagem quando não há compras em aberto */}
          {comprasEmAberto.length === 0 && !loading && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-yellow-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Nenhuma compra em aberto encontrada para este fornecedor</span>
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
            disabled={!podeProcessar || loading || comprasEmAberto.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
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