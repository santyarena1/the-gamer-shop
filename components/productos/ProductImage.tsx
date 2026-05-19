"use client"

import { useState } from "react"
import type { StockProduct } from "@/lib/acustock-feed"
import { getProductSku, resolveProductImageUrl } from "@/lib/product-catalog"

export default function ProductImage({
  product,
  className = "",
  size = "card",
}: {
  product: StockProduct
  className?: string
  size?: "card" | "modal"
}) {
  const [failed, setFailed] = useState(false)
  const src = resolveProductImageUrl(product)
  const sku = getProductSku(product)
  const height = size === "modal" ? "h-56 sm:h-72" : "h-40"

  if (!src || failed) {
    return (
      <div
        className={`${height} ${className} flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border-b border-white/5`}
      >
        <span className="text-4xl opacity-40 mb-2">📦</span>
        {sku && (
          <span className="text-[10px] font-mono text-white/30 px-2 truncate max-w-full">
            {sku}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`${height} ${className} relative bg-[#0a0a0a] overflow-hidden`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
