import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  X,
  MessageCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

const getStockBadgeClass = (status) => {
  if (status === 'In Stock') return 'stock-badge stock-in-stock';
  if (status === 'Made to Order') return 'stock-badge stock-made-to-order';
  return 'stock-badge stock-sold-out';
};

export default function CatalogPage() {
  const navigate = useNavigate();
  const {
    products,
    categories,
    settings,
    trackCatalogVisit,
    trackProductView,
    trackProductWhatsappContact,
    buildWhatsappUrl,
  } = useStore();

  const hasTrackedVisit = useRef(false);

  // Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStock, setSelectedStock] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);

  // Per-card active image index & Detail Modal
  const [cardImageIndexes, setCardImageIndexes] = useState({});
  const [activeProductModal, setActiveProductModal] = useState(null);
  const [modalImageIdx, setModalImageIdx] = useState(0);

  const itemsPerPage = Number(settings.itemsPerPage) || 6;

  useEffect(() => {
    if (!hasTrackedVisit.current) {
      hasTrackedVisit.current = true;
      trackCatalogVisit();
    }
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStock, sortBy]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        const matchesCategory =
          selectedCategory === 'All' || item.category === selectedCategory;
        const matchesStock =
          selectedStock === 'All' || item.stockStatus === selectedStock;
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        return matchesCategory && matchesStock && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
        if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
        if (sortBy === 'newest')
          return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'most-contacted')
          return (b.whatsappClicks || 0) - (a.whatsappClicks || 0);
        // default 'popular': combined score of views + whatsappClicks * 2
        const scoreB = (b.views || 0) + (b.whatsappClicks || 0) * 2;
        const scoreA = (a.views || 0) + (a.whatsappClicks || 0) * 2;
        return scoreB - scoreA;
      });
  }, [products, searchQuery, selectedCategory, selectedStock, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleOpenProductModal = (product) => {
    trackProductView(product.id);
    setModalImageIdx(0);
    setActiveProductModal(product);
  };

  const handleContactForInfo = (product, e) => {
    if (e) e.stopPropagation();
    trackProductWhatsappContact(product.id);
    const customMsg = `Hello ${settings.brandName}! I would like more info about "${product.name}" (${settings.currencySymbol}${product.price} - ${product.category}). Is it available?`;
    const url = buildWhatsappUrl(customMsg);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const cycleCardImage = (productId, totalImages, e) => {
    e.stopPropagation();
    if (totalImages <= 1) return;
    setCardImageIndexes((prev) => ({
      ...prev,
      [productId]: ((prev[productId] || 0) + 1) % totalImages,
    }));
  };

  return (
    <div className="catalog-container page-transition">
      {/* Top Navigation Header */}
      <header className="catalog-header">
        <div className="catalog-brand-nav">
          <button
            type="button"
            className="back-pill-btn"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={16} />
            <span>Main Menu</span>
          </button>

          <img
            src="/logo.jpg"
            alt={settings.brandName}
            className="catalog-mini-logo"
          />

          <div className="catalog-title-block">
            <h1>Handmade Collection</h1>
            <p>Artisanal pieces crafted with natural materials</p>
          </div>
        </div>

        <button
          type="button"
          className="admin-Portal-btn"
          onClick={() => navigate('/admin')}
        >
          <ShieldCheck size={14} />
          <span>Admin</span>
        </button>
      </header>

      {/* Filters, Search & Category Pills (All dynamically synced from Admin) */}
      <section className="filters-panel stagger-1" aria-label="Catalog Filters">
        <div className="filters-top-row">
          {/* Search Input */}
          <div className="search-input-wrap">
            <Search size={18} />
            <input
              type="text"
              className="search-input"
              placeholder="Search handmade items by name, material, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Availability & Sort Selects */}
          <div className="filter-selects-group">
            <select
              className="select-control"
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              aria-label="Filter by availability"
            >
              <option value="All">All Availability</option>
              <option value="In Stock">In Stock</option>
              <option value="Made to Order">Made to Order</option>
              <option value="Sold Out">Sold Out</option>
            </select>

            <select
              className="select-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort items"
            >
              <option value="popular">Sort: Most Popular</option>
              <option value="most-contacted">Sort: Most Inquired</option>
              <option value="newest">Sort: Newest Added</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="category-pills-scroll" role="tablist" aria-label="Category Filter">
          <button
            type="button"
            className={`category-pill ${selectedCategory === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            All Categories ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat.name).length;
            return (
              <button
                key={cat.id}
                type="button"
                className={`category-pill ${selectedCategory === cat.name ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* Results Meta Bar */}
      <div className="catalog-meta-bar stagger-2">
        <span>
          Showing <strong>{paginatedProducts.length}</strong> of{' '}
          <strong>{filteredProducts.length}</strong> items
          {selectedCategory !== 'All' && ` in "${selectedCategory}"`}
        </span>
        {(selectedCategory !== 'All' || selectedStock !== 'All' || searchQuery) && (
          <button
            type="button"
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              textDecoration: 'underline',
              color: 'var(--brand-espresso-dark)',
            }}
            onClick={() => {
              setSelectedCategory('All');
              setSelectedStock('All');
              setSearchQuery('');
            }}
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Product Grid */}
      {paginatedProducts.length === 0 ? (
        <div
          className="admin-panel stagger-2"
          style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}
        >
          <SlidersHorizontal
            size={36}
            style={{ color: 'var(--brand-taupe)', marginBottom: '0.75rem' }}
          />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>
            No matching handmade items found
          </h2>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--brand-espresso-light)',
              marginBottom: '1.25rem',
            }}
          >
            Try adjusting your category filter or search terms.
          </p>
          <button
            type="button"
            className="btn-primary-admin"
            onClick={() => {
              setSelectedCategory('All');
              setSelectedStock('All');
              setSearchQuery('');
            }}
          >
            Show All Items
          </button>
        </div>
      ) : (
        <div className="product-grid stagger-2">
          {paginatedProducts.map((product) => {
            const images =
              product.images && product.images.length > 0
                ? product.images
                : ['/logo.jpg'];
            const activeImgIdx = (cardImageIndexes[product.id] || 0) % images.length;

            return (
              <article key={product.id} className="product-card">
                <div
                  className="product-img-wrapper"
                  onClick={() => handleOpenProductModal(product)}
                >
                  <img
                    src={images[activeImgIdx]}
                    alt={product.name}
                    className="product-img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/logo.jpg';
                    }}
                  />

                  <div className="product-badges-top">
                    <span className="category-tag">{product.category}</span>
                    <span className={getStockBadgeClass(product.stockStatus)}>
                      {product.stockStatus}
                    </span>
                  </div>

                  {images.length > 1 && (
                    <div
                      className="gallery-dots"
                      onClick={(e) => cycleCardImage(product.id, images.length, e)}
                      title="Click to preview next photo"
                    >
                      {images.map((_, idx) => (
                        <span
                          key={idx}
                          className={`gallery-dot ${idx === activeImgIdx ? 'active' : ''}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="product-body">
                  <div className="product-title-row">
                    <h2
                      className="product-title"
                      onClick={() => handleOpenProductModal(product)}
                    >
                      {product.name}
                    </h2>
                    <span className="product-price">
                      {settings.currencySymbol}
                      {product.price}
                    </span>
                  </div>

                  <p className="product-desc">{product.description}</p>

                  <div className="product-actions">
                    <button
                      type="button"
                      className="btn-details"
                      onClick={() => handleOpenProductModal(product)}
                      title="View full description & photos"
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      type="button"
                      className="btn-whatsapp-item"
                      onClick={(e) => handleContactForInfo(product, e)}
                    >
                      <MessageCircle size={16} />
                      <span>Contact for Info</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <nav className="pagination-bar" aria-label="Catalog Pagination">
          <button
            type="button"
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            aria-label="Previous Page"
          >
            <ChevronLeft size={18} />
          </button>

          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </button>
          ))}

          <button
            type="button"
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Next Page"
          >
            <ChevronRight size={18} />
          </button>
        </nav>
      )}

      {/* Item Quick-View / Multi-Image Modal */}
      {activeProductModal && (
        <div
          className="modal-backdrop"
          onClick={() => setActiveProductModal(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setActiveProductModal(null)}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {(() => {
              const imgs =
                activeProductModal.images && activeProductModal.images.length > 0
                  ? activeProductModal.images
                  : ['/logo.jpg'];
              const currentImg = imgs[modalImageIdx % imgs.length];

              return (
                <div>
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16/10',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      background: 'var(--bg-secondary)',
                      marginBottom: '1rem',
                    }}
                  >
                    <img
                      src={currentImg}
                      alt={activeProductModal.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.src = '/logo.jpg';
                      }}
                    />
                  </div>

                  {imgs.length > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.6rem',
                        marginBottom: '1.25rem',
                        overflowX: 'auto',
                      }}
                    >
                      {imgs.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setModalImageIdx(idx)}
                          style={{
                            width: '64px',
                            height: '48px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border:
                              idx === modalImageIdx
                                ? '2px solid var(--brand-espresso)'
                                : '1px solid rgba(75,54,41,0.2)',
                            opacity: idx === modalImageIdx ? 1 : 0.65,
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span className="category-tag">{activeProductModal.category}</span>
                    <span className={getStockBadgeClass(activeProductModal.stockStatus)}>
                      {activeProductModal.stockStatus}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: '1rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <h2 style={{ fontSize: '1.75rem' }}>{activeProductModal.name}</h2>
                    <span
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {settings.currencySymbol}
                      {activeProductModal.price}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.94rem',
                      color: 'var(--brand-espresso-light)',
                      marginBottom: '1.5rem',
                      lineHeight: 1.7,
                    }}
                  >
                    {activeProductModal.description}
                  </p>

                  <button
                    type="button"
                    className="btn-whatsapp-item"
                    style={{ width: '100%', padding: '0.95rem 1.25rem', fontSize: '0.95rem' }}
                    onClick={(e) => handleContactForInfo(activeProductModal, e)}
                  >
                    <MessageCircle size={18} />
                    <span>Contact for Info via WhatsApp</span>
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
