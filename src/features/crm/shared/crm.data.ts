import type { Role } from './crm.types'

export type MenuGroup = { label: string; items: string[] }

export const menuGroups: Record<Role, MenuGroup[]> = {
  admin: [
    { label: 'Operación', items: ['Ventas', 'Inventario', 'Servicios'] },
    { label: 'Atención', items: ['Pacientes'] },
    { label: 'Administración', items: ['Usuarios y roles'] },
  ],
  recepcion: [
    { label: 'Operación', items: ['Ventas', 'Inventario'] },
  ],
  optometrista: [
    { label: 'Atención', items: ['Mi agenda', 'Pacientes', 'Historial clínico', 'Nueva consulta'] },
    { label: 'Catálogo interno', items: ['Inventario'] },
  ],
}

export const menu: Record<Role, string[]> = Object.fromEntries(
  Object.entries(menuGroups).map(([role, groups]) => [role, groups.flatMap((group) => group.items)]),
) as Record<Role, string[]>

export const roleLabels: Record<Role, string> = {
  admin: 'Administrador',
  recepcion: 'Recepción',
  optometrista: 'Optometrista',
}
