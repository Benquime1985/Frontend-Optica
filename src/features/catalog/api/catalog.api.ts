const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

export type PublicProduct = {
  id: string
  name: string
  category: string
  imageUrl?: string | null
  price: number
  stock: number
}

type ProductPage = {
  content: PublicProduct[]
  totalPages: number
  totalElements: number
}

const PUBLIC_PRODUCTS_CACHE_TTL = 10_000
const publicProductsCache = new Map<string, { value: ProductPage; cachedAt: number }>()

export async function listPublicProducts(query = '', page = 0, signal?: AbortSignal) {
  const normalizedQuery = query.trim()
  const cacheKey = `${normalizedQuery}:${page}`
  const cached = publicProductsCache.get(cacheKey)
  if (cached && Date.now() - cached.cachedAt < PUBLIC_PRODUCTS_CACHE_TTL) {
    if (signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError')
    return cached.value
  }

  const params = new URLSearchParams({ page: String(page), size: '20', sort: 'name,asc' })
  if (normalizedQuery) params.set('q', normalizedQuery)

  let response: Response
  try {
    response = await fetch(`${API_URL}/api/v1/public/products?${params}`, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new Error('No se pudo conectar con el catálogo.', { cause: error })
  }

  let body: unknown = null
  try { body = await response.json() } catch { /* Error without JSON body. */ }
  if (!response.ok) {
    if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') throw new Error(body.message)
    throw new Error('No se pudo cargar el catálogo.')
  }
  const result = body as ProductPage
  publicProductsCache.set(cacheKey, { value: result, cachedAt: Date.now() })
  return result
}
