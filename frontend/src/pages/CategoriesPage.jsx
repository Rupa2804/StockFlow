import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Plus, Tags } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import FormField from '../components/FormField'
import { categorySchema } from '../schemas/inventorySchemas'
import { createCategory, getCategories } from '../services/inventoryService'
import { getApiErrorMessage } from '../utils/apiError'
import { formatDateTime } from '../utils/formatters'

function CategoriesPage() {
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState('')
  const [requestError, setRequestError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  })
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      reset({ name: '', description: '' })
      setRequestError('')
      setNotice('Category created.')
    },
    onError: (error) => {
      setNotice('')
      setRequestError(getApiErrorMessage(error, 'Unable to create the category.'))
    },
  })

  function onSubmit(values) {
    setNotice('')
    setRequestError('')
    createMutation.mutate(values)
  }

  return (
    <div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stockflow-slate">
          Inventory
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Categories</h1>
        <p className="mt-2 text-sm leading-6 text-stockflow-ink/65">
          Organize products into categories for easier browsing.
        </p>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <section className="overflow-hidden rounded-2xl border border-stockflow-gray/75 bg-white shadow-sm">
          <div className="border-b border-stockflow-gray/60 px-5 py-5 sm:px-6">
            <h2 className="text-lg font-semibold">Your categories</h2>
            <p className="mt-1 text-sm text-stockflow-ink/60">
              {categoriesQuery.data
                ? `${categoriesQuery.data.length} categories`
                : 'Categories available to your organization'}
            </p>
          </div>

          {categoriesQuery.isPending ? (
            <div aria-busy="true" className="space-y-3 p-5 sm:p-6">
              {[1, 2, 3].map((item) => (
                <div className="h-20 animate-pulse rounded-xl bg-stockflow-cream" key={item} />
              ))}
            </div>
          ) : categoriesQuery.isError ? (
            <div className="p-6" role="alert">
              <p className="text-sm text-red-800">
                {getApiErrorMessage(categoriesQuery.error, 'Could not load categories.')}
              </p>
              <button
                className="mt-3 text-sm font-semibold text-stockflow-slate underline"
                onClick={() => categoriesQuery.refetch()}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : categoriesQuery.data.length === 0 ? (
            <div className="px-5 py-12 text-center sm:px-6">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-stockflow-cream text-stockflow-slate">
                <Tags aria-hidden="true" size={23} />
              </span>
              <h3 className="mt-4 font-semibold">No categories yet</h3>
              <p className="mt-1 text-sm text-stockflow-ink/60">
                Create a category to organize your products.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-stockflow-gray/50">
              {categoriesQuery.data.map((category) => (
                <li key={category.id}>
                  <Link
                    className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-stockflow-cream/45 sm:px-6"
                    to={`/categories/${category.id}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{category.name}</span>
                      <span className="mt-1 block truncate text-sm text-stockflow-ink/60">
                        {category.description || 'No description'}
                        {' · '}
                        {formatDateTime(category.created_at)}
                      </span>
                    </span>
                    <ArrowRight aria-hidden="true" className="shrink-0 text-stockflow-slate" size={18} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="h-fit rounded-2xl border border-stockflow-gray/75 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-stockflow-cream text-stockflow-slate">
              <Plus aria-hidden="true" size={21} />
            </span>
            <div>
              <h2 className="font-semibold">Add a category</h2>
              <p className="text-sm text-stockflow-ink/60">Create an inventory group.</p>
            </div>
          </div>

          {notice && <p className="mt-4 text-sm text-green-800" role="status">{notice}</p>}
          {requestError && <p className="mt-4 text-sm text-red-800" role="alert">{requestError}</p>}

          <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormField
              error={errors.name?.message}
              id="category_name"
              label="Name"
              maxLength={100}
              placeholder="For example, Beverages"
              {...register('name')}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" htmlFor="category_description">
                Description <span className="font-normal text-stockflow-ink/55">(optional)</span>
              </label>
              <textarea
                aria-describedby={errors.description ? 'category_description-error' : undefined}
                aria-invalid={Boolean(errors.description)}
                className="min-h-24 w-full resize-y rounded-lg border border-stockflow-gray bg-white px-3 py-2 text-stockflow-ink outline-none transition placeholder:text-stockflow-ink/40 focus:border-stockflow-slate focus:ring-2 focus:ring-stockflow-slate/20"
                id="category_description"
                maxLength={500}
                placeholder="Add a short description"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-700" id="category_description-error">
                  {errors.description.message}
                </p>
              )}
            </div>
            <button
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-stockflow-slate px-4 font-semibold text-white transition hover:bg-stockflow-slate/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stockflow-slate disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || createMutation.isPending}
              type="submit"
            >
              <Plus aria-hidden="true" size={17} />
              Add category
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default CategoriesPage
