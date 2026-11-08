import { useCallback, useEffect, useState } from 'react'
import { listSales } from '../api/crm.api'
import type { Sale } from '../shared/crm.types'
import SaleConfirmationModal from './SaleConfirmationModal'
import SaleForm from './SaleForm'

function money(value: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
}

function date(value: string) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function statusLabel(status: string) {
  if (status === 'PENDIENTE') return 'Pendiente de pago'
  if (status === 'PAGADA_POR_ENTREGAR') return 'Pagada por entregar'
  if (status === 'COMPLETADA' || status === 'COMPLETED') return 'Entregada'
  if (status === 'CANCELADA') return 'Cancelada'
  return status
}

function statusClass(status: string) {
  if (status === 'PENDIENTE') return 'is-low'
  if (status === 'CANCELADA') return 'is-out'
  return 'is-active'
}

export default function SalesManagement({ showSeller = false }: { showSeller?: boolean }) {
  const [sales, setSales] = useState<Sale[]>([])
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNewSale, setShowNewSale] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [invoiceError, setInvoiceError] = useState('')

  const loadSales = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError('')
    try {
      const result = await listSales(query, page, status, 7, signal)
      setSales(result.content)
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)
    } catch (reason: unknown) {
      if ((reason as { name?: string }).name !== 'AbortError') setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las ventas.')
    } finally { if (!signal?.aborted) setLoading(false) }
  }, [page, query, status])

  useEffect(() => {
    const controller = new AbortController()
    void Promise.resolve().then(() => loadSales(controller.signal))
    return () => controller.abort()
  }, [loadSales])

  if (showNewSale) return <section className="sales-management"><button className="dialog-secondary sales-back-button" type="button" onClick={() => setShowNewSale(false)}>← Volver a ventas</button><SaleForm onCancel={() => setShowNewSale(false)} onSuccess={(sale, _patientName, saleInvoiceError) => { setShowNewSale(false); setInvoiceError(saleInvoiceError || ''); setSelectedSale(sale); void loadSales() }} /></section>

  return <section className="sales-management">
    <header className="user-management-header"><div><p className="panel-kicker">Operación</p><h2>Ventas</h2><p>Busca ventas por folio o por nombre del paciente.</p></div><button className="crm-primary-button" type="button" onClick={() => setShowNewSale(true)}>+ Nueva venta</button></header>
    <form className="user-toolbar" onSubmit={(event) => { event.preventDefault(); setPage(0); setQuery(queryInput) }}><input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Buscar por folio, paciente, RFC o factura" /><select aria-label="Filtrar ventas por estado" value={status} onChange={(event) => { setPage(0); setStatus(event.target.value) }}><option value="">Todas</option><option value="PENDIENTE">Pendientes de pago</option><option value="PAGADA_POR_ENTREGAR">Pagadas por entregar</option><option value="COMPLETADA">Completadas</option></select><button className="dialog-secondary" type="submit">Buscar</button><span>{totalElements} ventas</span></form>
    {error && <p className="login-error" role="alert">{error}</p>}
    {loading ? <p aria-live="polite">Cargando ventas…</p> : <div className="user-table-wrap"><table className="user-table sales-table"><thead><tr><th>Folio</th><th>Fecha</th><th>Paciente</th>{showSeller && <th>Vendedor</th>}<th>Estado</th><th>Total</th></tr></thead><tbody>{sales.map((sale) => <tr key={sale.id} className="sales-row" tabIndex={0} role="button" aria-label={`Ver detalle de la venta ${sale.folio}`} onClick={() => setSelectedSale(sale)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedSale(sale) } }}><td><strong>{sale.folio}</strong><small>{sale.items.length} {sale.items.length === 1 ? 'producto' : 'productos'}</small></td><td>{date(sale.createdAt)}</td><td>{sale.patientId ? 'Paciente registrado' : 'Venta mostrador'}</td>{showSeller && <td>{sale.sellerName || sale.sellerId}</td>}<td><span className={`user-status ${statusClass(sale.status)}`}>{statusLabel(sale.status)}</span></td><td><strong>{money(sale.total)}</strong></td></tr>)}{!sales.length && <tr><td colSpan={showSeller ? 6 : 5}>No encontramos ventas.</td></tr>}</tbody></table></div>}
    {totalPages > 1 && <nav className="user-pagination" aria-label="Paginación de ventas"><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>← Anterior</button><span>Página {page + 1} de {totalPages}</span><button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>Siguiente →</button></nav>}
    {selectedSale && <SaleConfirmationModal sale={selectedSale} invoiceError={invoiceError} onUpdated={setSelectedSale} onDelivered={() => void loadSales()} onClose={() => setSelectedSale(null)} onNewSale={() => { setInvoiceError(''); setSelectedSale(null); setShowNewSale(true) }} />}
  </section>
}
