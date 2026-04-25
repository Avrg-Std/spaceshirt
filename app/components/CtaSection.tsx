'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function CtaSection() {
  const containerRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Zoom effect on text
      gsap.from('.cta-content', {
        scale: 0.8,
        opacity: 0,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          end: 'bottom bottom',
          scrub: 1,
        },
      })

      // Parallax moons
      gsap.to('.cta-moon-left', {
        y: -100,
        rotation: 10,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top bottom',
          scrub: 1,
        },
      })
      gsap.to('.cta-moon-right', {
        y: -100,
        rotation: -10,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top bottom',
          scrub: 1,
        },
      })

    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={containerRef} className="relative w-full py-40 px-6 md:px-12 flex flex-col items-center justify-center overflow-hidden">
        
        {/* Decorative Moons */}
        <div className="absolute left-[-10%] bottom-[-20%] w-[40vw] h-[40vw] opacity-80 cta-moon-left z-0 pointer-events-none">
             <Image src="/images/moon.png" alt="Moon Left" fill className="object-contain grayscale" />
        </div>
        <div className="absolute right-[-10%] bottom-[-20%] w-[40vw] h-[40vw] opacity-80 cta-moon-right z-0 pointer-events-none">
             <Image src="/images/moon.png" alt="Moon Right" fill className="object-contain grayscale" />
        </div>

        <div className="relative z-10 text-center cta-content">
             <div className="mb-4">
                 <span className="font-bebas text-2xl tracking-widest text-[var(--color-muted)]">SPACE SHIRT</span>
             </div>
             
             <h2 className="text-[clamp(3rem,8vw,6rem)] font-bebas leading-[0.9] mb-8 text-[var(--color-foreground)] max-w-4xl mx-auto">
                GET YOUR <br />
                FAVORITE WEAR <br />
                AND SHARE <br />
                WITH US
             </h2>

             <p className="text-sm md:text-base text-[var(--color-muted)] mb-12 max-w-md mx-auto tracking-wide">
                COMFORTABLE PRODUCTS CREATED BY HIGHLY SKILLED CRAFTSMANSHIP IN EACH OF OUR PRODUCTS
             </p>

             <button className="px-10 py-4 bg-[var(--color-accent)] rounded-full text-black font-bold text-sm tracking-widest hover:scale-105 transition-transform uppercase shadow-lg">
                Follow For More
             </button>
        </div>
    </section>
  )
}
