'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import gsap from 'gsap'
import { ShoppingCart, Star, StarHalf } from 'lucide-react'
import Navbar from '../../components/Navbar'
import { addToCart } from '@/lib/cart'
import { PRODUCT_SIZE_OPTIONS } from '@/lib/product-sizes'

type Product = {
  id: string
  title: string
  price: number
  description: string
  image: string
  sizes: string[]
  sizeStock?: Record<string, number>
  rating: number | null
  stock: number | null
}

export default function ProductDetailsPage() {
  const params = useParams()
  const productId = params?.id as string
  
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const [selectedSize, setSelectedSize] = useState('M')
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadProduct = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`/api/products/${productId}`, { cache: 'no-store' })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load product')
        }

        if (isMounted) {
          setProduct(data.product)
          const stockMap = data.product?.sizeStock as Record<string, number> | undefined
          const available =
            stockMap && Object.keys(stockMap).length > 0
              ? Object.entries(stockMap)
                  .filter(([, qty]) => qty > 0)
                  .map(([size]) => size)
              : data.product?.sizes || []
          setSelectedSize(available[0] || data.product?.sizes?.[0] || 'M')
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load product')
          setProduct(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (productId) {
      loadProduct()
    }

    return () => {
      isMounted = false
    }
  }, [productId])

  useEffect(() => {
    if (!product) return
    const ctx = gsap.context(() => {
      // Image Entrance
      gsap.from('.pdp-image', {
        scale: 0.9,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out'
      })
      
      // Text Reveal
      gsap.from('.pdp-text-chunk', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out',
        delay: 0.3
      })
    }, containerRef)
    return () => ctx.revert()
  }, [product])

  const handleAddToCart = (e: React.MouseEvent) => {
    if (!product || isOutOfStock) return
    e.preventDefault()
    addToCart({
      id: product.id,
      title: product.title,
      image: product.image,
      price: product.price,
      size: selectedSize,
    })

    // 1. Target the button for a quick glow/pop
    const btn = e.currentTarget
    gsap.fromTo(btn, 
      { scale: 1, boxShadow: '0 0 0px 0px rgba(255,255,255,0)' },
      { scale: 0.95, boxShadow: '0 0 30px 5px rgba(255,255,255,0.3)', duration: 0.1, yoyo: true, repeat: 1 }
    )

    // 2. Dopamine Fly To Cart Animation
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
        scale: 0.05,
        opacity: 0.2,
        duration: 0.8,
        ease: 'power3.in',
        onComplete: () => {
          clone.remove()
          window.dispatchEvent(new CustomEvent('cart-add-bounce'))
        }
      })
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--color-bg)] pt-32 pb-24">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-gray-400">Loading product...</div>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-[var(--color-bg)] pt-32 pb-24">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <p className="text-red-300 border border-red-500/30 bg-red-500/10 rounded-2xl px-6 py-5 mb-4">
            {error || 'Product not found'}
          </p>
          <Link href="/products" className="text-gray-300 underline">
            Back to Products
          </Link>
        </div>
      </main>
    )
  }

  const fullStars = Math.max(0, Math.min(5, Math.floor(product.rating ?? 4)))
  const hasHalfStar = (product.rating ?? 4.5) % 1 >= 0.5
  const sizeStock = product.sizeStock ?? {}
  const hasSizeStock = Object.keys(sizeStock).length > 0
  const displaySizes = hasSizeStock
    ? PRODUCT_SIZE_OPTIONS.filter((size) => size in sizeStock)
    : product.sizes
  const selectedQty = hasSizeStock ? sizeStock[selectedSize] ?? 0 : null
  const isSizeUnavailable = hasSizeStock && selectedQty !== null && selectedQty <= 0
  const isOutOfStock =
    product.stock === 0 ||
    (hasSizeStock && Object.values(sizeStock).every((qty) => qty <= 0)) ||
    isSizeUnavailable

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pt-32 pb-24 overflow-x-hidden" ref={containerRef}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Breadcrumb */}
        <div className="mb-8 pdp-text-chunk">
           <Link href="/products" className="text-gray-400 hover:text-[var(--color-foreground)] transition-colors text-sm uppercase tracking-wider inline-flex items-center gap-2">
              <span>←</span> Back to Products
           </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          
          {/* Left Column - Image Showcase */}
          <div className="pdp-image relative w-full aspect-[3/4] lg:aspect-[4/5] rounded-[var(--radius-3xl)] overflow-hidden bg-white/5 border border-white/10 glass shadow-2xl flex items-center justify-center p-8">
             <div ref={imageRef} className="relative w-full h-full">
                <Image 
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
             </div>
          </div>

          {/* Right Column - Details & Actions */}
          <div className="flex flex-col pt-4 lg:pt-12">
             
             {/* Header */}
             <div className="mb-8 pdp-text-chunk border-b border-white/10 pb-8">
                <div className="flex items-center gap-2 mb-4 text-[var(--color-accent)]">
                   {Array.from({ length: fullStars }).map((_, idx) => (
                     <Star key={idx} size={18} fill="currentColor" />
                   ))}
                   {hasHalfStar && <StarHalf size={18} fill="currentColor" />}
                   <span className="text-gray-400 text-sm ml-2 font-inter tracking-widest">
                     {product.rating ? `(${product.rating.toFixed(1)} RATING)` : '(NO RATING)'}
                   </span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bebas tracking-wider text-[var(--color-foreground)] mb-4">{product.title}</h1>
                <p className="text-3xl font-bebas text-[var(--color-foreground)]">${product.price.toFixed(2)}</p>
             </div>

             {/* Description */}
             <div className="mb-10 pdp-text-chunk">
                <p className="text-gray-300 leading-relaxed font-inter font-light tracking-wide text-lg">
                   {product.description}
                </p>
             </div>

             {/* Size Selector */}
             <div className="mb-12 pdp-text-chunk">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bebas text-xl tracking-wider uppercase text-gray-400">Select Size</h3>
                   <span className="text-sm text-gray-400 underline cursor-pointer hover:text-white transition-colors">Size Guide</span>
                </div>
                <div className="flex flex-wrap gap-4">
                   {displaySizes.map(size => {
                      const qty = hasSizeStock ? sizeStock[size] ?? 0 : null
                      const soldOut = qty !== null && qty <= 0
                      return (
                      <button 
                        key={size}
                        type="button"
                        disabled={soldOut}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-14 h-14 px-3 rounded-full font-bebas text-xl flex flex-col items-center justify-center border transition-all ${
                          soldOut
                            ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed opacity-60'
                            : selectedSize === size 
                            ? 'bg-[var(--color-foreground)] text-[var(--background)] border-[var(--color-foreground)] scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                            : 'bg-white/70 text-black border-black/20 hover:bg-white hover:border-black/50'
                        }`}
                      >
                         <span>{size}</span>
                         {soldOut ? <span className="text-[10px] font-inter tracking-wide">OUT</span> : null}
                      </button>
                      )
                   })}
                </div>
                {!isOutOfStock && selectedQty !== null ? (
                  <p className="mt-3 text-sm text-gray-400 font-inter tracking-wide">
                    {selectedQty} left in {selectedSize}
                  </p>
                ) : null}
             </div>

             {/* Dopamine CTA */}
             <div className="pdp-text-chunk mb-12">
                <button 
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className={`w-full py-5 font-bebas text-3xl tracking-widest rounded-2xl shadow-[0_8px_30px_rgb(255,255,255,0.1)] transition-all flex items-center justify-center gap-4 ${
                    isOutOfStock
                      ? 'bg-gray-500 text-gray-200 cursor-not-allowed'
                      : 'bg-[var(--color-foreground)] text-[var(--background)] hover:bg-[var(--color-accent)] hover:text-black hover:-translate-y-1 cursor-pointer'
                  }`}
                >
                   <ShoppingCart size={24} />
                   {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
                </button>
                <div className="mt-4 text-center text-sm font-inter text-gray-400 tracking-wide">
                   {isOutOfStock
                     ? 'This product is currently out of stock'
                     : product.stock !== null
                       ? `${product.stock} item(s) currently in stock`
                       : 'Stock updates coming soon'}
                </div>
             </div>

             {/* Accordion Details Mock */}
             <div className="pdp-text-chunk space-y-4 border-t border-white/10 pt-8">
                <div className="flex justify-between items-center py-4 border-b border-white/10 cursor-pointer group">
                   <span className="font-bebas text-xl tracking-wider text-gray-300 group-hover:text-white transition-colors">MATERIALS & CARE</span>
                   <span className="text-xl group-hover:text-white transition-colors">+</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-white/10 cursor-pointer group">
                   <span className="font-bebas text-xl tracking-wider text-gray-300 group-hover:text-white transition-colors">SHIPPING & RETURNS</span>
                   <span className="text-xl group-hover:text-white transition-colors">+</span>
                </div>
             </div>

          </div>
        </div>
      </div>
    </main>
  )
}
