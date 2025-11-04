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
import { ThemeToggle } from '../ThemeToggle'

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

interface SidebarProps {
  isMobile?: boolean;
  isTablet?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobile = false, isTablet = false, onClose }: SidebarProps) {
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

  const handleMenuItemClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  }

  return (
    <div className={`
      ${isMobile ? 'w-80' : isTablet ? 'w-60' : 'w-64'} 
      bg-background border-r border-border h-dvh flex flex-col
      transition-colors duration-200
    `}>
      {/* Logo - Hidden on mobile (shown in MobileHeader) */}
      {!isMobile && (
        <div className={`${isTablet ? 'p-4' : 'p-6'} border-b border-border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className={`${isTablet ? 'text-lg' : 'text-xl'} font-bold text-foreground`}>
                  Financeiro
                </h1>
                <p className="text-sm text-muted-foreground">DEBAJEYU</p>
              </div>
            </div>
            <ThemeToggle variant="button" size="sm" />
          </div>
        </div>
      )}

      {/* Mobile Header Space */}
      {isMobile && (
        <div className="h-4" />
      )}

      {/* Menu Items */}
      <nav className={`flex-1 ${isMobile ? 'p-6' : 'p-4'} space-y-2 overflow-y-auto ios-smooth-scroll`}>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href || 
                          (item.href === '/fornecedores' && location.pathname.startsWith('/fornecedores'))
          
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleMenuItemClick}
              className={`
                flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200
                ${isMobile ? 'text-base' : 'text-sm'}
                ${isActive
                  ? 'bg-secondary text-foreground border-l-2 border-primary'
                  : 'text-foreground hover:bg-secondary hover:text-foreground'
                }
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                active:scale-95
              `}
            >
              <Icon className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'}`} />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile Section */}
      <div className={`${isMobile ? 'p-6' : 'p-4'} border-t border-border`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={`
                w-full justify-start p-2 h-auto
                hover:bg-secondary transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              `}
            >
              <div className="flex items-center space-x-3 w-full">
                <Avatar className={`${isMobile ? 'h-10 w-10' : 'h-8 w-8'}`}>
                  <AvatarImage src={userProfile?.avatar_url} />
                  <AvatarFallback className="bg-secondary text-foreground text-sm">
                    {userProfile?.full_name ? getInitials(userProfile.full_name) : 
                     user?.login ? getInitials(user.login) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-foreground truncate`}>
                    {userProfile?.full_name || user?.login || 'Usuário'}
                  </p>
                  <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground truncate`}>
                    {userProfile?.role === 'admin' ? 'Administrador' : 
                     userProfile?.role === 'socio' ? 'Sócio' : 
                     userProfile?.role === 'socio_limitado' ? 'Sócio Limitado' : 'Usuário'}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 bg-background border-border"
          >
            <DropdownMenuItem asChild>
              <Link 
                to="/profile" 
                className="flex items-center text-foreground hover:bg-secondary"
                onClick={handleMenuItemClick}
              >
                <User className="h-4 w-4 mr-2" />
                Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem 
              onClick={() => {
                handleLogout();
                handleMenuItemClick();
              }}
              className="text-red-600 focus:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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