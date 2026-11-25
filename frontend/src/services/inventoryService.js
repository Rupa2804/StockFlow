import { apiClient } from './apiClient'

export async function getCategories() {
  const { data } = await apiClient.get('categories')
  return data
}

export async function getCategory(categoryId) {
  const { data } = await apiClient.get(`categories/${categoryId}`)
  return data
}

export async function createCategory(category) {
  const { data } = await apiClient.post('categories', category)
  return data
}

export async function getProducts({ categoryId, search, offset = 0, limit = 101 }) {
  const params = { offset, limit }
  if (categoryId) params.category_id = categoryId
  if (search) params.search = search
  const { data } = await apiClient.get('products', { params })
  return data
}

export async function getProduct(productId) {
  const { data } = await apiClient.get(`products/${productId}`)
  return data
}

export async function createProduct(product) {
  const { data } = await apiClient.post('products', product)
  return data
}

export async function updateProduct(productId, product) {
  const { data } = await apiClient.patch(`products/${productId}`, product)
  return data
}

export async function deleteProduct(productId) {
  await apiClient.delete(`products/${productId}`)
}

export async function getStockMovements(productId) {
  const { data } = await apiClient.get(
    `products/${productId}/stock-movements`,
  )
  return data
}

export async function createStockMovement(productId, movement) {
  const { data } = await apiClient.post(
    `products/${productId}/stock-movements`,
    movement,
  )
  return data
}
