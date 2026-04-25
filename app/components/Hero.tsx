'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, ArrowLeft } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export default function Hero() {
  const containerRef = useRef(null)
  const moonRef = useRef(null)
  const textRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero load animation
      const tl = gsap.timeline()

      tl.from('.hero-text-item', {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: 'power3.out',
      })
      .from(moonRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 1.5,
        ease: 'power3.out',
      }, '-=0.8')
      .from('.hero-right-col', {
        x: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      }, '-=1')

      // Moon Parallax
      gsap.to(moonRef.current, {
        y: 200,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={containerRef} className="relative w-full min-h-[120vh] pt-32 px-6 md:px-12 bg-[var(--color-bg)] overflow-hidden">
      
      {/* Top Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10 w-full max-w-7xl mx-auto">
        
        {/* Left Column: Title & CTA */}
        <div className="md:col-span-5 flex flex-col gap-6" ref={textRef}>
          <div className="flex items-center gap-4 hero-text-item">
            <span className="text-xs font-medium tracking-widest text-[var(--color-muted)]">EST 2023</span>
            <div className="h-[1px] w-12 bg-[var(--color-muted)]"></div>
          </div>
          
          <h1 className="hero-text-item text-[clamp(4rem,12vw,9rem)] leading-[0.85] font-bebas text-[var(--color-foreground)]">
            CIAO-LU
          </h1>
          
          <p className="hero-text-item text-sm md:text-base text-[var(--color-muted)] max-w-xs leading-relaxed">
            COMFORTABLE PRODUCTS CREATED BY HIGHLY SKILLED CRAFTSMANSHIP IN EACH OF OUR PRODUCTS
          </p>
          
          <div className="hero-text-item flex gap-4 mt-4">
            <button className="px-8 py-3 bg-[var(--color-accent)] rounded-full text-black font-bold text-sm tracking-wider hover:scale-105 transition-transform">
              BEST SELLERS
            </button>
            <button className="px-8 py-3 border border-[var(--color-foreground)] rounded-full text-[var(--color-foreground)] font-bold text-sm tracking-wider hover:bg-[var(--color-foreground)] hover:text-white transition-colors">
              SALE
            </button>
          </div>
        </div>

        {/* Middle Column: Description */}
        <div className="md:col-span-4 pt-4 md:pt-12 hero-text-item">
          <h2 className="text-2xl md:text-3xl font-bebas tracking-wide text-[var(--color-foreground)] opacity-90 mb-8 max-w-xs">
            CHECK IN <br />
            OUR NEW <br />
            COLLECTION <br />
            FOR SPORT & <br />
            ACTIVITY
          </h2>
          
          <div className="flex gap-2 items-center">
            <div className="flex text-[var(--color-accent)]">
              {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
            </div>
            <div className="text-xs font-bold leading-tight">
              5-STAR <br /> CUSTOMER REVIEW
            </div>
          </div>
          <div className="text-4xl font-bebas mt-2">500+</div>
        </div>

        {/* Right Column: Image */}
        <div className="md:col-span-3 hero-right-col relative">
           <div className="relative w-full aspect-[4/5] rounded-[var(--radius-2xl)] overflow-hidden shadow-[var(--shadow-card)] rotate-3 hover:rotate-0 transition-transform duration-500">
              <Image 
                src="/images/image 17.jpeg" 
                alt="New Collection" 
                fill 
                className="object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">
                MOON
              </div>
           </div>
        </div>
      </div>

      {/* Centered Moon */}
      <div className="relative w-full flex justify-center mt-[-5%] md:mt-[-10%] z-0 pointer-events-none">
         <div ref={moonRef} className="relative w-[120vw] h-[120vw] md:w-[60vw] md:h-[60vw]">
             <Image 
               src="/images/moon.png" 
               alt="Moon" 
               fill 
               className="object-contain drop-shadow-[var(--shadow-soft)] opacity-90 grayscale"
               priority
             />
         </div>
         
         {/* Floating Arrows Text - Absolute relative to container */}
         <div className="absolute top-1/2 left-[10%] -translate-y-1/2 hidden md:flex items-center gap-4 opacity-60">
            <ArrowLeft /> <span className="font-bebas text-2xl">MOON</span>
         </div>
         <div className="absolute top-1/2 right-[10%] -translate-y-1/2 hidden md:flex items-center gap-4 opacity-60">
            <span className="font-bebas text-2xl">DESIGN</span> <ArrowRight />
         </div>
      </div>

    </section>
  )
}
