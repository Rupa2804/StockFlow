import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ProtectedRoute from './ProtectedRoute'
import PublicOnlyRoute from './PublicOnlyRoute'

const DashboardLayout = lazy(() => import('../layouts/DashboardLayout'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'))
const ProductsPage = lazy(() => import('../pages/ProductsPage'))
const ProductFormPage = lazy(() => import('../pages/ProductFormPage'))
const CategoriesPage = lazy(() => import('../pages/CategoriesPage'))
const CategoryDetailPage = lazy(() => import('../pages/CategoryDetailPage'))
const OrganizationPage = lazy(() => import('../pages/OrganizationPage'))

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-stockflow-cream text-stockflow-ink">
          <p aria-live="polite">Loading StockFlow…</p>
        </main>
      }
    >
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route element={<LoginPage />} path="/login" />
            <Route element={<RegisterPage />} path="/register" />
          </Route>
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route element={<DashboardPage />} path="/dashboard" />
            <Route element={<ProductDetailPage />} path="/products/:productId" />
            <Route element={<ProductsPage />} path="/products" />
            <Route element={<ProductFormPage />} path="/products/new" />
            <Route element={<ProductFormPage />} path="/products/:productId/edit" />
            <Route element={<CategoriesPage />} path="/categories" />
            <Route element={<CategoryDetailPage />} path="/categories/:categoryId" />
            <Route element={<OrganizationPage />} path="/organization" />
          </Route>
        </Route>
        <Route element={<Navigate replace to="/dashboard" />} path="/" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes
