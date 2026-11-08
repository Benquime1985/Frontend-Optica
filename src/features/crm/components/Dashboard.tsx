import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { createConsultation, createPatient, listConsultations, listPatients, type ConsultationDraft, type PatientDraft } from '../api/crm.api'
import type { AuthUser } from '../auth/auth.api'
import PatientCard from './PatientCard'
import PatientForm from './PatientForm'
import Toast from './Toast'
import { menu, menuGroups } from '../shared/crm.data'
import type { Consultation, Patient } from '../shared/crm.types'
import '../PatientHistory.css'

const ConsultationForm = lazy(() => import('./ConsultationForm'))
const ConsultationHistory = lazy(() => import('./ConsultationHistory'))
const PatientList = lazy(() => import('./PatientList'))
const PatientPurchaseHistory = lazy(() => import('./PatientPurchaseHistory'))
const ProductManagement = lazy(() => import('./ProductManagement'))
const SalesManagement = lazy(() => import('./SalesManagement'))
const ServiceManagement = lazy(() => import('./ServiceManagement'))
const UserManagement = lazy(() => import('./UserManagement'))

export default function Dashboard({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const role = user.role
  const displayName = user.name.trim() || user.email
  const avatar = displayName.charAt(0).toUpperCase()
  const [active, setActive] = useState(menu[role][0])
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientPage, setPatientPage] = useState(0)
  const [patientTotalPages, setPatientTotalPages] = useState(0)
  const [patientQuery, setPatientQuery] = useState('')
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [patientsError, setPatientsError] = useState('')
  const [selected, setSelected] = useState<Patient | null>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [consultationsLoading, setConsultationsLoading] = useState(false)
  const [consultationsError, setConsultationsError] = useState('')
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [patientHistoryTab, setPatientHistoryTab] = useState<'clinical' | 'purchases'>('clinical')
  const [notice, setNotice] = useState('')
  const consultationsAbort = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 4200)
    return () => window.clearTimeout(timer)
  }, [notice])

  const loadPatients = useCallback(async (query = '', page = 0, signal?: AbortSignal) => {
    setPatientsLoading(true); setPatientsError('')
    try { const result = await listPatients(query, page, signal); setPatients(result.content); setPatientTotalPages(result.totalPages) } catch (error) { if ((error as { name?: string }).name !== 'AbortError') setPatientsError(error instanceof Error ? error.message : 'No se pudieron cargar los pacientes.') }
    finally { if (!signal?.aborted) setPatientsLoading(false) }
  }, [])

  useEffect(() => {
    if (active !== 'Pacientes') return
    const controller = new AbortController()
    void Promise.resolve().then(() => loadPatients(patientQuery, patientPage, controller.signal))
    return () => controller.abort()
  }, [active, loadPatients, patientPage, patientQuery])

  const selectPatient = async (patient: Patient) => {
    consultationsAbort.current?.abort()
    const controller = new AbortController()
    setSelected(patient); setPatientHistoryTab('clinical'); setActive('Ficha del paciente'); setConsultationsLoading(true); setConsultationsError('')
    try { setConsultations(await listConsultations(patient.id, controller.signal)) } catch (error) { if (!controller.signal.aborted) { setConsultations([]); setConsultationsError(error instanceof Error ? error.message : 'No se pudo cargar el historial.') } }
    finally { if (!controller.signal.aborted) setConsultationsLoading(false) }
  }

  const addPatient = async (draft: PatientDraft) => {
    const patient = await createPatient(draft)
    setPatients((current) => [patient, ...current]); setSelected(patient); setConsultations([]); setShowPatientForm(false); setPatientHistoryTab('clinical'); setActive('Nueva consulta'); setNotice('Paciente creado. Ya puedes iniciar su consulta.')
  }

  const saveConsultation = async (draft: ConsultationDraft) => {
    if (!selected) return
    const consultation = await createConsultation(selected.id, draft)
    setConsultations((current) => [...current, consultation]); setActive('Recetas'); setNotice('Consulta guardada correctamente.')
  }

  let body: React.ReactNode
  if (active === 'Usuarios y roles') body = <UserManagement currentUserId={user.id} />
  else if (active === 'Inventario') body = <ProductManagement canManage={role === 'admin'} />
  else if (active === 'Servicios' && role === 'admin') body = <ServiceManagement />
  else if ((active === 'Nueva venta' || active === 'Ventas y pagos') && (role === 'admin' || role === 'recepcion')) body = <SalesManagement showSeller={role === 'admin'} />
  else if (active === 'Pacientes' && role !== 'recepcion') body = <PatientList patients={patients} loading={patientsLoading} error={patientsError} totalPages={patientTotalPages} page={patientPage} onSearch={(query) => { setPatientQuery(query); setPatientPage(0) }} onPageChange={setPatientPage} onNew={() => setShowPatientForm(true)} onSelect={selectPatient} />
  else if (active === 'Ficha del paciente' && selected && role !== 'recepcion') body = <>
    {consultationsError && <p className="login-error" role="alert">{consultationsError}</p>}
    {consultationsLoading ? <p>Cargando historial…</p> : <PatientCard patient={selected} count={consultations.length} onAction={setActive} />}
    <div className="patient-history-tabs" role="tablist" aria-label="Historial del paciente"><button type="button" className={patientHistoryTab === 'clinical' ? 'active' : ''} onClick={() => setPatientHistoryTab('clinical')}>Historial clínico</button>{role === 'admin' && <button type="button" className={patientHistoryTab === 'purchases' ? 'active' : ''} onClick={() => setPatientHistoryTab('purchases')}>Historial de compras</button>}</div>
    {patientHistoryTab === 'clinical' ? <ConsultationHistory patient={selected} consultations={consultations} error={consultationsError} onBack={() => setActive('Pacientes')} /> : <PatientPurchaseHistory key={selected.id} patient={selected} />}
  </>
  else if (active === 'Historial clínico' && selected && role !== 'recepcion') body = <ConsultationHistory patient={selected} consultations={consultations} error={consultationsError} onBack={() => setActive('Pacientes')} />
  else if (active === 'Nueva consulta' && selected && role !== 'recepcion') body = <ConsultationForm patient={selected} onSave={saveConsultation} onCancel={() => setActive('Ficha del paciente')} />
  else body = <div className="panel-placeholder"><div className="placeholder-icon">◷</div><div><b>{active}</b><p>Abre un paciente para consultar o registrar información.</p></div></div>

  body = <Suspense fallback={<p aria-live="polite">Cargando módulo...</p>}>{body}</Suspense>
  return <main className="crm-shell">
    <Toast message={notice} />
    <aside className="crm-sidebar"><Link className="crm-sidebar-brand" to="/"><span className="crm-brand-mark">V</span><span><strong>Óptica Vision</strong><small>GUINTO · CRM</small></span></Link><div className="sidebar-role"><span>Sesión activa</span><b>{role}</b></div><nav className="crm-nav" aria-label="Módulos del CRM">{menuGroups[role].map((group) => <div className="crm-nav-group" key={group.label}><p className="crm-nav-label">{group.label}</p>{group.items.map((item) => <button className={active === item ? 'active' : ''} key={item} onClick={() => setActive(item)} aria-label={item} aria-current={active === item ? 'page' : undefined} title={item}><span aria-hidden="true">◈</span>{item}</button>)}</div>)}</nav><div className="sidebar-bottom"><button onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión">↪ Cerrar sesión</button></div></aside>
    <section className="crm-main"><header className="crm-topbar"><div className="topbar-actions"><div className="avatar">{avatar}</div><div><b>{displayName}</b><small>{user.email}</small></div></div></header><div className="crm-content"><div className="crm-heading"><div><p className="crm-eyebrow">Panel principal / {active}</p><h1>Hola, {displayName} ✦</h1><p>Consulta pacientes y registra la atención optométrica.</p></div></div><div className="crm-lower-grid"><article className="crm-panel main-panel">{body}</article></div></div></section>
    {showPatientForm && <PatientForm onSave={addPatient} onCancel={() => setShowPatientForm(false)} />}
  </main>
}
