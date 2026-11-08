import type { Role } from '../shared/crm.types'

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')
const TOKEN_KEY = 'optica.crm.accessToken'

export type AuthUser = {
  id?: string
  name: string
  email: string
  role: Role
  active: boolean
  createdAt?: string
}

type LoginResponse = { accessToken?: unknown; message?: unknown }

async function responseBody(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export function roleFrom(value: unknown): Role {
  const role = typeof value === 'string' ? value.toLowerCase() : ''
  if (role === 'admin' || role === 'recepcion' || role === 'optometrista') return role
  throw new Error('El usuario no tiene un rol válido para el CRM.')
}

async function request(path: string, init?: RequestInit) {
  try {
    return await fetch(`${API_URL}${path}`, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new Error('No se pudo conectar con el servidor.', { cause: error })
  }
}

export async function authenticatedRequest(path: string, init: RequestInit = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY)
  if (!token) throw new Error('Tu sesión no está disponible.')

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  return request(path, { ...init, headers })
}

export async function login(email: string, password: string) {
  const response = await request('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await responseBody(response) as LoginResponse | null

  if (response.status === 401 || response.status === 403) {
    throw new Error('El correo o la contraseña no son correctos.')
  }
  if (!response.ok) throw new Error(typeof body?.message === 'string' ? body.message : 'No se pudo iniciar sesión. Intenta nuevamente.')
  if (typeof body?.accessToken !== 'string' || !body.accessToken) {
    throw new Error('La respuesta del servidor no contiene un token válido.')
  }

  sessionStorage.setItem(TOKEN_KEY, body.accessToken)
  try {
    return await getCurrentUser()
  } catch (error) {
    logout()
    throw error
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = sessionStorage.getItem(TOKEN_KEY)
  if (!token) return null

  const response = await request('/api/v1/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (response.status === 401 || response.status === 403) {
    logout()
    throw new Error('Tu sesión expiró. Inicia sesión nuevamente.')
  }
  if (!response.ok) throw new Error('No se pudo cargar tu perfil.')

  const body = await responseBody(response) as {
    id?: string
    name?: string
    email?: string
    role?: unknown
    active?: unknown
    createdAt?: string
  } | null
  if (!body) throw new Error('El perfil recibido no es válido.')
  if (typeof body.name !== 'string' || typeof body.email !== 'string' || body.active !== true) {
    logout()
    throw new Error('El usuario no está activo o su perfil no es válido.')
  }

  return {
    id: body.id,
    name: body.name,
    email: body.email,
    role: roleFrom(body.role),
    active: true,
    createdAt: body.createdAt,
  }
}

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY)
}
