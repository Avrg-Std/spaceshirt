'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Link from 'next/link'
import ProductCard from './ProductCard'
import type { Product } from '@/lib/airtable'

gsap.registerPlugin(ScrollTrigger)

const fallbackProducts = [
  { id: 'fallback-1', image: '/images/image 4.jpeg', title: 'TANK TOP', price: 45, highlight: false },
  { id: 'fallback-2', image: '/images/image 17.jpeg', title: 'T-SHIRT', price: 55, highlight: true },
  { id: 'fallback-3', image: '/images/image 6.jpeg', title: 'SWEATER', price: 85, highlight: false },
  { id: 'fallback-4', image: '/images/image 8.jpeg', title: 'TOTE BAG', price: 35, highlight: false },
]

export default function HeroProducts() {
  const containerRef = useRef(null)
  const [products, setProducts] = useState(fallbackProducts)

  useEffect(() => {
    async function loadFeaturedProducts() {
      try {
        const response = await fetch('/api/products/featured')
        if (!response.ok) return
        const data = (await response.json()) as { products: Product[] }
        if (!data.products.length) return

        setProducts(
          data.products.map((product, index) => ({
            id: product.id,
            image: product.image,
            title: product.title,
            price: product.price,
            highlight: index === 1,
          }))
        )
      } catch {
        // Keep fallback products when API is unavailable.
      }
    }

    loadFeaturedProducts()
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.product-card-anim', {
        y: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        },
      })
    }, containerRef)
    return () => ctx.revert()
  }, [products])

  return (
    <div ref={containerRef} className="relative z-20 pb-12 w-full max-w-7xl mx-auto px-6 md:px-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-end">
        {products.map((product) => (
          <div key={product.id} className={`product-card-anim ${product.highlight ? 'mb-12 md:mb-20' : ''}`}>
             <div className={`${product.highlight ? 'scale-110 origin-bottom bg-white/80 glass rounded-[var(--radius-3xl)] p-2 shadow-2xl relative' : ''}`}>
                {product.highlight && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--color-accent)] w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-30">
                        <span className="font-bebas text-lg">NEW</span>
                    </div>
                )}
                {product.highlight && (
                   <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full shadow-lg z-30 whitespace-nowrap">
                       <span className="font-bebas text-xl">{product.title}</span>
                   </div>
                )}
                <ProductCard 
                  id={product.id}
                  image={product.image} 
                  title={product.title} 
                  price={`$${product.price.toFixed(2)}`}
                  className={!product.highlight ? 'opacity-90 hover:opacity-100' : ''}
                />
             </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center mt-20 pointer-events-auto">
         <Link href="/products">
            <button className="px-8 py-3 bg-transparent border border-[var(--color-foreground)] rounded-full text-xs font-bold tracking-widest hover:bg-[var(--color-foreground)] hover:text-white transition-colors uppercase cursor-pointer">
               See All Products
            </button>
         </Link>
      </div>
    </div>
  )
}
