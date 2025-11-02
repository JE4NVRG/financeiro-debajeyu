import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  LogOut,
  Building2,
  CreditCard,
  Store,
  ShoppingCart,
  Receipt,
  User,
  ChevronDown
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'

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
    name: 'Despesas',
    href: '/despesas',
    icon: Receipt
  },
  {
    name: 'Sócios',
    href: '/socios',
    icon: Users
  }
]

export function Sidebar() {
  const location = useLocation()
  const { logout, user, userProfile } = useAuth()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
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

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-2 h-auto">
              <div className="flex items-center space-x-3 w-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userProfile?.avatar_url} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                    {userProfile?.full_name ? getInitials(userProfile.full_name) : 
                     user?.login ? getInitials(user.login) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userProfile?.full_name || user?.login || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userProfile?.role === 'admin' ? 'Administrador' : 
                     userProfile?.role === 'socio' ? 'Sócio' : 
                     userProfile?.role === 'socio_limitado' ? 'Sócio Limitado' : 'Usuário'}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}