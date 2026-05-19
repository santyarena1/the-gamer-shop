"use client"

import { useEffect } from "react"
import type { StockProduct } from "@/lib/acustock-feed"
import {
  formatProductPrice,
  getProductBrand,
  getProductCategory,
  getProductName,
  getProductSku,
  getProductStock,
  getField,
  getProductSalePrice,
  productDetailEntries,
  stockStatus,
} from "@/lib/product-catalog"
import { formatCurrency } from "@/lib/utils"
import ProductImage from "./ProductImage"

export default function ProductDetailModal({
  product,
  onClose,
}: {
  product: StockProduct
  onClose: () => void
}) {
  const name = getProductName(product)
  const sku = getProductSku(product)
  const stock = getProductStock(product)
  const status = stockStatus(stock)
  const salePrice = getProductSalePrice(product)
  const entries = productDetailEntries(product)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  async function copySku() {
    if (!sku) return
    try {
      await navigator.clipboard.writeText(sku)
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-hidden bg-[#141414] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <h2 id="product-modal-title" className="font-semibold text-sm pr-4 line-clamp-1">
            Detalle del producto
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <ProductImage product={product} size="modal" className="border-b border-white/5" />

          <div className="p-5 space-y-5">
            <div>
              <h3 className="text-lg font-semibold leading-snug">{name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {sku && (
                  <button
                    type="button"
                    onClick={copySku}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                    title="Copiar SKU"
                  >
                    {sku} 📋
                  </button>
                )}
                <span className={`text-xs px-2.5 py-1 rounded-full border ${status.className}`}>
                  {status.label} · {stock} u.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#0f0f0f] border border-white/10 p-4">
                <p className="text-[11px] text-white/40 mb-1">Precio venta</p>
                <p className="text-xl font-semibold text-green-400">{formatProductPrice(product)}</p>
              </div>
              {salePrice != null && (
                <div className="rounded-xl bg-[#0f0f0f] border border-white/10 p-4">
                  <p className="text-[11px] text-white/40 mb-1">Precio rebajado</p>
                  <p className="text-xl font-semibold text-amber-400">{formatCurrency(salePrice)}</p>
                </div>
              )}
              {getProductCategory(product) && (
                <div className="rounded-xl bg-[#0f0f0f] border border-white/10 p-4 col-span-2 sm:col-span-1">
                  <p className="text-[11px] text-white/40 mb-1">Categoría</p>
                  <p className="text-sm">{getProductCategory(product)}</p>
                </div>
              )}
              {getProductBrand(product) && (
                <div className="rounded-xl bg-[#0f0f0f] border border-white/10 p-4 col-span-2 sm:col-span-1">
                  <p className="text-[11px] text-white/40 mb-1">Marca</p>
                  <p className="text-sm">{getProductBrand(product)}</p>
                </div>
              )}
            </div>

            {getField(product, "descripcion") && (
              <div>
                <p className="text-xs font-medium text-white/50 mb-2">Descripción</p>
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto rounded-xl bg-[#0f0f0f] border border-white/10 p-4">
                  {getField(product, "descripcion")}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-white/50 mb-2">Todos los datos del feed</p>
              <dl className="rounded-xl border border-white/10 divide-y divide-white/5 overflow-hidden">
                {entries.map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[minmax(0,35%)_1fr] gap-3 px-4 py-2.5 text-xs bg-[#0f0f0f]/50">
                    <dt className="text-white/40 truncate" title={key}>
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd className="text-white/80 break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
