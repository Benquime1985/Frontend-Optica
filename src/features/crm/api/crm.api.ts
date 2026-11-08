import { authenticatedRequest, roleFrom } from '../auth/auth.api'
import type { Consultation, InventoryProduct, ManagedUser, Patient, PaymentMethod, Role, Sale, Service } from '../shared/crm.types'

type PatientPage = {
  content: Patient[]
  totalPages: number
  totalElements: number
}

export type PatientDraft = {
  firstName: string
  lastName: string
  birthDate?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

export type ConsultationDraft = {
  reason: string
  visualAcuity: string
  graduation: string
  observations: string
  recommendations: string
}

export type UserDraft = {
  name: string
  email: string
  role: Role
  password?: string | null
  active?: boolean
}

type UserResponse = Omit<ManagedUser, 'role'> & { role: unknown }

type UserPage = {
  content: UserResponse[]
  totalPages: number
  totalElements: number
}

type ProductPage = {
  content: InventoryProduct[]
  totalPages: number
  totalElements: number
}

export type ProductDraft = {
  sku: string
  name: string
  description?: string | null
  imageUrl?: string | null
  category?: string | null
  categoryId?: string | null
  price: number
  stock: number
  catalogo: boolean
}

export type Category = { id: string; name: string; orden: number; active: boolean }

export async function listCategories() {
  const response = await authenticatedRequest('/api/v1/categories')
  return readJson<Category[]>(response)
}

export async function createCategory(name: string, orden: number) {
  const response = await authenticatedRequest('/api/v1/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, orden }),
  })
  return readJson<Category>(response)
}

export type SaleDraft = {
  patientId: string | null
  discount: number
  items: Array<{ productId?: string; serviceId?: string; quantity: number }>
  pago?: { monto: number; metodo: PaymentMethod }
}

export type SalePaymentDraft = {
  monto: number
  metodo: PaymentMethod
}

function normalizeUser(user: UserResponse): ManagedUser {
  return { ...user, role: roleFrom(user.role) }
}

async function readJson<T>(response: Response): Promise<T> {
  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    // Some errors do not include a JSON body.
  }
  if (!response.ok) {
    if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
      throw new Error(body.message)
    }
    throw new Error('No se pudo completar la operación.')
  }
  return body as T
}

export async function listPatients(query = '', pageNumber = 0, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(pageNumber), size: '7', sort: 'lastName,asc' })
  if (query.trim()) params.set('q', query.trim())

  const response = await authenticatedRequest(`/api/v1/patients?${params}`, { signal })
  const page = await readJson<PatientPage>(response)
  return page
}

export async function createPatient(draft: PatientDraft) {
  const response = await authenticatedRequest('/api/v1/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  })
  return readJson<Patient>(response)
}

export async function listConsultations(patientId: string, signal?: AbortSignal) {
  const response = await authenticatedRequest(`/api/v1/patients/${patientId}/consultations`, { signal })
  return readJson<Consultation[]>(response)
}

export async function createConsultation(patientId: string, draft: ConsultationDraft) {
  const response = await authenticatedRequest(`/api/v1/patients/${patientId}/consultations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  })
  return readJson<Consultation>(response)
}

export async function listUsers(query = '', page = 0, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page), size: '7', sort: 'name,asc' })
  if (query.trim()) params.set('q', query.trim())
  const response = await authenticatedRequest(`/api/v1/users?${params}`, { signal })
  const result = await readJson<UserPage>(response)
  return { ...result, content: result.content.map(normalizeUser) }
}

export async function createUser(draft: UserDraft) {
  const response = await authenticatedRequest('/api/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...draft, password: draft.password }),
  })
  return normalizeUser(await readJson<UserResponse>(response))
}

export async function updateUser(id: string, draft: UserDraft) {
  const response = await authenticatedRequest(`/api/v1/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...draft, password: draft.password || null }),
  })
  return normalizeUser(await readJson<UserResponse>(response))
}

