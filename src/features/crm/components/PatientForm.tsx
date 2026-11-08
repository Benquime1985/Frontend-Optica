import { useState } from 'react'
import type { PatientDraft } from '../api/crm.api'
import { useModalA11y } from './useModalA11y'

export type { PatientDraft } from '../api/crm.api'

export default function PatientForm({
  onSave,
  onCancel,
  submitLabel = 'Guardar y comenzar consulta →',
}: {
  onSave: (draft: PatientDraft) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const dialogRef = useModalA11y(onCancel)

  return (
    <div className="modal-backdrop" role="presentation">
      <section ref={dialogRef} className="patient-dialog" role="dialog" aria-modal="true" aria-labelledby="new-patient-title" tabIndex={-1}>
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            setError('')
            setSaving(true)
            const form = new FormData(event.currentTarget)
            try {
              await onSave({
                firstName: String(form.get('firstName')),
                lastName: String(form.get('lastName')),
                birthDate: String(form.get('birthDate') || '') || undefined,
                phone: String(form.get('phone') || '') || undefined,
                email: String(form.get('email') || '') || undefined,
                address: String(form.get('address') || '') || undefined,
                notes: String(form.get('notes') || '') || undefined,
              })
            } catch (saveError) {
              setError(saveError instanceof Error ? saveError.message : 'No se pudo crear el paciente.')
            } finally {
              setSaving(false)
            }
          }}
        >
          <header className="patient-dialog-header">
            <div>
              <p className="panel-kicker">Nuevo expediente</p>
              <h2 id="new-patient-title">Agregar paciente</h2>
              <p>Registra los datos básicos para abrir su expediente.</p>
            </div>
            <button className="dialog-close" type="button" aria-label="Cerrar formulario" onClick={onCancel}>×</button>
          </header>

          <div className="patient-dialog-body">
            <aside className="patient-dialog-context">
              <span className="dialog-context-mark">V</span>
              <strong>Nuevo paciente</strong>
              <p>Después de guardar podrás iniciar una consulta clínica.</p>
              <span className="dialog-required">* Campos obligatorios</span>
            </aside>

            <div className="patient-dialog-fields">
              <fieldset>
                <legend>Datos personales</legend>
                <div className="patient-field-grid">
                  <label>Nombre *<input name="firstName" autoFocus required /></label>
                  <label>Apellidos *<input name="lastName" required /></label>
                  <label>Fecha de nacimiento<input name="birthDate" type="date" max={new Date().toISOString().slice(0, 10)} /></label>
                </div>
              </fieldset>
              <fieldset>
                <legend>Contacto</legend>
                <div className="patient-field-grid">
                  <label>Teléfono<input name="phone" type="tel" /></label>
                  <label>Correo<input name="email" type="email" /></label>
                  <label className="patient-field-full">Dirección<input name="address" /></label>
                </div>
              </fieldset>
              <fieldset>
                <legend>Notas iniciales</legend>
                <label><span className="sr-only">Notas iniciales</span><textarea name="notes" rows={3} placeholder="Antecedentes o información relevante" /></label>
              </fieldset>
            </div>
          </div>

          {error && <p className="login-error patient-dialog-error" role="alert">{error}</p>}
          <footer className="patient-dialog-footer">
            <button className="dialog-secondary" type="button" onClick={onCancel}>Cancelar</button>
            <button className="crm-primary-button" type="submit" disabled={saving}>
              {saving ? 'Guardando…' : submitLabel}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
