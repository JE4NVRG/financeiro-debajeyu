import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Building2, Users, CreditCard, ArrowRightLeft } from 'lucide-react';

export type TipoSaida = 'fornecedor' | 'abatimento_pre_saldo' | 'operacional' | 'financeira';

interface SaidaTypeSelectorProps {
  onSelectType: (tipo: TipoSaida) => void;
  onCancel: () => void;
}

export function SaidaTypeSelector({ onSelectType, onCancel }: SaidaTypeSelectorProps) {
  const tiposSaida = [
    {
      tipo: 'fornecedor' as TipoSaida,
      titulo: 'Pagamento a Fornecedor',
      descricao: 'Pagamento de compras ou serviços de fornecedores',
      icon: Building2,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-600',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      tipo: 'abatimento_pre_saldo' as TipoSaida,
      titulo: 'Abatimento Pré-Saldo',
      descricao: 'Dedução do pré-saldo de sócios/parceiros',
      icon: Users,
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      iconColor: 'text-orange-600',
      badgeColor: 'bg-orange-100 text-orange-800'
    },
    {
      tipo: 'operacional' as TipoSaida,
      titulo: 'Despesa Operacional',
      descricao: 'Gastos operacionais da empresa (aluguel, utilities, etc.)',
      icon: CreditCard,
      color: 'bg-green-50 border-green-200 hover:bg-green-100',
      iconColor: 'text-green-600',
      badgeColor: 'bg-green-100 text-green-800'
    },
    {
      tipo: 'financeira' as TipoSaida,
      titulo: 'Movimentação Financeira',
      descricao: 'Transferências entre contas, taxas bancárias, etc.',
      icon: ArrowRightLeft,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      iconColor: 'text-purple-600',
      badgeColor: 'bg-purple-100 text-purple-800'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Selecione o Tipo de Saída</h3>
        <p className="text-sm text-muted-foreground">
          Escolha o tipo de saída que deseja registrar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiposSaida.map((tipo) => {
          const Icon = tipo.icon;
          return (
            <Card
              key={tipo.tipo}
              className={`cursor-pointer transition-all duration-200 ${tipo.color}`}
              onClick={() => onSelectType(tipo.tipo)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className={`p-2 rounded-lg bg-white/50`}>
                    <Icon className={`h-5 w-5 ${tipo.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    {tipo.titulo}
                    <Badge variant="secondary" className={`ml-2 ${tipo.badgeColor}`}>
                      {tipo.tipo === 'abatimento_pre_saldo' ? 'Novo' : 'Disponível'}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">
                  {tipo.descricao}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}