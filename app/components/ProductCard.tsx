'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'
import { ShoppingCart } from 'lucide-react'
import { addToCart } from '@/lib/cart'
import { PRODUCT_SIZE_OPTIONS } from '@/lib/product-sizes'

interface ProductCardProps {
  id?: number | string
  image: string
  title: string
  price: string
  stock?: number | null
  sizes?: string[]
  sizeStock?: Record<string, number>
  className?: string
  priority?: boolean
}

function availableSizes(
  sizes: string[] | undefined,
  sizeStock: Record<string, number> | undefined
): string[] {
  if (sizeStock && Object.keys(sizeStock).length > 0) {
    return PRODUCT_SIZE_OPTIONS.filter((size) => (sizeStock[size] ?? 0) > 0)
  }
  return sizes ?? []
}

export default function ProductCard({
  id,
  image,
  title,
  price,
  stock,
  sizes,
  sizeStock,
  className = '',
  priority = false,
}: ProductCardProps) {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const inStockSizes = availableSizes(sizes, sizeStock)
  const isOutOfStock = stock === 0 || inStockSizes.length === 0
  const productHref = `/products/${id || 1}`

  const handleAddToCart = (e: React.MouseEvent) => {
    if (isOutOfStock) return
    e.preventDefault()
    e.stopPropagation()

    if (inStockSizes.length !== 1) {
      router.push(productHref)
      return
    }

    const parsedPrice = Number(price.replace(/[^0-9.-]/g, '')) || 0
    addToCart({
      id: String(id || 1),
      title,
      image,
      price: parsedPrice,
      size: inStockSizes[0],
    })

    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { boxShadow: '0 0 0px 0px rgba(255, 255, 255, 0)' },
        {
          boxShadow: '0 0 20px 4px rgba(255, 255, 255, 0.4)',
          duration: 0.3,
          yoyo: true,
          repeat: 1,
          ease: 'power2.out',
        }
      )
    }

    const cartIcon = document.getElementById('nav-cart-icon')
    if (imageRef.current && cartIcon) {
      const imgRect = imageRef.current.getBoundingClientRect()
      const cartRect = cartIcon.getBoundingClientRect()

      const clone = imageRef.current.cloneNode(true) as HTMLElement

      clone.style.position = 'fixed'
      clone.style.top = `${imgRect.top}px`
      clone.style.left = `${imgRect.left}px`
      clone.style.width = `${imgRect.width}px`
      clone.style.height = `${imgRect.height}px`
      clone.style.zIndex = '9999'
      clone.style.pointerEvents = 'none'
      clone.style.margin = '0'
      clone.style.transition = 'none'

      document.body.appendChild(clone)

      const targetX = cartRect.left + cartRect.width / 2 - imgRect.width / 2
      const targetY = cartRect.top + cartRect.height / 2 - imgRect.height / 2

      gsap.to(clone, {
        top: targetY,
        left: targetX,
        scale: 0.1,
        opacity: 0.3,
        duration: 0.8,
        ease: 'power3.in',
        onComplete: () => {
          clone.remove()
          window.dispatchEvent(new CustomEvent('cart-add-bounce'))
        },
      })
    }
  }

  const actionLabel = isOutOfStock
    ? 'OUT OF STOCK'
    : inStockSizes.length === 1
      ? 'QUICK ADD'
      : 'SELECT SIZE'

  return (
    <div ref={cardRef} className={`relative group flex flex-col ${className} rounded-[var(--radius-2xl)] transition-shadow`}>
      <Link
        href={productHref}
        className="relative w-full aspect-[3/4] rounded-[var(--radius-2xl)] overflow-hidden bg-white/5 dark:bg-white/5 border border-white/10 glass transition-transform duration-500 hover:scale-[1.02] shadow-[var(--shadow-card)] flex items-center justify-center p-6 mb-4 cursor-pointer block"
      >
        <div ref={imageRef} className="relative w-full h-full">
          <Image
            src={image}
            alt={title}
            fill
            className="object-contain drop-shadow-2xl"
            priority={priority}
          />
        </div>
        {isOutOfStock && (
          <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full z-20">
            Out of Stock
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10 hidden lg:block">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-4 font-bebas text-xl tracking-wider rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all flex items-center justify-center gap-3 ${
              isOutOfStock
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-white text-black hover:bg-[var(--color-accent)] hover:text-black hover:-translate-y-1 cursor-pointer'
            }`}
          >
            <ShoppingCart size={20} />
            {actionLabel}
          </button>
        </div>
      </Link>

      <div className="flex flex-col flex-grow px-2">
        <div className="flex justify-between items-start mb-3">
          <Link href={productHref} className="hover:text-[var(--color-accent)] transition-colors">
            <h3 className="font-bebas text-2xl text-[var(--color-foreground)] tracking-wide hover:text-inherit">
              {title}
            </h3>
          </Link>
          <p className="font-bebas text-2xl text-[var(--color-foreground)]">{price}</p>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`mt-2 lg:hidden w-full py-3.5 font-bebas text-lg tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 ${
            isOutOfStock
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-white text-black active:scale-95 cursor-pointer'
          }`}
        >
          <ShoppingCart size={18} />
          {isOutOfStock ? 'Out of Stock' : inStockSizes.length === 1 ? 'Add To Cart' : 'Select Size'}
        </button>
      </div>
    </div>
  )
}
