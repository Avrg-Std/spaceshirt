'use client'

import { useEffect, useState } from 'react'
import { AdminCard, AdminPageHeader } from '../components/AdminUI'

type WhishAdminState = {
  configured: boolean
  mock: boolean
  channelConfigured: boolean
  websiteUrl: string | null
  environment: 'sandbox' | 'production'
  envDefault: string
  baseUrl: string
  balance: number | null
  balanceError: string | null
  sandboxHints: {
    phone: string
    otp: string
  }
}

export default function AdminPaymentsPage() {
  const [state, setState] = useState<WhishAdminState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadSettings() {
    const response = await fetch('/api/admin/whish')
    const data = (await response.json()) as WhishAdminState & { error?: string }
    if (!response.ok) {
      throw new Error(data.error ?? 'Failed to load Whish settings')
    }
    setState(data)
  }

  useEffect(() => {
    async function load() {
      try {
        await loadSettings()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Whish settings')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  async function switchEnvironment(environment: 'sandbox' | 'production') {
    if (!state || state.environment === environment) return

    const label = environment === 'production' ? 'LIVE' : 'SANDBOX'
    const confirmed = window.confirm(
      environment === 'production'
        ? 'Switch Whish Pay to LIVE? Real payments will be collected on ciao-lu.com.'
        : 'Switch Whish Pay to SANDBOX? Checkout will use the Whish test environment.'
    )
    if (!confirmed) return

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin/whish', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment }),
      })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to update Whish environment')
      }
      await loadSettings()
      setMessage(`Whish Pay is now ${label}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update Whish environment')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-neutral-600">Loading payment settings...</p>

  return (
    <div>
      <AdminPageHeader
        title="PAYMENTS"
        description="Switch Whish Pay between Sandbox and Live. Credentials stay in environment variables."
      />

      {error ? (
        <p className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-6 text-sm text-green-800 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          {message}
        </p>
      ) : null}

      <AdminCard className="p-6 max-w-3xl space-y-6">
        <div>
          <p className="text-xs font-bold text-neutral-600 tracking-wider uppercase mb-2">
            Current mode
          </p>
          <p className="font-bebas text-4xl tracking-wide text-black">
            {state?.mock ? 'MOCK' : state?.environment === 'production' ? 'LIVE' : 'SANDBOX'}
          </p>
          <p className="text-sm text-neutral-500 mt-1 break-all">{state?.baseUrl}</p>
        </div>

        {state?.mock ? (
          <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            WHISH_ENVIRONMENT is mock. Checkout uses the local mock page until you set it to
            sandbox or production in env.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={saving || !state}
            onClick={() => switchEnvironment('sandbox')}
            className={`px-5 py-3 font-bebas text-xl tracking-wide rounded-xl transition-colors disabled:opacity-50 ${
              state?.environment === 'sandbox' && !state.mock
                ? 'bg-black text-white'
                : 'bg-neutral-100 text-black hover:bg-neutral-200'
            }`}
          >
            SANDBOX
          </button>
          <button
            type="button"
            disabled={saving || !state}
            onClick={() => switchEnvironment('production')}
            className={`px-5 py-3 font-bebas text-xl tracking-wide rounded-xl transition-colors disabled:opacity-50 ${
              state?.environment === 'production' && !state.mock
                ? 'bg-black text-white'
                : 'bg-neutral-100 text-black hover:bg-neutral-200'
            }`}
          >
            LIVE
          </button>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-neutral-500 uppercase tracking-wider text-xs">Credentials</dt>
            <dd className="font-semibold text-black mt-1">
              {state?.channelConfigured ? 'Channel + secret configured' : 'Missing channel/secret'}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500 uppercase tracking-wider text-xs">Website URL</dt>
            <dd className="font-semibold text-black mt-1">{state?.websiteUrl ?? 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-neutral-500 uppercase tracking-wider text-xs">USD balance</dt>
            <dd className="font-semibold text-black mt-1">
              {state?.balance !== null && state?.balance !== undefined
                ? `$${state.balance.toFixed(2)}`
                : state?.balanceError || 'Unavailable'}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500 uppercase tracking-wider text-xs">Env default</dt>
            <dd className="font-semibold text-black mt-1">{state?.envDefault}</dd>
          </div>
        </dl>

        <div className="rounded-xl bg-neutral-50 border border-black/10 px-4 py-4">
          <p className="text-xs font-bold text-neutral-600 tracking-wider uppercase mb-2">
            Sandbox test values
          </p>
          <p className="text-sm text-neutral-700">
            Phone <span className="font-mono font-semibold">{state?.sandboxHints.phone}</span>
            {' · '}
            OTP <span className="font-mono font-semibold">{state?.sandboxHints.otp}</span>
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            A wrong OTP fails the attempt but leaves the order awaiting payment. The link stays
            payable until it succeeds or expires.
          </p>
        </div>
      </AdminCard>
    </div>
  )
}
