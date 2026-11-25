import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCategories, getProducts, deleteProduct } from '../services/inventoryService'
import { getApiErrorMessage } from '../utils/apiError'
import { formatNumber, formatPrice } from '../utils/formatters'

const pageSize = 100

function ProductsPage() {
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [offset, setOffset] = useState(0)
  const [notice, setNotice] = useState('')
  const [requestError, setRequestError] = useState('')
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
  const productsQuery = useQuery({
    queryKey: ['products', { categoryId, search, offset }],
    queryFn: () =>
      getProducts({
        categoryId: categoryId ? Number(categoryId) : undefined,
        search: search || undefined,
        offset,
        limit: pageSize + 1,
      }),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: async (_, productId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] }),
      ])
      setRequestError('')
      setNotice('Product deleted.')
      if (productsQuery.data?.length === 1 && offset > 0) {
        setOffset(Math.max(0, offset - pageSize))
      }
    },
    onError: (error) => {
      setNotice('')
      setRequestError(getApiErrorMessage(error, 'Unable to delete the product.'))
    },
  })
  const categoriesById = new Map(
    (categoriesQuery.data || []).map((category) => [category.id, category.name]),
  )
  const visibleProducts = (productsQuery.data || []).slice(0, pageSize)
  const hasNextPage = (productsQuery.data || []).length > pageSize

  function applySearch(event) {
    event.preventDefault()
    setOffset(0)
    setSearch(searchInput.trim())
  }

  function changeCategory(value) {
    setCategoryId(value)
    setOffset(0)
  }

  function confirmDelete(product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      return
    }
    setNotice('')
    setRequestError('')
    deleteMutation.mutate(product.id)
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stockflow-slate">
            Inventory
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Products</h1>
          <p className="mt-2 text-sm leading-6 text-stockflow-ink/65">
            Browse and manage products across your organization.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-stockflow-slate px-4 font-semibold text-white transition hover:bg-stockflow-slate/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stockflow-slate sm:self-auto"
          to="/products/new"
        >
          <Plus aria-hidden="true" size={18} />
          Add product
        </Link>
      </div>

      {notice && <p className="mt-5 text-sm text-green-800" role="status">{notice}</p>}
      {requestError && <p className="mt-5 text-sm text-red-800" role="alert">{requestError}</p>}

      <section className="mt-7 rounded-2xl border border-stockflow-gray/75 bg-white p-4 shadow-sm sm:p-5">
        <form className="grid gap-3 md:grid-cols-[minmax(14rem,1fr)_minmax(12rem,0.5fr)_auto]" onSubmit={applySearch}>
          <label className="relative block">
            <span className="sr-only">Search products by name or SKU</span>
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-stockflow-ink/45" size={18} />
            <input
              className="min-h-11 w-full rounded-lg border border-stockflow-gray bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-stockflow-ink/45 focus:border-stockflow-slate focus:ring-2 focus:ring-stockflow-slate/20"
              maxLength={100}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by product name or SKU"
              value={searchInput}
            />
          </label>
          <label className="block">
            <span className="sr-only">Filter by category</span>
            <select
              className="min-h-11 w-full rounded-lg border border-stockflow-gray bg-white px-3 text-sm outline-none transition focus:border-stockflow-slate focus:ring-2 focus:ring-stockflow-slate/20"
              onChange={(event) => changeCategory(event.target.value)}
              value={categoryId}
            >
              <option value="">All categories</option>
              {(categoriesQuery.data || []).map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stockflow-gray px-4 text-sm font-semibold transition hover:bg-stockflow-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stockflow-slate"
            type="submit"
          >
            <Search aria-hidden="true" size={16} />
            Search
          </button>
        </form>
        {categoriesQuery.isError && (
          <p className="mt-3 text-sm text-red-800" role="alert">
            Category filters could not be loaded: {getApiErrorMessage(categoriesQuery.error, 'Try again later.')}
          </p>
        )}
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-stockflow-gray/75 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stockflow-gray/60 px-5 py-4 sm:px-6">
          <h2 className="font-semibold">
            {productsQuery.data
              ? visibleProducts.length
                ? `${formatNumber(offset + 1)}–${formatNumber(offset + visibleProducts.length)} products`
                : '0 products'
              : 'Product list'}
          </h2>
          <span className="text-sm text-stockflow-ink/55">
            {search || categoryId ? 'Filtered results' : 'All products'}
          </span>
        </div>

        {productsQuery.isPending ? (
          <div aria-busy="true" className="space-y-3 p-5 sm:p-6">
            {[1, 2, 3, 4].map((item) => (
              <div className="h-14 animate-pulse rounded-lg bg-stockflow-cream" key={item} />
            ))}
          </div>
        ) : productsQuery.isError ? (
          <div className="p-6" role="alert">
            <p className="text-sm text-red-800">
              {getApiErrorMessage(productsQuery.error, 'Could not load products.')}
            </p>
            <button
              className="mt-3 text-sm font-semibold text-stockflow-slate underline"
              onClick={() => productsQuery.refetch()}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-stockflow-cream text-stockflow-slate">
              <Package aria-hidden="true" size={23} />
            </span>
            <h3 className="mt-4 font-semibold">No products found</h3>
            <p className="mt-1 text-sm text-stockflow-ink/60">
              {search || categoryId
                ? 'Try another search or category filter.'
                : 'Add your first product to get started.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left text-sm">
                <thead className="bg-stockflow-cream/70 text-xs uppercase tracking-wide text-stockflow-ink/65">
                  <tr>
                    <th className="px-5 py-3 font-semibold sm:px-6" scope="col">Product</th>
                    <th className="px-5 py-3 font-semibold" scope="col">Category</th>
                    <th className="px-5 py-3 font-semibold" scope="col">Unit price</th>
                    <th className="px-5 py-3 font-semibold" scope="col">Quantity</th>
                    <th className="px-5 py-3 font-semibold" scope="col">Threshold</th>
                    <th className="px-5 py-3 font-semibold" scope="col">Status</th>
                    <th className="px-5 py-3 font-semibold" scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stockflow-gray/50">
                  {visibleProducts.map((product) => {
                    const status = !product.is_active
                      ? 'Inactive'
                      : product.stock_quantity === 0
                        ? 'Out of stock'
                        : product.low_stock_threshold != null &&
                            product.stock_quantity <= product.low_stock_threshold
                          ? 'Low stock'
                          : 'In stock'
                    return (
                      <tr className="transition hover:bg-stockflow-cream/35" key={product.id}>
                        <td className="px-5 py-4 sm:px-6">
                          <Link className="font-semibold hover:text-stockflow-slate hover:underline" to={`/products/${product.id}`}>
                            {product.name}
                          </Link>
                          <span className="mt-1 block font-mono text-xs text-stockflow-ink/55">{product.sku}</span>
                        </td>
                        <td className="px-5 py-4">{categoriesById.get(product.category_id) || 'Uncategorized'}</td>
                        <td className="px-5 py-4 tabular-nums">{formatPrice(product.unit_price)}</td>
                        <td className="px-5 py-4 tabular-nums">{formatNumber(product.stock_quantity)}</td>
                        <td className="px-5 py-4 tabular-nums">
                          {product.low_stock_threshold == null
                            ? '—'
                            : formatNumber(product.low_stock_threshold)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            status === 'Inactive'
                              ? 'bg-stockflow-gray/40 text-stockflow-ink/65'
                              : status === 'In stock'
                                ? 'bg-green-50 text-green-800'
                                : 'bg-red-50 text-red-800'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              aria-label={`View ${product.name}`}
                              className="grid size-9 place-items-center rounded-lg text-stockflow-slate transition hover:bg-stockflow-cream"
                              to={`/products/${product.id}`}
                            >
                              <Eye aria-hidden="true" size={17} />
                            </Link>
                            <Link
                              aria-label={`Edit ${product.name}`}
                              className="grid size-9 place-items-center rounded-lg text-stockflow-slate transition hover:bg-stockflow-cream"
                              to={`/products/${product.id}/edit`}
                            >
                              <Pencil aria-hidden="true" size={17} />
                            </Link>
                            <button
                              aria-label={`Delete ${product.name}`}
                              className="grid size-9 place-items-center rounded-lg text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                              disabled={deleteMutation.isPending}
                              onClick={() => confirmDelete(product)}
                              type="button"
                            >
                              <Trash2 aria-hidden="true" size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-stockflow-gray/60 px-5 py-3 sm:px-6">
              <p className="text-sm text-stockflow-ink/60">
                Showing {formatNumber(offset + 1)}–{formatNumber(offset + visibleProducts.length)}
              </p>
              <div className="flex gap-2">
                <button
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-stockflow-gray px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={offset === 0 || productsQuery.isFetching}
                  onClick={() => setOffset(Math.max(0, offset - pageSize))}
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" size={16} />
                  Previous
                </button>
                <button
                  className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-stockflow-gray px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!hasNextPage || productsQuery.isFetching}
                  onClick={() => setOffset(offset + pageSize)}
                  type="button"
                >
                  Next
                  <ChevronRight aria-hidden="true" size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default ProductsPage
