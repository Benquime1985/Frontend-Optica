import type { Patient } from '../shared/crm.types'

export default function PatientCard({
  patient,
  count,
  onAction,
}: {
  patient: Patient
  count: number
  onAction: (action: string) => void
}) {
  return (
    <div className="patient-card">
      <div className="patient-card-head">
        <div className="avatar large">{patient.firstName[0]}</div>
        <div>
          <p className="panel-kicker">Ficha del paciente</p>
          <h2>{patient.firstName} {patient.lastName}</h2>
          <small>{patient.email || 'Sin correo'} · {patient.phone || 'Sin teléfono'}</small>
        </div>
      </div>
      <div className="patient-details">
        <span><b>Nacimiento</b>{patient.birthDate || 'No registrada'}</span>
        <span><b>Consultas</b>{count}</span>
        <span><b>Desde</b>{patient.createdAt}</span>
      </div>
      <div className="patient-actions">
        <button onClick={() => onAction('Nueva consulta')}>+ Nueva consulta</button>
        <button onClick={() => onAction('Historial clínico')}>Ver historial</button>
        <button onClick={() => onAction('Recetas')}>Ver recetas</button>
      </div>
    </div>
  )
}
