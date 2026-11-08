import { useCallback, useEffect, useState } from 'react'
import { createUser, deleteUser, listUsers, updateUser, type UserDraft } from '../api/crm.api'
import type { ManagedUser } from '../shared/crm.types'
import { roleLabels } from '../shared/crm.data'
import UserForm from './UserForm'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(value))
}

export default function UserManagement({ currentUserId }: { currentUserId?: string }) {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [actionId, setActionId] = useState('')

  const loadUsers = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError('')
    try {
      const result = await listUsers(query, page, signal)
      setUsers(result.content)
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)
    } catch (loadError) {
      if ((loadError as { name?: string }).name !== 'AbortError') setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los usuarios.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [page, query])

  useEffect(() => {
    const controller = new AbortController()
    void Promise.resolve().then(() => loadUsers(controller.signal))
    return () => controller.abort()
  }, [loadUsers])

  const saveUser = async (draft: UserDraft) => {
    if (editingUser) await updateUser(editingUser.id, draft)
    else await createUser(draft)
    setShowForm(false)
    setEditingUser(null)
    await loadUsers()
  }

  const toggleUser = async (user: ManagedUser) => {
    if (user.id === currentUserId && user.active) return
    if (user.active && !window.confirm(`¿Desactivar a ${user.name}?`)) return
    setActionId(user.id)
    setError('')
    try {
      if (user.active) await deleteUser(user.id)
      else await updateUser(user.id, { name: user.name, email: user.email, role: user.role, password: null, active: true })
      await loadUsers()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se pudo actualizar el estado del usuario.')
    } finally {
      setActionId('')
    }
  }

  return (
    <section className="user-management">
      <header className="user-management-header">
        <div><p className="panel-kicker">Administración</p><h2>Usuarios y roles</h2><p>Gestiona los accesos del equipo de la óptica.</p></div>
        <button className="crm-primary-button" type="button" onClick={() => { setEditingUser(null); setShowForm(true) }}>+ Nuevo usuario</button>
      </header>
      <form className="user-toolbar" onSubmit={(event) => { event.preventDefault(); setPage(0); setQuery(queryInput) }}>
        <input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Buscar por nombre o correo" />
        <button className="dialog-secondary" type="submit">Buscar</button>
        <span>{totalElements} usuarios</span>
      </form>
      {error && <p className="login-error" role="alert">{error}</p>}
      {loading ? <p>Cargando usuarios…</p> : <div className="user-table-wrap">
        <table className="user-table">
          <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Alta</th><th><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong><small>{user.email}</small></td>
                <td>{roleLabels[user.role]}</td>
                <td><span className={`user-status ${user.active ? 'is-active' : 'is-inactive'}`}>{user.active ? 'Activo' : 'Inactivo'}</span></td>
                <td>{formatDate(user.createdAt)}</td>
                <td className="user-actions">
                  <button type="button" onClick={() => { setEditingUser(user); setShowForm(true) }}>Editar</button>
                  <button type="button" disabled={actionId === user.id || (user.id === currentUserId && user.active)} onClick={() => void toggleUser(user)}>{user.active ? 'Desactivar' : 'Reactivar'}</button>
                </td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan={5}>No encontramos usuarios.</td></tr>}
          </tbody>
        </table>
      </div>}
      {totalPages > 1 && <nav className="user-pagination" aria-label="Paginación de usuarios"><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>← Anterior</button><span>Página {page + 1} de {totalPages}</span><button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>Siguiente →</button></nav>}
      {showForm && <UserForm user={editingUser} onSave={saveUser} onCancel={() => { setShowForm(false); setEditingUser(null) }} />}
    </section>
  )
}
