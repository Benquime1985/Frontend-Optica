import { useState } from 'react'
import type { ServiceDraft } from '../api/crm.api'
import type { Service } from '../shared/crm.types'
import { useModalA11y } from './useModalA11y'

export default function ServiceForm({ service, onSave, onCancel }: { service: Service | null; onSave: (draft: ServiceDraft) => Promise<void>; onCancel: () => void }) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const dialogRef = useModalA11y(onCancel)
  return <div className="modal-backdrop" role="presentation"><section ref={dialogRef} className="patient-dialog user-dialog" role="dialog" aria-modal="true" aria-labelledby="service-form-title" tabIndex={-1}><form onSubmit={async (event) => {
    event.preventDefault(); setError(''); setSaving(true)
    const form = new FormData(event.currentTarget)
    try { await onSave({ name: String(form.get('name')).trim(), description: String(form.get('description') || '').trim() || null, category: String(form.get('category')).trim(), price: Number(form.get('price')) }) }
    catch (reason: unknown) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar el servicio.') }
    finally { setSaving(false) }
  }}><header className="patient-dialog-header"><div><p className="panel-kicker">Servicios internos</p><h2 id="service-form-title">{service ? 'Editar servicio' : 'Nuevo servicio'}</h2><p>Los servicios no afectan el inventario.</p></div><button className="dialog-close" type="button" onClick={onCancel} aria-label="Cerrar">×</button></header><div className="user-form-body"><label>Nombre<input name="name" defaultValue={service?.name} required /></label><label>Categoría<input name="category" defaultValue={service?.category} required /></label><label>Precio<input name="price" type="number" min="0" step="0.01" defaultValue={service?.price ?? 0} required /></label><label className="product-description-field">Descripción<textarea name="description" rows={3} defaultValue={service?.description ?? ''} /></label></div>{error && <p className="login-error patient-dialog-error" role="alert">{error}</p>}<footer className="patient-dialog-footer"><button className="dialog-secondary" type="button" onClick={onCancel}>Cancelar</button><button className="crm-primary-button" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar servicio →'}</button></footer></form></section></div>
}

