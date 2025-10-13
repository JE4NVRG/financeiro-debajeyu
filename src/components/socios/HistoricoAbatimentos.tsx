import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar, Filter, X, History, TrendingDown } from 'lucide-react';
import { useAbatimentos } from '../../hooks/useAbatimentos';
import { AbatimentoComDetalhes, FiltrosAbatimento } from '../../types/database';
import { formatBRL, formatDate } from '../../lib/utils';

interface HistoricoAbatimentosProps {
  isOpen: boolean;
  onClose: () => void;
  socioId?: string;
  socioNome?: string;
}

export function HistoricoAbatimentos({ 
  isOpen, 
  onClose, 
  socioId, 
  socioNome 
}: HistoricoAbatimentosProps) {
  const [filtros, setFiltros] = useState<FiltrosAbatimento>({
    socio_id: socioId,
    data_inicio: '',
    data_fim: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const { abatimentos, loading, refetch } = useAbatimentos(filtros);

  // Atualizar filtro quando socioId mudar
  useEffect(() => {
    if (socioId) {
      setFiltros(prev => ({ ...prev, socio_id: socioId }));
    }
  }, [socioId]);

  // Recarregar dados quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen]);

  const handleFilterChange = (field: keyof FiltrosAbatimento, value: string) => {
    setFiltros(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFiltros({
      socio_id: socioId,
      data_inicio: '',
      data_fim: ''
    });
  };

  const applyFilters = () => {
    refetch();
    setShowFilters(false);
  };

  // Calcular totais
  const totalAbatido = abatimentos.reduce((sum, abatimento) => sum + abatimento.valor, 0);
  const quantidadeAbatimentos = abatimentos.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-orange-600" />
            Histórico de Abatimentos
            {socioNome && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                {socioNome}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-900 text-base">
                  <TrendingDown className="h-4 w-4" />
                  Total Abatido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatBRL(totalAbatido)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-900 text-base">
                  <Calendar className="h-4 w-4" />
                  Quantidade de Abatimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {quantidadeAbatimentos}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Filtros</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
                </Button>
              </div>
            </CardHeader>
            {showFilters && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data_inicio">Data Início</Label>
                    <Input
                      id="data_inicio"
                      type="date"
                      value={filtros.data_inicio || ''}
                      onChange={(e) => handleFilterChange('data_inicio', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="data_fim">Data Fim</Label>
                    <Input
                      id="data_fim"
                      type="date"
                      value={filtros.data_fim || ''}
                      onChange={(e) => handleFilterChange('data_fim', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                  <Button size="sm" onClick={applyFilters}>
                    Aplicar Filtros
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Tabela de Abatimentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Histórico de Abatimentos ({abatimentos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Carregando histórico...</p>
                </div>
              ) : abatimentos.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {socioNome 
                      ? `Nenhum abatimento encontrado para ${socioNome}`
                      : 'Nenhum abatimento encontrado'
                    }
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Sócio</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Saldo Anterior</TableHead>
                        <TableHead>Saldo Posterior</TableHead>
                        <TableHead>Conta</TableHead>
                        <TableHead>Observação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {abatimentos.map((abatimento) => (
                        <TableRow key={abatimento.id}>
                          <TableCell>
                            {formatDate(abatimento.data_abatimento)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {abatimento.socio.nome}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              -{formatBRL(abatimento.valor)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatBRL(abatimento.saldo_anterior)}
                          </TableCell>
                          <TableCell>
                            {formatBRL(abatimento.saldo_posterior)}
                          </TableCell>
                          <TableCell>
                            {abatimento.conta.nome}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {abatimento.observacao || '-'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}