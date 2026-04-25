'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ShoppingCart } from 'lucide-react'

export default function NewestProducts() {
  const containerRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.newest-card', {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 70%',
        },
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={containerRef} className="relative w-full py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <h2 className="text-4xl md:text-5xl font-bebas text-[var(--color-foreground)] mb-16 newest-card">
        OUR NEWEST <br /> PRODUCT
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Belt Bag - Spans 4 cols */}
        <div className="md:col-span-5 newest-card">
           <div className="relative w-full aspect-[4/3] rounded-[var(--radius-3xl)] overflow-hidden bg-gray-200 group">
               <Image src="/images/image 1.jpeg" alt="Belt Bag" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
               
               <button className="absolute top-6 left-6 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                  <ShoppingCart size={16} />
               </button>
               
               <div className="absolute bottom-6 right-6 bg-white px-6 py-3 rounded-full shadow-lg">
                  <span className="font-bebas text-lg tracking-wide uppercase">BELT BAG</span>
               </div>
           </div>
        </div>

        {/* Hoodie - Spans 3 cols */}
        <div className="md:col-span-4 newest-card mt-12 md:mt-0">
           <div className="relative w-full aspect-[3/4] rounded-[var(--radius-3xl)] overflow-hidden bg-gray-100 group">
               <Image src="/images/image 2.jpeg" alt="Hoodie" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
               
               <button className="absolute top-6 left-6 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                  <ShoppingCart size={16} />
               </button>

               <div className="absolute bottom-6 left-6 bg-white px-6 py-3 rounded-full shadow-lg">
                  <span className="font-bebas text-lg tracking-wide uppercase">HOODIE</span>
               </div>
           </div>
        </div>

        {/* Tote Bag - Spans 3 cols */}
        <div className="md:col-span-3 newest-card mt-24 md:mt-0">
           <div className="relative w-full aspect-[3/4] rounded-[var(--radius-3xl)] overflow-hidden bg-[#e8e4dc] group">
               <Image src="/images/image 8.jpeg" alt="Tote Bag" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
               
               <button className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                  <ShoppingCart size={16} />
               </button>

               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg whitespace-nowrap">
                  <span className="font-bebas text-lg tracking-wide uppercase">TOTE BAG</span>
               </div>
           </div>
        </div>

      </div>
    </section>
  )
}
