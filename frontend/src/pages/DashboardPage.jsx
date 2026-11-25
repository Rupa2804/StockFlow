import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Boxes,
  Package,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getDashboardSummary } from '../services/dashboardService'
import { getApiErrorMessage } from '../utils/apiError'

const numberFormatter = new Intl.NumberFormat()

function StatCard({ title, value, caption, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-stockflow-gray/75 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-stockflow-ink/65">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {numberFormatter.format(value)}
          </p>
          <p className="mt-2 text-sm text-stockflow-ink/55">{caption}</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-stockflow-cream text-stockflow-slate">
          <Icon aria-hidden="true" size={21} />
        </span>
      </div>
    </article>
  )
}

function DashboardPage() {
  const { user } = useAuth()
  const {
    data,
    error,
    isError,
    isPending,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: getDashboardSummary,
  })

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stockflow-slate">
            Overview
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Good to see you{user?.full_name ? `, ${user.full_name}` : ''}
          </h1>
          <p className="mt-2 text-sm leading-6 text-stockflow-ink/65 sm:text-base">
            Here is a snapshot of your organization&apos;s inventory.
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-stockflow-gray bg-white px-3 text-sm font-medium transition hover:bg-stockflow-gray/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stockflow-slate disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          disabled={isFetching}
          onClick={() => refetch()}
          type="button"
        >
          <RefreshCw
            aria-hidden="true"
            className={isFetching ? 'animate-spin' : ''}
            size={16}
          />
          Refresh
        </button>
      </div>

      {isError ? (
        <section
          aria-live="polite"
          className="mt-8 rounded-2xl border border-red-200 bg-white p-6"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle aria-hidden="true" className="mt-0.5 text-red-700" size={20} />
            <div>
              <h2 className="font-semibold">Dashboard data is unavailable</h2>
              <p className="mt-1 text-sm leading-6 text-stockflow-ink/70">
                {getApiErrorMessage(error, 'Try again in a moment.')}
              </p>
              <button
                className="mt-4 min-h-10 rounded-lg bg-stockflow-slate px-4 text-sm font-semibold text-white transition hover:bg-stockflow-slate/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stockflow-slate"
                onClick={() => refetch()}
                type="button"
              >
                Try again
              </button>
            </div>
          </div>
        </section>
      ) : isPending ? (
        <section aria-busy="true" aria-label="Loading dashboard" className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                className="h-36 animate-pulse rounded-2xl border border-stockflow-gray/70 bg-white/70"
                key={item}
              />
            ))}
          </div>
          <div className="mt-8 h-64 animate-pulse rounded-2xl border border-stockflow-gray/70 bg-white/70" />
        </section>
      ) : (
        <>
          <section aria-label="Inventory summary" className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              caption="Across your organization"
              icon={Package}
              title="Total products"
              value={data.total_products}
            />
            <StatCard
              caption="Units currently in stock"
              icon={Boxes}
              title="Quantity on hand"
              value={data.total_quantity_on_hand}
            />
            <StatCard
              caption="Products at or below their threshold"
              icon={AlertTriangle}
              title="Low-stock items"
              value={data.low_stock_items.length}
            />
          </section>

          <section className="mt-8 overflow-hidden rounded-2xl border border-stockflow-gray/75 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-stockflow-gray/60 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-lg font-semibold">Low-stock products</h2>
                <p className="mt-1 text-sm text-stockflow-ink/60">
                  Items that need your attention.
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-stockflow-cream px-3 py-1 text-xs font-semibold text-stockflow-ink">
                <AlertTriangle aria-hidden="true" size={14} />
                {numberFormatter.format(data.low_stock_items.length)} items
              </span>
            </div>

            {data.low_stock_items.length === 0 ? (
              <div className="px-5 py-12 text-center sm:px-6">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-stockflow-cream text-stockflow-slate">
                  <ShieldCheck aria-hidden="true" size={24} />
                </span>
                <h3 className="mt-4 font-semibold">Everything is stocked</h3>
                <p className="mt-1 text-sm text-stockflow-ink/60">
                  No products are currently at or below their low-stock threshold.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead className="bg-stockflow-cream/70 text-xs uppercase tracking-wide text-stockflow-ink/65">
                    <tr>
                      <th className="px-6 py-3 font-semibold" scope="col">Product</th>
                      <th className="px-6 py-3 font-semibold" scope="col">SKU</th>
                      <th className="px-6 py-3 font-semibold" scope="col">On hand</th>
                      <th className="px-6 py-3 font-semibold" scope="col">Threshold</th>
                      <th className="px-6 py-3 font-semibold" scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stockflow-gray/50">
                    {data.low_stock_items.map((item) => (
                      <tr className="transition hover:bg-stockflow-cream/35" key={item.id}>
                        <td className="px-6 py-4 font-medium">{item.name}</td>
                        <td className="px-6 py-4 font-mono text-xs text-stockflow-ink/70">
                          {item.sku}
                        </td>
                        <td className="px-6 py-4 tabular-nums">{numberFormatter.format(item.stock_quantity)}</td>
                        <td className="px-6 py-4 tabular-nums">{numberFormatter.format(item.low_stock_threshold)}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800">
                            <span aria-hidden="true" className="size-1.5 rounded-full bg-red-600" />
                            Low stock
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default DashboardPage
