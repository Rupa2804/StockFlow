import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import FormField from '../components/FormField'
import { productSchema } from '../schemas/inventorySchemas'
import {
  createProduct,
  getCategories,
  getProduct,
  updateProduct,
} from '../services/inventoryService'
import { getApiErrorMessage } from '../utils/apiError'

const initialValues = {
  sku: '',
  name: '',
  description: '',
  unit_price: '',
  cost_price: '',
  selling_price: '',
  stock_quantity: '0',
  low_stock_threshold: '',
  category_id: '',
  is_active: true,
}

function valuesFromProduct(product) {
  return {
    sku: product.sku,
    name: product.name,
    description: product.description || '',
    unit_price: product.unit_price == null ? '' : String(product.unit_price),
    cost_price: product.cost_price == null ? '' : String(product.cost_price),
    selling_price: product.selling_price == null ? '' : String(product.selling_price),
    stock_quantity: String(product.stock_quantity),
    low_stock_threshold:
      product.low_stock_threshold == null ? '' : String(product.low_stock_threshold),
    category_id: product.category_id == null ? '' : String(product.category_id),
    is_active: product.is_active,
  }
}

function ProductFormPage() {
  const { productId } = useParams()
  const isEditing = Boolean(productId)
  const id = Number(productId)
  const validId = !isEditing || (Number.isInteger(id) && id > 0)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [requestError, setRequestError] = useState('')
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
  const productQuery = useQuery({
    queryKey: ['products', id],
    queryFn: () => getProduct(id),
    enabled: isEditing && validId,
  })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: initialValues,
  })
  const createMutation = useMutation({ mutationFn: createProduct })
  const updateMutation = useMutation({ mutationFn: ({ productId, values }) => updateProduct(productId, values) })

  useEffect(() => {
    if (productQuery.data) {
      reset(valuesFromProduct(productQuery.data))
    }
  }, [productQuery.data, reset])

  async function onSubmit(values) {
    setRequestError('')
    try {
      if (isEditing) {
        const changes = Object.fromEntries(
          Object.keys(dirtyFields).map((field) => [field, values[field]]),
        )
        if (Object.keys(changes).length === 0) return
        const updatedProduct = await updateMutation.mutateAsync({
          productId: id,
          values: changes,
        })
        queryClient.setQueryData(['products', id], updatedProduct)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['products'] }),
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] }),
        ])
        navigate(`/products/${id}`, {
          replace: true,
          state: { notice: 'Product updated.' },
        })
        return
      }

      const { is_active: _isActive, ...newProduct } = values
      const createdProduct = await createMutation.mutateAsync(newProduct)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] }),
      ])
      navigate(`/products/${createdProduct.id}`, {
        replace: true,
        state: { notice: 'Product created.' },
      })
    } catch (error) {
      setRequestError(
        getApiErrorMessage(error, `Unable to ${isEditing ? 'update' : 'create'} the product.`),
      )
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

  if (categoriesQuery.isPending || (isEditing && productQuery.isPending)) {
    return <p aria-live="polite">Loading product form…</p>
  }

  if (isEditing && productQuery.isError) {
    return (
      <section className="rounded-2xl border border-stockflow-gray bg-white p-6" role="alert">
        <h1 className="text-xl font-semibold">Could not load this product</h1>
        <p className="mt-2 text-sm text-stockflow-ink/70">
          {getApiErrorMessage(productQuery.error, 'Try again in a moment.')}
        </p>
        <Link className="mt-4 inline-flex text-sm font-semibold text-stockflow-slate underline" to="/products">
          Back to products
        </Link>
      </section>
    )
  }

  return (
    <div className="max-w-4xl">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-stockflow-slate hover:underline"
        to={isEditing ? `/products/${id}` : '/products'}
      >
        <ArrowLeft aria-hidden="true" size={16} />
        {isEditing ? 'Back to product' : 'Back to products'}
      </Link>
      <div className="mt-5">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stockflow-slate">
          Inventory
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {isEditing ? 'Edit product' : 'Add product'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-stockflow-ink/65">
          {isEditing
            ? 'Update product details. Use stock movements to adjust current inventory.'
            : 'Add a product to your organization inventory.'}
        </p>
      </div>

      {categoriesQuery.isError && (
        <div className="mt-5 rounded-xl border border-red-200 bg-white p-4 text-sm text-red-800" role="alert">
          Categories could not be loaded. You can still save this product without a category.
        </div>
      )}
      {requestError && (
        <div className="mt-5 rounded-xl border border-red-200 bg-white p-4 text-sm text-red-800" role="alert">
          {requestError}
        </div>
      )}

      <form className="mt-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <section className="rounded-2xl border border-stockflow-gray/75 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-semibold">Product information</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <FormField
              autoComplete="off"
              error={errors.sku?.message}
              id="product_sku"
              label="SKU"
              maxLength={64}
              {...register('sku')}
            />
            <FormField
              error={errors.name?.message}
              id="product_name"
              label="Product name"
              maxLength={160}
              {...register('name')}
            />
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-sm font-medium" htmlFor="product_description">
                Description <span className="font-normal text-stockflow-ink/55">(optional)</span>
              </label>
              <textarea
                aria-describedby={errors.description ? 'product_description-error' : undefined}
                aria-invalid={Boolean(errors.description)}
                className="min-h-24 w-full resize-y rounded-lg border border-stockflow-gray bg-white px-3 py-2 outline-none transition placeholder:text-stockflow-ink/40 focus:border-stockflow-slate focus:ring-2 focus:ring-stockflow-slate/20"
                id="product_description"
                maxLength={1000}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-700" id="product_description-error">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-sm font-medium" htmlFor="product_category">
                Category <span className="font-normal text-stockflow-ink/55">(optional)</span>
              </label>
              <select
                aria-invalid={Boolean(errors.category_id)}
                className="min-h-11 w-full rounded-lg border border-stockflow-gray bg-white px-3 outline-none transition focus:border-stockflow-slate focus:ring-2 focus:ring-stockflow-slate/20"
                id="product_category"
                {...register('category_id')}
              >
                <option value="">Uncategorized</option>
                {(categoriesQuery.data || []).map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-sm text-red-700">{errors.category_id.message}</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-stockflow-gray/75 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-semibold">Pricing and stock</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              error={errors.unit_price?.message}
              id="unit_price"
              label="Unit price"
              min="0"
              placeholder="0.00"
              step="0.01"
              type="number"
              {...register('unit_price')}
            />
            <FormField
              error={errors.cost_price?.message}
              id="cost_price"
              label="Cost price"
              min="0"
              placeholder="0.00"
              step="0.01"
              type="number"
              {...register('cost_price')}
            />
            <FormField
              error={errors.selling_price?.message}
              id="selling_price"
              label="Selling price"
              min="0"
              placeholder="0.00"
              step="0.01"
              type="number"
              {...register('selling_price')}
            />
            {isEditing ? (
              <div className="rounded-lg bg-stockflow-cream/75 p-3 text-sm sm:col-span-2 lg:col-span-3">
                Current quantity: <strong>{productQuery.data.stock_quantity}</strong>. Record stock changes from the product details page to keep movement history.
              </div>
            ) : (
              <FormField
                error={errors.stock_quantity?.message}
                id="stock_quantity"
                label="Starting quantity"
                min="0"
                step="1"
                type="number"
                {...register('stock_quantity')}
              />
            )}
            <FormField
              error={errors.low_stock_threshold?.message}
              id="low_stock_threshold"
              label="Low-stock threshold"
              min="0"
              placeholder="Use organization default"
              step="1"
              type="number"
              {...register('low_stock_threshold')}
            />
          </div>
          {isEditing && (
            <label className="mt-5 inline-flex min-h-10 items-center gap-3 text-sm font-medium">
              <input
                className="size-4 accent-stockflow-slate"
                type="checkbox"
                {...register('is_active')}
              />
              Product is active
            </label>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-stockflow-gray bg-white px-4 font-semibold transition hover:bg-stockflow-cream"
            to={isEditing ? `/products/${id}` : '/products'}
          >
            Cancel
          </Link>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-stockflow-slate px-5 font-semibold text-white transition hover:bg-stockflow-slate/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stockflow-slate disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending || (isEditing && !isDirty)}
            type="submit"
          >
            <Save aria-hidden="true" size={17} />
            {isEditing ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductFormPage
