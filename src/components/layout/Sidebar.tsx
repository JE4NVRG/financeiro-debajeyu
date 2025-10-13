import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  LogOut,
  Building2,
  CreditCard,
  Store,
  ShoppingCart
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/button'

const menuItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Investimentos',
    href: '/investimentos',
    icon: TrendingUp
  },
  {
    name: 'Contas',
    href: '/contas',
    icon: CreditCard
  },
  {
    name: 'Marketplaces',
    href: '/marketplaces',
    icon: Store
  },
  {
    name: 'Fornecedores',
    href: '/fornecedores',
    icon: Building2
  },
  {
    name: 'Compras',
    href: '/compras',
    icon: ShoppingCart
  },
  {
    name: 'Sócios',
    href: '/socios',
    icon: Users
  }
]

export function Sidebar() {
  const location = useLocation()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Financeiro</h1>
            <p className="text-sm text-gray-500">DEBAJEYU</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href || 
                          (item.href === '/fornecedores' && location.pathname.startsWith('/fornecedores'))
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  )
}