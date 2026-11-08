import { useEffect, useState } from 'react'
import { createCategory, listCategories, type Category, type ProductDraft } from '../api/crm.api'
import type { InventoryProduct } from '../shared/crm.types'
import { useModalA11y } from './useModalA11y'

export default function ProductForm({ product, onSave, onCancel }: {
  product: InventoryProduct | null
  onSave: (draft: ProductDraft) => Promise<void>
  onCancel: () => void
}) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '')
  const [imageFailed, setImageFailed] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryName, setCategoryName] = useState(product?.category ?? '')
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '')
  const dialogRef = useModalA11y(onCancel)

  useEffect(() => { void listCategories().then(setCategories).catch(() => setCategories([])) }, [])

  return <div className="modal-backdrop" role="presentation">
    <section ref={dialogRef} className="patient-dialog user-dialog" role="dialog" aria-modal="true" aria-labelledby="product-form-title" tabIndex={-1}>
      <form onSubmit={async (event) => {
        event.preventDefault(); setError(''); setSaving(true)
        const form = new FormData(event.currentTarget)
        try {
          const typedCategory = categoryName.trim()
          const existingCategory = categories.find((category) => category.name.toLowerCase() === typedCategory.toLowerCase())
          const savedCategory = existingCategory ?? (typedCategory ? await createCategory(typedCategory, categories.length + 1) : null)
          await onSave({
            sku: String(form.get('sku')).trim(), name: String(form.get('name')).trim(),
            description: String(form.get('description') || '').trim() || null,
            imageUrl: String(form.get('imageUrl') || '').trim() || null,
            category: savedCategory ? null : typedCategory, categoryId: (savedCategory?.id ?? categoryId) || null,
            price: Number(form.get('price')), stock: Number(form.get('stock')), catalogo: form.get('catalogo') === 'on',
          })
        } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el producto.') }
        finally { setSaving(false) }
      }}>
        <header className="patient-dialog-header"><div><p className="panel-kicker">Inventario</p><h2 id="product-form-title">{product ? 'Editar producto' : 'Nuevo producto'}</h2><p>Controla la información y existencia de este artículo.</p></div><button className="dialog-close" type="button" aria-label="Cerrar formulario" onClick={onCancel}>×</button></header>
        <div className="user-form-body product-form-body">
          <label>SKU<input name="sku" defaultValue={product?.sku} placeholder="ARMA-102" required /></label>
          <label>Nombre<input name="name" defaultValue={product?.name} placeholder="Armazón acetate" required /></label>
          <label>Categoría<input name="category" value={categoryName} onChange={(event) => { setCategoryName(event.target.value); setCategoryId('') }} list="product-categories" placeholder="Armazones" required /><datalist id="product-categories">{categories.map((category) => <option key={category.id} value={category.name} />)}</datalist><small>Escribe una nueva para crearla automáticamente.</small></label>
          <label>Precio<input name="price" type="number" min="0" step="0.01" defaultValue={product?.price ?? 0} required /></label>
          <label>Stock<input name="stock" type="number" min="0" step="1" defaultValue={product?.stock ?? 0} required /></label>
          <label className="counter-sale-toggle"><span><strong>Mostrar en catálogo</strong><small>Si está activo, aparecerá en la vitrina pública.</small></span><input name="catalogo" type="checkbox" defaultChecked={product?.catalogo ?? true} /></label>
          <label className="product-description-field">Descripción<textarea name="description" rows={3} defaultValue={product?.description ?? ''} /></label>
          <label className="product-image-field">Imagen del producto (URL)<input name="imageUrl" type="url" maxLength={1000} value={imageUrl} onChange={(event) => { setImageUrl(event.target.value); setImageFailed(false) }} placeholder="https://..." /><small>Opcional. Máximo 1000 caracteres.</small></label>
          {imageUrl && <div className="product-image-preview">{imageFailed ? <span>No se pudo cargar la vista previa.</span> : <img src={imageUrl} alt="Vista previa del producto" loading="lazy" decoding="async" onError={() => setImageFailed(true)} />}</div>}
        </div>
        {error && <p className="login-error patient-dialog-error" role="alert">{error}</p>}
        <footer className="patient-dialog-footer"><button className="dialog-secondary" type="button" onClick={onCancel}>Cancelar</button><button className="crm-primary-button" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar producto →'}</button></footer>
      </form>
    </section>
  </div>
}
