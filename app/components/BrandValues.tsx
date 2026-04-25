'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Droplets, Leaf, Activity, ShieldCheck } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const values = [
  {
    icon: <ShieldCheck size={40} className="mb-6 text-[var(--color-accent)]" />,
    title: 'UNCOMPROMISING QUALITY',
    description: 'Every garment is subjected to rigorous stress testing. We source only the finest, most durable threads to ensure your pieces survive seasons, not just cycles.'
  },
  {
    icon: <Activity size={40} className="mb-6 text-[var(--color-accent)]" />,
    title: 'COMFORT TECHNOLOGY',
    description: 'Breathable, 4-way stretch fabrics engineered with thermal regulation. We build apparel that feels like a second skin while maintaining an impeccable structural silhouette.'
  },
  {
    icon: <Leaf size={40} className="mb-6 text-[var(--color-accent)]" />,
    title: 'CONSCIOUS CREATION',
    description: 'Luxury shouldn\'t cost the earth. Over 80% of our synthetic weaves are spun from recycled ocean plastics, ensuring a sustainable future without sacrificing performance.'
  },
  {
    icon: <Droplets size={40} className="mb-6 text-[var(--color-accent)]" />,
    title: 'WEATHER ADAPTIVE',
    description: 'Hydrophobic coatings molecularly bonded to the fiber surface. Water beads off instantly, ensuring you remain pristine against unpredictable urban elements.'
  }
]

export default function BrandValues() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.value-card', {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 75%',
        }
      })
      
      gsap.from('.values-header', {
        opacity: 0,
        y: -30,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%'
        }
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={containerRef} className="py-24 md:py-32 px-6 md:px-12 bg-[#111111] border-t border-white/5 relative z-10">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-20 values-header">
           <h4 className="text-[var(--color-accent)] font-bebas tracking-[0.2em] text-lg mb-4">WHY CHOOSE CIAO-LU</h4>
           <h2 className="text-4xl md:text-6xl font-bebas tracking-wide text-white">RED DEFINING PREMIUM ESSENTIALS</h2>
           <div className="w-24 h-1 bg-[var(--color-accent)] mx-auto mt-8 opacity-50"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {values.map((item, index) => (
            <div key={index} className="value-card flex flex-col items-center lg:items-start text-center lg:text-left bg-white/5 p-8 rounded-[var(--radius-3xl)] border border-white/10 glass hover:bg-white/10 transition-colors duration-500">
               {item.icon}
               <h3 className="text-2xl font-bebas tracking-widest text-white mb-4">{item.title}</h3>
               <p className="text-gray-400 font-inter font-light leading-relaxed text-sm">
                 {item.description}
               </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