export async function deleteUser(id: string) {
  const response = await authenticatedRequest(`/api/v1/users/${id}`, { method: 'DELETE' })
  if (!response.ok) await readJson<never>(response)
}

export async function listProducts(query = '', page = 0, size = 7, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page), size: String(size), sort: 'name,asc' })
  if (query.trim()) params.set('q', query.trim())
  const response = await authenticatedRequest(`/api/v1/products?${params}`, { signal })
  return readJson<ProductPage>(response)
}

export async function createProduct(draft: ProductDraft) {
  const response = await authenticatedRequest('/api/v1/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...draft, sku: draft.sku.toUpperCase(), imageUrl: draft.imageUrl || null }),
  })
  return readJson<InventoryProduct>(response)
}

export async function updateProduct(id: string, draft: ProductDraft) {
  const response = await authenticatedRequest(`/api/v1/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...draft, sku: draft.sku.toUpperCase(), imageUrl: draft.imageUrl || null }),
  })
  return readJson<InventoryProduct>(response)
}

export async function deleteProduct(id: string) {
  const response = await authenticatedRequest(`/api/v1/products/${id}`, { method: 'DELETE' })
  if (!response.ok) await readJson<never>(response)
}

type ServicePage = { content: Service[]; totalPages: number; totalElements: number }

export async function listServices(query = '', page = 0, size = 7, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page), size: String(size), sort: 'name,asc' })
  if (query.trim()) params.set('q', query.trim())
  const response = await authenticatedRequest(`/api/v1/services${params.toString() ? `?${params}` : ''}`, { signal })
  const result = await readJson<ServicePage | Service[]>(response)
  return Array.isArray(result) ? { content: result, totalPages: 1, totalElements: result.length } : result
}

export type ServiceDraft = { name: string; description?: string | null; category: string; price: number }

export async function createService(draft: ServiceDraft) {
  const response = await authenticatedRequest('/api/v1/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
  return readJson<Service>(response)
}

export async function updateService(id: string, draft: ServiceDraft) {
  const response = await authenticatedRequest(`/api/v1/services/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
  return readJson<Service>(response)
}

export async function deleteService(id: string) {
  const response = await authenticatedRequest(`/api/v1/services/${id}`, { method: 'DELETE' })
  if (!response.ok) await readJson<never>(response)
}

export async function createSale(draft: SaleDraft) {
  const response = await authenticatedRequest('/api/v1/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  })
  return readJson<Sale>(response)
}

export async function addSalePayment(saleId: string, payment: SalePaymentDraft) {
  const response = await authenticatedRequest(`/api/v1/sales/${saleId}/pago`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payment),
  })
  return readJson<Sale>(response)
}

export async function addSaleItems(saleId: string, items: SaleDraft['items']) {
  const response = await authenticatedRequest(`/api/v1/sales/${saleId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  })
  return readJson<Sale>(response)
}

export async function deliverSale(saleId: string) {
  const response = await authenticatedRequest(`/api/v1/sales/${saleId}/entregar`, { method: 'POST' })
  return readJson<Sale>(response)
}

export type SaleInvoiceDraft = {
  rfc: string
  numeroFactura: string
}

export async function invoiceSale(saleId: string, draft: SaleInvoiceDraft) {
  const response = await authenticatedRequest(`/api/v1/sales/${saleId}/factura`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  })
  return readJson<Sale>(response)
}

type SalePage = {
  content: Sale[]
  totalPages: number
  totalElements: number
}

export async function listSales(query = '', page = 0, status = '', size = 7, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page), size: String(size), sort: 'createdAt,desc' })
  if (query.trim()) params.set('q', query.trim())
  if (status) params.set('status', status)
  const response = await authenticatedRequest(`/api/v1/sales?${params}`, { signal })
  return readJson<SalePage>(response)
}

export async function listPatientSales(patientId: string, page = 0, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page), size: '20', sort: 'createdAt,desc' })
  const response = await authenticatedRequest(`/api/v1/patients/${patientId}/sales?${params}`, { signal })
  return readJson<SalePage>(response)
}
