import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  Clock3,
  Pencil,
  RefreshCw,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useParams } from 'react-router-dom'
import FormField from '../components/FormField'
import { stockMovementSchema } from '../schemas/inventorySchemas'
import {
  createStockMovement,
  getCategories,
  getProduct,
  getStockMovements,
} from '../services/inventoryService'
import { getApiErrorMessage } from '../utils/apiError'
import { formatDateTime, formatNumber, formatPrice } from '../utils/formatters'

function ProductDetailPage() {
  const { productId } = useParams()
  const id = Number(productId)
  const validId = Number.isInteger(id) && id > 0
  const location = useLocation()
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState(location.state?.notice || '')
  const [requestError, setRequestError] = useState('')
  const productQuery = useQuery({
    queryKey: ['products', id],
    queryFn: () => getProduct(id),
    enabled: validId,
  })
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
  const movementsQuery = useQuery({
    queryKey: ['products', id, 'stock-movements'],
    queryFn: () => getStockMovements(id),
    enabled: validId && productQuery.isSuccess,
  })
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      movement_type: 'in',
      quantity: '1',
      note: '',
    },
  })
  const movementMutation = useMutation({
    mutationFn: (movement) => createStockMovement(id, movement),
  })

  async function onSubmit(values) {
    if (values.movement_type === 'out' && values.quantity > productQuery.data.stock_quantity) {
      setError('quantity', {
        message: 'Quantity cannot exceed the current stock on hand.',
      })
      return
    }

    setNotice('')
    setRequestError('')
    try {
      await movementMutation.mutateAsync(values)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products', id] }),
        queryClient.invalidateQueries({ queryKey: ['products', id, 'stock-movements'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] }),
      ])
      reset({ movement_type: values.movement_type, quantity: '1', note: '' })
      setNotice('Stock movement recorded.')
    } catch (error) {
      setRequestError(getApiErrorMessage(error, 'Unable to record this stock movement.'))
    }
  }

  if (!validId) {
    return (
      <section className="rounded-2xl border border-stockflow-gray bg-white p-6" role="alert">
        <h1 className="text-xl font-semibold">Product not found</h1>
        <Link className="mt-4 inline-flex text-sm font-semibold text-stockflow-slate underline" to="/products">
          Back to products
        </Link>
      </section>
    )
  }

  if (productQuery.isPending) {
    return <p aria-live="polite">Loading product…</p>
  }

  if (productQuery.isError) {
    return (
      <section className="rounded-2xl border border-stockflow-gray bg-white p-6" role="alert">
        <h1 className="text-xl font-semibold">Could not load this product</h1>
        <p className="mt-2 text-sm text-stockflow-ink/70">
          {getApiErrorMessage(productQuery.error, 'Try again in a moment.')}
        </p>
        <button
          className="mt-4 text-sm font-semibold text-stockflow-slate underline"
          onClick={() => productQuery.refetch()}
          type="button"
        >
          Try again
        </button>
      </section>
    )
  }

  const product = productQuery.data
  const category = categoriesQuery.data?.find((item) => item.id === product.category_id)

  return (
    <div>
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-stockflow-slate hover:underline"
        to="/products"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Back to products
      </Link>

      {notice && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
          {notice}
        </p>
      )}
      {requestError && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {requestError}
        </p>
      )}

      <section className="mt-5 rounded-2xl border border-stockflow-gray/75 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-sm text-stockflow-ink/55">{product.sku}</p>
            <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight">{product.name}</h1>
            <p className="mt-3 max-w-3xl leading-7 text-stockflow-ink/70">
              {product.description || 'No description has been added.'}
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-stockflow-gray px-3 text-sm font-semibold transition hover:bg-stockflow-cream"
            to={`/products/${product.id}/edit`}
          >
            <Pencil aria-hidden="true" size={16} />
            Edit product
          </Link>
        </div>

        <dl className="mt-7 grid gap-4 border-t border-stockflow-gray/60 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-sm text-stockflow-ink/60">Category</dt>
            <dd className="mt-1 font-medium">
              {product.category_id == null ? (
                'Uncategorized'
              ) : category ? (
                <Link className="text-stockflow-slate hover:underline" to={`/categories/${category.id}`}>
                  {category.name}
                </Link>
              ) : (
                <Link className="text-stockflow-slate hover:underline" to={`/categories/${product.category_id}`}>
                  View category
                </Link>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-stockflow-ink/60">Unit price</dt>
            <dd className="mt-1 font-medium tabular-nums">{formatPrice(product.unit_price)}</dd>
          </div>
          <div>
            <dt className="text-sm text-stockflow-ink/60">Cost price</dt>
            <dd className="mt-1 font-medium tabular-nums">{formatPrice(product.cost_price)}</dd>
          </div>
          <div>
            <dt className="text-sm text-stockflow-ink/60">Selling price</dt>
            <dd className="mt-1 font-medium tabular-nums">{formatPrice(product.selling_price)}</dd>
          </div>
          <div>
            <dt className="text-sm text-stockflow-ink/60">Available quantity</dt>
            <dd className="mt-1 font-medium tabular-nums">{formatNumber(product.stock_quantity)}</dd>
          </div>
          <div>
            <dt className="text-sm text-stockflow-ink/60">Low-stock threshold</dt>
            <dd className="mt-1 font-medium tabular-nums">
              {product.low_stock_threshold == null
                ? 'Organization default'
                : formatNumber(product.low_stock_threshold)}
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1.3fr)]">
        <section className="rounded-2xl border border-stockflow-gray/75 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-stockflow-cream text-stockflow-slate">
              <ArrowLeftRightIcon />
            </span>
            <div>
              <h2 className="font-semibold">Adjust stock</h2>
              <p className="text-sm text-stockflow-ink/60">
                Current: {formatNumber(product.stock_quantity)}
              </p>
            </div>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" htmlFor="movement_type">Movement type</label>
              <select
                className="min-h-11 w-full rounded-lg border border-stockflow-gray bg-white px-3 outline-none transition focus:border-stockflow-slate focus:ring-2 focus:ring-stockflow-slate/20"
                id="movement_type"
                {...register('movement_type')}
              >
                <option value="in">Stock in</option>
                <option value="out">Stock out</option>
              </select>
              {errors.movement_type && <p className="text-sm text-red-700">{errors.movement_type.message}</p>}
            </div>
            <FormField
              error={errors.quantity?.message}
              id="movement_quantity"
              label="Quantity"
              min="1"
              step="1"
              type="number"
              {...register('quantity')}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" htmlFor="movement_note">
                Note <span className="font-normal text-stockflow-ink/55">(optional)</span>
              </label>
              <textarea
                aria-describedby={errors.note ? 'movement_note-error' : undefined}
                aria-invalid={Boolean(errors.note)}
                className="min-h-20 w-full resize-y rounded-lg border border-stockflow-gray bg-white px-3 py-2 outline-none transition focus:border-stockflow-slate focus:ring-2 focus:ring-stockflow-slate/20"
                id="movement_note"
                maxLength={500}
                {...register('note')}
              />
              {errors.note && (
                <p className="text-sm text-red-700" id="movement_note-error">{errors.note.message}</p>
              )}
            </div>
            <button
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-stockflow-slate px-4 font-semibold text-white transition hover:bg-stockflow-slate/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || movementMutation.isPending}
              type="submit"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Record movement
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-stockflow-gray/75 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-stockflow-gray/60 px-5 py-5 sm:px-6">
            <span className="grid size-10 place-items-center rounded-xl bg-stockflow-cream text-stockflow-slate">
              <Clock3 aria-hidden="true" size={20} />
            </span>
            <div>
              <h2 className="font-semibold">Stock movement history</h2>
              <p className="text-sm text-stockflow-ink/60">Recorded inventory changes for this product.</p>
            </div>
          </div>
          {movementsQuery.isPending ? (
            <p aria-live="polite" className="p-6 text-sm text-stockflow-ink/60">Loading movement history…</p>
          ) : movementsQuery.isError ? (
            <div className="p-6" role="alert">
              <p className="text-sm text-red-800">
                {getApiErrorMessage(movementsQuery.error, 'Could not load movement history.')}
              </p>
              <button
                className="mt-3 text-sm font-semibold text-stockflow-slate underline"
                onClick={() => movementsQuery.refetch()}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : movementsQuery.data.length === 0 ? (
            <div className="px-5 py-12 text-center sm:px-6">
              <p className="font-medium">No stock movements yet</p>
              <p className="mt-1 text-sm text-stockflow-ink/60">
                New stock adjustments will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-stockflow-gray/50">
              {movementsQuery.data.map((movement) => {
                const isStockIn = movement.movement_type === 'in'
                const MovementIcon = isStockIn ? ArrowDownToLine : ArrowUpFromLine
                return (
                  <li className="flex items-start gap-3 px-5 py-4 sm:px-6" key={movement.id}>
                    <span className={`grid size-9 shrink-0 place-items-center rounded-full ${
                      isStockIn ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'
                    }`}>
                      <MovementIcon aria-hidden="true" size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="font-medium">{isStockIn ? 'Stock in' : 'Stock out'}</p>
                        <p className="text-sm font-semibold tabular-nums">
                          {isStockIn ? '+' : '−'}{formatNumber(movement.quantity)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-stockflow-ink/55">
                        {formatDateTime(movement.created_at)}
                      </p>
                      {movement.note && (
                        <p className="mt-2 break-words text-sm text-stockflow-ink/70">{movement.note}</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function ArrowLeftRightIcon() {
  return (
    <span aria-hidden="true" className="flex items-center gap-0.5">
      <ArrowDownToLine size={14} />
      <ArrowUpFromLine size={14} />
    </span>
  )
}

export default ProductDetailPage
