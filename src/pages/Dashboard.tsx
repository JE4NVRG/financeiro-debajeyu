import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { supabase, Socio, Investimento } from '../lib/supabase'
import { useToast } from '../components/ui/toast'
import { useTotais } from '../hooks/useTotais'
import { useFornecedores } from '../hooks/useFornecedores'
import { useCompras } from '../hooks/useCompras'
import { usePagamentosFornecedores } from '../hooks/usePagamentosFornecedores'
import { formatBRL } from '../lib/utils'
import { CreditCard, Percent, Building2, AlertCircle } from 'lucide-react'

interface SocioSummary {
  id: string
  nome: string
  pre_saldo: number
  total_investido: number
  saldo_a_receber: number
}

export function Dashboard() {
  const [sociosSummary, setSociosSummary] = useState<SocioSummary[]>([])
  const [recentInvestimentos, setRecentInvestimentos] = useState<Investimento[]>([])
  const [investimentos, setInvestimentos] = useState<Investimento[]>([])
  const [totals, setTotals] = useState({
    totalPreSaldo: 0,
    totalInvestido: 0,
    totalSaldoAReceber: 0
  })
  const [loading, setLoading] = useState(true)
  
  const { addToast } = useToast()
  const navigate = useNavigate()
  const { totaisDashboard } = useTotais()

  // Hooks para fornecedores
  const { fornecedores } = useFornecedores()
  const { compras } = useCompras()
  const { pagamentos } = usePagamentosFornecedores()

  // Calcular totais de fornecedores
  const totaisFornecedores = {
    totalEmAberto: (compras?.reduce((sum, compra) => sum + compra.total_value, 0) || 0) - 
                   (pagamentos?.reduce((sum, pagamento) => sum + pagamento.paid_value, 0) || 0),
    pagamentosDoMes: pagamentos?.filter(pagamento => {
      const hoje = new Date()
      const pagamentoDate = new Date(pagamento.payment_date)
      return pagamentoDate.getMonth() === hoje.getMonth() && 
             pagamentoDate.getFullYear() === hoje.getFullYear()
    }).reduce((sum, pagamento) => sum + pagamento.paid_value, 0) || 0
  }



  // Formatar data - corrigido para evitar problema de timezone
  const formatDate = (dateString: string) => {
    // Criar data diretamente dos componentes da string para evitar problemas de timezone
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day) // month é 0-indexed
    return date.toLocaleDateString('pt-BR')
  }

  // Carregar dados do dashboard
  const fetchDashboardData = async () => {
    try {
      // Carregar sócios
      const { data: socios, error: sociosError } = await supabase
        .from('socios')
        .select('*')
        .order('nome')

      if (sociosError) throw sociosError

      // Carregar investimentos
      const { data: investimentos, error: investimentosError } = await supabase
        .from('investimentos')
        .select(`
          *,
          socios (
            id,
            nome
          )
        `)
        .order('data', { ascending: false })

      if (investimentosError) throw investimentosError

      setInvestimentos(investimentos || [])

      // Calcular resumo por sócio
      const sociosSummaryData: SocioSummary[] = (socios || []).map(socio => {
        const socioInvestimentos = (investimentos || []).filter(inv => inv.socio_id === socio.id)
        const totalInvestido = socioInvestimentos.reduce((sum, inv) => sum + inv.valor, 0)
        const saldoAReceber = socio.pre_saldo - totalInvestido

        return {
          id: socio.id,
          nome: socio.nome,
          pre_saldo: socio.pre_saldo,
          total_investido: totalInvestido,
          saldo_a_receber: saldoAReceber
        }
      })

      setSociosSummary(sociosSummaryData)

      // Calcular totais
      const totalPreSaldo = sociosSummaryData.reduce((sum, socio) => sum + socio.pre_saldo, 0)
      const totalInvestido = sociosSummaryData.reduce((sum, socio) => sum + socio.total_investido, 0)
      const totalSaldoAReceber = sociosSummaryData.reduce((sum, socio) => sum + socio.saldo_a_receber, 0)

      setTotals({
        totalPreSaldo,
        totalInvestido,
        totalSaldoAReceber
      })

      // Últimos 10 investimentos
      setRecentInvestimentos((investimentos || []).slice(0, 10))

    } catch (error: any) {
      console.error('Erro ao carregar dados do dashboard:', error)
      addToast({
        type: 'error',
        title: 'Erro',
        description: 'Não foi possível carregar os dados do dashboard'
      })
    } finally {
      setLoading(false)
    }
  }

  // Calcular totais por sócio para os cards
  const getTotalsBySocio = () => {
    const totals = investimentos.reduce((acc, investimento) => {
      const socioId = investimento.socio_id
      const socioNome = investimento.socios?.nome || 'Desconhecido'
      
      if (!acc[socioId]) {
        acc[socioId] = {
          nome: socioNome,
          total: 0
        }
      }
      
      acc[socioId].total += investimento.valor
      return acc
    }, {} as Record<string, { nome: string; total: number }>)
    
    return Object.entries(totals).map(([id, data]) => ({
      id,
      nome: data.nome,
      total: data.total
    }))
  }

  // Calcular pré-saldos por sócio para os cards
  const getPreSaldosBySocio = () => {
    return sociosSummary.map(socio => ({
      id: socio.id,
      nome: socio.nome,
      preSaldo: socio.pre_saldo
    }))
  }

  // Navegar para investimentos com filtro
  const handleSocioCardClick = (socioId: string) => {
    navigate(`/investimentos?socio=${socioId}`)
  }

  // Navegar para sócios com filtro
  const handlePreSaldoCardClick = (socioId: string) => {
    navigate(`/socios?socio=${socioId}`)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral dos investimentos e saldos
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pré-Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatBRL(totals.totalPreSaldo)}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma dos pré-saldos de todos os sócios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatBRL(totals.totalInvestido)}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de todos os investimentos realizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo a Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatBRL(totals.totalSaldoAReceber)}
            </div>
            <p className="text-xs text-muted-foreground">
              Diferença entre pré-saldo e investido
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Total enviado ao Cora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatBRL(totaisDashboard.total_cora)}
            </div>
            <p className="text-xs text-blue-600">
              Entradas na conta Cora
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Comissão 4% acumulada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatBRL(totaisDashboard.total_comissao)}
            </div>
            <p className="text-xs text-orange-600">
              Total de comissões pagas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Novos cards de fornecedores */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Total em Aberto (Fornecedores)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatBRL(totaisFornecedores.totalEmAberto)}
            </div>
            <p className="text-xs text-red-600">
              Saldo pendente de pagamento
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Pagamentos do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatBRL(totaisFornecedores.pagamentosDoMes)}
            </div>
            <p className="text-xs text-green-600">
              Pagamentos realizados este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards com pré-saldos por sócio */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Pré-Saldos por Sócio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getPreSaldosBySocio().map((socio) => (
            <Card 
              key={socio.id} 
              className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
              onClick={() => handlePreSaldoCardClick(socio.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {socio.nome}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatBRL(socio.preSaldo)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pré-saldo • Clique para ver detalhes
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cards com totais por sócio */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Investimentos por Sócio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getTotalsBySocio().map((socio) => (
            <Card 
              key={socio.id} 
              className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
              onClick={() => handleSocioCardClick(socio.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {socio.nome}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBRL(socio.total)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total investido • Clique para ver detalhes
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Resumo por sócio */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo por Sócio</CardTitle>
            <CardDescription>
              Situação financeira de cada sócio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sócio</TableHead>
                  <TableHead>Pré-Saldo</TableHead>
                  <TableHead>Investido</TableHead>
                  <TableHead>A Receber</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sociosSummary.map((socio) => (
                  <TableRow key={socio.id}>
                    <TableCell className="font-medium">{socio.nome}</TableCell>
                    <TableCell>{formatBRL(socio.pre_saldo)}</TableCell>
                    <TableCell>{formatBRL(socio.total_investido)}</TableCell>
                    <TableCell className={socio.saldo_a_receber >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatBRL(socio.saldo_a_receber)}
                    </TableCell>
                  </TableRow>
                ))}
                {sociosSummary.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum sócio cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Últimos investimentos */}
        <Card>
          <CardHeader>
            <CardTitle>Últimos Investimentos</CardTitle>
            <CardDescription>
              Os 10 investimentos mais recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInvestimentos.map((investimento) => (
                <div key={investimento.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{investimento.descricao}</p>
                    <p className="text-sm text-muted-foreground">
                      {investimento.socios?.nome} • {formatDate(investimento.data)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-blue-600">
                      {formatBRL(investimento.valor)}
                    </p>
                  </div>
                </div>
              ))}
              {recentInvestimentos.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum investimento registrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}