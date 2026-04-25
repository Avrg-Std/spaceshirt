'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import Navbar from '../components/Navbar'
import { Trash2, Plus, Minus, CreditCard } from 'lucide-react'

// Mock Data
const cartItems = [
  { id: 1, title: 'HOODIE', price: 95.00, quantity: 1, image: '/images/image 2.jpeg', size: 'L' },
  { id: 2, title: 'BELT BAG', price: 45.00, quantity: 2, image: '/images/image 1.jpeg', size: 'ONE SIZE' },
]

export default function CartPage() {
  const containerRef = useRef(null)

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = 15.00
  const total = subtotal + shipping

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Intro Animation
      gsap.from('.cart-header', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      })
      
      gsap.from('.cart-item-anim', {
        x: -50,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        delay: 0.2
      })

      gsap.from('.checkout-panel-anim', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.4
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <main className="min-h-screen bg-[var(--background)] pt-32 pb-24" ref={containerRef}>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-12 cart-header">
           <Link href="/products" className="text-gray-400 hover:text-[var(--color-foreground)] transition-colors text-sm uppercase tracking-wider mb-6 inline-flex items-center gap-2">
              <span>←</span> Continue Shopping
           </Link>
           <h1 className="text-5xl md:text-6xl font-bebas tracking-wider text-[var(--color-foreground)]">
             YOUR CART
           </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* Left Column - Cart Items */}
          <div className="flex-1">
             <div className="space-y-6">
                 {cartItems.map((item) => (
                    <div key={item.id} className="cart-item-anim flex gap-6 p-4 rounded-3xl bg-white/5 border border-white/10 glass shadow-lg">
                       {/* Item Image */}
                       <div className="relative w-28 h-36 md:w-36 md:h-48 rounded-2xl overflow-hidden bg-white/10 flex-shrink-0">
                          <Image 
                            src={item.image} 
                            alt={item.title} 
                            fill 
                            className="object-cover"
                          />
                       </div>

                       {/* Item Details */}
                       <div className="flex flex-col justify-between flex-grow py-2">
                          <div className="flex justify-between items-start">
                             <div>
                                <h3 className="font-bebas text-2xl tracking-wide">{item.title}</h3>
                                <p className="text-sm text-gray-400 mt-1">Size: {item.size}</p>
                             </div>
                             <p className="font-bebas text-2xl">${item.price.toFixed(2)}</p>
                          </div>

                          <div className="flex justify-between items-end">
                             {/* Quantity Control */}
                             <div className="flex items-center gap-4 bg-black/40 rounded-full px-4 py-2 border border-white/10">
                                <button className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                                   <Minus size={16} />
                                </button>
                                <span className="font-bebas text-lg w-4 text-center">{item.quantity}</span>
                                <button className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                                   <Plus size={16} />
                                </button>
                             </div>

                             <button className="text-gray-500 hover:text-red-400 transition-colors p-2 cursor-pointer">
                                <Trash2 size={20} />
                             </button>
                          </div>
                       </div>
                    </div>
                 ))}
             </div>
          </div>

          {/* Right Column - Checkout Form */}
          <div className="w-full lg:w-[450px] checkout-panel-anim">
             <div className="p-8 rounded-[var(--radius-3xl)] bg-white/5 border border-white/10 glass shadow-2xl sticky top-32">
                 <h2 className="font-bebas text-3xl tracking-wide mb-8 border-b border-white/10 pb-4">ORDER SUMMARY</h2>
                 
                 {/* Totals */}
                 <div className="space-y-4 mb-8 text-lg font-bebas text-gray-300 tracking-wide">
                    <div className="flex justify-between">
                       <span>SUBTOTAL</span>
                       <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                       <span>SHIPPING</span>
                       <span>${shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-2xl text-[var(--color-foreground)] border-t border-white/10 pt-4 mt-4">
                       <span>TOTAL</span>
                       <span>${total.toFixed(2)}</span>
                    </div>
                 </div>

                 {/* Payment Form Mock */}
                 <div className="space-y-4 mb-8">
                    <div>
                       <label className="block text-xs font-bold text-gray-400 tracking-wider mb-2 uppercase">Email</label>
                       <input 
                         type="email" 
                         placeholder="your@email.com" 
                         className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-gray-400 tracking-wider mb-2 uppercase">Card Details</label>
                       <div className="relative">
                          <input 
                            type="text" 
                            placeholder="0000 0000 0000 0000" 
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                          />
                          <CreditCard size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                       </div>
                    </div>
                 </div>

                 {/* Checkout Button */}
                 <button className="w-full py-4 bg-[var(--color-foreground)] text-[var(--background)] font-bebas text-2xl tracking-wider rounded-xl shadow-[0_8px_30px_rgb(255,255,255,0.1)] hover:bg-[var(--color-accent)] hover:text-black hover:scale-[1.02] transition-all cursor-pointer">
                    PAY NOW
                 </button>
                 
                 <div className="mt-6 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 opacity-70"></span>
                    Secure Encrypted Checkout
                 </div>
             </div>
          </div>

        </div>
      </div>
    </main>
  )
}
