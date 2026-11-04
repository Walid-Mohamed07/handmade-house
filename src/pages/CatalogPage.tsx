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
  Sparkles,
  Maximize2,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  Mail,
  Trash2,
} from "lucide-react";
import { useStore } from "../context/StoreContext.tsx";
import { ProductItem, StockStatus } from "../types.ts";

// Client-side image compression to keep custom request attachments fast and under Vercel limits
const compressRequestImageFile = (
  file: File,
  maxDimension = 1200,
  initialQuality = 0.78,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(
        new Error("Selected file must be an image (JPEG, PNG, WebP)."),
      );
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not parse image data."));
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return reject(new Error("Unable to initialize image compressor."));
          }

          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          let quality = initialQuality;
          let dataUrl = canvas.toDataURL("image/jpeg", quality);

          let attempts = 0;
          while (
            dataUrl.length > 1.2 * 1024 * 1024 &&
            attempts < 3 &&
            quality > 0.45
          ) {
            quality -= 0.15;
            dataUrl = canvas.toDataURL("image/jpeg", quality);
            attempts++;
          }

          resolve(dataUrl);
        } catch (err: any) {
          reject(err);
        }
      };
      img.src = String(e.target?.result || "");
    };
    reader.readAsDataURL(file);
  });
};

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
    submitCustomRequest,
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
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);

  // Request Customized Item Modal States
  const [isCustomRequestOpen, setIsCustomRequestOpen] =
    useState<boolean>(false);
  const [customRequestForm, setCustomRequestForm] = useState<{
    name: string;
    phone: string;
    email: string;
    comment: string;
    images: string[];
  }>({
    name: "",
    phone: "",
    email: "",
    comment: "",
    images: [],
  });
  const [isCompressingReqImg, setIsCompressingReqImg] =
    useState<boolean>(false);
  const [isSubmittingRequest, setIsSubmittingRequest] =
    useState<boolean>(false);
  const [customRequestError, setCustomRequestError] = useState<string>("");
  const [submittedRequestCode, setSubmittedRequestCode] = useState<string>("");

  // Lock background page scroll while any popup is open
  useEffect(() => {
    if (!activeProductModal && !isCustomRequestOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [activeProductModal, isCustomRequestOpen]);

  useEffect(() => {
    if (!fullSizeImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullSizeImage(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullSizeImage]);

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

  const openCustomRequestModal = () => {
    setCustomRequestError("");
    setSubmittedRequestCode("");
    setIsCustomRequestOpen(true);
  };

  const handleCustomRequestImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressingReqImg(true);
    setCustomRequestError("");

    try {
      const compressedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressRequestImageFile(files[i]);
        compressedList.push(compressed);
      }
      setCustomRequestForm((prev) => ({
        ...prev,
        images: [...prev.images, ...compressedList].slice(0, 6),
      }));
    } catch (err: any) {
      setCustomRequestError(
        err.message || "Failed to process attached image(s).",
      );
    } finally {
      setIsCompressingReqImg(false);
      e.target.value = "";
    }
  };

  const handleCustomRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomRequestError("");

    const cleanName = customRequestForm.name.trim();
    const cleanPhone = customRequestForm.phone.trim();
    const cleanEmail = customRequestForm.email.trim();
    const cleanComment = customRequestForm.comment.trim();

    if (!cleanName) {
      setCustomRequestError("Please enter your full name.");
      return;
    }
    if (!cleanPhone) {
      setCustomRequestError("Please enter your phone number.");
      return;
    }

    const payload = {
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      comment: cleanComment,
      images: customRequestForm.images,
    };

    if (JSON.stringify(payload).length > 3.8 * 1024 * 1024) {
      setCustomRequestError(
        "Total size of attached images exceeds server limit. Please remove 1-2 images.",
      );
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const created = await submitCustomRequest(payload);
      setSubmittedRequestCode(created.requestCode || "REQ-NEW");
      setCustomRequestForm({
        name: "",
        phone: "",
        email: "",
        comment: "",
        images: [],
      });
    } catch (err: any) {
      setCustomRequestError(
        err.message || "Failed to submit your request. Please try again.",
      );
    } finally {
      setIsSubmittingRequest(false);
    }
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

        <div className="flex justify-between items-center gap-3 flex-wrap mb-5 text-xs sm:text-sm stagger-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="opacity-80">
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
                className="font-semibold underline opacity-85 hover:opacity-100 cursor-pointer"
              >
                Reset all filters
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={openCustomRequestModal}
            style={{
              backgroundColor: "var(--brand-primary)",
              color: "var(--brand-surface)",
            }}
            className="btn-glossy inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wide cursor-pointer"
          >
            <Sparkles size={16} className="shrink-0" />
            <span>Request customized item</span>
          </button>
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
                    <button
                      type="button"
                      onClick={() => setFullSizeImage(currentImg)}
                      className="absolute right-3 bottom-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/65 text-white shadow-md transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer"
                      aria-label={`View ${activeProductModal.name} image full size`}
                      title="View full size"
                    >
                      <Maximize2 size={18} />
                    </button>
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

      {fullSizeImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Full-size product image"
          className="sticky max-h-[100vh] inset-0 z-[60] p-16 flex items-center justify-center bg-black/90 p-3 sm:p-6"
          onClick={() => setFullSizeImage(null)}
        >
          <button
            type="button"
            onClick={() => setFullSizeImage(null)}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer sm:right-5 sm:top-5"
            aria-label="Close full-size image"
          >
            <X size={22} />
          </button>
          <img
            src={fullSizeImage}
            alt={activeProductModal?.name ?? "Product"}
            className="max-h-full max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      {/* Request Customized Item Modal */}
      {isCustomRequestOpen && (
        <div
          className="sticky inset-0 z-50 h-dvh overflow-hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => !isSubmittingRequest && setIsCustomRequestOpen(false)}
        >
          <div
            style={{
              backgroundColor: "var(--brand-surface)",
              color: "var(--brand-primary)",
            }}
            className="w-full max-w-xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-3xl p-5 sm:p-7 shadow-2xl relative animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              disabled={isSubmittingRequest}
              onClick={() => setIsCustomRequestOpen(false)}
              style={{ backgroundColor: "var(--brand-secondary)" }}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-xs cursor-pointer disabled:opacity-50"
              aria-label="Close custom request modal"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div
                style={{
                  backgroundColor: "var(--brand-primary)",
                  color: "var(--brand-surface)",
                }}
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs shrink-0"
              >
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold leading-tight">
                  Request Customized Item
                </h2>
                <p className="text-xs sm:text-sm opacity-75">
                  Attach reference photos & share your details for a bespoke
                  handmade piece
                </p>
              </div>
            </div>

            {submittedRequestCode ? (
              <div className="mt-5 text-center py-6 px-4 rounded-2xl border border-emerald-600/25 bg-[#E3EFE8]/60">
                <CheckCircle2
                  size={44}
                  className="mx-auto mb-3 text-[#246A46]"
                />
                <h3 className="font-heading text-2xl font-bold mb-1">
                  Request Submitted Successfully!
                </h3>
                <p className="text-xs sm:text-sm opacity-80 mb-3 max-w-md mx-auto">
                  Our artisans have received your custom request and will reach
                  out to you soon via WhatsApp or Email with feedback.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-current/15 text-xs font-mono font-bold mb-5">
                  <span>Reference Code:</span>
                  <span className="text-[#246A46]">{submittedRequestCode}</span>
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedRequestCode("");
                      setIsCustomRequestOpen(false);
                    }}
                    style={{
                      backgroundColor: "var(--brand-primary)",
                      color: "var(--brand-surface)",
                    }}
                    className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    Done & Back to Catalog
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleCustomRequestSubmit}
                className="mt-4 space-y-4"
              >
                {customRequestError && (
                  <div className="bg-[#F2E4E4] text-[#9E3B3B] px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{customRequestError}</span>
                  </div>
                )}

                {/* 1. Upload / Attach Image(s) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider opacity-85">
                      Upload / Attach Image(s){" "}
                      <span className="opacity-60 font-normal">(Up to 6)</span>
                    </label>
                    <label
                      style={{ backgroundColor: "var(--brand-secondary)" }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-opacity ${
                        isCompressingReqImg ||
                        customRequestForm.images.length >= 6
                          ? "opacity-50 pointer-events-none"
                          : "hover:opacity-90"
                      }`}
                    >
                      {isCompressingReqImg ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Upload size={13} />
                      )}
                      <span>
                        {isCompressingReqImg
                          ? "Compressing..."
                          : "Attach Photos"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={
                          isCompressingReqImg ||
                          customRequestForm.images.length >= 6
                        }
                        onChange={handleCustomRequestImageUpload}
                      />
                    </label>
                  </div>

                  {customRequestForm.images.length === 0 ? (
                    <label
                      style={{
                        backgroundColor: "var(--brand-secondary)",
                        borderColor:
                          "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                      }}
                      className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-5 px-4 text-center cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <Upload size={22} className="mb-1.5 opacity-60" />
                      <span className="text-xs sm:text-sm font-semibold">
                        Click to upload reference image(s)
                      </span>
                      <span className="text-[11px] opacity-65 mt-0.5">
                        JPEG, PNG, or WebP — auto-optimized for fast upload
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={isCompressingReqImg}
                        onChange={handleCustomRequestImageUpload}
                      />
                    </label>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-1">
                      {customRequestForm.images.map((imgSrc, idx) => (
                        <div
                          key={idx}
                          className="relative group aspect-square rounded-xl overflow-hidden border border-current/15 bg-black/5"
                        >
                          <img
                            src={imgSrc}
                            alt={`Attachment ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setCustomRequestForm((prev) => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== idx),
                              }))
                            }
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-90 hover:bg-[#9E3B3B] transition-colors cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Comment (Optional) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-85">
                    Comment / Customization Details{" "}
                    <span className="opacity-60 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your desired colors, dimensions, materials, or special notes..."
                    value={customRequestForm.comment}
                    onChange={(e) =>
                      setCustomRequestForm({
                        ...customRequestForm,
                        comment: e.target.value,
                      })
                    }
                    style={{
                      backgroundColor: "var(--brand-secondary)",
                      borderColor:
                        "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-current/20"
                  />
                </div>

                {/* 3. Contact Details: Name (Required), Phone (Required), Email (Optional) */}
                <div
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--brand-primary) 14%, transparent)",
                  }}
                  className="pt-3 border-t space-y-3"
                >
                  <p className="text-xs font-bold uppercase tracking-wider opacity-80">
                    Your Contact Information
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        Name <span className="text-[#9E3B3B]">*</span>
                      </label>
                      <div className="relative">
                        <User
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 opacity-55"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Your full name"
                          value={customRequestForm.name}
                          onChange={(e) =>
                            setCustomRequestForm({
                              ...customRequestForm,
                              name: e.target.value,
                            })
                          }
                          style={{
                            backgroundColor: "var(--brand-secondary)",
                            borderColor:
                              "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                          }}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-current/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        Phone Number <span className="text-[#9E3B3B]">*</span>
                      </label>
                      <div className="relative">
                        <Phone
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 opacity-55"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +20 100 123 4567"
                          value={customRequestForm.phone}
                          onChange={(e) =>
                            setCustomRequestForm({
                              ...customRequestForm,
                              phone: e.target.value,
                            })
                          }
                          style={{
                            backgroundColor: "var(--brand-secondary)",
                            borderColor:
                              "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                          }}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-current/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Email Address{" "}
                      <span className="opacity-60 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Mail
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 opacity-55"
                      />
                      <input
                        type="email"
                        placeholder="you@example.com (for email feedback)"
                        value={customRequestForm.email}
                        onChange={(e) =>
                          setCustomRequestForm({
                            ...customRequestForm,
                            email: e.target.value,
                          })
                        }
                        style={{
                          backgroundColor: "var(--brand-secondary)",
                          borderColor:
                            "color-mix(in srgb, var(--brand-primary) 22%, transparent)",
                        }}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-current/20"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Submit & Cancel Buttons */}
                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={isSubmittingRequest}
                    onClick={() => setIsCustomRequestOpen(false)}
                    style={{ backgroundColor: "var(--brand-secondary)" }}
                    className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRequest || isCompressingReqImg}
                    style={{
                      backgroundColor: "var(--brand-primary)",
                      color: "var(--brand-surface)",
                    }}
                    className="btn-glossy px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingRequest ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        <span>Submit Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
