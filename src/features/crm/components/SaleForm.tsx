import { useEffect, useMemo, useState } from 'react'
import { createPatient, createSale, invoiceSale, listPatients, listProducts, listServices, type PatientDraft, type SaleDraft } from '../api/crm.api'
import type { InventoryProduct, Patient, PaymentMethod, Sale, Service } from '../shared/crm.types'
import PatientForm from './PatientForm'
import '../Sales.css'
import '../Payments.css'

function money(value: number) { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value) }
type CartItem = { product?: InventoryProduct; service?: Service; quantity: number }

export default function SaleForm({ onSuccess, onCancel }: { onSuccess: (sale: Sale, patientName?: string, invoiceError?: string) => void; onCancel?: () => void }) {
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [productId, setProductId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [itemType, setItemType] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT')
  const [quantity, setQuantity] = useState(1)
  const [counterSale, setCounterSale] = useState(true)
  const [productQuery, setProductQuery] = useState('')
  const [serviceQuery, setServiceQuery] = useState('')
  const [patientQuery, setPatientQuery] = useState('')
  const [patientResults, setPatientResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showNewPatient, setShowNewPatient] = useState(false)
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [discountPercent, setDiscountPercent] = useState('')
  const [registerInitialPayment, setRegisterInitialPayment] = useState(false)
  const [initialPaymentAmount, setInitialPaymentAmount] = useState('')
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<PaymentMethod>('EFECTIVO')
  const [requestInvoice, setRequestInvoice] = useState(false)
  const [rfc, setRfc] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (itemType !== 'PRODUCT') return
    const controller = new AbortController()
    const timer = window.setTimeout(() => { if (!productQuery.trim()) { setProducts([]); setOptionsLoading(false); setLoading(false); return } setOptionsLoading(true); listProducts(productQuery, 0, 20, controller.signal).then((result) => setProducts(result.content)).catch((reason: unknown) => { if ((reason as { name?: string }).name !== 'AbortError') setError(reason instanceof Error ? reason.message : 'No se pudieron buscar productos.') }).finally(() => { if (!controller.signal.aborted) { setOptionsLoading(false); setLoading(false) } }) }, 250)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [itemType, productQuery])
  useEffect(() => {
    if (itemType !== 'SERVICE') return
    const controller = new AbortController()
    const timer = window.setTimeout(() => { if (!serviceQuery.trim()) { setServices([]); setOptionsLoading(false); setLoading(false); return } setOptionsLoading(true); listServices(serviceQuery, 0, 20, controller.signal).then((result) => setServices(result.content)).catch((reason: unknown) => { if ((reason as { name?: string }).name !== 'AbortError') setError(reason instanceof Error ? reason.message : 'No se pudieron buscar servicios.') }).finally(() => { if (!controller.signal.aborted) { setOptionsLoading(false); setLoading(false) } }) }, 250)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [itemType, serviceQuery])
  useEffect(() => {
    if (counterSale || !patientQuery.trim()) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => { setPatientsLoading(true); listPatients(patientQuery, 0, controller.signal).then((result) => setPatientResults(result.content)).catch((reason: unknown) => { if ((reason as { name?: string }).name !== 'AbortError') setPatientResults([]) }).finally(() => { if (!controller.signal.aborted) setPatientsLoading(false) }) }, 300)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [counterSale, patientQuery])

  const subtotal = useMemo(() => cart.reduce((total, item) => total + (item.product?.price ?? item.service!.price) * item.quantity, 0), [cart])
  const safeDiscountPercent = Math.min(Math.max(Number(discountPercent) || 0, 0), 100)
  const discountAmount = Number((subtotal * safeDiscountPercent / 100).toFixed(2))
  const total = subtotal - discountAmount
  const availableProducts = products.filter((product) => product.stock > 0 && !cart.some((item) => item.product?.id === product.id))
  const availableServices = services.filter((service) => !cart.some((item) => item.service?.id === service.id))

  const addItem = () => { if (quantity < 1) return; if (itemType === 'PRODUCT') { const product = products.find((item) => item.id === productId); if (!product) return; setCart((current) => [...current, { product, quantity: Math.min(quantity, product.stock) }]); setProductId('') } else { const service = services.find((item) => item.id === serviceId); if (!service) return; setCart((current) => [...current, { service, quantity }]); setServiceId('') } setQuantity(1) }
  const updateQuantity = (id: string, next: number) => setCart((current) => current.map((item) => { const itemId = item.product?.id || item.service?.id; const max = item.product?.stock ?? Number.MAX_SAFE_INTEGER; return itemId === id ? { ...item, quantity: Math.min(Math.max(next, 1), max) } : item }))
  const toggleCounterSale = (checked: boolean) => { setCounterSale(checked); if (checked) { setSelectedPatient(null); setPatientQuery(''); setPatientResults([]) } }
  const saveNewPatient = async (draft: PatientDraft) => { const patient = await createPatient(draft); setSelectedPatient(patient); setPatientQuery(`${patient.firstName} ${patient.lastName}`); setPatientResults([]); setCounterSale(false); setShowNewPatient(false) }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!cart.length) { setError('Agrega al menos un producto o servicio.'); return }
    if (!counterSale && !selectedPatient) { setError('Selecciona un paciente o marca venta de mostrador.'); return }
    if (requestInvoice && (!rfc.trim() || !invoiceNumber.trim())) { setError('Completa el RFC y el número de factura para guardar los datos fiscales.'); return }
    const initialAmount = Number(initialPaymentAmount) || 0
    if (registerInitialPayment && initialAmount <= 0) { setError('El monto del anticipo debe ser mayor que cero.'); return }
    setSaving(true); setError('')
    const draft: SaleDraft = { patientId: counterSale ? null : selectedPatient?.id ?? null, discount: discountAmount, items: cart.map((item) => item.product ? { productId: item.product.id, quantity: item.quantity } : { serviceId: item.service!.id, quantity: item.quantity }), ...(registerInitialPayment ? { pago: { monto: initialAmount, metodo: initialPaymentMethod } } : {}) }
    try {
      let sale = await createSale(draft)
      let invoiceError = ''
      if (requestInvoice) {
        try { sale = await invoiceSale(sale.id, { rfc: rfc.trim(), numeroFactura: invoiceNumber.trim() }) }
        catch (reason: unknown) { invoiceError = reason instanceof Error ? `La venta ${sale.folio} fue creada, pero la factura no se pudo guardar: ${reason.message}` : `La venta ${sale.folio} fue creada, pero la factura no se pudo guardar.` }
      }
      onSuccess(sale, selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : undefined, invoiceError || undefined)
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : 'No se pudo crear la venta.') }
    finally { setSaving(false) }
  }

  if (loading) return <p aria-live="polite">Cargando productos y servicios…</p>
  return <>
  <form className="sale-form" onSubmit={submit}>
    <header className="sale-form-header"><div><p className="panel-kicker">Punto de venta</p><h2>Nueva venta</h2><p>Agrega productos, confirma el descuento y registra la operación.</p></div>{onCancel && <button className="dialog-secondary" type="button" onClick={onCancel}>Cancelar</button>}</header>
    {error && <p className="login-error" role="alert">{error}</p>}
    <div className="sale-form-grid"><label className="counter-sale-toggle"><span><strong>Venta de mostrador</strong><small>La venta no se vinculará a un paciente.</small></span><input type="checkbox" checked={counterSale} onChange={(event) => toggleCounterSale(event.target.checked)} /></label>
      {!counterSale && <div className="patient-search-field"><label>Buscar paciente<input type="search" value={patientQuery} onChange={(event) => { setPatientQuery(event.target.value); setSelectedPatient(null) }} placeholder="Nombre o apellido" /></label><button className="dialog-secondary" type="button" onClick={() => setShowNewPatient(true)}>+ Nuevo paciente</button>{patientsLoading && <small>Buscando pacientes…</small>}{patientResults.length > 0 && <div className="patient-search-results">{patientResults.map((patient) => <button type="button" key={patient.id} onClick={() => { setSelectedPatient(patient); setPatientQuery(`${patient.firstName} ${patient.lastName}`); setPatientResults([]) }}><strong>{patient.firstName} {patient.lastName}</strong><small>{patient.email || patient.phone || 'Sin contacto registrado'}</small></button>)}</div>}{selectedPatient && <p className="selected-patient">Paciente seleccionado: <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong></p>}</div>}
      <div className="sale-product-picker"><label>Tipo<select value={itemType} onChange={(event) => { setItemType(event.target.value as 'PRODUCT' | 'SERVICE'); setProductId(''); setServiceId('') }}><option value="PRODUCT">Producto</option><option value="SERVICE">Servicio</option></select></label><label>{itemType === 'PRODUCT' ? 'Producto' : 'Servicio'}{itemType === 'PRODUCT' ? <select value={productId} onChange={(event) => setProductId(event.target.value)}><option value="">Selecciona un producto</option>{availableProducts.map((product) => <option value={product.id} key={product.id}>{product.name} · {money(product.price)} · stock {product.stock}</option>)}</select> : <select value={serviceId} onChange={(event) => setServiceId(event.target.value)}><option value="">Selecciona un servicio</option>{availableServices.map((service) => <option value={service.id} key={service.id}>{service.name} · {money(service.price)}</option>)}</select>}</label><label className="sale-quantity-field">Cantidad<input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></label><button className="dialog-secondary" type="button" onClick={addItem} disabled={itemType === 'PRODUCT' ? !productId : !serviceId}>Agregar</button></div>
    </div>
    <div className="sale-search-field"><label>{itemType === 'PRODUCT' ? 'Buscar producto' : 'Buscar servicio'}<input type="search" value={itemType === 'PRODUCT' ? productQuery : serviceQuery} onChange={(event) => itemType === 'PRODUCT' ? setProductQuery(event.target.value) : setServiceQuery(event.target.value)} placeholder={itemType === 'PRODUCT' ? 'Escribe el nombre del producto' : 'Escribe el nombre del servicio'} /></label>{optionsLoading && <small>Buscando...</small>}</div>
    <div className="sale-cart"><h3>Productos y servicios de la venta</h3>{cart.length ? cart.map((item) => { const id = item.product?.id || item.service!.id; const name = item.product?.name || item.service!.name; const price = item.product?.price ?? item.service!.price; return <div className="sale-cart-row" key={id}><div><strong>{name}</strong><small>{money(price)}{item.product ? ` · máximo ${item.product.stock}` : ' · servicio'}</small></div><input aria-label={`Cantidad de ${name}`} type="number" min="1" max={item.product?.stock} value={item.quantity} onChange={(event) => updateQuantity(id, Number(event.target.value))} /><b>{money(price * item.quantity)}</b><button type="button" aria-label={`Quitar ${name}`} onClick={() => setCart((current) => current.filter((cartItem) => (cartItem.product?.id || cartItem.service?.id) !== id))}>×</button></div> }) : <p className="sale-cart-empty">Aún no agregas productos.</p>}</div>
    <div className="sale-checkout"><label>Descuento (%)<input type="number" min="0" max="100" step="0.01" value={discountPercent} onChange={(event) => setDiscountPercent(event.target.value)} /><small>{money(discountAmount)} de descuento</small></label><dl className="sale-total-summary"><div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div><div><dt>Total</dt><dd>{money(total)}</dd></div></dl></div>
    <div className="initial-payment"><label className="counter-sale-toggle"><span><strong>Registrar pago inicial</strong><small>Opcional; puedes agregar abonos después.</small></span><input type="checkbox" checked={registerInitialPayment} onChange={(event) => setRegisterInitialPayment(event.target.checked)} /></label>{registerInitialPayment && <div className="initial-payment-fields"><label>Monto<input type="number" min="0.01" max={total} step="0.01" value={initialPaymentAmount} onChange={(event) => setInitialPaymentAmount(event.target.value)} /></label><label>Método<select value={initialPaymentMethod} onChange={(event) => setInitialPaymentMethod(event.target.value as PaymentMethod)}><option value="EFECTIVO">Efectivo</option><option value="TARJETA">Tarjeta</option></select></label></div>}</div>
    <div className="initial-payment"><label className="counter-sale-toggle"><span><strong>Solicitar factura</strong><small>Guarda RFC y número de factura en esta venta.</small></span><input type="checkbox" checked={requestInvoice} onChange={(event) => setRequestInvoice(event.target.checked)} /></label>{requestInvoice && <div className="initial-payment-fields"><label>RFC<input value={rfc} maxLength={13} onChange={(event) => setRfc(event.target.value.toUpperCase())} placeholder="AAA010101AAA" /></label><label>Número de factura<input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} placeholder="F-100" /></label></div>}</div>
    <footer className="sale-form-footer"><button className="crm-primary-button" type="submit" disabled={saving || !cart.length}>{saving ? 'Creando venta…' : 'Confirmar venta →'}</button></footer>
  </form>
  {showNewPatient && <PatientForm onSave={saveNewPatient} onCancel={() => setShowNewPatient(false)} submitLabel="Guardar y seleccionar" />}
  </>
}
