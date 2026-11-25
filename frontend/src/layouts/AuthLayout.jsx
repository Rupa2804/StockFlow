import { Boxes } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

function AuthLayout() {
  return (
    <main className="min-h-screen bg-stockflow-cream px-4 py-6 text-stockflow-ink sm:px-8 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col sm:min-h-[calc(100vh-5rem)]">
        <header className="mb-8 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-stockflow-slate text-stockflow-cream">
            <Boxes aria-hidden="true" size={25} strokeWidth={1.8} />
          </div>
          <div>
            <Link className="text-xl font-semibold tracking-tight" to="/login">
              StockFlow
            </Link>
            <p className="text-sm text-stockflow-ink/65">Inventory management</p>
          </div>
        </header>

        <div className="grid flex-1 overflow-hidden rounded-2xl border border-stockflow-gray bg-white shadow-sm md:grid-cols-2">
          <aside className="hidden flex-col justify-between bg-stockflow-slate p-10 text-white md:flex lg:p-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
                StockFlow
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight">
                Keep every item in view.
              </h1>
              <p className="mt-4 max-w-sm leading-7 text-white/80">
                A calm, clear workspace for the products and people that keep
                your organization moving.
              </p>
            </div>
            <p className="text-sm text-white/70">Simple inventory. Shared focus.</p>
          </aside>

          <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
            <div className="w-full max-w-md">
              <Outlet />
            </div>
          </section>
        </div>

        <footer className="pt-5 text-center text-sm text-stockflow-ink/60">
          Built for teams that keep things moving.
        </footer>
      </div>
    </main>
  )
}

export default AuthLayout
