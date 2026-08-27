'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminCard, AdminInput, AdminPageHeader, AdminTextarea } from '../../components/AdminUI'
import AdminImageUpload from '../../components/AdminImageUpload'
import AdminSizeStock from '../../components/AdminSizeStock'
import type { Product } from '@/lib/airtable'
import type { SizeStockMap } from '@/lib/product-sizes'

export default function EditProductPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [sizeStock, setSizeStock] = useState<SizeStockMap>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await fetch(`/api/admin/products/${params.id}`)
        if (!response.ok) throw new Error('Product not found')
        const data = (await response.json()) as { product: Product }
        setProduct(data.product)
        setSizeStock(data.product.sizeStock ?? {})
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [params.id])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!product) return

    setSaving(true)
    setError('')
    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
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
        throw new Error(data.error ?? 'Failed to update product')
      }

      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-neutral-600">Loading product...</p>
  if (!product) return <p className="text-red-600">{error || 'Product not found'}</p>

  return (
    <div>
      <AdminPageHeader title="EDIT PRODUCT" description={product.title} />

      <AdminCard className="p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <AdminInput label="Title" name="title" defaultValue={product.title} required />
          <AdminTextarea
            label="Description"
            name="description"
            defaultValue={product.description}
          />
          <AdminInput label="Category" name="category" defaultValue={product.category} />
          <AdminInput
            label="Price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product.price}
            required
          />
          <AdminSizeStock value={sizeStock} onChange={setSizeStock} />
          <AdminInput
            label="Rating"
            name="rating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            defaultValue={product.rating ?? ''}
          />
          <AdminImageUpload defaultValue={product.image} />

          {error ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-black text-white font-bebas text-xl tracking-wider rounded-xl hover:bg-[var(--color-accent)] hover:text-black transition-colors disabled:opacity-50"
          >
            {saving ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </form>
      </AdminCard>
    </div>
  )
}
