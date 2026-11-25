import {
  ArrowLeftRight,
  Boxes,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Tags,
  Users,
} from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const upcomingSections = [
  { label: 'Stock movements', icon: ArrowLeftRight, title: 'Manage stock from a product details page' },
  { label: 'Staff', icon: Users },
]

function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-stockflow-cream text-stockflow-ink lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-stockflow-ink px-4 py-6 text-white lg:flex">
        <Link className="flex items-center gap-3 px-3" to="/dashboard">
          <span className="grid size-10 place-items-center rounded-xl bg-stockflow-slate text-white">
            <Boxes aria-hidden="true" size={23} />
          </span>
          <span className="text-xl font-semibold tracking-tight">StockFlow</span>
        </Link>

        <p className="mb-3 mt-10 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
          Workspace
        </p>
        <nav aria-label="Main navigation" className="space-y-1">
          {[
            { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
            { label: 'Products', icon: Package, to: '/products' },
            { label: 'Categories', icon: Tags, to: '/categories' },
            { label: 'Organization', icon: Settings, to: '/organization' },
          ].map(({ label, icon: Icon, to }) => (
            <NavLink
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-stockflow-slate text-white'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`
              }
              key={label}
              to={to}
            >
              <Icon aria-hidden="true" size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
          Management
        </p>
        <nav aria-label="Upcoming sections" className="space-y-1">
          {upcomingSections.map(({ label, icon: Icon, title }) => (
            <button
              aria-disabled="true"
              className="flex min-h-11 w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 text-left text-sm text-white/45"
              disabled
              key={label}
              title={title || 'Available in a later phase'}
              type="button"
            >
              <Icon aria-hidden="true" size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/15 pt-4">
          <p className="truncate px-3 text-sm font-medium">{user?.full_name || 'Account'}</p>
          <button
            className="mt-3 flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
            type="button"
          >
            <LogOut aria-hidden="true" size={17} />
            Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex min-h-16 items-center justify-between border-b border-stockflow-gray/70 bg-white/80 px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2 font-semibold lg:hidden" to="/dashboard">
            <span className="grid size-9 place-items-center rounded-lg bg-stockflow-slate text-white">
              <Boxes aria-hidden="true" size={20} />
            </span>
            StockFlow
          </Link>
          <p className="hidden text-sm text-stockflow-ink/65 lg:block">
            Inventory workspace
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-sm font-medium sm:block">
              {user?.full_name}
            </span>
            <button
              aria-label="Log out"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-stockflow-gray px-3 text-sm font-medium transition hover:bg-stockflow-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stockflow-slate lg:hidden"
              onClick={handleLogout}
              type="button"
            >
              <LogOut aria-hidden="true" size={16} />
              <span>Log out</span>
            </button>
          </div>
        </header>
        <nav
          aria-label="Mobile navigation"
          className="flex gap-2 overflow-x-auto border-b border-stockflow-gray/70 bg-white/80 px-4 py-2 lg:hidden"
        >
          {[
            { label: 'Dashboard', to: '/dashboard' },
            { label: 'Products', to: '/products' },
            { label: 'Categories', to: '/categories' },
            { label: 'Organization', to: '/organization' },
          ].map(({ label, to }) => (
            <NavLink
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-stockflow-slate text-white' : 'text-stockflow-ink/70 hover:bg-stockflow-cream'
                }`
              }
              key={label}
              to={to}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
