import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import BrandLogo from "../../components/BrandLogo";
import { whatsappMessages, whatsappUrl } from "../../config/contact";
import { listPublicProducts, type PublicProduct } from "../catalog/api/catalog.api";
import { socialLinks } from "../../config/social";

const whatsappLink = whatsappUrl(whatsappMessages.general);

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(price);
}

function randomProducts(products: PublicProduct[]) {
  return [...products].sort(() => Math.random() - 0.5).slice(0, 3);
}

function HomeProductVisual({ product, index }: { product: PublicProduct; index: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <div className={`product-image ${["sand", "blue", "rose"][index % 3]}`}>
      {product.imageUrl && !imageFailed ? (
        <img src={product.imageUrl} alt={product.name} loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
      ) : (
        <div className="product-shape"><span></span><i></i><span></span></div>
      )}
      <span className="product-tag">{product.category}</span>
    </div>
  );
}

const categories = [
  {
    icon: "◉",
    title: "Armazones",
    text: "Diseños para cada estilo y personalidad.",
  },
  {
    icon: "◒",
    title: "Lentes solares",
    text: "Protección y estilo para todos tus días.",
  },
  {
    icon: "◌",
    title: "Lentes graduados",
    text: "Una visión cómoda y precisa.",
  },
  {
    icon: "✦",
    title: "Accesorios",
    text: "Todo lo que necesitas para cuidar tus lentes.",
  },
];

function App() {
  const [featuredProducts, setFeaturedProducts] = useState<PublicProduct[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    void listPublicProducts("", 0, controller.signal)
      .then((result) => setFeaturedProducts(randomProducts(result.content.filter((product) => product.stock > 0))))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setFeaturedProducts([]);
      });
    return () => controller.abort();
  }, []);

  return (
    <main>
      <div className="topbar">
        Atención personalizada · Más de 30 años cuidando tu visión
      </div>
      <header className="site-header">
        <a className="brand" href="#inicio">
          <BrandLogo className="brand" ariaLabel="Óptica Vision Guinto, inicio" />
        </a>
        <nav aria-label="Navegación principal">
          <a href="#inicio">Inicio</a>
          <Link to="/catalogo">Catálogo</Link>
          <a href="#promociones">Promociones</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <a
          className="button button-small button-whatsapp"
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp <span>↗</span>
        </a>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow">Tu mirada, nuestra experiencia</p>
          <h1>
            Verte bien también es <em>verte mejor.</em>
          </h1>
          <p className="hero-text">
            Encuentra los lentes que van contigo, con la atención cercana de
            quienes llevamos más de 30 años cuidando tu visión.
          </p>
          <div className="hero-actions">
            <a
              className="button button-primary"
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
            >
              Escríbenos por WhatsApp <span>↗</span>
            </a>
            <Link className="button button-ghost" to="/catalogo">
              Ver catálogo <span>↓</span>
            </Link>
          </div>
          <div className="hero-note">
            <span>✦</span> Atención experta para toda la familia
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="Ilustración decorativa de lentes"
          role="img"
        >
          <div className="sun"></div>
          <div className="glasses">
            <span></span>
            <i></i>
            <span></span>
          </div>
          <div className="art-card">
            30+<small>años de experiencia</small>
          </div>
        </div>
      </section>

      <section
        className="categories section-wrap"
        aria-labelledby="categories-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Encuentra tu estilo</p>
            <h2 id="categories-title">
              Todo empieza con
              <br />
              <em>una buena mirada.</em>
            </h2>
          </div>
          <p>Explora nuestras opciones y encuentra eso que estabas buscando.</p>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link className="category-card" to="/catalogo" key={category.title}>
              <span className="category-icon">{category.icon}</span>
              <h3>{category.title}</h3>
              <p>{category.text}</p>
              <span className="arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section
        className="catalog section-wrap"
        id="catalogo"
        aria-labelledby="catalog-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Selección Vision Guinto</p>
            <h2 id="catalog-title">
              Nuestros <em>favoritos</em>
            </h2>
          </div>
          <a
            className="text-link"
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
          >
            Consultar disponibilidad ↗
          </a>
        </div>
        <div className="product-grid">
          {featuredProducts.map((product, index) => (
            <article className="product-card" key={product.id}>
              <HomeProductVisual product={product} index={index} />
              <div className="product-info">
                <div>
                  <p>{product.category}</p>
                  <h3>{product.name}</h3>
                </div>
                <strong>{formatPrice(product.price)}</strong>
              </div>
              <a href={whatsappUrl(`Hola, me interesa el producto ${product.name}.`)} target="_blank" rel="noreferrer">
                Consultar por WhatsApp ↗
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="promotion" id="promociones">
        <div>
          <p className="eyebrow">Promoción del mes</p>
          <h2>
            Tu nueva mirada
            <br />
            <em>te está esperando.</em>
          </h2>
          <p>
            Pregunta por nuestras promociones vigentes en armazones y lentes
            graduados.
          </p>
          <a
            className="button button-light"
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
          >
            Quiero conocer la promoción ↗
          </a>
        </div>
        <div className="promo-shape">
          VISION
          <br />
          <small>GUINTO</small>
        </div>
      </section>

      <section className="trust section-wrap">
        <div className="trust-number">
          30<span>+</span>
        </div>
        <div>
          <p className="eyebrow">Una historia que se ve</p>
          <h2>
            Más de tres décadas
            <br />
            mirando <em>contigo.</em>
          </h2>
          <p>
            En Óptica Vision Guinto creemos que unos buenos lentes hacen más que
            ayudarte a ver: te ayudan a vivir cada momento con confianza.
          </p>
          <a
            className="text-link"
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
          >
            Conoce nuestra atención ↗
          </a>
        </div>
      </section>

      <footer className="footer" id="contacto">
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
            <a href={whatsappLink} target="_blank" rel="noreferrer">
              WhatsApp ↗
            </a>
            {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noreferrer">Facebook ↗</a>}
            {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noreferrer">Instagram ↗</a>}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Óptica Vision Guinto</span>
          <span>Más de 30 años cuidando tu visión</span>
        </div>
      </footer>
    </main>
  );
}

export default App;
