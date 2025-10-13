import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/ui/toast'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Investimentos } from './pages/Investimentos'
import { Socios } from './pages/Socios'
import Contas from './pages/Contas'
import Marketplaces from './pages/Marketplaces'
import { Fornecedores } from './pages/Fornecedores'
import { FornecedorDetail } from './pages/FornecedorDetail'
import Compras from './pages/Compras'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/investimentos" element={
              <ProtectedRoute>
                <Layout>
                  <Investimentos />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/socios" element={
              <ProtectedRoute>
                <Layout>
                  <Socios />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/contas" element={
              <ProtectedRoute>
                <Layout>
                  <Contas />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/marketplaces" element={
              <ProtectedRoute>
                <Layout>
                  <Marketplaces />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/fornecedores" element={
              <ProtectedRoute>
                <Layout>
                  <Fornecedores />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/fornecedores/:id" element={
              <ProtectedRoute>
                <Layout>
                  <FornecedorDetail />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/compras" element={
              <ProtectedRoute>
                <Layout>
                  <Compras />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
