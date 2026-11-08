import { useEffect, useState } from 'react'
import { listPatientSales } from '../api/crm.api'
import type { Patient, Sale } from '../shared/crm.types'
import SaleConfirmationModal from './SaleConfirmationModal'

function money(value: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
}

function date(value: string) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function PatientPurchaseHistory({ patient }: { patient: Patient }) {
  const [sales, setSales] = useState<Sale[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    Promise.resolve().then(() => listPatientSales(patient.id, page, controller.signal))
      .then((result) => { setSales(result.content); setTotalPages(result.totalPages) })
      .catch((reason: unknown) => { if ((reason as { name?: string }).name !== 'AbortError') setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las compras.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [page, patient.id])

  return <div className="patient-purchase-history"><div className="module-toolbar"><div><p className="panel-kicker">Historial de compras</p><h2>{patient.firstName} {patient.lastName}</h2></div></div>{error && <p className="login-error" role="alert">{error}</p>}{loading ? <p>Cargando compras...</p> : !sales.length ? <p className="history-empty">Este paciente aun no tiene compras registradas.</p> : <div className="purchase-history-list">{sales.map((sale) => <button className="purchase-history-row" type="button" key={sale.id} onClick={() => setSelectedSale(sale)}><span><strong>{sale.folio}</strong><small>{date(sale.createdAt)} · {sale.items.length} {sale.items.length === 1 ? 'producto' : 'productos'}</small></span><span className="user-status is-active">{sale.status === 'COMPLETED' ? 'Completada' : sale.status}</span><b>{money(sale.total)}</b></button>)}</div>}{totalPages > 1 && <nav className="user-pagination" aria-label="Paginacion de compras"><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Anterior</button><span>Pagina {page + 1} de {totalPages}</span><button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>Siguiente</button></nav>}{selectedSale && <SaleConfirmationModal sale={selectedSale} patientName={`${patient.firstName} ${patient.lastName}`} onClose={() => setSelectedSale(null)} onNewSale={() => setSelectedSale(null)} />}</div>
}
