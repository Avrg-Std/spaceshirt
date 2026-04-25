'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function BrandStory() {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Image Parallax
      gsap.to(imageRef.current, {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        }
      })

      // Text Reveal
      gsap.from('.story-text', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 60%',
        }
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={containerRef} className="py-24 md:py-32 px-6 md:px-12 bg-white text-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Column - Large Editorial Image */}
        <div className="relative w-full aspect-[4/5] rounded-[var(--radius-3xl)] overflow-hidden shadow-2xl">
          <div ref={imageRef} className="absolute inset-0 -top-[20%] h-[140%] w-full">
            <Image 
              src="/images/image 15.jpeg" 
              alt="Brand Lifestyle" 
              fill 
              className="object-cover"
            />
          </div>
        </div>

        {/* Right Column - Brand Message */}
        <div className="flex flex-col justify-center h-full max-w-xl">
           <h4 className="story-text text-lg font-bebas tracking-[0.2em] text-[#8E8E8E] mb-6">THE CIAO-LU LIFESTYLE</h4>
           
           <h2 className="story-text text-5xl md:text-7xl font-bebas leading-[0.9] text-black mb-8">
             ENGINEERED FOR THE URBAN FRONTIER.
           </h2>
           
           <div className="story-text space-y-6 text-gray-600 font-inter text-lg font-light leading-relaxed">
             <p>
               Ciao-lu isn't just clothing; it's a movement bridging the gap between relentless urban momentum and cutting-edge leisure. We believe what you wear should adapt to the speed of your life, not slow it down.
             </p>
             <p>
               Every silhouette is meticulously crafted to evoke confidence while delivering uncompromising comfort. From boardroom transitions to midnight escapes, our premium fabrics move seamlessly with you—creating an identity that belongs entirely to the wearer.
             </p>
           </div>
           
           <div className="story-text mt-12">
             <button className="px-10 py-4 bg-black text-white font-bebas text-xl tracking-widest rounded-full hover:bg-[var(--color-accent)] hover:text-black hover:-translate-y-1 transition-all shadow-lg">
               DISCOVER OUR ORIGINS
             </button>
           </div>
        </div>

      </div>
    </section>
  )
}
