'use client'

import { PRODUCT_SIZE_OPTIONS, type SizeStockMap } from '@/lib/product-sizes'

type AdminSizeStockProps = {
  value: SizeStockMap
  onChange: (next: SizeStockMap) => void
}

export default function AdminSizeStock({ value, onChange }: AdminSizeStockProps) {
  const total = PRODUCT_SIZE_OPTIONS.reduce(
    (sum, size) => sum + (value[size] ?? 0),
    0
  )

  function setQty(size: (typeof PRODUCT_SIZE_OPTIONS)[number], raw: string) {
    const qty = raw === '' ? 0 : Math.max(0, Math.floor(Number(raw)))
    const next: SizeStockMap = { ...value }

    if (!Number.isFinite(qty) || qty <= 0) {
      delete next[size]
    } else {
      next[size] = qty
    }

    onChange(next)
  }

  return (
    <div>
      <label className="block text-xs font-bold text-neutral-600 tracking-wider mb-2 uppercase">
        Size Stock
      </label>
      <p className="text-sm text-neutral-500 mb-4">
        Enter quantity per size. Total stock updates automatically. Set 0 to hide a size.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PRODUCT_SIZE_OPTIONS.map((size) => (
          <label
            key={size}
            className="rounded-xl border border-black/10 bg-neutral-50 px-4 py-3 flex flex-col gap-2"
          >
            <span className="font-bebas text-lg tracking-wide">{size}</span>
            <input
              type="number"
              min={0}
              step={1}
              value={value[size] ?? 0}
              onChange={(event) => setQty(size, event.target.value)}
              className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg focus:outline-none focus:border-black/30"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-black text-white px-4 py-3 flex items-center justify-between">
        <span className="font-bebas text-lg tracking-wide">TOTAL QTY IN STOCK</span>
        <span className="font-bebas text-2xl tracking-wide">{total} PCS</span>
      </div>
    </div>
  )
}
