"use client"

import type { StockProduct } from "@/lib/acustock-feed"
import {
  formatProductPrice,
  getProductBrand,
  getProductCategory,
  getProductName,
  getProductSku,
  getProductStock,
  stockStatus,
} from "@/lib/product-catalog"
import ProductImage from "./ProductImage"

export default function ProductCard({
  product,
  onClick,
}: {
  product: StockProduct
  onClick: () => void
}) {
  const name = getProductName(product)
  const sku = getProductSku(product)
  const category = getProductCategory(product)
  const brand = getProductBrand(product)
  const stock = getProductStock(product)
  const status = stockStatus(stock)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left w-full bg-[#141414] border border-white/10 rounded-2xl overflow-hidden hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50"
    >
      <ProductImage product={product} />
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm leading-snug line-clamp-2 group-hover:text-green-400 transition-colors">
            {name}
          </h3>
          <span
            className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${status.className}`}
          >
            {status.label}
          </span>
        </div>
        <p className="text-lg font-semibold text-green-400">{formatProductPrice(product)}</p>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {sku && (
            <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/50 font-mono">
              {sku}
            </span>
          )}
          {category && (
            <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/40 truncate max-w-[140px]">
              {category}
            </span>
          )}
          {brand && (
            <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/40">{brand}</span>
          )}
        </div>
        <p className="text-[11px] text-white/30">Stock: {stock}</p>
      </div>
    </button>
  )
}
