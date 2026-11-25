import { apiClient } from './apiClient'

export async function getCategories() {
  const { data } = await apiClient.get('/api/v1/categories')
  return data
}

export async function getCategory(categoryId) {
  const { data } = await apiClient.get(`/api/v1/categories/${categoryId}`)
  return data
}

export async function createCategory(category) {
  const { data } = await apiClient.post('/api/v1/categories', category)
  return data
}

export async function getProducts({ categoryId, search, offset = 0, limit = 101 }) {
  const params = { offset, limit }
  if (categoryId) params.category_id = categoryId
  if (search) params.search = search
  const { data } = await apiClient.get('/api/v1/products', { params })
  return data
}

export async function getProduct(productId) {
  const { data } = await apiClient.get(`/api/v1/products/${productId}`)
  return data
}

export async function createProduct(product) {
  const { data } = await apiClient.post('/api/v1/products', product)
  return data
}

export async function updateProduct(productId, product) {
  const { data } = await apiClient.patch(`/api/v1/products/${productId}`, product)
  return data
}

export async function deleteProduct(productId) {
  await apiClient.delete(`/api/v1/products/${productId}`)
}

export async function getStockMovements(productId) {
  const { data } = await apiClient.get(
    `/api/v1/products/${productId}/stock-movements`,
  )
  return data
}

export async function createStockMovement(productId, movement) {
  const { data } = await apiClient.post(
    `/api/v1/products/${productId}/stock-movements`,
    movement,
  )
  return data
}
