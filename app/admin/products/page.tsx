'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AdminCard, AdminPageHeader } from '../components/AdminUI'
import type { Product } from '@/lib/airtable'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch('/api/admin/products')
        if (!response.ok) throw new Error('Failed to load products')
        const data = (await response.json()) as { products: Product[] }
        setProducts(data.products)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return products
    return products.filter(
      (product) =>
        product.title.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
    )
  }, [products, search])

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return

    const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      alert('Failed to delete product')
      return
    }

    setProducts((current) => current.filter((product) => product.id !== id))
  }

  return (
    <div>
      <AdminPageHeader
        title="PRODUCTS"
        description="Manage your Airtable product catalog."
        actions={
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-black text-white font-bebas tracking-wide rounded-xl hover:bg-[var(--color-accent)] hover:text-black transition-colors"
          >
            ADD PRODUCT
          </Link>
        }
      />

      <AdminCard className="p-4 mb-6">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products..."
          className="w-full px-4 py-3 bg-neutral-100 border border-black/10 rounded-xl focus:outline-none focus:border-black/30"
        />
      </AdminCard>

      {loading ? <p className="text-neutral-600">Loading products...</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-50 border-b border-black/10">
                <tr>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Product</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Category</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Price</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Stock</th>
                  <th className="px-6 py-4 text-xs uppercase tracking-wider text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-black/5">
                    <td className="px-6 py-4 font-medium">{product.title}</td>
                    <td className="px-6 py-4 text-neutral-600">{product.category}</td>
                    <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                    <td className="px-6 py-4">{product.stock ?? '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <Link href={`/admin/products/${product.id}`} className="text-sm font-semibold hover:underline">
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id, product.title)}
                          className="text-sm font-semibold text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      ) : null}
    </div>
  )
}
