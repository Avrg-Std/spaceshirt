'use client'

import { useEffect, useState } from 'react'
import { AdminCard, AdminPageHeader } from '../components/AdminUI'
import type { Product } from '@/lib/airtable'

export default function AdminHomepagePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [featuredIds, setFeaturedIds] = useState<string[]>([])
  const [newestIds, setNewestIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadHomepageData() {
      try {
        const response = await fetch('/api/admin/homepage')
        if (!response.ok) throw new Error('Failed to load homepage settings')
        const data = (await response.json()) as { products: Product[] }
        setProducts(data.products)

        const featured = data.products
          .filter((product) => product.featured)
          .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999))
          .map((product) => product.id)
          .slice(0, 4)

        const newest = data.products
          .filter((product) => product.showOnNewest)
          .sort((a, b) => (a.newestOrder ?? 999) - (b.newestOrder ?? 999))
          .map((product) => product.id)
          .slice(0, 3)

        setFeaturedIds(featured)
        setNewestIds(newest)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load homepage settings')
      } finally {
        setLoading(false)
      }
    }

    loadHomepageData()
  }, [])

  function toggleFeatured(id: string) {
    setFeaturedIds((current) => {
      if (current.includes(id)) {
        return current.filter((entry) => entry !== id)
      }
      if (current.length >= 4) return current
      return [...current, id]
    })
  }

  function toggleNewest(id: string) {
    setNewestIds((current) => {
      if (current.includes(id)) {
        return current.filter((entry) => entry !== id)
      }
      if (current.length >= 3) return current
      return [...current, id]
    })
  }

  function moveItem(ids: string[], id: string, direction: -1 | 1): string[] {
    const index = ids.indexOf(id)
    if (index === -1) return ids
    const target = index + direction
    if (target < 0 || target >= ids.length) return ids
    const next = [...ids]
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featuredIds, newestIds }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to save homepage settings')
      }

      setMessage('Homepage curation saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save homepage settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-neutral-600">Loading homepage settings...</p>

  return (
    <div>
      <AdminPageHeader
        title="HOMEPAGE"
        description="Pick up to 4 featured products and 3 newest products for the storefront homepage."
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-black text-white font-bebas tracking-wide rounded-xl hover:bg-[var(--color-accent)] hover:text-black transition-colors disabled:opacity-50"
          >
            {saving ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        }
      />

      {message ? <p className="text-green-700 mb-4">{message}</p> : null}
      {error ? <p className="text-red-600 mb-4">{error}</p> : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AdminCard className="p-6">
          <h2 className="font-bebas text-2xl mb-2">FEATURED (MAX 4)</h2>
          <p className="text-sm text-neutral-600 mb-4">Shown in the hero product grid on the homepage.</p>
          <div className="space-y-3">
            {products.map((product) => {
              const selected = featuredIds.includes(product.id)
              const position = featuredIds.indexOf(product.id)

              return (
                <div
                  key={`featured-${product.id}`}
                  className="flex items-center justify-between gap-3 border border-black/10 rounded-xl px-4 py-3"
                >
                  <label className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleFeatured(product.id)}
                    />
                    <span>{product.title}</span>
                  </label>
                  {selected ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFeaturedIds((current) => moveItem(current, product.id, -1))}
                        className="px-2 py-1 text-sm bg-neutral-100 rounded-lg"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeaturedIds((current) => moveItem(current, product.id, 1))}
                        className="px-2 py-1 text-sm bg-neutral-100 rounded-lg"
                      >
                        Down
                      </button>
                      <span className="text-sm text-neutral-500">#{position + 1}</span>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <h2 className="font-bebas text-2xl mb-2">NEWEST (MAX 3)</h2>
          <p className="text-sm text-neutral-600 mb-4">Shown in the newest products section on the homepage.</p>
          <div className="space-y-3">
            {products.map((product) => {
              const selected = newestIds.includes(product.id)
              const position = newestIds.indexOf(product.id)

              return (
                <div
                  key={`newest-${product.id}`}
                  className="flex items-center justify-between gap-3 border border-black/10 rounded-xl px-4 py-3"
                >
                  <label className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleNewest(product.id)}
                    />
                    <span>{product.title}</span>
                  </label>
                  {selected ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNewestIds((current) => moveItem(current, product.id, -1))}
                        className="px-2 py-1 text-sm bg-neutral-100 rounded-lg"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewestIds((current) => moveItem(current, product.id, 1))}
                        className="px-2 py-1 text-sm bg-neutral-100 rounded-lg"
                      >
                        Down
                      </button>
                      <span className="text-sm text-neutral-500">#{position + 1}</span>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
