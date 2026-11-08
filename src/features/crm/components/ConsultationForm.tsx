import { useState } from 'react'
import type { ConsultationDraft } from '../api/crm.api'
import type { Patient } from '../shared/crm.types'

export default function ConsultationForm({
  patient,
  onSave,
  onCancel,
}: {
  patient: Patient
  onSave: (draft: ConsultationDraft) => Promise<void>
  onCancel: () => void
}) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  return (
    <form
      className="consultation-form"
      onSubmit={async (event) => {
        event.preventDefault()
        setError('')
        setSaving(true)
        const form = new FormData(event.currentTarget)
        try {
          await onSave({
            reason: String(form.get('reason')),
            visualAcuity: String(form.get('visualAcuity')),
            graduation: String(form.get('graduation')),
            observations: String(form.get('observations')),
            recommendations: String(form.get('recommendations')),
          })
        } catch (saveError) {
          setError(saveError instanceof Error ? saveError.message : 'No se pudo registrar la consulta.')
        } finally {
          setSaving(false)
        }
      }}
    >
      <header className="consultation-form-header">
        <div>
          <p className="panel-kicker">Nueva consulta</p>
          <h2>Valoración clínica</h2>
          <p>Registra la atención de esta visita.</p>
        </div>
        <button className="dialog-close" type="button" aria-label="Volver a la ficha" onClick={onCancel}>×</button>
      </header>

      <div className="consultation-patient-context">
        <div className="avatar large">{patient.firstName[0]}</div>
        <div><strong>{patient.firstName} {patient.lastName}</strong><span>{patient.email || patient.phone || 'Sin datos de contacto'}</span></div>
        <b>Paciente activo</b>
      </div>

      <div className="consultation-form-body">
        <fieldset className="consultation-section consultation-reason">
          <legend>Motivo de consulta</legend>
          <label><span className="sr-only">Motivo de consulta</span><input name="reason" defaultValue="Revisión visual" required /></label>
        </fieldset>

        <div className="consultation-measurements">
          <fieldset className="consultation-section">
            <legend>Medición visual</legend>
            <p className="consultation-hint">Registra la agudeza de ambos ojos.</p>
            <label>Agudeza visual<textarea name="visualAcuity" placeholder="OD 20/20, OI 20/25" required /></label>
          </fieldset>
          <fieldset className="consultation-section">
            <legend>Graduación</legend>
            <p className="consultation-hint">Indica la graduación o diagnóstico relevante.</p>
            <label><span className="sr-only">Graduación</span><textarea name="graduation" placeholder="Sin graduación en ojo derecho" /></label>
          </fieldset>
        </div>

        <fieldset className="consultation-section">
          <legend>Observaciones</legend>
          <p className="consultation-hint">Anota hallazgos, evolución o información clínica relevante.</p>
          <label><span className="sr-only">Observaciones</span><textarea className="consultation-large-textarea" name="observations" rows={4} /></label>
        </fieldset>

        <fieldset className="consultation-section">
          <legend>Recomendaciones</legend>
          <p className="consultation-hint">Deja claro el siguiente paso para el paciente.</p>
          <label><span className="sr-only">Recomendaciones</span><textarea name="recommendations" rows={3} /></label>
        </fieldset>
      </div>

      {error && <p className="login-error consultation-form-error" role="alert">{error}</p>}
      <footer className="consultation-form-footer">
        <button className="dialog-secondary" type="button" onClick={onCancel}>Cancelar</button>
        <button className="crm-primary-button" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar consulta →'}</button>
      </footer>
    </form>
  )
}
