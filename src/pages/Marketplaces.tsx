import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../components/ui/dialog';
import { 
  Plus, 
  Store, 
  TrendingUp, 
  Percent, 
  DollarSign, 
  Hash,
  ArrowLeft 
} from 'lucide-react';
import { EntradaTable } from '../components/EntradaTable';
import { MarketplaceForm } from '../components/MarketplaceForm';
import { useMarketplaces } from '../hooks/useMarketplaces';
import { useEntradas } from '../hooks/useEntradas';
import { useTotais } from '../hooks/useTotais';
import { Marketplace, NovoMarketplaceForm, Entrada } from '../types/database';
import { formatBRL } from '../lib/utils';
import { toast } from 'sonner';

export default function Marketplaces() {
  const [selectedMarketplace, setSelectedMarketplace] = useState<Marketplace | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { marketplaces, loading, createMarketplace, refetch } = useMarketplaces();
  const { totaisMarketplace } = useTotais();
  
  // Buscar entradas do marketplace selecionado
  const { entradas: marketplaceEntradas, loading: entradasLoading } = useEntradas({
    filters: selectedMarketplace ? { marketplaceId: selectedMarketplace.id } : {}
  });

  const handleCreateMarketplace = async (data: NovoMarketplaceForm) => {
    try {
      console.log('handleCreateMarketplace called with:', data);
      await createMarketplace(data);
      setIsCreateModalOpen(false);
      toast.success('Marketplace criado com sucesso!');
    } catch (error) {
      console.error('Error in handleCreateMarketplace:', error);
      toast.error('Erro ao criar marketplace');
    }
  };

  const handleMarketplaceClick = (marketplace: Marketplace) => {
    setSelectedMarketplace(marketplace);
  };

  const handleBackToList = () => {
    setSelectedMarketplace(null);
  };

  // Se um marketplace está selecionado, mostrar detalhes
  if (selectedMarketplace) {
    const totais = totaisMarketplace.find(t => t.marketplace_id === selectedMarketplace.id);

    return (
      <div className="space-y-6">
        {/* Header com botão voltar */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Store className="h-8 w-8" />
              {selectedMarketplace.nome}
            </h1>
            <p className="text-muted-foreground">
              Detalhes e entradas do marketplace
            </p>
          </div>
        </div>

        {/* Cards de totais do marketplace */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Enviado para Cora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatBRL(totais?.total_enviado || 0)}
              </div>
              <p className="text-xs text-green-600 mt-1">
                {totais?.total_entradas || 0} entradas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Comissão 4%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatBRL(totais?.total_comissao || 0)}
              </div>
              <p className="text-xs text-orange-600 mt-1">
                Comissões pagas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Marketplace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatBRL(totais?.total_marketplace || 0)}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Enviado + Comissão
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de entradas do marketplace */}
        <Card>
          <CardHeader>
            <CardTitle>Entradas do {selectedMarketplace.nome}</CardTitle>
          </CardHeader>
          <CardContent>
            <EntradaTable
              entradas={marketplaceEntradas}
              onEdit={() => {}} // Não permitir edição nesta tela
              onDelete={() => {}} // Não permitir exclusão nesta tela
              loading={entradasLoading}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Lista de marketplaces
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplaces</h1>
          <p className="text-muted-foreground">
            Gerencie os marketplaces e visualize seus totais
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Marketplace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Marketplace</DialogTitle>
            </DialogHeader>
            <MarketplaceForm
              onSubmit={handleCreateMarketplace}
              onCancel={() => setIsCreateModalOpen(false)}
              loading={loading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de marketplaces */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500">Carregando marketplaces...</div>
        </div>
      ) : marketplaces.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Store className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum marketplace encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              Comece criando seu primeiro marketplace
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Marketplace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketplaces.map((marketplace) => {
            const totais = totaisMarketplace.find(t => t.marketplace_id === marketplace.id);
            
            return (
              <Card 
                key={marketplace.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleMarketplaceClick(marketplace)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      {marketplace.nome}
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Ativo
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Enviado</p>
                      <p className="font-semibold text-green-600">
                        {formatBRL(totais?.total_enviado || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Comissão</p>
                      <p className="font-semibold text-orange-600">
                        {formatBRL(totais?.total_comissao || 0)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total</span>
                      <span className="font-bold text-blue-600">
                        {formatBRL(totais?.total_marketplace || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">Entradas</span>
                      <span className="text-xs text-gray-600">
                        {totais?.total_entradas || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}