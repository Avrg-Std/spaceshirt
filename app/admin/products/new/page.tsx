'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminCard, AdminInput, AdminPageHeader, AdminTextarea } from '../../components/AdminUI'
import AdminImageUpload from '../../components/AdminImageUpload'
import AdminSizeStock from '../../components/AdminSizeStock'
import type { SizeStockMap } from '@/lib/product-sizes'

export default function NewProductPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sizeStock, setSizeStock] = useState<SizeStockMap>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          description: formData.get('description'),
          category: formData.get('category'),
          price: Number(formData.get('price')),
          rating: formData.get('rating') ? Number(formData.get('rating')) : null,
          image: formData.get('image'),
          sizeStock,
        }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to create product')
      }

      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <AdminPageHeader title="NEW PRODUCT" description="Create a product in Airtable." />

      <AdminCard className="p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <AdminInput label="Title" name="title" required />
          <AdminTextarea label="Description" name="description" />
          <AdminInput label="Category" name="category" defaultValue="Uncategorized" />
          <AdminInput label="Price" name="price" type="number" step="0.01" min="0" required />
          <AdminSizeStock value={sizeStock} onChange={setSizeStock} />
          <AdminInput label="Rating" name="rating" type="number" step="0.1" min="0" max="5" />
          <AdminImageUpload />

          {error ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-black text-white font-bebas text-xl tracking-wider rounded-xl hover:bg-[var(--color-accent)] hover:text-black transition-colors disabled:opacity-50"
          >
            {loading ? 'CREATING...' : 'CREATE PRODUCT'}
          </button>
        </form>
      </AdminCard>
    </div>
  )
}
