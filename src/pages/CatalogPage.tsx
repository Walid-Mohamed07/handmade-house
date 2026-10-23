import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  X,
  MessageCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Hash,
} from "lucide-react";
import { useStore } from "../context/StoreContext.tsx";
import { ProductItem, StockStatus } from "../types.ts";

const getStockBadgeClasses = (status: StockStatus | string): string => {
  if (status === "In Stock") {
    return "bg-[#E3EFE8] text-[#286646]";
  }
  if (status === "Made to Order") {
    return "bg-[#F5EBE0] text-[#94622A]";
  }
  return "bg-[#F2E4E4] text-[#9E3B3B]";
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

  const hasTrackedVisit = useRef<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStock, setSelectedStock] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [cardImageIndexes, setCardImageIndexes] = useState<
    Record<string, number>
  >({});
  const [activeProductModal, setActiveProductModal] =
    useState<ProductItem | null>(null);
  const [modalImageIdx, setModalImageIdx] = useState<number>(0);

  // Lock background page scroll while the product popup is open
  useEffect(() => {
    if (!activeProductModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [activeProductModal]);

  const itemsPerPage = Number(settings.itemsPerPage) || 6;

  useEffect(() => {
    if (!hasTrackedVisit.current) {
      hasTrackedVisit.current = true;
      trackCatalogVisit();
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStock, sortBy]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        const matchesCategory =
          selectedCategory === "All" || item.category === selectedCategory;
        const matchesStock =
          selectedStock === "All" || item.stockStatus === selectedStock;
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !q ||
          item.name.toLowerCase().includes(q) ||
          (item.code || "").toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        return matchesCategory && matchesStock && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return Number(a.price) - Number(b.price);
        if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
        if (sortBy === "newest")
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        if (sortBy === "most-contacted")
          return (b.whatsappClicks || 0) - (a.whatsappClicks || 0);
        const scoreB = (b.views || 0) + (b.whatsappClicks || 0) * 2;
        const scoreA = (a.views || 0) + (a.whatsappClicks || 0) * 2;
        return scoreB - scoreA;
      });
  }, [products, searchQuery, selectedCategory, selectedStock, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / itemsPerPage),
  );
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleOpenProductModal = (product: ProductItem) => {
    trackProductView(product.id);
    setModalImageIdx(0);
    setActiveProductModal(product);
  };

  // Pass the two-part product code (e.g., CERM-1014) in the WhatsApp message
  const handleContactForInfo = (product: ProductItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    trackProductWhatsappContact(product.id);
    const codeLabel = product.code ? ` [Code: ${product.code}]` : "";
    const customMsg = `Hello ${settings.brandName}! I would like more info about "${product.name}"${codeLabel} (${settings.currencySymbol}${product.price} - ${product.category}). Is it available?`;
    const url = buildWhatsappUrl(customMsg);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const cycleCardImage = (
    productId: string,
    totalImages: number,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (totalImages <= 1) return;
    setCardImageIndexes((prev) => ({
      ...prev,
      [productId]: ((prev[productId] || 0) + 1) % totalImages,
    }));
  };

  return (
    <div
      style={{
        backgroundColor: "var(--brand-secondary)",
        color: "var(--brand-primary)",
      }}
      className="min-h-screen animate-fade-up"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        <header
          style={{
            borderColor:
              "color-mix(in srgb, var(--brand-primary) 15%, transparent)",
          }}
          className="flex items-center justify-between gap-4 pb-5 mb-6 border-b flex-wrap"
        >
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                backgroundColor: "var(--brand-surface)",
                borderColor:
                  "color-mix(in srgb, var(--brand-primary) 18%, transparent)",
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold shadow-xs hover:-translate-x-0.5 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Main Menu</span>
            </button>

            <img
              src="/logo.jpg"
              alt={settings.brandName}
              style={{
                borderColor:
                  "color-mix(in srgb, var(--brand-primary) 20%, transparent)",
              }}
              className="w-11 h-11 rounded-full object-cover border"
            />

            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold leading-tight">
                {settings.brandName} Collection
              </h1>
              <p className="text-xs sm:text-sm opacity-75">
                Artisanal pieces crafted with natural materials
              </p>
            </div>
          </div>
        </header>

        <section
          style={{
            backgroundColor: "var(--brand-surface)",
            borderColor:
              "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
          }}
          className="rounded-2xl border p-4 sm:p-5 mb-6 shadow-xs stagger-1"
          aria-label="Catalog Filters"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            <div className="relative md:col-span-6 lg:col-span-7 flex items-center">
              <Search
                size={18}
                className="absolute left-3.5 opacity-60 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by item name, code (e.g. CERM-1014), material, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  backgroundColor: "var(--brand-secondary)",
                  borderColor:
                    "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                }}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-current/20 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 opacity-60 hover:opacity-100 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:col-span-6 lg:col-span-5">
              <select
                value={selectedStock}
                onChange={(e) => setSelectedStock(e.target.value)}
                style={{
                  backgroundColor: "var(--brand-secondary)",
                  borderColor:
                    "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none cursor-pointer"
                aria-label="Filter by availability"
              >
                <option value="All">All Availability</option>
                <option value="In Stock">In Stock</option>
                <option value="Made to Order">Made to Order</option>
                <option value="Sold Out">Sold Out</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  backgroundColor: "var(--brand-secondary)",
                  borderColor:
                    "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium outline-none cursor-pointer"
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

          <div
            style={{
              borderColor:
                "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
            }}
            className="flex items-center gap-2 overflow-x-auto pt-4 mt-4 border-t no-scrollbar"
            role="tablist"
            aria-label="Category Filter"
          >
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              style={
                selectedCategory === "All"
                  ? {
                      backgroundColor: "var(--brand-primary)",
                      color: "var(--brand-surface)",
                    }
                  : {
                      backgroundColor: "var(--brand-secondary)",
                      color: "var(--brand-primary)",
                    }
              }
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-2xs"
            >
              All Categories ({products.length})
            </button>

            {categories.map((cat) => {
              const count = products.filter(
                (p) => p.category === cat.name,
              ).length;
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  style={
                    isActive
                      ? {
                          backgroundColor: "var(--brand-primary)",
                          color: "var(--brand-surface)",
                        }
                      : {
                          backgroundColor: "var(--brand-secondary)",
                          color: "var(--brand-primary)",
                        }
                  }
                  className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer opacity-90 hover:opacity-100"
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex justify-between items-center mb-4 text-xs sm:text-sm opacity-80 stagger-2">
          <span>
            Showing <strong>{paginatedProducts.length}</strong> of{" "}
            <strong>{filteredProducts.length}</strong> items
            {selectedCategory !== "All" && ` in "${selectedCategory}"`}
          </span>

          {(selectedCategory !== "All" ||
            selectedStock !== "All" ||
            searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSelectedStock("All");
                setSearchQuery("");
              }}
              className="font-semibold underline cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>

        {paginatedProducts.length === 0 ? (
          <div
            style={{
              backgroundColor: "var(--brand-surface)",
              borderColor:
                "color-mix(in srgb, var(--brand-primary) 15%, transparent)",
            }}
            className="rounded-2xl border p-12 text-center shadow-xs stagger-2"
          >
            <SlidersHorizontal size={36} className="mx-auto mb-3 opacity-50" />
            <h2 className="font-heading text-2xl font-bold mb-1">
              No matching handmade items found
            </h2>
            <p className="text-sm opacity-75 mb-5">
              Try adjusting your category filter or search terms.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSelectedStock("All");
                setSearchQuery("");
              }}
              style={{
                backgroundColor: "var(--brand-primary)",
                color: "var(--brand-surface)",
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
            >
              Show All Items
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-2">
            {paginatedProducts.map((product) => {
              const images =
                product.images && product.images.length > 0
                  ? product.images
                  : ["/logo.jpg"];
              const activeImgIdx =
                (cardImageIndexes[product.id] || 0) % images.length;

              return (
                <article
                  key={product.id}
                  style={{
                    backgroundColor: "var(--brand-surface)",
                    borderColor:
                      "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
                  }}
                  className="group rounded-2xl border overflow-hidden flex flex-col shadow-xs hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300"
                >
                  <div
                    className="relative w-full aspect-4/3 overflow-hidden cursor-pointer bg-black/5"
                    onClick={() => handleOpenProductModal(product)}
                  >
                    <img
                      src={images[activeImgIdx]}
                      alt={product.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "/logo.jpg";
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
                      <span
                        style={{
                          backgroundColor:
                            "color-mix(in srgb, var(--brand-surface) 92%, transparent)",
                          color: "var(--brand-primary)",
                        }}
                        className="px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-xs shadow-xs"
                      >
                        {product.category}
                      </span>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getStockBadgeClasses(
                          product.stockStatus,
                        )}`}
                      >
                        {product.stockStatus}
                      </span>
                    </div>

                    {images.length > 1 && (
                      <div
                        onClick={(e) =>
                          cycleCardImage(product.id, images.length, e)
                        }
                        title="Click to preview next photo"
                        className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/45 px-2.5 py-1 rounded-full"
                      >
                        {images.map((_, idx) => (
                          <span
                            key={idx}
                            className={`h-1.5 rounded-full transition-all ${
                              idx === activeImgIdx
                                ? "w-3.5 bg-white"
                                : "w-1.5 bg-white/50"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    {/* Two-part Item Code Badge */}
                    {product.code && (
                      <div className="mb-1.5">
                        <span
                          style={{
                            backgroundColor: "var(--brand-secondary)",
                            borderColor:
                              "color-mix(in srgb, var(--brand-primary) 20%, transparent)",
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-[11px] font-mono font-bold tracking-wider"
                        >
                          <Hash size={11} />
                          {product.code}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-start gap-2.5 mb-2">
                      <h2
                        onClick={() => handleOpenProductModal(product)}
                        className="font-heading text-xl font-bold leading-snug cursor-pointer hover:opacity-80"
                      >
                        {product.name}
                      </h2>
                      <span className="font-heading text-xl font-bold whitespace-nowrap">
                        {product.price}
                        {settings.currencySymbol}
                      </span>
                    </div>

                    <p className="text-sm opacity-75 line-clamp-2 mb-5 flex-1">
                      {product.description}
                    </p>

                    <div className="flex gap-2.5 mt-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenProductModal(product)}
                        title="View full description & photos"
                        style={{
                          backgroundColor: "var(--brand-secondary)",
                          borderColor:
                            "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                        }}
                        className="px-3.5 py-2.5 rounded-xl border text-sm font-semibold hover:opacity-85 transition-opacity cursor-pointer"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleContactForInfo(product, e)}
                        style={{
                          backgroundColor: "var(--brand-accent)",
                          color: "#FFFFFF",
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-xs hover:opacity-95 hover:-translate-y-0.5 transition-all cursor-pointer"
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

        {totalPages > 1 && (
          <nav
            className="mt-10 flex items-center justify-center gap-2 flex-wrap"
            aria-label="Catalog Pagination"
          >
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                backgroundColor: "var(--brand-surface)",
                borderColor:
                  "color-mix(in srgb, var(--brand-primary) 18%, transparent)",
              }}
              className="w-10 h-10 rounded-xl border flex items-center justify-center disabled:opacity-40 cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
              (pageNum) => {
                const active = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    style={
                      active
                        ? {
                            backgroundColor: "var(--brand-primary)",
                            color: "var(--brand-surface)",
                          }
                        : {
                            backgroundColor: "var(--brand-surface)",
                            borderColor:
                              "color-mix(in srgb, var(--brand-primary) 18%, transparent)",
                          }
                    }
                    className="min-w-10 h-10 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center transition-all cursor-pointer"
                  >
                    {pageNum}
                  </button>
                );
              },
            )}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                backgroundColor: "var(--brand-surface)",
                borderColor:
                  "color-mix(in srgb, var(--brand-primary) 18%, transparent)",
              }}
              className="w-10 h-10 rounded-xl border flex items-center justify-center disabled:opacity-40 cursor-pointer"
              aria-label="Next Page"
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        )}
      </div>

      {activeProductModal && (
        <div
          className="sticky inset-0 z-50 h-dvh overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setActiveProductModal(null)}
        >
          <div
            style={{
              backgroundColor: "var(--brand-surface)",
              color: "var(--brand-primary)",
            }}
            className="w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-3xl p-4 sm:p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveProductModal(null)}
              style={{ backgroundColor: "var(--brand-secondary)" }}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-xs cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {(() => {
              const imgs =
                activeProductModal.images &&
                activeProductModal.images.length > 0
                  ? activeProductModal.images
                  : ["/logo.jpg"];
              const currentImg = imgs[modalImageIdx % imgs.length];

              return (
                <div>
                  <div className="relative w-full aspect-16/10 max-h-full rounded-2xl overflow-hidden bg-black/5 mb-3">
                    <img
                      src={currentImg}
                      alt={activeProductModal.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/logo.jpg";
                      }}
                    />
                  </div>

                  {imgs.length > 1 && (
                    <div className="flex gap-2.5 mb-5 overflow-x-auto">
                      {imgs.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setModalImageIdx(idx)}
                          className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            idx === modalImageIdx
                              ? "border-current opacity-100"
                              : "border-transparent opacity-60"
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {activeProductModal.code && (
                      <span
                        style={{
                          backgroundColor: "var(--brand-primary)",
                          color: "var(--brand-surface)",
                        }}
                        className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider"
                      >
                        Code: {activeProductModal.code}
                      </span>
                    )}
                    <span
                      style={{ backgroundColor: "var(--brand-secondary)" }}
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                    >
                      {activeProductModal.category}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${getStockBadgeClasses(
                        activeProductModal.stockStatus,
                      )}`}
                    >
                      {activeProductModal.stockStatus}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline gap-4 mb-3">
                    <h2 className="font-heading text-2xl sm:text-3xl font-bold">
                      {activeProductModal.name}
                    </h2>
                    <span className="font-heading text-2xl sm:text-3xl font-bold">
                      {activeProductModal.price}
                      {settings.currencySymbol}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base opacity-80 leading-relaxed mb-4">
                    {activeProductModal.description}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => handleContactForInfo(activeProductModal, e)}
                    style={{
                      backgroundColor: "var(--brand-accent)",
                      color: "#FFFFFF",
                    }}
                    className="w-full py-3.5 px-5 rounded-xl font-semibold inline-flex items-center justify-center gap-2 shadow-md hover:opacity-95 cursor-pointer"
                  >
                    <MessageCircle size={18} />
                    <span>
                      Contact for Info via WhatsApp ({activeProductModal.code})
                    </span>
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
