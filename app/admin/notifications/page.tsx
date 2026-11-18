'use client'

import { FormEvent, useEffect, useState } from 'react'
import { AdminCard, AdminInput, AdminPageHeader } from '../components/AdminUI'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AdminNotificationsPage() {
  const [emails, setEmails] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadEmails() {
    const response = await fetch('/api/admin/notifications')
    const data = (await response.json()) as { emails?: string[]; error?: string }
    if (!response.ok) {
      throw new Error(data.error ?? 'Failed to load notification recipients')
    }
    setEmails(data.emails ?? [])
  }

  useEffect(() => {
    async function load() {
      try {
        await loadEmails()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recipients')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  async function persist(next: string[]) {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: next }),
      })
      const data = (await response.json()) as { emails?: string[]; error?: string }
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to save recipients')
      }
      setEmails(data.emails ?? next)
      setMessage('Recipients saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipients')
      await loadEmails().catch(() => undefined)
    } finally {
      setSaving(false)
    }
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    const email = draft.trim().toLowerCase()
    if (!email) return
    if (!EMAIL_PATTERN.test(email)) {
      setError('Enter a valid email address.')
      return
    }
    if (emails.includes(email)) {
      setError('That email is already on the list.')
      return
    }

    setDraft('')
    await persist([...emails, email])
  }

  async function handleRemove(email: string) {
    if (!confirm(`Remove ${email} from order notifications?`)) return
    await persist(emails.filter((entry) => entry !== email))
  }

  return (
    <div>
      <AdminPageHeader
        title="NOTIFICATIONS"
        description="Emails that receive a Resend alert whenever a customer places an order."
      />

      {error ? (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          {message}
        </p>
      ) : null}

      <AdminCard className="p-6 mb-8 max-w-3xl">
        <h2 className="font-bebas text-2xl tracking-wide mb-4">ADD RECIPIENT</h2>
        <form
          onSubmit={handleAdd}
          className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end"
        >
          <AdminInput
            label="Email"
            type="email"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="orders@example.com"
            required
          />
          <button
            type="submit"
            disabled={saving || !draft.trim()}
            className="px-6 py-3 bg-black text-white font-bebas text-xl tracking-wider rounded-xl hover:bg-[var(--color-accent)] hover:text-black transition-colors disabled:opacity-50"
          >
            {saving ? 'SAVING...' : 'ADD'}
          </button>
        </form>
      </AdminCard>

      {loading ? <p className="text-neutral-600">Loading recipients...</p> : null}

      {!loading ? (
        <AdminCard className="overflow-hidden max-w-3xl">
          <div className="px-6 py-4 border-b border-black/10 bg-neutral-50">
            <h2 className="font-bebas text-2xl tracking-wide">
              RECIPIENTS ({emails.length})
            </h2>
          </div>
          {emails.length === 0 ? (
            <p className="px-6 py-8 text-neutral-500">
              No recipients yet. Add an email to start receiving new-order alerts.
            </p>
          ) : (
            <ul className="divide-y divide-black/5">
              {emails.map((email) => (
                <li
                  key={email}
                  className="px-6 py-4 flex items-center justify-between gap-4"
                >
                  <span className="font-medium break-all">{email}</span>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleRemove(email)}
                    className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      ) : null}
    </div>
  )
}
