import type { Consultation, Patient } from '../shared/crm.types'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function ConsultationHistory({ patient, consultations, error, onBack }: {
  patient: Patient
  consultations: Consultation[]
  error: string
  onBack: () => void
}) {
  return (
    <div className="consultation-history">
      <div className="module-toolbar">
        <div><p className="panel-kicker">Historial clínico</p><h2>{patient.firstName} {patient.lastName}</h2></div>
        <button type="button" onClick={onBack}>← Volver a la ficha</button>
      </div>
      {error && <p className="login-error" role="alert">{error}</p>}
      {!error && !consultations.length && <p className="history-empty">Este paciente aún no tiene consultas registradas.</p>}
      <div className="consultation-list">
        {consultations.map((consultation) => (
          <article className="consultation-item" key={consultation.id}>
            <div className="consultation-item-head">
              <div><span className="panel-kicker">{formatDate(consultation.consultationDate)}</span><h3>{consultation.reason}</h3></div>
              <small>{consultation.professionalName || 'Profesional no registrado'}</small>
            </div>
            <dl className="consultation-details">
              {consultation.visualAcuity && <div><dt>Agudeza visual</dt><dd>{consultation.visualAcuity}</dd></div>}
              {consultation.graduation && <div><dt>Graduación</dt><dd>{consultation.graduation}</dd></div>}
              {consultation.observations && <div><dt>Observaciones</dt><dd>{consultation.observations}</dd></div>}
              {consultation.recommendations && <div><dt>Recomendaciones</dt><dd>{consultation.recommendations}</dd></div>}
              {consultation.nextReviewAt && <div><dt>Próxima revisión</dt><dd>{formatDate(consultation.nextReviewAt)}</dd></div>}
            </dl>
          </article>
        ))}
      </div>
    </div>
  )
}
