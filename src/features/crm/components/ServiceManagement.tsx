import { useCallback, useEffect, useState } from 'react'
import { createService, deleteService, listServices, updateService, type ServiceDraft } from '../api/crm.api'
import type { Service } from '../shared/crm.types'
import ServiceForm from './ServiceForm'

function money(value: number) { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value) }

export default function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Service | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError('')
    try {
      const result = await listServices(query, page, 7, signal)
      setServices(result.content)
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)
    } catch (reason: unknown) {
      if ((reason as { name?: string }).name !== 'AbortError') setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los servicios.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [page, query])

  useEffect(() => {
    const controller = new AbortController()
    void Promise.resolve().then(() => load(controller.signal))
    return () => controller.abort()
  }, [load])

  const save = async (draft: ServiceDraft) => {
    if (editing) await updateService(editing.id, draft)
    else await createService(draft)
    setShowForm(false)
    setEditing(null)
    await load()
  }

  const archive = async (service: Service) => {
    if (!window.confirm(`¿Dar de baja ${service.name}?`)) return
    try { await deleteService(service.id); await load() }
    catch (reason: unknown) { setError(reason instanceof Error ? reason.message : 'No se pudo dar de baja el servicio.') }
  }

  return <section className="product-management"><header className="user-management-header"><div><p className="panel-kicker">Operación</p><h2>Servicios</h2><p>Administra los servicios disponibles para ventas internas.</p></div><button className="crm-primary-button" type="button" onClick={() => { setEditing(null); setShowForm(true) }}>+ Nuevo servicio</button></header><form className="user-toolbar" onSubmit={(event) => { event.preventDefault(); setPage(0) }}><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} placeholder="Buscar servicio por nombre" /><button className="dialog-secondary" type="submit">Buscar</button><span>{totalElements} servicios</span></form>{error && <p className="login-error" role="alert">{error}</p>}{loading ? <p>Cargando servicios...</p> : <div className="user-table-wrap"><table className="user-table"><thead><tr><th>Servicio</th><th>Categoría</th><th>Precio</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{services.map((service) => <tr key={service.id}><td><strong>{service.name}</strong><small>{service.description}</small></td><td>{service.category}</td><td>{money(service.price)}</td><td className="user-actions"><button type="button" onClick={() => { setEditing(service); setShowForm(true) }}>Editar</button><button type="button" onClick={() => void archive(service)}>Dar de baja</button></td></tr>)}{!services.length && <tr><td colSpan={4}>{query ? 'No encontramos servicios con esa búsqueda.' : 'Aún no hay servicios activos.'}</td></tr>}</tbody></table></div>}{totalPages > 1 && <nav className="user-pagination" aria-label="Paginación de servicios"><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>← Anterior</button><span>Página {page + 1} de {totalPages}</span><button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>Siguiente →</button></nav>}{showForm && <ServiceForm service={editing} onSave={save} onCancel={() => { setShowForm(false); setEditing(null) }} />}</section>
}
