'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import {
  canonicalizeCategory,
  normalizeProductTypeGender,
} from '@/lib/product-sizes'
import gsap from 'gsap'
import ProductCard from '../components/ProductCard'
import Navbar from '../components/Navbar'

type Product = {
  id: string
  title: string
  price: number
  category: string
  collection?: string | null
  image: string
  stock: number | null
  sizes?: string[]
  sizeStock?: Record<string, number>
}

type ProductTypeOption = {
  id: string
  name: string
  gender: string
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[var(--background)] pt-32 pb-24 text-gray-400 px-6">Loading products...</main>}>
      <ProductsCatalog />
    </Suspense>
  )
}

function TypeFilter({
  value,
  options,
  onChange,
}: {
  value: string
  options: ProductTypeOption[]
  onChange: (next: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const label =
    value === 'All'
      ? 'All types'
      : options.find((type) => type.name.toLowerCase() === value.toLowerCase())?.name ?? value

  useEffect(() => {
    if (!open) return

    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const items = [{ id: 'all', name: 'All types', value: 'All' }, ...options.map((type) => ({
    id: type.id,
    name: type.name,
    value: type.name,
  }))]

  return (
    <div className={`relative ${open ? 'z-50' : ''}`} ref={rootRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="group inline-flex items-center gap-3 rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-bebas tracking-[0.14em] text-[var(--color-foreground)] shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-all hover:border-black/25 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
      >
        <span>{label}</span>
        <ChevronDown
          className={`h-4 w-4 text-[var(--color-muted)] transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          strokeWidth={1.75}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 min-w-[220px] overflow-hidden rounded-2xl border border-black/8 bg-white/95 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.12)] backdrop-blur-xl"
        >
          {items.map((item) => {
            const selected =
              item.value === 'All'
                ? value === 'All'
                : value.toLowerCase() === item.value.toLowerCase()

            return (
              <li key={item.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(item.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-bebas tracking-[0.12em] transition-colors ${
                    selected
                      ? 'bg-[var(--color-foreground)] text-[var(--background)]'
                      : 'text-[var(--color-muted)] hover:bg-black/[0.04] hover:text-[var(--color-foreground)]'
                  }`}
                >
                  <span>{item.name}</span>
                  {selected ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

function ProductsCatalog() {
  const containerRef = useRef(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [productTypes, setProductTypes] = useState<ProductTypeOption[]>([])

  const categories = [
    'All',
    ...Array.from(new Set(products.map((p) => canonicalizeCategory(p.category)))).sort((a, b) =>
      a.localeCompare(b)
    ),
  ]
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeCollection, setActiveCollection] = useState('All')

  const genderFilter = normalizeProductTypeGender(activeCategory)

  useEffect(() => {
    const requestedCategory = searchParams.get('category')?.trim()
    if (!requestedCategory) {
      setActiveCategory('All')
    } else {
      const canonical = canonicalizeCategory(requestedCategory)
      const available = Array.from(
        new Set(products.map((p) => canonicalizeCategory(p.category)))
      )
      const match = available.find(
        (cat) => cat.toLowerCase() === canonical.toLowerCase()
      )
      // Prefer catalog casing; keep URL value while products are still loading
      setActiveCategory(match ?? (products.length === 0 ? canonical : 'All'))
    }

    const requestedCollection = searchParams.get('collection')?.trim()
    if (!requestedCollection) {
      setActiveCollection('All')
    } else {
      setActiveCollection(requestedCollection)
    }
  }, [searchParams, products])

  useEffect(() => {
    if (!genderFilter) {
      setProductTypes([])
      return
    }

    let isMounted = true

    async function loadTypes() {
      try {
        const response = await fetch(
          `/api/product-types?gender=${encodeURIComponent(genderFilter!)}`,
          { cache: 'no-store' }
        )
        const data = (await response.json()) as {
          types?: ProductTypeOption[]
          error?: string
        }
        if (!response.ok) throw new Error(data.error || 'Failed to load types')
        if (isMounted) setProductTypes(data.types || [])
      } catch {
        if (isMounted) setProductTypes([])
      }
    }

    loadTypes()
    return () => {
      isMounted = false
    }
  }, [genderFilter])

  // Clear type filter when leaving MEN/WOMEN or when type is invalid for gender
  useEffect(() => {
    if (activeCollection === 'All') return

    if (!genderFilter) {
      setActiveCollection('All')
      const params = new URLSearchParams(searchParams.toString())
      params.delete('collection')
      const query = params.toString()
      router.replace(query ? `/products?${query}` : '/products', { scroll: false })
      return
    }

    if (productTypes.length === 0) return

    const stillValid = productTypes.some(
      (type) => type.name.toLowerCase() === activeCollection.toLowerCase()
    )
    if (!stillValid) {
      setActiveCollection('All')
      const params = new URLSearchParams(searchParams.toString())
      params.delete('collection')
      const query = params.toString()
      router.replace(query ? `/products?${query}` : '/products', { scroll: false })
    }
  }, [genderFilter, productTypes, activeCollection, router, searchParams])

  function updateFilters(next: { category?: string; collection?: string }) {
    const category =
      next.category !== undefined
        ? canonicalizeCategory(next.category)
        : activeCategory
    let collection = next.collection ?? activeCollection

    const nextGender = normalizeProductTypeGender(category)
    if (!nextGender) {
      collection = 'All'
    } else if (
      next.category !== undefined &&
      normalizeProductTypeGender(activeCategory) !== nextGender
    ) {
      // Switching MEN ↔ WOMEN clears incompatible type
      collection = 'All'
    }

    setActiveCategory(category)
    setActiveCollection(collection)

    const params = new URLSearchParams(searchParams.toString())
    if (category === 'All') params.delete('category')
    else params.set('category', category)
    if (collection === 'All') params.delete('collection')
    else params.set('collection', collection)

    const query = params.toString()
    router.replace(query ? `/products?${query}` : '/products', { scroll: false })
  }

  const filteredProducts = products.filter((product) => {
    const categoryMatch =
      activeCategory === 'All' ||
      canonicalizeCategory(product.category).toLowerCase() ===
        activeCategory.toLowerCase()
    const collectionMatch =
      activeCollection === 'All' ||
      (product.collection ?? '').toLowerCase() === activeCollection.toLowerCase()
    return categoryMatch && collectionMatch
  })

  const pageTitle =
    activeCategory !== 'All'
      ? activeCategory.toUpperCase()
      : 'ALL PRODUCTS'

  const emptyMessage = (() => {
    if (activeCategory !== 'All' || activeCollection !== 'All') {
      return 'Nothing here right now. Try another filter.'
    }
    return 'No products available right now.'
  })()

  useEffect(() => {
    let isMounted = true

    const loadProducts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch('/api/products', { cache: 'no-store' })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load products')
        }

        if (isMounted) {
          setProducts(data.products || [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load products')
          setProducts([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.products-header', {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      })

      gsap.from('.product-card-anim', {
        y: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.2,
        clearProps: 'transform,opacity',
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.product-card-anim',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: 'power2.out',
          clearProps: 'all',
        }
      )
    }, containerRef)
    return () => ctx.revert()
  }, [activeCategory, activeCollection])

  return (
    <main className="min-h-screen bg-[var(--background)] pt-32 pb-24" ref={containerRef}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="relative z-40 mb-16 products-header flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <Link
              href="/"
              className="text-gray-400 hover:text-[var(--color-foreground)] transition-colors text-sm uppercase tracking-wider mb-4 inline-flex items-center gap-2"
            >
              <span>←</span> Back to Home
            </Link>
            <h1 className="text-5xl md:text-7xl font-bebas tracking-wider text-[var(--color-foreground)]">
              {pageTitle}
            </h1>
          </div>

          <div className="relative z-50 flex flex-col items-end gap-3">
            <div className="flex bg-white border border-black/8 p-1 rounded-full overflow-x-auto no-scrollbar shadow-[0_1px_0_rgba(0,0,0,0.03)]">
              {categories.map((cat) => {
                const selected =
                  activeCategory.toLowerCase() === cat.toLowerCase()
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateFilters({ category: cat })}
                    className={`px-5 py-2 rounded-full text-sm font-bebas tracking-wider transition-colors whitespace-nowrap ${
                      selected
                        ? 'bg-[var(--color-foreground)] text-[var(--background)]'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-black/[0.04]'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>

            {genderFilter ? (
              <TypeFilter
                value={activeCollection}
                options={productTypes}
                onChange={(collection) => updateFilters({ collection })}
              />
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="text-red-300 border border-red-500/30 bg-red-500/10 rounded-2xl px-6 py-5">
            Failed to load products from Airtable: {error}
          </div>
        ) : isLoading ? (
          <div className="text-gray-400">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-gray-400 border border-white/10 rounded-2xl px-6 py-10 text-center">
            {emptyMessage}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filteredProducts.map((p) => (
              <div key={p.id} className="product-card-anim">
                <ProductCard
                  id={p.id}
                  image={p.image}
                  title={p.title}
                  price={`$${p.price.toFixed(2)}`}
                  stock={p.stock}
                  sizes={p.sizes}
                  sizeStock={p.sizeStock}
                  className="opacity-90 hover:opacity-100"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
