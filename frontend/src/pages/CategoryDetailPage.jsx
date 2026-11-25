import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Tags } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getCategory } from '../services/inventoryService'
import { getApiErrorMessage } from '../utils/apiError'
import { formatDateTime } from '../utils/formatters'

function CategoryDetailPage() {
  const { categoryId } = useParams()
  const id = Number(categoryId)
  const validId = Number.isInteger(id) && id > 0
  const categoryQuery = useQuery({
    queryKey: ['categories', id],
    queryFn: () => getCategory(id),
    enabled: validId,
  })

  if (!validId) {
    return (
      <section className="rounded-2xl border border-stockflow-gray bg-white p-6" role="alert">
        <h1 className="text-xl font-semibold">Category not found</h1>
        <Link className="mt-4 inline-flex text-sm font-semibold text-stockflow-slate underline" to="/categories">
          Back to categories
        </Link>
      </section>
    )
  }

  if (categoryQuery.isPending) {
    return <p aria-live="polite">Loading category…</p>
  }

  if (categoryQuery.isError) {
    return (
      <section className="rounded-2xl border border-stockflow-gray bg-white p-6" role="alert">
        <h1 className="text-xl font-semibold">Could not load this category</h1>
        <p className="mt-2 text-sm text-stockflow-ink/70">
          {getApiErrorMessage(categoryQuery.error, 'Try again in a moment.')}
        </p>
        <button
          className="mt-4 text-sm font-semibold text-stockflow-slate underline"
          onClick={() => categoryQuery.refetch()}
          type="button"
        >
          Try again
        </button>
      </section>
    )
  }

  const category = categoryQuery.data

  return (
    <div className="max-w-3xl">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-stockflow-slate hover:underline"
        to="/categories"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Back to categories
      </Link>
      <section className="mt-5 rounded-2xl border border-stockflow-gray/75 bg-white p-6 shadow-sm sm:p-8">
        <span className="grid size-12 place-items-center rounded-xl bg-stockflow-cream text-stockflow-slate">
          <Tags aria-hidden="true" size={24} />
        </span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-stockflow-slate">
          Category details
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{category.name}</h1>
        <p className="mt-3 leading-7 text-stockflow-ink/70">
          {category.description || 'No description has been added.'}
        </p>
        <dl className="mt-8 grid gap-4 border-t border-stockflow-gray/60 pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-stockflow-ink/60">Category ID</dt>
            <dd className="mt-1 font-medium">{category.id}</dd>
          </div>
          <div>
            <dt className="text-sm text-stockflow-ink/60">Created</dt>
            <dd className="mt-1 font-medium">{formatDateTime(category.created_at)}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

export default CategoryDetailPage
