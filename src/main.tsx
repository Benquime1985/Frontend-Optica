import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import './styles/site.css'

const App = lazy(() => import('./App.tsx'))
const Catalog = lazy(() => import('./Catalog.tsx'))
const Crm = lazy(() => import('./Crm.tsx'))

export function Root() {
  return (
    <BrowserRouter>
      <Suspense fallback={<main aria-busy="true">Cargando…</main>}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/crm" element={<Crm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
