import { useState } from 'react'
import type { UserDraft } from '../api/crm.api'
import type { ManagedUser, Role } from '../shared/crm.types'
import { roleLabels } from '../shared/crm.data'
import { useModalA11y } from './useModalA11y'

const roles: Role[] = ['admin', 'recepcion', 'optometrista']

export default function UserForm({ user, onSave, onCancel }: {
  user: ManagedUser | null
  onSave: (draft: UserDraft) => Promise<void>
  onCancel: () => void
}) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const dialogRef = useModalA11y(onCancel)

  return (
    <div className="modal-backdrop" role="presentation">
      <section ref={dialogRef} className="patient-dialog user-dialog" role="dialog" aria-modal="true" aria-labelledby="user-form-title" tabIndex={-1}>
        <form onSubmit={async (event) => {
          event.preventDefault()
          setError('')
          setSaving(true)
          const form = new FormData(event.currentTarget)
          try {
            await onSave({
              name: String(form.get('name')),
              email: String(form.get('email')),
              role: String(form.get('role')) as Role,
              password: String(form.get('password') || '') || null,
              active: user?.active ?? true,
            })
          } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el usuario.')
          } finally {
            setSaving(false)
          }
        }}>
          <header className="patient-dialog-header">
            <div>
              <p className="panel-kicker">{user ? 'Editar acceso' : 'Nuevo acceso'}</p>
              <h2 id="user-form-title">{user ? 'Editar usuario' : 'Agregar usuario'}</h2>
              <p>Administra la identidad y el rol dentro del CRM.</p>
            </div>
            <button className="dialog-close" type="button" aria-label="Cerrar formulario" onClick={onCancel}>×</button>
          </header>
          <div className="user-form-body">
            <label>Nombre completo<input name="name" defaultValue={user?.name} required /></label>
            <label>Correo electrónico<input name="email" type="email" defaultValue={user?.email} required /></label>
            <label>Rol<select name="role" defaultValue={user?.role ?? 'optometrista'}>{roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>
            <label>Contraseña{user && <small>Déjala vacía para conservar la actual.</small>}<input name="password" type="password" minLength={user ? undefined : 8} required={!user} /></label>
          </div>
          {error && <p className="login-error patient-dialog-error" role="alert">{error}</p>}
          <footer className="patient-dialog-footer">
            <button className="dialog-secondary" type="button" onClick={onCancel}>Cancelar</button>
            <button className="crm-primary-button" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar usuario →'}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

