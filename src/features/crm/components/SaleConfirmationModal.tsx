import { useEffect, useState } from 'react'
import { addSaleItems, addSalePayment, deliverSale, listProducts, listServices } from '../api/crm.api'
import type { InventoryProduct, PaymentMethod, Sale, Service } from '../shared/crm.types'
import '../Payments.css'
import './SaleConfirmationModal.css'
import { useModalA11y } from './useModalA11y'

function money(value: number) { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value) }
function date(value: string) { return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
function statusLabel(status: string) { if (status === 'PENDIENTE') return 'Pendiente de pago'; if (status === 'PAGADA_POR_ENTREGAR') return 'Pagada por entregar'; if (status === 'COMPLETADA' || status === 'COMPLETED') return 'Completada'; return status }

export default function SaleConfirmationModal({ sale, patientName, invoiceError, onNewSale, onClose, onDelivered, onUpdated }: { sale: Sale; patientName?: string; invoiceError?: string; onNewSale: () => void; onClose: () => void; onDelivered?: (sale: Sale) => void; onUpdated?: (sale: Sale) => void }) {
  const [currentSale, setCurrentSale] = useState(sale)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO')
  const [savingPayment, setSavingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [deliveryError, setDeliveryError] = useState('')
  const [savingDelivery, setSavingDelivery] = useState(false)
  const [itemType, setItemType] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT')
  const [itemQuery, setItemQuery] = useState('')
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedItemId, setSelectedItemId] = useState('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemError, setItemError] = useState('')
  const [searchingItems, setSearchingItems] = useState(false)
  const [savingItem, setSavingItem] = useState(false)
  const dialogRef = useModalA11y(onClose)
  const customer = patientName || (currentSale.patientId ? 'Paciente registrado' : 'Venta mostrador')
  const payments = currentSale.payments || []
  const canEditItems = !['COMPLETADA', 'COMPLETED', 'CANCELADA'].includes(currentSale.status)
  const canDeliver = currentSale.saldoPendiente <= 0 && canEditItems

  useEffect(() => {
    if (!canEditItems || !itemQuery.trim()) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setSearchingItems(true)
      const request = itemType === 'PRODUCT'
        ? listProducts(itemQuery, 0, 20, controller.signal).then((result) => setProducts(result.content))
        : listServices(itemQuery, 0, 20, controller.signal).then((result) => setServices(result.content))
      request.catch((reason: unknown) => { if ((reason as { name?: string }).name !== 'AbortError') setItemError(reason instanceof Error ? reason.message : 'No se pudieron buscar opciones.') }).finally(() => { if (!controller.signal.aborted) setSearchingItems(false) })
    }, 250)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [canEditItems, itemQuery, itemType])

  const updateSale = (updatedSale: Sale) => { setCurrentSale(updatedSale); onUpdated?.(updatedSale) }

  const registerPayment = async (event: React.FormEvent) => {
    event.preventDefault()
    const amount = Number(paymentAmount) || 0
    if (amount <= 0 || amount > currentSale.saldoPendiente) { setPaymentError('El abono debe ser mayor que cero y no superar el saldo pendiente.'); return }
    setSavingPayment(true); setPaymentError('')
    try { updateSale(await addSalePayment(currentSale.id, { monto: amount, metodo: paymentMethod })); setPaymentAmount('') } catch (reason: unknown) { setPaymentError(reason instanceof Error ? reason.message : 'No se pudo registrar el abono.') } finally { setSavingPayment(false) }
  }

  const registerItem = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedItemId || itemQuantity < 1) { setItemError('Selecciona un producto o servicio y una cantidad válida.'); return }
    setSavingItem(true); setItemError('')
    try {
      updateSale(await addSaleItems(currentSale.id, [itemType === 'PRODUCT' ? { productId: selectedItemId, quantity: itemQuantity } : { serviceId: selectedItemId, quantity: itemQuantity }]))
      setSelectedItemId(''); setItemQuery(''); setItemQuantity(1)
    } catch (reason: unknown) { setItemError(reason instanceof Error ? reason.message : 'No se pudo añadir el ítem.') } finally { setSavingItem(false) }
  }

  const markDelivered = async () => {
    if (!window.confirm('¿Confirmas que esta venta ya fue entregada al cliente?')) return
    setSavingDelivery(true); setDeliveryError('')
    try { const deliveredSale = await deliverSale(currentSale.id); updateSale(deliveredSale); onDelivered?.(deliveredSale) } catch (reason: unknown) { setDeliveryError(reason instanceof Error ? reason.message : 'No se pudo marcar la venta como entregada.') } finally { setSavingDelivery(false) }
  }

  return <div className="modal-backdrop" role="presentation"><section ref={dialogRef} className="patient-dialog sale-confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="sale-confirmation-title" tabIndex={-1}>
    <header className="patient-dialog-header sale-confirmation-header"><div><p className="panel-kicker">Detalle de venta</p><h2 id="sale-confirmation-title">{currentSale.folio}</h2><p>{date(currentSale.createdAt)} · {customer}</p></div><button className="dialog-close" type="button" aria-label="Cerrar detalle" onClick={onClose}>×</button></header>
    <div className="sale-confirmation-body">{invoiceError && <p className="login-error" role="alert">{invoiceError}</p>}<div className="sale-status">{statusLabel(currentSale.status)}</div><div className="sale-meta">{currentSale.rfc && <span>RFC<strong>{currentSale.rfc}</strong></span>}{currentSale.numeroFactura && <span>Factura<strong>{currentSale.numeroFactura}</strong></span>}</div><div className="sale-items-list">{currentSale.items.map((item) => <div className="sale-item-row" key={item.productId || item.serviceId}><div><strong>{item.productName || item.serviceName}</strong><small>{item.itemType === 'SERVICE' ? 'Servicio' : 'Producto'} · {item.quantity} × {money(item.unitPrice)}</small></div><b>{money(item.lineTotal)}</b></div>)}</div>
      {canEditItems && <form className="payment-form sale-add-items" onSubmit={registerItem}><h3>Añadir productos o servicios</h3>{itemError && <p className="login-error" role="alert">{itemError}</p>}<div className="payment-form-fields"><label>Tipo<select value={itemType} onChange={(event) => { setItemType(event.target.value as 'PRODUCT' | 'SERVICE'); setSelectedItemId(''); setItemQuery(''); setProducts([]); setServices([]); setSearchingItems(false); setItemError('') }}><option value="PRODUCT">Producto</option><option value="SERVICE">Servicio</option></select></label><label>Buscar<input type="search" value={itemQuery} onChange={(event) => { setItemQuery(event.target.value); setSelectedItemId(''); setSearchingItems(Boolean(event.target.value.trim())) }} placeholder={itemType === 'PRODUCT' ? 'Nombre del producto' : 'Nombre del servicio'} /></label><label>Cantidad<input type="number" min="1" step="1" value={itemQuantity} onChange={(event) => setItemQuantity(Number(event.target.value))} /></label></div>{searchingItems && <small>Buscando...</small>}{itemQuery && (itemType === 'PRODUCT' ? products : services).length > 0 && <div className="sale-item-options">{itemType === 'PRODUCT' ? products.filter((product) => product.stock > 0).map((product) => <button type="button" className={selectedItemId === product.id ? 'selected' : ''} key={product.id} onClick={() => setSelectedItemId(product.id)}>{product.name} · stock {product.stock}</button>) : services.map((service) => <button type="button" className={selectedItemId === service.id ? 'selected' : ''} key={service.id} onClick={() => setSelectedItemId(service.id)}>{service.name}</button>)}</div>}<button className="crm-primary-button" type="submit" disabled={savingItem || !selectedItemId}>{savingItem ? 'Añadiendo...' : 'Añadir ítem'}</button></form>}
      <div className="payment-breakdown"><div><dt>Efectivo</dt><dd>{money(currentSale.totalEfectivo || 0)}</dd></div><div><dt>Tarjeta</dt><dd>{money(currentSale.totalTarjeta || 0)}</dd></div></div><dl className="sale-total-summary"><div><dt>Subtotal</dt><dd>{money(currentSale.subtotal)}</dd></div><div><dt>Descuento</dt><dd>- {money(currentSale.discount)}</dd></div><div><dt>Total pagado</dt><dd>{money(currentSale.totalPagado || 0)}</dd></div><div><dt>Saldo pendiente</dt><dd>{money(currentSale.saldoPendiente || 0)}</dd></div><div className="sale-total"><dt>Total</dt><dd>{money(currentSale.total)}</dd></div></dl><div><h3>Pagos registrados</h3>{payments.length ? <div className="payments-list">{payments.map((payment) => <div className="payment-row" key={payment.id}><span>{payment.metodo}<small>{date(payment.createdAt)}</small></span><b>{money(payment.monto)}</b></div>)}</div> : <p className="history-empty">Sin pagos registrados.</p>}</div>{currentSale.saldoPendiente > 0 && <form className="payment-form" onSubmit={registerPayment}><h3>Registrar abono</h3>{paymentError && <p className="login-error" role="alert">{paymentError}</p>}<div className="payment-form-fields"><label>Monto<input type="number" min="0.01" max={currentSale.saldoPendiente} step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} /></label><label>Método<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}><option value="EFECTIVO">Efectivo</option><option value="TARJETA">Tarjeta</option></select></label><button className="crm-primary-button" type="submit" disabled={savingPayment}>{savingPayment ? 'Guardando...' : 'Registrar abono'}</button></div></form>}</div>
    <footer className="patient-dialog-footer">{deliveryError && <p className="login-error" role="alert">{deliveryError}</p>}<button className="dialog-secondary" type="button" onClick={onClose}>Cerrar</button>{canDeliver && <button className="crm-primary-button" type="button" onClick={() => void markDelivered()} disabled={savingDelivery}>{savingDelivery ? 'Guardando...' : 'Marcar como entregada'}</button>}<button className="crm-primary-button" type="button" onClick={onNewSale}>Nueva venta →</button></footer>
  </section></div>
}
