import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Filter, X } from 'lucide-react';
import { FiltrosDespesa } from '../../types/database';
import { useContas } from '../../hooks/useContas';
import { useDespesas } from '../../hooks/useDespesas';

interface DespesaFiltersProps {
  filters: FiltrosDespesa;
  onFiltersChange: (filters: FiltrosDespesa) => void;
  onClearFilters: () => void;
}

export function DespesaFilters({ filters, onFiltersChange, onClearFilters }: DespesaFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { contas } = useContas();
  const { categorias } = useDespesas();

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  );

  const updateFilter = (key: keyof FiltrosDespesa, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' || value === 'all' ? undefined : value
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Recolher' : 'Expandir'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data-inicio">Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={filters.data_inicio || ''}
                onChange={(e) => updateFilter('data_inicio', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-fim">Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={filters.data_fim || ''}
                onChange={(e) => updateFilter('data_fim', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => updateFilter('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtipo">Tipo</Label>
              <Select
                value={filters.subtipo || ''}
                onValueChange={(value) => updateFilter('subtipo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="fixa">Fixa</SelectItem>
                  <SelectItem value="avulsa">Avulsa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={filters.categoria_id || ''}
                onValueChange={(value) => updateFilter('categoria_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      <div className="flex items-center gap-2">
                        {categoria.cor && (
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: categoria.cor }}
                          />
                        )}
                        {categoria.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conta">Conta</Label>
              <Select
                value={filters.conta_id || ''}
                onValueChange={(value) => updateFilter('conta_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as contas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as contas</SelectItem>
                  {contas.map((conta) => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor-min">Valor Mínimo</Label>
              <Input
                id="valor-min"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={filters.valor_min || ''}
                onChange={(e) => updateFilter('valor_min', e.target.value || undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor-max">Valor Máximo</Label>
              <Input
                id="valor-max"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={filters.valor_max || ''}
                onChange={(e) => updateFilter('valor_max', e.target.value || undefined)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="busca">Buscar na descrição ou observações</Label>
            <Input
              id="busca"
              type="text"
              placeholder="Digite para buscar..."
              value={filters.busca || ''}
              onChange={(e) => updateFilter('busca', e.target.value)}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}