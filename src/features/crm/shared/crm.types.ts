export type Role = 'admin' | 'recepcion' | 'optometrista'

export type ManagedUser = {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  createdAt: string
}

export type InventoryProduct = {
  id: string
  sku: string
  name: string
  description?: string | null
  imageUrl?: string | null
  category: string
  categoryId?: string | null
  price: number
  stock: number
  catalogo: boolean
  active: boolean
  createdAt: string
  updatedAt?: string
}

export type Service = {
  id: string
  name: string
  description?: string | null
  category: string
  price: number
  active: boolean
  createdAt: string
  updatedAt?: string
}

export type SaleItem = {
  productId?: string | null
  serviceId?: string | null
  productName?: string | null
  serviceName?: string | null
  itemType?: 'PRODUCT' | 'SERVICE' | string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type PaymentMethod = 'EFECTIVO' | 'TARJETA'

export type SalePayment = {
  id: string
  metodo: PaymentMethod | string
  monto: number
  createdAt: string
}

export type Sale = {
  id: string
  folio: string
  patientId: string | null
  sellerId: string
  sellerName?: string
  subtotal: number
  discount: number
  total: number
  status: string
  createdAt: string
  items: SaleItem[]
  rfc?: string | null
  numeroFactura?: string | null
  payments: SalePayment[]
  totalEfectivo: number
  totalTarjeta: number
  totalPagado: number
  saldoPendiente: number
}

export type Patient = {
  id: string
  firstName: string
  lastName: string
  birthDate?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  active: boolean
  createdAt: string
  updatedAt?: string
}

export type Consultation = {
  id: string
  patientId: string
  professionalId?: string
  professionalName?: string
  consultationDate: string
  reason: string
  visualAcuity?: string
  graduation?: string
  observations?: string
  recommendations?: string
  nextReviewAt?: string | null
  createdAt: string
}
