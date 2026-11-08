import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Catalog.css";
import BrandLogo from "../../components/BrandLogo";
import { whatsappUrl } from "../../config/contact";
import { listPublicProducts, type PublicProduct } from "./api/catalog.api";
import { socialLinks } from "../../config/social";

const tones = ["sand", "blue", "rose", "navy"] as const;

function productWhatsappUrl(product: PublicProduct) {
  return whatsappUrl(
    `Hola, me interesa el producto ${product.name}. ¿Podrían darme más información?`,
  );
}

function ProductVisual({
  product,
  index,
}: {
  product: PublicProduct;
  index: number;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <div className={`catalog-product-visual ${tones[index % tones.length]}`}>
      {product.imageUrl && !imageFailed ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="catalog-glasses">
          <span></span>
          <i></i>
          <span></span>
        </div>
      )}
      <span className="catalog-product-label">{product.category}</span>
    </div>
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(price);
}

function availabilityState(stock: number) {
  if (stock <= 0) return { label: "Agotado", className: "unavailable" };
  if (stock <= 3) return { label: "Pocas unidades", className: "low-stock" };
  return { label: "Disponible", className: "available" };
}

export default function Catalog() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("Todas");
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let controller: AbortController | null = null;
    let disposed = false;

    const loadProducts = async (showLoading: boolean) => {
      controller?.abort();
      const requestController = new AbortController();
      controller = requestController;
      if (showLoading) setLoading(true);
      try {
        const result = await listPublicProducts(
          search,
          page,
          requestController.signal,
        );
        if (disposed) return;
        setProducts(result.content);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
        setError("");
      } catch (reason: unknown) {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        if (!disposed)
          setError(
            reason instanceof Error
              ? reason.message
              : "No se pudo cargar el catálogo.",
          );
      } finally {
        if (!disposed && !requestController.signal.aborted) setLoading(false);
      }
    };

    void loadProducts(false);
    const refresh = () => {
      if (document.visibilityState === "visible") void loadProducts(false);
    };
    const interval = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      disposed = true;
      controller?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [search, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const categories = useMemo(
    () => ["Todas", ...new Set(products.map((product) => product.category))],
    [products],
  );
  const visibleProducts = useMemo(
    () =>
      products.filter(
        (product) => category === "Todas" || product.category === category,
      ),
    [products, category],
  );
  const resetFilters = () => {
    setLoading(true);
    setError("");
    setSearchInput("");
    setSearch("");
    setCategory("Todas");
    setPage(0);
  };

  return (
    <main className="catalog-page">
      <div className="topbar">
        Atención personalizada · Más de 30 años cuidando tu visión
      </div>
      <header className="site-header catalog-header">
        <Link
          className="brand"
          to="/"
          aria-label="Óptica Vision Guinto, inicio"
        >
          <BrandLogo className="brand" />
        </Link>
        <nav aria-label="Navegación principal">
          <Link to="/">Inicio</Link>
          <Link className="active" to="/catalogo">
            Catálogo
          </Link>
          <Link to="/#promociones">Promociones</Link>
          <Link to="/#contacto">Contacto</Link>
        </nav>
        <a
          className="button button-small button-whatsapp"
          href={whatsappUrl()}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp <span>↗</span>
        </a>
      </header>
      <section className="catalog-intro">
        <p className="eyebrow">Colección Vision Guinto</p>
        <h1>
          Encuentra tus próximos <em>lentes.</em>
        </h1>
        <p>
          Explora los productos disponibles actualmente en nuestra óptica. Si te
          gusta alguno, escríbenos y te ayudamos a encontrarlo.
        </p>
      </section>
      <section className="catalog-content" aria-label="Catálogo de productos">
        <div className="catalog-toolbar">
          <label className="catalog-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Busca por nombre"
              value={search}
              onChange={(event) => {
                setError("");
                setSearchInput(event.target.value);
              }}
            />
          </label>
          <select
            aria-label="Filtrar por categoría"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="catalog-results-head">
          <p>
            <strong>{totalElements}</strong> productos encontrados
          </p>
          {(search || category !== "Todas") && (
            <button type="button" onClick={resetFilters}>
              Limpiar filtros ×
            </button>
          )}
        </div>
        {loading && (
          <div className="catalog-empty">
            <h2>Cargando catálogo…</h2>
            <p>Estamos consultando la disponibilidad actual.</p>
          </div>
        )}
        {!loading && error && (
          <div className="catalog-empty">
            <span>!</span>
            <h2>No pudimos cargar el catálogo</h2>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError("");
                setPage(0);
              }}
            >
              Reintentar
            </button>
          </div>
        )}
        {!loading && !error && visibleProducts.length > 0 && (
          <div className="catalog-grid">
            {visibleProducts.map((product, index) => {
              const availability = availabilityState(product.stock);
              return (
                <article className="catalog-product-card" key={product.id}>
                  <ProductVisual product={product} index={index} />
                  <div className="catalog-product-info">
                    <div className="catalog-product-meta">
                      <span>{product.category}</span>
                      <b className={availability.className}>
                        {availability.label}
                      </b>
                    </div>
                    <h2>{product.name}</h2>
                    <p className="catalog-model">
                      Producto de nuestra colección óptica.
                    </p>
                    <dl>
                      <div>
                        <dt>Categoría</dt>
                        <dd>{product.category}</dd>
                      </div>
                      <div>
                        <dt>Precio</dt>
                        <dd>{formatPrice(product.price)}</dd>
                      </div>
                    </dl>
                    <a
                      className="catalog-whatsapp"
                      href={productWhatsappUrl(product)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Preguntar por WhatsApp <span>↗</span>
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {!loading && !error && visibleProducts.length === 0 && (
          <div className="catalog-empty">
            <span>○</span>
            <h2>No encontramos productos</h2>
            <p>Prueba con otra búsqueda o categoría.</p>
            <button type="button" onClick={resetFilters}>
              Ver todos los productos
            </button>
          </div>
        )}
        {!loading && !error && totalPages > 1 && (
          <div className="catalog-pagination">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => {
                setLoading(true);
                setPage((current) => current - 1);
              }}
            >
              Anterior
            </button>
            <span>
              Página {page + 1} de {totalPages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => {
                setLoading(true);
                setPage((current) => current + 1);
              }}
            >
              Siguiente
            </button>
          </div>
        )}
      </section>
      <footer className="footer catalog-footer">
        <div className="footer-main">
          <BrandLogo className="brand footer-brand" />
          <div>
            <p className="footer-label">Visítanos</p>
            <p>
              Dirección pendiente de confirmar
              <br />
              Lun–Sáb · 9:00 a 19:00
            </p>
          </div>
          <div>
            <p className="footer-label">Hablemos</p>
            <a href={whatsappUrl()} target="_blank" rel="noreferrer">
              WhatsApp ↗
            </a>
            {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noreferrer">Facebook ↗</a>}
            {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noreferrer">Instagram ↗</a>}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Óptica Vision Guinto</span>
          <Link to="/">Volver al inicio ↑</Link>
        </div>
      </footer>
    </main>
  );
}
