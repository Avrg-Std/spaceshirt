'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ShoppingCart } from 'lucide-react'
import { addToCart } from '@/lib/cart'
import type { Product } from '@/lib/airtable'
import { PRODUCT_SIZE_OPTIONS } from '@/lib/product-sizes'

gsap.registerPlugin(ScrollTrigger)

type DisplayProduct = {
  id: string
  title: string
  image: string
  price: number
  sizes: string[]
  aspect: string
  col: string
  offset: string
  labelPos: string
  cartPos: string
}

const layoutByIndex = [
  {
    aspect: 'aspect-[4/3]',
    col: 'md:col-span-5',
    offset: '',
    labelPos: 'bottom-6 right-6',
    cartPos: 'top-6 left-6',
  },
  {
    aspect: 'aspect-[3/4]',
    col: 'md:col-span-4',
    offset: 'mt-12 md:mt-0',
    labelPos: 'bottom-6 left-6',
    cartPos: 'top-6 left-6',
  },
  {
    aspect: 'aspect-[3/4]',
    col: 'md:col-span-3',
    offset: 'mt-24 md:mt-0',
    labelPos: 'bottom-6 left-1/2 -translate-x-1/2',
    cartPos: 'top-6 right-6',
  },
] as const

const fallbackProducts: DisplayProduct[] = [
  {
    id: 'newest-belt-bag',
    title: 'BELT BAG',
    image: '/images/image 1.jpeg',
    price: 45,
    sizes: ['ONE SIZE'],
    ...layoutByIndex[0],
  },
  {
    id: 'newest-hoodie',
    title: 'HOODIE',
    image: '/images/image 2.jpeg',
    price: 95,
    sizes: ['S', 'M', 'L', 'XL'],
    ...layoutByIndex[1],
  },
  {
    id: 'newest-tote-bag',
    title: 'TOTE BAG',
    image: '/images/image 8.jpeg',
    price: 35,
    sizes: ['ONE SIZE'],
    ...layoutByIndex[2],
  },
]

function toDisplayProducts(products: Product[]): DisplayProduct[] {
  return products.slice(0, 3).map((product, index) => {
    const inStockSizes = PRODUCT_SIZE_OPTIONS.filter(
      (size) => (product.sizeStock?.[size] ?? 0) > 0
    )
    return {
      id: product.id,
      title: product.title,
      image: product.image,
      price: product.price,
      sizes: inStockSizes.length > 0 ? inStockSizes : product.sizes,
      ...layoutByIndex[index],
    }
  })
}

export default function NewestProducts() {
  const router = useRouter()
  const containerRef = useRef(null)
  const [products, setProducts] = useState<DisplayProduct[]>(fallbackProducts)

  useEffect(() => {
    async function loadNewestProducts() {
      try {
        const response = await fetch('/api/products/newest')
        if (!response.ok) return
        const data = (await response.json()) as { products: Product[] }
        if (!data.products.length) return
        setProducts(toDisplayProducts(data.products))
      } catch {
        // Keep fallback products when API is unavailable.
      }
    }

    loadNewestProducts()
  }, [])

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
  }, [products])

  const handleAddToCart = (
    e: React.MouseEvent<HTMLButtonElement>,
    product: DisplayProduct,
    imageEl: HTMLElement | null
  ) => {
    e.preventDefault()
    e.stopPropagation()

    if (product.sizes.length !== 1) {
      router.push(`/products/${product.id}`)
      return
    }

    addToCart({
      id: product.id,
      title: product.title,
      image: product.image,
      price: product.price,
      size: product.sizes[0],
    })

    const cartIcon = document.getElementById('nav-cart-icon')
    if (imageEl && cartIcon) {
      const imgRect = imageEl.getBoundingClientRect()
      const cartRect = cartIcon.getBoundingClientRect()
      const clone = imageEl.cloneNode(true) as HTMLElement

      clone.style.position = 'fixed'
      clone.style.top = `${imgRect.top}px`
      clone.style.left = `${imgRect.left}px`
      clone.style.width = `${imgRect.width}px`
      clone.style.height = `${imgRect.height}px`
      clone.style.zIndex = '9999'
      clone.style.pointerEvents = 'none'
      clone.style.margin = '0'
      clone.style.borderRadius = '1.5rem'
      clone.style.overflow = 'hidden'

      document.body.appendChild(clone)

      gsap.to(clone, {
        top: cartRect.top + cartRect.height / 2 - imgRect.height / 2,
        left: cartRect.left + cartRect.width / 2 - imgRect.width / 2,
        scale: 0.1,
        opacity: 0.3,
        duration: 0.8,
        ease: 'power3.in',
        onComplete: () => {
          clone.remove()
          window.dispatchEvent(new CustomEvent('cart-add-bounce'))
        },
      })
    } else {
      window.dispatchEvent(new CustomEvent('cart-add-bounce'))
    }
  }

  return (
    <section ref={containerRef} className="relative w-full py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <h2 className="text-4xl md:text-5xl font-bebas text-[var(--color-foreground)] mb-16 newest-card">
        OUR NEWEST <br /> PRODUCT
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {products.map((product) => (
          <div key={product.id} className={`${product.col} newest-card ${product.offset}`}>
            <div
              className={`relative w-full ${product.aspect} rounded-[var(--radius-3xl)] overflow-hidden bg-gray-200 group`}
              data-newest-image={product.id}
            >
              <Image
                src={product.image}
                alt={product.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />

              <button
                type="button"
                onClick={(e) => {
                  const card = (e.currentTarget.parentElement as HTMLElement) || null
                  handleAddToCart(e, product, card)
                }}
                className={`absolute ${product.cartPos} w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer z-10`}
                aria-label={`Add ${product.title} to cart`}
              >
                <ShoppingCart size={16} />
              </button>

              <div className={`absolute ${product.labelPos} bg-white px-6 py-3 rounded-full shadow-lg whitespace-nowrap`}>
                <span className="font-bebas text-lg tracking-wide uppercase">{product.title}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
