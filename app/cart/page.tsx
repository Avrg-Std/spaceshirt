'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import Navbar from '../components/Navbar'
import { Trash2, Plus, Minus, MapPin, Loader2, Check, Banknote, Smartphone } from 'lucide-react'
import { useCart } from '../hooks/useCart'

type PaymentMethod = 'cod' | 'omt' | 'whish'

const PAYMENT_METHODS: {
  id: PaymentMethod
  label: string
  description: string
  icon: typeof Banknote
}[] = [
  {
    id: 'cod',
    label: 'Cash on Delivery',
    description: 'Pay with cash when your order arrives',
    icon: Banknote,
  },
  {
    id: 'omt',
    label: 'OMT',
    description: 'Pay via OMT money transfer',
    icon: Smartphone,
  },
  {
    id: 'whish',
    label: 'Whish',
    description: 'Pay instantly with Whish Money',
    icon: Smartphone,
  },
]

export default function CartPage() {
  const containerRef = useRef(null)
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart()
  const shipping = 15.0
  const total = items.length > 0 ? subtotal + shipping : 0

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [locationError, setLocationError] = useState('')
  const [showPaymentMethods, setShowPaymentMethods] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const detectLocation = useCallback(async () => {
    setLocationStatus('loading')
    setLocationError('')

    const applyCoords = async (lat: number, lon: number) => {
      try {
        const response = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`)
        if (!response.ok) throw new Error('Reverse geocode failed')
        const data = await response.json()
        setLocation(data.location || `${lat.toFixed(4)}, ${lon.toFixed(4)}`)
        setLocationStatus('ready')
      } catch {
        setLocation(`${lat.toFixed(4)}, ${lon.toFixed(4)}`)
        setLocationStatus('ready')
      }
    }

    const fallbackIpLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/')
        if (!response.ok) throw new Error('IP lookup failed')
        const data = await response.json()
        const parts = [data.city, data.region, data.country_name].filter(Boolean)
        if (parts.length === 0) throw new Error('No location data')
        setLocation(parts.join(', '))
        setLocationStatus('ready')
      } catch {
        setLocationStatus('error')
        setLocationError('Could not detect your location. Please allow location access.')
      }
    }

    if (!navigator.geolocation) {
      await fallbackIpLocation()
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await applyCoords(position.coords.latitude, position.coords.longitude)
      },
      async () => {
        await fallbackIpLocation()
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  useEffect(() => {
    detectLocation()
  }, [detectLocation])

  useEffect(() => {
    const ctx = gsap.context(() => {
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
        delay: 0.2,
      })

      gsap.from('.checkout-panel-anim', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.4,
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!showPaymentMethods) return
    gsap.fromTo(
      '.payment-method-anim',
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, stagger: 0.08, ease: 'power2.out' }
    )
  }, [showPaymentMethods])

  const handlePayNow = () => {
    setFormError('')
    if (items.length === 0) return

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Please enter a valid email.')
      return
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setFormError('Please enter a valid phone number.')
      return
    }
    if (!location.trim() || locationStatus !== 'ready') {
      setFormError('Waiting for location detection. Tap refresh if needed.')
      return
    }

    setShowPaymentMethods(true)
  }

  const handleConfirmPayment = async () => {
    if (!selectedPayment) {
      setFormError('Select a payment method to continue.')
      return
    }

    const paymentMethod = PAYMENT_METHODS.find((method) => method.id === selectedPayment)
    if (!paymentMethod) {
      setFormError('Select a payment method to continue.')
      return
    }

    setFormError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
          location: location.trim(),
          paymentMethod: paymentMethod.label,
          subtotal,
          shipping,
          total,
          items: items.map((item) => ({
            id: item.id,
            title: item.title,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order')
      }

      setPlacedOrderId(data.order?.orderId ?? null)
      setOrderPlaced(true)
      clearCart()
      setShowPaymentMethods(false)
      setSelectedPayment(null)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to place order')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] pt-32 pb-24" ref={containerRef}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-12 cart-header">
          <Link
            href="/products"
            className="text-gray-400 hover:text-[var(--color-foreground)] transition-colors text-sm uppercase tracking-wider mb-6 inline-flex items-center gap-2"
          >
            <span>←</span> Continue Shopping
          </Link>
          <h1 className="text-5xl md:text-6xl font-bebas tracking-wider text-[var(--color-foreground)]">
            YOUR CART
          </h1>
        </div>

        {orderPlaced && (
          <div className="mb-8 rounded-2xl border border-green-700/40 bg-green-100 px-6 py-4 text-green-900 font-medium">
            <p>Order placed successfully. We&apos;ll contact you shortly to confirm delivery.</p>
            {placedOrderId && (
              <p className="mt-2 text-sm font-semibold tracking-wide">
                Order ID: <span className="font-mono">{placedOrderId}</span>
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* Left Column - Cart Items */}
          <div className="flex-1">
            <div className="space-y-6">
              {items.length === 0 ? (
                <div className="cart-item-anim p-8 rounded-3xl bg-white border border-black/10 shadow-lg text-center">
                  <p className="text-neutral-700 mb-4">Your cart is empty.</p>
                  <Link href="/products" className="underline text-black font-medium hover:text-neutral-600">
                    Browse Products
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="cart-item-anim flex gap-6 p-4 rounded-3xl bg-white border border-black/10 shadow-lg"
                  >
                    <div className="relative w-28 h-36 md:w-36 md:h-48 rounded-2xl overflow-hidden bg-neutral-100 flex-shrink-0">
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    </div>

                    <div className="flex flex-col justify-between flex-grow py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bebas text-2xl tracking-wide text-black">{item.title}</h3>
                          <p className="text-sm text-neutral-600 mt-1">Size: {item.size}</p>
                        </div>
                        <p className="font-bebas text-2xl text-black">${item.price.toFixed(2)}</p>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-4 bg-neutral-100 rounded-full px-4 py-2 border border-black/10">
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                            className="text-neutral-600 hover:text-black transition-colors cursor-pointer"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-bebas text-lg w-4 text-center text-black">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                            className="text-neutral-600 hover:text-black transition-colors cursor-pointer"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id, item.size)}
                          className="text-neutral-500 hover:text-red-600 transition-colors p-2 cursor-pointer"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Checkout Form */}
          <div className="w-full lg:w-[450px] checkout-panel-anim">
            <div className="p-8 rounded-[var(--radius-3xl)] bg-white border border-black/10 shadow-2xl sticky top-32">
              <h2 className="font-bebas text-3xl tracking-wide mb-8 border-b border-black/10 pb-4 text-black">
                ORDER SUMMARY
              </h2>

              <div className="space-y-4 mb-8 text-lg font-bebas text-neutral-700 tracking-wide">
                <div className="flex justify-between">
                  <span>SUBTOTAL</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SHIPPING</span>
                  <span>${items.length > 0 ? shipping.toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between text-2xl text-black border-t border-black/10 pt-4 mt-4">
                  <span>TOTAL</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-neutral-600 tracking-wider mb-2 uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-neutral-100 border border-black/10 rounded-xl px-4 py-3 text-black placeholder:text-neutral-400 focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 tracking-wider mb-2 uppercase">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+961 XX XXX XXX"
                    className="w-full bg-neutral-100 border border-black/10 rounded-xl px-4 py-3 text-black placeholder:text-neutral-400 focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-600 tracking-wider mb-2 uppercase">
                    Location
                  </label>
                  <div className="relative">
                    <div className="w-full min-h-[52px] bg-neutral-100 border border-black/10 rounded-xl pl-12 pr-20 py-3 text-black flex items-center">
                      {locationStatus === 'loading' && (
                        <span className="text-neutral-600 text-sm flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin" />
                          Detecting your location...
                        </span>
                      )}
                      {locationStatus === 'ready' && (
                        <span className="text-sm leading-snug text-black">{location}</span>
                      )}
                      {locationStatus === 'error' && (
                        <span className="text-red-700 text-sm">{locationError}</span>
                      )}
                      {locationStatus === 'idle' && (
                        <span className="text-neutral-500 text-sm">Location will appear here</span>
                      )}
                    </div>
                    <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={locationStatus === 'loading'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs uppercase tracking-wider text-neutral-700 hover:text-black font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Refresh
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-neutral-600">
                    Detected automatically from your device — no typing needed.
                  </p>
                </div>
              </div>

              {formError && (
                <p className="mb-4 text-sm text-red-700 font-medium">{formError}</p>
              )}

              {!showPaymentMethods ? (
                <button
                  type="button"
                  disabled={items.length === 0}
                  onClick={handlePayNow}
                  className={`w-full py-4 font-bebas text-2xl tracking-wider rounded-xl shadow-md transition-all ${
                    items.length === 0
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-[var(--color-accent)] hover:text-black hover:scale-[1.02] cursor-pointer'
                  }`}
                >
                  PAY NOW
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-neutral-700 tracking-wider uppercase mb-1">
                    Choose Payment Method
                  </p>
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon
                    const isSelected = selectedPayment === method.id
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedPayment(method.id)}
                        className={`payment-method-anim w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'border-black bg-[var(--color-accent)]/25 shadow-sm'
                            : 'border-black/15 bg-neutral-50 hover:border-black/40 hover:bg-neutral-100'
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'border-black bg-[var(--color-accent)]' : 'border-neutral-400'
                          }`}
                        >
                          {isSelected && <Check size={12} className="text-black" strokeWidth={3} />}
                        </span>
                        <Icon size={20} className="mt-0.5 text-neutral-800 flex-shrink-0" />
                        <span>
                          <span className="block font-bebas text-lg tracking-wide text-black">
                            {method.label}
                          </span>
                          <span className="block text-xs text-neutral-600 mt-0.5">{method.description}</span>
                        </span>
                      </button>
                    )
                  })}

                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={isSubmitting}
                    className="w-full py-4 mt-2 font-bebas text-2xl tracking-wider rounded-xl bg-black text-white hover:bg-[var(--color-accent)] hover:text-black hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSubmitting ? 'PLACING ORDER...' : 'CONFIRM ORDER'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentMethods(false)
                      setSelectedPayment(null)
                      setFormError('')
                    }}
                    className="w-full py-2 text-xs uppercase tracking-wider text-neutral-600 hover:text-black font-semibold transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              )}

              <div className="mt-6 text-center text-xs text-neutral-600 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-600"></span>
                Secure Encrypted Checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
