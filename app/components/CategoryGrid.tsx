'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const categories = [
  { id: 'men', title: 'MEN', image: '/images/image 2.jpeg', span: 'md:col-span-8 md:row-span-2' },
  { id: 'women', title: 'WOMEN', image: '/images/image 6.jpeg', span: 'md:col-span-4 md:row-span-1' },
  { id: 'new-arrivals', title: 'NEW ARRIVALS', image: '/images/image 5.jpeg', span: 'md:col-span-4 md:row-span-1' },
  { id: 'accessories', title: 'ACCESSORIES', image: '/images/image 17.jpeg', span: 'md:col-span-4 md:row-span-1' },
  { id: 'best-sellers', title: 'BEST SELLERS', image: '/images/image 19.jpeg', span: 'md:col-span-8 md:row-span-1' },
]

export default function CategoryGrid() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.category-card', {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        }
      })
      
      // Header Animation
      gsap.from('.category-header', {
        x: -40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
        }
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={containerRef} className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
      <div className="mb-12 flex justify-between items-end category-header">
        <h2 className="text-4xl md:text-6xl font-bebas tracking-wide text-[var(--color-foreground)]">
          SHOP BY CATEGORY
        </h2>
        <Link href="/products" className="group flex items-center gap-2 text-sm font-bold tracking-wider hover:text-[var(--color-accent)] transition-colors">
          VIEW ALL <ArrowUpRight size={16} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[300px] md:auto-rows-[400px]">
        {categories.map((cat) => (
          <Link 
            href={`/products?category=${cat.title.replace(' ', '+')}`} 
            key={cat.id} 
            className={`category-card relative rounded-[var(--radius-3xl)] overflow-hidden group shadow-[var(--shadow-card)] block ${cat.span}`}
          >
            {/* Background Image */}
            <div className="absolute inset-0 bg-white/5">
              <Image 
                src={cat.image}
                alt={cat.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
            
            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 p-8 w-full flex justify-between items-end">
               <h3 className="text-white font-bebas text-4xl tracking-wider translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                 {cat.title}
               </h3>
               <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  <ArrowUpRight size={24} />
               </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
