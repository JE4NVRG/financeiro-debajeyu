import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Filter, X } from 'lucide-react';
import { FiltrosEntrada } from '../types/database';
import { useContas } from '../hooks/useContas';
import { useMarketplaces } from '../hooks/useMarketplaces';

interface EntradaFiltersProps {
  filters: FiltrosEntrada;
  onFiltersChange: (filters: FiltrosEntrada) => void;
  onClearFilters: () => void;
}

export function EntradaFilters({ filters, onFiltersChange, onClearFilters }: EntradaFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { contas } = useContas();
  const { marketplaces } = useMarketplaces();

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  );

  const updateFilter = (key: keyof FiltrosEntrada, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value
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
                value={filters.dataInicio || ''}
                onChange={(e) => updateFilter('dataInicio', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data-fim">Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={filters.dataFim || ''}
                onChange={(e) => updateFilter('dataFim', e.target.value)}
              />
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
                  <SelectItem value="">Todas as contas</SelectItem>
                  {contas.map((conta) => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marketplace">Marketplace</Label>
              <Select
                value={filters.marketplace_id || ''}
                onValueChange={(value) => updateFilter('marketplace_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os marketplaces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os marketplaces</SelectItem>
                  {marketplaces.map((marketplace) => (
                    <SelectItem key={marketplace.id} value={marketplace.id}>
                      {marketplace.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor-min">Valor Mínimo</Label>
              <Input
                id="valor-min"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={filters.valorMin || ''}
                onChange={(e) => updateFilter('valorMin', parseFloat(e.target.value) || undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor-max">Valor Máximo</Label>
              <Input
                id="valor-max"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={filters.valorMax || ''}
                onChange={(e) => updateFilter('valorMax', parseFloat(e.target.value) || undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comissao">Comissão</Label>
              <Select
                value={filters.comissaoPaga?.toString() || ''}
                onValueChange={(value) => updateFilter('comissaoPaga', value === '' ? undefined : value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="true">Com comissão</SelectItem>
                  <SelectItem value="false">Sem comissão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="busca">Buscar na observação</Label>
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