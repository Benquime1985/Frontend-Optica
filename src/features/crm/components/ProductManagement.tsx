import { useCallback, useEffect, useState } from 'react'
import { createProduct, deleteProduct, listProducts, updateProduct, type ProductDraft } from '../api/crm.api'
import type { InventoryProduct } from '../shared/crm.types'
import ProductForm from './ProductForm'

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
}

function stockState(stock: number) {
  if (stock === 0) return { label: 'Agotado', className: 'is-out' }
  if (stock <= 3) return { label: 'Stock bajo', className: 'is-low' }
  return { label: 'Disponible', className: 'is-active' }
}

export default function ProductManagement({ canManage }: { canManage: boolean }) {
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null)
  const [actionId, setActionId] = useState('')

  const loadProducts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError('')
    try {
      const result = await listProducts(query, page, 7, signal)
      setProducts(result.content)
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)
    } catch (loadError) {
      if ((loadError as { name?: string }).name !== 'AbortError') setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los productos.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [page, query])

  useEffect(() => {
    const controller = new AbortController()
    void Promise.resolve().then(() => loadProducts(controller.signal))
    return () => controller.abort()
  }, [loadProducts])

  const saveProduct = async (draft: ProductDraft) => {
    if (editingProduct) await updateProduct(editingProduct.id, draft)
    else await createProduct(draft)
    setShowForm(false)
    setEditingProduct(null)
    await loadProducts()
  }

  const archiveProduct = async (product: InventoryProduct) => {
    if (!window.confirm(`¿Dar de baja ${product.name}?`)) return
    setActionId(product.id)
    setError('')
    try {
      await deleteProduct(product.id)
      await loadProducts()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se pudo dar de baja el producto.')
    } finally {
      setActionId('')
    }
  }

  return (
    <section className="product-management">
      <header className="user-management-header">
        <div><p className="panel-kicker">Existencias</p><h2>Inventario</h2><p>Consulta y administra los productos disponibles.</p></div>
        {canManage && <button className="crm-primary-button" type="button" onClick={() => { setEditingProduct(null); setShowForm(true) }}>+ Nuevo producto</button>}
      </header>
      <form className="user-toolbar" onSubmit={(event) => { event.preventDefault(); setPage(0); setQuery(queryInput) }}>
        <input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Buscar por nombre o SKU" />
        <button className="dialog-secondary" type="submit">Buscar</button>
        <span>{totalElements} productos</span>
      </form>
      {error && <p className="login-error" role="alert">{error}</p>}
      {loading ? <p>Cargando inventario…</p> : <div className="user-table-wrap">
        <table className="user-table product-table">
          <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>
            {products.map((product) => {
              const state = stockState(product.stock)
              return <tr key={product.id}>
                <td><strong>{product.name}</strong><small>{product.sku}</small></td>
                <td>{product.category}</td>
                <td>{formatPrice(product.price)}</td>
                <td className="product-stock">{product.stock}</td>
                <td><span className={`user-status ${state.className}`}>{state.label}</span></td>
                <td className="user-actions">{canManage && <><button type="button" onClick={() => { setEditingProduct(product); setShowForm(true) }}>Editar</button><button type="button" disabled={actionId === product.id} onClick={() => void archiveProduct(product)}>Dar de baja</button></>}</td>
              </tr>
            })}
            {!products.length && <tr><td colSpan={6}>{query ? 'No encontramos productos con esa búsqueda.' : 'Aún no hay productos activos.'}</td></tr>}
          </tbody>
        </table>
      </div>}
      {totalPages > 1 && <nav className="user-pagination" aria-label="Paginación de inventario"><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>← Anterior</button><span>Página {page + 1} de {totalPages}</span><button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((value) => value + 1)}>Siguiente →</button></nav>}
      {showForm && <ProductForm product={editingProduct} onSave={saveProduct} onCancel={() => { setShowForm(false); setEditingProduct(null) }} />}
    </section>
  )
}
