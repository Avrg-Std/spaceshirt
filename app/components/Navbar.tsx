'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import gsap from 'gsap'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '../hooks/useCart'

export default function Navbar() {
  const cartIconRef = useRef(null)
  const { itemCount } = useCart()

  useEffect(() => {
    const handleCartBounce = () => {
      if (cartIconRef.current) {
        // Dopamine bounce
        gsap.fromTo(cartIconRef.current, 
          { scale: 1, rotate: 0 }, 
          { scale: 1.3, rotate: -10, duration: 0.15, yoyo: true, repeat: 1, ease: 'back.out(2)' }
        )
      }
    }
    
    window.addEventListener('cart-add-bounce', handleCartBounce)
    return () => window.removeEventListener('cart-add-bounce', handleCartBounce)
  }, [])

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 md:px-12 flex justify-between items-center bg-transparent pointer-events-none">
      <div className="flex gap-8 pointer-events-auto">
        {['MAN', 'WOMAN', 'CREATE OUTFIT'].map((item) => (
          <Link
            key={item}
            href="#"
            className="text-xs font-medium tracking-wide text-foreground hover:text-gray-500 transition-colors uppercase"
          >
            {item}
          </Link>
        ))}
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
        <Link href="/">
          <Image
            src="/images/logo.png"
            alt="Space Shirt"
            width={240}
            height={70}
            className="h-14 w-auto object-contain"
          />
        </Link>
      </div>

      <div className="pointer-events-auto">
        <Link href="/cart">
          <button id="nav-cart-icon" ref={cartIconRef} className="relative w-10 h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center hover:scale-105 transition-transform origin-center cursor-pointer">
            <ShoppingCart size={18} className="text-black" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-black text-white text-[10px] leading-5 text-center font-bold">
                {itemCount}
              </span>
            )}
          </button>
        </Link>
      </div>
    </nav>
  )
}
