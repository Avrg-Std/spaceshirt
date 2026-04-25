'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Link from 'next/link'
import ProductCard from './ProductCard'

export default function HeroProducts() {
  const containerRef = useRef(null)

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
  }, [])

  const products = [
    { id: 1, image: '/images/image 4.jpeg', title: 'TANK TOP', price: '$45.00' },
    { id: 2, image: '/images/image 17.jpeg', title: 'T-SHIRT', highlight: true, price: '$55.00' },
    { id: 3, image: '/images/image 6.jpeg', title: 'SWEATER', price: '$85.00' },
    { id: 4, image: '/images/image 8.jpeg', title: 'TOTE BAG', price: '$35.00' }
  ]

  return (
    <div ref={containerRef} className="relative z-20 pb-12 w-full max-w-7xl mx-auto px-6 md:px-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-end">
        {products.map((p, i) => (
          <div key={p.id} className={`product-card-anim ${p.highlight ? 'mb-12 md:mb-20' : ''}`}>
             <div className={`${p.highlight ? 'scale-110 origin-bottom bg-white/80 glass rounded-[var(--radius-3xl)] p-2 shadow-2xl relative' : ''}`}>
                {p.highlight && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--color-accent)] w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-30">
                        <span className="font-bebas text-lg">NEW</span>
                    </div>
                )}
                {p.highlight && (
                   <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full shadow-lg z-30 whitespace-nowrap">
                       <span className="font-bebas text-xl">{p.title}</span>
                   </div>
                )}
                <ProductCard 
                  image={p.image} 
                  title={p.title} 
                  price={p.price}
                  className={!p.highlight ? 'opacity-90 hover:opacity-100' : ''}
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
