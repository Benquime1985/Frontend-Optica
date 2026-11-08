import { useState } from 'react'
import type { Patient } from '../shared/crm.types'

export default function PatientList({
  patients,
  loading,
  error,
  onSearch,
  onNew,
  onSelect,
  page,
  totalPages,
  onPageChange,
}: {
  patients: Patient[]
  loading: boolean
  error: string
  onSearch: (query: string) => void
  onNew: () => void
  onSelect: (patient: Patient) => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const [query, setQuery] = useState('')
  return (
    <>
      <form className="module-toolbar" onSubmit={(event) => { event.preventDefault(); onSearch(query) }}>
        <input
          placeholder="Buscar por nombre o apellido"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="crm-primary-button" type="submit" disabled={loading}>Buscar</button>
        <button className="crm-primary-button" type="button" onClick={onNew}>+ Nuevo paciente</button>
      </form>
      {error && <p className="login-error" role="alert">{error}</p>}
      {loading ? <p>Cargando pacientes…</p> : <div className="record-list">
        {patients.map((patient) => (
          <button className="record-row" key={patient.id} onClick={() => onSelect(patient)}>
            <span className="avatar">{patient.firstName[0]}</span>
            <span>
              <b>{patient.firstName} {patient.lastName}</b>
              <small>{patient.email || patient.phone}</small>
            </span>
            →
          </button>
        ))}
        {!patients.length && <p>{query ? 'No encontramos pacientes con esa búsqueda.' : 'Aún no hay pacientes activos.'}</p>}
      </div>}
      {totalPages > 1 && <nav className="user-pagination" aria-label="Paginación de pacientes"><button type="button" disabled={page === 0} onClick={() => onPageChange(page - 1)}>← Anterior</button><span>Página {page + 1} de {totalPages}</span><button type="button" disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>Siguiente →</button></nav>}
    </>
  )
}
