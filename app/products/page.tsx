'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import ProductCard from '../components/ProductCard'
import Navbar from '../components/Navbar'

type Product = {
  id: string
  title: string
  price: number
  category: string
  image: string
  stock: number | null
}

export default function ProductsPage() {
  const containerRef = useRef(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category))).sort()]
  const [activeCategory, setActiveCategory] = useState('All')

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory)

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

  // Animate grid specifically when activeCategory changes
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.product-card-anim', 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
      )
    }, containerRef)
    return () => ctx.revert()
  }, [activeCategory])

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
                ALL PRODUCTS
              </h1>
           </div>
           
           <div className="flex gap-4">
              <div className="flex bg-white/5 border border-white/10 p-1 rounded-full overflow-x-auto no-scrollbar">
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
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
        </div>

        {/* Products Grid */}
        {error ? (
          <div className="text-red-300 border border-red-500/30 bg-red-500/10 rounded-2xl px-6 py-5">
            Failed to load products from Airtable: {error}
          </div>
        ) : isLoading ? (
          <div className="text-gray-400">Loading products...</div>
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
