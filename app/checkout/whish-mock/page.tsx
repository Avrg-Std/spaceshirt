'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Check, Loader2, Smartphone } from 'lucide-react'

function WhishMockCheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPaying, setIsPaying] = useState(false)

  const orderId = searchParams.get('orderId') || ''
  const externalId = searchParams.get('externalId') || ''
  const amount = searchParams.get('amount') || '0.00'
  const successUrl = searchParams.get('successUrl') || '/cart?whish=success'
  const failureUrl = searchParams.get('failureUrl') || '/cart?whish=failed'

  const displayAmount = useMemo(() => {
    const parsed = Number(amount)
    return Number.isFinite(parsed) ? parsed.toFixed(2) : amount
  }, [amount])

  const completePayment = async (outcome: 'success' | 'failed') => {
    setIsPaying(true)
    try {
      if (outcome === 'success' && externalId) {
        await fetch(
          `/api/whish/callback/success?externalId=${encodeURIComponent(externalId)}&currency=USD`,
          { method: 'GET' }
        )
      }
      if (outcome === 'failed' && externalId) {
        await fetch(
          `/api/whish/callback/failure?externalId=${encodeURIComponent(externalId)}&currency=USD`,
          { method: 'GET' }
        )
      }
    } finally {
      router.push(outcome === 'success' ? successUrl : failureUrl)
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F4F4] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-3xl bg-white border border-black/10 shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
            <Smartphone size={22} className="text-black" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500 font-bold">Whish Pay</p>
            <h1 className="font-bebas text-3xl tracking-wide text-black">Mock Checkout</h1>
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 mb-6 text-sm text-amber-950">
          Using mock Whish credentials. Replace with real channel/secret later and set
          <span className="font-semibold"> WHISH_ENVIRONMENT=sandbox</span> or
          <span className="font-semibold"> production</span>.
        </div>

        <div className="space-y-3 mb-8 text-sm">
          <div className="flex justify-between border-b border-black/5 pb-2">
            <span className="text-neutral-600">Order ID</span>
            <span className="font-mono font-semibold text-black">{orderId || '—'}</span>
          </div>
          <div className="flex justify-between border-b border-black/5 pb-2">
            <span className="text-neutral-600">Amount</span>
            <span className="font-bebas text-2xl text-black">${displayAmount}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            disabled={isPaying}
            onClick={() => completePayment('success')}
            className="w-full py-4 font-bebas text-xl tracking-wider rounded-xl bg-black text-white hover:bg-[var(--color-accent)] hover:text-black transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPaying ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            Simulate Successful Payment
          </button>
          <button
            type="button"
            disabled={isPaying}
            onClick={() => completePayment('failed')}
            className="w-full py-3 text-xs uppercase tracking-wider font-semibold text-neutral-600 hover:text-black transition-colors cursor-pointer disabled:opacity-60"
          >
            Simulate Failed Payment
          </button>
        </div>
      </div>
    </main>
  )
}

export default function WhishMockCheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
          <Loader2 className="animate-spin text-neutral-500" />
        </main>
      }
    >
      <WhishMockCheckoutContent />
    </Suspense>
  )
}
