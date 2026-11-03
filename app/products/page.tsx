'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { normalizeCategory, PRODUCT_COLLECTIONS } from '@/lib/product-sizes'
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

export default function ProductsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[var(--background)] pt-32 pb-24 text-gray-400 px-6">Loading products...</main>}>
      <ProductsCatalog />
    </Suspense>
  )
}

function ProductsCatalog() {
  const containerRef = useRef(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const categories = [
    'All',
    ...Array.from(new Set(products.map((p) => normalizeCategory(p.category)))).sort(),
  ]
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeCollection, setActiveCollection] = useState('All')

  useEffect(() => {
    const requestedCategory = searchParams.get('category')?.trim()
    if (!requestedCategory) {
      setActiveCategory('All')
    } else {
      const canonical = normalizeCategory(requestedCategory)
      const available = Array.from(new Set(products.map((p) => normalizeCategory(p.category))))
      const match = available.find((cat) => cat.toLowerCase() === canonical.toLowerCase())
      // Prefer catalog casing; keep URL value while products are still loading
      setActiveCategory(match ?? (products.length === 0 ? canonical : 'All'))
    }

    const requestedCollection = searchParams.get('collection')?.trim().toLowerCase()
    if (requestedCollection === 'winter') setActiveCollection('Winter')
    else if (requestedCollection === 'summer') setActiveCollection('Summer')
    else setActiveCollection('All')
  }, [searchParams, products])

  function updateFilters(next: { category?: string; collection?: string }) {
    const category = next.category ?? activeCategory
    const collection = next.collection ?? activeCollection
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
      normalizeCategory(product.category) === activeCategory
    const collectionMatch =
      activeCollection === 'All' || product.collection === activeCollection
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
      // Intro Animation
      gsap.from('.products-header', {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      })
      
      gsap.from('.product-card-anim', {
        y: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.2
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  // Animate grid specifically when filters change
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.product-card-anim', 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
      )
    }, containerRef)
    return () => ctx.revert()
  }, [activeCategory, activeCollection])

  return (
    <main className="min-h-screen bg-[var(--background)] pt-32 pb-24" ref={containerRef}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Header Section */}
        <div className="mb-16 products-header flex flex-col md:flex-row justify-between items-end gap-6">
           <div>
              <Link href="/" className="text-gray-400 hover:text-[var(--color-foreground)] transition-colors text-sm uppercase tracking-wider mb-4 inline-flex items-center gap-2">
                 <span>←</span> Back to Home
              </Link>
              <h1 className="text-5xl md:text-7xl font-bebas tracking-wider text-[var(--color-foreground)]">
                {pageTitle}
              </h1>
           </div>
           
           <div className="flex flex-col items-end gap-3">
              <div className="flex gap-4">
              <div className="flex bg-white/5 border border-white/10 p-1 rounded-full overflow-x-auto no-scrollbar">
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => updateFilters({ category: cat })}
                    className={`px-5 py-2 rounded-full text-sm font-bebas tracking-wider transition-colors whitespace-nowrap ${
                      activeCategory === cat 
                        ? 'bg-[var(--color-foreground)] text-[var(--background)]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button className="px-6 py-2 rounded-full border border-gray-700 text-sm hover:bg-white hover:text-black transition-colors">
                 Sort
              </button>
              </div>
              <div className="flex bg-white/5 border border-white/10 p-1 rounded-full">
                {['All', ...PRODUCT_COLLECTIONS].map((collection) => (
                  <button
                    key={collection}
                    onClick={() => updateFilters({ collection })}
                    className={`px-5 py-2 rounded-full text-sm font-bebas tracking-wider transition-colors whitespace-nowrap ${
                      activeCollection === collection
                        ? 'bg-[var(--color-accent)] text-black'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {collection === 'All' ? 'ALL SEASONS' : collection.toUpperCase()}
                  </button>
                ))}
              </div>
           </div>
        </div>

        {/* Products Grid */}
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
